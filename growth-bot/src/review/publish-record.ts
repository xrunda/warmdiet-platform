import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 发布记录与复盘（GB-008）。
 *
 * publish:record 从发布包 manifest 生成当日发布记录骨架
 * content/published/yyyy-mm-dd.json，曝光/点赞/评论/收藏与 star 增量
 * 由人工录入；retro:build 再把记录渲染成复盘模板。
 * 不自动抓平台数据，不做分析模型。
 */

export interface PublishMetrics {
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  favorites: number | null;
}

export interface PublishEntry {
  itemId: string;
  platform: string;
  fileName: string;
  /** 实际发布后人工填写 */
  published: boolean;
  publishedAt: string | null;
  postUrl: string | null;
  metrics: PublishMetrics;
}

export interface PublishedFile {
  date: string;
  generatedAt: string;
  /** 当日 GitHub star 增量，人工录入 */
  starDelta: number | null;
  notes: string;
  entries: PublishEntry[];
}

export function emptyMetrics(): PublishMetrics {
  return { impressions: null, likes: null, comments: null, favorites: null };
}

interface ManifestEntry {
  itemId: string;
  fileName: string;
}

/** 读取发布包目录下各平台 manifest，汇总为发布记录条目 */
export function collectPackageEntries(packageDir: string): PublishEntry[] {
  if (!existsSync(packageDir)) {
    return [];
  }
  const entries: PublishEntry[] = [];
  for (const platform of readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()) {
    const manifestPath = join(packageDir, platform, "manifest.json");
    if (!existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      entries: ManifestEntry[];
    };
    for (const entry of manifest.entries) {
      entries.push({
        itemId: entry.itemId,
        platform,
        fileName: entry.fileName,
        published: false,
        publishedAt: null,
        postUrl: null,
        metrics: emptyMetrics(),
      });
    }
  }
  return entries;
}

export function buildPublishRecord(
  date: string,
  entries: PublishEntry[],
  now: Date = new Date(),
): PublishedFile {
  return {
    date,
    generatedAt: now.toISOString(),
    starDelta: null,
    notes: "",
    entries,
  };
}

function metricCell(value: number | null): string {
  return value === null ? "待录入" : String(value);
}

export function buildRetroMarkdown(record: PublishedFile): string {
  const lines: string[] = [
    `# 每日复盘 ${record.date}`,
    "",
    `> 指标先填写 content/published/${record.date}.json（可被后续脚本读取），`,
    `> 再执行 npm run retro:build -- --date ${record.date} --force 刷新本表；复盘结论直接写在下方。`,
    "",
    "## 发布数据",
    "",
    "| 条目 | 平台 | 已发布 | 曝光 | 点赞 | 评论 | 收藏 |",
    "|------|------|--------|------|------|------|------|",
  ];
  for (const entry of record.entries) {
    lines.push(
      `| ${entry.itemId} | ${entry.platform} | ${entry.published ? "✅" : "—"} | ${metricCell(
        entry.metrics.impressions,
      )} | ${metricCell(entry.metrics.likes)} | ${metricCell(entry.metrics.comments)} | ${metricCell(
        entry.metrics.favorites,
      )} |`,
    );
  }
  lines.push(
    "",
    `GitHub star 增量: ${record.starDelta === null ? "待录入" : record.starDelta}`,
    "",
    "## 复盘结论（人工填写）",
    "",
    "- 表现最好的选题 / 平台:",
    "- 表现最差的选题 / 平台:",
    "- 观察到的受众反馈:",
    "",
    "## 明日建议（人工填写，可作为次日热点与角度输入）",
    "",
    "1. ",
    "2. ",
    "3. ",
    "",
  );
  return lines.join("\n");
}
