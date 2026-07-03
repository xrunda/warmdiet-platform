/**
 * 配置结构定义与校验（GB-002）。
 *
 * 校验采用手写断言而不是引入 schema 库，保持零运行时依赖。
 * 每个校验函数返回错误列表；空列表表示通过。
 */

export interface ProjectConfig {
  name: string;
  repo: {
    owner: string;
    name: string;
    url: string;
  };
  demo: {
    hospitalUrl: string;
    familyUrl: string;
  };
  positioning: string;
  language: "zh" | "zh-en";
  video?: {
    promoPath: string;
    durationSeconds: number;
  };
}

export const PLATFORM_IDS = ["x", "xiaohongshu", "douyin", "wechat-video", "kuaishou"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface PlatformConfig {
  id: PlatformId;
  displayName: string;
  tone: string;
  automation: "api" | "package" | "semi";
  autoPublish: boolean;
}

export interface PlatformsConfig {
  platforms: PlatformConfig[];
}

export interface PathsConfig {
  dataDir: string;
  contentDir: string;
  assetsDir: string;
  /** 私有资料目录（如 公司资料/2026/三餐管家），仅本机使用，null 表示未配置 */
  privateMaterialsDir: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, key: string, where: string, errors: string[]): void {
  if (typeof obj[key] !== "string" || obj[key] === "") {
    errors.push(`${where}.${key} 必须是非空字符串`);
  }
}

export function validateProjectConfig(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return ["project 配置必须是 JSON 对象"];
  }
  requireString(value, "name", "project", errors);
  requireString(value, "positioning", "project", errors);
  if (value.language !== "zh" && value.language !== "zh-en") {
    errors.push('project.language 必须是 "zh" 或 "zh-en"');
  }
  if (!isRecord(value.repo)) {
    errors.push("project.repo 必须是对象，包含 owner、name、url");
  } else {
    requireString(value.repo, "owner", "project.repo", errors);
    requireString(value.repo, "name", "project.repo", errors);
    requireString(value.repo, "url", "project.repo", errors);
  }
  if (!isRecord(value.demo)) {
    errors.push("project.demo 必须是对象，包含 hospitalUrl、familyUrl");
  } else {
    requireString(value.demo, "hospitalUrl", "project.demo", errors);
    requireString(value.demo, "familyUrl", "project.demo", errors);
  }
  if (value.video !== undefined) {
    if (!isRecord(value.video)) {
      errors.push("project.video 若存在必须是对象");
    } else {
      requireString(value.video, "promoPath", "project.video", errors);
      if (typeof value.video.durationSeconds !== "number" || value.video.durationSeconds <= 0) {
        errors.push("project.video.durationSeconds 必须是正数");
      }
    }
  }
  return errors;
}

export function validatePlatformsConfig(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value) || !Array.isArray(value.platforms)) {
    return ["platforms 配置必须是 { platforms: [...] } 结构"];
  }
  const seen = new Set<string>();
  value.platforms.forEach((entry, index) => {
    const where = `platforms[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${where} 必须是对象`);
      return;
    }
    if (typeof entry.id !== "string" || !(PLATFORM_IDS as readonly string[]).includes(entry.id)) {
      errors.push(`${where}.id 必须是以下之一: ${PLATFORM_IDS.join(", ")}`);
    } else if (seen.has(entry.id)) {
      errors.push(`${where}.id 重复: ${entry.id}`);
    } else {
      seen.add(entry.id);
    }
    requireString(entry, "displayName", where, errors);
    requireString(entry, "tone", where, errors);
    if (entry.automation !== "api" && entry.automation !== "package" && entry.automation !== "semi") {
      errors.push(`${where}.automation 必须是 "api"、"package" 或 "semi"`);
    }
    if (typeof entry.autoPublish !== "boolean") {
      errors.push(`${where}.autoPublish 必须是布尔值（第一阶段应为 false）`);
    }
  });
  if (errors.length === 0 && seen.size === 0) {
    errors.push("platforms 至少需要配置一个平台");
  }
  return errors;
}

export function validatePathsConfig(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return ["paths 配置必须是 JSON 对象"];
  }
  requireString(value, "dataDir", "paths", errors);
  requireString(value, "contentDir", "paths", errors);
  requireString(value, "assetsDir", "paths", errors);
  if (value.privateMaterialsDir !== null && typeof value.privateMaterialsDir !== "string") {
    errors.push("paths.privateMaterialsDir 必须是字符串或 null");
  }
  return errors;
}
