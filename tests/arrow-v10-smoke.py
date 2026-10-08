"""V10 mobile flows use isolated local fixtures; no live data writes."""
import json
from pathlib import Path
from datetime import date
from playwright.sync_api import sync_playwright
from static_fixture import install
source=Path('tests/arrow-v3-smoke.py').read_text();exec(source[:source.index('with sync_playwright()')])
base['log']={'items':[{'id':'mine','d':date.today().isoformat(),'type':'gi','min':60,'rolls':3,'audience':'public','with':[]}]}
base['comp']={'events':[{'id':'medal1','n':'Open Championship','d':date.today().isoformat(),'medal':'gold'}]}
club['club/test/feed/'+ym]['list'].append({'id':'mine','uid':'local','n':'@batcoach','d':date.today().isoformat(),'type':'gi','min':60,'rounds':3,'audience':'public','kudos':[]})
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,theme,lang in [(390,'light','en'),(320,'dark','mn')]:
  data=json.loads(json.dumps(base));data['settings']['theme']=theme
  c=b.new_context(viewport={'width':width,'height':844});install(c);c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'));c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort());c.add_init_script('localStorage.setItem("bjj-v1",'+json.dumps(json.dumps(data))+');localStorage.setItem("bjj-club-local",'+json.dumps(json.dumps(club))+');localStorage.setItem("bjj-lang",'+json.dumps(lang)+');')
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('.feed');page.wait_for_timeout(700)
  def click(act,extra=''):
   selector='[data-act="'+act+'"]'+extra
   target=page.locator('#sheet-body '+selector) if page.locator('#sheet.open').count() and page.locator('#sheet-body '+selector).count() else page.locator(selector)
   target.first.click();page.wait_for_timeout(180)
  def fit():
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if page.locator('#sheet.open').count():assert page.locator('#sheet-body').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  assert page.locator('.feed[data-post-id="mine"] [data-act="edit-sess"]').count()==0
  click('post-options','[data-id="mine"]');click('edit-sess','[data-id="mine"]');assert page.locator('#f-d').get_attribute('type')=='hidden';assert page.locator('#f-min').get_attribute('type')=='hidden'
  page.locator('#duration-hours').fill('1');page.locator('#duration-minutes').fill('25');assert page.locator('#f-min').input_value()=='85';click('session-date-open');click('session-date-pick','[data-d="'+date.today().isoformat()+'"]');fit();click('sheet-save');page.wait_for_timeout(700)
  if page.locator('.share-sheet.open').count():click('sheet-close')
  saved=page.evaluate('JSON.parse(localStorage.getItem("bjj-v1"))');assert saved['log']['items'][0]['min']==85
  click('profile');assert page.locator('.profile-edit-small').count()==1;assert page.locator('.profile-workouts .feed').count()==1;click('profile-section','[data-v="competition"]');assert 'Open Championship' in page.locator('#main').inner_text();click('profile-edit');assert page.locator('[data-dob="pf-dob"] select').count()==3
  page.locator('[data-dob="pf-dob"] [data-date-part="year"]').select_option('2000');page.locator('[data-dob="pf-dob"] [data-date-part="month"]').select_option('02');page.locator('[data-dob="pf-dob"] [data-date-part="day"]').select_option('29');assert page.locator('#pf-dob').input_value()=='2000-02-29'
  page.locator('[data-dob="pf-dob"] [data-date-part="year"]').select_option('2001');assert page.locator('#pf-dob').input_value()=='';assert page.locator('[data-dob="pf-dob"] [data-date-part="day"] option[value="29"]').count()==0;page.locator('[data-dob="pf-dob"] [data-date-part="day"]').select_option('28')
  page.locator('#featured-medal').select_option('comp:medal1');fit();click('sheet-save');page.wait_for_timeout(700);assert page.locator('.featured-medal svg').count()==1
  click('club-profile');page.wait_for_selector('.club-public-hero');click('club-public-edit');page.locator('#club-logo-file').set_input_files('icon-512.png');page.wait_for_selector('#club-logo-crop canvas');assert page.locator('#club-logo-preview img').count()==1;page.locator('#club-gallery-files').set_input_files('icon-512.png');page.wait_for_selector('.club-photo-editor');page.locator('[data-gallery-caption]').fill('Our gym');page.locator('#cp-about').fill('A welcoming academy');page.locator('#cp-website').fill('https://example.com');click('club-teacher-add');page.locator('[data-teacher-field="name"]').fill('Багш Бат');page.locator('[data-teacher-field="bio"]').fill('Black belt coach');fit();click('sheet-save');page.wait_for_timeout(600);assert 'A welcoming academy' in page.locator('#main').inner_text();assert 'Black belt coach' in page.locator('#main').inner_text();assert page.locator('.club-gallery img').count()==1;assert page.locator('.club-logo.large img').count()==1;logo=page.locator('.club-logo.large img').get_attribute('src');assert page.evaluate('async(s)=>{const i=new Image();i.src=s;await i.decode();return i.width===128&&i.height===128}',logo)
  click('club-review');click('review-star','[data-v="4"]');page.locator('#club-review-comment').fill('Great team');click('sheet-save');page.wait_for_timeout(500);assert 'Great team' in page.locator('#main').inner_text();fit();page.screenshot(path='/tmp/arrow-v10-club-'+str(width)+'.png',full_page=True)
  click('tab','[data-v="me"]');page.evaluate('scrollTo(0,180)');page.wait_for_timeout(100);before=page.evaluate('scrollY');page.locator('[data-act="segview"][data-v="body"]').evaluate('(el)=>el.click()');page.wait_for_timeout(100);assert abs(page.evaluate('scrollY')-before)<3
  fit();assert not errors,errors;c.close()
 b.close()
print('PASS V10 phone layouts, post menu, training date/duration, ordered DOB/leap year, profile tabs/medal, club editor/review and You scroll')
