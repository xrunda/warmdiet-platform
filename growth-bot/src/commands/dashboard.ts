import { ConfigError } from "../config/load.ts";
import { defaultRootDir } from "./paths.ts";
import { createDashboardServer } from "../dashboard/server.ts";

export interface DashboardOptions {
  port?: string | undefined;
  rootDir?: string | undefined;
}

/** dashboard 命令：启动本地工作台（只绑定 127.0.0.1） */
export function runDashboard(options: DashboardOptions): number {
  const rootDir = options.rootDir ?? defaultRootDir();
  const port = options.port !== undefined ? Number(options.port) : 4700;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    process.stderr.write(`无效端口: ${options.port}\n`);
    return 1;
  }
  try {
    const server = createDashboardServer(rootDir);
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        process.stderr.write(`端口 ${port} 已被占用，请使用 --port 指定其他端口。\n`);
      } else if (error.code === "EACCES" || error.code === "EPERM") {
        process.stderr.write(`无法监听 127.0.0.1:${port}，请检查端口权限或使用 --port 指定其他端口。\n`);
      } else {
        process.stderr.write(`工作台启动失败: ${error.message}\n`);
      }
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () => {
      const actual = (server.address() as { port: number }).port;
      process.stdout.write(
        `Growth Bot 工作台已启动: http://127.0.0.1:${actual}\n（Ctrl+C 停止；仅本机可访问）\n`,
      );
    });
    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
