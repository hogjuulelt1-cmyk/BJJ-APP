"""Mobile UI and paged browser requests; all account/data APIs are fixtures."""
import json,os
from datetime import date
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
ym=date.today().isoformat()[:7]
settings={'name':'Бат-Эрдэнэ','username':'bat','birthDate':'1990-02-01','phone':'99112233','address':'Ulaanbaatar district 1','clubId':'test','theme':'dark','seeded':True,'seedVer':999}
posts=[{'id':f'p{i}','uid':'peer','n':'Дорж','d':date.today().isoformat(),'t':1700000000000-i*1000,'type':'gi','min':60,'rounds':3,'audience':'public','kudos':[]} for i in range(35)]
store={'bjj/u/local/settings':settings,'clubs/index':{'seeded':True,'list':[{'id':'test','n':'Test Club','status':'approved'}]},'club/test/profile':{'id':'test','n':'Test Club','admins':['peer'],'schedule':[]},'club/test/members':{'list':[{'id':'me','uid':'local','username':'bat','n':'Бат','socialAllowed':True,'belt':'white','track':'adult'},{'id':'peer','uid':'peer','username':'dorj','n':'Дорж','socialAllowed':True},{'id':'teen','uid':'teen','username':'teen','n':'Тэмүүжин','socialAllowed':True},{'id':'kid','uid':'kid','username':'kid','n':'Хүүхэд','socialAllowed':False}]},'club/test/feed/'+ym:{'list':posts},'club/test/friends':{'list':[]}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(**p.devices['iPhone 13']);c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://fixture.supabase.co",supabaseAnonKey:"fixture"};',content_type='application/javascript'))
 requests=[];api=[];fail=[False]
 def supabase(route):
  u=urlparse(route.request.url);q=parse_qs(u.query);method=route.request.method;requests.append(route.request.url)
  if method=='POST':
   data=json.loads(route.request.post_data);store[data['path']]=data['data'];route.fulfill(status=201,body='');return
  path=q.get('path',[''])[0]
  if path.startswith('eq.'):
   key=path[3:];out=[{'data':store[key]}] if key in store else []
  else:
   prefix=path[5:].rstrip('*');out=[{'path':k,'data':v} for k,v in store.items() if k.startswith(prefix)]
  route.fulfill(json=out)
 c.route('https://fixture.supabase.co/**',supabase)
 def feed(route):
  q=parse_qs(urlparse(route.request.url).query);cursor=json.loads(q.get('cursor',['{}'])[0]);offset=cursor.get('offset',0);api.append(offset)
  assert route.request.headers['authorization']=='Bearer fixture-token'
  if fail[0]:route.fulfill(status=502,json={'error':'Fixture failure'});return
  chunk=posts[offset:offset+12];n=offset+12
  route.fulfill(json={'posts':chunk,'next':{'offset':n} if n<len(posts) else None})
 c.route('**/api/feed?**',feed)
 c.add_init_script('''localStorage.setItem('cb-sb-session',JSON.stringify({uid:'local',email:'fixture@member.bjjclub.mn',access:'fixture-token',refresh:'fixture',exp:Date.now()+3600000}));localStorage.setItem('bjj-lang','en');''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('ARROW_TEST_URL','http://127.0.0.1:8094/'));page.wait_for_selector('.feed');page.wait_for_timeout(500)
 assert len(api)==1 and page.locator('.feed').count()==12,(api,page.locator('.feed').count())
 assert not any('/feed/' in u for u in requests),'Browser must not download monthly docs on opening'
 assert page.locator('[data-act="homeseg"]').count()==0
 assert page.locator('.post-audience').count()==12 and page.locator('.post-time').count()==12
 assert page.locator('[data-act="discover"]').count()==1
 page.screenshot(path='/tmp/arrow-v4-feed.png',full_page=False)
 top=page.locator('header.top').bounding_box()['y'];page.locator('#feed-tail').scroll_into_view_if_needed();page.wait_for_function('document.querySelectorAll(".feed").length===24');assert len(api)==2
 assert abs(page.locator('header.top').bounding_box()['y']-top)<2,'Profile/menu header must remain stationary'
 # Failed pages expose a deliberate retry without automatic request storms.
 fail[0]=True;page.locator('#feed-tail').scroll_into_view_if_needed();page.wait_for_selector('[data-act="feed-more"]:text("Try again")');n=len(api);page.wait_for_timeout(300);assert len(api)==n
 fail[0]=False;page.locator('[data-act="feed-more"]').click();page.wait_for_function('document.querySelectorAll(".feed").length===35')
 assert page.locator('.feed-end').count()==1
 assert len(set(page.locator('.feed').evaluate_all('(es)=>es.map(e=>e.dataset.postId)')))==35
 page.evaluate('scrollTo(0,0)');page.locator('[data-act="discover"]').click();page.locator('#discover-search').fill('dorj');assert page.locator('.discover-row').count()==1
 page.locator('#discover-search').fill('kid');assert page.locator('.discover-row').count()==0,'Under-13 members excluded'
 page.locator('#discover-search').fill('');page.locator('#sheet-body [data-act="arrow-friend"][data-uid="peer"]').click();page.wait_for_selector('.discover-sheet.open');assert 'Request sent' in page.locator('#discover-people').inner_text();page.locator('#sheet-body [data-act="sheet-close"]').click()
 page.locator('[data-act="live-start"]').click();assert page.locator('.training-option').count()==6 and page.locator('#sheet-body p').count()==0
 for kind in ['gi','nogi','open','priv','drill','comp']:
  page.locator(f'.training-option[data-v="{kind}"]').click();assert page.locator(f'.training-option[data-v="{kind}"]').get_attribute('aria-checked')=='true';assert page.locator('.training-option[aria-checked="true"]').count()==1
 page.screenshot(path='/tmp/arrow-v4-start.png',full_page=False)
 page.locator('[data-act="sheet-save"]').click();page.locator('[data-act="live-finish"]').click()
 assert page.locator('.training-option[data-v="comp"]').get_attribute('aria-checked')=='true'
 page.locator('[data-act="session-step"][data-target="f-min"][data-step="5"]').click();assert page.locator('#f-min').input_value()=='10'
 page.locator('[data-act="session-count"][data-k="subs"][data-step="1"]').click();page.locator('[data-act="session-count"][data-k="subs"][data-step="1"]').click();assert page.locator('#finish-count-subs').inner_text()=='2'
 page.locator('[data-act="pick"][data-group="rpe"][data-v="4"]').click();page.locator('[data-act="pick"][data-group="audience"][data-v="private"]').click()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#sheet').evaluate('(e)=>e.scrollTop=0');page.screenshot(path='/tmp/arrow-v4-finish.png',full_page=False)
 page.locator('[data-act="sheet-save"]').click();page.wait_for_timeout(1100)
 rec=store['bjj/u/local/log']['items'][0];assert rec['type']=='comp' and rec['min']==10 and rec['rpe']==4 and rec['audience']=='private' and rec['subs'][0]['c']==2
 assert not errors,errors
 print('PASS V4: browser pages only 12 posts, one feed, timestamps/icons, sticky header, scroll pagination/retry/no duplicates, discovery, six training types, finish controls and persistence')
 b.close()
