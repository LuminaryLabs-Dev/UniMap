# Compatibility

## Unity

| Editor | Target status |
|---|---|
| Unity 6.3 LTS | Primary validation target |
| Unity 6.0 LTS | Minimum package target |
| Other Unity 6 updates | Expected-compatible; smoke-test before claiming support |
| Unity 2022/2023 | Not targeted |

`unity-package/package.json` declares `"unity": "6000.0"`.

The implementation uses mainstream Unity Editor APIs plus .NET networking primitives available to Unity's Editor runtime. Real Editor compilation and host behavior must still be validated in each claimed Editor line.

## FigJam

The client uses the existing UniMap Figma plugin ID and current FigJam plugin APIs. Its network manifest permits the fixed UniMap localhost port range only.
