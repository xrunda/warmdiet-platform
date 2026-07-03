import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ConfigError, loadConfig } from "../config/load.ts";
import { defaultRootDir, resolveContentRoot, resolveDataRoot } from "./paths.ts";
import { resolvePlanDate } from "./daily-plan.ts";
import { runProjectState } from "./project-state.ts";
import { runTrendsImport } from "./trends-import.ts";
import { runDailyPlan } from "./daily-plan.ts";
import { runDraftsGenerate } from "./drafts-generate.ts";
import { runReviewBuild } from "./review-build.ts";
import { runPublishPackage } from "./publish-package.ts";
import { runPublishRecord, runRetroBuild } from "./publish-record.ts";
import { parseReviewStatuses } from "../review/review-file.ts";
import { planDailyRun, GENERATION_KEYS, PUBLISH_KEYS, type DailyRunSnapshot, type PlannedStep } from "../pipeline/daily-run-plan.ts";
import { gatherDailyStatus, renderDailyStatus } from "../pipeline/daily-status.ts";

export interface DailyRunOptions {
  dryRun: boolean;
  date?: string | undefined;
  force?: boolean | undefined;
  rootDir?: string | undefined;
}

function takeSnapshot(dataRoot: string, contentRoot: string, date: string): DailyRunSnapshot {
  const reviewPath = join(contentRoot, "review", `${date}.md`);
  let review: DailyRunSnapshot["review"] = null;
  if (existsSync(reviewPath)) {
    const statuses = parseReviewStatuses(readFileSync(reviewPath, "utf8"));
    review = {
      total: statuses.length,
      approved: statuses.filter((s) => s.decision === "approve").length,
      pending: statuses.filter((s) => s.decision === "pending").length,
    };
  }
  const draftsDir = join(contentRoot, "drafts", date);
  return {
    hasProjectState: existsSync(join(dataRoot, "project-state", `${date}.json`)),
    hasTrendsSource: existsSync(join(dataRoot, "trends", "source", `${date}.json`)),
    hasTrends: existsSync(join(dataRoot, "trends", `${date}.json`)),
    hasCalendar: existsSync(join(contentRoot, "calendar", `${date}.json`)),
    hasDrafts: existsSync(draftsDir) && readdirSync(draftsDir).some((f) => f.endsWith(".md")),
    hasReview: existsSync(reviewPath),
    review,
    hasPackages: existsSync(join(contentRoot, "publish-packages", date)),
    hasRecord: existsSync(join(contentRoot, "published", `${date}.json`)),
    hasRetro: existsSync(join(contentRoot, "reviews", `${date}.md`)),
  };
}

const ACTION_ICONS: Record<PlannedStep["action"], string> = {
  run: "▶",
  skip: "⏭",
  manual: "✋",
  blocked: "⏸",
};

/**
 * daily:run 命令（GB-010）：一键串联当日流水线。
 *
 * 生成阶段（项目状态 → 热点 → 日历 → 草稿 → 审核汇总）总是尽量推进；
 * 发布阶段（发布包 → 发布记录 → 复盘）由人工审核状态门控——
 * 有待勾选或无 Approve 时明确停下，不误导用户认为内容可发布。
 */
export function runDailyRun(options: DailyRunOptions): number {
  const rootDir = options.rootDir ?? defaultRootDir();
  const force = options.force === true;
  try {
    const config = loadConfig(join(rootDir, "config"));
    const date = resolvePlanDate(options.date);
    const dataRoot = resolveDataRoot(config, rootDir);
    const contentRoot = resolveContentRoot(config, rootDir);

    const plan = planDailyRun(takeSnapshot(dataRoot, contentRoot, date), force);

    if (options.dryRun) {
      process.stdout.write(`daily:run 计划 · ${date}\n\n`);
      for (const step of plan.steps) {
        process.stdout.write(`${ACTION_ICONS[step.action]} ${step.label}　${step.reason}\n`);
      }
      process.stdout.write("\n（--dry-run 未执行任何步骤）\n");
      return 0;
    }

    // 步骤 key → 实际执行函数；--force 只透传给内容再生成步骤
    const runners: Record<string, () => number> = {
      "project-state": () => runProjectState({ dryRun: false, date, rootDir }),
      trends: () => runTrendsImport({ dryRun: false, date, rootDir }),
      calendar: () => runDailyPlan({ dryRun: false, date, force, rootDir }),
      drafts: () => runDraftsGenerate({ dryRun: false, date, force, rootDir }),
      review: () => runReviewBuild({ dryRun: false, date, rootDir }),
      packages: () => runPublishPackage({ dryRun: false, date, rootDir }),
      record: () => runPublishRecord({ dryRun: false, date, rootDir }),
      retro: () => runRetroBuild({ dryRun: false, date, rootDir }),
    };

    // 第一阶段：生成（project-state ~ review）
    const generationSteps = plan.steps.filter((s) =>
      (GENERATION_KEYS as readonly string[]).includes(s.key),
    );
    for (const step of generationSteps) {
      process.stdout.write(`\n${ACTION_ICONS[step.action]} ${step.label}: ${step.reason}\n`);
      if (step.action !== "run") {
        continue;
      }
      const code = runners[step.key]!();
      if (code !== 0) {
        process.stderr.write(`\ndaily:run 中止：步骤「${step.label}」失败（见上方错误信息）\n`);
        return 1;
      }
    }

    // 第二阶段：发布，重新读取审核状态（审核文件可能刚生成或刚被人工勾选）
    const freshPlan = planDailyRun(takeSnapshot(dataRoot, contentRoot, date), force);
    if (freshPlan.publishBlocked) {
      process.stdout.write(
        `\n⏸ 发布阶段暂停：${freshPlan.blockReason}\n` +
          `   完成勾选后再次运行 npm run daily:run（已完成的步骤会自动跳过），\n` +
          `   或直接执行 npm run publish:package -- --date ${date}\n`,
      );
    } else {
      for (const step of freshPlan.steps.filter((s) =>
        (PUBLISH_KEYS as readonly string[]).includes(s.key),
      )) {
        process.stdout.write(`\n${ACTION_ICONS[step.action]} ${step.label}: ${step.reason}\n`);
        if (step.action !== "run") {
          continue;
        }
        const code = runners[step.key]!();
        if (code !== 0) {
          process.stderr.write(`\ndaily:run 中止：步骤「${step.label}」失败（见上方错误信息）\n`);
          return 1;
        }
      }
    }

    // 收尾：复用 GB-009 状态汇总
    process.stdout.write(
      `\n${renderDailyStatus(gatherDailyStatus({ date, dataRoot, contentRoot }))}`,
    );
    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
