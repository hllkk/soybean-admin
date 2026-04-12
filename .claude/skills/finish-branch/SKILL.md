---
name: finish-branch
description: V 阶段分支收尾
---
# Finish-Branch (V 阶段)

## 流程
1. 确认当前分支状态:
   - 所有任务已完成 (plan.md 全 [x])
   - quality.md 级别为 PASS 或 CONCERNS

2. 提供选项:
   - **merge**: 合并到主分支
   - **PR**: 创建 Pull Request
   - **keep**: 保持当前分支
   - **discard**: 丢弃更改

3. 如果选择 PR:
   - 自动生成 PR description (基于 plan.md + quality.md)
   - 格式:
     ```
     ## Summary
     {plan.md 任务摘要}

     ## Changes
     {主要修改点}

     ## Test Results
     {quality.md 验证结果}

     ## Review Notes
     {审查发现的问题 (如有)}
     ```

4. 用户确认后执行