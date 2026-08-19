# Validation Status

## Can be validated without Unity/FigJam

- JSON syntax and schema contract
- OpenAPI endpoint declaration
- TypeScript source compilation
- generated `dist/code.js` parity
- FigJam renderer mock smoke
- malformed-document rejection before canvas mutation
- client localhost/network manifest contract
- repository path/guardrail checks
- static C# architecture checks: loopback binding, no wildcard binding, GET/OPTIONS-only router, snapshot-only request path

## Requires Unity Editor

- C# compilation against actual Unity 6 assemblies
- package import through UPM
- EditMode test execution
- automatic host startup
- real loopback socket bind on each OS
- hierarchy/selection event refresh behavior
- actual `/v1/*` responses from Unity

## Requires FigJam

- manifest localhost CSP behavior
- browser CORS preflight against the Unity host
- real connection/token flow
- real sections/stickies layout and rendering

## Release gate

Do not tag v0.2.0 until this chain passes in Unity 6.3 and FigJam:

```text
Unity scene
  ↓
UniMap snapshot
  ↓
localhost /v1/scene
  ↓
FigJam client
  ↓
Brain Map
```

Then repeat the Unity package/host smoke in Unity 6.0 before marking 6.0 fully supported.
