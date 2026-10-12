# 沉浸式专注软件主线应用

`prototype/` 是项目唯一的开发、检查和部署验证入口。根目录 `archive/` 只保留历史实验和导出物，不是可并行修改或部署的应用。

## 技术基线

- Node.js `>=22.13.0`
- npm（使用已提交的 `package-lock.json`）
- Next.js 16 + React 19
- Vinext / Vite
- Cloudflare Workers + D1
- Drizzle ORM

## 快速开始

```bash
cd /Users/liangxiaoxiao/Desktop/20261011-沉浸式专注软件/prototype
npm ci
npm run dev
```

本地开发默认访问 `http://localhost:5173`。首次调用座位 API 前，如本地 D1 还没有表结构，执行：

```bash
npx wrangler d1 execute site-creator-d1 --local --file=drizzle/0000_serious_microbe.sql
```

该命令只写入项目内的本地 Wrangler 状态，不会修改远程数据库。

## 环境与本地配置

当前没有必填的键值型应用环境变量，因此无需为正常启动创建 `.env.local`。变量约定和可选工具变量见 [`.env.example`](./.env.example)。

D1 由 Cloudflare binding `DB` 注入：

- 托管绑定声明：`.openai/hosting.json`
- TypeScript 类型：`cloudflare-env.d.ts`
- 数据表模型：`db/schema.ts`
- SQL migration：`drizzle/`

不要把 D1 当作数据库 URL 写入 `.env`，也不要在仓库中提交真实密钥。

## 常用命令

```bash
npm run dev        # 开发服务，默认端口 5173
npm run lint       # ESLint；出现 error 时失败
npm run typecheck  # TypeScript 静态检查，不生成文件
npm test           # Node 原生测试入口；当前尚无自动化用例
npm run build      # 生产构建，输出到 dist/
npm start          # 在已 build 后用本地 Wrangler 预览产物
npm run check      # lint + typecheck + test + build 完整质量门禁
npm run db:generate # schema 变更后生成 migration
```

提交前至少执行 `npm run check`。当前 `npm test` 是稳定入口但测试数为 0；一旦修改计时、座位、身份或持久化逻辑，应在同一任务内补上对应测试。

## 构建与部署

1. 在 `prototype/` 执行 `npm ci` 和 `npm run check`。
2. 确认 `.openai/hosting.json` 的项目与 D1 binding 名仍为当前环境所用值。
3. 在目标 D1 数据库执行尚未应用的 `drizzle/` migrations。远程迁移是有状态操作，由部署负责人明确目标后执行。
4. 从 `prototype/` 触发托管平台发布；不从根目录或 `archive/` 发布。构建产物为 `dist/`。
5. 发布后验证首页、房间状态读取、占座和释放流程。

本项目的托管配置由平台管理，仓库中不把未确认的手工 `wrangler deploy` 命令作为标准流程。

## 目录职责

```text
prototype/
├── app/                 # Next App Router 页面和 API routes
├── public/              # 当前原型脚本、样式和静态素材
├── db/                  # Drizzle schema 和 D1 访问入口
├── drizzle/             # 可追踪的 SQL migrations
├── lib/                 # 服务端共享模块和连接器支持
├── build/               # 托管平台/Vinext 构建支持
├── scripts/             # 安装、构建和运行脚本
├── docs/                # 主线应用工程文档
└── .openai/             # 托管项目与 binding 声明
```

更详细的边界、变更归属与质量门禁见 [`docs/20261012-工程与协作规范.md`](./docs/20261012-工程与协作规范.md)。
