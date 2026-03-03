# Security Assessment Clarifications（中文）

> 更新日期：2026-03

以下內容用於企業安全審查，對應 23 項安全檢查類型，並以目前 `cablate/mcp-google-map` 實作為準。

| # | 安全檢查類型 | 說明（本專案） |
|---|---|---|
| 1 | Licensing & Legal Compliance | 採用 MIT License，允許商業使用、內部使用、修改與再散佈（需保留授權聲明）。 |
| 2 | Data Protection & Privacy Laws | 伺服器本身不做資料庫/檔案持久化，主要將請求參數轉送至 Google Maps API；實際法遵（個資、跨境、保存政策）由部署方負責。 |
| 3 | Infrastructure & Deployment Security | 為自託管 Node.js 服務；API Key 可由 header/CLI/env 提供，建議在 GCP 做來源與 API 範圍限制、定期輪替並使用祕密管理。 |
| 4 | Long-Term Viability Risk | 專案為公開維護，具公開 commit/release 歷史；使用方可採版本鎖定策略降低風險。 |
| 5 | Unexpected RCE and Code Attacks | 無 eval、無外掛執行引擎、無 shell 執行路徑；輸入僅作為 API 參數。 |
| 6 | Tool Contamination Attacks | 無持久化快取或內建儲存；不會跨重啟保留工具結果。 |
| 7 | Shadowing Attack | 工具於啟動時靜態註冊；無動態下載/覆寫工具機制。 |
| 8 | Credential Theft | 主要敏感資訊為 Google Maps API Key；應使用祕密管理、最小權限限制、金鑰輪替與 HTTPS/受信任入口。 |
| 9 | Verification of MCP Server Providers | 原始碼公開可稽核，維護者與社群互動可追蹤，非匿名來源。 |
| 10 | Verification of Information Handled | 輸出主要來自 Google Maps Platform；本伺服器不做資料庫落地與長期再利用。 |
| 11 | Authentication methods and permissions | 本專案無內建使用者/角色模型；存取控制需由反向代理、API Gateway、網路策略等外部機制提供。 |
| 12 | Verification of AI Agent Execution Environment | 倉庫未內嵌真實憑證；`.env.example` 僅為範例佔位。 |
| 13 | Configure MCP Server Settings (Version Verification/Fixing) | 建議在部署流程固定版本（package version/tag/commit SHA），並在升級前做審核。 |
| 14 | Verify MCP Server Connection Status During Prompt Input | 是否連到哪些 MCP server 屬客戶端/主控平台責任；本服務僅提供單一 `/mcp` 端點。 |
| 15 | Listing and managing accounts/DBs/containers, SQL queries | 不適用：本專案無 DB 連線、無 SQL 查詢執行能力。 |
| 16 | Logging, Monitoring, and Log Query Capabilities | 提供基本 stdout/stderr 記錄；集中化查詢、保留、告警需由部署平台（如 SIEM）實作。 |
| 17 | Post-Approval Malicious Update Risk | 建議固定依賴版本、審核更新內容、採內部 artifact 核准/簽章流程。 |
| 18 | Outdated Dependencies | 依賴由 `package.json`/`package-lock.json` 管理；建議定期執行 SCA/`npm audit` 與修補流程。 |
| 19 | Environmental Damage due to Auto-Approval | 目前工具主要呼叫 Google Maps API，無本地檔案/系統破壞型工具；風險主要取決於客戶端自動核准策略。 |
| 20 | Intent/Objective Tampering | 無自主改寫目標的機制；行為受 MCP tool schema 與 handler 約束。 |
| 21 | Human Operation | 主要人為風險為錯誤配置（未限制金鑰、端點暴露、無 TLS、網路權限過大）；需落實最小權限與變更控管。 |
| 22 | Lag Pull Attack | 本服務即時向上游 API 取資料且不做持久化快取；延遲/過時決策風險多在客戶端流程與人工審核。 |
| 23 | Cost-related information | 本 MCP server 程式碼為開源自託管（免費）；Google Maps API 依 GCP 計費方案可能產生費用。 |
