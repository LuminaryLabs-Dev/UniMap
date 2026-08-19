using System;
using System.Collections.Generic;

namespace LuminaryLabs.UniMap
{
    public sealed class UniMapResponse
    {
        public int StatusCode { get; }
        public string ReasonPhrase { get; }
        public string ContentType { get; }
        public string Body { get; }
        public IReadOnlyDictionary<string, string> Headers { get; }

        public UniMapResponse(
            int statusCode,
            string reasonPhrase,
            string body,
            string contentType = "application/json; charset=utf-8",
            IReadOnlyDictionary<string, string> headers = null)
        {
            StatusCode = statusCode;
            ReasonPhrase = reasonPhrase ?? string.Empty;
            Body = body ?? string.Empty;
            ContentType = contentType ?? "application/json; charset=utf-8";
            Headers = headers ?? new Dictionary<string, string>();
        }

        public static UniMapResponse Json(int statusCode, string reasonPhrase, string json)
        {
            return new UniMapResponse(statusCode, reasonPhrase, json);
        }

        public static UniMapResponse Error(int statusCode, string reasonPhrase, string message)
        {
            string json = "{\"error\":\"" + EscapeJson(message) + "\"}";
            return Json(statusCode, reasonPhrase, json);
        }

        public static UniMapResponse NoContent()
        {
            return new UniMapResponse(204, "No Content", string.Empty, "text/plain; charset=utf-8");
        }

        private static string EscapeJson(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            return value
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\r", "\\r")
                .Replace("\n", "\\n")
                .Replace("\t", "\\t");
        }
    }
}
