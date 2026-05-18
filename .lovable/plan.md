# Production readiness — missing secrets & hardening

## 1. Add missing secrets
Request via the secrets UI (you'll paste values in a secure form):

- **`STRIPE_WEBHOOK_SECRET`** — from Stripe Dashboard → Developers → Webhooks → your endpoint → "Signing secret" (`whsec_...`)
- **`VAPID_PUBLIC_KEY`** + **`VAPID_PRIVATE_KEY`** — generate with `npx web-push generate-vapid-keys` (or I can generate them server-side in an edge function)
- **`BEDS24_LONG_LIFE_TOKEN`** (or `BEDS24_REFRESH_TOKEN` + `BEDS24_API_KEY`, depending on Beds24 v2 auth flow) — from Beds24 → Settings → Account → API

## 2. Wire Stripe webhook signature verification
Update `supabase/functions/stripe-webhook/index.ts` and `handle-payment-webhook/index.ts`:
- Read raw body with `await req.text()` (not `.json()`)
- Verify with `stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET)`
- Return 400 on signature mismatch
- Ensure both functions have `verify_jwt = false` in `supabase/config.toml` (webhooks come from Stripe, no user JWT)

## 3. Lock down `property-ai-recommendations`
- Remove `verify_jwt = false` override from `supabase/config.toml` (let it default to verified), OR keep the override and validate the JWT in code using `supabase.auth.getClaims(token)`
- Reject requests without a valid authenticated user → prevents anonymous cost abuse
- Also recommend doing the same audit on `improve-listing-text` and `calculate-price` if those should be authenticated

## 4. Final pre-publish checks (no code change, just verification)
- `DEV_BYPASS_AUTH = false` ✅ already correct — confirm before publish
- Confirm `RESEND_FROM_EMAIL` uses a verified domain in Resend
- Confirm Stripe is in **live mode** key (not `sk_test_...`) when going to production
- Run the Security scan from the Cloud → Security view after changes

## Out of scope (mention only)
- Database RLS audit — recommend running the built-in Security scan; not part of this change
- Custom domain / DNS — `sommervibes.dk` is already attached

---

After you approve, I'll:
1. Trigger the secret-input dialogs for the 4 secrets above
2. Once filled, patch the two webhook functions + the AI function + `config.toml`
3. Tell you to run the Security scan and publish
