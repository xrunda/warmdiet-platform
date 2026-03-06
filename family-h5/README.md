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
npm run dev         # 或你原来的启动命令
```

> 目前根目录不会主动干预 `family-h5` 的构建配置，完全保持你原项目的结构和脚本。

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

