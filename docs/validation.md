# Validation status

This file separates what the repository proves from what still requires the real host applications.

## Repository/static validation

| Area | Status |
|---|---|
| repository structure | validated |
| JSON files parse | validated |
| UniMap v1 schema/examples agree | validated |
| FigJam TypeScript emits generated JS | validated locally with TypeScript 5.8.3 against a minimal API compatibility stub; official `@figma/plugin-typings` install/build is delegated to CI |
| generated JS syntax | validated locally |
| mocked FigJam render smoke | validated locally |
| malformed FigJam input rejection | validated locally |
| package-lock/package.json pins agree | validated; networked `npm ci` pending CI |
| Unity package manifest parses | validated |
| Unity C# source structure | reviewed/static only |

## Host-runtime validation

| Host | Status |
|---|---|
| Unity 6.3 LTS import + EditMode tests | pending real Unity Editor run |
| Unity 6.0 LTS import + EditMode tests | pending real Unity Editor run |
| later Unity 6 update | not yet claimed |
| FigJam development-plugin import | pending real FigJam run |
| FigJam render from a real Unity export | pending end-to-end host smoke |
| Figma marketplace publishing ownership for historical ID | unknown / must verify before release |

## Why these remain pending

The rehabilitation environment can validate files, JavaScript execution, schema behavior, and mocked host interactions, but it does not contain the Unity Editor or a FigJam runtime and cannot reach the npm registry. GitHub Actions performs the clean `npm ci` + official Figma typings build after push. UniMap therefore does not label those outcomes as verified until they are actually executed in the host applications.

## Release validation commands

```bash
cd figjam-plugin
npm ci
npm run check
cd ..
node scripts/validate-repo.mjs
```

Then run `LuminaryLabs.UniMap.Editor.Tests` in Unity Test Framework and complete the manual end-to-end path described in [compatibility.md](compatibility.md).
