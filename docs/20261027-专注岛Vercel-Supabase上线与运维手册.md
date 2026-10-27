# 专注岛 Vercel + Supabase 上线与运维手册

## 一、首次上线

1. 在 Supabase 新建 Singapore（`ap-southeast-1`）Pro 项目并开启 Anonymous Sign-ins；Vercel Functions 使用 `sin1`，与数据库保持同区。
2. 用 Supabase CLI 链接项目，执行 `supabase db push`，不在生产 SQL Editor 手工修改 schema。
3. 创建 public Storage bucket `focus-audio`，设置允许 Range 请求的 CORS，运行 `npm run assets:upload`。首发路径为 `v1.0.0/`。
4. 在 Supabase Auth CAPTCHA 配置 Cloudflare Turnstile secret，在 Vercel 配置对应 site key。Turnstile token 由 Supabase Auth 校验，应用不二次兑换 token。
5. 在 Vercel Pro 从 GitHub 导入 `LidioLiang/focus-island`，Framework Preset 选 Next.js，使用仓库根目录；按第 1 步的 Supabase 区域同步调整 `vercel.json`，当前文件中的 `sin1` 仅适用于 Singapore 数据库。
6. 配置 `.env.example` 中的全部变量；service role 和 Turnstile secret 仅配置为 Vercel Secret。
7. 在 Supabase 安装 GitHub + Vercel 集成，开启按 PR 创建 Preview Branch，确认 Preview 凭据不指向 Production。

## 二、环境变量

| 变量 | Preview | Production | 可公开 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview Branch | Production | 是 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preview Branch | Production | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview Branch | Production | 否 |
| `CRON_SECRET` | 独立测试密钥 | 高强度随机密钥 | 否 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 测试/Preview site key | 正式 site key | 是 |
| `NEXT_PUBLIC_AUDIO_BASE_URL` | 可共用发布路径 | `.../focus-audio/v1.0.0/` | 是 |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | 测试联系人 | 正式客服 | 是 |

## 三、每次更新

`feature branch → Pull Request → Supabase Preview Branch + Vercel Preview → CI/人工验收 → main → Production`

- 数据库改动使用 expand/contract：先新增兼容结构，后发布应用，等旧版退出后再删除。
- 音频和长缓存图片使用新版本目录，不覆盖旧对象。
- 每个 PR 验收海岛、分房、选座、开始计时、释放和本地降级。

## 四、监控与告警

- Vercel：5xx 比例、Function 时延、带宽、构建失败和用量阈值。
- Supabase：数据库 CPU/内存/连接、Auth 错误、Realtime 连接数、Storage 流量、磁盘与配额。
- Vercel Cron 每日调用维护接口，删除 30 天未使用且没有活跃会话的匿名账户；检查 Cron 日志与 `deleted` 计数。
- 日志只记录 request ID、路由、状态码和耗时，不记录 token、cookie、service role key 或完整用户输入。

## 五、备份、恢复与回滚

- 确认 Supabase Pro 日常备份已启用，每季度在隔离项目进行一次恢复演练，记录 RPO/RTO 和校验结果。
- 应用回滚：在 Vercel 将上一稳定 Deployment Promote 回 Production。
- 数据库回滚：不运行破坏性 down migration；提交新的恢复 migration。破坏性变更前先确认备份可恢复。

## 六、故障降级

- Supabase/Auth/API 失败：进入标记为“岛民”的本地房间，不伪造真人。
- Realtime 中断：页面显示重连状态，并以 60 秒完整快照校准；重连成功立即拉取快照。
- 音频失败：计时和座位不受影响，用户可切换无声/环境声。

## 七、v1.0.0 发布门禁

- `npm run check` 和 `supabase test db` 通过。
- 两个独立用户并发抢同座只有一个成功；断线租约自动释放。
- 10 次完整循环、25/50 分钟真实运行、休眠恢复通过。
- Windows Chrome/Edge 与 macOS Chrome/Safari 主流程通过。
- 隐私政策、服务条款、数据删除、客服联系方式已上线。
- 用量/错误告警与备份恢复演练完成。
- 对发布提交打 `v1.0.0` tag，保留上一稳定 Vercel Deployment。

未满足任一项时，只可作 Preview/内部验证，不宣称商业上线完成。
