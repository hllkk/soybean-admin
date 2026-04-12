---
name: verification
description: T 阶段验证 — 前端测试 + typecheck + lint
---
# Verification (前端)

## 流程
1. TypeScript: `pnpm typecheck`
2. Lint: `pnpm lint`
3. 测试: `pnpm test` (如有配置)
4. 读 .ai_state/design.md 验收标准 → 逐条确认
5. 未满足标准 → 标注到 .ai_state/quality.md

## 产出
- .ai_state/quality.md 填入验证结果