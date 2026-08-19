# History

## 2023 — Unity Plotter

The private `thecrimsondeveloper/Figma_Plugins` repository contained a FigJam plugin named **Unity Plotter**. It visualized Unity hierarchy JSON using nested FigJam sections and component stickies.

## 2026 — UniMap v0.1 foundation

The useful concept was rehabilitated in `LuminaryLabs-Dev/UniMap` with a Unity 6 UPM package, formal JSON v1 schema, TypeScript FigJam renderer, fixtures and validation.

## 2026 — UniMap v0.2 architecture

UniMap moved from a file-transfer workflow to a Unity-first local integration surface:

```text
Unity → cached snapshot → local API → clients
```

FigJam became the first client rather than the architecture owner. Manual JSON export/import was retained only as fallback capability during host validation.
