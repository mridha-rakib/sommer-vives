# Remaining Project Tasks

Use this checklist one task at a time. Do not mark a task complete until its testing section has passed and any required evidence is captured in the project notes, ticket, or deployment handoff.

## 1. Confirm Production Environment Variables

**Status:** Local validation complete; Lovable verification pending

**Work**
- Confirm Lovable backend secrets contain:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `LOVABLE_API_KEY`
  - `VAPID_SUBJECT`
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `AUTOMATION_RUN_SECRET`
- Confirm frontend/build environment contains:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
  - `VITE_SITE_URL=https://sommervibes.dk`
  - `VITE_ENABLE_COMING_SOON_GATE=false`
  - `VITE_VAPID_PUBLIC_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`

**Testing**
- Rebuild or republish after changing any `VITE_*` value.
- Run `npm run validate:env` locally before building.
- Run `npm run validate:env:backend` in an environment where backend secrets are exported, if available.
- Open the deployed site and confirm the coming-soon gate is not shown.
- Confirm edge function logs do not show missing-secret errors during payment, email, push, or automation tests.

## 2. Stripe Payment Flow

**Status:** Local validation complete; live Stripe test pending

**Work**
- Confirm Stripe key mode is consistent:
  - Test frontend key `pk_test_...` must pair with backend `sk_test_...`.
  - Live frontend key `pk_live_...` must pair with backend `sk_live_...` or a valid restricted live key.
- Confirm Stripe webhook endpoint is configured:
  - `https://jasgxsziqjfrewaautcl.supabase.co/functions/v1/stripe-webhook`
- Confirm webhook events include:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`

**Testing**
- Run `npm run validate:stripe`.
- Create a test booking checkout.
- Pay with Stripe test card `4242 4242 4242 4242` if using test mode.
- Verify Stripe webhook delivery returns `200`.
- Verify the booking/payment status updates in Supabase/admin UI.
- Verify failed/cancelled checkout returns to the app without corrupting booking state.

## 3. Resend Email Sending

**Status:** Local validation complete; live Resend delivery test pending

**Work**
- Verify the sending domain in Resend.
- Confirm DNS records required by Resend are added at the domain provider.
- Set `RESEND_FROM_EMAIL` to a verified domain address, for example `SommerVibes <bookings@sommervibes.dk>`.

**Testing**
- Run `npm run validate:email`.
- Trigger a booking confirmation email.
- Confirm the email is delivered to a real inbox.
- Check spam/promotions folders.
- Confirm Supabase edge function logs show successful Resend response.
- Confirm booking email tracking fields update when applicable.

## 4. Web Push Notifications

**Status:** Local validation complete; live browser push test pending

**Work**
- Generate VAPID keys if not already generated:
  - `npx web-push generate-vapid-keys --json`
- Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` to Lovable secrets.
- Add the same public key to `VITE_VAPID_PUBLIC_KEY`.

**Testing**
- Run `npm run validate:push`.
- Open the app on HTTPS or localhost.
- Log in as a user.
- Grant browser notification permission.
- Confirm a row is created in the `push_subscriptions` table.
- Send a chat message from another role.
- Confirm the recipient receives a push notification when the app is backgrounded.

## 5. Automation Runner

**Status:** Local implementation complete; Lovable secret/live invocation pending

**Work**
- Confirm `AUTOMATION_RUN_SECRET` exists in Lovable secrets.
- Manual admin runner is available from Admin > Automations via `Kør forfaldne`.
- External scheduler or cron can invoke `execute-automations` with `x-automation-secret` for unattended processing.
- Scheduled runner enqueues `checkin_tomorrow` and `checkout_tomorrow` events for confirmed bookings.

**Testing**
- Local verification passed:
  - `npx tsc --noEmit`
  - `npm run build`
  - `npx eslint src/pages/admin/AdminAutomations.tsx`
  - `npx eslint supabase/functions/execute-automations/index.ts`
  - `npm run validate:email`
  - `npm run validate:env`
- Invoke the automation function with the correct secret.
- Verify unauthorized requests are rejected.
- Verify authorized requests process due automation records.
- Confirm any email automation sends successfully through Resend.
- Review edge function logs for failures.

