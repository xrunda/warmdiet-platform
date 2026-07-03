import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { resolvePlanDate } from "./daily-plan.ts";
import { importTrends, writeNormalizedTrends, TrendsValidationError } from "../sources/trends.ts";

export interface TrendsImportCommandOptions {
  dryRun: boolean;
  date?: string | undefined;
  rootDir?: string | undefined;
}

/**
 * trends:import 命令：读取 data/trends/source/yyyy-mm-dd.json，
 * 校验并输出标准化 data/trends/yyyy-mm-dd.json。
 * --dry-run 只打印结果不写文件。
 */
export function runTrendsImport(options: TrendsImportCommandOptions): number {
  const rootDir =
    options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const result = importTrends({ rootDir, dataDir: config.paths.dataDir, date });

    if (options.dryRun) {
      process.stdout.write(`${JSON.stringify(result.normalized, null, 2)}\n`);
      return 0;
    }

    const outPath = writeNormalizedTrends(result);
    process.stdout.write(
      `${JSON.stringify(
        {
          status: "written",
          outPath,
          date,
          count: result.normalized.count,
          highRiskCount: result.normalized.highRiskCount,
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof ConfigError || error instanceof TrendsValidationError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
