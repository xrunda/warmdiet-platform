# WarmDiet Growth Bot

三餐管家推广运营中台，用于把 `xrunda/warmdiet-platform` 的开源进展、产品能力、Demo 体验和行业热点转化为可分发的多平台内容资产。

## 定位

`growth-bot` 是一个本地可运行的运营系统，不是单个平台发帖脚本。它负责沉淀每日热点、选题、文案、素材、发布状态和复盘数据；Codex 负责调度、策略判断、审核与验收。

## 当前阶段

先做半自动流水线：

1. 抓取热点和项目动态。
2. 生成每日选题。
3. 生成多平台文案和素材需求。
4. 输出人工审核稿。
5. 为 X、小红书、抖音、视频号、快手生成发布包。
6. 记录发布结果和复盘数据。

后续再逐步接入自动发布能力。

## 快速开始

要求 Node.js >= 22.18（本项目直接以 Node 原生 type stripping 运行 TypeScript，无需构建步骤）。

```bash
cd growth-bot
npm install

npm run typecheck              # 类型检查
npm run test                   # 运行单元测试（Node 原生 test runner）
npm run daily:plan -- --dry-run  # 输出每日内容计划（当前为占位结果）
```

## 配置

配置文件在 `config/` 下，仓库只提交 `*.example.json`，真实配置不入库：

```bash
cd growth-bot
cp config/project.example.json config/project.json
cp config/platforms.example.json config/platforms.json
cp config/paths.example.json config/paths.json

npm run config:check   # 加载并校验配置
npm run project:state  # 采集项目状态 → data/project-state/yyyy-mm-dd.json
npm run trends:import  # 标准化热点源文件 → data/trends/yyyy-mm-dd.json
npm run daily:plan     # 生成每日 10 条内容计划 → content/calendar/yyyy-mm-dd.json
npm run drafts:generate # 生成多平台草稿 → content/drafts/yyyy-mm-dd/*.md
npm run review:build    # 生成一屏审核汇总 → content/review/yyyy-mm-dd.md
npm run publish:package # 导出 Approve 条目发布包 → content/publish-packages/yyyy-mm-dd/
npm run publish:record  # 生成发布记录骨架 → content/published/yyyy-mm-dd.json
npm run retro:build     # 渲染每日复盘模板 → content/reviews/yyyy-mm-dd.md
```

`project:state` 从主仓库 README（`paths.readmePath`，默认 `../README.md`）提取项目简介、Demo 地址和测试账号，与配置中的仓库地址、视频素材路径合并输出；支持 `--dry-run` 和 `--date yyyy-mm-dd`。

`trends:import` 读取人工或 Codex 写入的 `data/trends/source/yyyy-mm-dd.json`（模板见 [example.json](./data/trends/source/example.json)），校验 title/source/url/summary/tags/riskLevel 后输出标准化热点数据；高风险（`riskLevel: high`）或敏感（`sensitive: true`）热点会被标记为 `leverageable: false`，默认不借势。

`daily:plan` 按 PRD 配比（产品功能 2 / 热点 2 / 技术开源 2 / 视频 1 / GitHub 动态 1 / 产品思考 1 / 互动 1）生成 10 条计划：以日期为种子轮换选题角度、避开昨日角度与热点、只选可借势热点（不足用兜底角度）、保证五平台覆盖、含链接条数 ≤3。已存在的日历默认不覆盖（保护人工编辑），重建需 `--force`。

`drafts:generate` 把日历条目按 platformTargets 展开为平台草稿 Markdown（X、小红书、抖音、视频号、快手模板），每份含标题、正文、话题、素材建议、合规自检（含医疗禁用词自动扫描）。草稿带 frontmatter 供审核流机读，可直接人工编辑；已存在的草稿默认跳过，重建需 `--force`。

`review:build` 把当天 10 条内容压缩成一屏审核 Markdown，每条含角度、平台、风险、合规状态、草稿链接和 Approve / Edit / Reject 状态位；人工勾选后执行 `publish:package`，Approve 条目的草稿按平台分目录导出为发布包（含 manifest.json），发布动作由人工在各平台完成。审核文件默认不覆盖（其中有人工勾选结果）。

`publish:record` 从发布包 manifest 生成发布记录骨架，人工在 JSON 中录入每条的发布状态、链接与曝光/点赞/评论/收藏指标及当日 star 增量（结构稳定，可被后续脚本读取）；`retro:build` 把记录渲染为复盘模板（数据表 + 复盘结论 + 明日建议的人工填写区）。指标更新后可用 `--force` 刷新数据表。两个文件默认都不覆盖。

本机私有路径（如私有资料目录）写入 `config/paths.local.json`，它会覆盖 `paths.json` 中的同名字段，且已被 `.gitignore` 忽略。

## 目录结构

```text
growth-bot/
├── assets/    # 素材：source / packaged / templates
├── config/    # 配置示例与本机私有配置（*.local.json 不入库）
├── content/   # 内容产出：calendar / drafts / published / review / reviews
├── data/      # 数据：metrics / project-state / trends
├── docs/      # PRD、协作规范、Issue backlog
└── src/       # TypeScript 源码与测试
```

## 核心文档

- [协作与交付规范](./docs/COLLABORATION_SPEC.md)
- [PRD v0.1](./docs/PRD.md)

