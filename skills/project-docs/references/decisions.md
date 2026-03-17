# Architecture Decision Records — mcp-google-map

> Format: Decision / Context / Rationale
> Sources: dev-roadmap-spec.md, CLAUDE.md, project history

---

## ADR-001: Unified `maps_` Prefix for All Tool Names

**Decision**: All tools are named with the `maps_` prefix (e.g., `maps_geocode`, `maps_search_nearby`). This was applied as a breaking change when the namespace was standardized.

**Context**: Early tool names were inconsistent — some had prefixes, some did not. As the tool count grew and the server was listed on MCP registries, namespace collisions with other MCP servers became a concern. Claude's tool selection also benefits from a clear namespace signal.

**Rationale**:
- Consistent namespace prevents collision when multiple MCP servers are active simultaneously.
- The `maps_` prefix gives Claude a strong disambiguation signal — it knows these tools are geospatial without reading descriptions.
- Breaking change was accepted early (pre-stable) to avoid accumulating technical debt. All 9 files in the Tool Change Checklist must be updated together on any rename.

---

## ADR-002: `compare_places` Retained as a Composite Tool

**Decision**: `maps_compare_places` is a single tool that internally fetches details for multiple places and returns a structured comparison. It is not decomposed into atomic `place_details` calls that the AI chains together.

**Context**: An alternative design would have the AI call `maps_place_details` N times and synthesize the comparison itself. During testing, this produced inconsistent output quality and required users to explicitly orchestrate the chain.

**Rationale**:
- Users ask "compare these restaurants" and expect a comparison table, not raw data to synthesize.
- Composite tools reduce chaining overhead and produce deterministic, structured output.
- The Geo-Reasoning Benchmark (GRB) validates this: Composite Efficiency Score (CES) rewards using 1 call instead of N calls. `compare_places` is the reference case for this metric.
- User preference confirmed: users do not want to manually chain atomic calls for comparison tasks.

---

## ADR-003: `maps_weather` and `maps_air_quality` as Separate Tools

**Decision**: Weather and air quality are exposed as two independent tools, not combined into a single `maps_environment` tool.

**Context**: A natural grouping might combine weather and air quality into one "environmental conditions" call. Both return ambient data about a location.

**Rationale**:
- **Different APIs**: Weather uses one endpoint; Air Quality uses `POST https://airquality.googleapis.com/v1/currentConditions:lookup` — a completely separate Google service requiring separate API enablement.
- **Different geographic coverage**: Weather API does not support Japan. Air Quality API fully supports Japan (including AEROS local index). Combining them would require complex conditional logic and mislead users about availability.
- **Different data structures and use cases**: Weather is for planning (will it rain?). Air quality is for health decisions (should I wear a mask? can elderly parents go outside?). The 7-demographic health recommendation field in air quality has no analogue in weather.
- **Independent billing**: Separate pricing makes cost attribution cleaner.

---

## ADR-004: `maps_isochrone` Not Built

**Decision**: Isochrone generation (travel-time polygons) is excluded from the roadmap, marked as "Skip for now."

**Context**: Isochrones are a commonly requested GIS feature — "show me everywhere I can reach in 30 minutes." They are valuable for real estate analysis, event planning, and accessibility research.

**Rationale**:
- **Google has no native isochrone API.** All alternative implementations have disqualifying problems:
  - Mapbox Isochrone API: mature, but introduces a second vendor (Mapbox key) alongside Google — breaks the single-provider positioning.
  - OpenRouteService: free but rate-limited and stability uncertain for production use.
  - Distance Matrix grid approximation: 24+ API calls per isochrone at ~$0.12/request; prohibitively expensive and low-accuracy.
- **Core value is visual**: An isochrone polygon is only meaningful when rendered on a map. Without `maps_static_map` to display it, returning raw GeoJSON coordinates is not useful to AI or users. The feature was deprioritized until static map rendering was in place.
- **Revisit path**: If built later, the best approach is Distance Matrix 8-direction probing + `maps_static_map` to render an approximated polygon. Estimated effort: 8 hours.

---

## ADR-005: `maps_validate_address` Not Built

**Decision**: Address validation (checking if a postal address is deliverable) is excluded from the tool set.

**Context**: Google's Address Validation API provides USPS CASS-certified validation, deliverability flags, and address correction. It could theoretically be useful for any tool that takes address inputs.

**Rationale**:
- **Cost**: $17 per 1,000 requests — 3.4× the cost of standard geocoding. This is prohibitive for conversational AI use where users make casual address queries.
- **Wrong use case**: Address validation is designed for backend pipelines (e-commerce checkout, CRM deduplication, bulk mailing). It requires structured postal input and returns structured postal corrections — not a natural fit for natural-language AI conversations.
- **Coverage gap**: Only 38 countries supported; excludes most of Asia and Africa. A tool that silently fails for Tokyo or Mumbai addresses would create confusing UX.
- **Existing alternative**: `maps_geocode` already handles 60% of "is this address valid?" scenarios by returning whether a geocode succeeded and providing the `formatted_address` canonical form.

---

## ADR-006: Spatial Context / Session Memory Not Built

**Decision**: There is no persistent spatial context or session memory layer in the MCP server. The server does not remember previously queried locations or build a "current location" state across calls.

