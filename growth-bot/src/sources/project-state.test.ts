import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseReadme, buildProjectState, writeProjectState } from "./project-state.ts";
import type { GrowthBotConfig } from "../config/load.ts";

const FIXTURE_README = `# 三餐管家 (WarmDiet Platform)

> 面向老年患者的医疗健康管理平台 —— 测试用简介。

## 🌐 在线体验

平台已部署，可直接访问：

| 入口 | 地址 | 说明 |
|------|------|------|
| 🏥 医院 / 医生端 | https://demo.example.com/ | 工作台 |
| 👨‍👩‍👧 家属 / 患者端 H5 | https://demo.example.com/family/ | 首页 |

**Demo 测试账号**

| 角色 | 登录方式 | 账号 | 密码 |
|------|----------|------|------|
| 🏥 医院/医生 | 统一社会信用代码 | \`91110000TEST\` | 任意 |
| 👤 患者/家属 | 手机号 | \`13700137000\` | 任意 |

## 📋 项目简介

正文内容。
`;

function makeConfig(overrides?: { readmePath?: string }): GrowthBotConfig {
  return {
    project: {
      name: "三餐管家 WarmDiet",
      repo: { owner: "xrunda", name: "warmdiet-platform", url: "https://github.com/xrunda/warmdiet-platform" },
      demo: { hospitalUrl: "https://fallback.example.com/", familyUrl: "https://fallback.example.com/family/" },
      positioning: "开源三餐随诊平台",
      language: "zh",
      video: { promoPath: "assets/source/promo-90s.mp4", durationSeconds: 90 },
    },
    platforms: { platforms: [] },
    paths: {
      dataDir: "data",
      contentDir: "content",
      assetsDir: "assets",
      privateMaterialsDir: null,
      ...(overrides?.readmePath !== undefined ? { readmePath: overrides.readmePath } : {}),
    },
    pathsLocalApplied: false,
  };
}

describe("parseReadme", () => {
  const facts = parseReadme(FIXTURE_README);

  it("提取标题下的引言块作为简介", () => {
    assert.equal(facts.summary, "面向老年患者的医疗健康管理平台 —— 测试用简介。");
  });

  it("从在线体验表格提取医院端和家属端地址", () => {
    assert.equal(facts.demoUrls.hospital, "https://demo.example.com/");
    assert.equal(facts.demoUrls.family, "https://demo.example.com/family/");
  });

  it("提取测试账号表并去掉反引号", () => {
    assert.equal(facts.testAccounts.length, 2);
    assert.deepEqual(facts.testAccounts[0], {
      role: "🏥 医院/医生",
      loginMethod: "统一社会信用代码",
      account: "91110000TEST",
      password: "任意",
    });
  });

  it("README 缺少对应区块时返回空值而不抛错", () => {
    const empty = parseReadme("# 空项目\n\n没有任何表格。\n");
    assert.equal(empty.summary, null);
    assert.deepEqual(empty.demoUrls, {});
    assert.deepEqual(empty.testAccounts, []);
  });
});

describe("buildProjectState + writeProjectState", () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "growth-bot-state-"));
    writeFileSync(join(dir, "README-fixture.md"), FIXTURE_README);
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("输出包含 repo、demoUrls、positioning、assets 四个验收字段", () => {
    const state = buildProjectState({
      config: makeConfig({ readmePath: "README-fixture.md" }),
      rootDir: dir,
      date: "2026-07-03",
    });
    assert.equal(state.repo.url, "https://github.com/xrunda/warmdiet-platform");
    assert.equal(state.demoUrls.hospital, "https://demo.example.com/");
    assert.equal(state.positioning, "开源三餐随诊平台");
    assert.equal(state.assets.promoVideo, "assets/source/promo-90s.mp4");
    assert.equal(state.source.readmeFound, true);
  });

  it("README 不存在时回退到 config 的 Demo 地址", () => {
    const state = buildProjectState({
      config: makeConfig({ readmePath: "no-such-readme.md" }),
      rootDir: dir,
      date: "2026-07-03",
    });
    assert.equal(state.source.readmeFound, false);
    assert.equal(state.demoUrls.hospital, "https://fallback.example.com/");
    assert.equal(state.demoUrls.family, "https://fallback.example.com/family/");
    assert.equal(state.summary, null);
  });

  it("可重复运行：同日两次写入均成功且内容为第二次结果", () => {
    const config = makeConfig({ readmePath: "README-fixture.md" });
    const first = buildProjectState({ config, rootDir: dir, date: "2026-07-03", now: new Date(0) });
    const outPath1 = writeProjectState(first, dir, config.paths.dataDir);
    const second = buildProjectState({ config, rootDir: dir, date: "2026-07-03", now: new Date(1000) });
    const outPath2 = writeProjectState(second, dir, config.paths.dataDir);
    assert.equal(outPath1, outPath2);
    assert.equal(outPath1, join(dir, "data", "project-state", "2026-07-03.json"));
    const written = JSON.parse(readFileSync(outPath2, "utf8"));
    assert.equal(written.generatedAt, new Date(1000).toISOString());
  });
});

describe("对真实主仓库 README 的集成解析", () => {
  const realReadme = join(import.meta.dirname, "..", "..", "..", "README.md");

  it("能提取到 Demo 地址与测试账号", { skip: !existsSync(realReadme) }, () => {
    const facts = parseReadme(readFileSync(realReadme, "utf8"));
    assert.ok(facts.summary !== null && facts.summary.length > 0);
    assert.match(facts.demoUrls.hospital ?? "", /^https:\/\//);
    assert.match(facts.demoUrls.family ?? "", /family/);
    assert.ok(facts.testAccounts.length >= 2);
  });
});
