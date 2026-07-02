# WarmDiet Remotion Promo

90 秒竖屏短视频工程，用于推广 `xrunda/warmdiet-platform` open-core 开源项目。

## 视频定位

- 平台：抖音 / 视频号 / 小红书等竖屏短视频平台
- 受众：医院试点方、医生管理者、投资人
- 尺寸：1080 × 1920
- 时长：90 秒
- 内容：医院端、患者家属端、授权机制、开源边界、线上 Demo

## 本地预览

```bash
npm install
npm run dev
```

## 火山 TTS 旁白

```bash
VOLC_TTS_APPID=your_app_id \
VOLC_TTS_ACCESS_TOKEN=your_access_token \
VOLC_TTS_CLUSTER=volcano_tts \
VOLC_TTS_VOICE_TYPE=zh_male_shaonianzixin_moon_bigtts \
VOLC_TTS_SPEED_RATIO=1.25 \
VOLC_TTS_API_VERSION=v1 \
node scripts/generate-volc-tts.mjs
```

生成结果：

```text
public/audio/narration-volc.mp3
```

当前成片使用火山 TTS 音频转码得到的 `public/audio/narration.m4a`。

## 渲染

```bash
npm run render
```

输出文件：

```text
../resource/warmdiet-open-source-vertical-promo.mp4
```

## 素材

- `public/screenshots/`：从线上 Demo 抓取的医院端和家属端截图
- `public/audio/narration.txt`：中文旁白稿
- `public/audio/narration.m4a`：火山 TTS 中文旁白
- `public/audio/narration-volc.mp3`：火山 TTS 原始生成音频
- `public/audio/ambient.m4a`：轻背景音
