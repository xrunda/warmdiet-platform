import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReviewMarkdown, parseReviewStatuses, type DraftMeta } from "./review-file.ts";
import { exportPackages } from "./publish-package.ts";
import type { CalendarFile, CalendarItem } from "../pipeline/daily-calendar.ts";

function calendarItem(id: string, overrides: Partial<CalendarItem> = {}): CalendarItem {
  return {
    id,
    category: "product-feature",
    angleKey: "hospital-console",
    angle: "医院端工作台一屏完成",
    platformTargets: ["x"],
    audience: "医生",
    assetType: "screenshot",
    riskLevel: "low",
    linkPolicy: "none",
    trendRef: null,
    trendUrl: null,
    assetHint: null,
    ...overrides,
  };
}

const CALENDAR: CalendarFile = {
  date: "2026-07-03",
  generatedAt: "2026-07-03T00:00:00.000Z",
  count: 2,
  items: [
    calendarItem("cal-2026-07-03-01"),
    calendarItem("cal-2026-07-03-02", { riskLevel: "medium", category: "trend" }),
  ],
  warnings: [],
};

function draftMeta(fileName: string, compliancePass = true): DraftMeta {
  const platform = fileName.split(".").at(-2)!;
  return { fileName, platform, compliancePass };
}

describe("buildReviewMarkdown", () => {
  const drafts = new Map([
    ["cal-2026-07-03-01", [draftMeta("cal-2026-07-03-01.x.md")]],
    ["cal-2026-07-03-02", [draftMeta("cal-2026-07-03-02.x.md", false)]],
  ]);
  const md = buildReviewMarkdown(CALENDAR, drafts);

  it("每条内容都有独立区块和三个状态位", () => {
    assert.equal((md.match(/^## cal-/gm) ?? []).length, 2);
    assert.equal((md.match(/\[ \] Approve　\[ \] Edit　\[ \] Reject/g) ?? []).length, 2);
  });

  it("风险与合规问题有醒目标记", () => {
    assert.ok(md.includes("⚠️ risk: medium"));
    assert.ok(md.includes("⚠️ 1 份草稿未过合规扫描"));
    assert.ok(md.includes("✅ 自动合规通过"));
  });

  it("无草稿的条目不显示合规通过，提示不可直接 Approve", () => {
    const noDrafts = buildReviewMarkdown(CALENDAR, new Map());
    assert.ok(noDrafts.includes("⚠️ 无草稿可扫描，不可直接 Approve"));
    assert.ok(!noDrafts.includes("✅ 自动合规通过"));
  });

  it("草稿链接指向 drafts 目录", () => {
    assert.ok(md.includes("[x](../drafts/2026-07-03/cal-2026-07-03-01.x.md)"));
  });

  it("紧凑可一屏浏览：每条区块不超过 6 行", () => {
    const sections = md.split(/\n(?=## )/).slice(1);
    for (const section of sections) {
      const lines = section.trimEnd().split("\n").filter((line) => line.trim() !== "");
      assert.ok(lines.length <= 6, `区块行数 ${lines.length} 超过 6`);
    }
  });
});

describe("parseReviewStatuses", () => {
  it("读取人工勾选结果，未勾选为 pending", () => {
    const md = buildReviewMarkdown(CALENDAR, new Map())
      .replace("[ ] Approve　[ ] Edit　[ ] Reject", "[x] Approve　[ ] Edit　[ ] Reject");
    const statuses = parseReviewStatuses(md);
    assert.deepEqual(statuses, [
      { itemId: "cal-2026-07-03-01", decision: "approve" },
      { itemId: "cal-2026-07-03-02", decision: "pending" },
    ]);
  });

  it("Edit 和 Reject 状态可识别", () => {
    let md = buildReviewMarkdown(CALENDAR, new Map());
    md = md.replace("[ ] Approve　[ ] Edit　[ ] Reject", "[ ] Approve　[x] Edit　[ ] Reject");
    md = md.replace("[ ] Approve　[ ] Edit　[ ] Reject", "[ ] Approve　[ ] Edit　[x] Reject");
    assert.deepEqual(
      parseReviewStatuses(md).map((s) => s.decision),
      ["edit", "reject"],
    );
  });
});

describe("exportPackages", () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "growth-bot-pkg-"));
    const draftsDir = join(dir, "drafts");
    mkdirSync(draftsDir, { recursive: true });
    for (const name of [
      "cal-2026-07-03-01.x.md",
      "cal-2026-07-03-01.xiaohongshu.md",
      "cal-2026-07-03-02.x.md",
    ]) {
      writeFileSync(join(draftsDir, name), `---\nstatus: draft\n---\n# ${name}\n`);
    }
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("只导出 Approve 条目，按平台分目录，manifest 完整", () => {
    const result = exportPackages({
      date: "2026-07-03",
      draftsDir: join(dir, "drafts"),
      packagesRoot: join(dir, "packages"),
      statuses: [
        { itemId: "cal-2026-07-03-01", decision: "approve" },
        { itemId: "cal-2026-07-03-02", decision: "reject" },
      ],
    });

    assert.equal(result.approvedCount, 1);
    assert.deepEqual(result.skipped, [{ itemId: "cal-2026-07-03-02", reason: "reject" }]);
    assert.ok(existsSync(join(dir, "packages", "2026-07-03", "x", "cal-2026-07-03-01.x.md")));
    assert.ok(
      existsSync(join(dir, "packages", "2026-07-03", "xiaohongshu", "cal-2026-07-03-01.xiaohongshu.md")),
    );
    assert.ok(!existsSync(join(dir, "packages", "2026-07-03", "x", "cal-2026-07-03-02.x.md")));

    const manifest = JSON.parse(
      readFileSync(join(dir, "packages", "2026-07-03", "x", "manifest.json"), "utf8"),
    );
    assert.equal(manifest.platform, "x");
    assert.equal(manifest.count, 1);

    const packaged = readFileSync(
      join(dir, "packages", "2026-07-03", "x", "cal-2026-07-03-01.x.md"),
      "utf8",
    );
    assert.ok(packaged.includes("status: approved"));
  });

  it("Approve 但草稿缺失的条目计入 skipped 而非静默丢失", () => {
    const result = exportPackages({
      date: "2026-07-03",
      draftsDir: join(dir, "drafts"),
      packagesRoot: join(dir, "packages"),
      statuses: [
        { itemId: "cal-2026-07-03-01", decision: "approve" },
        { itemId: "cal-2026-07-03-99", decision: "approve" },
      ],
    });
    assert.equal(result.approvedCount, 1);
    assert.deepEqual(result.skipped, [
      { itemId: "cal-2026-07-03-99", reason: "missing-drafts" },
    ]);
  });

  it("重复导出整体重建，反映最新审核结果", () => {
    const rerun = exportPackages({
      date: "2026-07-03",
      draftsDir: join(dir, "drafts"),
      packagesRoot: join(dir, "packages"),
      statuses: [
        { itemId: "cal-2026-07-03-01", decision: "reject" },
        { itemId: "cal-2026-07-03-02", decision: "approve" },
      ],
    });
    assert.equal(rerun.approvedCount, 1);
    assert.ok(!existsSync(join(dir, "packages", "2026-07-03", "xiaohongshu")));
    assert.ok(existsSync(join(dir, "packages", "2026-07-03", "x", "cal-2026-07-03-02.x.md")));
  });
});
