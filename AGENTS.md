# UniMap contributor and agent guidance

## Purpose

UniMap converts Unity scene hierarchy data into an offline JSON snapshot and renders that snapshot as a collaborative FigJam Brain Map.

## Authoritative sources

- Unity export contract: `schema/unimap-v1.schema.json`
- Unity implementation: `unity-package/Editor/`
- FigJam TypeScript source: `figjam-plugin/src/code.ts`
- FigJam generated artifact: `figjam-plugin/dist/code.js`
- compatibility claims: `docs/compatibility.md`
- validation evidence: `docs/validation.md`

## Guardrails

1. **Never hand-edit `figjam-plugin/dist/code.js`.** Change `src/code.ts`, run the build, and commit the generated output.
2. Preserve schema v1 compatibility unless intentionally introducing a new schema version.
3. Do not export arbitrary serialized Unity properties in v0.1.x. Keep the data structural and human-readable.
4. Do not add network access to the FigJam plugin without an explicit product decision and documentation update.
5. Do not claim a Unity version is runtime-verified until it has been opened and smoke-tested in that Editor version.
6. Keep one Unity package codebase across supported Unity 6 versions. Use narrowly scoped version conditionals only when verified necessary.
7. The historical `thecrimsondeveloper/Figma_Plugins` repository is provenance, not a deployment target.
8. The historical Figma plugin ID is preserved for continuity; verify Figma publishing ownership before marketplace publication.

## Required validation before release

```bash
cd figjam-plugin
npm ci
npm run check
cd ..
node scripts/validate-repo.mjs
```

Also run Unity EditMode tests and a manual export smoke test in each Unity version being marked runtime-verified.
