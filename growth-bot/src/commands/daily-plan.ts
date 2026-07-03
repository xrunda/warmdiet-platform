/**
 * 每日内容计划命令。
 *
 * GB-001 阶段只输出占位结果，用于验证 CLI 链路和目录约定。
 * 真实的选题生成依赖 GB-003（项目状态）、GB-004（热点导入）、GB-005（内容日历）。
 */

export interface DailyPlanOptions {
  dryRun: boolean;
  date?: string | undefined;
}

export interface DailyPlanResult {
  command: "daily:plan";
  status: "placeholder";
  date: string;
  dryRun: boolean;
  planned: {
    totalItems: number;
    platforms: string[];
    outputFile: string;
  };
  notes: string[];
}

const PLATFORMS = ["x", "xiaohongshu", "douyin", "wechat-video", "kuaishou"];

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

export function runDailyPlan(options: DailyPlanOptions): DailyPlanResult {
  const date = resolvePlanDate(options.date);
  return {
    command: "daily:plan",
    status: "placeholder",
    date,
    dryRun: options.dryRun,
    planned: {
      totalItems: 10,
      platforms: PLATFORMS,
      outputFile: `content/calendar/${date}.json`,
    },
    notes: [
      "GB-001 骨架阶段：本命令仅输出占位结果，不生成真实内容。",
      "选题生成将在 GB-005 实现，输入依赖 GB-003 项目状态与 GB-004 热点数据。",
    ],
  };
}
