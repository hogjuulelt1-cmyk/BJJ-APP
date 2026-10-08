"""Defer real app requests to verify splash and layout placeholders through completion."""
import json
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
from static_fixture import install
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844});install(c);c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 settings={'name':'Бат','username':'bat','birthDate':'1990-01-01','phone':'99112233','address':'District address','clubId':'test','seeded':True,'seedVer':999,'theme':'dark'}
 docs={'bjj/u/me/settings':settings,'clubs/index':{'list':[{'id':'test','n':'Test Club'}]},'club/test/profile':{'id':'test','n':'Test Club','admins':[],'schedule':[]},'club/test/members':{'list':[{'uid':'me','username':'bat','socialAllowed':True,'belt':'white'},{'uid':'peer','username':'peer','socialAllowed':True,'belt':'blue'}]}}
 held=[];pending={}
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://fixture.supabase.co",supabaseAnonKey:"fixture"};',content_type='application/javascript'))
 def sb(r):
  if r.request.method in ['POST','PATCH']:r.fulfill(json=[]);return
  q=parse_qs(urlparse(r.request.url).query);path=q.get('path',[''])[0]
  if path.startswith('like.bjj/u/me/') and not held:held.append(r);return
  out=[{'path':k,'data':v} for k,v in docs.items() if k.startswith(path[5:].rstrip('*'))] if path.startswith('like.') else ([{'data':docs[path[3:]]}] if path[3:] in docs else [])
  r.fulfill(json=out)
 c.route('https://fixture.supabase.co/**',sb)
 c.route('**/api/feed?**',lambda r:r.fulfill(json={'posts':[{'id':'post','uid':'peer','d':'2026-10-08','type':'gi','min':60,'rounds':2,'audience':'public','t':1791440000000}],'next':None}))
 def community(r):
  action=parse_qs(urlparse(r.request.url).query)['action'][0]
  if action in ['profile','leaderboard']:pending[action]=r
  else:r.fulfill(json={'ok':True})
 c.route('**/api/community?**',community)
 c.add_init_script('localStorage.setItem("cb-sb-session",JSON.stringify({uid:"me",email:"fixture@example.com",access:"fixture",refresh:"fixture",exp:Date.now()+3600000}));localStorage.setItem("bjj-lang","en");')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/',wait_until='domcontentloaded');page.wait_for_selector('#boot-splash')
 assert page.locator('#boot-splash strong').inner_text()=='ARROW BJJ';assert page.locator('#boot-splash').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(0, 0, 0)';assert page.locator('#boot-splash').evaluate('(e)=>getComputedStyle(e).color')=='rgb(255, 255, 255)'
 page.wait_for_timeout(100);assert held;held[0].fulfill(json=[{'path':k,'data':v} for k,v in docs.items() if k.startswith('bjj/u/me/')]);page.wait_for_selector('.feed');assert page.locator('#boot-splash').count()==0
 page.locator('.feed .av[data-uid="peer"]').click();page.wait_for_selector('.skeleton-profile');assert 'Loading' not in page.locator('#main').inner_text();assert page.locator('.skeleton-line').first.evaluate('(e)=>getComputedStyle(e,"::after").animationName')=='skeleton-sweep';page.screenshot(path='/tmp/arrow-v9-profile-skeleton.png');pending['profile'].fulfill(json={'profile':{'uid':'peer','username':'peer','av':'','club':'Test Club','belt':'blue','stripes':2,'show':{'workouts':False,'scores':False,'competition':False,'friends':False}}});page.wait_for_selector('.profile-club');assert page.locator('.layout-skeleton').count()==0;assert 'blue' in page.locator('.public-belt').inner_text().lower();assert 'Test Club' in page.locator('.profile-club').inner_text();assert page.locator('.profile-score,.profile-friends').count()==0
 page.locator('[data-act="profile-back"]').click();page.locator('[data-act="homeseg"][data-v="lead"]').click();page.wait_for_selector('.layout-skeleton');page.wait_for_timeout(100);assert 'leaderboard' in pending;page.screenshot(path='/tmp/arrow-v9-leaderboard-skeleton.png');pending['leaderboard'].fulfill(json={'rows':[{'uid':'peer','n':'@peer','av':'','belt':'blue','sessions':35,'min':2100,'rounds':70,'subs':0,'kudos':0,'streak':4}]});page.wait_for_selector('.llist');assert page.locator('.lrow .val b').inner_text()=='35';assert page.locator('.layout-skeleton').count()==0
 assert not errors,errors;b.close()
print('PASS V9 black/white splash, real pending requests, profile/leaderboard skeleton shimmer, completion and hidden-field layouts')
