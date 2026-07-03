import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractSourceItems,
  importTrends,
  normalizeTrends,
  validateTrendItem,
  writeNormalizedTrends,
  TrendsValidationError,
} from "./trends.ts";

const EXAMPLE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
  "trends",
  "source",
  "example.json",
);

function validItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: "测试热点",
    source: "测试来源",
    url: "https://example.com/news/1",
    summary: "摘要",
    tags: ["养老"],
    riskLevel: "low",
    ...overrides,
  };
}

describe("extractSourceItems", () => {
  it("接受顶层数组和 { items } 两种形态", () => {
    assert.deepEqual(extractSourceItems([validItem()])?.length, 1);
    assert.deepEqual(extractSourceItems({ items: [validItem()] })?.length, 1);
    assert.equal(extractSourceItems({ foo: 1 }), null);
    assert.equal(extractSourceItems("nope"), null);
  });
});

describe("validateTrendItem", () => {
  it("合法条目通过校验", () => {
    assert.deepEqual(validateTrendItem(validItem(), 0), []);
  });

  it("逐字段报错且带下标", () => {
    const errors = validateTrendItem(
      { title: "", url: "ftp://x", tags: [], riskLevel: "extreme" },
      2,
    );
    assert.ok(errors.some((e) => e.includes("items[2].title")));
    assert.ok(errors.some((e) => e.includes("items[2].source")));
    assert.ok(errors.some((e) => e.includes("items[2].url")));
    assert.ok(errors.some((e) => e.includes("items[2].tags")));
    assert.ok(errors.some((e) => e.includes("items[2].riskLevel")));
  });
});

describe("normalizeTrends", () => {
  it("补默认值并生成稳定 id", () => {
    const file = normalizeTrends([validItem()], "2026-07-03", "src.json", new Date(0));
    const item = file.items[0]!;
    assert.equal(item.id, "trend-2026-07-03-01");
    assert.equal(item.credibility, "medium");
    assert.equal(item.sensitive, false);
    assert.equal(item.leverageable, true);
    assert.equal(file.generatedAt, new Date(0).toISOString());
  });

  it("高风险与敏感热点被标记为不可借势", () => {
    const file = normalizeTrends(
      [
        validItem({ riskLevel: "high" }),
        validItem({ sensitive: true }),
        validItem(),
      ],
      "2026-07-03",
      "src.json",
    );
    assert.equal(file.items[0]!.leverageable, false);
    assert.equal(file.items[1]!.leverageable, false);
    assert.equal(file.items[2]!.leverageable, true);
    assert.equal(file.nonLeverageableCount, 2);
    assert.equal(file.count, 3);
  });

  it("任一条目非法时整体抛出并汇总所有错误", () => {
    assert.throws(
      () => normalizeTrends([validItem(), { title: "x" }], "2026-07-03", "src.json"),
      (error: unknown) =>
        error instanceof TrendsValidationError &&
        error.errors.every((e) => e.startsWith("items[1]")),
    );
  });
});

describe("importTrends 端到端", () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "growth-bot-trends-"));
    mkdirSync(join(dir, "data", "trends", "source"), { recursive: true });
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("示例热点文件可标准化输出（验收标准）", () => {
    writeFileSync(
      join(dir, "data", "trends", "source", "2026-07-03.json"),
      readFileSync(EXAMPLE_PATH, "utf8"),
    );
    const result = importTrends({ rootDir: dir, dataDir: "data", date: "2026-07-03" });
    const outPath = writeNormalizedTrends(result);
    assert.equal(outPath, join(dir, "data", "trends", "2026-07-03.json"));
    const written = JSON.parse(readFileSync(outPath, "utf8"));
    assert.equal(written.count, 3);
    assert.equal(written.nonLeverageableCount, 1);
    assert.equal(written.items[2].leverageable, false);
  });

  it("源文件缺失时报清晰错误并指向模板", () => {
    assert.throws(
      () => importTrends({ rootDir: dir, dataDir: "data", date: "2026-01-01" }),
      (error: unknown) =>
        error instanceof TrendsValidationError &&
        error.message.includes("2026-01-01.json") &&
        error.message.includes("example.json"),
    );
  });

  it("非法 JSON 报清晰错误", () => {
    writeFileSync(join(dir, "data", "trends", "source", "2026-01-02.json"), "{broken");
    assert.throws(
      () => importTrends({ rootDir: dir, dataDir: "data", date: "2026-01-02" }),
      (error: unknown) =>
        error instanceof TrendsValidationError && error.message.includes("不是合法 JSON"),
    );
  });
});
