import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { runDailyPlan } from "./commands/daily-plan.ts";
import { runConfigCheck } from "./commands/config-check.ts";
import { runProjectState } from "./commands/project-state.ts";
import { runTrendsImport } from "./commands/trends-import.ts";

const USAGE = `growth-bot - 三餐管家推广运营中台 CLI

用法:
  node src/cli.ts <command> [options]

命令:
  daily:plan     生成每日内容计划（GB-001 阶段为占位输出）
  config:check   加载并校验 config/ 下的配置文件
  project:state  采集项目状态，写入 data/project-state/yyyy-mm-dd.json
  trends:import  校验并标准化热点源文件，写入 data/trends/yyyy-mm-dd.json

选项:
  --dry-run     只打印结果，不写入任何文件
  --date <yyyy-mm-dd>  指定计划日期，默认今天
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
    case "daily:plan": {
      const plan = runDailyPlan({
        dryRun: values["dry-run"],
        date: values.date,
      });
      process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
      return 0;
    }
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
