using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEngine;

namespace LuminaryLabs.UniMap
{
    public static class UniMapHost
    {
        private const int MaxHeaderLines = 64;
        private const int MaxHeaderCharacters = 16 * 1024;
        private const int MaxRequestLineCharacters = 4096;
        private static readonly object Sync = new object();

        private static TcpListener _listener;
        private static Thread _thread;
        private static volatile bool _stopRequested;
        private static string _sessionToken = string.Empty;
        private static int _port;
        private static UniMapRouter _router;
        private static string _lastError = string.Empty;

        public static bool IsRunning
        {
            get
            {
                lock (Sync)
                {
                    return _listener != null && !_stopRequested;
                }
            }
        }

        public static int Port => _port;
        public static string SessionToken => _sessionToken;
        public static string BaseUrl => _port > 0 ? UniMapProtocol.BuildBaseUrl(_port) : string.Empty;
        public static string LastError => _lastError;

        public static void Start()
        {
            lock (Sync)
            {
                if (_listener != null && !_stopRequested)
                {
                    return;
                }

                UniMapSnapshotService.GetCurrentOrRefresh();
                _sessionToken = UniMapAuthentication.CreateSessionToken();
                _lastError = string.Empty;
                _router = new UniMapRouter(GetSnapshotForRequest, () => _sessionToken);

                Exception lastException = null;
                for (int candidate = UniMapProtocol.DefaultPort; candidate <= UniMapProtocol.LastFallbackPort; candidate++)
                {
                    TcpListener listener = null;
                    try
                    {
                        listener = new TcpListener(IPAddress.Loopback, candidate);
                        listener.Start(16);
                        _listener = listener;
                        _port = candidate;
                        _stopRequested = false;
                        break;
                    }
                    catch (SocketException exception)
                    {
                        lastException = exception;
                        try
                        {
                            listener?.Stop();
                        }
                        catch
                        {
                            // Ignore cleanup errors while probing fallback ports.
                        }
                    }
                }

                if (_listener == null)
                {
                    _port = 0;
                    _sessionToken = string.Empty;
                    _router = null;
                    throw new InvalidOperationException(
                        $"UniMap could not bind a loopback port in the range {UniMapProtocol.DefaultPort}-{UniMapProtocol.LastFallbackPort}.",
                        lastException);
                }

                _thread = new Thread(AcceptLoop)
                {
                    IsBackground = true,
                    Name = "UniMap Local Host"
                };
                _thread.Start();
            }
        }

        public static void Stop()
        {
            Thread threadToJoin;
            lock (Sync)
            {
                _stopRequested = true;
                try
                {
                    _listener?.Stop();
                }
                catch
                {
                    // The listener may already be disposed during editor shutdown.
                }

                threadToJoin = _thread;
                _listener = null;
                _thread = null;
                _router = null;
                _port = 0;
                _sessionToken = string.Empty;
            }

            if (threadToJoin != null && threadToJoin.IsAlive && Thread.CurrentThread != threadToJoin)
            {
                threadToJoin.Join(500);
            }
        }

        public static void Restart()
        {
            Stop();
            Start();
        }

        public static string GetConnectionInfoJson()
        {
            if (!IsRunning)
            {
                throw new InvalidOperationException("UniMap host is not running.");
            }

            return JsonUtility.ToJson(new UniMapConnectionInfo
            {
                baseUrl = BaseUrl,
                token = SessionToken
            });
        }

        private static UniMapSnapshot GetSnapshotForRequest()
        {
            return UniMapSnapshotService.TryGetCurrent(out UniMapSnapshot snapshot) ? snapshot : null;
        }

        private static void AcceptLoop()
        {
            while (!_stopRequested)
            {
                TcpClient client = null;
                try
                {
                    TcpListener listener = _listener;
                    if (listener == null)
                    {
                        return;
                    }

                    client = listener.AcceptTcpClient();
                    HandleClient(client);
                }
                catch (SocketException)
                {
                    if (!_stopRequested)
                    {
                        Thread.Sleep(25);
                    }
                }
                catch (ObjectDisposedException)
                {
                    return;
                }
                catch (Exception exception)
                {
                    if (!_stopRequested)
                    {
                        _lastError = exception.Message;
                    }
                }
                finally
                {
                    try
                    {
                        client?.Dispose();
                    }
                    catch
                    {
                        // Ignore socket cleanup failures.
                    }
                }
            }
        }

