# Lovable Deployment Handoff

Use this when moving local changes into the Lovable-connected project.

## Repository Sync

- Local Git remote currently points to `https://github.com/mridha-rakib/sommer-vives.git`.
- Confirm Lovable is connected to this same repository before publishing.
- If Lovable uses a separate generated repository, push or migrate the local changes there instead.
- Do not commit `.env`; it is ignored and must stay local.
- Commit `.env.example`, `public/sitemap.xml`, `public/og/**`, Supabase functions, migrations, and scripts when they are part of the release.

## Local Gate

Run these before handing off or publishing:

```bash
npm run validate:deployment
npm run validate:env
npm run validate:stripe
npm run validate:email
npm run validate:push
npm run validate:beds24
npm run validate:domain
npm run validate:smoke
npm run build
```

`validate:deployment` checks repo/env hygiene, generated SEO assets, Supabase function config, GitHub remote presence, and obvious backend-secret leaks.
`validate:domain` checks production URL defaults, sitemap/robots/canonical inputs, Stripe return URL fallbacks, and stale Lovable-domain references. After DNS is configured, run `npm run validate:domain -- --live`.
`validate:smoke` checks portal route guards and role wiring. Add local `SMOKE_ADMIN_*`, `SMOKE_OWNER_*`, and `SMOKE_GUEST_*` credentials, then run `npm run validate:smoke -- --live` before release.

## Lovable Cloud Values

Frontend/build environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SITE_URL=https://sommervibes.dk`
- `VITE_ENABLE_COMING_SOON_GATE=false`
- `VITE_VAPID_PUBLIC_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

Backend secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `LOVABLE_API_KEY`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `AUTOMATION_RUN_SECRET`
- `BEDS24_API_TOKEN` or `BEDS24_REFRESH_TOKEN` when Beds24 live publishing is enabled

## Publish Check

After Lovable publishes:

- Confirm the coming-soon gate is hidden.
- Confirm `https://sommervibes.dk/sitemap.xml` uses the production domain.
- Confirm `https://www.sommervibes.dk` redirects or serves the same production app.
- Confirm admin, owner, and guest protected routes load correctly after login.
- Exercise one deployed edge-function path for payments, email, push, automation, and Beds24 if credentials are available.
- Review Supabase function logs for missing-secret or authorization errors.
