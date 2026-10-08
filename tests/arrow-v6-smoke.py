import json
from playwright.sync_api import sync_playwright
from static_fixture import install
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(**p.devices['iPhone 13']);install(c)
 c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://sb.fixture",supabaseAnonKey:"test"};',content_type='application/javascript'))
 calls=[]
 def api(r):
  calls.append((r.request.url,r.request.post_data_json if r.request.method in ['POST','PUT'] else None))
  if '/signup' in r.request.url or '/token?' in r.request.url:
   meta={'name':'Бат-Эрдэнэ','birthDate':'2000-02-03','username':'batuser'}
   r.fulfill(json={'access_token':'test','refresh_token':'refresh','expires_in':3600,'user':{'id':'test-user','email':'batuser@member.bjjclub.mn','user_metadata':meta}})
  elif '/recover?' in r.request.url:r.fulfill(json={})
  elif r.request.method=='PUT':r.fulfill(json={})
  elif r.request.method=='GET':r.fulfill(json=[])
  else:r.fulfill(status=201,json={})
 c.route('https://sb.fixture/**',api)
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/')
 page.locator('[data-act="auth-mode"]').click();assert page.locator('#lg-n').count()==1;assert 'дасгалжуулагчид' not in page.locator('#login').inner_text()
 page.locator('#lg-n').fill('Bat');page.locator('#lg-dob').fill('2000-02-03');page.locator('#lg-e').fill('batuser');page.locator('#lg-p').fill('strongpassword');page.locator('#login button[type="submit"]').click();assert not calls
 page.evaluate('''const f=window.fetch;window.fetch=async(...a)=>{await new Promise(r=>setTimeout(r,400));return f(...a)}''');page.locator('#lg-n').fill('Бат-Эрдэнэ');page.locator('#login button[type="submit"]').click();assert page.locator('#login button[aria-busy="true"] .button-spinner').count()==1;page.wait_for_selector('#arrow-age');assert page.locator('#on-name,#on-user').count()==0
 signup=next(data for url,data in calls if '/signup' in url);assert signup['data']['name']=='Бат-Эрдэнэ' and signup['data']['birthDate']=='2000-02-03'
 assert page.evaluate('JSON.parse(localStorage.getItem("cb-sb-session")).name')=='Бат-Эрдэнэ';assert page.evaluate('localStorage.getItem("arrow-login")')=='batuser'
 page.locator('#pf-phone').fill('99112233');page.locator('#pf-address').fill('Баянгол дүүрэг, 1-р хороо');page.locator('#arrow-age button').click();page.wait_for_timeout(900);assert page.locator('#arrow-age').count()==0
 page.locator('[data-act="tab"][data-v="tech"]').click();page.locator('#tq').fill('armbar');page.wait_for_timeout(300);assert 'Armbar' in page.locator('#main').inner_text();assert 'Гар түгжих' not in page.locator('#main').inner_text();page.reload();page.wait_for_timeout(700);assert page.locator('#on-name').count()==0
 # Remember off writes only sessionStorage and does not retain the username/password.
 page.evaluate('localStorage.clear();sessionStorage.clear()');page.reload();page.locator('#lg-e').fill('batuser');page.locator('#lg-p').fill('strongpassword');page.locator('#lg-remember').uncheck();page.locator('#login button[type="submit"]').click();page.wait_for_selector('#arrow-age')
 assert page.evaluate('localStorage.getItem("cb-sb-session")') is None;assert page.evaluate('sessionStorage.getItem("cb-sb-session")') is not None
 assert 'strongpassword' not in page.evaluate('JSON.stringify(localStorage)+JSON.stringify(sessionStorage)')
 page.evaluate('localStorage.clear();sessionStorage.clear()');page.reload();page.locator('[data-recovery="username"]').click();assert 'коуч' in page.locator('#sheet-body').inner_text();page.keyboard.press('Escape')
 page.locator('[data-recovery="password"]').click();page.locator('#recover-email').fill('batuser@member.bjjclub.mn');page.locator('[data-act="sheet-save"]').click();assert not any('/recover?' in u for u,d in calls)
 page.locator('#recover-email').fill('person@example.com');page.locator('[data-act="sheet-save"]').click();page.wait_for_timeout(200);assert any('/recover?' in u for u,d in calls);assert 'имэйлээ' in page.locator('#recovery-result').inner_text().lower();page.keyboard.press('Escape')
 page.goto('https://arrow.fixture/#type=recovery&access_token=recovery&refresh_token=r');page.wait_for_selector('#reset-password');page.locator('#reset-new').fill('newpassword');page.locator('#reset-confirm').fill('newpassword');page.locator('#reset-password button').click();page.wait_for_selector('#login');assert any(d=={'password':'newpassword'} for u,d in calls)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/arrow-v6-login.png')
 assert not errors,errors
 print('PASS V6: Cyrillic signup/DOB, metadata name retained, no repeated name, remembered/session-only auth, no plaintext password, honest username/alias recovery, email reset and recovery link, mobile width')
 b.close()
