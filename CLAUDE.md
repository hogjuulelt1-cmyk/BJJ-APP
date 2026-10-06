# Chinbilig Jiu-jitsu

Static PWA (no build step), used by a whole club: `index.html` (markup + CSS), `app.js` (app), `seed.js` and `meta.js`
(starter technique library and its annotations), `config.js` (Supabase URL + anon key),
`supabase/schema.sql`. Deployed by Vercel on every push to `main`. UI text is English;
talk to the user in Mongolian.

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
Tabs: Technique, Train (Log | Drills | Body), Club (Today | Schedule | Members | Pay), Me
(Rank | Weight | Compete).

`admin.html` + `admin.js` is the desktop admin console (same Supabase session; only admin emails
get in): overview, clubs, members, payments, upgrades, settings. It reads every `club/*` doc
with one list call. Vercel's cleanUrls serves it at `/admin`.

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
