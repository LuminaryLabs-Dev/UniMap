# UniMap — Unity Local Integration API

UniMap is a lightweight, read-only local integration surface hosted by the Unity Editor. It turns the current Unity scene and selection into cached structural snapshots that local clients can read over HTTP.

```text
Unity Editor
   │
   ├─ UniMap scanner
   │      ↓
   ├─ cached immutable snapshot
   │      ↓
   └─ local API: http://localhost:17432-17442
             │
       ┌─────┼──────────┐
       ↓     ↓          ↓
    FigJam  Browser   Agents/scripts
```

The FigJam Brain Map is the first client. It is no longer the architecture boundary.

## Status

**v0.2.0 foundation on Unity 6.**

- Unity 6.3 LTS is the primary validation target.
- Unity 6.0 LTS is the minimum package target.
- The local API is loopback-only and read-only.
- Manual JSON export/import remains available as a fallback until real Unity + FigJam host smoke validation is complete.

See [docs/validation.md](docs/validation.md) for the exact verified/unverified boundary.

## Install in Unity

Use Unity Package Manager with:

```text
https://github.com/LuminaryLabs-Dev/UniMap.git?path=/unity-package
```

Then open:

```text
Tools → UniMap → Open Brain Map
```

UniMap starts its local host automatically when the Editor domain loads. The window shows the selected localhost port and can copy the per-session connection information for clients.

## Local API

The service binds only to the loopback interface and probes ports `17432` through `17442`.

```text
GET /health        no authentication; confirms UniMap is listening
GET /v1/info       bearer token required
GET /v1/scene      bearer token required
GET /v1/selection  bearer token required
GET /v1/schema     bearer token required
OPTIONS *           CORS preflight only
```

All other methods are rejected. The request thread reads only immutable cached strings; Unity scene traversal happens on the Editor main thread when the cache is refreshed.

Protocol definitions:

- [OpenAPI](protocol/openapi.yaml)
- [UniMap JSON v1 schema](protocol/unimap-v1.schema.json)

## FigJam client

The FigJam client lives under `clients/figjam/`.

```bash
cd clients/figjam
npm ci
npm run build
npm test
```

Import `clients/figjam/manifest.json` as a development plugin in FigJam.

Normal workflow:

1. Open `Tools → UniMap → Open Brain Map` in Unity.
2. Click **Copy Connection Info**.
3. Paste the localhost URL and session token into the UniMap FigJam client.
4. Connect.
5. Render the current scene or current selection.

The client is restricted by its manifest to the UniMap localhost port range only.

## What the snapshot contains

UniMap intentionally exposes structural data rather than every serialized component property:

- Unity version
- scene name
- GameObject names
- hierarchy relationships and depth
- active/inactive state
- component type names
- enabled/disabled component state where Unity exposes it
- missing-script markers

This keeps the API useful for visualization, review and tooling without becoming a remote Unity Inspector.

## Security boundary

v0.2 is deliberately narrow:

- loopback binding only (`127.0.0.1` / `localhost`)
- no LAN binding
- no wildcard socket binding
- read-only `GET` endpoints
- per-session 128-bit random bearer token
- no object creation, deletion, renaming or component mutation
- no arbitrary command execution
- no filesystem API
- request threads never traverse Unity scene objects

See [docs/security.md](docs/security.md).

## Fallback JSON snapshots

The Unity window can still export `.unimap.json` files. This is secondary functionality for debugging, offline sharing, archival snapshots and host-validation fallback.

## Repository structure

```text
.
├── unity-package/
│   ├── Editor/
│   │   ├── Model/
│   │   ├── Scanning/
│   │   ├── Snapshots/
│   │   ├── Host/
│   │   ├── UI/
│   │   ├── Export/
│   │   └── Protocol/
│   └── Tests/
├── clients/
│   └── figjam/
├── protocol/
│   ├── openapi.yaml
│   └── unimap-v1.schema.json
├── examples/
├── docs/
└── scripts/
```

## Provenance

UniMap rehabilitates the useful idea behind the 2023 private repository `thecrimsondeveloper/Figma_Plugins`, specifically its **Unity Plotter** FigJam plugin. That historical repository remains untouched. UniMap is the maintained Luminary Labs implementation and uses a clean Unity-first local API architecture.
