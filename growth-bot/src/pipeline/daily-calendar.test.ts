import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateCalendar,
  CONTENT_MIX,
  MAX_LINK_ITEMS,
  ALL_PLATFORMS,
  type GenerateCalendarInput,
} from "./daily-calendar.ts";
import type { ProjectState } from "../sources/project-state.ts";
import type { NormalizedTrendItem } from "../sources/trends.ts";

const PROJECT_STATE: ProjectState = {
  date: "2026-07-03",
  generatedAt: "2026-07-03T00:00:00.000Z",
  repo: { owner: "xrunda", name: "warmdiet-platform", url: "https://github.com/xrunda/warmdiet-platform" },
  demoUrls: { hospital: "https://demo.example.com/", family: "https://demo.example.com/family/" },
  positioning: "开源三餐随诊平台",
  summary: "面向老年患者的医疗健康管理平台",
  testAccounts: [],
  assets: { promoVideo: "assets/source/promo-90s.mp4", assetsDir: "assets" },
  source: { readmePath: "../README.md", readmeFound: true },
};

function trend(id: string, overrides: Partial<NormalizedTrendItem> = {}): NormalizedTrendItem {
  return {
    id,
    title: `热点 ${id}`,
    source: "测试来源",
    url: "https://example.com/news",
    summary: "摘要",
    tags: ["养老"],
    riskLevel: "low",
    publishedAt: null,
    credibility: "medium",
    sensitive: false,
    leverageable: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<GenerateCalendarInput> = {}): GenerateCalendarInput {
  return {
    date: "2026-07-03",
    projectState: PROJECT_STATE,
    trends: [trend("t-01", { credibility: "high" }), trend("t-02")],
    now: new Date(0),
    ...overrides,
  };
}

describe("generateCalendar", () => {
  it("默认生成 10 条（验收标准）", () => {
    const calendar = generateCalendar(baseInput());
    assert.equal(calendar.count, 10);
    assert.equal(calendar.items.length, 10);
  });

  it("类型配比符合 PRD 第 6 节", () => {
    const calendar = generateCalendar(baseInput());
    for (const { category, count } of CONTENT_MIX) {
      const actual = calendar.items.filter((item) => item.category === category).length;
      assert.equal(actual, count, `${category} 应为 ${count} 条`);
    }
  });

  it("平台覆盖 X、小红书、抖音、视频号、快手（验收标准）", () => {
    const covered = new Set(generateCalendar(baseInput()).items.flatMap((i) => i.platformTargets));
    for (const platform of ALL_PLATFORMS) {
      assert.ok(covered.has(platform), `缺少平台 ${platform}`);
    }
  });

  it("每条都包含验收要求的字段", () => {
    for (const item of generateCalendar(baseInput()).items) {
      assert.ok(item.platformTargets.length > 0);
      assert.ok(item.audience.length > 0);
      assert.ok(item.angle.length > 0);
      assert.ok(["text", "screenshot", "video"].includes(item.assetType));
      assert.ok(["low", "medium", "high"].includes(item.riskLevel));
      assert.ok(["none", "repo", "demo"].includes(item.linkPolicy));
    }
  });

  it("热点条目引用 trendRef 且继承热点风险等级，高可信优先", () => {
    const calendar = generateCalendar(
      baseInput({
        trends: [
          trend("t-low", { credibility: "low" }),
          trend("t-high", { credibility: "high", riskLevel: "medium" }),
          trend("t-med", { credibility: "medium" }),
        ],
      }),
    );
    const trendItems = calendar.items.filter((item) => item.category === "trend");
    assert.deepEqual(
      trendItems.map((item) => item.trendRef),
      ["t-high", "t-med"],
    );
    assert.equal(trendItems[0]!.riskLevel, "medium");
  });

  it("不可借势热点被排除，缺口用兜底角度补齐", () => {
    const calendar = generateCalendar(
      baseInput({
        trends: [trend("t-bad", { leverageable: false, riskLevel: "high" })],
      }),
    );
    const trendItems = calendar.items.filter((item) => item.category === "trend");
    assert.equal(trendItems.length, 2);
    assert.ok(trendItems.every((item) => item.trendRef !== "t-bad"));
    assert.ok(trendItems.some((item) => item.angleKey.startsWith("trend-fallback")));
    assert.ok(calendar.warnings.some((w) => w.includes("兜底")));
  });

  it("无热点数据时仍生成 10 条并告警", () => {
    const calendar = generateCalendar(baseInput({ trends: [] }));
    assert.equal(calendar.count, 10);
    assert.ok(calendar.warnings.some((w) => w.includes("无热点数据")));
  });

  it("避开昨天用过的角度与热点", () => {
    const first = generateCalendar(baseInput());
    const second = generateCalendar(
      baseInput({
        yesterdayAngleKeys: first.items.map((item) => item.angleKey),
        yesterdayTrendRefs: ["t-01", "t-02"],
        trends: [trend("t-01"), trend("t-02"), trend("t-03")],
      }),
    );
    const firstKeys = new Set(first.items.map((item) => item.angleKey));
    const productKeys = second.items
      .filter((item) => item.category === "product-feature")
      .map((item) => item.angleKey);
    assert.ok(productKeys.every((key) => !firstKeys.has(key)), "产品角度应与昨日不同");
    const trendRefs = second.items
      .filter((item) => item.category === "trend")
      .map((item) => item.trendRef);
    assert.deepEqual(trendRefs, ["t-03", null]);
  });

  it("同样输入结果确定（可重复运行）", () => {
    assert.deepEqual(generateCalendar(baseInput()), generateCalendar(baseInput()));
  });

  it("不同日期轮换出不同角度组合", () => {
    const day1 = generateCalendar(baseInput({ date: "2026-07-03" }));
    const day2 = generateCalendar(baseInput({ date: "2026-07-04" }));
    assert.notDeepEqual(
      day1.items.map((item) => item.angleKey),
      day2.items.map((item) => item.angleKey),
    );
  });

  it("含链接条数不超过上限", () => {
    const calendar = generateCalendar(baseInput());
    const linked = calendar.items.filter((item) => item.linkPolicy !== "none").length;
    assert.ok(linked <= MAX_LINK_ITEMS, `链接条数 ${linked} 超过上限 ${MAX_LINK_ITEMS}`);
  });

  it("视频条目携带宣传片素材提示", () => {
    const video = generateCalendar(baseInput()).items.find((i) => i.category === "video-promo")!;
    assert.equal(video.assetHint, "assets/source/promo-90s.mp4");
    assert.equal(video.assetType, "video");
  });
});
