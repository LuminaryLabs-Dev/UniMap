# Local Host

UniMap starts a small HTTP service inside the Unity Editor.

## Binding

- interface: loopback only
- client URL: `http://localhost:<port>`
- first port: `17432`
- fallback range: `17433-17442`

The socket is never bound to `IPAddress.Any` or a LAN interface.

## Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /health` | No | Verify a UniMap process is listening |
| `GET /v1/info` | Bearer | Snapshot metadata/revision |
| `GET /v1/scene` | Bearer | Active-scene structural snapshot |
| `GET /v1/selection` | Bearer | Current selection structural snapshot |
| `GET /v1/schema` | Bearer | UniMap JSON v1 schema |
| `OPTIONS *` | No | Browser/FigJam CORS preflight |

Other methods return `405 Method Not Allowed`.

## Connection information

Each host start creates a fresh 128-bit random token. In Unity:

```text
Tools → UniMap → Open Brain Map
```

then click **Copy Connection Info**. The copied JSON contains only:

```json
{"baseUrl":"http://localhost:17432","token":"..."}
```

The token changes when the host restarts or Unity reloads the domain.

## Snapshot behavior

Hierarchy, selection and play-mode changes mark the cache dirty. UniMap waits roughly 200 ms and then rebuilds one snapshot on the main Editor thread. HTTP requests only read that cached snapshot.
