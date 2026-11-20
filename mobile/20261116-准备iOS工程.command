#!/bin/zsh
# Run from Finder/Terminal on the user's Mac. No deployment, upload, signing or device installation.
set -euo pipefail
cd -- "${0:A:h}"

function on_exit() {
  local result=$?
  if (( result != 0 )); then
    print -r -- ""
    print -r -- "准备未完成，退出码：$result。请保留上面的错误信息。"
  fi
  if [[ -t 0 ]]; then read -r "?按回车关闭此窗口…" || true; fi
}
trap on_exit EXIT

print -r -- "Focus Isle iOS：安装依赖 → 检查资源 → 生成工程 → 打开 Xcode"
print -r -- "当前为内部离线预览，不会上传 App Store 或修改线上网站。"
command -v node >/dev/null
command -v npm >/dev/null
xcodebuild -version
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("需要 Node.js 22 或更新版本"); process.exit(1); }'
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
npm test
npm run ios:prepare
npm run ios:open
print -r -- "工程已打开。请在 Xcode 选择正确的签名 Team，再连接 iPhone 运行。"
