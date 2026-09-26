# MCP Google Maps

讓 AI 代理可靠地取得 Google Maps 地點搜尋、地址解析、路線、天氣、空氣品質與 Local SEO 資料。你可以安裝 Codex Plugin，讓代理直接呼叫 CLI；也可以透過 MCP 使用同一組 18 個工具。

<p align="center"><a href="./README.md">English</a> | <b>繁體中文</b></p>

<p align="center">
  <img src="./assets/banner.webp" alt="MCP Google Maps — AI 驅動的地理空間工具" width="800">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cablate/mcp-google-map"><img src="https://img.shields.io/npm/v/@cablate/mcp-google-map" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@cablate/mcp-google-map"><img src="https://img.shields.io/npm/dm/@cablate/mcp-google-map" alt="npm downloads"></a>
  <a href="https://github.com/cablate/mcp-google-map/stargazers"><img src="https://img.shields.io/github/stars/cablate/mcp-google-map?style=social" alt="GitHub stars"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/cablate/mcp-google-map" alt="license"></a>
</p>

<p align="center">
  <img src="./assets/demo-grid-zh.png" alt="旅行規劃展示 — 京都二日遊、東京戶外一日、日本五日、曼谷背包客" width="800">
</p>

- **18 個工具** — 14 個原子工具與 4 個高階工作流程
- **三種連接方式** — Codex Plugin、MCP stdio、Streamable HTTP
- **三個用途明確的 Skills** — 一般地圖、旅行規劃、Local SEO

## 選擇使用方式

| 你的需求 | 建議方式 | 實際執行方式 |
|---|---|---|
| 讓 Codex 回答地圖、旅行或 Local SEO 問題，不想設定 MCP | **Codex Plugin** | 符合需求的 Skill 按需載入，並直接呼叫 CLI |
| 在 Claude Desktop、Cursor、VS Code 或其他本機 MCP client 加入 Google Maps 工具 | **MCP stdio** | Client 啟動一個本機 MCP 程序 |
| 提供多 session 或遠端 MCP 存取 | **Streamable HTTP** | 自架 HTTP server，端點為 `/mcp` |

