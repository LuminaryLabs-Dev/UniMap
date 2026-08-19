# Security

UniMap v0.2 is designed as a local read-only inspection service.

## Protections

- `TcpListener` binds to `IPAddress.Loopback` only.
- Protected data uses a per-session random bearer token.
- Only `GET` and `OPTIONS` are accepted.
- No request body is parsed.
- Request lines and headers have size/count limits.
- Unknown endpoints return 404.
- All `/v1/*` endpoints require authentication.
- `/health` reveals no project details.
- No endpoint writes to Unity, files, scenes or project settings.
- HTTP threads read cached strings and never traverse Unity scene objects.

## CORS

Figma's plugin iframe has a null origin and therefore needs `Access-Control-Allow-Origin: *`. CORS is not authorization. The bearer token is the authorization boundary.

## Non-goals for v0.2

UniMap does not provide:

- remote/LAN access
- arbitrary command execution
- object creation/deletion/renaming
- component editing
- serialized component-property inspection
- filesystem browsing
- WebSockets

Any future write API should be treated as a separate security design.
