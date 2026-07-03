import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { readJsonIfExists, resolvePlanDate, DataFileError } from "./daily-plan.ts";
import { buildReviewMarkdown, type DraftMeta } from "../review/review-file.ts";
import type { CalendarFile } from "../pipeline/daily-calendar.ts";

export interface ReviewBuildOptions {
  dryRun: boolean;
  date?: string | undefined;
  force?: boolean | undefined;
  rootDir?: string | undefined;
}

/** 从草稿目录读取 frontmatter 元数据，按日历条目分组 */
export function loadDraftMetas(draftsDir: string): Map<string, DraftMeta[]> {
  const byItem = new Map<string, DraftMeta[]>();
  if (!existsSync(draftsDir)) {
    return byItem;
  }
  for (const fileName of readdirSync(draftsDir).sort()) {
    const match = fileName.match(/^(?<itemId>.+)\.(?<platform>[a-z-]+)\.md$/);
    if (match?.groups === undefined) {
      continue;
    }
    const content = readFileSync(join(draftsDir, fileName), "utf8");
    const meta: DraftMeta = {
      fileName,
      platform: match.groups.platform!,
      compliancePass: !content.includes("compliancePass: false"),
    };
    const itemId = match.groups.itemId!;
    const list = byItem.get(itemId) ?? [];
    list.push(meta);
    byItem.set(itemId, list);
  }
  return byItem;
}

/**
 * review:build 命令：生成 content/review/yyyy-mm-dd.md 审核汇总。
 * 审核文件承载人工勾选结果，默认不覆盖，--force 重建。
 */
export function runReviewBuild(options: ReviewBuildOptions): number {
  const rootDir =
    options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const contentRoot = isAbsolute(config.paths.contentDir)
      ? config.paths.contentDir
      : join(rootDir, config.paths.contentDir);

    const calendarPath = join(contentRoot, "calendar", `${date}.json`);
    const calendar = readJsonIfExists<CalendarFile>(calendarPath);
    if (calendar === null) {
      process.stderr.write(
        `缺少内容日历: ${calendarPath}\n请先执行: npm run daily:plan -- --date ${date}\n`,
      );
      return 1;
    }

    const draftsDir = join(contentRoot, "drafts", date);
    const draftsByItem = loadDraftMetas(draftsDir);
    if (draftsByItem.size === 0) {
      process.stderr.write(
        `提示: ${draftsDir} 下没有草稿，审核文件将不含草稿链接（可先执行 npm run drafts:generate）\n`,
      );
    }

    const markdown = buildReviewMarkdown(calendar, draftsByItem);

    if (options.dryRun) {
      process.stdout.write(markdown);
      return 0;
    }

    const outPath = join(contentRoot, "review", `${date}.md`);
    if (existsSync(outPath) && options.force !== true) {
      process.stderr.write(
        `审核文件已存在: ${outPath}\n其中可能有人工勾选结果，默认不覆盖；确认重建请加 --force\n`,
      );
      return 1;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, markdown);
    process.stdout.write(
      `${JSON.stringify({ status: "written", outPath, date, items: calendar.count }, null, 2)}\n`,
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
