# Setup and diagnostics

Use this procedure before the first Google Maps CLI call in a session and when a call fails. Do not start an MCP server: these Skills use the standalone CLI.

## Local preflight

Run the local doctor first. It makes no Google API requests and does not print the key:

```bash
npx -y @cablate/mcp-google-map doctor
```

Interpret its JSON checks:

- `node`: Node.js 18 or newer is required.
- `package`: the npm package and CLI entrypoint were resolved.
- `api-key`: `GOOGLE_MAPS_API_KEY` is visible to the agent process; the value stays hidden.
- `live-api: skip`: expected during local-only diagnosis and not a failure.

If the key is missing, ask the user to set `GOOGLE_MAPS_API_KEY` in the environment used to launch the agent and start a new session. Prefer the environment variable to `--apikey`; command-line keys may appear in shell history or process listings.

## Google Cloud prerequisites

The key must belong to a Google Cloud project with billing enabled and restrictions compatible with the environment. Enable only the APIs needed by the requested tools:

| Capability | Google Maps Platform API |
|---|---|
| Address geocoding and reverse geocoding | Geocoding API |
| Text search, nearby search, place details, along-route place search, comparisons, local rank tracking | Places API (New) |
| Directions, distance matrix, waypoint optimization, along-route routing | Routes API |
| Elevation | Elevation API |
| Timezone | Time Zone API |
| Weather | Weather API |
| Air quality | Air Quality API |
| Static maps | Maps Static API |

## Optional live diagnosis

Only run this after telling the user that it makes billable test requests:

```bash
npx -y @cablate/mcp-google-map doctor --live
```

It independently tests Geocoding API, Places API (New), and Routes API so one disabled capability does not hide the others. It does not validate every optional API in the table. Test an optional capability with the smallest relevant tool call only when the user's task needs it.

## Failure classification

| Symptom | Likely cause | Next action |
|---|---|---|
| Package or command cannot be found | Node.js/npm unavailable, registry blocked, or package resolution failed | Repair Node/npm or registry access, then rerun local doctor |
| API key missing | Environment variable was not passed to the agent process | Set the variable and start a new session |
| `REQUEST_DENIED`, permission, or API-disabled error | API disabled, billing unavailable, or key restriction mismatch | Use the failed check name to review that API and the key restrictions in Google Cloud Console |
| `OVER_QUERY_LIMIT`, quota, or rate-limit error | Project quota or billing limit | Stop retries and ask the user to review quota/billing |
| Invalid request | Wrong parameters or unsupported mode | Read the selected tool's parameter reference and correct the request |
| Network or timeout error | Connectivity, proxy, DNS, or transient service issue | Report the observed failure; retry only when reasonable and requested |
| One live check fails while others pass | Capability-specific API configuration | Fix only the named API; do not claim the entire key is invalid |

Never include the API key in diagnostic output, copied commands, bug reports, or final answers.
