import type { PlatformId } from "../config/schema.ts";
import type { CalendarItem } from "../pipeline/daily-calendar.ts";
import type { ProjectState } from "../sources/project-state.ts";

/**
 * 多平台草稿生成（GB-006）。
 *
 * 从内容日历条目按平台模板生成 Markdown 草稿：标题、正文、话题、
 * 素材建议、合规自检。纯模板拼装，不调用 LLM，不生成图片视频。
 * 草稿带 YAML frontmatter，供 GB-007 审核流机读。
 */

export interface DraftContext {
  date: string;
  repoUrl: string;
  demoHospitalUrl: string;
  demoFamilyUrl: string;
  positioning: string;
}

export interface Draft {
  fileName: string;
  itemId: string;
  platform: PlatformId;
  markdown: string;
  /** 自动合规扫描是否通过（不通过仍生成草稿，但标记需人工处理） */
  compliancePass: boolean;
}

/** 医疗健康表述禁用词（PRD 12：医疗健康表达过界的自动防线） */
export const BANNED_MEDICAL_WORDS = [
  "根治",
  "治愈",
  "包治",
  "疗效保证",
  "神药",
  "无副作用",
  "延年益寿",
  "确诊率",
];

export function scanBannedWords(text: string): string[] {
  return BANNED_MEDICAL_WORDS.filter((word) => text.includes(word));
}

function demoLinkFor(platform: PlatformId, ctx: DraftContext): string {
  return platform === "xiaohongshu" || platform === "kuaishou" || platform === "douyin"
    ? ctx.demoFamilyUrl
    : ctx.demoHospitalUrl;
}

function linkLine(item: CalendarItem, platform: PlatformId, ctx: DraftContext): string {
  if (item.linkPolicy === "repo") {
    return `\n\n仓库地址：${ctx.repoUrl}`;
  }
  if (item.linkPolicy === "demo") {
    return `\n\n在线体验（任意密码可登录）：${demoLinkFor(platform, ctx)}`;
  }
  return "";
}

const CATEGORY_TAGS: Record<CalendarItem["category"], string[]> = {
  "product-feature": ["三餐管家", "医疗健康管理"],
  trend: ["三餐管家", "行业观察"],
  "tech-opensource": ["开源", "OpenSource", "三餐管家"],
  "video-promo": ["三餐管家", "老人照护"],
  "github-update": ["开源", "GitHub", "三餐管家"],
  "product-thinking": ["三餐管家", "院外随诊"],
  interaction: ["三餐管家", "聊聊"],
};

const PLATFORM_TAGS: Record<PlatformId, string[]> = {
  x: ["OpenSource", "HealthTech"],
  xiaohongshu: ["老人照护", "家有老人", "健康管理"],
  douyin: ["养老", "健康", "开源项目"],
  "wechat-video": ["医疗信息化", "养老产业"],
  kuaishou: ["照顾老人", "居家养老"],
};

function hashtags(item: CalendarItem, platform: PlatformId): string[] {
  return [...new Set([...CATEGORY_TAGS[item.category], ...PLATFORM_TAGS[platform]])];
}

const ASSET_SIZE_HINTS: Record<PlatformId, string> = {
  x: "横图 16:9 或产品截图原比例，最多 4 张",
  xiaohongshu: "竖版图文卡 3:4，首图放核心观点大字",
  douyin: "竖屏视频 9:16，封面放钩子文案",
  "wechat-video": "竖屏视频 9:16 或横版 16:9，封面稳重",
  kuaishou: "竖屏视频 9:16，前 3 秒给结论",
};

function assetSuggestion(item: CalendarItem, platform: PlatformId): string {
  const lines = [
    `- 素材类型: ${item.assetType}`,
    `- 平台规格: ${ASSET_SIZE_HINTS[platform]}`,
  ];
  if (item.assetHint !== null) {
    lines.push(`- 素材引用: ${item.assetHint}`);
  }
  if (item.assetType === "screenshot") {
    lines.push("- 建议截图: 与选题角度对应的产品页面（医院端工作台 / 家属端补录 / 授权页）");
  }
  return lines.join("\n");
}

type BodyBuilder = (item: CalendarItem, ctx: DraftContext) => { title: string; body: string };