## 6. Beds24 Channel Publishing

**Status:** Local implementation complete; client credentials/live Beds24 publish pending

**Work**
- Get valid Beds24 access from the client.
- Native Beds24 API v2 path is implemented in `supabase/functions/beds24-publish/index.ts`:
  - Upserts Beds24 property/room through `POST /properties`.
  - Syncs grouped calendar price/min-stay ranges through `POST /inventory/rooms/calendar`.
  - Supports `BEDS24_API_TOKEN` or `BEDS24_REFRESH_TOKEN`.
  - Stores `external_property_id`, `external_listing_id`, `beds24_last_publish_payload`, and `beds24_last_response`.
  - Rolls local sync status back and writes audit log entries on failure.
- Custom middleware mode is still supported if needed. Provide:
  - `BEDS24_PUBLISH_URL`
  - `BEDS24_API_TOKEN`
- For native API v2, provide one of:
  - `BEDS24_API_TOKEN`
  - `BEDS24_REFRESH_TOKEN`
- Optional native config:
  - `BEDS24_API_BASE_URL=https://beds24.com/api/v2`
  - `BEDS24_INTEGRATION_MODE=native`

**Testing**
- Local verification:
  - `npm run validate:beds24`
  - `npx eslint supabase/functions/beds24-publish/index.ts scripts/validate-beds24-flow.mjs`
  - `npx tsc --noEmit`
  - `npm run build`
- Run pre-flight validation on a listing with complete data.
- Publish to a test channel or sandbox account if available.
- Confirm `sync_status` becomes `synced`.
- Confirm `beds24_last_response` is stored.
- Confirm failed publish attempts roll back status and save a useful error message.

## 7. Lovable Deployment Sync

**Status:** Local deployment gate complete; Lovable repo connection/publish pending

**Work**
- Local Git remote is `https://github.com/mridha-rakib/sommer-vives.git`; confirm Lovable is connected to this repository.
- Deployment handoff is documented in `docs/lovable-deployment-handoff.md`.
- Local deployment gate is available:
  - `npm run validate:deployment`
- If Lovable created a separate repo, push local code changes there or migrate changes manually.
- If no code changes are needed, do not push; secret/env changes are handled in Lovable Cloud.
- Ensure `.env` remains uncommitted.

**Testing**
- Run `npm run validate:deployment`.
- Run `npm run build` locally before deployment.
- Deploy/publish from Lovable.
- Confirm the deployed app version includes the expected UI and edge function behavior.
- Confirm no secret values appear in GitHub or browser source.

## 8. Domain Connection

**Status:** Local domain configuration complete; Lovable/GoDaddy DNS verification pending

**Work**
- Connect `sommervibes.dk` in Lovable domain settings.
- Add Lovable-provided DNS records in GoDaddy.
- Add `www.sommervibes.dk` if required.
- Remove conflicting DNS records if Lovable verification fails.
- Set `VITE_SITE_URL=https://sommervibes.dk`.
- Local domain defaults now use `https://sommervibes.dk` for:
  - Base HTML social metadata.
  - Runtime SEO canonical/OG fallback.
  - Generated sitemap/robots defaults.
  - Stripe checkout and Connect return URL fallbacks.
- Local domain validation is available:
  - `npm run validate:domain`
  - `npm run validate:domain -- --live` after DNS is configured.

**Testing**
- Local verification:
  - `npm run validate:domain`
  - `npm run validate:deployment`
  - `npx eslint scripts/validate-domain-flow.mjs`
  - `npx tsc --noEmit`
  - `npm run build`
- Confirm Lovable domain verification succeeds.
- Confirm SSL certificate is active.
- Open:
  - `https://sommervibes.dk`
  - `https://www.sommervibes.dk`
- Confirm redirects and canonical links use the production domain.
- Run `npm run build` and confirm generated sitemap contains `https://sommervibes.dk`.

## 9. Admin, Owner, and Guest Smoke Tests

**Status:** Local smoke-test harness complete; live credential/browser pass pending

