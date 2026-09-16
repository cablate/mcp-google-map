---
name: google-maps
description: Use Google Maps-backed geocoding, place search, routing, and geographic analysis through the standalone @cablate/mcp-google-map CLI when a user asks about real-world locations. No MCP connection is required.
license: MIT
---

# Google Maps - Geospatial Query Capabilities

## Overview

Use the package's `exec` CLI to answer location questions without starting an MCP server. The Skill supplies tool-selection and chaining guidance; the npm package makes the API calls. The user must provide their own Google Maps Platform API key.

---

## Core Principles

| Principle | Explanation |
|-----------|-------------|
| Chain over single-shot | Most geo questions require 2-5 tool calls chained together. See Scenario Recipes in references/tools-api.md for the full patterns. |
| Match recipe to intent | Map the user's question to a recipe (Trip Planning, Local Discovery, Route Comparison, Neighborhood Analysis, Multi-Stop, Place Comparison, Along the Route) before calling any tool. |
| Precise input saves trouble | Use coordinates over address strings when available. Use place_id over name search. More precise input = more reliable output. |
| Output is structured | Every tool returns JSON. Use it directly for downstream computation or comparison — no extra parsing needed. |
| Present results clearly | Summarize comparisons in a table when it helps; do not pass raw JSON through as the final answer. |
| Preserve source context | Google Maps content has display, attribution, and retention conditions. Read `references/content-attribution.md` before presenting place reviews, photos, or AI summaries. |

---

## Tool Map

18 tools in five categories — pick by scenario:

### Place Discovery
| Tool | When to use | Example |
|------|-------------|---------|
| `maps_geocode` | Have an address/landmark, need coordinates | "What are the coordinates of Tokyo Tower?" |
| `maps_reverse_geocode` | Have coordinates, need an address | "What's at 35.65, 139.74?" |
| `maps_search_nearby` | Know a location, find nearby places by type | "Coffee shops near my hotel" |
| `maps_search_places` | Natural language place search | "Best ramen in Tokyo" |
| `maps_place_details` | Have a place_id, need full info (+ optional photo URLs via `maxPhotos`) | "Opening hours and reviews for this restaurant?" |
| `maps_batch_geocode` | Geocode multiple addresses at once (max 50) | "Get coordinates for all these offices" |

### Routing & Distance
| Tool | When to use | Example |
|------|-------------|---------|
| `maps_directions` | How to get from A to B, including drive-only avoid-tolls/highways controls | "Route from Taipei Main Station to airport avoiding tolls" |
| `maps_distance_matrix` | Compare distances across multiple points, including drive-only avoid-tolls/highways controls | "Which of these 3 hotels is closest to airport without highways?" |
| `maps_search_along_route` | Find places along a route (meals, stops) ranked by detour time | "Restaurants between Fushimi Inari and Kiyomizu-dera" |

### Environment
| Tool | When to use | Example |
|------|-------------|---------|
| `maps_elevation` | Query altitude | "Elevation profile along this hiking trail" |
| `maps_timezone` | Need local time at a destination | "What time is it in Tokyo?" |
| `maps_weather` | Weather at a location (current or forecast) | "What's the weather in Paris?" |
| `maps_air_quality` | AQI, pollutants, health recommendations | "Is the air safe for jogging?" |

### Visualization
| Tool | When to use | Example |
|------|-------------|---------|
| `maps_static_map` | Show locations/routes on a map image | "Show me these places on a map" |

### Composite (one-call shortcuts)
| Tool | When to use | Example |
|------|-------------|---------|
| `maps_explore_area` | Overview of a neighborhood | "What's around Tokyo Tower?" |
| `maps_plan_route` | Multi-stop optimized itinerary (Routes API waypoint optimization, up to 25 stops) with drive-only avoid-tolls/highways controls | "Visit these 5 places efficiently without tolls" |
| `maps_compare_places` | Side-by-side comparison | "Which ramen shop near Shibuya?" |
| `maps_local_rank_tracker` | Local SEO grid rank tracking | "How does this dentist rank across the area?" |

---

## Known API Limitations

| Tool | Limitation | Workaround |
|------|-----------|------------|
| `maps_weather` | Unsupported regions: Japan, China, South Korea, Cuba, Iran, North Korea, Syria | Use web search for weather in these regions |
| `maps_distance_matrix` | Transit mode may return null in some regions | Fall back to `driving` or `walking` mode, or use `maps_directions` for transit |
| `maps_plan_route` | Transit mode does not support waypoint optimization | Set `optimize: false` for transit mode |
| `maps_air_quality` | Works globally including Japan (unlike weather) | — |

---

## Invocation

```bash
npx -y @cablate/mcp-google-map exec <tool> '<json_params>'
```

- **API Key**: Set `GOOGLE_MAPS_API_KEY` in the environment. The `-k` flag also works, but may expose the key in shell history or process listings. If no key is available, ask the user to configure one; do not invent results.
- **Output**: Successful calls return JSON on stdout. A failed call exits nonzero with error details on stderr; report the failure rather than treating it as map data.
- **Stateless**: each call is independent
- **Tool names**: CLI accepts both `maps_geocode` and `geocode` short forms

---

## When to Update This Skill

| Trigger | What to update |
|---------|----------------|
| New tool added to the package | Tool Map table + references/tools-api.md |
| Tool parameters changed | references/tools-api.md |
| New chaining pattern discovered in practice | references/tools-api.md chaining section |

---

## Reference

| File | Content | When to read |
|------|---------|--------------|
| `references/tools-api.md` | Full parameter specs, response formats, 7 scenario recipes, and decision guide | When you need exact parameters, response shapes, or multi-tool workflow patterns |
| `references/travel-planning.md` | Travel planning methodology — 6-layer model, Search Along Route, anti-patterns | When planning multi-day trips — **read before Recipe 1** |
| `references/local-seo.md` | Local SEO / Google Business Profile ranking analysis — competitor audit, keyword landscape, gap analysis | When analyzing business rankings, comparing competitors, or scouting locations |
| `references/content-attribution.md` | Google Maps content attribution, source links, AI disclosure, and storage limits | Before presenting reviews, photos, or AI summaries from Places |

> For **project development** knowledge (architecture, API guide, GIS domain, design decisions), see `skills/project-docs/SKILL.md`.