三種方式都需要 Node.js 18+ 與 Google Maps Platform API key。地點與路線工作流程還要先在 [Google Cloud Console](https://console.cloud.google.com) 啟用 **Places API (New)** 與 **Routes API**。實際 API 請求可能產生 Google 費用。

## 最快開始：Codex Plugin

```bash
codex plugin marketplace add cablate/mcp-google-map --ref main
codex plugin add mcp-google-map@cablate
```

在 Codex 的執行環境設定 `GOOGLE_MAPS_API_KEY`，重新開啟對話後直接提出地點問題。先用下列命令檢查本機環境，不會呼叫 Google API：

```bash
npx -y @cablate/mcp-google-map doctor
```

環境正確時，Node.js、套件與 API key 檢查會通過，`live-api` 會顯示略過。只有在你確定要送出可能計費的測試請求時，才使用 `doctor --live`。

Plugin **不會**啟動或註冊 MCP server。Codex 執行時先看到三個 Skill 的名稱與描述，只有請求符合時才載入完整指令：

- `google-maps` — 地點搜尋、地址解析、路線、區域與環境資訊
- `google-maps-travel-planning` — 單日與多日旅行行程
- `google-maps-local-seo` — 商家能見度與地理排名分析

完整的非 MCP 操作步驟見 [Agent Skill 示範](./examples/agent-skill-demo.md)。

### vs Google Grounding Lite

| | 本專案 | [Grounding Lite](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services) |
|---|---|---|
| 工具數 | **18** | 3 |
| 地理編碼 | 有 | 無 |
| 逐步導航 | 有 | 無 |
| 海拔查詢 | 有 | 無 |
| 距離矩陣 | 有 | 無 |
| 地點詳情 | 有 | 無 |
| 時區查詢 | 有 | 無 |
| 天氣查詢 | 有 | 有 |
| 空氣品質 | 有 | 無 |
| 地圖圖片 | 有 | 無 |
| 組合工具（探索、規劃、比較） | 有 | 無 |
| 開源 | MIT | 否 |
| 自架部署 | 有 | 僅 Google 託管 |
| Agent Skill | 有 | 無 |

### CLI 與 server 快速檢查

```bash
# stdio（Claude Desktop、Cursor 等）
npx @cablate/mcp-google-map --stdio

# exec CLI — 不需啟動 server
npx @cablate/mcp-google-map exec geocode '{"address":"台北101"}'

# HTTP server
npx @cablate/mcp-google-map --port 3000 --apikey "YOUR_API_KEY"
```

## 特別感謝

感謝 [@junyinnnn](https://github.com/junyinnnn) 協助實作 `streamablehttp` 支援。

## 可用工具

| 工具 | 說明 |
|------|------|
| `maps_search_nearby` | 依類型搜尋附近地點（餐廳、咖啡廳、飯店等），支援半徑、評分、營業中篩選 |
| `maps_search_places` | 自然語言地點搜尋（如「東京拉麵」），支援位置偏好、評分、營業中篩選 |
| `maps_place_details` | 以 place_id 取得地點完整資訊 — 評論、電話、網站、營業時間。可選 `maxPhotos` 參數取得照片 URL。 |
| `maps_geocode` | 將地址或地標名稱轉換為 GPS 座標 |
| `maps_reverse_geocode` | 將 GPS 座標轉換為街道地址 |
| `maps_distance_matrix` | 計算多個起點與終點間的旅行距離和時間 |
| `maps_directions` | 取得兩點間的逐步導航路線 |
| `maps_elevation` | 查詢地理座標的海拔高度（公尺） |
| `maps_timezone` | 查詢座標的時區 ID、名稱、UTC/DST 偏移量和當地時間 |
| `maps_weather` | 查詢當前天氣或預報 — 溫度、濕度、風速、紫外線、降水 |
| `maps_air_quality` | 查詢空氣品質指數、污染物濃度，以及各族群健康建議 |
| `maps_static_map` | 產生帶標記、路徑或路線的地圖圖片 — 直接內嵌在對話中 |
| `maps_batch_geocode` | 一次地理編碼最多 50 個地址 |
| `maps_search_along_route` | 搜尋兩點間路線沿途的地點 — 依最小繞路時間排序 |
| **組合工具** | |
| `maps_explore_area` | 一次呼叫探索某地周邊 — 搜尋多種地點類型並取得詳情 |
| `maps_plan_route` | 規劃最佳化多站路線 — 地理編碼、最佳順序、回傳導航 |
| `maps_compare_places` | 並排比較地點 — 搜尋、取得詳情，可選計算距離 |
| `maps_local_rank_tracker` | 地理網格排名追蹤（類似 LocalFalcon）— 支援最多 3 個關鍵字批量掃描，回傳 ARP、ATRP、SoLV 指標 |

所有工具標註 `readOnlyHint: true` 和 `destructiveHint: false` — MCP 客戶端可自動核准，無需使用者確認。

> **前置條件**：使用地點與路線相關工具前，請在 [Google Cloud Console](https://console.cloud.google.com) 啟用 **Places API (New)** 與 **Routes API**。

## 安裝

[最快開始](#最快開始codex-plugin)已說明 Codex Plugin。只有在你確定需要 MCP 時，才選擇下列其中一種設定。

### MCP stdio（本機 client 推薦）

適用於 Claude Desktop、Cursor、VS Code 及任何支援 stdio 的 MCP 客戶端：

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "npx",
      "args": ["-y", "@cablate/mcp-google-map", "--stdio"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**減少上下文用量** — 如果只需要部分工具，設定 `GOOGLE_MAPS_ENABLED_TOOLS` 限制註冊的工具：

```json
{
  "env": {
    "GOOGLE_MAPS_API_KEY": "YOUR_API_KEY",
    "GOOGLE_MAPS_ENABLED_TOOLS": "maps_geocode,maps_directions,maps_search_places"
  }
}
```

不設定或設為 `*` 即啟用全部 18 個工具（預設）。

### Streamable HTTP

適用於多 session 部署、per-request API key 隔離或遠端存取：

```bash
npx @cablate/mcp-google-map --port 3000 --apikey "YOUR_API_KEY"

# 綁定所有網路介面以支援遠端存取（例如 Docker、區域網路）
npx @cablate/mcp-google-map --host 0.0.0.0 --port 3000 --apikey "YOUR_API_KEY"
```

然後設定你的 MCP 客戶端：

```json
{
  "mcpServers": {
    "google-maps": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Server 資訊

- **傳輸方式**：stdio（`--stdio`）或 Streamable HTTP（預設）
- **工具數**：18 個 Google Maps 工具（14 原子 + 4 組合）— 可透過 `GOOGLE_MAPS_ENABLED_TOOLS` 篩選

### CLI Exec 模式（Agent Skill）

不啟動 MCP server，直接使用工具：

```bash
npx @cablate/mcp-google-map exec geocode '{"address":"台北101"}'
npx @cablate/mcp-google-map exec search-places '{"query":"東京拉麵"}'
```

全部 18 個工具可用：`geocode`、`reverse-geocode`、`search-nearby`、`search-places`、`place-details`、`directions`、`distance-matrix`、`elevation`、`timezone`、`weather`、`air-quality`、`static-map`、`batch-geocode-tool`、`search-along-route`、`explore-area`、`plan-route`、`compare-places`、`local-rank-tracker`。Skill 定義與完整參數文件見 [`skills/`](./skills/)。

若要**不透過 MCP、只用 Agent Skill**：

1. 依你的代理工具說明，將整個 [`skills/`](./skills/) 目錄樹安裝到它的 Skills 目錄；三個 Skill 資料夾與 `_shared/` 必須放在一起，跨 Skill 參考才會正常解析。除非透過 Plugin Marketplace 安裝，否則只安裝 npm 套件不會自動把 Skill 註冊到代理工具。
2. 讓代理工具可使用 Node.js 18+、`npx`，並在其環境設定 `GOOGLE_MAPS_API_KEY`。建議使用環境變數；`--apikey` 可能讓金鑰出現在 shell 歷史或程序清單。
3. 直接向代理工具提問地點問題。Skill 會引導它呼叫獨立 CLI，例如 `npx -y @cablate/mcp-google-map exec geocode '{"address":"台北101"}'`；不必啟動 MCP server 或設定 MCP client。

先執行 `npx -y @cablate/mcp-google-map doctor`，即可在不呼叫 Google API、不產生 API 費用的情況下檢查本機準備狀態。告知使用者測試請求可能產生 Google Maps Platform 費用後，可用 `doctor --live` 分別驗證 Geocoding、Places API (New) 與 Routes API。

完整的非 MCP 操作步驟見 [Agent Skill 示範](./examples/agent-skill-demo.md)。若代理工具或應用程式會呈現 Places 評論、照片或 AI 摘要，請遵照[內容署名與保存指引](./skills/_shared/content-attribution.md)；工具會保留來源及揭露欄位，但不會替你的介面完成署名呈現。

### 批次地理編碼

從檔案批次地理編碼：

```bash
npx @cablate/mcp-google-map batch-geocode -i addresses.txt -o results.json
cat addresses.txt | npx @cablate/mcp-google-map batch-geocode -i -
```

輸入：每行一個地址。輸出：JSON `{ total, succeeded, failed, results[] }`。預設並行度：20。

### API Key 設定

API key 可透過三種方式提供（優先順序）：

1. **HTTP Headers**（最高優先）

   ```json
   {
     "mcp-google-map": {
       "transport": "streamableHttp",
       "url": "http://localhost:3000/mcp",
       "headers": {
         "X-Google-Maps-API-Key": "YOUR_API_KEY"
       }
     }
   }
   ```

2. **命令列參數**

   ```bash
   mcp-google-map --apikey YOUR_API_KEY
   ```

3. **環境變數**（.env 檔案或命令列）
   ```env
   GOOGLE_MAPS_API_KEY=your_api_key_here
   MCP_SERVER_PORT=3000
   MCP_SERVER_HOST=0.0.0.0
   ```

## 開發

### 本地開發

```bash
# 複製專案
git clone https://github.com/cablate/mcp-google-map.git
cd mcp-google-map

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 填入你的 API key

# 建置專案
npm run build

# 啟動 server
npm start

# 或以開發模式執行
npm run dev
```

### 測試

```bash
# 執行 smoke tests（基本測試不需要 API key）
npm test

# 執行完整 E2E 測試（需要 GOOGLE_MAPS_API_KEY）
npm run test:e2e
```

### 專案結構

```
src/
├── cli.ts                        # CLI 進入點
├── config.ts                     # 工具註冊與 server 設定
├── index.ts                      # 套件匯出
├── core/
│   └── BaseMcpServer.ts          # MCP server（streamable HTTP 傳輸）
├── services/
│   ├── NewPlacesService.ts       # Google Places API (New) 客戶端
│   ├── PlacesSearcher.ts         # Service facade 層
│   └── toolclass.ts              # Legacy Google Maps API 客戶端
├── tools/
│   └── maps/
│       ├── searchNearby.ts       # maps_search_nearby 工具
│       ├── searchPlaces.ts       # maps_search_places 工具
│       ├── placeDetails.ts       # maps_place_details 工具
│       ├── geocode.ts            # maps_geocode 工具
│       ├── reverseGeocode.ts     # maps_reverse_geocode 工具
│       ├── distanceMatrix.ts     # maps_distance_matrix 工具
│       ├── directions.ts         # maps_directions 工具
│       ├── elevation.ts          # maps_elevation 工具
│       ├── timezone.ts           # maps_timezone 工具
│       ├── weather.ts            # maps_weather 工具
│       ├── airQuality.ts         # maps_air_quality 工具
│       ├── staticMap.ts          # maps_static_map 工具
│       ├── batchGeocode.ts       # maps_batch_geocode 工具
│       ├── searchAlongRoute.ts   # maps_search_along_route 工具
│       ├── exploreArea.ts        # maps_explore_area（組合）
│       ├── planRoute.ts          # maps_plan_route（組合）
│       ├── comparePlaces.ts      # maps_compare_places（組合）
│       └── localRankTracker.ts   # maps_local_rank_tracker（組合）
└── utils/
    ├── apiKeyManager.ts          # API key 管理
    └── requestContext.ts         # Per-request context（API key 隔離）
tests/
└── smoke.test.ts                 # Smoke + E2E 測試套件
skills/
├── google-maps/                  # 一般地點、路線與環境資訊工作流程
│   ├── SKILL.md
│   └── references/tools-api.md   # 工具參數 + 一般場景食譜
├── google-maps-travel-planning/  # 單日與多日行程工作流程
│   ├── SKILL.md
│   └── references/travel-planning.md
├── google-maps-local-seo/        # 商家能見度與地理排名工作流程
│   ├── SKILL.md
│   └── references/local-seo.md
└── _shared/                      # 三個 Skills 按需載入的共用資源
    ├── setup-and-diagnostics.md
    └── content-attribution.md
.agents/
├── plugins/marketplace.json      # CabLate marketplace 目錄
└── skills/project-docs/          # 僅供維護者使用的開發 Skill
.codex-plugin/plugin.json         # Codex 相容 manifest
plugin.json                       # 可攜式 Agent Plugin manifest
```

## 技術棧

- **TypeScript** - 型別安全開發
- **Node.js** - 執行環境
- **@googlemaps/places** - Google Places API (New) 地點搜尋與詳情
- **@googlemaps/google-maps-services-js** - Legacy API 地理編碼、導航、距離矩陣、海拔
- **@modelcontextprotocol/sdk** - MCP 協議實作（v1.27+）
- **Express.js** - HTTP server 框架
- **Zod** - Schema 驗證

## 安全性

- API key 在 server 端處理
- 多租戶部署的 per-session API key 隔離
- 正式環境可啟用 DNS rebinding 防護
- 使用 Zod schemas 進行輸入驗證

企業安全審查請參考 [Security Assessment Clarifications](./SECURITY_ASSESSMENT.md) — 涵蓋授權、資料保護、憑證管理、工具污染、AI 代理執行環境驗證的 23 項檢查清單。

## 路線圖

### 近期新增

| 工具 / 功能 | 解鎖場景 | 狀態 |
|------|----------------|--------|
| `maps_static_map` | 帶標記/路線的地圖圖片 — 多模態 AI 可「看見」地圖 | **完成** |
| `maps_air_quality` | AQI、污染物 — 健康出行、戶外規劃 | **完成** |
| `maps_batch_geocode` | 一次地理編碼最多 50 個地址 — 資料增強 | **完成** |
| `maps_search_along_route` | 沿路線搜尋地點，依繞路時間排序 — 旅行規劃 | **完成** |
| `maps_explore_area` | 一次呼叫的社區概覽（組合工具） | **完成** |
| `maps_plan_route` | 最佳化多站行程（組合工具） | **完成** |
| `maps_compare_places` | 並排地點比較（組合工具） | **完成** |
| `maps_local_rank_tracker` | 地理網格排名追蹤 — Local SEO 分析（組合工具） | **完成** |
| `GOOGLE_MAPS_ENABLED_TOOLS` | 篩選工具以減少上下文用量 | **完成** |

### 計畫中

| 功能 | 解鎖場景 | 狀態 |
|---------|----------------|--------|
| `maps_place_photo` | 地點照片供多模態 AI 使用 — 「看見」餐廳氛圍 | 計畫中 |
| 語言參數 | 所有工具支援多語言回應（ISO 639-1） | 計畫中 |
| MCP Prompt Templates | Claude Desktop 中的 `/travel-planner`、`/neighborhood-scout` 斜線指令 | 計畫中 |
| Geo-Reasoning Benchmark | 10 場景測試套件，衡量 LLM 地理空間推理準確度 | 研究中 |

### 我們在建構的應用場景

以下是驅動工具開發方向的真實場景：

- **旅行規劃** — 「規劃東京一日遊」（geocode → search → directions → weather）
- **房地產分析** — 「分析這個社區：學校、通勤、洪水風險」（search-nearby × N + elevation + distance-matrix）
- **物流優化** — 「從倉庫出發，最佳化這 12 個配送地址的路線」（plan-route）
- **外勤銷售** — 「拜訪芝加哥 6 個客戶，最小化車程，找午餐地點」（plan-route + search-nearby）
- **災害應變** — 「最近有開的醫院？我在洪水區嗎？」（search-nearby + elevation）
- **內容創作** — 「Austin 前 5 社區的餐廳密度和機場距離」（explore-area + distance-matrix）
- **無障礙** — 「輪椅可達的餐廳，避開陡坡路線」（search-nearby + place-details + elevation）
- **Local SEO** — 「分析我的餐廳在 1 公里內跟競爭對手的排名差距」（search-places + compare-places + explore-area）

## 更新日誌

見 [CHANGELOG.md](./CHANGELOG.md)。

## 授權

MIT

## 貢獻

歡迎社群參與和貢獻！

- 提交 Issue：回報 bug 或提供建議
- 建立 Pull Request：提交程式碼改進
- 文件：協助改善文件

## 聯絡

- Email: [reahtuoo310109@gmail.com](mailto:reahtuoo310109@gmail.com)
- GitHub: [CabLate](https://github.com/cablate/)

## Star History

<a href="https://glama.ai/mcp/servers/@cablate/mcp-google-map">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@cablate/mcp-google-map/badge" alt="Google Map Server MCP server" />
</a>

[![Star History Chart](https://star-history.dera.page/svg?repos=cablate/mcp-google-map&type=Date)](https://star-history.dera.page/#cablate/mcp-google-map&Date)