**Work**
- Added `npm run validate:smoke` to verify route guards, role loading, redirects, role migrations, and `DEV_BYPASS_AUTH=false`.
- Documented smoke credentials in `.env.example` using non-`VITE_` keys so they stay out of the frontend build.
- Added `docs/smoke-test-runbook.md` for final live/browser verification.
- Create or verify separate Supabase Auth test users for:
  - Admin
  - Owner
  - Guest
- Confirm role assignment works without `DEV_BYPASS_AUTH` by running:
  - `npm run validate:smoke`
  - `npm run validate:smoke -- --live` after `SMOKE_ADMIN_*`, `SMOKE_OWNER_*`, and `SMOKE_GUEST_*` credentials are configured locally.

**Testing**
- `npm run validate:smoke`
- Admin can log in and access dashboard, cases, calendar, economy, messages, and settings.
- Owner can log in and access dashboard, listings, bookings, calendar, messages, documents, agreement, payouts, and account.
- Guest can log in and access dashboard, reservation, property guide, add-ons, payment, and messages.
- Unauthorized users are redirected correctly.

## 10. Code Quality Cleanup

**Status:** In progress; non-visual high-risk lint cleanup started; ESLint still failing

**Work**
- Completed non-visual cleanup for:
  - Empty block handling in booking request error parsing.
  - `no-case-declarations` in admin settings.
  - Unnecessary regex escapes in listing content parsing.
  - Empty UI prop interfaces.
  - Unused console lint-disable comments.
  - Tailwind plugin import style.
  - Booking/payment type tightening in booking context and Stripe-related edge functions.
  - Booking-step hook dependency fixes.
  - Selected admin hook dependency fixes.
  - Beds24 admin helper typings.
  - Shared channel mapping typings.
  - Listing editor autosave callback dependency fix.
- Fix existing ESLint/TypeScript issues.
- Prioritize risky issues first:
  - Empty blocks.
  - `no-case-declarations`.
  - Hook dependency warnings in shared flows.
  - Excessive `any` in payment, booking, and admin modules.
- Avoid broad refactors unless needed for correctness.

**Testing**
- Local verification on 2026-05-19:
  - `npx tsc --noEmit` passed.
  - `npm run build` passed.
  - ESLint reduced from 514 problems to 429 problems.
  - Remaining ESLint issues: 380 `@typescript-eslint/no-explicit-any`, 39 `react-hooks/exhaustive-deps`, 10 `react-refresh/only-export-components`.
  - Largest remaining files: `src/pages/admin/AdminSagDetail.tsx`, `src/components/admin/listings/ListingEditorV2.tsx`, `src/pages/admin/AdminOekonomi.tsx`, `src/pages/admin/AdminOpgaver.tsx`.
- Run `npm run lint` after remaining cleanup.
- Smoke test the flows touched by cleanup.

## 11. Final Production Release Check

**Status:** Local validation pass; live production release checks pending

**Work**
- Rotate any keys that were shared in chat, screenshots, or public places.
- Confirm test keys are not used in live production unless intentionally launching in test mode.
- Confirm coming-soon gate is disabled.
- Confirm auth bypass is disabled.
- Confirm Stripe, Resend, push, and automations are using production-safe configuration.

**Testing**
- Local verification on 2026-05-19:
  - `npm run build` passed.
  - `npm run validate:env` passed.
  - `npm run validate:deployment` passed.
  - `npm run validate:domain` passed; live DNS/HTTPS checks still pending.
  - `npm run validate:smoke` passed; live credential/browser pass still pending.
  - `npm run validate:stripe` passed locally; live key-mode check still pending in Lovable.
  - `npm run validate:email` passed locally; live Resend delivery still pending in Lovable.
  - `npm run validate:push` passed locally; live push secret/browser test still pending.
  - `npm run validate:beds24` passed locally; live credentials/publish still pending.
- Complete one end-to-end booking/payment test.
- Complete one email delivery test.
- Complete one chat notification test.
- Complete admin, owner, and guest login tests.
- Review Lovable/Supabase logs after testing and confirm no recurring errors.
