import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { resolvePlanDate } from "./daily-plan.ts";
import { buildProjectState, writeProjectState } from "../sources/project-state.ts";

export interface ProjectStateCommandOptions {
  dryRun: boolean;
  date?: string | undefined;
  rootDir?: string | undefined;
}

/**
 * project:state 命令：采集项目状态并写入 data/project-state/yyyy-mm-dd.json。
 * --dry-run 只打印结果不写文件。
 */
export function runProjectState(options: ProjectStateCommandOptions): number {
  const rootDir =
    options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const state = buildProjectState({ config, rootDir, date });

    if (!state.source.readmeFound) {
      process.stderr.write(
        `警告: 未找到 README（${state.source.readmePath}），Demo 地址与简介回退到 config 值\n`,
      );
    }

    if (options.dryRun) {
      process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
      return 0;
    }

    const outPath = writeProjectState(state, rootDir, config.paths.dataDir);
    process.stdout.write(
      `${JSON.stringify({ status: "written", outPath, date: state.date }, null, 2)}\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
