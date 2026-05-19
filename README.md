# SommerVibes

SommerVibes is a Vite/React app backed by Supabase. It includes the public listing site, owner portal, guest portal, admin workspace, and Supabase Edge Functions for booking, pricing, payments, sync, messaging, and notifications.

## Local Development

```sh
npm install
npm run dev
```

## Validation

```sh
npm run build
npm run lint
```

The build also generates SEO assets before and after Vite runs.

## Environment

Frontend variables are loaded from `.env`:

```sh
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_VAPID_PUBLIC_KEY=
VITE_ENABLE_COMING_SOON_GATE=true # optional preview gate
```

Supabase Edge Functions also require deployed secrets for production behavior, including Stripe, Resend, Beds24, VAPID, and Supabase service credentials.

## Supabase

Database changes live in `supabase/migrations`.

Edge Functions live in `supabase/functions`. Important payment callbacks are configured in `supabase/config.toml` with `verify_jwt = false` where external services must call them directly.

## Release Notes

Before releasing, confirm:

- `npm run build` passes.
- Required Supabase secrets are set.
- Stripe webhook endpoint points to the active payment webhook.
- Public preview gate/auth bypass settings are intentional for the target environment.
