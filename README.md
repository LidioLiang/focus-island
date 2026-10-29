# 专注岛 Focus Island

专注岛 V2 极速 MVP 的正式 Web 应用。当前主流程是“海岛 → 后台自动分房 → 六座静态选座 → 沉浸专注”，正式页面不加载 Godot Web。

代码可公开查看，但不授予默认复制、修改、分发或商用许可，详见 [LICENSE](./LICENSE)。

## 技术基线

- Node.js `>=22.13.0`
- Next.js 16 + React 19，正式部署于 Vercel Pro；当前 Functions 区域模板为 `sin1`
- Supabase Pro：Auth、PostgreSQL、Realtime 和 Storage；当前区域模板为新加坡，生产创建前按首发海外市场与 Functions 同步确认
- PostgreSQL 函数负责原子分房、抢座、换座、心跳和释放
- RLS + `auth.uid()` 负责数据归属；客户端 `guestId` 不是信任边界

## 本地开发

```bash
npm ci
cp .env.example .env.local
npx supabase start
npm run dev
```

在 `.env.local` 填入本地 Supabase 输出的 URL 和 publishable/anon key，然后访问 `http://localhost:5173`。正式环境必须同时配置 Turnstile site key 和 secret key。

## 常用命令

```bash
npm run dev            # Next.js 开发服务，端口 5173
npm run lint           # ESLint
npm run typecheck      # TypeScript 静态检查
npm test               # Node 合约与业务测试
npm run build          # 原生 Next.js 生产构建
npm run check          # 完整本地质量门禁
npm run assets:upload  # 上传四首音频到版本化 Storage 目录
```

Supabase 结构变更只能提交到 `supabase/migrations/`。本地数据库测试：

```bash
npx supabase db reset
npx supabase test db
```

## 部署与更新

1. 从 `main` 建分支并提交 PR。
2. Supabase Preview Branch 应用 migration，Vercel 生成 Preview Deployment。
3. CI、Preview 烟测和人工主流程验收通过后合并 `main`。
4. Vercel 自动发布 Production。数据库改动使用 expand/contract，禁止在生产控制台手改表结构。

环境、回滚、备份恢复与发布门禁见 [`docs/20261027-专注岛Vercel-Supabase上线与运维手册.md`](./docs/20261027-专注岛Vercel-Supabase上线与运维手册.md)。

## 目录

```text
app/                    Next.js 页面、身份桥接和 API routes
lib/                    Supabase 客户端、校验与安全边界
public/                 正式静态页面与已授权素材
supabase/migrations/    唯一数据库变更渠道
supabase/tests/         RLS、函数权限和模型测试
test/                   Node 合约测试
docs/                   发布、运维和素材权属文档
```
