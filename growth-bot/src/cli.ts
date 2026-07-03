import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { runDailyPlan } from "./commands/daily-plan.ts";
import { runConfigCheck } from "./commands/config-check.ts";
import { runProjectState } from "./commands/project-state.ts";
import { runTrendsImport } from "./commands/trends-import.ts";
import { runDraftsGenerate } from "./commands/drafts-generate.ts";
import { runReviewBuild } from "./commands/review-build.ts";
import { runPublishPackage } from "./commands/publish-package.ts";
import { runPublishRecord, runRetroBuild } from "./commands/publish-record.ts";
import { runStatus } from "./commands/status.ts";
import { runDailyRun } from "./commands/daily-run.ts";
import { runDashboard } from "./commands/dashboard.ts";

const USAGE = `growth-bot - 三餐管家推广运营中台 CLI

用法:
  node src/cli.ts <command> [options]

命令:
  daily:plan     生成每日 10 条内容计划，写入 content/calendar/yyyy-mm-dd.json
  config:check   加载并校验 config/ 下的配置文件
  project:state  采集项目状态，写入 data/project-state/yyyy-mm-dd.json
  trends:import  校验并标准化热点源文件，写入 data/trends/yyyy-mm-dd.json
  drafts:generate  从内容日历生成多平台草稿，写入 content/drafts/yyyy-mm-dd/
  review:build     生成一屏审核汇总，写入 content/review/yyyy-mm-dd.md
  publish:package  导出 Approve 条目的发布包到 content/publish-packages/yyyy-mm-dd/
  publish:record   生成发布记录骨架，写入 content/published/yyyy-mm-dd.json
  retro:build      渲染每日复盘模板，写入 content/reviews/yyyy-mm-dd.md
  status           汇总当日流水线状态，给出下一步建议（--json 机器可读）
  daily:run        一键串联当日流水线（发布阶段由人工审核门控）
  dashboard        启动本地工作台页面（默认 http://127.0.0.1:4700）

选项:
  --dry-run     只打印结果，不写入任何文件
  --date <yyyy-mm-dd>  指定计划日期，默认今天
  --force       允许覆盖已存在的日历文件（默认保护人工编辑）
  -h, --help    显示帮助
`;

export async function main(argv: string[]): Promise<number> {
  let values;
  let positionals;
  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        "dry-run": { type: "boolean", default: false },
        date: { type: "string" },
        force: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        port: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`参数错误: ${message}\n\n${USAGE}`);
    return 1;
  }

  const command = positionals[0];

  if (values.help || command === undefined) {
    process.stdout.write(USAGE);
    return command === undefined && !values.help ? 1 : 0;
  }

  switch (command) {
    case "daily:plan":
      return runDailyPlan({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "config:check":
      return runConfigCheck();
    case "project:state":
      return runProjectState({
        dryRun: values["dry-run"],
        date: values.date,
      });
    case "trends:import":
      return runTrendsImport({
        dryRun: values["dry-run"],
        date: values.date,
      });
    case "drafts:generate":
      return runDraftsGenerate({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "review:build":
      return runReviewBuild({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "publish:package":
      return runPublishPackage({
        dryRun: values["dry-run"],
        date: values.date,
      });
    case "publish:record":
      return runPublishRecord({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "retro:build":
      return runRetroBuild({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "status":
      return runStatus({
        date: values.date,
        json: values.json,
      });
    case "daily:run":
      return runDailyRun({
        dryRun: values["dry-run"],
        date: values.date,
        force: values.force,
      });
    case "dashboard":
      return runDashboard({ port: values.port });
    default:
      process.stderr.write(`未知命令: ${command}\n\n${USAGE}`);
      return 1;
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
