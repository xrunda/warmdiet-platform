import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, ConfigError } from "./load.ts";
import {
  validatePathsConfig,
  validatePlatformsConfig,
  validateProjectConfig,
} from "./schema.ts";

const REAL_CONFIG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "config");

function readExample(name: string): unknown {
  return JSON.parse(readFileSync(join(REAL_CONFIG_DIR, name), "utf8"));
}

describe("示例配置", () => {
  it("project.example.json 通过校验", () => {
    assert.deepEqual(validateProjectConfig(readExample("project.example.json")), []);
  });

  it("platforms.example.json 通过校验且覆盖五个平台", () => {
    const raw = readExample("platforms.example.json") as { platforms: { id: string }[] };
    assert.deepEqual(validatePlatformsConfig(raw), []);
    assert.deepEqual(
      raw.platforms.map((p) => p.id).sort(),
      ["douyin", "kuaishou", "wechat-video", "x", "xiaohongshu"],
    );
  });

  it("paths.example.json 通过校验", () => {
    assert.deepEqual(validatePathsConfig(readExample("paths.example.json")), []);
  });
});

describe("loadConfig", () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "growth-bot-config-"));
    for (const name of ["project", "platforms", "paths"]) {
      cpSync(join(REAL_CONFIG_DIR, `${name}.example.json`), join(dir, `${name}.json`));
    }
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("从示例复制的配置可以完整加载", () => {
    const config = loadConfig(dir);
    assert.equal(config.project.repo.owner, "xrunda");
    assert.equal(config.platforms.platforms.length, 5);
    assert.equal(config.paths.dataDir, "data");
    assert.equal(config.pathsLocalApplied, false);
  });

  it("paths.local.json 覆盖本机路径", () => {
    const localPath = join(dir, "paths.local.json");
    writeFileSync(localPath, JSON.stringify({ privateMaterialsDir: "/private/materials" }));
    try {
      const config = loadConfig(dir);
      assert.equal(config.pathsLocalApplied, true);
      assert.equal(config.paths.privateMaterialsDir, "/private/materials");
      assert.equal(config.paths.dataDir, "data");
    } finally {
      unlinkSync(localPath);
    }
  });

  it("配置文件缺失时报清晰错误并给出修复提示", () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "growth-bot-empty-"));
    try {
      assert.throws(
        () => loadConfig(emptyDir),
        (error: unknown) =>
          error instanceof ConfigError &&
          error.message.includes("缺少配置文件") &&
          error.message.includes("project.example.json"),
      );
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it("字段非法时报出具体字段", () => {
    const badDir = mkdtempSync(join(tmpdir(), "growth-bot-bad-"));
    try {
      for (const name of ["project", "platforms", "paths"]) {
        cpSync(join(REAL_CONFIG_DIR, `${name}.example.json`), join(badDir, `${name}.json`));
      }
      const project = JSON.parse(readFileSync(join(badDir, "project.json"), "utf8"));
      project.language = "en";
      delete project.repo.url;
      writeFileSync(join(badDir, "project.json"), JSON.stringify(project));
      assert.throws(
        () => loadConfig(badDir),
        (error: unknown) =>
          error instanceof ConfigError &&
          error.message.includes("project.language") &&
          error.message.includes("project.repo.url"),
      );
    } finally {
      rmSync(badDir, { recursive: true, force: true });
    }
  });
});
