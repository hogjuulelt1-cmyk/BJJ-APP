from static_fixture import install
import os,json,copy
from datetime import date
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
exec(open('tests/arrow-smoke.py').read().split('with sync_playwright()')[0])
url=os.environ.get('ARROW_TEST_URL','http://127.0.0.1:8080/')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(viewport={'width':1280,'height':900});install(c)
 prep=c.new_page();prep.goto(url+'arrow-core.js');prep.add_script_tag(path='arrow-core.js')
 crypto=prep.evaluate('async()=>{const key=await ARROW.newAgeKey();return{key,age:await ARROW.sealAge("2017-01-01",key.publicKey),profile:await ARROW.sealPayload({phone:"99112233",address:"Test address",social:"@test"},{local:key.publicKey})}}');prep.close()
 docs=copy.deepcopy(club);docs['club/test/profile']['fee']={'month':100000,'kidsMonth':50000};docs['club/test/profile']['ageKeys']={'local':crypto['key']['publicKey']}
 docs['bjj/u/local/settings']={'coachAgeKeys':{'test':crypto['key']}}
 child=docs['club/test/members']['list'][2];child['ageSealed']={'local':crypto['age']};child['privateProfile']=crypto['profile']
 docs['club/test/pay/peer']={'items':[{'id':'pending','d':date.today().isoformat(),'start':date.today().isoformat(),'end':'2026-11-06','per':ym,'amt':100000,'status':'pending'}]}
 def api(route):
  req=route.request
  if req.method=='POST':
   body=req.post_data_json;docs[body['path']]=body['data'];route.fulfill(status=201,body='');return
  query=parse_qs(urlparse(req.url).query);value=query.get('path',[''])[0];rows=[]
  if value.startswith('eq.'):
   key=value[3:]
   if key in docs:rows=[{'data':docs[key]}]
  elif value.startswith('like.'):
   prefix=value[5:].rstrip('*');rows=[{'path':key,'data':value} for key,value in docs.items() if key.startswith(prefix)]
  route.fulfill(content_type='application/json',body=json.dumps(rows))
 c.route('**/config.js',lambda r:r.fulfill(content_type='application/javascript',body='window.APP_CONFIG={supabaseUrl:"https://arrow-fixture.invalid",supabaseAnonKey:"fixture"}'))
 c.route('https://arrow-fixture.invalid/**',api)
 c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.add_init_script('localStorage.setItem("bjj-lang","en");localStorage.setItem("cb-sb-session",JSON.stringify({uid:"local",email:"coach@member.bjjclub.mn",access:"fixture",exp:Date.now()+3600000}));')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'admin.html');page.locator('[data-page="members"]').click();page.wait_for_timeout(200)
 page.locator('[data-act="member-edit"][data-id="child"]').click();assert page.locator('.modal [name="phone"]').input_value()=='99112233';page.locator('.modal [data-x]').click()
 page.locator('[data-act="pay-log"][data-who="child"]').click();assert page.locator('.modal [name="amt"]').input_value()=='50000';page.locator('.modal button[type="submit"]').click();page.wait_for_timeout(300)
 payment=docs['club/test/pay/child']['items'][0];assert payment['status']=='ok' and payment['start']==date.today().isoformat() and payment['end']!=payment['start']
 page.locator('[data-page="payments"]').click();page.locator('[data-act="pay-ok"][data-who="peer"]').click();page.wait_for_timeout(300);assert docs['club/test/pay/peer']['items'][0]['status']=='ok'
 assert not errors,errors
 print('PASS coach console: encrypted contact read, kids payment amount, day-based coverage and member-request approval (mocked API only)')
 b.close()
