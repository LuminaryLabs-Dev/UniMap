using System;
using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.UniMap
{
    public static class UniMapProtocol
    {
        public const string ApiVersion = "1";
        public const int DefaultPort = 17432;
        public const int LastFallbackPort = 17442;
        public const string LoopbackHost = "localhost";
        public const string SchemaAssetPath = "Packages/com.luminarylabs.unimap/Editor/Protocol/unimap-v1.schema.json";

        private static string _schemaJson;

        public static string GetSchemaJson()
        {
            if (!string.IsNullOrWhiteSpace(_schemaJson))
            {
                return _schemaJson;
            }

            TextAsset schemaAsset = AssetDatabase.LoadAssetAtPath<TextAsset>(SchemaAssetPath);
            if (schemaAsset == null || string.IsNullOrWhiteSpace(schemaAsset.text))
            {
                throw new InvalidOperationException($"UniMap schema could not be loaded from '{SchemaAssetPath}'.");
            }

            _schemaJson = schemaAsset.text;
            return _schemaJson;
        }

        public static string BuildBaseUrl(int port)
        {
            if (port < DefaultPort || port > LastFallbackPort)
            {
                throw new ArgumentOutOfRangeException(nameof(port));
            }

            return $"http://{LoopbackHost}:{port}";
        }
    }
}
