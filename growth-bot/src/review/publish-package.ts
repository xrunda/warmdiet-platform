import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ReviewEntryStatus } from "./review-file.ts";

/**
 * 发布包导出（GB-007）。
 *
 * 把审核通过（Approve）条目的草稿按平台分目录复制到
 * content/publish-packages/yyyy-mm-dd/{platform}/，并生成 manifest。
 * 不自动打开浏览器，不上传素材：发布动作由人工完成。
 */

export interface PackageManifestEntry {
  itemId: string;
  fileName: string;
}

export interface PackageResult {
  outDir: string;
  platforms: Record<string, PackageManifestEntry[]>;
  approvedCount: number;
  skipped: { itemId: string; reason: string }[];
}

const DRAFT_NAME_PATTERN = /^(?<itemId>.+)\.(?<platform>[a-z-]+)\.md$/;

export function exportPackages(options: {
  date: string;
  draftsDir: string;
  packagesRoot: string;
  statuses: ReviewEntryStatus[];
}): PackageResult {
  const approved = new Set(
    options.statuses.filter((s) => s.decision === "approve").map((s) => s.itemId),
  );
  const skipped = options.statuses
    .filter((s) => s.decision !== "approve")
    .map((s) => ({ itemId: s.itemId, reason: s.decision }));

  const outDir = join(options.packagesRoot, options.date);
  // 发布包是审核结果的纯派生产物，每次导出整体重建
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }

  const platforms: Record<string, PackageManifestEntry[]> = {};
  const draftFiles = existsSync(options.draftsDir) ? readdirSync(options.draftsDir) : [];

  for (const fileName of draftFiles) {
    const match = fileName.match(DRAFT_NAME_PATTERN);
    if (match?.groups === undefined) {
      continue;
    }
    const { itemId, platform } = match.groups as { itemId: string; platform: string };
    if (!approved.has(itemId)) {
      continue;
    }
    const platformDir = join(outDir, platform);
    mkdirSync(platformDir, { recursive: true });
    const content = readFileSync(join(options.draftsDir, fileName), "utf8");
    writeFileSync(
      join(platformDir, fileName),
      content.replace("status: draft", "status: approved"),
    );
    (platforms[platform] ??= []).push({ itemId, fileName });
  }

  for (const [platform, entries] of Object.entries(platforms)) {
    writeFileSync(
      join(outDir, platform, "manifest.json"),
      `${JSON.stringify({ date: options.date, platform, count: entries.length, entries }, null, 2)}\n`,
    );
  }

  return { outDir, platforms, approvedCount: approved.size, skipped };
}
