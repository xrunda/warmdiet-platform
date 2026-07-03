import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, loadConfig } from "../config/load.ts";
import { resolvePlanDate, DataFileError } from "./daily-plan.ts";
import { parseReviewStatuses } from "../review/review-file.ts";
import { exportPackages } from "../review/publish-package.ts";

export interface PublishPackageOptions {
  dryRun: boolean;
  date?: string | undefined;
  rootDir?: string | undefined;
}

/**
 * publish:package 命令：读取审核文件的勾选结果，
 * 把 Approve 条目的草稿按平台导出到 content/publish-packages/yyyy-mm-dd/。
 */
export function runPublishPackage(options: PublishPackageOptions): number {
  const rootDir =
    options.rootDir ?? join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const contentRoot = isAbsolute(config.paths.contentDir)
      ? config.paths.contentDir
      : join(rootDir, config.paths.contentDir);

    const reviewPath = join(contentRoot, "review", `${date}.md`);
    if (!existsSync(reviewPath)) {
      process.stderr.write(
        `缺少审核文件: ${reviewPath}\n请先执行: npm run review:build -- --date ${date}，人工勾选后再导出\n`,
      );
      return 1;
    }

    const statuses = parseReviewStatuses(readFileSync(reviewPath, "utf8"));
    const approved = statuses.filter((s) => s.decision === "approve");
    const pending = statuses.filter((s) => s.decision === "pending");

    if (approved.length === 0) {
      process.stderr.write(
        `审核文件中没有 Approve 条目（pending: ${pending.length}）。请先在 ${reviewPath} 勾选状态位。\n`,
      );
      return 1;
    }
    if (pending.length > 0) {
      process.stderr.write(`提示: ${pending.length} 条尚未勾选状态，默认不进发布包\n`);
    }

    if (options.dryRun) {
      process.stdout.write(
        `${JSON.stringify({ status: "dry-run", date, approved: approved.map((s) => s.itemId) }, null, 2)}\n`,
      );
      return 0;
    }

    const result = exportPackages({
      date,
      draftsDir: join(contentRoot, "drafts", date),
      packagesRoot: join(contentRoot, "publish-packages"),
      statuses,
    });

    process.stdout.write(
      `${JSON.stringify(
        {
          status: "written",
          outDir: result.outDir,
          date,
          approvedItems: result.approvedCount,
          platforms: Object.fromEntries(
            Object.entries(result.platforms).map(([platform, entries]) => [platform, entries.length]),
          ),
          skipped: result.skipped,
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
