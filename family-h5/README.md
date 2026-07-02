# 家属端 H5 应用（Family H5）

这个目录用于存放 **家属端 H5** 的完整源码，方便与当前的医院端（B 端）项目共用同一套后端和仓库。

## 使用方式

1. **将你现有的家属端 H5 项目整体复制到本目录下**  
   - 比如你的项目原来长这样：
     - `package.json`
     - `src/`、`public/`、`dist/` 等  
   - 复制后变成：
     - `family-h5/package.json`
     - `family-h5/src/` ...

2. **按原项目方式在子目录里启动/构建**

```bash
cd family-h5
npm install         # 或 pnpm/yarn
npm run dev         # 家属端 H5，默认端口：4100
```

3. **推荐：在仓库根目录一键启动三端服务**

在项目根目录执行：

```bash
npm install          # 已执行过可跳过
npm run dev:all      # 一键启动：后端 + 医院端前端 + 家属端 H5
```

其中端口约定为：

- 后端 API：`http://localhost:4000`
- 医院端前端（B 端）：`http://localhost:4001`
- 家属端 H5（本目录）：`http://localhost:4100`

> `dev:all` 内部会先执行 `npm run kill-ports` 自动释放 4000/4001/4100 端口，再并行启动三个服务。

## 与后端的集成建议

- 后端已经运行在：`http://localhost:4000`，API 前缀为 `/api`。  
- 推荐在家属端项目中统一使用：
  - 开发环境：`VITE_API_URL=http://localhost:4000/api`（或等价的环境变量）  
  - 生产环境：指向你部署后的后端地址。

后续步骤（我来帮你做）：

1. 你把家属端源码拷贝到 `family-h5/` 下面并告诉我使用的技术栈（如 React/Vue/纯 HTML 等）。
2. 我会根据实际项目：
   - 配置统一的 API 地址（与医生端共用同一后端）。
   - 如有需要，增加根目录脚本（例如 `npm run dev:family`）方便一键启动。
   - 视情况添加部署说明文档。

