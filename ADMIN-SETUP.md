# Arrow admin setup

Open https://arrowbjjapp.vercel.app/admin and sign in with the app admin account.
The trusted initial admin is listed in `config.js`. Coaches continue to use the same
console and see their own club pages.

## Enable the complete registered-account directory

1. Open the **same Supabase project used by config.js** → Project Settings → API Keys.
2. Find a backend Secret key (or the legacy service_role key).
3. Vercel → `arrow_bjj_app` → Settings → Environment Variables → Production:
   add **SUPABASE_SECRET_KEY** for a Secret key, or **SUPABASE_SERVICE_ROLE_KEY** for
   the legacy service_role key. Use one variable. Do not prefix it with NEXT_PUBLIC.
4. Redeploy the current Production deployment. In the console choose Refresh,
   then Registered users.

Never put this key in chat, config.js, GitHub, frontend files, screenshots or logs.
If these credentials are missing, the console explicitly displays only the linked
club-account directory. It does not claim to list all Supabase users. Club editing
and coach management still work for a trusted admin using their ordinary JWT.

Additional global admins can be listed in server-side **ARROW_ADMIN_EMAILS**, separated
by commas. Add verified, existing account emails. The client-editable app/config
admin list is never accepted as authorization by the new management API.

## What the console provides

- Registered users: 50 accounts per page, registration/last-login dates, search on
  the current page, CSV export of that page/filter. No club membership required.
- Edit account: real name, social username, birth date, phone, address, social link,
  bio. Login email/alias stays unchanged. Private settings and auth metadata are
  updated, and linked club records get the age group and social restrictions.
- Link an existing account to a club, then grant coach status through Coaches.
  Accounts already linked to another club cannot be silently moved.
- Edit club: name, city/address, contact, coach display name, status, separate kids
  and adult fees, bank details. Schedules, QR codes and membership history persist.
- Coaches: grant/revoke, explicit checkbox confirmation, linked-account validation,
  and protection against removing the last coach. Coach fees remain exempt.
- Deactivate/restore clubs. Deactivation removes a club from the discovery index,
  retaining its historical data. It is not a permanent deletion or account ban.
- Change history: last 100 management operations, actor/time/target IDs. Does not
  log passwords or private profile values. Without a backend key only your own
  audit entries are available.

New coaches register their private age/profile key when opening the app/console.
Members refresh encrypted contact/age access when they open the updated app.
Revoking a coach stops future recipient access; previously viewed data cannot be
unseen. Global admins edit canonical private settings through the backend key,
without exposing social or coach private crypto keys to the browser.

## Implementation limits

All new `/api/admin` requests verify the canonical Supabase user and the trusted
server allowlist. All privileged credentials stay in the function. Client data is
whitelisted; private cryptographic keys are never returned. Club/private-profile
writes use `updated_at` compare-and-set, returning conflicts instead of overwriting
another editor. Multiple document/auth writes are not a database transaction;
partial updates return visible warnings and may need a retry.

The existing Supabase docs RLS still permits broad signed-in access to shared club
rows. Protecting this API does not close older direct REST write paths. Full
role-integrity enforcement needs a separately applied RLS/database migration and
moving legacy role/code-claim writes to trusted endpoints. Do not describe the
current implementation as a complete security migration.

The backend key is inherently powerful. Treat it as server-only and rotate it if
it is ever exposed. Test files mock all users and writes; they do not alter live
Supabase accounts, coach roles or payment records.

## V10 account lifecycle and membership controls

The complete registered-user directory, full KYC editor, password reset and permanent
account deletion all require the server-only Supabase key described above. Existing
passwords are hashes and cannot be viewed. Reset supplies a new password without
placing it in audit entries. Account deletion requires typing DELETE, blocks the
current admin and last coach, cleans private docs/public posts/relationships and
anonymizes retained payment history. Multi-document cleanup can return a conflict;
the account is only removed after shared cleanup succeeds. Retry after refreshing.

Coaches can remove members through Members and restore them from Removed members.
This only removes club membership; it preserves private accounts and training/payment
history. An active coach role must be revoked before membership can be removed.
The app checks removal markers before refreshing membership, preventing an old
stored clubId from automatically adding the person back. Club public media/reviews
use /api/club with canonical caller identity and club-role checks.
