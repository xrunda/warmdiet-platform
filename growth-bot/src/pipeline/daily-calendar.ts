import type { PlatformId } from "../config/schema.ts";
import type { NormalizedTrendItem } from "../sources/trends.ts";
import type { ProjectState } from "../sources/project-state.ts";

/**
 * 每日内容日历（GB-005）。
 *
 * 按 PRD 第 6 节的内容配比，把项目状态和当日热点组装成 10 条内容计划。
 * 纯确定性规则引擎：同一天同样输入生成同样结果；不写平台文案，不自动发布。
 */

export type ContentCategory =
  | "product-feature"
  | "trend"
  | "tech-opensource"
  | "video-promo"
  | "github-update"
  | "product-thinking"
  | "interaction";

/** PRD 第 6 节：每日 10 条的类型配比 */
export const CONTENT_MIX: ReadonlyArray<{ category: ContentCategory; count: number }> = [
  { category: "product-feature", count: 2 },
  { category: "trend", count: 2 },
  { category: "tech-opensource", count: 2 },
  { category: "video-promo", count: 1 },
  { category: "github-update", count: 1 },
  { category: "product-thinking", count: 1 },
  { category: "interaction", count: 1 },
];

export type AssetType = "text" | "screenshot" | "video";
export type LinkPolicy = "none" | "repo" | "demo";

/** 每日含链接条数上限（PRD 第 12 节：限制链接比例，降低 spam 感） */
export const MAX_LINK_ITEMS = 3;

export interface CalendarItem {
  id: string;
  category: ContentCategory;
  angleKey: string;
  /** 核心观点 / 选题角度 */
  angle: string;
  platformTargets: PlatformId[];
  audience: string;
  assetType: AssetType;
  riskLevel: "low" | "medium" | "high";
  linkPolicy: LinkPolicy;
  /** 关联的热点 id（仅 trend 类），其余为 null */
  trendRef: string | null;
  /** 热点 URL：跨天去重的稳定键（id 按日期生成，同一文章两天 id 不同） */
  trendUrl: string | null;
  /** 素材提示（如视频路径），无则为 null */
  assetHint: string | null;
}

export interface CalendarFile {
  date: string;
  generatedAt: string;
  count: number;
  items: CalendarItem[];
  warnings: string[];
}

interface AngleTemplate {
  key: string;
  angle: string;
  audience: string;
  assetType: AssetType;
  platformTargets: PlatformId[];
  linkPolicy: LinkPolicy;
}

const PRODUCT_FEATURE_POOL: AngleTemplate[] = [
  {
    key: "hospital-console",
    angle: "医院端工作台：患者列表、授权状态、随诊管理一屏完成",
    audience: "医生 / 医院管理者",
    assetType: "screenshot",
    platformTargets: ["x", "xiaohongshu"],
    linkPolicy: "demo",
  },
  {
    key: "family-h5",
    angle: "家属端 H5：给老人补录一餐只要 30 秒",
    audience: "家属 / 照护者",
    assetType: "screenshot",
    platformTargets: ["xiaohongshu", "kuaishou"],
    linkPolicy: "none",
  },
  {
    key: "authorization",
    angle: "患者主动授权机制：医生只能看到被授权范围内的数据",
    audience: "医生 / 家属",
    assetType: "screenshot",
    platformTargets: ["x", "wechat-video"],
    linkPolicy: "none",
  },
  {
    key: "demo-tour",
    angle: "在线 Demo 任意密码可登录，两分钟体验医院端到家属端完整流程",
    audience: "开发者 / 投资人",
    assetType: "screenshot",
    platformTargets: ["x", "xiaohongshu"],
    linkPolicy: "demo",
  },
];

const TECH_OPENSOURCE_POOL: AngleTemplate[] = [
  {
    key: "open-core",
    angle: "open-core 边界实践：哪些开源、哪些闭源、为什么这样切",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "repo",
  },
  {
    key: "cloudflare-stack",
    angle: "把医疗 Demo 全栈跑在 Cloudflare Workers 上的架构取舍",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "none",
  },
  {
    key: "elder-friendly-h5",
    angle: "面向老人家属的 H5 交互设计：大字体、少层级、离线容错",
    audience: "开发者 / 设计师",
    assetType: "screenshot",
    platformTargets: ["x", "xiaohongshu"],
    linkPolicy: "none",
  },
  {
    key: "zero-dep-pipeline",
    angle: "用零依赖 TypeScript 流水线给开源项目做内容运营中台",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "none",
  },
];

