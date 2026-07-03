import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDailyRun } from "./daily-run.ts";

const REAL_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATE = "2026-07-03";

describe("runDailyRun 集成（临时项目根目录）", () => {
  let root: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), "growth-bot-run-"));
    mkdirSync(join(root, "config"), { recursive: true });
    for (const name of ["project", "platforms", "paths"]) {
      cpSync(
        join(REAL_ROOT, "config", `${name}.example.json`),
        join(root, "config", `${name}.json`),
      );
    }
    // 提供热点源文件，让 trends 步骤走标准化路径
    mkdirSync(join(root, "data", "trends", "source"), { recursive: true });
    cpSync(
      join(REAL_ROOT, "data", "trends", "source", "example.json"),
      join(root, "data", "trends", "source", `${DATE}.json`),
    );
  });

  after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("首轮：生成阶段完成，发布阶段被审核门控阻塞（exit 0）", () => {
    const code = runDailyRun({ dryRun: false, date: DATE, rootDir: root });
    assert.equal(code, 0);
    assert.ok(existsSync(join(root, "data", "project-state", `${DATE}.json`)));
    assert.ok(existsSync(join(root, "data", "trends", `${DATE}.json`)));
    assert.ok(existsSync(join(root, "content", "calendar", `${DATE}.json`)));
    assert.ok(readdirSync(join(root, "content", "drafts", DATE)).length > 0);
    assert.ok(existsSync(join(root, "content", "review", `${DATE}.md`)));
    // 发布阶段未执行
    assert.ok(!existsSync(join(root, "content", "publish-packages", DATE)));
    assert.ok(!existsSync(join(root, "content", "published", `${DATE}.json`)));
  });

  it("人工勾选 Approve 后再次运行：跳过已完成步骤并完成发布阶段", () => {
    const reviewPath = join(root, "content", "review", `${DATE}.md`);
    const ticked = readFileSync(reviewPath, "utf8")
      .replaceAll("[ ] Approve　[ ] Edit　[ ] Reject", "[x] Approve　[ ] Edit　[ ] Reject");
    writeFileSync(reviewPath, ticked);

    const code = runDailyRun({ dryRun: false, date: DATE, rootDir: root });
    assert.equal(code, 0);
    assert.ok(existsSync(join(root, "content", "publish-packages", DATE)));
    assert.ok(existsSync(join(root, "content", "published", `${DATE}.json`)));
    assert.ok(existsSync(join(root, "content", "reviews", `${DATE}.md`)));
    // 审核文件未被覆盖：人工勾选仍在
    assert.ok(readFileSync(reviewPath, "utf8").includes("[x] Approve"));
  });

  it("--force 重建后旧 Approve 不放行发布（Codex P1）", () => {
    // 删除发布包，模拟 --force 重建内容后再跑：审核勾选仍是全 Approve，
    // 但发布阶段必须阻塞，发布包不得基于旧勾选重新导出
    rmSync(join(root, "content", "publish-packages", DATE), { recursive: true, force: true });
    const code = runDailyRun({ dryRun: false, date: DATE, force: true, rootDir: root });
    assert.equal(code, 0);
    assert.ok(!existsSync(join(root, "content", "publish-packages", DATE)));
  });

  it("dry-run 只列计划不写文件", () => {
    const marker = join(root, "content", "calendar", "2026-08-01.json");
    const code = runDailyRun({ dryRun: true, date: "2026-08-01", rootDir: root });
    assert.equal(code, 0);
    assert.ok(!existsSync(marker));
  });
});
