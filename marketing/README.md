# Focus Isle 多页面官网

2026-11-19。基于已有官网样稿升级，参考 Stakks 的产品介绍、体验入口、专题内容与转化结构。原创英文文案，复用 Focus Isle 现有品牌图和场景图片。

正式项目集成：仓库根目录运行 npm run build 会自动生成官网，官网在 /，原软件在 /app。客服邮箱 support@nisoniy.com。下文是这个目录的独立预览方式；正式发布请使用仓库根目录的既有 Next.js / Vercel 项目，不需另迁应用域名。

## 预览

需要 Node.js，无第三方依赖。在本目录运行：

```sh
npm run build
npm run check
npm run dev
```

浏览器打开 http://127.0.0.1:8770 。多页面路径需要 HTTP 服务，请勿直接双击 dist/index.html。

## 页面

| 路径 | 内容 |
| --- | --- |
| / | 产品首页、互动场景与计时、功能、使用步骤、FAQ |
| /pricing/ | 免费基础咖啡厅说明、未来方案、已有订阅说明 |
| /spaces/ | 场景目录 |
| /spaces/virtual-cafe/ | 咖啡厅专页与预览 |
| /spaces/virtual-library/ | 图书馆专页与预览 |
| /spaces/forest/ | 森林专页与预览 |
| /tools/pomodoro-timer/ | 可用的 25/50 分钟专注与 5 分钟休息计时 |
| /blog/ | 博客目录 |
| /blog/start-a-focus-session/ | 开始专注文章 |
| /blog/choose-your-focus-space/ | 环境选择文章 |
| /blog/25-minute-focus-ritual/ | 25 分钟专注文章 |
| /contact/ | 联系与支持 |

每页有静态正文、独立标题和描述、canonical、Open Graph、Twitter Card、JSON-LD；不需要运行 JavaScript 才能阅读。博客不是弹窗。包含真实 404 页面、robots.txt 和 sitemap.xml。

## 应用入口和生产发布

预览默认将所有 Start focusing 按钮连接到现有 https://focusisle.online/ ，场景预览不会擅自把不存在的深链接参数传给软件。计时器不写入应用历史，无音频自动播放，不采集分析数据。计时器使用时间戳，后台重新可见时校准，刷新页面重置。

当前使用 preview 模式：禁止索引，以免未完成的价格与支持信息进入搜索。正式部署应将官网放在 focusisle.online，而应用先迁移并验证到 app.focusisle.online 或 /app/。迁移须核对 OAuth 回调、会话、Cookie、本地历史、静态资源和支付返回路径；本项目没有执行迁移或修改生产配置。

正式构建环境变量示例（应用新地址需先真实可用）：

```text
SITE_MODE=production
SITE_ORIGIN=https://focusisle.online
APP_URL=https://app.focusisle.online/
SUPPORT_EMAIL=已验证可收信的邮箱
```

生产构建会拒绝官网与应用入口相同，以及客服邮箱空缺的配置。配置后才输出 index,follow 和允许抓取的 robots。请复核实际邮箱、应用/法律页地址和当前价格。价格依据本地 2026-11-10 版应用条款：基础咖啡厅可免费重复使用，注册可选；没有沿用历史付费金额，也未新增收款。

Vercel 配置已提供：构建 npm run build，输出 dist。生产发布前，完成域名和应用入口衔接，然后提交 sitemap 到 Search Console。具备 SEO 基础不代表保证收录或排名。

## 维护

- build.mjs：页面结构、场景和文章数据、元信息。
- src/base.css 和 src/extra.css：布局与移动端样式。
- src/site.js：导航、场景切换和计时器。
- public/assets：场景图和品牌图，构建复制至 dist。
- check.mjs：全站内部链接、资源、锚点、正文结构和 JS 检查。

新增博客文章时，在 articles 中增加一条数据，重新构建即可生成独立页面并更新博客目录与 sitemap。
