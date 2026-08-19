# FigJam Client

FigJam is the first UniMap client, not the source of the UniMap data contract.

## Connect

1. Run Unity with the UniMap package installed.
2. Open `Tools → UniMap → Open Brain Map`.
3. Copy connection information.
4. Import/run `clients/figjam/manifest.json` in FigJam.
5. Enter the localhost URL and token.
6. Click **Connect**.

## Render

- **Render Scene** calls `/v1/scene`.
- **Render Selection** calls `/v1/selection`.
- **Refresh** reads `/v1/info` and shows the current snapshot revision.

The client validates the returned document before creating any FigJam canvas nodes.

## Network boundary

The manifest permits only `http://localhost:17432` through `http://localhost:17442`. No wildcard internet access is granted.

Because the Figma plugin UI iframe has a null origin, the Unity host returns `Access-Control-Allow-Origin: *`; protected project data still requires the bearer token.

## Fallback

Manual JSON import remains available in a collapsed fallback section for debugging and offline snapshots. It should not be removed until real Unity/FigJam localhost smoke validation is complete.
