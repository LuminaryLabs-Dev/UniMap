using System;

namespace LuminaryLabs.UniMap
{
    public sealed class UniMapRouter
    {
        private const string HealthJson = "{\"status\":\"ok\",\"service\":\"UniMap\",\"apiVersion\":\"1\"}";
        private readonly Func<UniMapSnapshot> _snapshotProvider;
        private readonly Func<string> _tokenProvider;

        public UniMapRouter(Func<UniMapSnapshot> snapshotProvider, Func<string> tokenProvider)
        {
            _snapshotProvider = snapshotProvider ?? throw new ArgumentNullException(nameof(snapshotProvider));
            _tokenProvider = tokenProvider ?? throw new ArgumentNullException(nameof(tokenProvider));
        }

        public UniMapResponse Route(UniMapRequest request)
        {
            if (request == null)
            {
                return UniMapResponse.Error(400, "Bad Request", "Request is required.");
            }

            if (string.Equals(request.Method, "OPTIONS", StringComparison.Ordinal))
            {
                return UniMapResponse.NoContent();
            }

            if (!string.Equals(request.Method, "GET", StringComparison.Ordinal))
            {
                return new UniMapResponse(
                    405,
                    "Method Not Allowed",
                    "{\"error\":\"Only GET and OPTIONS are supported.\"}",
                    headers: new System.Collections.Generic.Dictionary<string, string>
                    {
                        ["Allow"] = "GET, OPTIONS"
                    });
            }

            if (string.Equals(request.Path, "/health", StringComparison.Ordinal))
            {
                return UniMapResponse.Json(200, "OK", HealthJson);
            }

            if (!UniMapAuthentication.IsAuthorized(request, _tokenProvider()))
            {
                return UniMapResponse.Error(401, "Unauthorized", "A valid UniMap bearer token is required.");
            }

            UniMapSnapshot snapshot = _snapshotProvider();
            if (snapshot == null)
            {
                return UniMapResponse.Error(503, "Service Unavailable", "UniMap does not have a snapshot yet.");
            }

            switch (request.Path)
            {
                case "/v1/info":
                    return UniMapResponse.Json(200, "OK", snapshot.InfoJson);
                case "/v1/scene":
                    return UniMapResponse.Json(200, "OK", snapshot.SceneJson);
                case "/v1/selection":
                    return UniMapResponse.Json(200, "OK", snapshot.SelectionJson);
                case "/v1/schema":
                    return UniMapResponse.Json(200, "OK", snapshot.SchemaJson);
                default:
                    return UniMapResponse.Error(404, "Not Found", "Unknown UniMap endpoint.");
            }
        }
    }
}
