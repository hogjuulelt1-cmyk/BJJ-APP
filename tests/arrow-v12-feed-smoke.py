"""Repeated cursor response must terminate without moving/repeating visible cards."""
import json
from datetime import date
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
from static_fixture import install
posts=[{'id':'p'+str(i),'uid':'peer','n':'@peer','d':date.today().isoformat(),'t':1000+i,'type':'gi','min':60,'audience':'public','kudos':[]} for i in range(12)]
settings={'name':'Бат','username':'bat','birthDate':'1990-01-01','phone':'99112233','address':'Улаанбаатар','clubId':'test','seeded':True,'seedVer':999}
docs={'bjj/u/me/settings':settings,'clubs/index':{'seeded':True,'list':[]},'club/test/profile':{'id':'test','n':'Club','admins':[]},'club/test/members':{'list':[{'uid':'me','username':'bat','socialAllowed':True},{'uid':'peer','username':'peer','socialAllowed':True}]}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844});install(c);c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://sb.fixture",supabaseAnonKey:"test"};',content_type='application/javascript'));c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 def sb(r):
  if r.request.method=='POST':data=r.request.post_data_json;docs[data['path']]=data['data'];r.fulfill(status=201,body='');return
  path=parse_qs(urlparse(r.request.url).query).get('path',[''])[0];key=path[3:];r.fulfill(json=[{'data':docs[key]}] if path.startswith('eq.') and key in docs else [{'path':k,'data':v} for k,v in docs.items() if path.startswith('like.') and k.startswith(path[5:].rstrip('*'))])
 c.route('https://sb.fixture/**',sb);calls=[]
 def feed(r):
  q=parse_qs(urlparse(r.request.url).query);calls.append(q.get('cursor'));cursor={'month':date.today().isoformat()[:7],'before':[posts[-1]['d'],1000,'p0'],'asOf':100000};r.fulfill(json={'posts':posts,'next':dict(reversed(list(cursor.items()))) if len(calls)>1 else cursor})
 c.route('**/api/feed?**',feed);c.route('**/api/community?**',lambda r:r.fulfill(json={'ok':True,'rows':[],'items':[],'next':None}));c.add_init_script('localStorage.setItem("cb-sb-session",JSON.stringify({uid:"me",email:"fixture@example.com",access:"fixture",refresh:"fixture",exp:Date.now()+3600000}));localStorage.setItem("bjj-lang","en");')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('.feed');page.wait_for_timeout(400);assert len(calls)==1;page.evaluate('window.firstCard=document.querySelector(".feed");');page.locator('#feed-tail').scroll_into_view_if_needed();page.wait_for_selector('.feed-end');assert len(calls)==2;assert page.locator('.feed').count()==12;assert page.evaluate('firstCard===document.querySelector(".feed")');page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(600);assert len(calls)==2;assert len(set(page.locator('.feed').evaluate_all('(es)=>es.map(e=>e.dataset.postId)')))==12;assert not errors,errors;b.close()
print('PASS repeated cursor stops after 2 requests, existing card identity/order remains, no duplicate cards or bottom-loop retries')
