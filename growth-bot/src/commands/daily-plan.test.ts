import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePlanDate, runDailyPlan } from "./daily-plan.ts";

describe("resolvePlanDate", () => {
  it("透传合法的 yyyy-mm-dd 日期", () => {
    assert.equal(resolvePlanDate("2026-07-03"), "2026-07-03");
  });

  it("拒绝非法日期格式", () => {
    assert.throws(() => resolvePlanDate("2026/07/03"), /无效日期/);
    assert.throws(() => resolvePlanDate("today"), /无效日期/);
  });

  it("缺省时返回当天日期", () => {
    const fixed = new Date(2026, 6, 3);
    assert.equal(resolvePlanDate(undefined, fixed), "2026-07-03");
  });
});

describe("runDailyPlan", () => {
  it("dry-run 输出占位计划结构", () => {
    const result = runDailyPlan({ dryRun: true, date: "2026-07-03" });
    assert.equal(result.command, "daily:plan");
    assert.equal(result.status, "placeholder");
    assert.equal(result.dryRun, true);
    assert.equal(result.planned.totalItems, 10);
    assert.equal(result.planned.outputFile, "content/calendar/2026-07-03.json");
  });

  it("覆盖 PRD 要求的五个平台", () => {
    const result = runDailyPlan({ dryRun: true, date: "2026-07-03" });
    assert.deepEqual(result.planned.platforms, [
      "x",
      "xiaohongshu",
      "douyin",
      "wechat-video",
      "kuaishou",
    ]);
  });
});
