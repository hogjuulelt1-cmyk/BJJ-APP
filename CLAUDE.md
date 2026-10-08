# Chinbilig Jiu-jitsu

Static PWA (no build step), used by a whole club: `index.html` (markup + CSS), `app.js` (app), `seed.js` and `meta.js`
(starter technique library and its annotations), `config.js` (Supabase URL + anon key),
`supabase/schema.sql`. Deployed by Vercel on every push to `main`. UI text is written in English in the code and shown in Mongolian by default: `lang-mn.js` holds
the dictionary and rules, `I18N` (app.js and admin.js) translates text nodes, placeholders and
aria-labels in the DOM through a MutationObserver; technique and drill names use the data's `en`
(Mongolian) field via `dn()`. Settings → Language switches to English. Add new UI strings to
the dictionary. Talk to the user in Mongolian.

Data model: a flat node list (`S.tree.nodes`) of positions (`k: pos`), my moves (`mv`) and
the opponent's defenses (`df`), with path-based ids from the seed (`cg_b.1.1.1`). Moves carry
`when` (situation), `oc` (outcomes with common/rare), `pts`, `energy`, `gi`, `belt`, `bait`,
`kids`, `legal`. Seed changes must append children (ids are index based); bump
`version` in `seed.js` so `mergeSeed` adds them to existing user trees. A submission with no
written defenses gets generic ones at flatten time (`<id>.dfx` loops back to the position,
`<id>.esc` lands in `ESC_TO[pos]`), so a roll only ends on "Tap!". Defenses may carry `to`
(where the opponent lands). Positions carry `them` (what the opponent is doing).

Setups (`S.plans.setups`) are user-built chains position → move → reaction → … → submission;
a roll started from one (`UI.roll.plan`) stars the next planned node on the graph. The Setups
tab also finds routes between two positions (`findRoutes`, edges = moves whose outcome is
another position) and the Learn tab quizzes on the tree with spaced repetition
(`S.settings.learn.cards`, card ids `when:|ans:|land:|key:` + node id).

