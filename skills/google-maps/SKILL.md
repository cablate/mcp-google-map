---
name: google-maps
description: Search places, resolve addresses, compare routes, inspect neighborhoods, and retrieve geographic or environmental facts through the standalone @cablate/mcp-google-map CLI. Use for concrete location questions; use the travel-planning or local-seo Skill for those specialized outcomes.
license: MIT
---

# Google Maps

Answer real-world location questions with the package's standalone `exec` CLI. Do not start or configure an MCP server for this workflow.

## Before calling the CLI

- On the first call in a session, or after an execution failure, read `../_shared/setup-and-diagnostics.md` and run the non-billable local preflight.
- The user must supply `GOOGLE_MAPS_API_KEY`. Never print it or place it in a command unless the user explicitly accepts shell-history and process-list exposure.
- Before presenting Places reviews, photos, or AI summaries, read `../_shared/content-attribution.md`.

## Workflow

1. Identify the concrete location outcome and missing inputs. Do not request details that can be resolved by geocoding or place search.
2. Read `references/tools-api.md` when exact parameters, response fields, or a multi-tool recipe are needed.
3. Prefer coordinates over ambiguous addresses and `place_id` over repeated name searches.
4. Chain only the calls needed for the outcome. Reuse returned identifiers and coordinates.
5. Treat nonzero exit status or `{ "success": false }` as a failure, not as geographic data.
6. Summarize the useful result rather than returning raw JSON. Preserve source and attribution metadata where required.

## Tool selection

| Outcome | Preferred tools |
|---|---|
| Address or landmark to coordinates | `maps_geocode` |
| Coordinates to address | `maps_reverse_geocode` |
| Nearby discovery | `maps_search_nearby`, then `maps_place_details` |
| Natural-language place search | `maps_search_places`, then `maps_place_details` |
| Compare candidate places | `maps_compare_places` or search → details → distance matrix |
| Route or travel-mode comparison | `maps_directions`, `maps_distance_matrix` |
| Multi-stop route without a broader itinerary | `maps_plan_route` |
| Things along a route | `maps_search_along_route` |
| Neighborhood facts | `maps_explore_area` plus targeted nearby searches |
| Elevation, timezone, weather, or air quality | corresponding environment tool; geocode first when needed |
| Visual map | `maps_static_map` after locations or a route are known |

## Invocation

```bash
npx -y @cablate/mcp-google-map exec <tool> '<json_params>'
```

The CLI accepts both MCP-style names such as `maps_geocode` and short names such as `geocode`. Each call is stateless and returns JSON on stdout.

## Boundaries

- For a multi-day itinerary, trip schedule, or travel-day optimization, use `google-maps-travel-planning` instead.
- For Google Business Profile visibility, grid ranking, keyword coverage, or competitor audits, use `google-maps-local-seo` instead.
- `maps_weather` is unavailable in Japan, China, South Korea, Cuba, Iran, North Korea, and Syria; use a current web source there.
- Transit waypoint optimization is unsupported; use `optimize: false` for transit routes.
- Geographic proximity and elevation alone do not establish safety, accessibility, flood risk, or suitability. State those limitations when relevant.

## References

- `references/tools-api.md`: read for exact parameters, response shapes, and generic chaining recipes.
- `../_shared/setup-and-diagnostics.md`: read for first-run checks and error classification.
- `../_shared/content-attribution.md`: read before displaying regulated Google Maps content.
