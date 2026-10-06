# Chinbilig Jiu-jitsu

Personal BJJ app: walk through a roll node by node on a technique graph, log training, body work, rank, weight and competitions.

Static site, no build step. `index.html` holds the markup and CSS, `app.js` the app, `seed.js` + `meta.js` the starter library (positions → my options → their defenses → my answers, with situations, outcomes, points, energy, gi/no-gi, belt and traps). Data lives in Supabase (`docs` table, paths `bjj/*`) or, when `config.js` is `window.APP_CONFIG={}`, in localStorage.

## Setup

1. Supabase: create a project and run `supabase/schema.sql` (re-run it after updates; it adds the `owner` column and the per-user policies).
2. Authentication → Providers → Email: keep sign-ups **on** so club members can create their own account. Turn off "Confirm email" if you want them signed in right away.
3. Put the project URL and anon key in `config.js`.

Each member's techniques, rolls and logs live under `bjj/u/<uid>/…` and are private. Club data (profile, schedule, members, payments) lives under `club/<id>/…` and is shared with every signed-in member, so only invite people you train with.
3. Vercel: import this repo, framework "Other". Every push to `main` deploys.

## Checks before pushing

Serve locally with `config.js` set to `window.APP_CONFIG={}` and load the page in Playwright at iPhone 13 size: no page errors, no horizontal overflow, inputs stay 16px, motion respects `prefers-reduced-motion`.
