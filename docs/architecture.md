# Architecture

## System shape

```text
Unity Editor main thread
  ├─ scene / selection events
  ├─ hierarchy scanner
  ├─ UniMap model validation
  └─ immutable snapshot cache
              ↓
      loopback HTTP host
      (background thread)
              ↓
     local read-only clients
```

The central invariant is: **request threads never traverse Unity objects**.

## Unity main-thread layer

`UniMapHierarchyScanner` reads the active scene or selection and produces `UniMapDocument` objects. `UniMapSerializer` validates them before serialization.

`UniMapSnapshotService` listens to hierarchy, selection and play-mode changes, debounces them, and rebuilds the cache on `EditorApplication.update`. The cached snapshot contains only strings and metadata safe to read from the host thread.

## Transport layer

`UniMapHost` uses a `TcpListener` bound to `IPAddress.Loopback`. It accepts a deliberately tiny HTTP subset:

- `GET`
- `OPTIONS`
- request line + headers only
- no request bodies

`UniMapRouter` is transport-independent and routes cached values. Protected routes require a per-session bearer token.

## Client layer

Clients depend on the protocol rather than Unity internals. The FigJam client connects to the local host, downloads `/v1/scene` or `/v1/selection`, validates UniMap JSON v1, and renders a Brain Map.

## Optional export layer

`UniMapExporter` remains for offline snapshots. It is not the primary integration path.
