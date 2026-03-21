# mcp-google-map Backlog & Strategy

> Consolidated: 2026-03-20
> Source: dev-roadmap-spec.md, strategy-todo.md, mcp-google-map-growth-strategy-2026.md (all retired)
> Current state: v0.0.44, 17 tools, ~192+ GitHub stars

This file contains ONLY items that have NOT been implemented and strategic insights that remain relevant. All completed items have been removed.

---

## Backlog: Features

### MCP Prompt Templates (from dev-roadmap-spec P1)

**Status**: Not started | **Effort**: ~6hr

MCP Prompts 讓 Claude Desktop / Cursor 使用者一鍵進入 geo agent 模式，不需要讀文件。

```typescript
// 3 prompts to register in BaseMcpServer.ts:
{
  name: "travel-planner",
  description: "Plan a trip with geo tools",
  arguments: [
    { name: "destination", required: true },
    { name: "duration", required: false },
    { name: "style", required: false }  // budget, luxury, foodie
  ]
},
{
  name: "neighborhood-scout",
  description: "Analyze a location for living/working",
  arguments: [
    { name: "location", required: true },
    { name: "priorities", required: false }  // schools, transit, restaurants
  ]
},
{
  name: "route-optimizer",
  description: "Optimize a multi-stop route",
  arguments: [
    { name: "stops", required: true },
    { name: "mode", required: false }
  ]
}
```

Implementation: `BaseMcpServer.ts` 加 `prompts` capability，Prompt 內容從 `tools-api.md` Scenario Recipes 提取。

### Geo-Reasoning Benchmark (from dev-roadmap-spec P2)

**Status**: Not started | **Effort**: Phase 1 ~2 weeks

10 scenarios (Easy 2 + Medium 3 + Hard 3 + Expert 2), 5 metrics (Tool Selection Accuracy, Parameter Correctness, Chain Efficiency, Result Quality, Latency).

Key metric — **Composite Tool Efficiency Score (CES)**:
```
CES = min_required_calls / actual_calls_made
```

Marketing angle: "Without geo tools: 4% success (MIT TravelPlanner). With mcp-google-map: 87%+"

Phase 1: 5 YAML scenarios + automated evaluator + README results table
Phase 2: 全 10 scenarios + LLM-as-Judge + multi-LLM comparison

### Geo Agent Scaffold (from strategy-todo Backlog)

**Status**: Not started | **Effort**: TBD

Pre-built agent prompt template — 「你是一個旅遊規劃專家，你有以下地理工具...」。讓人可以一行指令啟動 geo-aware AI agent。

### maps_isochrone (from dev-roadmap-spec P3)

**Status**: Deprioritized | **Effort**: ~8hr

Google 沒有 isochrone API。最佳路徑：Distance Matrix 8 方向探測 + static map 畫 approximated polygon。ROI 目前不夠，待有明確需求再做。

---

## Backlog: Growth & Marketing

### Pending Submissions (manual)

| Platform | Type | Status |
|---|---|---|
| pulsemcp.com | Web form | Not submitted |
| mcpservers.org | Web form | Not submitted |
| mcp.so | Web form | Not submitted |
| mcpmarket.com | Web form | Not submitted |
| mcpserverfinder.com | Web form | Not submitted |
| Cline Marketplace | PR to `cline/mcp-marketplace` | Not submitted |

### Content Marketing (not started)

| Item | Effort | Notes |
|---|---|---|
| Blog post / Dev.to article | Medium | "Why your AI agent needs geospatial capabilities" |
| Demo video (30-60 sec) | Medium | Screen recording of Claude Code + mcp-google-map trip planning |
| Twitter/X launch campaign | Low | Needs demo video first |
| HN "Show HN" post | Low | README ready, can execute anytime |

---

## Strategic Insights (still relevant)

### Competitive Positioning

