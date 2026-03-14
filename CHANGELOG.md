# Changelog

## 0.0.34

- docs: sync all tool references to 13 tools + add tool change checklist (#45)


## 0.0.33

- feat: add composite tools — explore-area, plan-route, compare-places (#44)
- refactor!: unify tool namespace to maps_* prefix (#43)


## 0.0.32

- feat: add maps_timezone and maps_weather tools (#42)


## 0.0.31

- docs: rewrite README header with value proposition and comparison table (#41)


## 0.0.30

- fix: make release workflow resilient to version desync (#40)


## 0.0.29

- fix: sync version to 0.0.28 to match npm (#39)
- fix: add concurrency to release workflow to prevent race conditions (#38)
- feat: auto-publish to MCP Registry on release (#37)
- chore: update descriptions, server.json version, add CLAUDE.md (#36)


## 0.0.27

- chore: align skill frontmatter to agentskills.io spec (#35)


## 0.0.26

- feat: add stdio transport support + MCP Registry metadata


## 0.0.25

- chore: add agent-skill keywords + ship skills/ in npm package


## 0.0.24

- feat: add exec CLI subcommand + agent skill definition (#33)


## 0.0.23

- chore: remove test-new-api.js, update README security section


## 0.0.22

- feat: Places API migration + search_places tool + tool descriptions (#32)


## 0.0.21

- Migrated from deprecated `server.tool()` to `server.registerTool()` API for MCP SDK v1.27+ compatibility
- Added MCP Tool Annotations to all tools — clients can now auto-approve read-only, non-destructive API queries without user confirmation
- Improved Google Maps API error messages with actionable guidance (e.g. HTTP 403 now suggests enabling the Places API, HTTP 429 links to quota settings)
- Added CI workflow for automated build, lint, and smoke tests on pull requests
- Added release workflow for automated npm publishing on merge to main
- Added ESLint 9 flat config with TypeScript and Prettier integration
- Added smoke test suite for annotations, multi-tool E2E, and concurrent session validation

## 0.0.20

- Upgraded `@modelcontextprotocol/sdk` from ^1.11.0 to ^1.27.1 — fixes cross-client response data leakage between concurrent sessions (GHSA-345p-7cg4-v4c7, CVSS 7.1)
- Upgraded `zod` to ^3.25.0 (peer dependency of SDK v1.23+)
- Fixed multi-session crash by creating per-session McpServer instances in HTTP mode
- Added smoke test suite covering server init, tools/list, geocode, and concurrent sessions
- Pinned `@types/express` to v4

## 0.0.19

- Updated to Google's new Places API (New) to resolve HTTP 403 errors with the legacy API

## 0.0.18

- Standardized all error messages to English with more detailed information

## 0.0.17

- Added HTTP header authentication — API keys via `X-Google-Maps-API-Key` header
- Fixed concurrent user issues — each session uses its own API key
- Fixed npx execution module bundling issues
- Improved documentation with clearer setup instructions

## 0.0.14

- Added streamable HTTP transport support
- Improved CLI interface with emoji indicators
- Enhanced error handling and logging
- Added comprehensive tool descriptions for LLM integration
- Updated to latest MCP SDK version
