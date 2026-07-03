import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ConfigError, loadConfig } from "../config/load.ts";
import { defaultRootDir, resolveContentRoot } from "./paths.ts";
import { resolvePlanDate, DataFileError, readJsonIfExists } from "./daily-plan.ts";
import {
  buildPublishRecord,
  buildRetroMarkdown,
  collectPackageEntries,
  type PublishedFile,
} from "../review/publish-record.ts";

interface CommonOptions {
  dryRun: boolean;
  date?: string | undefined;
  force?: boolean | undefined;
  rootDir?: string | undefined;
}

function contentRootOf(rootDir: string): string {
  return resolveContentRoot(loadConfig(join(rootDir, "config")), rootDir);
}

/**
 * publish:record 命令：从发布包 manifest 生成发布记录骨架
 * content/published/yyyy-mm-dd.json。人工在其中录入指标，默认不覆盖。
 */
export function runPublishRecord(options: CommonOptions): number {
  const rootDir = options.rootDir ?? defaultRootDir();
  try {
    const date = resolvePlanDate(options.date);
    const contentRoot = contentRootOf(rootDir);

    const packageDir = join(contentRoot, "publish-packages", date);
    const entries = collectPackageEntries(packageDir);
    if (entries.length === 0) {
      process.stderr.write(
        `未找到发布包: ${packageDir}\n请先执行: npm run publish:package -- --date ${date}\n`,
      );
      return 1;
    }

    const record = buildPublishRecord(date, entries);

    if (options.dryRun) {
      process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
      return 0;
    }

    const outPath = join(contentRoot, "published", `${date}.json`);
    if (existsSync(outPath) && options.force !== true) {
      process.stderr.write(
        `发布记录已存在: ${outPath}\n其中可能有人工录入的指标，默认不覆盖；确认重建请加 --force\n`,
      );
      return 1;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(record, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify({ status: "written", outPath, date, entries: entries.length }, null, 2)}\n`,
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

/**
 * retro:build 命令：把发布记录渲染成复盘模板
 * content/reviews/yyyy-mm-dd.md。复盘结论为人工写作区，默认不覆盖。
 */
export function runRetroBuild(options: CommonOptions): number {
  const rootDir = options.rootDir ?? defaultRootDir();
  try {
    const date = resolvePlanDate(options.date);
    const contentRoot = contentRootOf(rootDir);

    const recordPath = join(contentRoot, "published", `${date}.json`);
    const record = readJsonIfExists<PublishedFile>(recordPath);
    if (record === null) {
      process.stderr.write(
        `缺少发布记录: ${recordPath}\n请先执行: npm run publish:record -- --date ${date}\n`,
      );
      return 1;
    }

    const markdown = buildRetroMarkdown(record);

    if (options.dryRun) {
      process.stdout.write(markdown);
      return 0;
    }

    const outPath = join(contentRoot, "reviews", `${date}.md`);
    if (existsSync(outPath) && options.force !== true) {
      process.stderr.write(
        `复盘文件已存在: ${outPath}\n其中可能有人工复盘结论，默认不覆盖；确认重建请加 --force\n`,
      );
      return 1;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, markdown);
    process.stdout.write(
      `${JSON.stringify({ status: "written", outPath, date }, null, 2)}\n`,
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
