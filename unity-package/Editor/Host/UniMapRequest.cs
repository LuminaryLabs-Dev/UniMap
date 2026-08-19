using System;
using System.Collections.Generic;

namespace LuminaryLabs.UniMap
{
    public sealed class UniMapRequest
    {
        public string Method { get; }
        public string Path { get; }
        public IReadOnlyDictionary<string, string> Headers { get; }

        public UniMapRequest(string method, string path, IReadOnlyDictionary<string, string> headers)
        {
            Method = string.IsNullOrWhiteSpace(method) ? string.Empty : method.Trim().ToUpperInvariant();
            Path = NormalizePath(path);
            Headers = headers ?? throw new ArgumentNullException(nameof(headers));
        }

        public bool TryGetHeader(string name, out string value)
        {
            if (Headers is Dictionary<string, string> dictionary)
            {
                return dictionary.TryGetValue(name, out value);
            }

            foreach (KeyValuePair<string, string> pair in Headers)
            {
                if (string.Equals(pair.Key, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = pair.Value;
                    return true;
                }
            }

            value = string.Empty;
            return false;
        }

        private static string NormalizePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return "/";
            }

            string trimmed = path.Trim();
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out Uri absoluteUri))
            {
                return absoluteUri.AbsolutePath;
            }

            int queryIndex = trimmed.IndexOf('?');
            if (queryIndex >= 0)
            {
                trimmed = trimmed.Substring(0, queryIndex);
            }

            return trimmed.StartsWith("/", StringComparison.Ordinal) ? trimmed : "/" + trimmed;
        }
    }
}
