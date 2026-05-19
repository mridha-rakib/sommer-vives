# Admin, Owner, and Guest Smoke Tests

Use this before final release and again after Lovable publishes.

## Test Accounts

Create or choose three separate Supabase Auth users:

- Admin: has `admin` or `super_admin` in `public.user_roles`; does not also have `owner` or `guest`.
- Owner: has only `owner`.
- Guest: has only `guest`.

Keep credentials in local `.env` or the shell:

```bash
SMOKE_ADMIN_EMAIL=
SMOKE_ADMIN_PASSWORD=
SMOKE_OWNER_EMAIL=
SMOKE_OWNER_PASSWORD=
SMOKE_GUEST_EMAIL=
SMOKE_GUEST_PASSWORD=
```

Do not prefix these with `VITE_`; they are test credentials, not frontend build config.

## Local Gate

```bash
npm run validate:smoke
```

Without credentials, this validates the app's auth guards, role loading, protected route mapping, redirect rules, role migrations, and confirms `DEV_BYPASS_AUTH` is disabled.

With credentials, or when forced with `-- --live`, it also logs into Supabase as each account and verifies role assignment:

```bash
npm run validate:smoke -- --live
```

## Manual Browser Pass

After the app is deployed and credentials are ready:

- Admin can log in at `/admin/auth` and access `/admin`, `/admin/sager`, `/admin/kalender`, `/admin/oekonomi`, `/admin/beskeder`, and `/admin/indstillinger`.
- Owner can log in at `/auth` and access `/owner`, `/owner/listings`, `/owner/bookings`, `/owner/calendar`, `/owner/messages`, `/owner/documents`, `/owner/agreement`, `/owner/payouts`, and `/owner/account`.
- Guest can log in at `/guest/auth` and access `/guest`, `/guest/reservation`, `/guest/property`, `/guest/addons`, `/guest/payment`, and `/guest/messages`.
- Owner and guest accounts cannot access `/admin`.
- Admin and owner accounts cannot access `/guest`.
