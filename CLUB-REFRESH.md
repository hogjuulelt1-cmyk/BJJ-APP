# Club and feed refresh — V12

- Feed retains existing post nodes and stops repeated pagination cursors, including
  equivalent cursors with different JSON key order. Profile feeds use the same guard.
- Club starts with collapsed club information and one membership status card.
  Coach edit, codes and QR controls are inside the expanded information section.
  Next class / Classes this week / Members summary tiles are removed.
- Menu: Schedule, Members, Payments, Open mats, Competition and Notices.
  Notices appear when present; coaches can access the menu to create notices.
- Schedule includes Today with Training day / No training, today's attendance count
  (tap for names), streak, training calendar with attendance/missed days, and an
  ordered weekly schedule filtered to the member's age group. Old My month is removed.
- Training partners and mat time are in Members. Open mats have an independent menu.
  Competition has Upcoming / Past. Upcoming club competitions also appear in You
  Compete and the own-profile Competition tab.
- Same-page section changes preserve vertical scroll in Club, Profile, Home,
  Technique and You; changing pages starts at the top. Horizontal menus retain their
  positions. The browser clamps scroll when the replacement content is shorter.
- Public club profiles show a seven-day schedule and large coach photo cards with
  name, belt and achievements. Club coaches appear automatically. Linked club
  members can open their member profile; other viewers see a public introduction,
  preserving member-only and under-13 restrictions.
- Wrong-password feedback appears immediately above the login action and is focused
  into view. Coach console tables become labelled cards on phones; edit forms fit
  320px screens, with Back and collapsed account/club information controls.
- Horizontal overscroll and app-content edge swipes are contained. A website cannot
  guarantee disabling browser-owned Safari back/forward gestures; standalone mode
  uses the existing app manifest.

Validation: five Node API suites; feed repeated-cursor/DOM identity browser test;
Club journeys at 320/390px; mobile coach console and account management; login at
320/390/768px; training/payment/attendance regressions. Fixtures only: no production
users, training records, roles or payments are changed by tests.
