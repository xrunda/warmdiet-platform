import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDraft,
  buildDraftsForCalendar,
  scanBannedWords,
  type DraftContext,
} from "./drafts.ts";
import type { CalendarItem } from "../pipeline/daily-calendar.ts";
import { ALL_PLATFORMS } from "../pipeline/daily-calendar.ts";

const CTX: DraftContext = {
  date: "2026-07-03",
  repoUrl: "https://github.com/xrunda/warmdiet-platform",
  demoHospitalUrl: "https://demo.example.com/",
  demoFamilyUrl: "https://demo.example.com/family/",
  positioning: "开源的三餐随诊与家属照护平台",
};

function calendarItem(overrides: Partial<CalendarItem> = {}): CalendarItem {
  return {
    id: "cal-2026-07-03-01",
    category: "product-feature",
    angleKey: "hospital-console",
    angle: "医院端工作台：患者列表、授权状态、随诊管理一屏完成",
    platformTargets: ["x", "xiaohongshu"],
    audience: "医生 / 医院管理者",
    assetType: "screenshot",
    riskLevel: "low",
    linkPolicy: "none",
    trendRef: null,
    assetHint: null,
    ...overrides,
  };
}

describe("buildDraft", () => {
  it("五个平台模板都能生成完整草稿结构", () => {
    for (const platform of ALL_PLATFORMS) {
      const draft = buildDraft(calendarItem(), platform, CTX);
      assert.equal(draft.fileName, `cal-2026-07-03-01.${platform}.md`);
      for (const section of ["# 标题", "## 正文", "## 话题", "## 素材建议", "## 合规自检"]) {
        assert.ok(draft.markdown.includes(section), `${platform} 缺少 ${section}`);
      }
      assert.ok(draft.markdown.startsWith("---\n"), `${platform} 缺少 frontmatter`);
      assert.ok(draft.markdown.includes(`platform: ${platform}`));
      assert.ok(draft.markdown.includes("status: draft"));
      assert.ok(draft.markdown.includes("#"), `${platform} 缺少话题标签`);
    }
  });

  it("linkPolicy 控制正文链接：repo/demo/none", () => {
    const repo = buildDraft(calendarItem({ linkPolicy: "repo" }), "x", CTX);
    assert.ok(repo.markdown.includes(CTX.repoUrl));

    const demoHospital = buildDraft(calendarItem({ linkPolicy: "demo" }), "x", CTX);
    assert.ok(demoHospital.markdown.includes(CTX.demoHospitalUrl));

    const demoFamily = buildDraft(calendarItem({ linkPolicy: "demo" }), "xiaohongshu", CTX);
    assert.ok(demoFamily.markdown.includes(CTX.demoFamilyUrl));

    const none = buildDraft(calendarItem({ linkPolicy: "none" }), "x", CTX);
    assert.ok(!none.markdown.match(/## 正文[\s\S]*?https?:\/\/[\s\S]*?## 话题/));
  });

  it("命中禁用词时标记不通过并给出改写提示", () => {
    const bad = buildDraft(
      calendarItem({ angle: "坚持记录三餐可以根治老年慢病" }),
      "x",
      CTX,
    );
    assert.equal(bad.compliancePass, false);
    assert.ok(bad.markdown.includes("compliancePass: false"));
    assert.ok(bad.markdown.includes("命中禁用词: 根治"));
  });

  it("中高风险条目在合规自检中要求人工重点评估", () => {
    const risky = buildDraft(calendarItem({ riskLevel: "medium" }), "x", CTX);
    assert.ok(risky.markdown.includes("需人工重点评估"));
  });

  it("视频条目携带素材引用路径", () => {
    const video = buildDraft(
      calendarItem({ assetType: "video", assetHint: "assets/source/promo-90s.mp4" }),
      "douyin",
      CTX,
    );
    assert.ok(video.markdown.includes("素材引用: assets/source/promo-90s.mp4"));
  });
});

describe("buildDraftsForCalendar", () => {
  it("按条目的 platformTargets 展开草稿", () => {
    const drafts = buildDraftsForCalendar(
      [
        calendarItem(),
        calendarItem({ id: "cal-2026-07-03-02", platformTargets: ["douyin", "kuaishou", "wechat-video"] }),
      ],
      CTX,
    );
    assert.equal(drafts.length, 5);
    assert.deepEqual(
      drafts.map((draft) => draft.fileName).sort(),
      [
        "cal-2026-07-03-01.x.md",
        "cal-2026-07-03-01.xiaohongshu.md",
        "cal-2026-07-03-02.douyin.md",
        "cal-2026-07-03-02.kuaishou.md",
        "cal-2026-07-03-02.wechat-video.md",
      ].sort(),
    );
  });
});

describe("scanBannedWords", () => {
  it("检测医疗禁用词", () => {
    assert.deepEqual(scanBannedWords("使用后可治愈并保证疗效保证"), ["治愈", "疗效保证"]);
    assert.deepEqual(scanBannedWords("正常的健康管理描述"), []);
  });
});
