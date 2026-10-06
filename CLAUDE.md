# Chinbilig Jiu-jitsu

Static PWA (no build step): `index.html` (markup + CSS), `app.js` (app), `seed.js` and `meta.js`
(starter technique library and its annotations), `config.js` (Supabase URL + anon key),
`supabase/schema.sql`. Deployed by Vercel on every push to `main`. UI text is English;
talk to the user in Mongolian.

Data model: a flat node list (`S.tree.nodes`) of positions (`k: pos`), my moves (`mv`) and
the opponent's defenses (`df`), with path-based ids from the seed (`cg_b.1.1.1`). Moves carry
`when` (situation), `oc` (outcomes with common/rare), `pts`, `energy`, `gi`, `belt`, `bait`,
`kids`, `legal`. Seed changes must append children (ids are index based); bump
`version` in `seed.js` so `mergeSeed` adds them to existing user trees.

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
