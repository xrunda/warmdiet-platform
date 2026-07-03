/**
 * daily:run 编排计划（GB-010）。
 *
 * 纯函数：根据当日产物快照决定每个步骤是执行、跳过、等待人工还是被阻塞。
 * 关键约束：--force 只作用于内容再生成（daily:plan / drafts:generate），
 * 永不覆盖人工数据载体（审核文件、发布记录、复盘），不自动修改审核结果。
 */

export type StepAction = "run" | "skip" | "manual" | "blocked";

export interface PlannedStep {
  key: string;
  label: string;
  action: StepAction;
  reason: string;
}

export interface DailyRunSnapshot {
  hasProjectState: boolean;
  hasTrendsSource: boolean;
  hasTrends: boolean;
  hasCalendar: boolean;
  hasDrafts: boolean;
  hasReview: boolean;
  /** 审核文件解析结果；文件不存在时为 null */
  review: { total: number; approved: number; pending: number } | null;
  hasPackages: boolean;
  hasRecord: boolean;
  hasRetro: boolean;
}

export interface DailyRunPlan {
  steps: PlannedStep[];
  /** 发布阶段是否被人工审核阻塞 */
  publishBlocked: boolean;
  blockReason: string | null;
}

export function planDailyRun(snapshot: DailyRunSnapshot, force: boolean): DailyRunPlan {
  const steps: PlannedStep[] = [];

  steps.push({
    key: "project-state",
    label: "项目状态",
    action: "run",
    reason: "派生数据，每次运行刷新",
  });

  if (snapshot.hasTrendsSource) {
    steps.push({ key: "trends", label: "热点导入", action: "run", reason: "源文件已就绪" });
  } else {
    steps.push({
      key: "trends",
      label: "热点导入",
      action: "manual",
      reason: "无热点源文件，跳过（日历将使用兜底角度）；如需热点请先写入源文件",
    });
  }

  if (snapshot.hasCalendar && !force) {
    steps.push({ key: "calendar", label: "内容日历", action: "skip", reason: "已存在，保护人工编辑（--force 重建）" });
  } else {
    steps.push({
      key: "calendar",
      label: "内容日历",
      action: "run",
      reason: snapshot.hasCalendar ? "--force 重建" : "未生成",
    });
  }

  steps.push({
    key: "drafts",
    label: "平台草稿",
    action: "run",
    reason: force ? "--force 覆盖重建" : "增量生成（已有文件自动跳过）",
  });

  if (snapshot.hasReview) {
    steps.push({
      key: "review",
      label: "审核汇总",
      action: "skip",
      reason: "已存在（可能含人工勾选，永不覆盖）",
    });
  } else {
    steps.push({ key: "review", label: "审核汇总", action: "run", reason: "未生成" });
  }

  // 发布阶段：由审核状态门控
  let publishBlocked = false;
  let blockReason: string | null = null;

  const review = snapshot.review;
  if (review === null || !snapshot.hasReview) {
    publishBlocked = true;
    blockReason = "审核文件刚生成或尚未勾选，等待人工审核";
  } else if (review.pending > 0) {
    publishBlocked = true;
    blockReason = `还有 ${review.pending} 条待勾选，等待人工审核`;
  } else if (review.approved === 0) {
    publishBlocked = true;
    blockReason = "没有 Approve 条目（全部 Edit/Reject），今日无发布内容";
  }

  if (publishBlocked) {
    for (const [key, label] of [
      ["packages", "发布包"],
      ["record", "发布记录"],
      ["retro", "每日复盘"],
    ] as const) {
      steps.push({ key, label, action: "blocked", reason: blockReason! });
    }
    return { steps, publishBlocked, blockReason };
  }

  steps.push(
    snapshot.hasPackages && snapshot.hasRecord
      ? { key: "packages", label: "发布包", action: "skip", reason: "已导出且已有发布记录" }
      : { key: "packages", label: "发布包", action: "run", reason: `导出 ${review!.approved} 条 Approve 条目` },
  );
  steps.push(
    snapshot.hasRecord
      ? { key: "record", label: "发布记录", action: "skip", reason: "已存在（可能含人工录入指标，永不覆盖）" }
      : { key: "record", label: "发布记录", action: "run", reason: "生成待录入骨架" },
  );
  steps.push(
    snapshot.hasRetro
      ? { key: "retro", label: "每日复盘", action: "skip", reason: "已存在（可能含人工结论，永不覆盖）" }
      : { key: "retro", label: "每日复盘", action: "run", reason: "渲染复盘模板" },
  );

  return { steps, publishBlocked: false, blockReason: null };
}
