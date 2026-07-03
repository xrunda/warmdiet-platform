import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import { setReviewDecision, buildReviewMarkdown } from "../review/review-file.ts";
import { buildOverview } from "./overview.ts";
import { createDashboardServer } from "./server.ts";
import { runDailyRun } from "../commands/daily-run.ts";
import type { CalendarFile } from "../pipeline/daily-calendar.ts";

const REAL_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/* eslint-disable @typescript-eslint/no-explicit-any */
async function json(res: Response): Promise<any> {
  return (await res.json()) as any;
}
const DATE = "2026-07-03";

function makeCalendar(): CalendarFile {
  return {
    date: DATE,
    generatedAt: "2026-07-03T00:00:00.000Z",
    count: 2,
    items: [
      {
        id: "cal-2026-07-03-01", category: "product-feature", angleKey: "a", angle: "角度一",
        platformTargets: ["x"], audience: "医生", assetType: "text", riskLevel: "low",
        linkPolicy: "none", trendRef: null, trendUrl: null, assetHint: null,
      },
      {
        id: "cal-2026-07-03-02", category: "trend", angleKey: "b", angle: "角度二",
        platformTargets: ["xiaohongshu"], audience: "家属", assetType: "text", riskLevel: "medium",
        linkPolicy: "none", trendRef: null, trendUrl: null, assetHint: null,
      },
    ],
    warnings: [],
  };
}

describe("setReviewDecision", () => {
  const md = buildReviewMarkdown(makeCalendar(), new Map());

  it("只改目标条目的状态行，可设置四种决策", () => {
    let out = setReviewDecision(md, "cal-2026-07-03-01", "approve");
    out = setReviewDecision(out, "cal-2026-07-03-02", "reject");
    assert.ok(out.includes("[x] Approve"));
    assert.ok(out.includes("[x] Reject"));
    const back = setReviewDecision(out, "cal-2026-07-03-01", "pending");
    assert.equal((back.match(/\[x\]/g) ?? []).length, 1);
  });

  it("条目不存在时抛错", () => {
    assert.throws(() => setReviewDecision(md, "cal-no-such", "approve"), /不存在条目/);
  });
});

describe("dashboard 集成（临时项目根 + 真实 HTTP）", () => {
  let root: string;
  let server: Server;
  let base: string;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), "growth-bot-dash-"));
    mkdirSync(join(root, "config"), { recursive: true });
    for (const name of ["project", "platforms", "paths"]) {
      cpSync(join(REAL_ROOT, "config", `${name}.example.json`), join(root, "config", `${name}.json`));
    }
    mkdirSync(join(root, "data", "trends", "source"), { recursive: true });
    cpSync(
      join(REAL_ROOT, "data", "trends", "source", "example.json"),
      join(root, "data", "trends", "source", `${DATE}.json`),
    );
    // 先跑一轮 daily:run 造出生成阶段产物
    assert.equal(runDailyRun({ dryRun: false, date: DATE, rootDir: root }), 0);

    server = createDashboardServer(root);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };
    base = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });

  it("GET / 返回工作台页面", async () => {
    const res = await fetch(`${base}/?date=${DATE}`);
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes("Growth Bot 工作台"));
  });

  it("GET /api/overview 聚合当日数据且不暴露路径配置", async () => {
    const res = await fetch(`${base}/api/overview?date=${DATE}`);
    assert.equal(res.status, 200);
    const body = await json(res);
    assert.equal(body.date, DATE);
    assert.equal(body.calendar.count, 10);
    assert.ok(body.drafts.length > 0);
    assert.equal(body.review.exists, true);
    assert.equal(body.status.steps.length, 8);
    assert.ok(!JSON.stringify(body).includes("privateMaterialsDir"));
  });

  it("POST /api/review-decision 写回审核文件", async () => {
    const overview = await json(await fetch(`${base}/api/overview?date=${DATE}`));
    const firstId = overview.review.statuses[0].itemId;
    const res = await fetch(`${base}/api/review-decision?date=${DATE}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: firstId, decision: "approve" }),
    });
    assert.equal(res.status, 200);
    const body = await json(res);
    assert.equal(body.overview.review.statuses.find((s: { itemId: string }) => s.itemId === firstId).decision, "approve");
    assert.ok(readFileSync(join(root, "content", "review", `${DATE}.md`), "utf8").includes("[x] Approve"));
  });

  it("POST /api/review-decision 拒绝非法输入", async () => {
    const res = await fetch(`${base}/api/review-decision?date=${DATE}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: "cal-x", decision: "ship-it" }),
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/publish-package：零 Approve 时导出被拒，勾选后成功", async () => {
    const reviewPath = join(root, "content", "review", `${DATE}.md`);
    // 重置为全部待勾选（覆盖前面测试勾的 approve）→ 零 Approve 应拒绝
    writeFileSync(
      reviewPath,
      readFileSync(reviewPath, "utf8").replace(/\[x\]/g, "[ ]"),
    );
    const blocked = await fetch(`${base}/api/publish-package?date=${DATE}`, { method: "POST" });
    assert.equal((await json(blocked)).exitCode, 1, "零 Approve 时应拒绝导出");

    // 1 条 Approve + 其余 Reject → 导出成功且只含 Approve 条目
    let md = readFileSync(reviewPath, "utf8");
    md = md.replace("[ ] Approve　[ ] Edit　[ ] Reject", "[x] Approve　[ ] Edit　[ ] Reject");
    md = md.replaceAll("[ ] Approve　[ ] Edit　[ ] Reject", "[ ] Approve　[ ] Edit　[x] Reject");
    writeFileSync(reviewPath, md);

    const ok = await fetch(`${base}/api/publish-package?date=${DATE}`, { method: "POST" });
    const body = await json(ok);
    assert.equal(body.exitCode, 0);
    assert.ok(existsSync(join(root, "content", "publish-packages", DATE)));
    const exportedIds = new Set(
      Object.values(body.overview.packages.platforms as Record<string, { itemId: string }[]>)
        .flat()
        .map((f) => f.itemId),
    );
    assert.equal(exportedIds.size, 1, "发布包应只含唯一 Approve 条目");
  });

  it("buildOverview 对空日期给出全缺失状态", () => {
    const overview = buildOverview(join(root, "data"), join(root, "content"), "2026-01-01");
    assert.equal(overview.calendar, null);
    assert.equal(overview.drafts.length, 0);
    assert.equal(overview.review.exists, false);
    assert.ok(overview.status.next.command !== null);
  });
});
