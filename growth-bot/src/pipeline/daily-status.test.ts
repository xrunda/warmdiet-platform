import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gatherDailyStatus, renderDailyStatus } from "./daily-status.ts";

const DATE = "2026-07-03";

describe("gatherDailyStatus", () => {
  let root: string;
  let dataRoot: string;
  let contentRoot: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "growth-bot-status-"));
    dataRoot = join(root, "data");
    contentRoot = join(root, "content");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function stepState(key: string) {
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    return status.steps.find((step) => step.key === key)!;
  }

  function writeJson(relPath: string, data: unknown): void {
    const filePath = join(root, relPath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(data));
  }

  function seedProjectState(): void {
    writeJson(`data/project-state/${DATE}.json`, { date: DATE });
  }
  function seedTrends(): void {
    writeJson(`data/trends/source/${DATE}.json`, { items: [] });
    writeJson(`data/trends/${DATE}.json`, { count: 3, nonLeverageableCount: 1 });
  }
  function seedCalendar(): void {
    writeJson(`content/calendar/${DATE}.json`, { count: 10, items: [] });
  }
  function seedDrafts(): void {
    mkdirSync(join(contentRoot, "drafts", DATE), { recursive: true });
    writeFileSync(join(contentRoot, "drafts", DATE, "cal-x.x.md"), "# 草稿");
  }
  function seedReview(statusLine: string): void {
    mkdirSync(join(contentRoot, "review"), { recursive: true });
    writeFileSync(
      join(contentRoot, "review", `${DATE}.md`),
      `# 内容审核\n\n## cal-01 ｜ trend ｜ risk: low\n\n- 状态: ${statusLine}\n`,
    );
  }
  function seedPackages(): void {
    mkdirSync(join(contentRoot, "publish-packages", DATE, "x"), { recursive: true });
  }
  function seedPublished(impressions: number | null): void {
    writeJson(`content/published/${DATE}.json`, {
      entries: [{ published: impressions !== null, metrics: { impressions } }],
    });
  }

  it("空目录：全部缺失，下一步是采集项目状态", () => {
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.ok(status.steps.every((step) => step.state !== "done"));
    assert.equal(status.next.command, `npm run project:state -- --date ${DATE}`);
  });

  it("热点源缺失时提示人工写入（可选警告，无命令）", () => {
    seedProjectState();
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.equal(stepState("trends").state, "warn");
    assert.equal(status.next.command, null);
    assert.ok(status.next.hint.includes(`data/trends/source/${DATE}.json`));
  });

  it("源文件就绪未标准化时建议 trends:import", () => {
    seedProjectState();
    writeJson(`data/trends/source/${DATE}.json`, { items: [] });
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.equal(status.next.command, `npm run trends:import -- --date ${DATE}`);
  });

  it("审核文件有待勾选条目时标记需要人工审核", () => {
    seedProjectState();
    seedTrends();
    seedCalendar();
    seedDrafts();
    seedReview("[ ] Approve　[ ] Edit　[ ] Reject");
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.equal(stepState("review").state, "action-required");
    assert.equal(status.next.command, null);
    assert.ok(status.next.hint.includes("人工审核"));
  });

  it("审核通过后建议导出发布包", () => {
    seedProjectState();
    seedTrends();
    seedCalendar();
    seedDrafts();
    seedReview("[x] Approve　[ ] Edit　[ ] Reject");
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.equal(stepState("review").state, "done");
    assert.equal(status.next.command, `npm run publish:package -- --date ${DATE}`);
  });

  it("发布记录指标未录满时提示人工录入", () => {
    seedProjectState();
    seedTrends();
    seedCalendar();
    seedDrafts();
    seedReview("[x] Approve　[ ] Edit　[ ] Reject");
    seedPackages();
    seedPublished(null);
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.equal(stepState("published").state, "action-required");
    assert.ok(status.next.hint.includes("录入指标"));
  });

  it("全部完成时输出完成提示", () => {
    seedProjectState();
    seedTrends();
    seedCalendar();
    seedDrafts();
    seedReview("[x] Approve　[ ] Edit　[ ] Reject");
    seedPackages();
    seedPublished(1200);
    mkdirSync(join(contentRoot, "reviews"), { recursive: true });
    writeFileSync(join(contentRoot, "reviews", `${DATE}.md`), "# 复盘");
    const status = gatherDailyStatus({ date: DATE, dataRoot, contentRoot });
    assert.ok(status.steps.every((step) => step.state === "done"));
    assert.equal(status.next.command, null);
    assert.ok(status.next.hint.includes("完成"));
  });

  it("损坏的 JSON 视为缺失并提示重新生成", () => {
    mkdirSync(join(dataRoot, "project-state"), { recursive: true });
    writeFileSync(join(dataRoot, "project-state", `${DATE}.json`), "{broken");
    assert.equal(stepState("project-state").state, "missing");
    assert.ok(stepState("project-state").detail.includes("损坏"));
  });
});

describe("renderDailyStatus", () => {
  it("渲染含图标、八个环节和下一步命令", () => {
    const dir = mkdtempSync(join(tmpdir(), "growth-bot-render-"));
    try {
      const text = renderDailyStatus(
        gatherDailyStatus({ date: DATE, dataRoot: join(dir, "d"), contentRoot: join(dir, "c") }),
      );
      assert.ok(text.includes(`Growth Bot 状态 · ${DATE}`));
      assert.equal((text.match(/❌|✅|⏳|⚠️/g) ?? []).length, 8);
      assert.ok(text.includes("下一步:"));
      assert.ok(text.includes("npm run project:state"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
