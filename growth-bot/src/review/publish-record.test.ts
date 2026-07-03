import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildPublishRecord,
  buildRetroMarkdown,
  collectPackageEntries,
  emptyMetrics,
} from "./publish-record.ts";

describe("collectPackageEntries", () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "growth-bot-record-"));
    for (const platform of ["x", "xiaohongshu"]) {
      mkdirSync(join(dir, platform), { recursive: true });
      writeFileSync(
        join(dir, platform, "manifest.json"),
        JSON.stringify({
          date: "2026-07-03",
          platform,
          count: 1,
          entries: [{ itemId: "cal-2026-07-03-01", fileName: `cal-2026-07-03-01.${platform}.md` }],
        }),
      );
    }
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("汇总各平台 manifest 为待录入条目", () => {
    const entries = collectPackageEntries(dir);
    assert.equal(entries.length, 2);
    assert.deepEqual(
      entries.map((entry) => entry.platform),
      ["x", "xiaohongshu"],
    );
    const first = entries[0]!;
    assert.equal(first.published, false);
    assert.equal(first.postUrl, null);
    assert.deepEqual(first.metrics, emptyMetrics());
  });

  it("发布包目录缺失时返回空数组", () => {
    assert.deepEqual(collectPackageEntries(join(dir, "no-such")), []);
  });
});

describe("buildPublishRecord / buildRetroMarkdown", () => {
  const record = buildPublishRecord(
    "2026-07-03",
    [
      {
        itemId: "cal-2026-07-03-01",
        platform: "x",
        fileName: "cal-2026-07-03-01.x.md",
        published: true,
        publishedAt: "2026-07-03T10:00:00.000Z",
        postUrl: "https://x.com/example/status/1",
        metrics: { impressions: 1200, likes: 45, comments: 6, favorites: 12 },
      },
      {
        itemId: "cal-2026-07-03-02",
        platform: "xiaohongshu",
        fileName: "cal-2026-07-03-02.xiaohongshu.md",
        published: false,
        publishedAt: null,
        postUrl: null,
        metrics: emptyMetrics(),
      },
    ],
    new Date(0),
  );

  it("指标结构可被脚本读取（验收标准）：JSON 往返无损", () => {
    const parsed = JSON.parse(JSON.stringify(record));
    assert.equal(parsed.entries[0].metrics.impressions, 1200);
    assert.equal(parsed.entries[1].metrics.impressions, null);
    assert.equal(parsed.starDelta, null);
    assert.equal(parsed.date, "2026-07-03");
  });

  it("复盘模板包含数据表、star 增量与人工填写区（验收标准）", () => {
    const md = buildRetroMarkdown(record);
    assert.ok(md.includes("# 每日复盘 2026-07-03"));
    assert.ok(md.includes("| cal-2026-07-03-01 | x | ✅ | [链接](https://x.com/example/status/1) | 1200 | 45 | 6 | 12 |"));
    assert.ok(md.includes("| cal-2026-07-03-02 | xiaohongshu | — | — | 待录入 | 待录入 | 待录入 | 待录入 |"));
    assert.ok(md.includes("GitHub star 增量: 待录入"));
    assert.ok(md.includes("## 复盘结论（人工填写）"));
    assert.ok(md.includes("## 明日建议（人工填写"));
  });

  it("star 增量录入后正常渲染", () => {
    const md = buildRetroMarkdown({ ...record, starDelta: 7 });
    assert.ok(md.includes("GitHub star 增量: 7"));
  });
});
