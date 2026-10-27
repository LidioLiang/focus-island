export const metadata = { title: "隐私政策 · 专注岛" };

export default function PrivacyPage() {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "请通过产品页面公布的客服方式联系";
  return <main className="legal-page"><article>
    <a href="/">← 返回专注岛</a><h1>隐私政策</h1><p className="legal-meta">生效日期：2026 年 10 月 27 日</p>
    <p>专注岛为提供匿名账户、在线房间、座位租约和运行安全，会处理匿名用户 ID、昵称、角色选择、房间/座位状态、心跳时间、IP 风控信号以及必要的请求日志。本地专注记录和偏好默认保存在浏览器中。</p>
    <h2>用途与法律基础</h2><p>上述数据仅用于提供核心服务、防止滥用、排查故障和履行法定义务；不出售个人数据。</p>
    <h2>处理者与跨境</h2><p>应用由 Vercel 托管，身份、数据库、实时和存储由 Supabase 提供，生产数据库区域为新加坡。访问者数据可能因服务提供者网络和安全处理发生跨境传输。</p>
    <h2>保留与删除</h2><p>座位租约在断线后短时自动过期。用户可在“个人中心 → 账户与数据”删除云端账户与本地数据。安全日志可按运维所需保留有限时间。</p>
    <h2>联系</h2><p>{support}</p>
  </article></main>;
}