const BODY_BUILDERS: Record<PlatformId, BodyBuilder> = {
  x: (item, ctx) => ({
    title: item.angle,
    body: `${item.angle}。\n\n${ctx.positioning}。开源仓库与在线 Demo 都可以直接体验，欢迎反馈与交流。`,
  }),
  xiaohongshu: (item, ctx) => ({
    title: `👵 ${item.angle}`,
    body:
      `家里有老人需要长期记录饮食的朋友看过来～\n\n` +
      `${item.angle}。\n\n` +
      `我们在做一个开源项目「三餐管家」：${ctx.positioning}。` +
      `不用下载 App，网页就能体验。\n\n` +
      `你们家是怎么记录老人三餐的？评论区聊聊 👇`,
  }),
  douyin: (item, ctx) => ({
    title: item.angle,
    body:
      `【开场钩子】${item.angle}——很多家庭都遇到过这个问题。\n\n` +
      `【口播要点】\n` +
      `1. 老人的日常三餐，医生随诊时其实很想看到\n` +
      `2. ${ctx.positioning}\n` +
      `3. 患者主动授权，数据才给医生看\n\n` +
      `【结尾引导】这个项目是开源的，感兴趣评论区扣 1。`,
  }),
  "wechat-video": (item, ctx) => ({
    title: item.angle,
    body:
      `${item.angle}。\n\n` +
      `我们正在开源建设「三餐管家」：${ctx.positioning}。` +
      `面向医院试点与家庭照护场景，遵循患者主动授权原则管理数据。\n\n` +
      `欢迎医疗信息化同行、医院管理者交流试点合作。`,
  }),
  kuaishou: (item, ctx) => ({
    title: item.angle,
    body:
      `${item.angle}。\n\n` +
      `照顾老人吃饭这件事，说简单也简单，说难真难。` +
      `我们做了个免费开源的工具帮家里人记录三餐，医生授权后随诊也能用上。\n\n` +
      `${ctx.positioning}。觉得有用的老铁关注一下。`,
  }),
};

function complianceSection(item: CalendarItem, bannedHits: string[]): string {
  const autoLine =
    bannedHits.length === 0
      ? "- [x] 未命中医疗禁用词（自动扫描）"
      : `- [ ] ⚠️ 命中禁用词: ${bannedHits.join("、")}（必须改写后才能进入审核）`;
  const riskLine =
    item.riskLevel === "low"
      ? `- [x] 风险等级: ${item.riskLevel}`
      : `- [ ] ⚠️ 风险等级: ${item.riskLevel}（发布前需人工重点评估）`;
  return [
    autoLine,
    "- [x] 不含真实患者数据（模板不引用任何患者信息）",
    "- [x] 无诊断、治疗建议或疗效承诺",
    riskLine,
    `- [x] 链接策略: ${item.linkPolicy}（每日链接条数由日历控制）`,
    "- [ ] 人工复核医疗健康表述（发布前必查）",
  ].join("\n");
}

export function buildDraft(item: CalendarItem, platform: PlatformId, ctx: DraftContext): Draft {
  const { title, body } = BODY_BUILDERS[platform](item, ctx);
  const fullBody = `${body}${linkLine(item, platform, ctx)}`;
  const bannedHits = scanBannedWords(`${title}\n${fullBody}`);
  const tags = hashtags(item, platform);

  const markdown = `---
id: ${item.id}
date: ${ctx.date}
platform: ${platform}
category: ${item.category}
angleKey: ${item.angleKey}
audience: ${item.audience}
riskLevel: ${item.riskLevel}
linkPolicy: ${item.linkPolicy}
trendRef: ${item.trendRef ?? "null"}
compliancePass: ${bannedHits.length === 0}
status: draft
---

# 标题

${title}

## 正文

${fullBody}

## 话题

${tags.map((tag) => `#${tag}`).join(" ")}

## 素材建议

${assetSuggestion(item, platform)}

## 合规自检

${complianceSection(item, bannedHits)}
`;

  return {
    fileName: `${item.id}.${platform}.md`,
    itemId: item.id,
    platform,
    markdown,
    compliancePass: bannedHits.length === 0,
  };
}

export function buildDraftsForCalendar(
  items: CalendarItem[],
  ctx: DraftContext,
): Draft[] {
  return items.flatMap((item) =>
    item.platformTargets.map((platform) => buildDraft(item, platform, ctx)),
  );
}

export function draftContextFromProjectState(date: string, state: ProjectState): DraftContext {
  return {
    date,
    repoUrl: state.repo.url,
    demoHospitalUrl: state.demoUrls.hospital,
    demoFamilyUrl: state.demoUrls.family,
    positioning: state.positioning,
  };
}
