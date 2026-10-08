"""Reference login UI with mocked cloud; no real sign-in or user writes."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from static_fixture import install
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(390,844),(320,568),(768,1024)]:
  c=b.new_context(viewport={'width':width,'height':height});install(c);c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={supabaseUrl:"https://sb.fixture",supabaseAnonKey:"test"};',content_type='application/javascript'));c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort());c.route('https://sb.fixture/**',lambda r:r.fulfill(status=400,json={'message':'Invalid credentials'}))
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('#login');page.wait_for_timeout(200)
  assert page.locator('.auth-brand').inner_text()=='Arrow BJJ';assert page.locator('#login h2').inner_text()=='Нэвтрэх';assert page.locator('.auth-submit').is_disabled();assert page.locator('header.top').is_hidden();assert page.locator('#lg-remember').is_checked()
  page.locator('#lg-e').fill('batuser');page.locator('#lg-p').fill('password123');assert page.locator('.auth-submit').is_enabled();page.locator('.auth-eye').click();assert page.locator('#lg-p').get_attribute('type')=='text';assert page.locator('.auth-eye').get_attribute('aria-pressed')=='true';page.locator('.auth-eye').click();assert page.locator('#lg-p').get_attribute('type')=='password'
  page.locator('#lg-remember').uncheck();assert not page.locator('#lg-remember').is_checked();page.locator('#lg-p').fill('');assert page.locator('.auth-submit').is_disabled();page.locator('#lg-p').fill('password123');page.locator('.auth-submit').click();page.wait_for_selector('.auth-message');assert page.locator('.auth-submit').is_enabled()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('.auth-submit').bounding_box()['width']<=width;page.screenshot(path='/tmp/arrow-v11-login-'+str(width)+'.png',full_page=True)
  page.locator('[data-act="auth-mode"]').click();assert page.locator('#lg-n').count()==1;assert page.locator('#lg-dob').count()==0;assert page.locator('.auth-submit').is_disabled();page.locator('#lg-n').fill('Бат');page.locator('#lg-e').fill('batuser');page.locator('#lg-p').fill('1234567');assert page.locator('.auth-submit').is_disabled();page.locator('#lg-p').fill('12345678');assert page.locator('.auth-submit').is_enabled();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors;c.close()
 b.close()
print('PASS reference login/signup at 320/390/768: Cyrillic, password toggle, remember control, input readiness, error recovery and no overflow')
