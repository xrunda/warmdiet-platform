import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planDailyRun, type DailyRunSnapshot } from "./daily-run-plan.ts";

function snapshot(overrides: Partial<DailyRunSnapshot> = {}): DailyRunSnapshot {
  return {
    hasProjectState: false,
    hasTrendsSource: false,
    hasTrends: false,
    hasCalendar: false,
    hasDrafts: false,
    hasReview: false,
    review: null,
    hasPackages: false,
    hasRecord: false,
    hasRetro: false,
    ...overrides,
  };
}

function actionOf(plan: ReturnType<typeof planDailyRun>, key: string) {
  return plan.steps.find((step) => step.key === key)!;
}

describe("planDailyRun", () => {
  it("全新一天：生成阶段全跑，发布阶段被审核阻塞", () => {
    const plan = planDailyRun(snapshot(), false);
    assert.equal(actionOf(plan, "project-state").action, "run");
    assert.equal(actionOf(plan, "trends").action, "manual");
    assert.equal(actionOf(plan, "calendar").action, "run");
    assert.equal(actionOf(plan, "review").action, "run");
    assert.equal(plan.publishBlocked, true);
    assert.equal(actionOf(plan, "packages").action, "blocked");
  });

  it("热点源就绪时热点导入执行", () => {
    const plan = planDailyRun(snapshot({ hasTrendsSource: true }), false);
    assert.equal(actionOf(plan, "trends").action, "run");
  });

  it("日历已存在默认跳过（保护人工编辑），--force 才重建", () => {
    assert.equal(
      actionOf(planDailyRun(snapshot({ hasCalendar: true }), false), "calendar").action,
      "skip",
    );
    assert.equal(
      actionOf(planDailyRun(snapshot({ hasCalendar: true }), true), "calendar").action,
      "run",
    );
  });

  it("审核文件已存在时永不覆盖，即使 --force", () => {
    const withReview = snapshot({
      hasReview: true,
      review: { total: 10, approved: 2, pending: 8 },
    });
    assert.equal(actionOf(planDailyRun(withReview, true), "review").action, "skip");
  });

  it("有待勾选条目时发布阶段阻塞并说明数量", () => {
    const plan = planDailyRun(
      snapshot({ hasReview: true, review: { total: 10, approved: 2, pending: 8 } }),
      false,
    );
    assert.equal(plan.publishBlocked, true);
    assert.ok(plan.blockReason!.includes("8 条待勾选"));
  });

  it("全部勾完但零 Approve：阻塞并说明今日无发布内容", () => {
    const plan = planDailyRun(
      snapshot({ hasReview: true, review: { total: 10, approved: 0, pending: 0 } }),
      false,
    );
    assert.equal(plan.publishBlocked, true);
    assert.ok(plan.blockReason!.includes("无发布内容"));
  });

  it("审核完成且有 Approve：发布阶段放行", () => {
    const plan = planDailyRun(
      snapshot({ hasReview: true, review: { total: 10, approved: 3, pending: 0 } }),
      false,
    );
    assert.equal(plan.publishBlocked, false);
    assert.equal(actionOf(plan, "packages").action, "run");
    assert.equal(actionOf(plan, "record").action, "run");
    assert.equal(actionOf(plan, "retro").action, "run");
  });

  it("发布记录与复盘已存在时跳过，--force 也不覆盖", () => {
    const plan = planDailyRun(
      snapshot({
        hasReview: true,
        review: { total: 10, approved: 3, pending: 0 },
        hasPackages: true,
        hasRecord: true,
        hasRetro: true,
      }),
      true,
    );
    assert.equal(actionOf(plan, "record").action, "skip");
    assert.equal(actionOf(plan, "retro").action, "skip");
  });
});
