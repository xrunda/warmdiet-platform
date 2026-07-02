import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";

const fps = 30;

const scenes = [
  {
    from: 0,
    duration: 9,
    eyebrow: "医疗随诊的新入口",
    title: "把老人每天三餐，变成医生看得懂的健康数据",
    subtitle: "WarmDiet 三餐管家 · 医院端 + 患者家属端",
    points: ["家属补录三餐", "医生查看趋势", "患者授权保护"],
    image: "screenshots/family-home.png",
    mode: "phone",
  },
  {
    from: 9,
    duration: 11,
    eyebrow: "患者 / 家属端 H5",
    title: "家属手动补录，老人模式清晰可用",
    subtitle: "早餐、午餐、晚餐、用药、健康档案，都能在手机上完成。",
    points: ["按钮更大", "流程更短", "刷新也能保留记录"],
    image: "screenshots/family-settings.png",
    mode: "phone",
  },
  {
    from: 20,
    duration: 10,
    eyebrow: "授权优先",
    title: "数据不是自动流向医院，而是患者主动授权",
    subtitle: "授权范围、有效期、撤销能力，让随诊管理有边界。",
    points: ["先授权再查看", "可设置有效期", "患者可撤销"],
    image: "screenshots/family-report.png",
    mode: "phone",
  },
  {
    from: 30,
    duration: 12,
    eyebrow: "医院 / 医生工作台",
    title: "医生看到的不是聊天记录，而是可追踪的风险线索",
    subtitle: "患者列表、餐食记录、健康报告、风险提醒，集中在一个工作台。",
    points: ["患者列表", "风险提醒", "饮食趋势"],
    image: "screenshots/hospital-dashboard.png",
    mode: "desktop",
  },
  {
    from: 42,
    duration: 11,
    eyebrow: "Demo 已上线",
    title: "一个仓库，同时跑医院端、家属端和 Cloudflare Demo API",
    subtitle: "医院端：warmdiet-platform.xruns.dev  家属端：/family/",
    points: ["医院端 Web", "家属端 H5", "Demo API"],
    image: "screenshots/hospital-patients.png",
    mode: "desktop",
  },
  {
    from: 53,
    duration: 12,
    eyebrow: "Open-Core 开源策略",
    title: "基础产品开源，Enterprise / AI Core 保持商业化空间",
    subtitle: "开源医院端、家属端、授权流程和 Demo 后端；闭源硬件语音链路、MCP bridge、AI 餐食识别与模型编排。",
    points: ["基础产品开源", "AI Core 闭源", "企业交付可持续"],
    image: "screenshots/family-consult.png",
    mode: "phone",
  },
  {
    from: 65,
    duration: 13,
    eyebrow: "面向医院与投资人",
    title: "它不是一个记账式饮食 App，而是慢病随诊的数据连接层",
    subtitle: "先用 Demo 获客和试点，再逐步接入真实数据库、医院流程和 AI 能力。",
    points: ["院外数据入口", "慢病随诊场景", "可试点可商业化"],
    image: "screenshots/hospital-dashboard.png",
    mode: "desktop",
  },
  {
    from: 78,
    duration: 12,
    eyebrow: "现在已经开源",
    title: "WarmDiet Platform",
    subtitle: "GitHub: xrunda/warmdiet-platform · 线上 Demo 可直接体验",
    points: ["GitHub 已开源", "线上 Demo 可体验", "欢迎医院试点"],
    image: "screenshots/family-home.png",
    mode: "phone",
  },
] as const;

const narrationLines = [
  "老年患者的健康管理，常常断在医院之外。",
  "医生知道诊断，家属知道每天吃了什么，但这些信息很少被连续地连接起来。",
  "三餐管家 WarmDiet，要解决的正是这个断点。",
  "患者家属可以在手机上补录每天三餐、用药、健康档案和医嘱。",
  "界面为老人阅读优化，流程尽量少打扰，但关键数据不会丢。",
  "更重要的是，数据查看不是默认开放。",
  "患者可以明确授权医生，在指定范围和有效期内查看餐食记录、健康报告和随诊线索。",
  "医院端则把这些授权数据整理成医生工作台。",
  "医生看到患者列表、风险提醒、餐食趋势和健康报告，可以更快判断谁需要优先关注。",
  "这让院外饮食记录，不再只是家属手机里的碎片，而是随诊服务的一部分。",
  "现在这个项目已经以 open core 方式开源。",
  "开源部分包括医院端、患者家属端、授权流程、本地后端和 Cloudflare Demo。",
  "闭源部分保留在 Enterprise 和 AI Core：包括小爱硬件语音链路、MCP bridge、AI 餐食识别、私有 prompt 和模型编排。",
  "这是一条更现实的商业路径：让医院和开发者先看见产品、跑通 Demo、理解边界，再进入试点和企业级交付。",
  "对医院，它提供院外随诊的数据入口。",
  "对投资人，它展示了老年慢病管理里，一个可开源传播、也能持续商业化的产品底座。",
  "WarmDiet Platform，已经可以在线体验，也已经在 GitHub 开源。",
];

