import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

/**
 * 手动热点导入（GB-004）。
 *
 * 读取人工或 Codex 写入的 data/trends/source/yyyy-mm-dd.json，
 * 校验后输出标准化 data/trends/yyyy-mm-dd.json。
 * 不自动爬取，不做热点排名。
 */

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CREDIBILITY_LEVELS = ["low", "medium", "high"] as const;
export type Credibility = (typeof CREDIBILITY_LEVELS)[number];

export interface NormalizedTrendItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  tags: string[];
  riskLevel: RiskLevel;
  publishedAt: string | null;
  credibility: Credibility;
  /** 敏感医疗事件标记，敏感事件默认不借势（PRD 8.2） */
  sensitive: boolean;
  /** 是否适合 WarmDiet 借势：高风险或敏感事件为 false */
  leverageable: boolean;
}

export interface NormalizedTrendsFile {
  date: string;
  generatedAt: string;
  sourceFile: string;
  count: number;
  highRiskCount: number;
  items: NormalizedTrendItem[];
}

export class TrendsValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[], sourceFile: string) {
    super(`热点源文件校验失败: ${sourceFile}\n- ${errors.join("\n- ")}`);
    this.name = "TrendsValidationError";
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 源文件允许顶层是数组，或 { items: [...] } 对象 */
export function extractSourceItems(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return raw.items;
  }
  return null;
}

export function validateTrendItem(entry: unknown, index: number): string[] {
  const where = `items[${index}]`;
  if (!isRecord(entry)) {
    return [`${where} 必须是对象`];
  }
  const errors: string[] = [];
  for (const key of ["title", "source", "url", "summary"] as const) {
    if (typeof entry[key] !== "string" || entry[key].trim() === "") {
      errors.push(`${where}.${key} 必须是非空字符串`);
    }
  }
  if (typeof entry.url === "string" && !/^https?:\/\//.test(entry.url)) {
    errors.push(`${where}.url 必须以 http:// 或 https:// 开头`);
  }
  if (
    !Array.isArray(entry.tags) ||
    entry.tags.length === 0 ||
    entry.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")
  ) {
    errors.push(`${where}.tags 必须是非空字符串数组`);
  }
  if (!(RISK_LEVELS as readonly unknown[]).includes(entry.riskLevel)) {
    errors.push(`${where}.riskLevel 必须是 ${RISK_LEVELS.join(" / ")}`);
  }
  if (
    entry.credibility !== undefined &&
    !(CREDIBILITY_LEVELS as readonly unknown[]).includes(entry.credibility)
  ) {
    errors.push(`${where}.credibility 若存在必须是 ${CREDIBILITY_LEVELS.join(" / ")}`);
  }
  if (entry.publishedAt !== undefined && typeof entry.publishedAt !== "string") {
    errors.push(`${where}.publishedAt 若存在必须是字符串`);
  }
  if (entry.sensitive !== undefined && typeof entry.sensitive !== "boolean") {
    errors.push(`${where}.sensitive 若存在必须是布尔值`);
  }
  return errors;
}

export function normalizeTrends(
  rawItems: unknown[],
  date: string,
  sourceFile: string,
  now: Date = new Date(),
): NormalizedTrendsFile {
  const allErrors = rawItems.flatMap((entry, index) => validateTrendItem(entry, index));
  if (allErrors.length > 0) {
    throw new TrendsValidationError(allErrors, sourceFile);
  }

  const items = rawItems.map((entry, index) => {
    const record = entry as Record<string, unknown>;
    const riskLevel = record.riskLevel as RiskLevel;
    const sensitive = (record.sensitive as boolean | undefined) ?? false;
    const item: NormalizedTrendItem = {
      id: `trend-${date}-${String(index + 1).padStart(2, "0")}`,
      title: (record.title as string).trim(),
      source: (record.source as string).trim(),
      url: (record.url as string).trim(),
      summary: (record.summary as string).trim(),
      tags: (record.tags as string[]).map((tag) => tag.trim()),
      riskLevel,
      publishedAt: (record.publishedAt as string | undefined) ?? null,
      credibility: (record.credibility as Credibility | undefined) ?? "medium",
      sensitive,
      leverageable: riskLevel !== "high" && !sensitive,
    };
    return item;
  });

  return {
    date,
    generatedAt: now.toISOString(),
    sourceFile,
    count: items.length,
    highRiskCount: items.filter((item) => !item.leverageable).length,
    items,
  };
}

export interface ImportTrendsOptions {
  rootDir: string;
  dataDir: string;
  date: string;
  now?: Date;
}

export interface ImportTrendsResult {
  normalized: NormalizedTrendsFile;
  sourcePath: string;
  outPath: string;
}

export function importTrends(options: ImportTrendsOptions): ImportTrendsResult {
  const dataRoot = isAbsolute(options.dataDir)
    ? options.dataDir
    : join(options.rootDir, options.dataDir);
  const sourcePath = join(dataRoot, "trends", "source", `${options.date}.json`);
  const outPath = join(dataRoot, "trends", `${options.date}.json`);

  if (!existsSync(sourcePath)) {
    throw new TrendsValidationError(
      [
        `未找到热点源文件，请人工或由 Codex 写入当日热点`,
        `参考模板: ${join(dataRoot, "trends", "source", "example.json")}`,
      ],
      sourcePath,
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(sourcePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TrendsValidationError([`不是合法 JSON: ${message}`], sourcePath);
  }

  const rawItems = extractSourceItems(raw);
  if (rawItems === null) {
    throw new TrendsValidationError(
      ["顶层必须是数组，或 { \"items\": [...] } 对象"],
      sourcePath,
    );
  }

  const normalized = normalizeTrends(rawItems, options.date, sourcePath, options.now);
  return { normalized, sourcePath, outPath };
}

export function writeNormalizedTrends(result: ImportTrendsResult): string {
  mkdirSync(dirname(result.outPath), { recursive: true });
  writeFileSync(result.outPath, `${JSON.stringify(result.normalized, null, 2)}\n`);
  return result.outPath;
}
