# Architecture Reference

## System Architecture Overview

Three-layer architecture with a shared entry point:

```
CLI / HTTP / stdio
       |
  BaseMcpServer          <- MCP protocol layer (tool registration, transport)
       |
  Tool ACTION()          <- thin dispatch, calls PlacesSearcher
       |
  PlacesSearcher         <- service facade (composition, filtering, response shaping)
      / \
GoogleMapsTools    NewPlacesService
(Legacy REST SDK)  (Places API New gRPC/REST client)
```

| Layer | Files | Responsibility |
|---|---|---|
| Entry | `src/cli.ts` | Parse CLI args, select transport mode, instantiate server |
| Protocol | `src/core/BaseMcpServer.ts` | Register tools, handle MCP sessions, route HTTP/stdio |
| Tool | `src/tools/maps/*.ts` | Declare NAME, DESCRIPTION, SCHEMA, ACTION |
| Config | `src/config.ts` | Assemble ToolConfig[], attach MAPS_TOOL_ANNOTATIONS |
| Facade | `src/services/PlacesSearcher.ts` | Orchestrate multi-step / composite tools |
| API client (legacy) | `src/services/toolclass.ts` | Wrap `@googlemaps/google-maps-services-js` SDK |
| API client (new) | `src/services/NewPlacesService.ts` | Wrap `@googlemaps/places` gRPC client |
| Auth | `src/utils/apiKeyManager.ts` | API key priority resolution |
| Context | `src/utils/requestContext.ts` | Per-request AsyncLocalStorage propagation |

---

## Transport Modes

| Mode | Entry | How to activate | Notes |
|---|---|---|---|
| **HTTP (Streamable)** | `cli.ts` → `BaseMcpServer.startHttpServer()` | default, or `--port` | Listens on `/mcp` (POST/GET/DELETE); sessions tracked by UUID header `mcp-session-id` |
| **stdio** | `cli.ts` → `BaseMcpServer.startStdio()` | `--stdio` flag | Used by Claude Desktop, Cursor; stdout reserved for JSON-RPC, all logs go to stderr |
| **exec CLI** | `cli.ts` → `execTool()` | `mcp-google-map exec <tool> '<json>'` | No MCP protocol; directly calls `PlacesSearcher` method and prints JSON to stdout; used for scripting/piping |

### HTTP Session Lifecycle

```
POST /mcp (no session-id, isInitializeRequest)
  -> create StreamableHTTPServerTransport
  -> create new McpServer, connect transport
  -> store in sessions[uuid]

POST /mcp (mcp-session-id header)
  -> reuse existing session context
  -> update apiKey if header present

DELETE /mcp (mcp-session-id header)
  -> terminate session, clean up transport
```

---

## Tool Registration Flow

```
src/tools/maps/weather.ts          exports Weather.{NAME, DESCRIPTION, SCHEMA, ACTION}
          |
src/config.ts                      builds ToolConfig[] array, attaches MAPS_TOOL_ANNOTATIONS
          |
src/cli.ts                         passes config.tools[] to new BaseMcpServer(name, tools)
          |
BaseMcpServer.createMcpServer()    calls server.registerTool(name, {description, inputSchema, annotations}, action)
          |
@modelcontextprotocol/sdk          exposes tool to MCP client
```

`MAPS_TOOL_ANNOTATIONS` applied to all tools:

```ts
{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
```

---

## API Key Management

Priority order (highest to lowest):

| Priority | Source | Header / Variable |
|---|---|---|
| 1 | HTTP request header | `X-Google-Maps-API-Key` |
| 2 | HTTP Authorization header | `Authorization: Bearer <key>` |
| 3 | Session-specific key | stored per `mcp-session-id` |
| 4 | CLI argument | `--apikey` / `-k` |
| 5 | Environment variable | `GOOGLE_MAPS_API_KEY` |
| 6 | `.env` file | loaded by `dotenv` at startup from `cwd` or package dir |

**Flow in HTTP mode**: `ApiKeyManager.getApiKey(req)` resolves key → stored in `SessionContext.apiKey` → propagated via `runWithContext()` (AsyncLocalStorage) → tool action reads from context or `process.env`.

**Flow in exec mode**: `--apikey` arg → directly passed to `new PlacesSearcher(apiKey)` constructor.

---

## Adding a New Tool — 9-File Checklist

From `CLAUDE.md`:

| # | File | What to update |
|---|---|---|
| 1 | `src/tools/maps/<toolName>.ts` | Define NAME, DESCRIPTION, SCHEMA, ACTION |
| 2 | `src/config.ts` | Add to `tools[]` array with annotations |
| 3 | `src/cli.ts` | Add to `EXEC_TOOLS` const + `switch` case in `execTool()` |
| 4 | `tests/smoke.test.ts` | Add to `expectedTools` array + update tool count assertions |
| 5 | `README.md` | Update tool count (header, comparison table, Server Info, exec mode) + Available Tools table + Project Structure |
| 6 | `skills/google-maps/SKILL.md` | Add row to Tool Map table |
| 7 | `skills/google-maps/references/tools-api.md` | Add parameter docs + chaining patterns |
| 8 | `server.json` | Update description if it mentions tool count |
| 9 | `package.json` | Update description if it mentions tool count |

Missing any file causes doc/behavior mismatch. Verify all before opening a PR.

---

## Code Map

| File | Purpose |
|---|---|
| `src/cli.ts` | CLI entry point — parses args, selects transport, dispatches exec mode |
| `src/config.ts` | Assembles ToolConfig[] array from all tool modules |
| `src/core/BaseMcpServer.ts` | MCP server core — tool registration, HTTP session management, stdio transport |
| `src/index.ts` | Package entry — exports Logger and re-exports public API |
| `src/services/PlacesSearcher.ts` | Service facade — orchestrates multi-step composite tools (planRoute, exploreArea, comparePlaces, searchAlongRoute) |
| `src/services/toolclass.ts` | Legacy Google Maps SDK wrapper — geocode, directions, distanceMatrix, elevation, timezone, weather, airQuality, staticMap |
| `src/services/NewPlacesService.ts` | Places API (New) client — searchNearby, searchText, getPlaceDetails via gRPC |
| `src/tools/maps/*.ts` | Individual tool definitions (17 files) — each exports NAME, DESCRIPTION, SCHEMA, ACTION |
| `src/utils/apiKeyManager.ts` | Singleton — resolves API key priority from headers / session / env |
| `src/utils/requestContext.ts` | AsyncLocalStorage — propagates API key within a single request lifecycle |
| `tests/smoke.test.ts` | Integration smoke tests — validates tool list, basic API calls |