function useSceneProgress(durationSeconds: number) {
  const frame = useCurrentFrame();
  const { fps: currentFps } = useVideoConfig();
  return frame / (durationSeconds * currentFps);
}

const phoneStyle: React.CSSProperties = {
  width: 510,
  height: 1104,
  borderRadius: 44,
  overflow: "hidden",
  boxShadow: "0 36px 90px rgba(15, 23, 42, 0.34)",
  border: "10px solid rgba(15, 23, 42, 0.86)",
  background: "#111827",
};

const desktopStyle: React.CSSProperties = {
  width: 960,
  height: 800,
  borderRadius: 34,
  overflow: "hidden",
  boxShadow: "0 36px 90px rgba(15, 23, 42, 0.28)",
  border: "8px solid rgba(255, 255, 255, 0.86)",
  background: "#f8fafc",
};

const sceneEase = Easing.bezier(0.16, 1, 0.3, 1);

function ProductFrame({
  image,
  mode,
  side = "right",
}: {
  image: string;
  mode: "phone" | "desktop";
  side?: "left" | "right";
}) {
  const frame = useCurrentFrame();
  const { fps: currentFps } = useVideoConfig();
  const enter = interpolate(frame, [0, 1.1 * currentFps], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: sceneEase,
  });
  const opacity = interpolate(frame, [0, 0.7 * currentFps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slowPan = interpolate(frame, [0, 10 * currentFps], [1, 1.045], {
    extrapolateRight: "clamp",
  });
  const frameStyle = mode === "phone" ? phoneStyle : desktopStyle;
const position: React.CSSProperties =
    side === "right"
      ? { right: mode === "phone" ? -26 : -80, top: mode === "phone" ? 590 : 850 }
      : { left: 70, top: mode === "phone" ? 560 : 720 };

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        ...frameStyle,
        opacity,
        transform: `translateY(${enter}px) rotate(${mode === "phone" ? -3 : 0}deg)`,
      }}
    >
      <Img
        src={staticFile(image)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: mode === "desktop" ? "left top" : "top",
          transform: `scale(${slowPan})`,
        }}
      />
    </div>
  );
}

