# UniMap Agent Guardrails

## Product boundary

UniMap is a **local, read-only Unity integration API**. FigJam is a client, not the source of truth.

## Authoritative layers

1. `unity-package/Editor/Model/` — UniMap data model.
2. `protocol/unimap-v1.schema.json` — canonical external snapshot contract.
3. `unity-package/Editor/Scanning/` — Unity main-thread structural extraction.
4. `unity-package/Editor/Snapshots/` — immutable cached response data.
5. `unity-package/Editor/Host/` — loopback-only read-only HTTP transport.
6. `clients/figjam/src/code.ts` — authoritative FigJam renderer source; `dist/code.js` is generated.

## Hard safety rules

- Do not bind UniMap to `0.0.0.0`, `IPAddress.Any`, `*`, `+`, a LAN address, or a public interface.
- Do not add write endpoints without an explicit new product/security decision.
- HTTP request threads must never call Unity hierarchy/scene APIs.
- Do not expose arbitrary files, commands or serialized component values through the host.
- Keep bearer authentication on all `/v1/*` endpoints.
- `/health` may remain unauthenticated and must not expose project data.
- Keep CORS compatible with Figma's null-origin iframe, but rely on the token for data authorization.
- Do not change the Figma plugin ID casually.
- Do not edit `clients/figjam/dist/code.js` directly; regenerate it from TypeScript.
- Keep `protocol/unimap-v1.schema.json` and the package copy byte-identical.

## Validation expectations

Before publishing a change:

```bash
cd clients/figjam
npm ci
npm run check
cd ../..
node scripts/validate-repo.mjs
```

Unity runtime/editor claims require actual Unity Editor validation. FigJam host claims require an actual FigJam development-plugin smoke test.
