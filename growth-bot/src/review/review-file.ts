import type { CalendarFile, CalendarItem } from "../pipeline/daily-calendar.ts";

/**
 * 审核汇总文件（GB-007）。
 *
 * 把当天 10 条内容压缩成一屏可浏览的 Markdown：每条一个紧凑区块，
 * 含角度、平台、风险、草稿链接和 Approve / Edit / Reject 状态位。
 * 状态位由人工勾选，parseReviewStatuses 负责读回。
 */

export type ReviewDecision = "approve" | "edit" | "reject" | "pending";

export interface DraftMeta {
  fileName: string;
  platform: string;
  compliancePass: boolean;
}

export interface ReviewEntryStatus {
  itemId: string;
  decision: ReviewDecision;
}

function statusLine(): string {
  return "状态: [ ] Approve　[ ] Edit　[ ] Reject";
}

function complianceBadge(drafts: DraftMeta[]): string {
  if (drafts.length === 0) {
    return "⚠️ 无草稿可扫描，不可直接 Approve";
  }
  const failed = drafts.filter((draft) => !draft.compliancePass);
  return failed.length === 0
    ? "✅ 自动合规通过"
    : `⚠️ ${failed.length} 份草稿未过合规扫描`;
}

function riskBadge(item: CalendarItem): string {
  return item.riskLevel === "low" ? `risk: ${item.riskLevel}` : `⚠️ risk: ${item.riskLevel}`;
}

export function buildReviewMarkdown(
  calendar: CalendarFile,
  draftsByItem: Map<string, DraftMeta[]>,
): string {
  const lines: string[] = [
    `# 内容审核 ${calendar.date}`,
    "",
    `> 共 ${calendar.count} 条。勾选每条的一个状态位：Approve 进发布包，Edit 修改草稿后再勾 Approve，Reject 弃用。`,
    `> 审核完成后执行: npm run publish:package -- --date ${calendar.date}`,
    "",
  ];

  for (const item of calendar.items) {
    const drafts = draftsByItem.get(item.id) ?? [];
    const draftLinks =
      drafts.length === 0
        ? "（无草稿，请先执行 npm run drafts:generate）"
        : drafts
            .map((draft) => `[${draft.platform}](../drafts/${calendar.date}/${draft.fileName})`)
            .join(" · ");
    lines.push(
      `## ${item.id} ｜ ${item.category} ｜ ${riskBadge(item)}`,
      "",
      `- 角度: ${item.angle}`,
      `- 受众: ${item.audience}　素材: ${item.assetType}　链接: ${item.linkPolicy}`,
      `- 草稿: ${draftLinks}　${complianceBadge(drafts)}`,
      `- ${statusLine()}`,
      "",
    );
  }
  return lines.join("\n");
}

const STATUS_PATTERN =
  /^## (?<id>\S+) ｜[\s\S]*?状态: \[(?<approve>.)\] Approve　\[(?<edit>.)\] Edit　\[(?<reject>.)\] Reject/;

export function parseReviewStatuses(markdown: string): ReviewEntryStatus[] {
  const sections = markdown.split(/\n(?=## )/);
  const statuses: ReviewEntryStatus[] = [];
  for (const section of sections) {
    const match = section.match(STATUS_PATTERN);
    if (match?.groups === undefined) {
      continue;
    }
    const { id, approve, edit, reject } = match.groups;
    const checked = (flag: string | undefined): boolean =>
      flag !== undefined && flag.trim() !== "";
    let decision: ReviewDecision = "pending";
    if (checked(approve)) {
      decision = "approve";
    } else if (checked(edit)) {
      decision = "edit";
    } else if (checked(reject)) {
      decision = "reject";
    }
    statuses.push({ itemId: id!, decision });
  }
  return statuses;
}