        private static void HandleClient(TcpClient client)
        {
            if (client == null)
            {
                return;
            }

            IPEndPoint remote = client.Client.RemoteEndPoint as IPEndPoint;
            if (remote == null || !IPAddress.IsLoopback(remote.Address))
            {
                return;
            }

            client.ReceiveTimeout = 2000;
            client.SendTimeout = 2000;

            using (NetworkStream stream = client.GetStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 4096, true))
            {
                UniMapResponse response;
                try
                {
                    UniMapRequest request = ReadRequest(reader);
                    UniMapRouter router = _router;
                    response = router == null
                        ? UniMapResponse.Error(503, "Service Unavailable", "UniMap host is stopping.")
                        : router.Route(request);
                }
                catch (InvalidDataException exception)
                {
                    response = UniMapResponse.Error(400, "Bad Request", exception.Message);
                }

                WriteResponse(stream, response);
            }
        }

        private static UniMapRequest ReadRequest(StreamReader reader)
        {
            string requestLine = reader.ReadLine();
            if (string.IsNullOrWhiteSpace(requestLine) || requestLine.Length > MaxRequestLineCharacters)
            {
                throw new InvalidDataException("Invalid HTTP request line.");
            }

            string[] parts = requestLine.Split(new[] { ' ' }, 3, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 3 || !parts[2].StartsWith("HTTP/1.", StringComparison.Ordinal))
            {
                throw new InvalidDataException("Malformed HTTP request line.");
            }

            Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            int headerCharacters = 0;
            for (int lineIndex = 0; lineIndex < MaxHeaderLines; lineIndex++)
            {
                string line = reader.ReadLine();
                if (line == null)
                {
                    throw new InvalidDataException("Unexpected end of HTTP headers.");
                }

                if (line.Length == 0)
                {
                    return new UniMapRequest(parts[0], parts[1], headers);
                }

                headerCharacters += line.Length;
                if (headerCharacters > MaxHeaderCharacters)
                {
                    throw new InvalidDataException("HTTP headers exceed the UniMap safety limit.");
                }

                int separator = line.IndexOf(':');
                if (separator <= 0)
                {
                    throw new InvalidDataException("Malformed HTTP header.");
                }

                string name = line.Substring(0, separator).Trim();
                string value = line.Substring(separator + 1).Trim();
                if (name.Length == 0)
                {
                    throw new InvalidDataException("Malformed HTTP header name.");
                }

                headers[name] = value;
            }

            throw new InvalidDataException("Too many HTTP headers.");
        }

        private static void WriteResponse(NetworkStream stream, UniMapResponse response)
        {
            byte[] bodyBytes = Encoding.UTF8.GetBytes(response.Body ?? string.Empty);
            StringBuilder headers = new StringBuilder();
            headers.Append("HTTP/1.1 ").Append(response.StatusCode).Append(' ').Append(response.ReasonPhrase).Append("\r\n");
            headers.Append("Content-Type: ").Append(response.ContentType).Append("\r\n");
            headers.Append("Content-Length: ").Append(bodyBytes.Length).Append("\r\n");
            headers.Append("Connection: close\r\n");
            headers.Append("Cache-Control: no-store\r\n");
            headers.Append("Access-Control-Allow-Origin: *\r\n");
            headers.Append("Access-Control-Allow-Methods: GET, OPTIONS\r\n");
            headers.Append("Access-Control-Allow-Headers: Authorization, Content-Type\r\n");
            headers.Append("Access-Control-Allow-Private-Network: true\r\n");
            headers.Append("Access-Control-Max-Age: 600\r\n");

            foreach (KeyValuePair<string, string> header in response.Headers)
            {
                headers.Append(header.Key).Append(": ").Append(header.Value).Append("\r\n");
            }

            headers.Append("\r\n");
            byte[] headerBytes = Encoding.ASCII.GetBytes(headers.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (bodyBytes.Length > 0)
            {
                stream.Write(bodyBytes, 0, bodyBytes.Length);
            }

            stream.Flush();
        }
    }
}
