---
name: google-maps
description: Geospatial query capabilities — geocoding, nearby search, routing, place details, elevation. Trigger when the user mentions locations, addresses, coordinates, navigation, "what's nearby", "how to get there", distance/duration, or any question that inherently involves geographic information — even if they don't explicitly say "map".
---

# Google Maps - Geospatial Query Capabilities

## Overview

Gives an AI Agent the ability to reason about physical space — not just "look up a map", but understand locations, distances, routes, and elevation, and naturally weave that information into conversation.

Without this Skill, the agent can only guess or refuse when asked "how do I get from Taipei 101 to the National Palace Museum?". With it, the agent returns exact coordinates, step-by-step routes, and travel times.

---

## Core Principles

| Principle | Explanation |
|-----------|-------------|
| Chain over single-shot | Most geo questions require chaining: geocode → search-nearby → place-details. Think about the full pipeline when planning queries. |
| Precise input saves trouble | Use coordinates over address strings when available. Use place_id over name search. More precise input = more reliable output. |
| Output is structured | Every tool returns JSON. Use it directly for downstream computation or comparison — no extra parsing needed. |

---

## Tool Map

8 tools in three categories — pick by scenario:

### Place Discovery
| Tool | When to use | Example |
|------|-------------|---------|
| `geocode` | Have an address/landmark, need coordinates | "What are the coordinates of Tokyo Tower?" |
| `reverse-geocode` | Have coordinates, need an address | "What's at 35.65, 139.74?" |
| `search-nearby` | Know a location, find nearby places by type | "Coffee shops near my hotel" |
| `search-places` | Natural language place search | "Best ramen in Tokyo" |
| `place-details` | Have a place_id, need full info | "Opening hours and reviews for this restaurant?" |

### Routing & Distance
| Tool | When to use | Example |
|------|-------------|---------|
| `directions` | How to get from A to B | "Route from Taipei Main Station to the airport" |
| `distance-matrix` | Compare distances across multiple points | "Which of these 3 hotels is closest to the airport?" |

### Terrain
| Tool | When to use | Example |
|------|-------------|---------|
| `elevation` | Query altitude | "Elevation profile along this hiking trail" |

---

## Invocation

```bash
npx @cablate/mcp-google-map exec <tool> '<json_params>' [-k API_KEY]
```

- **API Key**: `-k` flag or `GOOGLE_MAPS_API_KEY` environment variable
- **Output**: JSON to stdout, errors to stderr
- **Stateless**: each call is independent

### Common Chaining Patterns

**Pattern 1: Search → Details**
```bash
# 1. Find places
exec search-places '{"query":"Michelin restaurants in Taipei"}'
# 2. Get details using place_id from results
exec place-details '{"placeId":"ChIJ..."}'
```

**Pattern 2: Geocode → Nearby Search**
```bash
# 1. Address to coordinates
exec geocode '{"address":"Taipei 101"}'
# 2. Search nearby using coordinates
exec search-nearby '{"center":{"value":"25.033,121.564","isCoordinates":true},"keyword":"cafe","radius":500}'
```

**Pattern 3: Multi-point Comparison**
```bash
# Compare multiple origins to multiple destinations in one call
exec distance-matrix '{"origins":["Taipei Main Station","Banqiao Station"],"destinations":["Taoyuan Airport","Songshan Airport"],"mode":"driving"}'
```

---

## Reference

| File | Content | When to read |
|------|---------|--------------|
| `references/tools-api.md` | Full parameter specs and response formats for all 8 tools | When you need exact parameter names, types, or response shapes |
