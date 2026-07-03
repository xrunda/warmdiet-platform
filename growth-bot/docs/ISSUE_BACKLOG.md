# Growth Bot Issue Backlog

第一批 Issue 用于启动 MVP。每个 Issue 都应该保持小范围、可验收、可交给 Claude 或其他 Agent 独立执行。

## GB-001: 建立 growth-bot TypeScript 项目骨架

背景：`growth-bot` 需要成为可独立运行、可测试、可被 Codex automation 调度的本地项目。

范围：
- 初始化 `package.json`
- 配置 TypeScript
- 配置测试框架
- 建立 `src/`、`config/`、`data/`、`content/`、`assets/` 目录
- 添加基础 CLI 入口

不做：
- 不接真实平台 API
- 不生成真实内容
- 不实现热点抓取

验收：
- `npm install` 成功
- `npm run typecheck` 成功
- `npm run test` 成功
- `npm run daily:plan -- --dry-run` 能输出占位结果

## GB-002: 实现本地配置和路径管理

背景：项目需要清晰区分公开代码目录、私有资料目录和本地输出目录。

范围：
- 增加 `config/project.example.json`
- 增加 `config/platforms.example.json`
- 增加 `config/paths.example.json`
- 实现配置加载和校验
- 支持 `paths.local.json` 覆盖本机路径

不做：
- 不把真实本机私有配置提交进仓库
- 不接云端配置

验收：
- 配置缺失时有清晰错误
- 示例配置可通过校验
- `paths.local.json` 被 `.gitignore` 忽略

## GB-003: 实现项目状态采集模块

背景：每日内容需要引用 WarmDiet 的最新项目状态。

范围：
- 从本地 `README.md` 提取项目简介、Demo 地址、测试账号摘要
- 从配置读取 GitHub 仓库地址、视频素材路径
- 输出 `data/project-state/yyyy-mm-dd.json`

不做：
- 不调用 GitHub API
- 不统计真实 star

验收：
- 生成 JSON 包含 repo、demoUrls、positioning、assets
- 可重复运行

## GB-004: 实现手动热点导入模块

背景：MVP 先不做复杂新闻抓取，允许人工或 Codex 写入热点源。

范围：
- 定义热点数据结构
- 支持读取 `data/trends/source/yyyy-mm-dd.json`
- 校验 title、source、url、summary、tags、riskLevel
- 输出标准化 `data/trends/yyyy-mm-dd.json`

不做：
- 不自动爬取 X / 新闻站
- 不做热点排名

验收：
- 示例热点文件可标准化输出
- 高风险热点可被标记

## GB-005: 实现每日内容日历模块

背景：每天需要生成 10 条可审核内容计划。

范围：
- 输入项目状态和热点数据
- 输出 `content/calendar/yyyy-mm-dd.json`
- 每条包含 platformTargets、audience、angle、assetType、riskLevel、linkPolicy

不做：
- 不写最终平台文案
- 不自动发布

验收：
- 默认生成 10 条
- 平台覆盖 X、小红书、抖音、视频号、快手
- 包含合规风险字段

## GB-006: 实现多平台草稿生成模块

背景：同一选题需要被改写成不同平台语气。

范围：
- 从内容日历生成 Markdown 草稿
- 支持 X、小红书、抖音、视频号、快手模板
- 每条包含标题、正文、话题、素材建议、合规自检

不做：
- 不调用 LLM API
- 不生成图片或视频

验收：
- `content/drafts/yyyy-mm-dd/` 下有平台草稿
- 草稿可人工编辑

## GB-007: 实现审核汇总和发布包导出

背景：第一阶段需要人工审核后发布。

范围：
- 生成 `content/review/yyyy-mm-dd.md`
- 生成 `content/publish-packages/yyyy-mm-dd/`
- 每条内容有 Approve / Edit / Reject 状态位

不做：
- 不自动打开浏览器发布
- 不上传素材到平台

验收：
- 审核文件能一屏浏览当天 10 条内容
- 发布包按平台分目录

## GB-008: 实现发布记录与复盘模板

背景：增长系统必须形成反馈闭环。

范围：
- 定义发布记录结构
- 生成 `content/published/yyyy-mm-dd.json`
- 生成 `content/reviews/yyyy-mm-dd.md`
- 支持手工录入曝光、点赞、评论、收藏、star 增量

不做：
- 不自动抓平台数据
- 不做复杂分析模型

验收：
- 每日复盘模板可填写
- 指标结构可被后续脚本读取

