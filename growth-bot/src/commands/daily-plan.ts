import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { generateCalendar, type CalendarFile } from "../pipeline/daily-calendar.ts";
import type { ProjectState } from "../sources/project-state.ts";
import type { NormalizedTrendsFile } from "../sources/trends.ts";

/**
 * 每日内容计划命令（GB-005）。
 *
 * 输入 data/project-state/yyyy-mm-dd.json 与 data/trends/yyyy-mm-dd.json，
 * 按 PRD 配比生成 10 条计划写入 content/calendar/yyyy-mm-dd.json。
 * 已存在的日历文件默认不覆盖（保护人工编辑），--force 可重建。
 */

export interface DailyPlanOptions {
  dryRun: boolean;
  date?: string | undefined;
  force?: boolean | undefined;
  rootDir?: string | undefined;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function resolvePlanDate(input: string | undefined, now: Date = new Date()): string {
  if (input !== undefined) {
    if (!DATE_PATTERN.test(input)) {
      throw new Error(`无效日期: ${input}，期望格式 yyyy-mm-dd`);
    }
    const [year, month, day] = input.split("-").map(Number) as [number, number, number];
    const parsed = new Date(year, month - 1, day);
    const roundTrips =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day;
    if (!roundTrips) {
      throw new Error(`无效日期: ${input}，不是真实存在的日历日期`);
    }
    return input;
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function previousDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

export class DataFileError extends Error {
  constructor(filePath: string, cause: string) {
    super(`数据文件不是合法 JSON: ${filePath}\n${cause}\n请修复该文件或删除后重新生成`);
    this.name = "DataFileError";
  }
}

export function readJsonIfExists<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    throw new DataFileError(filePath, error instanceof Error ? error.message : String(error));
  }
}

export function runDailyPlan(options: DailyPlanOptions): number {
  const rootDir =
    options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const dataRoot = isAbsolute(config.paths.dataDir)
      ? config.paths.dataDir
      : join(rootDir, config.paths.dataDir);
    const contentRoot = isAbsolute(config.paths.contentDir)
      ? config.paths.contentDir
      : join(rootDir, config.paths.contentDir);

    const statePath = join(dataRoot, "project-state", `${date}.json`);
    const projectState = readJsonIfExists<ProjectState>(statePath);
    if (projectState === null) {
      process.stderr.write(
        `缺少项目状态文件: ${statePath}\n请先执行: npm run project:state -- --date ${date}\n`,
      );
      return 1;
    }

    const trendsPath = join(dataRoot, "trends", `${date}.json`);
    const trendsFile = readJsonIfExists<NormalizedTrendsFile>(trendsPath);
    if (trendsFile === null) {
      process.stderr.write(
        `提示: 未找到当日热点 ${trendsPath}，热点条目将使用兜底角度（可先执行 npm run trends:import）\n`,
      );
    }

    // 昨日日历只用于去重，损坏时降级为忽略而不是中断
    let yesterday: CalendarFile | null = null;
    try {
      yesterday = readJsonIfExists<CalendarFile>(
        join(contentRoot, "calendar", `${previousDate(date)}.json`),
      );
    } catch (error) {
      if (!(error instanceof DataFileError)) {
        throw error;
      }
      process.stderr.write(`提示: 昨日日历损坏，本次不做去重（${error.message.split("\n")[0]}）\n`);
    }

    const calendar = generateCalendar({
      date,
      projectState,
      trends: trendsFile?.items ?? [],
      yesterdayAngleKeys: yesterday?.items.map((item) => item.angleKey) ?? [],
      yesterdayTrendRefs:
        yesterday?.items.flatMap((item) => (item.trendRef === null ? [] : [item.trendRef])) ?? [],
    });

    for (const warning of calendar.warnings) {
      process.stderr.write(`提示: ${warning}\n`);
    }

    if (options.dryRun) {
      process.stdout.write(`${JSON.stringify(calendar, null, 2)}\n`);
      return 0;
    }

    const outPath = join(contentRoot, "calendar", `${date}.json`);
    if (existsSync(outPath) && options.force !== true) {
      process.stderr.write(
        `日历已存在: ${outPath}\n为保护人工编辑内容默认不覆盖；确认重建请加 --force\n`,
      );
      return 1;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(calendar, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify({ status: "written", outPath, date, count: calendar.count }, null, 2)}\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof ConfigError || error instanceof DataFileError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
