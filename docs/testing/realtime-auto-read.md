# Test plan — Realtime auto-mark-as-read

This document describes how to manually verify that messages arriving via
Supabase Realtime while an admin has a thread open are automatically set
to `is_read = true` in the database, and that the UI/badges stay
consistent.

The scenarios below rely on the dev-only structured logger
(`src/lib/devLog.ts`) used in `src/pages/admin/AdminBeskeder.tsx`. Logs
are no-ops in production.

## Log scopes

When running the app in dev mode, open the browser console and filter by
the bracketed scope:

| Scope                | What it covers                                                |
|----------------------|---------------------------------------------------------------|
| `[chat:realtime]`    | INSERT / UPDATE / DELETE deltas from `chat_messages`          |
| `[chat:auto-read]`   | The auto-mark-as-read flow (trigger, success, retries, fail)  |

A healthy realtime auto-read cycle looks like:

```
[chat:realtime]  INSERT { id, thread_id, sender_type:'owner', is_read:false, openThread:'<id>' }
[chat:auto-read] auto-trigger { threadId, reason:'thread open or new realtime message arrived', unread:1 }
[chat:auto-read] start { threadId, trigger:'auto', count:1, ids:[...] }
[chat:auto-read] success { threadId, trigger:'auto', count:1, durationMs:<n> }
[chat:realtime]  UPDATE { id, is_read:true }
```

The trailing `UPDATE … is_read:true` event proves the row was actually
flipped in Postgres (and pushed back via realtime) — not just patched in
local state.

## Test cases

### TC-1 — New message in the currently open thread

**Setup**

1. Sign in as admin in tab A → open `/admin/beskeder` → click any thread.
2. Sign in as the corresponding owner / guest in tab B (or use an
   incognito window).

**Steps**

1. From tab B, send a new message in that conversation.
2. In tab A, observe the drawer instantly rendering the new bubble.

**Expected**

- Tab A console shows the log sequence above ending with
  `[chat:auto-read] success`.
- The drawer header briefly shows the green **"Alle læst"** chip.
- The sidebar **"Beskeder"** badge does **not** increase.
- DB check (SQL):
  ```sql
  SELECT id, is_read FROM chat_messages
  WHERE id = '<new message id>';
  -- is_read must be true
  ```

### TC-2 — New message in a different (non-open) thread

**Setup**: Same as TC-1, but in tab A select a *different* thread before
tab B sends.

**Expected**

- `[chat:realtime] INSERT` is logged with `openThread` ≠ the new
  message's thread.
- **No** `[chat:auto-read]` log fires.
- Sidebar badge increments by 1 (or the affected thread becomes
  highlighted as unread).
- The unread message stays `is_read = false` in DB.

### TC-3 — Admin sends a reply

**Steps**: From tab A, type a reply and send.

**Expected**

- `[chat:realtime] INSERT` with `sender_type:'admin'`, `is_read:false`.
- **No** auto-mark fires (admin's own messages are filtered out).
- Sidebar badge unchanged.

### TC-4 — Manual "Markér som læst" button

**Setup**: Open a thread that has unread messages without auto-read
(disable network briefly to simulate, or pre-seed unread rows directly
in DB).

**Steps**: Click the **"Markér som læst (N)"** button in the drawer
header.

**Expected**

- `[chat:auto-read] start { trigger:'manual', count:N }`
- `[chat:auto-read] success { trigger:'manual', durationMs:<n> }`
- Toast "N beskeder markeret som læst" + green chip.
- Button becomes disabled and label loses the count.

### TC-5 — RLS denies the update

**Setup**: Temporarily revoke the admin role on the test user (or run
the page as a non-admin) and trigger TC-1.

**Expected**

- Up to 3 attempts with `[chat:auto-read]` warnings logged.
- Eventually a `failed after retries` warn line + an error toast
  ("Kunne ikke markere alle beskeder som læst …").
- Local state rolls back so the badge correctly shows the unread count
  again.

### TC-6 — Burst of incoming messages

**Steps**: From tab B, send 5+ messages rapidly while tab A has the
thread open.

**Expected**

- One `[chat:realtime] INSERT` per message.
- The auto-read effect coalesces — fewer than 5 `[chat:auto-read] start`
  entries — because multiple inserts can land in the same render batch.
- Final state: every new row's `is_read = true`, badge = 0 for that
  thread.

## Verifying from the database

To cross-check on a quiet test instance:

```sql
-- All currently unread messages routed to this admin
SELECT id, thread_id, sender_type, is_read, created_at
FROM chat_messages
WHERE is_read = false AND sender_type <> 'admin'
ORDER BY created_at DESC
LIMIT 50;

-- Distinct unread-thread count (matches the sidebar badge)
SELECT count_unread_admin_threads();
```

If the badge in the UI does not match `count_unread_admin_threads()`,
something is wrong — start by collecting `[chat:auto-read]` warn/error
lines from the affected session.
