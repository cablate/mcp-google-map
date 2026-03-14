# CLAUDE.md

## Git Workflow

- **永遠不要直接推 main**。所有變更都要先開 feature branch、推上去、建 PR，等審核通過後才合併。
- Commit 完成後走 `git checkout -b feat/xxx` → `git push -u origin feat/xxx` → `gh pr create` 流程。
