# Chinbilig Jiu-jitsu

Personal BJJ app: walk through a roll node by node on a technique graph, log training, body work, rank, weight and competitions.

Static site, no build step. `index.html` holds the markup and CSS, `app.js` the app, `seed.js` + `meta.js` the starter library (positions → my options → their defenses → my answers, with situations, outcomes, points, energy, gi/no-gi, belt and traps). Data lives in Supabase (`docs` table, paths `bjj/*`) or, when `config.js` is `window.APP_CONFIG={}`, in localStorage.

## Setup

1. Supabase: create a project and run `supabase/schema.sql` (re-run it after updates; it adds the `owner` column and the per-user policies).
2. Authentication → Providers → Email: keep sign-ups **on** so club members can create their own account. Turn off "Confirm email" if you want them signed in right away.
3. Put the project URL and anon key in `config.js`.

Set `admins` in `config.js` to the emails that approve new clubs and upgrade requests. Clubs from `seed.js` are created on first load, open to join until a coach claims them with the coach code (visible to app admins under Club → App admin → Club codes).

Each member's techniques, rolls and logs live under `bjj/u/<uid>/…` and are private. Club data (profile, schedule, members, payments) lives under `club/<id>/…` and is shared with every signed-in member, so only invite people you train with.
3. Vercel: import this repo, framework "Other". Every push to `main` deploys.

## Checks before pushing

Serve locally with `config.js` set to `window.APP_CONFIG={}` and load the page in Playwright at iPhone 13 size: no page errors, no horizontal overflow, inputs stay 16px, motion respects `prefers-reduced-motion`.

## Coach & admin console

Open `/admin` (the `admin.html` page) on a computer and sign in with your app account. A coach sees their own club: members with belt, time at belt against the IBJJF minimum, paid-until, attendance, medals and login status; fee logging and confirmation; competition results and the competition team; upcoming competitions. An app admin (`config.js` → `admins`) sees every club plus approvals, upgrades and settings.

Coaches and admins can add a member together with a login: give a username and a password and the member signs in to the app with just that username (it is stored as `username@member.bjjclub.mn`; change the domain with `memberDomain` in `config.js`). This needs sign-ups enabled and “Confirm email” off in Supabase.

## Store subscriptions

On the web the upgrade is paid by transfer and approved by an app admin. To sell it through the
App Store and Google Play, wrap the site with Capacitor and add RevenueCat (`@revenuecat/purchases-capacitor`):
the app detects `window.Capacitor.Plugins.Purchases` and shows "Subscribe with App Store / Google Play".
Create a product `bjj.pro.month` with an entitlement named `pro` (the product id can be changed in
`app/config.pro.product`). Any other wrapper can expose `window.IAP = { buy(productId) → Promise<{ until: "YYYY-MM" }> }`.

## Coaches

Coaches add members before they have an account (name, email, belt, stripes). When that person signs
up with the same email and joins with the club code, the two records link and the coach's belt becomes
the member's belt. Attendance comes from the member's check-in, their logged training, or the coach's
attendance list; medals a member records wait for the coach's approval.

## Home feed and the Record button

The layout follows Strava: Home shows the club feed (one card per teammate's training with minutes,
rounds, techniques, the day's roll path and the streak; 👊 kudos), the orange button in the middle of
the tab bar records (log training, start a roll, check in, do a drill, share), and You holds the
profile with the personal sections. Feed posts are club docs at `club/<id>/feed/<yyyy-mm>`.

## Join by QR

Coaches open Club → "Join QR for members" and show or print the code (Save image makes a poster).
A member scans it with the phone camera, creates an account (a plain username works) and lands in
the club. The link is `<app>?join=<clubId>&c=<club code>`; a closed club needs the right code, which
the QR already carries.

## Language

The app and the console open in Mongolian. Settings → Language (or the button in the console sidebar) switches to English. Strings live in `lang-mn.js`: exact text in `dict`, text with numbers or names in `rules`. Technique, position and drill names come from the `en` field of the data.