**Context**: A proposed feature was to maintain implicit state — if a user asks "find coffee shops" after previously mentioning "I'm in Shinjuku," the server would remember Shinjuku and use it as the implicit location for the next search.

**Rationale**:
- **Claude's conversation history already solves this.** Claude reads its own prior messages and can extract previously mentioned locations. A server-side memory layer would duplicate capability that already exists in the LLM.
- **Composite tools reduce chaining need.** Tools like `maps_explore_area` and `maps_plan_route` accept multi-intent inputs that would otherwise require chaining with location state.
- **Implementation risks outweigh benefits**:
  - Implicit state leakage: state from one user's session could bleed into another in concurrent scenarios.
  - Debugging opacity: errors become harder to trace when the server has hidden state.
  - stdio transport has no session concept — each stdio connection is stateless by design.
- **User value assessed at 3/10.** In testing, users could not perceive a meaningful difference. The friction of unexpected state (wrong implicit location) outweighed the convenience.

---

## ADR-007: stdio as Primary Transport

**Decision**: The MCP server uses stdio (standard input/output) as its primary transport mechanism. HTTP/SSE is secondary.

**Context**: MCP servers can expose transport via stdio (subprocess model) or HTTP+SSE (network server model). Both are valid per the MCP specification.

**Rationale**:
- **MCP Registry requirement**: The official MCP registry and most client integrations (Claude Desktop, Claude Code, Cursor) prefer or require stdio-based servers for local installation.
- **Security model**: stdio servers run as a subprocess of the client, inheriting the client's trust context. No network port exposure, no authentication complexity.
- **Deployment simplicity**: `npx mcp-google-map` works out of the box without configuring ports, firewalls, or SSL.
- **Statelessness aligns with stdio**: Each stdio connection represents one session. This reinforces ADR-006 (no spatial context) — the transport model naturally discourages stateful designs.

---

## ADR-008: Search Along Route Uses Direct REST Calls

**Decision**: The "search along route" capability calls the Google Maps REST API directly rather than using the official `@googlemaps/google-maps-services-js` client library.

**Context**: Most tools in this project use the official client library for consistency and type safety. The route-based search requires fetching a polyline and then querying points along it — a pattern not natively supported by the client library.

**Rationale**:
- **Client library may not expose the required parameters or patterns** for buffered route searches. The REST API is always the source of truth; the client library is a convenience wrapper.
- **Direct REST calls are straightforward**: for GET requests with query parameters, `axios` or `fetch` is sufficient and keeps the implementation explicit.
- **Type safety can be maintained** by defining TypeScript interfaces for the REST response shapes — same outcome as using the library, without library constraints.
- This is an exception to the general project preference for the client library, justified by the specific technical requirement.

---

## ADR-009: MCP Prompt Templates Removed

**Decision**: MCP Prompt Templates (slash commands like `/travel-planner`) were evaluated and ultimately not shipped as a feature.

**Context**: The roadmap spec (P1-1) proposed implementing MCP's `prompts` primitive to expose slash commands in clients like Claude Desktop. The intended value was giving non-technical users a one-click entry into geo agent mode.

**Rationale**:
- **Client support is low and inconsistent.** As of evaluation, most MCP clients either do not render prompt templates as slash commands or render them inconsistently. The feature would benefit a small fraction of users.
- **SKILL.md already covers the use case** for Claude Code users — the skill system provides rich scenario guidance, chaining patterns, and example recipes that go beyond what prompt templates support.
- **Maintenance cost**: Prompt template content would need to stay in sync with tool capabilities, adding to the already-significant 9-file update checklist (CLAUDE.md ADR).
- **Revisit condition**: If MCP client support for prompts reaches broad adoption (Claude Desktop, VS Code extension, Cursor all render them consistently), this should be reconsidered. The 6-hour implementation estimate is low.

---

## ADR-010: Travel Planning Uses "Tool-Driven Diffusion," Not AI Prior Knowledge

**Decision**: Travel planning workflows are designed so the AI discovers ground truth by calling tools, not by relying on training-data knowledge of specific places, hours, or transit schedules.

**Context**: An AI could answer "what time does Kinkaku-ji open?" from training data. It could suggest a Tokyo itinerary without any tool calls based on memorized "best of Tokyo" patterns. This is faster but fragile.

**Rationale**:
- **Training data goes stale.** Business hours change, places close, new venues open. A tool call to `maps_place_details` returns current data; training knowledge reflects a past snapshot.
- **Specificity requires data.** A user asking for restaurants near their hotel requires the actual hotel coordinates, not generic neighborhood knowledge. The tool call chain (geocode hotel → search nearby → get details) produces a personalized result that training data cannot replicate.
- **Verifiability and trust.** When the AI cites data from a tool response (e.g., "Fushimi Inari opens at 6 AM according to Google Maps"), users can verify the source. When it speaks from training data, there is no audit trail.
- **The SKILL.md geo-domain knowledge** (temple hours, transit rules, energy curves) is intentionally at the *pattern* level — it tells the AI *how* to plan, not *what* specific facts are. The facts come from tools. This separation is the core design principle.
- Practical implementation: always geocode place names (don't assume coordinates), always fetch operating hours from `maps_place_details` (don't assume 9–5), always calculate transit time with `maps_directions` (don't estimate from distance).
