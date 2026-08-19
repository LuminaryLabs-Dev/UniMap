# Protocol

The machine-readable protocol lives in `protocol/`.

## API

`protocol/openapi.yaml` defines the local HTTP interface.

API version `1` is intentionally small and read-only. Adding mutation endpoints is not a compatible implementation detail; it requires an explicit security/product decision.

## Snapshot contract

`protocol/unimap-v1.schema.json` defines scene and selection snapshots.

The same schema file is copied into the Unity package so `/v1/schema` works when the package is installed through UPM. Repository validation requires those copies to stay byte-identical.

## Versioning

HTTP API version and snapshot schema version are separate:

- HTTP paths: `/v1/...`
- snapshot field: `"schemaVersion": "1.0"`

A new transport route can be added without changing the structural document schema. Breaking document changes require a new schema version.
