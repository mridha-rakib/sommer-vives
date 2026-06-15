/**
 * Applies the admin_calendar_events table migration to the remote Supabase project.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-calendar-migration.mjs
 *
 * Get your access token at: https://supabase.com/dashboard/account/tokens
 */

import { existsSync, readFileSync } from 'node:fs';

function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadDotEnv();

const PROJECT_REF = process.env.VITE_SUPABASE_PROJECT_ID || 'jasgxsziqjfrewaautcl';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('\n❌ SUPABASE_ACCESS_TOKEN not set.');
  console.error('   Get your token at: https://supabase.com/dashboard/account/tokens');
  console.error('   Then run:  SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-calendar-migration.mjs\n');
  process.exit(1);
}

const SQL = `
-- Admin-only calendar events: meetings, visits, tasks, reminders
DO $$
BEGIN

  -- Create table if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_calendar_events'
  ) THEN

    CREATE TABLE public.admin_calendar_events (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type   TEXT        NOT NULL CHECK (event_type IN ('meeting', 'visit', 'task', 'reminder', 'udlejningstjek', 'lead_followup')),
      title        TEXT        NOT NULL,
      event_date   DATE        NOT NULL,
      event_time   TIME,
      contact_name TEXT,
      notes        TEXT,
      created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_admin_calendar_events_date
      ON public.admin_calendar_events (event_date);

    CREATE INDEX idx_admin_calendar_events_type
      ON public.admin_calendar_events (event_type);

    ALTER TABLE public.admin_calendar_events ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "admin_calendar_events_admin_all"
      ON public.admin_calendar_events
      FOR ALL
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::user_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

    RAISE NOTICE 'admin_calendar_events table created successfully.';
  ELSE
    -- Table exists — make sure the CHECK constraint includes all 6 types
    -- (drop old 4-type constraint if present and add the 6-type version)
    IF EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage
      WHERE table_schema = 'public'
        AND table_name = 'admin_calendar_events'
        AND constraint_name LIKE '%event_type%check%'
    ) THEN
      ALTER TABLE public.admin_calendar_events
        DROP CONSTRAINT IF EXISTS admin_calendar_events_event_type_check;
    END IF;

    ALTER TABLE public.admin_calendar_events
      ADD CONSTRAINT admin_calendar_events_event_type_check
      CHECK (event_type IN ('meeting', 'visit', 'task', 'reminder', 'udlejningstjek', 'lead_followup'));

    RAISE NOTICE 'admin_calendar_events constraint updated to 6 types.';
  END IF;

END $$;

-- Idempotent trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_admin_calendar_events()
RETURNS TRIGGER LANGUAGE plpgsql AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$;

DROP TRIGGER IF EXISTS trg_admin_calendar_events_updated_at ON public.admin_calendar_events;
CREATE TRIGGER trg_admin_calendar_events_updated_at
  BEFORE UPDATE ON public.admin_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_admin_calendar_events();
`;

async function run() {
  console.log(`\n🚀 Applying admin_calendar_events migration to project: ${PROJECT_REF}\n`);

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('❌ Migration failed:', JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  if (body?.length) {
    body.forEach(row => {
      if (row?.NOTICE || row?.notice) console.log('   ℹ️', row.NOTICE || row.notice);
    });
  }
  console.log('\n   The admin_calendar_events table is now ready.\n');
}

run().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
