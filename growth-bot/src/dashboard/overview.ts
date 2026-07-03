import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gatherDailyStatus, type DailyStatus } from "../pipeline/daily-status.ts";
import { parseReviewStatuses, type ReviewEntryStatus } from "../review/review-file.ts";
import type { CalendarFile } from "../pipeline/daily-calendar.ts";
import type { PublishedFile } from "../review/publish-record.ts";

/**
 * 工作台数据聚合（GB-011）。
 *
 * 把当日全部产物汇总成一个 JSON，前端只消费本地 API，不触碰文件系统。
 * 只读；绝不暴露 config/paths（尤其 privateMaterialsDir）。
 */

export interface DraftView {
  itemId: string;
  platform: string;
  fileName: string;
  compliancePass: boolean;
  markdown: string;
}

export interface PackageFileView {
  itemId: string;
  fileName: string;
  markdown: string;
}

export interface DashboardOverview {
  date: string;
  status: DailyStatus;
  calendar: CalendarFile | null;
  drafts: DraftView[];
  review: { exists: boolean; statuses: ReviewEntryStatus[] };
  packages: { exists: boolean; platforms: Record<string, PackageFileView[]> };
  published: PublishedFile | null;
  retro: string | null;
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

const DRAFT_NAME = /^(?<itemId>.+)\.(?<platform>[a-z-]+)\.md$/;

export function buildOverview(dataRoot: string, contentRoot: string, date: string): DashboardOverview {
  const status = gatherDailyStatus({ date, dataRoot, contentRoot });
  const calendar = readJsonOrNull<CalendarFile>(join(contentRoot, "calendar", `${date}.json`));

  const drafts: DraftView[] = [];
  const draftsDir = join(contentRoot, "drafts", date);
  if (existsSync(draftsDir)) {
    for (const fileName of readdirSync(draftsDir).sort()) {
      const match = fileName.match(DRAFT_NAME);
      if (match?.groups === undefined) {
        continue;
      }
      const markdown = readFileSync(join(draftsDir, fileName), "utf8");
      drafts.push({
        itemId: match.groups.itemId!,
        platform: match.groups.platform!,
        fileName,
        compliancePass: !markdown.includes("compliancePass: false"),
        markdown,
      });
    }
  }

  const reviewPath = join(contentRoot, "review", `${date}.md`);
  const review = existsSync(reviewPath)
    ? { exists: true, statuses: parseReviewStatuses(readFileSync(reviewPath, "utf8")) }
    : { exists: false, statuses: [] };

  const packagesDir = join(contentRoot, "publish-packages", date);
  const platforms: Record<string, PackageFileView[]> = {};
  if (existsSync(packagesDir)) {
    for (const platform of readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()) {
      const entries: PackageFileView[] = [];
      for (const fileName of readdirSync(join(packagesDir, platform)).sort()) {
        if (!fileName.endsWith(".md")) {
          continue;
        }
        const match = fileName.match(DRAFT_NAME);
        entries.push({
          itemId: match?.groups?.itemId ?? fileName,
          fileName,
          markdown: readFileSync(join(packagesDir, platform, fileName), "utf8"),
        });
      }
      platforms[platform] = entries;
    }
  }

  const retroPath = join(contentRoot, "reviews", `${date}.md`);

  return {
    date,
    status,
    calendar,
    drafts,
    review,
    packages: { exists: existsSync(packagesDir), platforms },
    published: readJsonOrNull<PublishedFile>(join(contentRoot, "published", `${date}.json`)),
    retro: existsSync(retroPath) ? readFileSync(retroPath, "utf8") : null,
  };
}
