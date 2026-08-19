# History and provenance

## 2023 — Unity Plotter

The precursor lived in the private repository:

[`thecrimsondeveloper/Figma_Plugins`](https://github.com/thecrimsondeveloper/Figma_Plugins)

Its meaningful tool was **Unity Plotter**, a FigJam-only plugin that accepted Unity hierarchy JSON and recursively created FigJam sections and component sticky notes.

The historical implementation established several useful ideas:

- local JSON upload
- recursive hierarchy visualization
- nested sections
- component sticky notes
- enabled/disabled labeling
- automatic sizing and layout

It also accumulated rehabilitation problems:

- the real implementation lived in `code.js` while `code.ts` remained starter/template code
- running the documented TypeScript build could overwrite the working implementation
- input structure was implicit rather than schema-defined
- JSON parsing and selection/fill assumptions were weakly guarded
- the README was largely generic Figma plugin setup text
- the UI contained debugging utilities unrelated to the core product

The final historical commits edited JavaScript directly, confirming that JavaScript—not TypeScript—had become the de facto source during late development.

## 2026 — UniMap

`LuminaryLabs-Dev/UniMap` becomes the clean maintained home under the product identity:

**UniMap — Unity Brain Map**

The rehabilitation keeps the useful visualization concept while changing the architecture:

```text
old: Unity JSON (external/implicit) → Unity Plotter FigJam plugin
new: UniMap Unity 6 exporter → versioned JSON contract → UniMap FigJam plugin
```

TypeScript is restored as the sole FigJam source of truth. The old repository remains untouched as historical provenance.

The new renderer also avoids relying on the old `StickyNode.rescale()` behavior; current Figma documentation does not list StickyNode among nodes supporting the generic `rescale()` API.
