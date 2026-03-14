# CLAUDE.md

## Git Workflow

- **永遠不要直接推 main**。所有變更都要先開 feature branch、推上去、建 PR，等審核通過後才合併。
- Commit 完成後走 `git checkout -b feat/xxx` → `git push -u origin feat/xxx` → `gh pr create` 流程。

## Tool 變更 Checklist

每次新增、刪除、或重新命名 tool 時，以下所有檔案都必須同步更新：

| # | 檔案 | 更新內容 |
|---|------|---------|
| 1 | `src/tools/maps/*.ts` | Tool 定義（NAME, DESCRIPTION, SCHEMA, ACTION） |
| 2 | `src/config.ts` | 註冊 tool + annotations |
| 3 | `src/cli.ts` | EXEC_TOOLS 列表 + switch case |
| 4 | `tests/smoke.test.ts` | expectedTools 陣列 + tool count assertions |
| 5 | `README.md` | tool 數量（header、vs Grounding Lite 表、Server Info、exec mode）+ Available Tools 表格 + Project Structure |
| 6 | `skills/google-maps/SKILL.md` | Tool Map 表格 |
| 7 | `skills/google-maps/references/tools-api.md` | 參數文件 + chaining patterns |
| 8 | `server.json` | description（如有提到 tool 數量） |
| 9 | `package.json` | description（如有提到 tool 數量） |

漏更任何一個都會造成文件和實際行為不一致。PR 提交前請逐一確認。