const PRODUCT_THINKING_POOL: AngleTemplate[] = [
  {
    key: "post-discharge-gap",
    angle: "院外随诊最大的障碍不是技术，是家属的执行成本",
    audience: "医生 / 行业从业者",
    assetType: "text",
    platformTargets: ["wechat-video", "x"],
    linkPolicy: "none",
  },
  {
    key: "data-consent",
    angle: "《个人信息保护法》之下，患者数据授权应该长什么样",
    audience: "行业从业者",
    assetType: "text",
    platformTargets: ["x", "wechat-video"],
    linkPolicy: "none",
  },
  {
    key: "caregiver-record",
    angle: "老人的一日三餐，到底该由谁来记录",
    audience: "家属 / 照护者",
    assetType: "text",
    platformTargets: ["xiaohongshu", "kuaishou"],
    linkPolicy: "none",
  },
];

const INTERACTION_POOL: AngleTemplate[] = [
  {
    key: "ask-doctors",
    angle: "向医生提问：随诊时你最想看到患者的哪类院外数据？",
    audience: "医生",
    assetType: "text",
    platformTargets: ["x", "wechat-video"],
    linkPolicy: "none",
  },
  {
    key: "ask-devs",
    angle: "向开发者提问：选择参与一个医疗开源项目时你最看重什么？",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "none",
  },
  {
    key: "ask-caregivers",
    angle: "向照护者提问：给家里老人记录饮食，你坚持过最长多久？",
    audience: "家属 / 照护者",
    assetType: "text",
    platformTargets: ["xiaohongshu", "kuaishou"],
    linkPolicy: "none",
  },
];

const VIDEO_PROMO_POOL: AngleTemplate[] = [
  {
    key: "promo-full",
    angle: "90 秒看懂三餐管家：从家属补录三餐到医生授权随诊",
    audience: "全部受众",
    assetType: "video",
    platformTargets: ["douyin", "wechat-video", "kuaishou"],
    linkPolicy: "none",
  },
  {
    key: "promo-clip-auth",
    angle: "视频切片：30 秒看患者授权流程如何保护老人数据",
    audience: "家属 / 医生",
    assetType: "video",
    platformTargets: ["douyin", "kuaishou", "wechat-video"],
    linkPolicy: "none",
  },
];

const GITHUB_UPDATE_POOL: AngleTemplate[] = [
  {
    key: "repo-progress",
    angle: "本周开源进展：模块合并、Issue 推进与下一步计划",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "repo",
  },
  {
    key: "star-thanks",
    angle: "感谢新关注：介绍仓库结构与最容易上手的参与方式",
    audience: "开发者",
    assetType: "text",
    platformTargets: ["x"],
    linkPolicy: "repo",
  },
];

/** 可借势热点不足两条时的兜底行业角度 */
const TREND_FALLBACK_POOL: AngleTemplate[] = [
  {
    key: "trend-fallback-aging",
    angle: "老龄化数据背后：家庭照护的数字化缺口在饮食记录",
    audience: "行业从业者 / 大众",
    assetType: "text",
    platformTargets: ["x", "xiaohongshu"],
    linkPolicy: "none",
  },
  {
    key: "trend-fallback-ai",
    angle: "医疗 AI 要落地，先回答数据从哪里合规地来",
    audience: "行业从业者 / 开发者",
    assetType: "text",
    platformTargets: ["x", "wechat-video"],
    linkPolicy: "none",
  },
];

const POOLS: Record<Exclude<ContentCategory, "trend">, AngleTemplate[]> = {
  "product-feature": PRODUCT_FEATURE_POOL,
  "tech-opensource": TECH_OPENSOURCE_POOL,
  "video-promo": VIDEO_PROMO_POOL,
  "github-update": GITHUB_UPDATE_POOL,
  "product-thinking": PRODUCT_THINKING_POOL,
  interaction: INTERACTION_POOL,
};

export const ALL_PLATFORMS: PlatformId[] = ["x", "xiaohongshu", "douyin", "wechat-video", "kuaishou"];

/** 平台缺位时的补位归属：该平台最自然的内容类型 */
const PLATFORM_PATCH_CATEGORY: Record<PlatformId, ContentCategory> = {
  x: "tech-opensource",
  xiaohongshu: "product-feature",
  douyin: "video-promo",
  "wechat-video": "product-thinking",
  kuaishou: "video-promo",
};

export interface GenerateCalendarInput {
  date: string;
  projectState: ProjectState;
  /** 当日标准化热点，可为空数组（trends 文件缺失时） */
  trends: NormalizedTrendItem[];
  /** 昨日日历中已使用的 angleKey 与热点 URL，用于避免重复 */
  yesterdayAngleKeys?: string[];
  yesterdayTrendUrls?: string[];
  now?: Date;
}

/** 以日期为种子的确定性起始下标 */
function dateSeed(date: string): number {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return year * 372 + month * 31 + day;
}

