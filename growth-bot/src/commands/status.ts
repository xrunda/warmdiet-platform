import { join } from "node:path";
import { ConfigError, loadConfig } from "../config/load.ts";
import { defaultRootDir, resolveContentRoot, resolveDataRoot } from "./paths.ts";
import { resolvePlanDate } from "./daily-plan.ts";
import { gatherDailyStatus, renderDailyStatus } from "../pipeline/daily-status.ts";

export interface StatusOptions {
  date?: string | undefined;
  /** 输出机器可读 JSON（供 GB-011 工作台等复用） */
  json?: boolean | undefined;
  rootDir?: string | undefined;
}

/** status 命令：汇总当日流水线状态并给出下一步建议 */
export function runStatus(options: StatusOptions): number {
  const rootDir = options.rootDir ?? defaultRootDir();
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const status = gatherDailyStatus({
      date,
      dataRoot: resolveDataRoot(config, rootDir),
      contentRoot: resolveContentRoot(config, rootDir),
    });

    if (options.json === true) {
      process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
    } else {
      process.stdout.write(renderDailyStatus(status));
    }
    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
