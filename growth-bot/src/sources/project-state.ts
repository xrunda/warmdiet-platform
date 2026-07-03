import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { GrowthBotConfig } from "../config/load.ts";

/**
 * 项目状态采集（GB-003）。
 *
 * 从主仓库 README 提取项目简介、Demo 地址、测试账号摘要，
 * 与配置中的仓库地址、视频素材路径合并，输出当日项目状态 JSON。
 * 不调用 GitHub API，不统计真实 star。
 */

export interface DemoUrls {
  hospital: string;
  family: string;
}

export interface TestAccount {
  role: string;
  loginMethod: string;
  account: string;
  password: string;
}

export interface ReadmeFacts {
  summary: string | null;
  demoUrls: Partial<DemoUrls>;
  testAccounts: TestAccount[];
}

export interface ProjectState {
  date: string;
  generatedAt: string;
  repo: {
    owner: string;
    name: string;
    url: string;
  };
  demoUrls: DemoUrls;
  positioning: string;
  summary: string | null;
  testAccounts: TestAccount[];
  assets: {
    promoVideo: string | null;
    assetsDir: string;
  };
  source: {
    readmePath: string;
    readmeFound: boolean;
  };
}

function stripCell(cell: string): string {
  return cell.replace(/`/g, "").trim();
}

function isDividerRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-+:?$/.test(cell));
}

/** 解析 markdown 表格行，返回单元格数组；非表格行返回 null */
function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return null;
  }
  return trimmed
    .slice(1, -1)
    .split("|")
    .map(stripCell);
}

/** 截取从 heading 开始到下一个同级或更高级 heading 之前的内容 */
function sectionAfter(markdown: string, headingPattern: RegExp): string | null {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start === -1) {
    return null;
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,2}\s/.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

export function parseReadme(markdown: string): ReadmeFacts {
  const facts: ReadmeFacts = { summary: null, demoUrls: {}, testAccounts: [] };

  const blockquote = markdown
    .split("\n")
    .slice(0, 10)
    .find((line) => line.startsWith("> "));
  if (blockquote !== undefined) {
    facts.summary = blockquote.slice(2).trim();
  }

  const demoSection = sectionAfter(markdown, /^##\s.*在线体验/);
  if (demoSection !== null) {
    for (const line of demoSection.split("\n")) {
      const cells = parseTableRow(line);
      if (cells === null || cells.length < 2 || isDividerRow(cells)) {
        continue;
      }
      const url = cells.find((cell) => cell.startsWith("http"));
      if (url === undefined) {
        continue;
      }
      const label = cells[0] ?? "";
      if (facts.demoUrls.hospital === undefined && /医院|医生/.test(label)) {
        facts.demoUrls.hospital = url;
      } else if (facts.demoUrls.family === undefined && /家属|患者/.test(label)) {
        facts.demoUrls.family = url;
      }
    }
  }

  const accountStart = markdown.indexOf("Demo 测试账号");
  if (accountStart !== -1) {
    const tail = markdown.slice(accountStart).split("\n");
    let headerSeen = false;
    for (const line of tail) {
      const cells = parseTableRow(line);
      if (cells === null) {
        if (headerSeen) {
          break;
        }
        continue;
      }
      if (isDividerRow(cells)) {
        continue;
      }
      if (!headerSeen) {
        headerSeen = true;
        continue;
      }
      if (cells.length >= 4) {
        facts.testAccounts.push({
          role: cells[0] ?? "",
          loginMethod: cells[1] ?? "",
          account: cells[2] ?? "",
          password: cells[3] ?? "",
        });
      }
    }
  }

  return facts;
}

export interface CollectOptions {
  config: GrowthBotConfig;
  /** growth-bot 项目根目录，用于解析相对路径 */
  rootDir: string;
  date: string;
  now?: Date;
}

export function buildProjectState(options: CollectOptions): ProjectState {
  const { config, rootDir, date } = options;
  const readmeRelative = config.paths.readmePath ?? "../README.md";
  const readmePath = isAbsolute(readmeRelative) ? readmeRelative : resolve(rootDir, readmeRelative);

  const readmeFound = existsSync(readmePath);
  const facts: ReadmeFacts = readmeFound
    ? parseReadme(readFileSync(readmePath, "utf8"))
    : { summary: null, demoUrls: {}, testAccounts: [] };

  return {
    date,
    generatedAt: (options.now ?? new Date()).toISOString(),
    repo: config.project.repo,
    demoUrls: {
      hospital: facts.demoUrls.hospital ?? config.project.demo.hospitalUrl,
      family: facts.demoUrls.family ?? config.project.demo.familyUrl,
    },
    positioning: config.project.positioning,
    summary: facts.summary,
    testAccounts: facts.testAccounts,
    assets: {
      promoVideo: config.project.video?.promoPath ?? null,
      assetsDir: config.paths.assetsDir,
    },
    source: {
      readmePath,
      readmeFound,
    },
  };
}

/** 写入 data/project-state/yyyy-mm-dd.json（同日重复运行会覆盖，输出是纯派生数据） */
export function writeProjectState(state: ProjectState, rootDir: string, dataDir: string): string {
  const outPath = join(
    isAbsolute(dataDir) ? dataDir : join(rootDir, dataDir),
    "project-state",
    `${state.date}.json`,
  );
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(state, null, 2)}\n`);
  return outPath;
}
