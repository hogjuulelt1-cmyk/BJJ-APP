import json,os,mimetypes
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
start=1791453600000 # 2026-10-08T10:00:00Z, 18:00 Ulaanbaatar
base={'settings':{'name':'Бат-Эрдэнэ','username':'batcoach','birthDate':'1990-02-01','clubId':'test','phone':'99112233','address':'Ulaanbaatar district 1','theme':'dark'}}
club={'clubs/index':{'seeded':True,'list':[{'id':'test','n':'Test Club','status':'approved'}]},'club/test/profile':{'id':'test','n':'Test Club','admins':['local'],'code':'ABCDEF','timezone':'Asia/Ulaanbaatar','fee':{'month':100000,'kidsMonth':50000},'schedule':[{'d':3,'t':'18:00','kind':'gi'}]},'club/test/members':{'list':[{'id':'me','uid':'local','n':'Бат-Эрдэнэ','username':'batcoach','socialAllowed':True,'track':'adult','belt':'white'},{'id':'peer','uid':'peer','n':'Дорж','username':'dorj','socialAllowed':True,'track':'adult','belt':'white'}]},'club/test/att/2026-10':{'days':{'2026-10-08':['peer']}}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(**p.devices['iPhone 13'],timezone_id='Asia/Ulaanbaatar')
 def static(route):
  path=Path(urlparse(route.request.url).path.lstrip('/') or 'index.html')
  route.fulfill(body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream') if path.is_file() else route.fulfill(status=404,body='Not found')
 c.route('https://arrow.fixture/**',static)
 c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort());c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'))
 c.add_init_script('''const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...a){super(...(a.length?a:[Number(localStorage.getItem('fixture-now')||1791453600000)]));}static now(){return Number(localStorage.getItem('fixture-now')||1791453600000);}};''')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(os.environ.get('ARROW_TEST_URL','http://127.0.0.1:8100/'))
 def reset(coach=True,now=start,lang='en'):
  docs=json.loads(json.dumps(club));docs['club/test/profile']['admins']=['local'] if coach else ['peer']
  page.evaluate('(v)=>{localStorage.clear();localStorage.setItem("bjj-v1",JSON.stringify(v.data));localStorage.setItem("bjj-club-local",JSON.stringify(v.club));localStorage.setItem("bjj-lang",v.lang);localStorage.setItem("fixture-now",v.now)}',{'data':base,'club':docs,'lang':lang,'now':str(now)});page.reload();page.wait_for_timeout(700)
 def click(act,extra=''):
  target=page.locator('#sheet-body [data-act="'+act+'"]'+extra) if page.locator('#sheet.open').count() and page.locator('#sheet-body [data-act="'+act+'"]'+extra).count() else page.locator('[data-act="'+act+'"]'+extra)
  page.keyboard.press('Escape') if act=='sheet-close' and not target.first.is_visible() else target.first.click();page.wait_for_timeout(100)
 def count():return page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/att/2026-10"].days["2026-10-08"].length')
 reset();click('tab','[data-v="club"]');assert 'Coach · Active' in page.locator('.clubhead').inner_text();click('clubseg','[data-v="pay"]');assert page.locator('.coach-membership').count()==1 and page.locator('[data-act="club-paynow"]').count()==0
 assert page.locator('[data-act="club-pay"][data-uid="local"]').count()==0
 click('menu');assert page.locator('.mic svg').count()==page.locator('.mic').count();assert not any(ch in page.locator('.menu').inner_text() for ch in ['👤','📈','🏠','🗺','🥋','📸','🌐','⚙','🚪']);page.screenshot(path='/tmp/arrow-v5-menu.png');click('sheet-close')
 click('clubseg','[data-v="members"]');assert page.locator('.attendance-card .attendance-count b').inner_text()=='1';assert 'Дорж' not in page.locator('.attendance-card').inner_text();assert page.locator('.attendance-card [data-act="att-tick"]').count()==0
 page.screenshot(path='/tmp/arrow-v5-attendance.png');click('attendance-open');assert 'Дорж' in page.locator('#sheet-body > .list').inner_text();assert 'Бат-Эрдэнэ' not in page.locator('#sheet-body > .list').inner_text()
 page.locator('.attendance-manage summary').click();click('att-tick','[data-who="local"]');assert page.locator('.attendance-summary b').inner_text()=='2';assert count()==2;click('sheet-close');assert page.locator('.attendance-card .attendance-count b').inner_text()=='2'
 # Ordinary personal training is valid at any time and never marks club attendance.
 reset(False,start-3600001);click('tab','[data-v="home"]');click('live-start');click('sheet-save');click('live-finish');click('pick','[data-group="audience"][data-v="private"]');click('sheet-save');page.wait_for_timeout(800);assert count()==1;click('sheet-close')
 # Manual-code path is the same gate as the QR deep link.
 click('record');page.locator('#ci-code').fill('ABCDEF');click('sheet-save');assert count()==1 and page.locator('#sheet.open').count()==1;assert '60 minutes' in page.locator('#toast').inner_text();click('sheet-close')
 page.evaluate('(v)=>localStorage.setItem("fixture-now",v)',str(start-3600000));click('record');page.locator('#ci-code').fill('ABCDEF');click('sheet-save');assert count()==2 and page.locator('#sheet.open').count()==0
 click('record');page.locator('#ci-code').fill('ABCDEF');click('sheet-save');assert count()==2
 reset(False,start+2400001);click('tab','[data-v="club"]');click('record');page.locator('#ci-code').fill('ABCDEF');click('sheet-save');assert count()==1;click('sheet-close')
 reset(False,start);click('tab','[data-v="club"]');click('clubseg','[data-v="pay"]');click('club-paynow');assert page.locator('#p-amt,#sheet-body input[type="date"],#sheet-body input[type="month"]').count()==0;click('sheet-save');page.wait_for_timeout(150);payment=page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/pay/local"].items[0]');assert payment['status']=='pending' and payment['amt']==100000 and payment['start']=='2026-10-08'
 reset(True,lang='mn');click('tab','[data-v="club"]');assert 'Коуч' in page.locator('.clubhead').inner_text();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS V5: coach active/exempt, vector menu, count-only attendance with named detail/coach editing, arbitrary-time personal sessions, gated/idempotent QR-code check-in, regular member payments and Mongolian mobile UI')
 b.close()
