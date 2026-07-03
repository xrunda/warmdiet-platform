import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GrowthBotConfig } from "../config/load.ts";

/** growth-bot 项目根目录（src/commands/ 的上两级） */
export function defaultRootDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function resolveDataRoot(config: GrowthBotConfig, rootDir: string): string {
  return isAbsolute(config.paths.dataDir)
    ? config.paths.dataDir
    : join(rootDir, config.paths.dataDir);
}

export function resolveContentRoot(config: GrowthBotConfig, rootDir: string): string {
  return isAbsolute(config.paths.contentDir)
    ? config.paths.contentDir
    : join(rootDir, config.paths.contentDir);
}
