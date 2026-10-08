# Arrow V10 changes and verification

Implemented:

- Entire Technique page (including discovery, maps, learning and plans) requires
  personal paid Upgrade; coaches/app admins remain exempt. Training logging is free.
- Join my club wording changed to Join club.
- Club logos appear in directory and club header; coaches/admins crop/upload/remove
  a 128px logo. Club gallery compresses up to 6 gym/team photos; teacher introductions
  include photos, belt, bio and achievements. Public profiles include schedule,
  adult/kids fees, facilities, first-visit details, achievements, social links,
  telephone, website/map and one editable review per eligible member (13+).
- Club names open club profiles. Admin club rows link to the same app profile.
- Complete registered accounts and KYC editing work via server-only Supabase key,
  including accounts outside clubs. Existing passwords cannot be read; reset assigns
  a new password. Typed confirmation guards permanent account deletion. Shared
  profile/feed/relationships are cleaned and payment accounting remains anonymous.
- Coach console has Back to app, member editing, removal and archived-member restore.
- Settings groups account/recovery, appearance/language and technique preferences.
- Signup asks Cyrillic real name and login credentials, without date of birth.
  KYC retains signup name and asks birth year, month, then day plus contacts;
  changing year/month resets the day and respects leap years. Profile/admin editors
  share the ordered DOB picker. Private age remains hidden from public profiles.
- Own feed post actions are behind a top-right three-dot menu.
- Training editing has a month calendar, duration presets and hours/minutes inputs;
  stopped-session duration remains available with exact elapsed time.
- Profiles use Workouts/Leaderboard/Competition/Friends tabs according to visibility;
  club/belt stay visible. Profile edit uses a small icon button. Choose one featured
  medal from recorded achievements, with verified club awards supported.
- Own profile workouts render the exact feed cards; public profiles page 12 visible
  workouts at a time and honor friend/private audiences and hidden sections.
- You segment changes preserve vertical scroll; main-route changes start at top.
  Horizontal menu scroll positions continue to be preserved.

Pending external inputs:

- Login reference arrived and is implemented in V11: Arrow branding, light background,
  rounded fields, password visibility toggle, round remember control, recovery links,
  input-aware primary action and signup link. Face ID is not advertised: implementing
  it needs a separate passkey/WebAuthn authentication feature.
- Production SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY configuration has not
  been confirmed. Full auth-account directory/password/deletion capabilities remain
  unavailable when it is missing; console shows the missing-key notice. Instructions
  are in ADMIN-SETUP.md. Do not put the secret in chat or the frontend.

Validation uses isolated mocked identities/data: 5 Node API suites, V3–V10 mobile
journeys (including 320px/390px layouts, logo/gallery processing, leap-year DOB,
profile medals/tabs, KYC, paid gate, member removal/restore and account reset UI).
No production users, payments, coach roles or reviews are changed by tests.

V11 verifies the active Supabase Auth settings and database endpoint return HTTP 200,
without signing in, registering accounts or changing data. This verifies basic
connectivity, not the production server-only admin key. Vercel project inspection
is still blocked by connector scope 403. Login journeys pass at 320/390/768px.
