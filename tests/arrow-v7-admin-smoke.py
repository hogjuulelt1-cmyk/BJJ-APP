import json,fnmatch
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
from static_fixture import install
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':1280,'height':900});install(c)
 docs={'app/config':{},'clubs/index':{'list':[{'id':'test','n':'Test Club','status':'approved'}]},'club/test/profile':{'id':'test','n':'Test Club','admins':['coach'],'status':'approved','code':'CODE','coachCode':'SECRET','fee':{'month':100000,'kidsMonth':50000},'schedule':[{'d':1,'t':'18:00'}]},'club/test/members':{'list':[{'id':'c','uid':'coach','n':'Коуч','username':'coach','track':'adult','belt':'white'},{'id':'p','uid':'peer','n':'Дорж','username':'dorj','track':'adult','belt':'white'}]}}
 versions={k:'v1' for k in docs};audit=[];calls=[];ready=True
 users=[{'id':'peer','name':'Дорж','username':'dorj','email':'dorj@member.bjjclub.mn','createdAt':'2026-01-01T12:00:00Z','lastSignIn':'2026-10-01T12:00:00Z'},{'id':'free','name':'Сул','username':'freeuser','email':'free@example.com'}]
 def management(r):
  nonlocal_dummy=None
  q=parse_qs(urlparse(r.request.url).query);data=r.request.post_data_json if r.request.method=='POST' else {};action=data.get('action') or q.get('action',[''])[0];calls.append((action,data));result={};status=200
  if action=='capabilities':result={'admin':True,'accountsReady':ready,'auditScope':'all' if ready else 'own'}
  elif action=='users':result={'users':users,'page':int(q.get('page',['1'])[0]),'hasMore':False}
  elif action=='user':result={'id':'peer','email':'dorj@member.bjjclub.mn','version':'v1','profile':{'name':'Дорж','username':'dorj','birthDate':'2000-01-01','phone':'99112233','address':'Баянгол','socialAddress':'@dorj','bio':''}}
  elif action=='user-update':result={'ok':True};users[0].update(name=data['profile']['name'])
  elif action=='audit':result={'list':audit,'scope':'all' if ready else 'own'}
  elif action=='club-update':
   x=docs['club/test/profile'];x.update({k:v for k,v in data['profile'].items() if k not in ['month','kidsMonth','drop']});x['fee'].update({k:int(data['profile'][k]) for k in ['month','kidsMonth','drop']});versions['club/test/profile']='v2';result={'ok':True}
  elif action=='coach-change':
   x=docs['club/test/profile'];ids=x['admins'];who=data['uid']
   if not data['grant'] and len(ids)==1:status=400;result={'error':'Сүүлчийн коучийг хасах боломжгүй.'}
   elif data['grant']:x['admins']=list(dict.fromkeys(ids+[who]));result={'ok':True}
   else:x['admins']=[i for i in ids if i!=who];result={'ok':True}
  elif action=='user-link':docs['club/test/members']['list'].append({'id':'f','uid':data['id'],'n':'Сул','username':'freeuser','belt':'white'});result={'ok':True}
  if r.request.method=='POST' and status==200:audit.append({'action':action,'target':data.get('club',data.get('id')),'actor':'admin','at':'2026-10-08T10:00:00Z','grant':data.get('grant')})
  r.fulfill(status=status,json=result)
 def api(r):
  q=parse_qs(urlparse(r.request.url).query);path=q.get('path',[''])[0]
  if r.request.method=='POST':v=r.request.post_data_json;docs[v['path']]=v['data'];r.fulfill(status=201,body='');return
  rows=[{'path':k,'data':v,'updated_at':versions.get(k,'v1')} for k,v in docs.items() if (path.startswith('eq.') and k==path[3:]) or (path.startswith('like.') and fnmatch.fnmatchcase(k,path[5:]))];r.fulfill(json=rows)
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://sb.fixture",supabaseAnonKey:"test",admins:["admin@example.com"]};',content_type='application/javascript'))
 c.route('https://sb.fixture/**',api);c.route('**/api/admin**',management);c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.add_init_script('if(!localStorage.getItem("cb-sb-session")){localStorage.setItem("cb-sb-session",JSON.stringify({uid:"admin",email:"admin@example.com",access:"test",exp:Date.now()+3600000}));}localStorage.setItem("bjj-lang","en");')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/admin.html');page.wait_for_selector('[data-page="users"]')
 def nav(v):page.locator('[data-page="'+v+'"]').click();page.wait_for_timeout(150)
 def action(v,extra=''):page.locator('[data-act="'+v+'"]'+extra).first.click();page.wait_for_timeout(150)
 def submit():page.locator('.modal button[type="submit"]').click();page.wait_for_timeout(250)
 nav('users');assert 'free@example.com' in page.locator('main').inner_text();assert '10/1/2026' in page.locator('main').inner_text();assert page.locator('[data-act="users-page"][data-v="1"]').is_disabled()
 action('account-edit');assert page.locator('.modal [name="address"]').input_value()=='Баянгол';page.locator('.modal [name="name"]').fill('Болд');submit();assert users[0]['name']=='Болд';assert page.locator('.modal').count()==0
 action('account-link');submit();assert any(x['uid']=='free' for x in docs['club/test/members']['list'])
 nav('clubs');assert page.locator('details').count()==1;assert not page.locator('code').first.is_visible();action('club-edit');page.locator('.modal [name="n"]').fill('Arrow Test');page.locator('.modal [name="kidsMonth"]').fill('65000');submit();assert docs['club/test/profile']['n']=='Arrow Test';assert docs['club/test/profile']['fee']['kidsMonth']==65000;assert docs['club/test/profile']['code']=='CODE';assert docs['club/test/profile']['schedule']
 action('coaches');page.locator('.modal [name="uid"]').select_option('peer');page.locator('.modal [name="confirm"]').check();submit();assert 'peer' in docs['club/test/profile']['admins']
 action('coaches');page.locator('.modal [name="grant"]').select_option('0');page.locator('.modal [name="uid"]').select_option('coach');page.locator('.modal [name="confirm"]').check();submit();assert docs['club/test/profile']['admins']==['peer']
 action('coaches');page.locator('.modal [name="grant"]').select_option('0');page.locator('.modal [name="confirm"]').check();submit();assert page.locator('.modal').count()==1;assert 'Сүүлчийн' in page.locator('#toast').inner_text();page.keyboard.press('Escape')
 action('club-reject');assert page.locator('.modal').count()==1;assert docs['club/test/profile']['status']=='approved';page.keyboard.press('Escape')
 nav('audit');assert 'Коуч нэмсэн' in page.locator('main').inner_text();page.set_viewport_size({'width':390,'height':844});nav('users');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/arrow-v7-admin-mobile.png')
 ready=False;page.reload();page.wait_for_selector('[data-page="users"]');nav('users');assert 'серверийн тохиргоо' in page.locator('main').inner_text();assert all(page.locator('[data-act="account-edit"]').nth(i).is_disabled() for i in range(page.locator('[data-act="account-edit"]').count()))
 assert not errors,errors
 print('PASS V7 admin UI: users outside clubs, profile edit, club link, hidden codes, fees/profile preservation, coach grant/revoke and last guard, deactivate confirmation, audit, mobile containment, missing-server-key fallback')
 b.close()
