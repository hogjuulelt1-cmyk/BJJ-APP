# Chinbilig Jiu-jitsu

Personal BJJ app: walk through a roll node by node on a technique graph, log training, body work, rank, weight and competitions.

Static site, no build step. `index.html` holds the markup and CSS, `app.js` the app, `seed.js` + `meta.js` the starter library (positions → my options → their defenses → my answers, with situations, outcomes, points, energy, gi/no-gi, belt and traps). Data lives in Supabase (`docs` table, paths `bjj/*`) or, when `config.js` is `window.APP_CONFIG={}`, in localStorage.

## Setup

1. Supabase: create a project (or reuse the diary's), run `supabase/schema.sql`, turn off public sign-ups, add the user.
2. Put the project URL and anon key in `config.js`. Optional: `diary: true` mirrors sessions and the belt into the Chinbilig diary docs (same project only); `diaryUrl` shows a link to the diary in the header.
3. Vercel: import this repo, framework "Other". Every push to `main` deploys.

## Checks before pushing

Serve locally with `config.js` set to `window.APP_CONFIG={}` and load the page in Playwright at iPhone 13 size: no page errors, no horizontal overflow, inputs stay 16px, motion respects `prefers-reduced-motion`.
