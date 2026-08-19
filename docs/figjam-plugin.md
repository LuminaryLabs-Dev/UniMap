# FigJam plugin

UniMap's FigJam plugin turns UniMap JSON into a visual Brain Map. It is intentionally FigJam-only and offline-only.

## Build

```bash
cd figjam-plugin
npm ci
npm run build
```

TypeScript source:

```text
src/code.ts
```

Generated artifact:

```text
dist/code.js
```

Do not edit the generated file directly.

## Test

```bash
npm test
```

The tests validate canonical examples and execute the generated plugin inside a mocked FigJam API surface to smoke-test successful rendering and malformed-input handling.

## Import into FigJam

1. Open Figma/FigJam development plugins.
2. Import `figjam-plugin/manifest.json`.
3. Open a FigJam board.
4. Run **UniMap**.
5. Choose a JSON file exported by the Unity package.
6. UniMap validates the complete hierarchy before creating canvas nodes.

## Rendering model

- one outer section represents the exported scene/selection
- each GameObject becomes a nested section
- each component becomes a sticky note
- disabled GameObjects are labeled `(Disabled)`
- disabled components are labeled `(Disabled)` and use a muted fill
- children are recursively nested and vertically laid out

## Safety limits

The renderer rejects documents exceeding its current safety envelope:

- maximum hierarchy depth: 64
- maximum hierarchy nodes: 10,000
- maximum components: 50,000

These limits prevent malformed or unexpectedly huge JSON from freezing a FigJam file.

## Historical plugin ID

The manifest preserves `1281820949879720357`, the ID found in the 2023 Unity Plotter manifest, solely for continuity. Before a marketplace release, verify that Luminary Labs controls the corresponding Figma plugin registration. If not, create a new Figma plugin registration and replace the ID as an explicit release operation.

## Network behavior

`networkAccess.allowedDomains` is `['none']`. UniMap reads a local file and creates FigJam nodes; it does not send project data to a server.
