export const metadata = { title: "Privacy Policy · Focus Isle" };
export default function PrivacyPage() {
 const support=process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
 return <main className="legal-page"><article>
  <a href="/">← Back to Focus Isle</a><h1>Privacy Policy</h1><p className="legal-meta">Effective November 10, 2026</p>
  <p>Focus Isle uses an anonymous user ID, display name, avatar choice, room and seat state, heartbeat timestamps, focus session records, IP-based abuse signals and necessary request logs to operate online rooms. Browser storage keeps local preferences and focus history. Optional accounts also process the email and account information you provide.</p>
  <h2>Why we process data</h2><p>We process these data to provide the service, keep seats accurate, restore your sessions, manage existing purchases and prevent abuse. We do not sell your focus history or provide behavioral advertising.</p>
  <h2>Service providers</h2><p>Vercel hosts the web application and Supabase provides identity, database, storage and real-time services. Existing billing uses Stripe. These providers process necessary data under their own terms. Services may process data outside your country.</p>
  <h2>Retention and your choices</h2><p>Seat leases expire after disconnection. Anonymous identities may be removed after extended inactivity; clearing browser storage can also remove access to an anonymous identity. Optional sign-in is available for account continuity. You can manage or delete your account and local records under Settings → Account &amp; data. Necessary security logs may be retained for operational purposes.</p>
  <h2>Contact</h2><p>{support || 'Use the support contact published with the product’s release information.'}</p>
 </article></main>;
}