Accounts: every member signs up themselves (Supabase email auth). Personal docs are stored at
`bjj/u/<uid>/<key>` (private by RLS); legacy `bjj/<key>` rows are adopted on first load. Club docs
(`clubs/index`, `club/<id>/profile|members|pay/<uid>`) are shared; `CLUB` holds the loaded club,
`S.settings.clubId` the membership, `profile.admins` the coaches. Clubs carry `status`
(pending until an app admin approves), `code` (members join with it) and `coachCode` (claims
coach rights); seeded clubs from `seed.js` `clubs` are `open` until claimed. Payments are
`pending` when a member taps “I have paid” and `ok` once a coach confirms. App admins
(`CFG.admins` emails or `app/config.admins`) approve clubs and upgrade requests (`app/upgrades`
→ `app/pro.u[uid].until`). `unlocked()` gates Setups/Learn/Plans/History: coach, confirmed
monthly fee, upgrade, or app admin. Local mode keeps club docs in localStorage and counts
as app admin. Club docs also hold `att/<yyyy-mm>` (attendance, keyed by uid or roster id), `results`
(medals awaiting coach approval), `notes` (notices), `events` (competition calendar). `rolls/<yyyy-mm>` holds who rolled with whom (from the training log's `with`). Members in
`members.list` carry `id` (roster), `uid` (linked account or null), `coachSet` (coach's belt wins).
`IAP` wraps a Capacitor/RevenueCat or `window.IAP` purchase bridge; without one the upgrade sheet
falls back to a transfer. Drills: `SEED.drills` (kind solo|partner|sub|td|esc|flow, `tech` names link to moves by name) plus
the user's own in `S.body.drills`; a done drill is a `S.body.items` row with `cat: "drill"`.
Tabs (Strava-like, orange accent): Home (club feed), Technique, a round Check-in button in the
middle (camera scanner, see below), Club (Today | Schedule |
Members | Pay), You (`profileHead` + scrollable segments Log | Drills | Body | Rank | Weight |
Compete; `TAB_ALIAS` maps the old `train` tab and segment ids to `me`). The feed lives in
`club/<id>/feed/<yyyy-mm>` (`feedPost` on every saved training: minutes, rounds, techniques, the
day's roll path, streak, `kudos` uids); `clubLoad` reads this and last month, `feedKudos` toggles 👊.
Without a club the Home tab shows the user's own sessions.
Club QR (`qr.js`, own encoder, byte mode/level M/versions 1-9): one permanent code per club, printed at
the door. A coach or app admin opens Club → "Club QR for the door" (`qrSheet`: QR, club code, poster via
`qrImage`, copy, share). Link `<app>?checkin=<clubId>&c=<club code>` (`?join=…` joins only). Boot keeps
the parsed pair in localStorage `bjj-join` and strips it from the URL; the sign-in screen opens in sign-up
mode with a banner, and `joinPending()` (after the club loaded) joins a non-member and then calls
`checkinWith(code)` → `attMark(today)`. The middle tab button ("Check in", `checkinSheet(true)`)
opens the camera at once and scans the QR (`BarcodeDetector`, else `vendor/jsQR.js` loaded on demand);
the club code can be typed instead, and the sheet carries quick buttons for log training, roll, drills
and share (`rec-go`).

Technique tab segments (scrollable): Roll | Mine (N) | Discover | Setups | Learn | Plans | History.
Discover (`vDiscover`, `DISC_CATS`) lists distinct technique names per category (move type, plus guard
and top positions) with a "+" that adds every node of that name to `S.settings.mine`; Mine (`vMine`)
shows that list grouped by category; `vNode` has the "+ Add to mine" pill. You tab segments: Progress |
Log | Drills | Body | Rank | Weight | Compete. Progress (`VIEWS.prog`) = training calendar (`UI.calYm`),
analytics (`UI.anaRange` month|30|all), weekly `CHALLENGES` (snapshot `S.settings.mineWeek`, share flag
`S.settings.sharedWk`) and `ACHIEVEMENTS`; XP (`xpTotal`) and level (`levelOf`, 300 XP per level) show in
`profileHead`. Seed v6 added 14 positions (reverse DLR, lasso, 50/50, deep half, Z, rubber, worm, ashi
garami, north-south top/bottom, front headlock, crucifix, under knee on belly, under scarf hold) and ~90
moves (leg locks carry `kids:false` + `legal`).

Header: avatar button (`data-act="profile"` → `VIEWS.profile`, the social profile page with `UI.prevTab` for
Back; `profileSheet(uid)` for a teammate, opened from feed avatars via `member-profile`), centred title with
the belt bar, ☰ `menuSheet()` (profile, progress, club, technique map, belt, share, language toggle, settings,
coach console, sign out). Settings no longer has backup/restore. Home segments: Feed | Leaderboard
(`vLeaderboard`, aggregates `CLUB.feed` by uid: `UI.leadBy` sessions|min|rounds|subs|kudos|streak,
`UI.leadPer` month|all, tied ranks). Members list shows coaches a payment pill per member (`payState`:
pending → confirm, overdue red, expiring ≤7 days amber, paid green) with Expiring/Overdue filters. Share
card has `SHARE.fmt` post (1080×1350) | story (1080×1920, Instagram-safe margins); `SHARE.blob` is cached
after every draw so `navigator.share` runs inside the tap (iOS), and the QR poster does the same
(`QR_IMG`). Chip rows (`data-group`) highlight the tapped chip via `(el.parentElement||el).closest`.

Live training (`S.settings.live`: t0, type, rolls, subs/taps/tech names): "Start training" button on Home
and You → Log (`liveCard`), counters with pickers (`livePickSheet`, `data-pk="live-*"`), Finish →
`sessSheet(null, prefill)` → save clears it and opens the share card in story format
(`shareSheet(id, "story")`). Profile photo: `S.settings.avatar` (50px JPEG data URL), mirrored to the
member record `av` and feed posts `av`; `avatarHtml(name, av, cls, attrs)` renders it everywhere.
Club plans: `P.plans` `[{id, n, months, price, kind}]` (defaults from `fee` via `clubPlans`), plan cards on
the Pay tab (`UI.payPlan`), a payment creates one `pay` item per covered month sharing a `group`
(`confirmPay` confirms the group; drop-ins carry `drop:true` and never count as a month); bank details
(`payHow`) sit on the Pay tab with a copy button. The check-in sheet has no shortcut row any more.
`vercel.json` sends `x-vercel-skip-toolbar: 1` so previews show no Vercel overlay.

`admin.html` + `admin.js` is the desktop console (same Supabase session). App admins see every
club (overview, clubs, members, payments, competitions, upgrades, settings); a coach (in a club's
`profile.admins`) sees their club only. Members can be created with a login: a username becomes
`<username>@<CFG.memberDomain>` (default `member.bjjclub.mn`) via `/auth/v1/signup`, the returned
session is ignored; the app's sign-in accepts a bare username the same way. Member records may
carry `comp` (competition team). Vercel's cleanUrls serves the console at `/admin`.

Streaks (`streaks()`): consecutive weeks with a trained day, scheduled class days attended in a
row, and days in a row; a trained day is a logged session, a done drill or a club check-in. The
share card (`shareSheet`/`drawShare`) draws a 1080×1350 canvas: photo or mat, session numbers,
the day's roll path (or the week's dots), the belt and the streak; it opens after a training is
saved and from the Log card, and uses the Web Share API with a PNG download fallback.

## Skills

| Task | Skill |
| --- | --- |
| Motion, gestures, mobile feel | `apple-design` |
| New screens, visual changes | `frontend-design`, `ui-ux-pro-max` |
| Checking in a browser | `webapp-testing` |
| Deploy questions | `deploy-to-vercel` |

## Checks before pushing

- Serve with `window.APP_CONFIG={}` and run Playwright at iPhone 13 size, light and dark:
  no page errors, no horizontal overflow, inputs 16px.

## Arrow identity and privacy

`arrow-core.js` supplies age validation and RSA-OAEP helpers to both clients. `settings.birthDate`
is private; never put plaintext birth dates or numeric ages in shared club docs. Coaches register
public keys in `profile.ageKeys`; private keys stay in their personal `settings.coachAgeKeys`.
Members seal birth dates separately for each coach in `member.ageSealed`; coach age is decrypted
only in memory. A member must open the app after a new coach registers a key to share their age.
The underlying shared-club RLS remains unchanged; age restrictions hide social UI and skip feed
loads for under-13 members, not a replacement for backend authorization.

`settings.name` is the real Unicode name; `settings.username` is the social handle.
Social eligibility requires a valid birth date and age >=13. Friends live in `club/<id>/friends`.
Notices use a header badge and unread IDs in personal `settings.noticeSeen`; visible pages poll
every 30 seconds. Browser notifications require permission and an open app. No background push.
Live + counters permit unspecified names; the adjacent picker names an unspecified count first.
Schedules carry `group: kids|adult|all`; calendar dots show kids, adults and open mats.

Sheet save/delete handlers await asynchronous writes and keep failed validation open.
The smoke script in `tests/arrow-smoke.py` uses local fixtures with config.js intercepted.

Profile photos use `profile-photo.js`: drag/keyboard positioning and zoom in the profile editor, exporting only a 50×50 JPEG. Source files and share-frame photos stay in the browser.

## Arrow mobile update

Personal schedules, attendance misses and fees use age <16 as kids, >=16 as adults;
all-age/open-mat sessions remain visible. Coaches see all schedules for editing.
Fee defaults are `fee.month/drop` (adult) and `fee.kidsMonth/kidsDrop` (kids); custom
plans carry `group: kids|adult|all`. `periodEnd` clamps calendar-month boundaries.
New payments store `start/end/months` and remain pending until coach approval. Members
cannot choose payment dates or amounts. Coaches record/approve from member sheets.
Legacy month-based payments still work. Pending payments appear in coach notices
and are polled every 30 seconds while the app is visible (no background push).

Member onboarding requires real name, username, birth date, phone and home address;
social address is optional. Phone/address stay in private settings and encrypted
`member.privateProfile` envelopes for registered coach keys. Console reads them only
for coaches with the matching private key.

Sessions store `audience: public|friends|private`. Public means club feed, not a global
unauthenticated feed. Friends posts use AES-GCM payloads with RSA-wrapped keys for the
author and accepted friends whose social public keys are registered. `settings.socialKey`
is owner-private and `member.socialPublicKey` is public. Recipients need to complete
onboarding/open the updated app first. Private sessions never publish to the feed.
Underlying shared club-row RLS is unchanged: client coach controls are not backend
authorization; do not describe them as a server-enforced permission boundary.

`share-frame.js` draws three original BJJ frames with 9:16/4:5 exports. Share photos
remain local. Routine sync/loading status UI is removed; persistence and error handling
remain active. Tests: `arrow-smoke.py`, `arrow-v3-smoke.py` and `arrow-admin-smoke.py`
(the admin test mocks all Supabase requests and never changes production data).

### Unified timeline (October 2026)

The home screen has one feed; public club posts and decryptable accepted-friend posts
appear together. Audience icons and local posted date/time belong to each card.
`feed-page.js` shares ordering and stable snapshot/boundary cursors with `api/feed.js`.
The authenticated Node Vercel function returns at most 12 posts per response. It forwards
the caller JWT to Supabase, verifies club membership/social eligibility, and uses no
service-role credentials. Existing monthly storage stays compatible: the server reads
bounded monthly docs, the browser receives pages only. Month names are queried without
post bodies. Local fixtures use the same page helper. No schema migration is required.
Do not reinstate eager feed-doc reads in `clubLoad` or break encrypted friends envelopes.

The IntersectionObserver appends pages without rebuilding the whole main view; errors
require retry. The profile/menu header stays sticky. Suggested people lead to a searchable
Discover sheet instead of a separate friends tab. The start/finish screens share six
accessible type cards, effort and audience radio choices; finish counters allow unnamed
submission/tap/technique counts with optional details. Keep CLAUDE.md under this name.
Verification adds `tests/feed-api.test.js` and `tests/arrow-v4-smoke.py` (fixtures only).

### Coach membership and scheduled check-in

Club `profile.admins` determines coach status: coaches are active without fee records in
both app and console, and receive no self-payment prompt. Menu symbols are inline SVG.
Attendance cards show counts first; a sheet shows attendee names and coach corrections.
Saving a personal session never writes club attendance. QR and typed-code scans both use
`api/check-in.js` in cloud mode and the shared `check-in.js` gate in local fixtures.
The window is inclusive from class start minus 60 minutes through start plus 40 minutes;
only the member's age track/all-age open mats count (coaches can attend any group).
Club wall-clock time defaults to `Asia/Ulaanbaatar`; `profile.timezone` can override it.
Adjacent-day checks support classes near midnight and attribute attendance to class date.
The API uses server time, caller JWT, member DOB, and the club code, with conditional
`updated_at` writes to protect concurrent scans. Repeat scans are idempotent. Existing
Supabase shared-doc RLS is unchanged; this is the updated scan flow, not a migration
restricting all legacy clients' direct writes. Coaches retain explicit manual corrections.
Tests: `check-in-api.test.js` and `arrow-v5-smoke.py`; Playwright static fixture routing can
run browser tests without a local HTTP server (Chromium still needs socket permissions).
