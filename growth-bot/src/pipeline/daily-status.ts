import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReviewStatuses } from "../review/review-file.ts";

/**
 * 每日流水线状态判断（GB-009）。
 *
 * 汇总当日各环节产物的存在性与有效性，给出人类可读状态和下一步建议。
 * 只读不写，不自动生成缺失文件。
 */

export type StepState = "done" | "missing" | "action-required" | "warn";

export interface StepStatus {
  key: string;
  label: string;
  state: StepState;
  /** 一句话说明当前情况（条数、缺失原因等） */
  detail: string;
}

export interface NextAction {
  hint: string;
  /** 可直接执行的命令；纯人工动作（写热点、勾审核）时为 null */
  command: string | null;
}

export interface DailyStatus {
  date: string;
  steps: StepStatus[];
  next: NextAction;
}

function readJsonSafe(filePath: string): { ok: boolean; data?: unknown; error?: string } {
  if (!existsSync(filePath)) {
    return { ok: false, error: "missing" };
  }
  try {
    return { ok: true, data: JSON.parse(readFileSync(filePath, "utf8")) };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

function countFiles(dir: string, suffix: string): number {
  if (!existsSync(dir)) {
    return -1;
  }
  return readdirSync(dir).filter((name) => name.endsWith(suffix)).length;
}

export interface StatusInput {
  date: string;
  dataRoot: string;
  contentRoot: string;
}

export function gatherDailyStatus(input: StatusInput): DailyStatus {
  const { date, dataRoot, contentRoot } = input;
  const steps: StepStatus[] = [];
  let next: NextAction | null = null;

  const propose = (hint: string, command: string | null): void => {
    if (next === null) {
      next = { hint, command };
    }
  };

  // 1. 项目状态
  const stateFile = readJsonSafe(join(dataRoot, "project-state", `${date}.json`));
  if (stateFile.ok) {
    steps.push({ key: "project-state", label: "项目状态", state: "done", detail: `data/project-state/${date}.json` });
  } else {
    steps.push({
      key: "project-state",
      label: "项目状态",
      state: "missing",
      detail: stateFile.error === "invalid" ? "文件损坏，需重新生成" : "未生成",
    });
    propose("采集项目状态", `npm run project:state -- --date ${date}`);
  }

  // 2. 热点（源文件 + 标准化结果）
  const trendsSourcePath = join(dataRoot, "trends", "source", `${date}.json`);
  const trendsFile = readJsonSafe(join(dataRoot, "trends", `${date}.json`));
  if (trendsFile.ok) {
    const trends = trendsFile.data as { count?: number; nonLeverageableCount?: number };
    steps.push({
      key: "trends",
      label: "热点数据",
      state: "done",
      detail: `${trends.count ?? "?"} 条（${trends.nonLeverageableCount ?? 0} 条不可借势）`,
    });
  } else if (!existsSync(trendsSourcePath)) {
    steps.push({
      key: "trends",
      label: "热点数据",
      state: "warn",
      detail: "无热点源文件（可选：缺失时日历用兜底角度）",
    });
    propose(
      `人工或 Codex 写入当日热点到 data/trends/source/${date}.json（模板: example.json），再执行 trends:import`,
      null,
    );
  } else {
    steps.push({ key: "trends", label: "热点数据", state: "missing", detail: "源文件已就绪，未标准化" });
    propose("标准化热点源文件", `npm run trends:import -- --date ${date}`);
  }

  // 3. 内容日历
  const calendarFile = readJsonSafe(join(contentRoot, "calendar", `${date}.json`));
  const calendarCount = calendarFile.ok ? ((calendarFile.data as { count?: number }).count ?? 0) : 0;
  if (calendarFile.ok) {
    steps.push({ key: "calendar", label: "内容日历", state: "done", detail: `${calendarCount} 条计划` });
  } else {
    steps.push({
      key: "calendar",
      label: "内容日历",
      state: "missing",
      detail: calendarFile.error === "invalid" ? "文件损坏" : "未生成",
    });
    propose("生成每日内容计划", `npm run daily:plan -- --date ${date}`);
  }

  // 4. 平台草稿
  const draftCount = countFiles(join(contentRoot, "drafts", date), ".md");
  if (draftCount > 0) {
    steps.push({ key: "drafts", label: "平台草稿", state: "done", detail: `${draftCount} 份` });
  } else {
    steps.push({ key: "drafts", label: "平台草稿", state: "missing", detail: "未生成" });
    propose("生成多平台草稿", `npm run drafts:generate -- --date ${date}`);
  }

  // 5. 人工审核
  const reviewPath = join(contentRoot, "review", `${date}.md`);
  let approvedCount = 0;
  if (!existsSync(reviewPath)) {
    steps.push({ key: "review", label: "人工审核", state: "missing", detail: "审核文件未生成" });
    propose("生成审核汇总", `npm run review:build -- --date ${date}`);
  } else {
    const statuses = parseReviewStatuses(readFileSync(reviewPath, "utf8"));
    const pending = statuses.filter((s) => s.decision === "pending").length;
    approvedCount = statuses.filter((s) => s.decision === "approve").length;
    const rejected = statuses.filter((s) => s.decision === "reject").length;
    const edited = statuses.filter((s) => s.decision === "edit").length;
    const detail = `${statuses.length} 条：Approve ${approvedCount} / Edit ${edited} / Reject ${rejected} / 待勾选 ${pending}`;
    if (pending > 0) {
      steps.push({ key: "review", label: "人工审核", state: "action-required", detail });
      propose(`需要人工审核：在 content/review/${date}.md 勾选剩余 ${pending} 条状态位`, null);
    } else if (approvedCount === 0) {
      steps.push({ key: "review", label: "人工审核", state: "done", detail: `${detail}（今日无可发布内容）` });
    } else {
      steps.push({ key: "review", label: "人工审核", state: "done", detail });
    }
  }

  // 6. 发布包
  const packagesDir = join(contentRoot, "publish-packages", date);
  const packagePlatforms = existsSync(packagesDir)
    ? readdirSync(packagesDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : -1;
  if (packagePlatforms > 0) {
    steps.push({ key: "packages", label: "发布包", state: "done", detail: `已生成，覆盖 ${packagePlatforms} 个平台` });
  } else if (approvedCount > 0) {
    steps.push({ key: "packages", label: "发布包", state: "missing", detail: "审核已通过，可导出" });
    propose("导出发布包", `npm run publish:package -- --date ${date}`);
  } else {
    steps.push({ key: "packages", label: "发布包", state: "missing", detail: "未生成（需先完成审核）" });
  }

  // 7. 发布记录
  const publishedFile = readJsonSafe(join(contentRoot, "published", `${date}.json`));
  if (publishedFile.ok) {
    const record = publishedFile.data as {
      entries?: { published?: boolean; metrics?: { impressions?: number | null } }[];
    };
    const entries = record.entries ?? [];
    const filled = entries.filter((e) => e.metrics?.impressions != null).length;
    if (entries.length > 0 && filled < entries.length) {
      steps.push({
        key: "published",
        label: "发布记录",
        state: "action-required",
        detail: `${entries.length} 条中 ${filled} 条已录入指标`,
      });
      propose(`人工发布后在 content/published/${date}.json 录入指标（已录 ${filled}/${entries.length}）`, null);
    } else {
      steps.push({ key: "published", label: "发布记录", state: "done", detail: `${entries.length} 条指标已录入` });
    }
  } else if (packagePlatforms > 0) {
    steps.push({ key: "published", label: "发布记录", state: "missing", detail: "未生成" });
    propose("生成发布记录骨架", `npm run publish:record -- --date ${date}`);
  } else {
    steps.push({ key: "published", label: "发布记录", state: "missing", detail: "未生成（需先导出发布包）" });
  }

  // 8. 每日复盘
  if (existsSync(join(contentRoot, "reviews", `${date}.md`))) {
    steps.push({ key: "retro", label: "每日复盘", state: "done", detail: `content/reviews/${date}.md` });
  } else if (publishedFile.ok) {
    steps.push({ key: "retro", label: "每日复盘", state: "missing", detail: "未生成" });
    propose("渲染复盘模板", `npm run retro:build -- --date ${date}`);
  } else {
    steps.push({ key: "retro", label: "每日复盘", state: "missing", detail: "未生成（需先有发布记录）" });
  }

  return {
    date,
    steps,
    next: next ?? { hint: "今日流程已全部完成 🎉", command: null },
  };
}

const STATE_ICONS: Record<StepState, string> = {
  done: "✅",
  missing: "❌",
  "action-required": "⏳",
  warn: "⚠️",
};

export function renderDailyStatus(status: DailyStatus): string {
  const lines = [`Growth Bot 状态 · ${status.date}`, ""];
  for (const step of status.steps) {
    lines.push(`${STATE_ICONS[step.state]} ${step.label.padEnd(4, "　")} ${step.detail}`);
  }
  lines.push("");
  lines.push(`下一步: ${status.next.hint}`);
  if (status.next.command !== null) {
    lines.push(`  ${status.next.command}`);
  }
  lines.push("");
  return lines.join("\n");
}