**vs Google Grounding Lite (official MCP)**:
- Grounding Lite: 3 tools, managed hosting, no API key needed, experimental
- Us: 17 tools, self-hosted, full control, Agent Skill, exec CLI
- Key gaps they have that we don't: none anymore (we added weather, timezone, air quality)
- Key things we have that they don't: geocoding, directions, elevation, distance matrix, place details, batch geocode, composite tools, Agent Skill

**vs Mapbox MCP (315 stars)**:
- Mapbox: 20+ tools, offline Turf.js, TSP, Isochrone, separate Agent Skills repo
- Us: Google Maps API (larger user base), Skills embedded in npm package, exec CLI, MIT

**vs baidu-maps/mcp (411 stars)**:
- China market only, not direct competition internationally

### MCP + Agent Skills Ecosystem

- Agent Skills 已是跨平台標準（Claude Code, VS Code, OpenAI Codex, Cursor, Gemini CLI）
- AAIF (Linux Foundation): Anthropic, Google, Microsoft, OpenAI 共同治理
- Anthropic 的 anthropics/skills (92.9k stars) 目前沒有任何 geo/maps skill — 空白機會
- 我們的 `skills/google-maps/` 已 90% 符合 skillpm 格式
- PR #644 已提交到 anthropics/skills

### Geo-AI Market Signals

- Google "Ask Maps" (2026-03-12): Gemini 驅動的對話式地圖搜尋，驗證賽道
- MIT 研究：LLM 無 tool 輔助時旅行規劃成功率只有 ~4%
- 62% 年輕旅客已用 AI 工具做旅行規劃
- ChatGPT 沒有原生 Maps 整合 — MCP 填補空白
- UPS 每減少一英里/司機/天 = $50M/年 savings

### Our Moat (validated)

| Type | Advantage |
|---|---|
| Technical | StreamableHTTP multi-tenant, per-session API key, Tool Annotations |
| Design | Agent Skill (教 AI 怎麼思考地理問題), exec CLI, chaining patterns |
| Market | Google Maps category leader (192 vs #2 at 14), npm user base |

### High-Value Use Case Tiers (for marketing/positioning)

**Tier 1 (huge market + perfect tool coverage)**:
- Real estate analysis ($47T market)
- Logistics multi-stop optimization ($200B+)
- B2B field sales optimization
- E-commerce delivery estimation ($6.3T)

**Tier 2 (large market + good coverage)**:
- Data enrichment (CSV batch geocoding, $15B+)
- Disaster response ($30B+)
- Content creation (travel/city guides, $600B+)
- Accessible route planning (61M disabled users)

### README / Marketing Playbook

Key elements proven to work (from Figma 13.7k, Playwright 28.8k, Serena 21.5k analysis):
1. One-click install badges (Playwright) — already partially done
2. GitHub-native video demo (Serena) — NOT DONE
3. 3-bullet value proposition (Serena) — done in current README
4. Star History chart — done
5. vs comparison table (Playwright) — done (vs Grounding Lite)
6. GitHub alert boxes `[!TIP]` (Serena) — done

Still missing:
- Demo video (highest ROI remaining item)
- User testimonials / community feedback section

### Growth Projections (research-backed)

| Milestone | Timeline | Driver |
|---|---|---|
| 300+ stars | 2-4 weeks | Registry submissions + content |
| 500+ stars | 1-2 months | HN/Reddit + blog post |
| 1,000+ stars | 3-4 months | Sustained content + community |

Reference: HN front page averages +121 stars/24hr (median much lower). First 1000 is hardest, then organic discovery accelerates.

---

## Decided Not To Build

| Item | Reason | Source |
|---|---|---|
| maps_validate_address | $17/1000 too expensive, backend-only use case, geocode covers 60% | dev-roadmap-spec |
| Spatial Context / Memory | Claude conversation history already solves this, composite tools reduce chaining | dev-roadmap-spec |
| Language parameter for all tools | Existing behavior sufficient, deprioritized | strategy-todo |
