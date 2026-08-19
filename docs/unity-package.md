# Unity package

## Install

Use Unity Package Manager's **Add package from git URL** flow:

```text
https://github.com/LuminaryLabs-Dev/UniMap.git?path=/unity-package
```

The package manifest declares Unity `6000.0` as its minimum Unity 6 line. Runtime verification is tracked separately in [compatibility.md](compatibility.md).

## Editor commands

```text
Tools → UniMap → Open Brain Map
Tools → UniMap → Export Active Scene
Tools → UniMap → Export Selection
```

### Open Brain Map

Opens a small Editor window describing the current scene and providing scene/selection export buttons.

### Export Active Scene

Exports every root GameObject in the active scene and recursively includes its descendants.

### Export Selection

Exports selected GameObjects. If both a parent and one of its descendants are selected, only the selected parent is treated as an export root so the child is not duplicated.

## Exported information

For each GameObject UniMap exports:

- `Name`
- `IsEnabled` from `GameObject.activeSelf`
- `Depth` relative to the exported root
- component names
- component enabled state where Unity exposes one
- child objects

For components without an enabled property, `IsEnabled` is `true`. Missing-script component slots are emitted as `Missing Script` with `IsEnabled: false` so broken scene structure remains visible.

## Output

The exporter opens a normal Editor save dialog and writes UTF-8 JSON. The JSON must pass `UniMapSerializer.TryValidate` before it is written.

## Development

The package is Editor-only. Runtime player assemblies do not reference UniMap.

EditMode tests live under:

```text
unity-package/Tests/Editor/
```

Run them with Unity Test Framework before marking a Unity release runtime-verified.
