# Focus Isle 1.3.0 — Account center

## Implemented
- Native English Profile, Sign-in & security, Preferences and Focus history views; Mist Blue palette, dark sidebar text, responsive layout and keyboard focus management.
- User-owned nickname (1–24 characters), four built-in portraits, JPG/PNG/WebP uploads (4 MB input, 16 MP decode limit, server-generated 256px WebP without source metadata), provider photo selection.
- Profile stored server-side for guests and members; local UI hydration, own seat photo updates immediately; room snapshots join current profiles and profile changes broadcast to other room clients. No timer reset when editing a profile.
- Email registration/password sign-in plus Google/Apple/GitHub OAuth code paths: SSR PKCE, fixed callback, allowlisted providers, same-origin initiation, one-time guest history merge. No provider tokens exposed to client scripts.
- Providers queried from live Supabase Auth settings. Disabled providers show “Coming soon”; they cannot initiate a broken redirect. Public provider endpoint exposes only four booleans.
- Saved legacy Chinese preferences cannot switch this English-first MVP back to Chinese. Custom names are user content; their language is preserved. Generated legacy nicknames are displayed in English.

## Verified external configuration and remaining activation
Production Auth settings read on 2026-11-10: email enabled; Google, Apple and GitHub disabled. Code alone cannot create OAuth credentials or sign provider agreements. Do not mark these three methods live until configured and tested with real authorized accounts.

Supabase project: igerdrlvmfrytvsoetuw. Provider callback (register with Google/GitHub/Apple):
`https://igerdrlvmfrytvsoetuw.supabase.co/auth/v1/callback`

Application redirect (add to Supabase Auth URL allowlist):
`https://focus-island-nine.vercel.app/auth/callback`

1. Google: configure a Web OAuth client, authorized origin `https://focus-island-nine.vercel.app`, provider callback above, then enter client ID/secret into Supabase Google provider settings. Publish consent configuration as appropriate.
2. GitHub: create OAuth application with homepage `https://focus-island-nine.vercel.app` and provider callback above, then enter client ID/secret into Supabase GitHub settings.
3. Apple: configure Sign in with Apple Services ID, domain and provider callback above; enter Services ID and generated client secret into Supabase Apple settings. Apple does not supply an avatar. Uploads and built-in portraits remain available. Track secret expiry/rotation through the developer account.
4. Enable each provider only after its credentials are installed. Run a real sign-in, callback, logout and returning-user test per provider. Confirm provider photo reuse for Google/GitHub. Apple uses upload/preset.

Never commit provider secrets, tokens or environment files. Keep developer authorization in app_metadata only.

## Database deployment
Additive migration: `20261110092938_account_profiles_and_avatars.sql`.
Staging generated migration version: 20261110092938. Production may generate a different timestamp for the identical SQL; record rather than blindly repairing older history.
New public bucket `profile-avatars`: public read, no authenticated INSERT/UPDATE policy. Verified server upload uses the service role after raster decoding. Profile changes go through current-user RPCs; direct profile-table access remains revoked.

## Validation
Local lint, TypeScript, build, dependency license checks and 95 Node tests passed before release. Browser and pgTAP regression results are recorded in the release/CI checks. Tests use fixtures; real OAuth consent flows await provider activation.
