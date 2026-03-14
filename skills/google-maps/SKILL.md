---
name: google-maps
description: Geospatial query capabilities — geocoding, nearby search, routing, place details, elevation. Trigger when the user mentions locations, addresses, coordinates, navigation, "what's nearby", "how to get there", distance/duration, or any question that inherently involves geographic information — even if they don't explicitly say "map". Update when new tools are added or tool parameters change.
license: MIT
version: 0.0.25
compatibility:
  - claude-code
  - cursor
  - vscode-copilot
  - openai-codex
  - gemini-cli
---

# Google Maps - Geospatial Query Capabilities

## Overview

Gives an AI Agent the ability to reason about physical space — understand locations, distances, routes, and elevation, and naturally weave that information into conversation.

Without this Skill, the agent can only guess or refuse when asked "how do I get from Taipei 101 to the National Palace Museum?". With it, the agent returns exact coordinates, step-by-step routes, and travel times.

---

## Core Principles

| Principle | Explanation |
|-----------|-------------|
| Chain over single-shot | Most geo questions require 2-5 tool calls chained together. See Scenario Recipes in references/tools-api.md for the full patterns. |
| Match recipe to intent | Map the user's question to a recipe (Trip Planning, Local Discovery, Route Comparison, Neighborhood Analysis, Multi-Stop, Place Comparison, Along the Route) before calling any tool. |
| Precise input saves trouble | Use coordinates over address strings when available. Use place_id over name search. More precise input = more reliable output. |
| Output is structured | Every tool returns JSON. Use it directly for downstream computation or comparison — no extra parsing needed. |
| Present as tables | Users prefer comparison tables and scorecards over raw JSON. Format results for readability. |

---

## Tool Map

13 tools in four categories — pick by scenario:

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

### Environment
| Tool | When to use | Example |
|------|-------------|---------|
| `elevation` | Query altitude | "Elevation profile along this hiking trail" |
| `timezone` | Need local time at a destination | "What time is it in Tokyo?" |
| `weather` | Weather at a location (current or forecast) | "What's the weather in Paris?" |

### Composite (one-call shortcuts)
| Tool | When to use | Example |
|------|-------------|---------|
| `explore-area` | Overview of a neighborhood | "What's around Tokyo Tower?" |
| `plan-route` | Multi-stop optimized itinerary | "Visit these 5 places efficiently" |
| `compare-places` | Side-by-side comparison | "Which ramen shop near Shibuya?" |

---

## Invocation

```bash
npx @cablate/mcp-google-map exec <tool> '<json_params>' [-k API_KEY]
```

- **API Key**: `-k` flag or `GOOGLE_MAPS_API_KEY` environment variable
- **Output**: JSON to stdout, errors to stderr
- **Stateless**: each call is independent

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
