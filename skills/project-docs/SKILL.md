---
name: mcp-google-map-project
description: Project knowledge for developing and maintaining @cablate/mcp-google-map. Architecture, Google Maps API guide, GIS domain knowledge, and design decisions. Read this skill to onboard onto the project or make informed development decisions.
version: 0.0.1
compatibility:
  - claude-code
  - cursor
  - vscode-copilot
---

# mcp-google-map — Project Knowledge

## Overview

This skill contains everything needed to develop, maintain, and extend the `@cablate/mcp-google-map` MCP server. Reading these files gives you full context on architecture, API specifics, domain knowledge, and the reasoning behind design decisions.

For the **agent skill** (how to USE the tools), see `skills/google-maps/SKILL.md`.

---

## Quick Orientation

| Aspect | Summary |
|--------|---------|
| **What** | MCP server providing Google Maps tools for AI agents |
| **Stack** | TypeScript, Node.js, Express, MCP SDK, Zod |
| **Tools** | 17 tools (14 atomic + 3 composite) |
| **Transports** | stdio, Streamable HTTP, standalone exec CLI |
| **APIs** | Places API (New), Directions, Geocoding, Elevation, Timezone, Weather, Air Quality, Static Maps, Search Along Route |

---

## Reference Files

| File | Content | When to read |
|------|---------|--------------|
| `references/architecture.md` | System architecture, 3-layer design, transport modes, tool registration flow, 9-file checklist, code map | **Start here** when onboarding. Also read when adding new tools. |
| `references/google-maps-api-guide.md` | All Google Maps API endpoints used, pricing, coverage limits, rate limits, common gotchas, Places New vs Legacy | When debugging API errors, evaluating new APIs, or checking costs |
| `references/geo-domain-knowledge.md` | GIS fundamentals — coordinates, distance, geocoding, place types, spatial search, map projection, Japan-specific knowledge | When making tool design decisions that involve geographic concepts |
| `references/decisions.md` | 10 Architecture Decision Records (ADR) with context and rationale | When asking "why was X built this way?" or considering changes to existing design |

---

## How to Add a New Tool

See `references/architecture.md` § "9-File Tool Change Checklist" for the complete procedure. Summary:

1. Create `src/tools/maps/<toolName>.ts` (NAME, DESCRIPTION, SCHEMA, ACTION)
2. Register in `src/config.ts`
3. Add exec case in `src/cli.ts`
4. Add to `tests/smoke.test.ts` (expectedTools + API call test)
5. Update `README.md` (count + table + exec list + project structure)
6. Update `skills/google-maps/SKILL.md` (Tool Map)
7. Update `skills/google-maps/references/tools-api.md` (params + chaining)
8. Check `server.json` and `package.json` descriptions

---

## When to Update This Skill

| Trigger | What to update |
|---------|----------------|
| Architecture change | `references/architecture.md` |
| New Google Maps API integrated | `references/google-maps-api-guide.md` |
| New design decision made | `references/decisions.md` (add ADR) |
| New GIS concept relevant to tools | `references/geo-domain-knowledge.md` |
