# Changelog

## Unreleased

### v0.2.0 foundation

- Reframed UniMap as a Unity-hosted local integration API.
- Added loopback-only read-only HTTP service with ports 17432-17442.
- Added per-session bearer-token authentication.
- Added cached main-thread snapshot service and debounced hierarchy/selection refresh.
- Added `/health`, `/v1/info`, `/v1/scene`, `/v1/selection`, and `/v1/schema`.
- Added OpenAPI protocol definition.
- Moved the FigJam integration under `clients/figjam/` and converted it to a localhost API client.
- Kept manual JSON export/import as a fallback.
- Added route/authentication tests and repository safety checks.

## v0.1.0 foundation — unreleased tag

- Introduced the Unity 6 UPM package, UniMap JSON v1, example fixtures and FigJam renderer.
- Reconstructed the useful Unity Plotter behavior from the historical private `thecrimsondeveloper/Figma_Plugins` repository.

The project predates formal release tracking; no historical release tags are fabricated here.