/**
 * 从池中确定性选取 count 条：从日期种子决定的起点开始轮换，
 * 优先跳过昨天用过的 key；池不够跳过时允许重复使用昨天的 key。
 */
function pickFromPool(
  pool: AngleTemplate[],
  count: number,
  seed: number,
  avoidKeys: Set<string>,
): AngleTemplate[] {
  const picked: AngleTemplate[] = [];
  const start = seed % pool.length;
  for (let i = 0; i < pool.length && picked.length < count; i += 1) {
    const candidate = pool[(start + i) % pool.length]!;
    if (!avoidKeys.has(candidate.key)) {
      picked.push(candidate);
    }
  }
  for (let i = 0; i < pool.length && picked.length < count; i += 1) {
    const candidate = pool[(start + i) % pool.length]!;
    if (!picked.includes(candidate)) {
      picked.push(candidate);
    }
  }
  return picked;
}

function trendAudience(trend: NormalizedTrendItem): string {
  if (trend.tags.some((tag) => /开源|技术|开发|AI/i.test(tag))) {
    return "开发者 / 行业从业者";
  }
  if (trend.tags.some((tag) => /养老|照护|家属/.test(tag))) {
    return "家属 / 照护者";
  }
  return "行业从业者 / 大众";
}

export function generateCalendar(input: GenerateCalendarInput): CalendarFile {
  const { date, projectState } = input;
  const warnings: string[] = [];
  const seed = dateSeed(date);
  const avoidAngles = new Set(input.yesterdayAngleKeys ?? []);
  const avoidTrendUrls = new Set(input.yesterdayTrendUrls ?? []);

  const items: CalendarItem[] = [];

  const pushTemplate = (category: ContentCategory, template: AngleTemplate): void => {
    items.push({
      id: `cal-${date}-${String(items.length + 1).padStart(2, "0")}`,
      category,
      angleKey: template.key,
      angle: template.angle,
      platformTargets: [...template.platformTargets],
      audience: template.audience,
      assetType: template.assetType,
      riskLevel: "low",
      linkPolicy: template.linkPolicy,
      trendRef: null,
      trendUrl: null,
      assetHint:
        template.assetType === "video" ? projectState.assets.promoVideo : null,
    });
  };

  for (const { category, count } of CONTENT_MIX) {
    if (category === "trend") {
      const usable = input.trends
        .filter((trend) => trend.leverageable && !avoidTrendUrls.has(trend.url))
        .sort((a, b) => {
          const rank = { high: 0, medium: 1, low: 2 } as const;
          return rank[a.credibility] - rank[b.credibility];
        })
        .slice(0, count);

      for (const trend of usable) {
        items.push({
          id: `cal-${date}-${String(items.length + 1).padStart(2, "0")}`,
          category: "trend",
          angleKey: `trend-${trend.id}`,
          angle: `结合热点「${trend.title}」谈 WarmDiet 的视角`,
          platformTargets: ["x", "xiaohongshu"],
          audience: trendAudience(trend),
          assetType: "text",
          riskLevel: trend.riskLevel,
          linkPolicy: "none",
          trendRef: trend.id,
          trendUrl: trend.url,
          assetHint: null,
        });
      }

      const shortfall = count - usable.length;
      if (shortfall > 0) {
        if (input.trends.length === 0) {
          warnings.push("当日无热点数据，热点结合条目使用兜底行业角度");
        } else {
          warnings.push(`可借势热点不足 ${count} 条，${shortfall} 条使用兜底行业角度`);
        }
        for (const template of pickFromPool(TREND_FALLBACK_POOL, shortfall, seed, avoidAngles)) {
          pushTemplate("trend", template);
        }
      }
    } else {
      for (const template of pickFromPool(POOLS[category], count, seed, avoidAngles)) {
        pushTemplate(category, template);
      }
    }
  }

  // 平台覆盖兜底：确保五个平台每天都至少出现一次
  const covered = new Set(items.flatMap((item) => item.platformTargets));
  for (const platform of ALL_PLATFORMS) {
    if (!covered.has(platform)) {
      const host =
        items.find((item) => item.category === PLATFORM_PATCH_CATEGORY[platform]) ?? items[0];
      if (host !== undefined) {
        host.platformTargets.push(platform);
        warnings.push(`平台 ${platform} 无天然覆盖，已补挂到 ${host.id}`);
      }
    }
  }

  // 链接上限：超出的按顺序降级为 none（PRD 反 spam）
  let linkCount = 0;
  for (const item of items) {
    if (item.linkPolicy !== "none") {
      linkCount += 1;
      if (linkCount > MAX_LINK_ITEMS) {
        item.linkPolicy = "none";
      }
    }
  }

  return {
    date,
    generatedAt: (input.now ?? new Date()).toISOString(),
    count: items.length,
    items,
    warnings,
  };
}
