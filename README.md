# UniMap — Unity Brain Map

UniMap is a lightweight Unity Editor + FigJam visualization tool for turning Unity scene structure into readable, collaborative maps.

```text
Unity 6
  ↓
UniMap Editor package
  ↓
Scene / selection hierarchy scanner
  ↓
UniMap JSON v1
  ↓
UniMap FigJam plugin
  ↓
Unity Brain Map
```

## Status

**v0.1.0 foundation.** The repository targets Unity 6.3 LTS as the primary editor and Unity 6.0 LTS as the minimum compatible Unity 6 line. Runtime support is only marked verified after an actual Editor smoke test; see [docs/compatibility.md](docs/compatibility.md) and [docs/validation.md](docs/validation.md).

## What UniMap captures

UniMap intentionally exports structural information, not every serialized Unity property:

- scene name and Unity version
- GameObject names and hierarchy
- active/inactive state
- component type names
- component enabled/disabled state when Unity exposes one
- child relationships and hierarchy depth

This keeps the Brain Map useful for developers, artists, designers, producers, and reviewers without turning it into a second Unity Inspector.

## Unity package

Install the package from this repository with Unity Package Manager:

```text
https://github.com/LuminaryLabs-Dev/UniMap.git?path=/unity-package
```

Then use:

```text
Tools → UniMap → Open Brain Map
Tools → UniMap → Export Active Scene
Tools → UniMap → Export Selection
```

The export is a local JSON file conforming to [schema/unimap-v1.schema.json](schema/unimap-v1.schema.json).

## FigJam plugin

```bash
cd figjam-plugin
npm ci
npm run build
npm test
```

In Figma/FigJam, import `figjam-plugin/manifest.json` as a development plugin, open a FigJam board, run **UniMap**, and choose a UniMap JSON export.

The plugin is offline-only: its manifest allows no network domains.

## Repository structure

```text
.
├── unity-package/        Unity 6 Editor package
├── figjam-plugin/        FigJam renderer; TypeScript is authoritative
├── schema/               UniMap JSON v1 contract
├── examples/             Canonical export fixtures
├── docs/                 Architecture, setup, compatibility, history
└── scripts/              Repository-level validation
```

## Provenance

UniMap rehabilitates the useful concept and rendering behavior of the 2023 **Unity Plotter** experiment in [`thecrimsondeveloper/Figma_Plugins`](https://github.com/thecrimsondeveloper/Figma_Plugins). That private historical repository remains untouched. UniMap is the maintained Luminary Labs home and uses a clean Unity 6 exporter plus a clean TypeScript FigJam build.

The FigJam manifest currently preserves the historical Unity Plotter plugin ID (`1281820949879720357`) for development continuity. Publishing ownership must be verified in Figma before using that ID for a marketplace release.

## Design boundaries

UniMap is:

- a read-only development visualization surface
- a Unity → JSON → FigJam flow
- deliberately small and local-first

UniMap is **not**:

- a Unity editor replacement
- a runtime debugger
- bidirectional Unity/FigJam synchronization
- a dependency manager
- a project management system

## Documentation

- [Architecture](docs/architecture.md)
- [Unity package](docs/unity-package.md)
- [FigJam plugin](docs/figjam-plugin.md)
- [Data format](docs/data-format.md)
- [Compatibility](docs/compatibility.md)
- [Validation](docs/validation.md)
- [History](docs/history.md)

## License

A repository license has not yet been selected. Do not assume permission to redistribute or relicense the project until Luminary Labs adds an explicit license.
