import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DataFileError, previousDate, readJsonIfExists, resolvePlanDate } from "./daily-plan.ts";

describe("resolvePlanDate", () => {
  it("透传合法的 yyyy-mm-dd 日期", () => {
    assert.equal(resolvePlanDate("2026-07-03"), "2026-07-03");
  });

  it("拒绝非法日期格式", () => {
    assert.throws(() => resolvePlanDate("2026/07/03"), /无效日期/);
    assert.throws(() => resolvePlanDate("today"), /无效日期/);
  });

  it("拒绝格式正确但不存在的日历日期", () => {
    assert.throws(() => resolvePlanDate("2026-99-99"), /不是真实存在的日历日期/);
    assert.throws(() => resolvePlanDate("2026-02-30"), /不是真实存在的日历日期/);
    assert.throws(() => resolvePlanDate("2026-00-01"), /不是真实存在的日历日期/);
  });

  it("缺省时返回当天日期", () => {
    const fixed = new Date(2026, 6, 3);
    assert.equal(resolvePlanDate(undefined, fixed), "2026-07-03");
  });
});

describe("readJsonIfExists", () => {
  it("文件缺失返回 null，损坏 JSON 抛出带路径的清晰错误", () => {
    const dir = mkdtempSync(join(tmpdir(), "growth-bot-json-"));
    try {
      assert.equal(readJsonIfExists(join(dir, "missing.json")), null);
      const broken = join(dir, "broken.json");
      writeFileSync(broken, "{oops");
      assert.throws(
        () => readJsonIfExists(broken),
        (error: unknown) =>
          error instanceof DataFileError &&
          error.message.includes(broken) &&
          error.message.includes("不是合法 JSON"),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("previousDate", () => {
  it("常规日期减一天", () => {
    assert.equal(previousDate("2026-07-03"), "2026-07-02");
  });

  it("跨月与跨年", () => {
    assert.equal(previousDate("2026-07-01"), "2026-06-30");
    assert.equal(previousDate("2026-01-01"), "2025-12-31");
    assert.equal(previousDate("2026-03-01"), "2026-02-28");
  });
});
