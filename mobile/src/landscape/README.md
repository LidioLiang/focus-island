# 2026-11-18 iPhone 横屏扩图

## 新增图书馆与森林（ios-alpha.4）

本次新增 10 张横向扩图，均为 2048 × 768，原始生成文件留在项目根 generated_images。沿用原图观看方向、完整垂直构图与氛围；AI 生成有局部细节重绘，不保证逐像素一致。每张只使用一层完整画面，无原图叠加、镜像拼接或重复背景。

| App 文件 | 原生成文件 |
| --- | --- |
| library-room.png | exec-ed866076-4d5c-407e-892e-52d6c4efcec4.png |
| library-window.png | exec-6320d1c3-1408-4c62-9364-7d006ebb0128.png |
| library-reading.png | exec-b85c9ebd-6d5c-460b-997b-6435ec60780b.png |
| library-alcove.png | exec-2121a131-e78c-4598-a39e-ce067f8ab005.png |
| forest-room.png | exec-b288950d-4313-4d55-89a1-9549cd154b91.png |
| forest-root.png | exec-0e91e526-6899-4bd3-bc30-f6edc01109ff.png |
| forest-deep.png | exec-a9a1d302-9a2c-4a58-8cd5-1603cab33742.png |
| forest-fern.png | exec-5e2dc314-b2a1-4f1a-8d29-0fe377a1c853.png |
| forest-sun.png | exec-69060ece-91fe-493f-baf9-9580a0116da6.png |
| forest-mist.png | exec-65fb663b-80d2-4fad-a8fe-d56b9be7e757.png |

mobile.css 将两房间的画布宽度与画高设为 8:3，按钮/占座头像共用新坐标，八个 focus 图片及结束页通过同一映射显示扩图。适用宽高比仍为 1672/941 至 8/3，较窄平板保持原布局。

已在 Chrome 844 × 390 检查两个房间及全部八个桌景的满屏、选座及切换；932 × 430 两房间按钮边界均在屏内，1024 × 768 回退 content: normal。修复森林 room-hint 与 Solo room 重叠并复查。Node 检查 10/10；同步 iOS 后全部 70 个资源哈希及 17 张扩图尺寸一致。未连接到手机，未完成本版安装或真机视觉验收。

## 先前咖啡厅适配（ios-alpha.3）

七张 PNG 使用 image_gen 基于现有咖啡厅/窗景资产扩图，尺寸 2048 × 768。原生成文件在项目根 generated_images 中保留。

此前草稿验收失败的对象是“原图叠在扩图中间”的合成方案，存在重复灯具和边缘断层。当前采用单张完整扩图，在 mobile.css 中替换对应 img 的渲染内容，不再叠加原图或模糊背景；保留观看角度与完整垂直画面，按屏宽只裁两侧扩展区域。生成过程重绘了局部细节，不是原图逐像素无损扩展。

咖啡厅六个按钮与头像共用按完整扩图重新校准的位置。规则仅作用于宽高比 1672/941 至 8/3 的横屏窗口，较窄的 iPad 窗口保留原图及原坐标。场景切换和结束页均复用相同映射；隐藏的雨后窗景也包含在包内。

浏览器实测：844 × 390 下咖啡厅及五个可选窗景均满屏、无叠加重影；完成选座进入专注、切换全部可选窗景、返回房间。932 × 430 下六个座位点击区域均在屏内，1024 × 768 保持原图回退。Node 检查 10/10 通过。此项记录不代表真机视觉或 App Store 验收。
