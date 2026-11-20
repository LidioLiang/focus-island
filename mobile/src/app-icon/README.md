# Focus Isle · 海岛蓝计时环

2026-11-20：用户选定海岛蓝方案 01，应用品牌图标使用白色计时环、浅海水蓝棕榈、沙岛和蓝色海面。操作按钮的功能图标不属于品牌图标替换范围。

- `focus-isle-1024.png`：1024 × 1024、RGB、不透明、无文字、无预切圆角的 iOS 主图。
- `../../ios/App/App/Assets.xcassets/AppIcon.appiconset`：当前 iPhone / iPad 工程共用的 AppIcon。系统从 universal 图生成桌面、搜索、设置等尺寸。
- `macos/AppIcon.appiconset`、`macos/FocusIsle.iconset`、`macos/FocusIsle.icns`：16–1024 px 的 macOS 资源。当前尚无独立 macOS App target，这些资源不代表 Mac 应用已经编译、安装或上架。
- 生成来源：image_gen 基于用户已确认方案 01，生成单张方形正式主图；原生成文件保留在项目 `generated_images/exec-a630e2ad-aa3a-4267-915e-5be10aefa556.png`。仅使用 sips 等比输出平台所需尺寸，不重画图案。
- 原 iOS 图标备份：`../../art-drafts/20261120-app-icon/previous-app-icon.png`。

在 mobile 目录执行 `npm run icons:sync` 可重新生成平台资源。`npm run ios:prepare` 已接入此步骤，避免创建原生工程后恢复模板图标。ICNS 直接封装对应 PNG，系统 sips 已识别为 1024 × 1024。
