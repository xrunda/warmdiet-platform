import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config/load.ts";
import { resolveContentRoot, resolveDataRoot } from "../commands/paths.ts";
import { resolvePlanDate } from "../commands/daily-plan.ts";
import { runDailyRun } from "../commands/daily-run.ts";
import { runPublishPackage } from "../commands/publish-package.ts";
import { setReviewDecision, type ReviewDecision } from "../review/review-file.ts";
import { buildOverview } from "./overview.ts";

/**
 * 本地工作台服务（GB-011）。
 *
 * 只绑定 127.0.0.1；前端为单文件 HTML，全部数据经本地 API 读取。
 * 写操作仅两类：审核决策回写（有单测的定点替换）与调用既有命令
 * （daily:run / publish:package，均在进程内执行，遵守全部既有防线）。
 */

const HTML_PATH = join(dirname(fileURLToPath(import.meta.url)), "index.html");
const VALID_DECISIONS: ReviewDecision[] = ["approve", "edit", "reject", "pending"];

function sendJson(res: ServerResponse, code: number, data: unknown): void {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw === "" ? {} : JSON.parse(raw);
}

export function createDashboardServer(rootDir: string): Server {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const config = loadConfig(join(rootDir, "config"));
      const dataRoot = resolveDataRoot(config, rootDir);
      const contentRoot = resolveContentRoot(config, rootDir);
      const date = resolvePlanDate(url.searchParams.get("date") ?? undefined);

      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(readFileSync(HTML_PATH, "utf8"));
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/overview") {
        sendJson(res, 200, buildOverview(dataRoot, contentRoot, date));
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/daily-run") {
        // 工作台不提供 --force：强制重建须在命令行明确操作（P1 防线不给一键入口）
        const code = runDailyRun({ dryRun: false, date, rootDir });
        sendJson(res, 200, { exitCode: code, overview: buildOverview(dataRoot, contentRoot, date) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/review-decision") {
        const body = (await readBody(req)) as { itemId?: string; decision?: string };
        if (typeof body.itemId !== "string" || !VALID_DECISIONS.includes(body.decision as ReviewDecision)) {
          sendJson(res, 400, { error: "需要 itemId 与合法 decision（approve/edit/reject/pending）" });
          return;
        }
        const reviewPath = join(contentRoot, "review", `${date}.md`);
        if (!existsSync(reviewPath)) {
          sendJson(res, 404, { error: `审核文件不存在: ${reviewPath}，请先生成今日流程` });
          return;
        }
        const updated = setReviewDecision(
          readFileSync(reviewPath, "utf8"),
          body.itemId,
          body.decision as ReviewDecision,
        );
        writeFileSync(reviewPath, updated);
        sendJson(res, 200, { overview: buildOverview(dataRoot, contentRoot, date) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/publish-package") {
        const code = runPublishPackage({ dryRun: false, date, rootDir });
        sendJson(res, 200, { exitCode: code, overview: buildOverview(dataRoot, contentRoot, date) });
        return;
      }

      sendJson(res, 404, { error: "not found" });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });
}
