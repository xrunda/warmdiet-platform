import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";

/**
 * config:check 命令：加载并校验 config/ 下的配置，输出摘要。
 * 校验失败时打印清晰错误并返回非零退出码。
 */
export function runConfigCheck(configDir?: string): number {
  const resolvedDir =
    configDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..", "config");
  try {
    const config = loadConfig(resolvedDir);
    const summary = {
      status: "ok",
      configDir: resolvedDir,
      project: config.project.name,
      repo: config.project.repo.url,
      platforms: config.platforms.platforms.map((p) => p.id),
      paths: config.paths,
      pathsLocalApplied: config.pathsLocalApplied,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
