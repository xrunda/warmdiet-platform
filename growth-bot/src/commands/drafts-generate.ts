import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { readJsonIfExists, resolvePlanDate, DataFileError } from "./daily-plan.ts";
import {
  buildDraftsForCalendar,
  draftContextFromProjectState,
} from "../generators/drafts.ts";
import type { CalendarFile } from "../pipeline/daily-calendar.ts";
import type { ProjectState } from "../sources/project-state.ts";

export interface DraftsGenerateOptions {
  dryRun: boolean;
  date?: string | undefined;
  force?: boolean | undefined;
  rootDir?: string | undefined;
}

/**
 * drafts:generate 命令：从当日内容日历生成多平台 Markdown 草稿。
 * 已存在的草稿文件默认跳过（保护人工编辑），--force 覆盖重建。
 */
export function runDraftsGenerate(options: DraftsGenerateOptions): number {
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

    const calendarPath = join(contentRoot, "calendar", `${date}.json`);
    const calendar = readJsonIfExists<CalendarFile>(calendarPath);
    if (calendar === null) {
      process.stderr.write(
        `缺少内容日历: ${calendarPath}\n请先执行: npm run daily:plan -- --date ${date}\n`,
      );
      return 1;
    }

    const statePath = join(dataRoot, "project-state", `${date}.json`);
    const projectState = readJsonIfExists<ProjectState>(statePath);
    if (projectState === null) {
      process.stderr.write(
        `缺少项目状态文件: ${statePath}\n请先执行: npm run project:state -- --date ${date}\n`,
      );
      return 1;
    }

    const drafts = buildDraftsForCalendar(
      calendar.items,
      draftContextFromProjectState(date, projectState),
    );

    const outDir = join(contentRoot, "drafts", date);
    const written: string[] = [];
    const skipped: string[] = [];
    const complianceWarnings = drafts
      .filter((draft) => !draft.compliancePass)
      .map((draft) => draft.fileName);

    if (!options.dryRun) {
      mkdirSync(outDir, { recursive: true });
      for (const draft of drafts) {
        const filePath = join(outDir, draft.fileName);
        if (existsSync(filePath) && options.force !== true) {
          skipped.push(draft.fileName);
          continue;
        }
        writeFileSync(filePath, draft.markdown);
        written.push(draft.fileName);
      }
    }

    if (skipped.length > 0) {
      process.stderr.write(
        `提示: ${skipped.length} 个草稿已存在被跳过（保护人工编辑，重建请加 --force）\n`,
      );
    }
    for (const fileName of complianceWarnings) {
      process.stderr.write(`警告: ${fileName} 未通过自动合规扫描，需改写\n`);
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          status: options.dryRun ? "dry-run" : "written",
          outDir,
          date,
          totalDrafts: drafts.length,
          written: options.dryRun ? 0 : written.length,
          skipped: skipped.length,
          platforms: [...new Set(drafts.map((draft) => draft.platform))],
          complianceWarnings,
        },
        null,
        2,
      )}\n`,
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
