# Architecture

UniMap is intentionally a one-way, local-first visualization pipeline.

```text
┌──────────────────────┐
│ Unity 6 Editor       │
│                      │
│ Scene / Selection    │
└──────────┬───────────┘
           │ scan
           ▼
┌──────────────────────┐
│ UniMap hierarchy     │
│ model                │
│                      │
│ GameObjects          │
│ Components           │
│ Enabled state        │
│ Children + depth     │
└──────────┬───────────┘
           │ serialize
           ▼
┌──────────────────────┐
│ UniMap JSON v1       │
│ schema contract      │
└──────────┬───────────┘
           │ local file
           ▼
┌──────────────────────┐
│ FigJam plugin UI     │
│ file selection       │
└──────────┬───────────┘
           │ render-document
           ▼
┌──────────────────────┐
│ TypeScript renderer  │
│ validation + layout  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ FigJam Brain Map     │
│ sections + stickies  │
└──────────────────────┘
```

## Unity side

### `UniMapHierarchyScanner`

Reads either the active scene or a top-level selection. It recursively captures GameObjects, components, active state, depth, and children. It deliberately avoids arbitrary serialized fields.

### `UniMapSerializer`

Owns the serializable data classes, validates the in-memory contract, and produces JSON using Unity's built-in `JsonUtility`.

### `UniMapExporter`

Coordinates scanning, validation, serialization, file naming, and the Editor save dialog.

### `UniMapWindow`

Provides the human-facing `Tools → UniMap` Editor surface.

## Data boundary

`schema/unimap-v1.schema.json` is the contract between Unity and FigJam. Both sides must treat the schema as authoritative. A schema change that breaks v1 consumers requires a new schema version rather than silently changing v1.

## FigJam side

### UI

`figjam-plugin/ui.html` is only responsible for local file selection, basic JSON syntax checking, status display, and sending messages to the plugin main context.

### Renderer

`figjam-plugin/src/code.ts` is the only source of truth. It:

1. parses JSON
2. validates the UniMap v1 structure before modifying the canvas
3. enforces safety limits on node/component counts and hierarchy depth
4. creates a root section for the scene
5. recursively creates sections for GameObjects
6. creates sticky notes for components
7. marks disabled objects/components in names and color treatment
8. selects and zooms to the completed map

`dist/code.js` is generated output and must never be edited directly.

## Non-goals

v0.1 does not implement live synchronization, network transport, two-way editing, serialized-property inspection, runtime telemetry, or Unity scene mutation from FigJam.
