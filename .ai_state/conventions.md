# Conventions

## 项目编码规范

### 前端 (Vue3 + TypeScript + Naive UI + SoybeanAdmin)
- 目录结构: src/views/{module}/{page}/ 组件就近放置
- 命名: 组件 PascalCase, 文件 kebab-case, API fetch+动词+名词
- 组件编写顺序: 导入 → defineOptions → Props → Hooks → 状态 → 方法 → 模板
- 搜索组件: NCollapse折叠布局, defineModel双向绑定, useDict字典
- 国际化: 先定义类型再写翻译
- 响应式网格: span="24 s:12 m:6"

## 依赖版本

### 前端关键依赖
- Vue: ^3.x
- Naive UI: 最新
- TypeScript: 6.0.2
- Vite: ^6.x
- ESLint: 10.1.0

## Agent 易犯错误
> 由 reflexion/kaizen 自动追加

- (初始为空, 使用过程中逐渐积累)