function MetricStrip({ items }: { items: Array<[string, string]> }) {
  const frame = useCurrentFrame();
  const { fps: currentFps } = useVideoConfig();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 14,
        marginTop: 42,
      }}
    >
      {items.map(([value, label], index) => {
        const opacity = interpolate(frame, [(0.4 + index * 0.12) * currentFps, (0.95 + index * 0.12) * currentFps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [(0.4 + index * 0.12) * currentFps, (0.95 + index * 0.12) * currentFps], [24, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: sceneEase,
        });
        return (
          <div
            key={label}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              borderRadius: 24,
              padding: "22px 18px",
              backdropFilter: "blur(18px)",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{value}</div>
            <div style={{ marginTop: 9, fontSize: 20, color: "rgba(255,255,255,0.72)", lineHeight: 1.25 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function FeatureStack({ items, compact = false }: { items: readonly string[]; compact?: boolean }) {
  const frame = useCurrentFrame();
  const { fps: currentFps } = useVideoConfig();

  return (
    <div
      style={{
        display: "grid",
        gap: compact ? 14 : 18,
        marginTop: compact ? 28 : 38,
        maxWidth: compact ? 390 : 650,
      }}
    >
      {items.map((item, index) => {
        const opacity = interpolate(frame, [(0.42 + index * 0.16) * currentFps, (0.86 + index * 0.16) * currentFps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [(0.42 + index * 0.16) * currentFps, (0.86 + index * 0.16) * currentFps], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: sceneEase,
        });

        return (
          <div
            key={item}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              border: "1px solid rgba(255,255,255,0.24)",
              background: "rgba(255,255,255,0.14)",
              borderRadius: 24,
              padding: compact ? "17px 18px" : "22px 24px",
              boxShadow: "0 22px 52px rgba(2,6,23,0.18)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: "rgba(167,243,208,0.18)",
                color: "#a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 950,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                fontSize: compact ? 25 : 31,
                lineHeight: 1.2,
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SceneCard({
  scene,
  index,
}: {
  scene: (typeof scenes)[number];
  index: number;
}) {
  const frame = useCurrentFrame();
  const { fps: currentFps } = useVideoConfig();
  const progress = useSceneProgress(scene.duration);
  const titleY = interpolate(frame, [0, 0.95 * currentFps], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: sceneEase,
  });
  const titleOpacity = interpolate(frame, [0, 0.75 * currentFps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sceneNumber = String(index + 1).padStart(2, "0");
  const isDesktop = scene.mode === "desktop";

  return (
    <AbsoluteFill
      style={{
        background:
          index % 2 === 0
            ? "linear-gradient(155deg, #061520 0%, #083344 45%, #4f46e5 100%)"
            : "linear-gradient(155deg, #07111f 0%, #172554 48%, #0f766e 100%)",
        color: "white",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 980,
          height: 980,
          borderRadius: "50%",
          right: -460 + progress * 90,
          top: -260,
          background: "radial-gradient(circle, rgba(45,212,191,0.30) 0%, rgba(45,212,191,0.05) 48%, transparent 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          left: -360,
          bottom: -240,
          background: "radial-gradient(circle, rgba(129,140,248,0.35) 0%, rgba(129,140,248,0.08) 50%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 86,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          letterSpacing: 4,
          fontSize: 18,
          fontWeight: 800,
          color: "rgba(255,255,255,0.64)",
        }}
      >
        <span>WARMDIET PLATFORM</span>
        <span>{sceneNumber}/08</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: isDesktop ? 60 : 430,
          top: isDesktop ? 160 : 186,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.10)",
            borderRadius: 999,
            padding: "11px 18px",
            fontSize: 22,
            fontWeight: 900,
            color: "#a7f3d0",
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#34d399" }} />
          {scene.eyebrow}
        </div>
        <h1
          style={{
            margin: "34px 0 0",
            fontSize: isDesktop ? 72 : index === 5 ? 60 : 70,
            lineHeight: 1.06,
            letterSpacing: 0,
            maxWidth: isDesktop ? 960 : 560,
            fontWeight: 950,
          }}
        >
          {scene.title}
        </h1>
        <p
          style={{
            marginTop: 26,
            maxWidth: isDesktop ? 840 : 610,
            fontSize: isDesktop ? 34 : 31,
            lineHeight: 1.38,
            color: "rgba(255,255,255,0.84)",
            fontWeight: 750,
          }}
        >
          {scene.subtitle}
        </p>
        <FeatureStack items={scene.points} compact={!isDesktop} />
        {index === 0 && (
          <MetricStrip
            items={[
              ["2端", "医院端 + 家属端"],
              ["授权", "患者主动开放"],
              ["Demo", "Cloudflare 在线体验"],
            ]}
          />
        )}
        {index === 6 && (
          <MetricStrip
            items={[
              ["院外", "饮食数据入口"],
              ["随诊", "风险优先级"],
              ["开源", "降低试点门槛"],
            ]}
          />
        )}
      </div>

      <ProductFrame image={scene.image} mode={scene.mode} side={scene.mode === "desktop" ? "right" : "right"} />

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 70,
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 28,
          background: "rgba(2,6,23,0.34)",
          backdropFilter: "blur(20px)",
          padding: "26px 30px",
          fontSize: 34,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.92)",
          fontWeight: 800,
        }}
      >
        {narrationLines[Math.min(index * 2, narrationLines.length - 1)]}
      </div>
    </AbsoluteFill>
  );
}

export const WarmDietPromo = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/narration.m4a")} volume={0.96} />
      <Audio src={staticFile("audio/ambient.m4a")} volume={0.11} loop />
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.title}
          from={scene.from * fps}
          durationInFrames={scene.duration * fps}
          premountFor={fps}
        >
          <SceneCard scene={scene} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
