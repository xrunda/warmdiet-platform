import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  validatePathsConfig,
  validatePlatformsConfig,
  validateProjectConfig,
  type PathsConfig,
  type PlatformsConfig,
  type ProjectConfig,
} from "./schema.ts";

export interface GrowthBotConfig {
  project: ProjectConfig;
  platforms: PlatformsConfig;
  paths: PathsConfig;
  /** paths.local.json 是否参与了覆盖 */
  pathsLocalApplied: boolean;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function readJsonFile(filePath: string, hint: string): unknown {
  if (!existsSync(filePath)) {
    const hintLine = hint === "" ? "" : `\n请先执行: ${hint}`;
    throw new ConfigError(`缺少配置文件: ${filePath}${hintLine}`);
  }
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`配置文件不是合法 JSON: ${filePath}\n${message}`);
  }
}

function assertValid(errors: string[], filePath: string): void {
  if (errors.length > 0) {
    throw new ConfigError(`配置校验失败: ${filePath}\n- ${errors.join("\n- ")}`);
  }
}

/**
 * 加载并校验 growth-bot 配置。
 *
 * 读取 configDir 下的 project.json、platforms.json、paths.json；
 * 若存在 paths.local.json，则用其中的字段覆盖 paths.json（浅合并）。
 * 任何文件缺失、JSON 非法或校验失败都会抛出 ConfigError，并附带修复提示。
 */
export function loadConfig(configDir: string): GrowthBotConfig {
  const projectRaw = readJsonFile(
    join(configDir, "project.json"),
    `cp ${join(configDir, "project.example.json")} ${join(configDir, "project.json")}`,
  );
  assertValid(validateProjectConfig(projectRaw), join(configDir, "project.json"));

  const platformsRaw = readJsonFile(
    join(configDir, "platforms.json"),
    `cp ${join(configDir, "platforms.example.json")} ${join(configDir, "platforms.json")}`,
  );
  assertValid(validatePlatformsConfig(platformsRaw), join(configDir, "platforms.json"));

  const pathsRaw = readJsonFile(
    join(configDir, "paths.json"),
    `cp ${join(configDir, "paths.example.json")} ${join(configDir, "paths.json")}`,
  );

  const localPath = join(configDir, "paths.local.json");
  let pathsLocalApplied = false;
  let mergedPaths = pathsRaw;
  if (existsSync(localPath)) {
    const localRaw = readJsonFile(localPath, "");
    if (typeof localRaw !== "object" || localRaw === null || Array.isArray(localRaw)) {
      throw new ConfigError(`配置校验失败: ${localPath}\n- paths.local.json 必须是 JSON 对象`);
    }
    mergedPaths = { ...(pathsRaw as Record<string, unknown>), ...(localRaw as Record<string, unknown>) };
    pathsLocalApplied = true;
  }
  assertValid(
    validatePathsConfig(mergedPaths),
    pathsLocalApplied ? `${join(configDir, "paths.json")} + paths.local.json` : join(configDir, "paths.json"),
  );

  return {
    project: projectRaw as unknown as ProjectConfig,
    platforms: platformsRaw as unknown as PlatformsConfig,
    paths: mergedPaths as unknown as PathsConfig,
    pathsLocalApplied,
  };
}
