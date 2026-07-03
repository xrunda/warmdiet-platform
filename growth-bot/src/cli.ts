import { parseArgs } from "node:util";
import { runDailyPlan } from "./commands/daily-plan.ts";

const USAGE = `growth-bot - 三餐管家推广运营中台 CLI

用法:
  node src/cli.ts <command> [options]

命令:
  daily:plan    生成每日内容计划（GB-001 阶段为占位输出）

选项:
  --dry-run     只打印结果，不写入任何文件
  --date <yyyy-mm-dd>  指定计划日期，默认今天
  -h, --help    显示帮助
`;

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      "dry-run": { type: "boolean", default: false },
      date: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

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
    default:
      process.stderr.write(`未知命令: ${command}\n\n${USAGE}`);
      return 1;
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

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
