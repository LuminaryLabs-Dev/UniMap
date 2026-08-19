# UniMap JSON v1

The machine-readable contract is [`schema/unimap-v1.schema.json`](../schema/unimap-v1.schema.json).

## Example

```json
{
  "schemaVersion": "1.0",
  "scene": "SampleScene",
  "unityVersion": "6000.3.0f1",
  "source": "active-scene",
  "hierarchyObjects": [
    {
      "Name": "Player",
      "IsEnabled": true,
      "Depth": 0,
      "Components": [
        {
          "Name": "Transform",
          "IsEnabled": true
        }
      ],
      "Children": []
    }
  ]
}
```

## Top-level fields

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `schemaVersion` | string | yes | Contract version; v0.1 emits `1.0` |
| `scene` | string | yes | Scene name or `Selection` for a mixed-scene selection |
| `unityVersion` | string | yes | `Application.unityVersion` from the exporting Editor |
| `source` | enum | yes | `active-scene` or `selection` |
| `hierarchyObjects` | array | yes | Export roots |

## Hierarchy object

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `Name` | string | yes | GameObject name |
| `IsEnabled` | boolean | yes | `activeSelf` state |
| `Depth` | integer | yes | Relative depth; export roots are `0` |
| `Components` | array | yes | Attached component summaries |
| `Children` | array | yes | Child GameObjects using the same shape |

## Component

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `Name` | string | yes | Component type name, or `Missing Script` |
| `IsEnabled` | boolean | yes | Enabled state where available; otherwise `true` |

## Compatibility rule

Consumers of schema v1 may rely on the required fields above. Breaking changes must introduce a new schema version. Additive metadata should be considered carefully because the current schema intentionally rejects unknown properties to catch accidental exporter drift.
