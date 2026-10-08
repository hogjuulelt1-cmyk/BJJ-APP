# Arrow Jiu-jitsu

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
the tab bar checks in at the club (with shortcuts for log training, roll, drills, share), and You holds the
profile with the personal sections. Feed posts are club docs at `club/<id>/feed/<yyyy-mm>`.

## Club QR at the door

Coaches open Club → "Club QR for the door" and print the poster once. Members tap the orange button in the
middle of the tab bar: the camera opens, they point it at the QR and today's attendance is marked
(works on iPhone and Android; the club code printed under the QR can be typed instead). A person who is not a member
yet joins the club first; someone without an account creates one with a plain username and lands
checked in.

## Language

The app and the console open in Mongolian. Settings → Language (or the button in the console sidebar) switches to English. Strings live in `lang-mn.js`: exact text in `dict`, text with numbers or names in `rules`. Technique, position and drill names come from the `en` field of the data.

## Arrow update

Profiles have a photo, real name, social username and mandatory private birth date.
Under-13 members see private training without Feed, Leaderboard or Friends. Coaches can set
belts and see encrypted member ages after the member completes their profile.
Live counters support unnamed techniques, and sharing has a Done button.
Club schedules separate children, adults and open mats, with calendar markers.
Notices have unread badges and optional browser notifications while the app is open.
Background push is not configured.

Smoke check (requires Python Playwright and Chromium): serve this directory on port 8080,
then run `python tests/arrow-smoke.py`. The test uses isolated local fixtures.

### Mobile training and membership refresh

Finish training has a totals summary, optional details and Public/Friends/Only me
posting choices. Sharing provides three BJJ story frames, one photo picker and two
export actions. Edit forms use the current mobile design and retain 50px photo cropping.
Under-16 schedules and fees are separate; coaches alone edit belts in the app.
Basic onboarding keeps contact details encrypted for coaches. Member payment requests
use the date tapped and exact plan amount, with coach approval and day-based coverage.
Coach notifications work while the app is open.

### Unified feed and training controls

One timeline combines club-public and accepted-friend training, with audience icons and
posted times. It fetches 12 posts per page through `/api/feed`, appending on scroll;
Supabase's legacy monthly docs stay on the server during feed browsing. This endpoint
requires the member JWT, preserves encrypted friends payloads, and adds no dependencies
or schema migration. `config.js` provides the same public Supabase configuration to the
browser and Node function. Deploy the repository to Vercel to enable this endpoint;
plain static hosting supports local mode but does not run the cloud-feed API.
Suggested member cards open searchable Discover. A sticky profile/menu header and six
type cards are shared with refreshed start/finish controls. Run `node tests/feed-api.test.js`
and the fixture-based Playwright `tests/arrow-v4-smoke.py` for pagination and UI checks.

Coaches have an active, fee-exempt membership based on the club's registered coach IDs.
QR/typed-code check-in is available from 60 minutes before a scheduled class through
40 minutes after its start, using the club's time zone (Ulaanbaatar by default).
The cloud endpoint validates server time and uses conditional writes for concurrent scans.
Personal training is always available and is independent of club attendance. Attendance
cards open named details on demand; coaches can correct the roster there.
