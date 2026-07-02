import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const textPath = resolve(root, "public/audio/narration.txt");
const outputPath = resolve(root, "public/audio/narration-volc.mp3");

const {
  VOLC_TTS_APPID,
  VOLC_TTS_ACCESS_TOKEN,
  VOLC_TTS_API_KEY,
  VOLC_TTS_API_VERSION = "v3",
  VOLC_TTS_CLUSTER = "volcano_tts",
  VOLC_TTS_VOICE_TYPE = "zh_male_shaonianzixin_moon_bigtts",
  VOLC_TTS_RESOURCE_ID,
  VOLC_TTS_SPEED_RATIO = "1.15",
} = process.env;

if ((!VOLC_TTS_APPID || !VOLC_TTS_ACCESS_TOKEN) && !VOLC_TTS_API_KEY) {
  throw new Error("Set either VOLC_TTS_API_KEY or VOLC_TTS_APPID + VOLC_TTS_ACCESS_TOKEN");
}

const text = await readFile(textPath, "utf8");

function inferResourceId(voiceType) {
  if (VOLC_TTS_RESOURCE_ID) return VOLC_TTS_RESOURCE_ID;
  if (voiceType.startsWith("S_")) return "seed-icl-2.0";
  if (voiceType.includes("_uranus_") || voiceType.startsWith("saturn_")) return "seed-tts-2.0";
  return "seed-tts-1.0";
}

function decodeV3Chunks(raw) {
  const chunks = [];
  const parts = [];

  if (raw.trim().includes("\n")) {
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) parts.push(JSON.parse(trimmed));
    }
  } else {
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < raw.length; index += 1) {
      const char = raw[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          parts.push(JSON.parse(raw.slice(start, index + 1)));
          start = -1;
        }
      }
    }
  }

  if (parts.length === 0) {
    throw new Error(`Unable to parse Volcengine response: ${raw.slice(0, 500)}`);
  }

  for (const item of parts) {
    if (typeof item.data === "string") {
      chunks.push(Buffer.from(item.data, "base64"));
    }
    const code = item.code ?? item.header?.code;
    if (code && code !== 0 && code !== 20000000) {
      throw new Error(`Volcengine TTS failed: ${JSON.stringify(item)}`);
    }
  }

  return Buffer.concat(chunks);
}

async function requestV3() {
  const headers = {
    "Content-Type": "application/json",
    "X-Api-Resource-Id": inferResourceId(VOLC_TTS_VOICE_TYPE),
    "X-Api-Request-Id": crypto.randomUUID(),
  };
  if (VOLC_TTS_API_KEY) {
    headers["X-Api-Key"] = VOLC_TTS_API_KEY;
  } else {
    headers["X-Api-App-Id"] = VOLC_TTS_APPID;
    headers["X-Api-Access-Key"] = VOLC_TTS_ACCESS_TOKEN;
  }

  const response = await fetch("https://openspeech.bytedance.com/api/v3/tts/unidirectional", {
    method: "POST",
    headers,
    body: JSON.stringify({
      user: {
        uid: "warmdiet-remotion-promo",
      },
      req_params: {
        text,
        speaker: VOLC_TTS_VOICE_TYPE,
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
          speed_ratio: Number(VOLC_TTS_SPEED_RATIO),
        },
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Volcengine TTS HTTP ${response.status}: ${raw}`);
  }
  const audio = decodeV3Chunks(raw);
  if (audio.length === 0) {
    throw new Error(`Volcengine TTS returned no audio: ${raw.slice(0, 500)}`);
  }
  return audio;
}

async function requestV1() {
  const response = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
  method: "POST",
  headers: {
    Authorization: `Bearer;${VOLC_TTS_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    app: {
      appid: VOLC_TTS_APPID,
      token: "access_token",
      cluster: VOLC_TTS_CLUSTER,
    },
    user: {
      uid: "warmdiet-remotion-promo",
    },
    audio: {
      voice_type: VOLC_TTS_VOICE_TYPE,
      encoding: "mp3",
      speed_ratio: Number(VOLC_TTS_SPEED_RATIO),
      volume_ratio: 1,
      pitch_ratio: 1,
    },
    request: {
      reqid: crypto.randomUUID(),
      text,
      text_type: "plain",
      operation: "query",
    },
  }),
  });

  const result = await response.json();

  if (result.code !== 3000 || !result.data) {
    throw new Error(`Volcengine TTS failed: ${JSON.stringify(result)}`);
  }

  return Buffer.from(result.data, "base64");
}

const audioBuffer =
  VOLC_TTS_API_VERSION === "v1"
    ? await requestV1()
    : await requestV3().catch(async (error) => {
        if (!VOLC_TTS_APPID || !VOLC_TTS_ACCESS_TOKEN) throw error;
        console.warn(`V3 failed, falling back to V1: ${error.message}`);
        return requestV1();
      });

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, audioBuffer);
console.log(`Generated ${outputPath}`);
