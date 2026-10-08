"""Club journeys run on local fixtures; production records are never touched."""
import json,copy
from pathlib import Path
from datetime import date,timedelta
from playwright.sync_api import sync_playwright
from static_fixture import install
source=Path('tests/arrow-v3-smoke.py').read_text();exec(source[:source.index('with sync_playwright()')])
today=date.today().isoformat();dow=date.today().weekday()
club['club/test/profile']['schedule']=[{'d':dow,'t':'18:00','kind':'gi','n':'Adult training','group':'adult'},{'d':dow,'t':'16:00','kind':'kids','n':'Kids training','group':'kids'},{'d':(dow+1)%7,'t':'12:00','kind':'open','n':'Open mat','group':'all'}]
club['club/test/events']={'list':[{'id':'future','n':'Next Championship','d':(date.today()+timedelta(days=20)).isoformat()},{'id':'past','n':'Past Championship','d':(date.today()-timedelta(days=20)).isoformat()}]}
club['club/test/att/'+ym]={'days':{today:['local','peer']}}
club['club/test/friends']['list'][0]['status']='accepted'
base['log']={'items':[{'id':'own','d':today,'type':'gi','min':60,'audience':'public','with':['peer']}]}
base['comp']={'events':[{'id':'comp'+str(i),'n':'My championship '+str(i),'d':today,'medal':'gold'} for i in range(12)]}
club['club/test/profile']['teachers']=[{'id':'coach','uid':'local','name':'Бат Коуч','belt':'black','bio':'Coach introduction','achievements':'National champion','photo':'data:image/png;base64,'+__import__('base64').b64encode(Path('icon-512.png').read_bytes()).decode()}]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,theme,lang in [(390,'light','en'),(320,'dark','mn')]:
  state=copy.deepcopy(base);state['settings']['theme']=theme;c=b.new_context(viewport={'width':width,'height':568});install(c);c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'));c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort());c.add_init_script('localStorage.setItem("bjj-v1",'+json.dumps(json.dumps(state))+');localStorage.setItem("bjj-club-local",'+json.dumps(json.dumps(club))+');localStorage.setItem("bjj-lang",'+json.dumps(lang)+');')
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('.feed');page.wait_for_timeout(650)
  def click(act,extra=''):
   q='[data-act="'+act+'"]'+extra;loc=page.locator('#sheet-body '+q) if page.locator('#sheet.open').count() and page.locator('#sheet-body '+q).count() else page.locator(q);loc.first.click();page.wait_for_timeout(160)
  def fit():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  click('tab','[data-v="club"]');page.wait_for_selector('.club-info');assert not page.locator('.club-info').evaluate('(e)=>e.open');assert page.locator('[data-act="club-edit"]').is_hidden();assert page.locator('.membership-status').count()==1;assert page.locator('.clubhead .summary').count()==0
  assert page.locator('[data-act="clubseg"][data-v="today"]').count()==0;assert page.locator('[data-act="clubseg"]').count()==6;assert page.locator('.club-today .pill').first.inner_text() in ['Training day','Бэлтгэлтэй өдөр'];assert page.locator('.today-trained b').inner_text()=='2';assert page.locator('.today-streak').count()==1;assert page.locator('.training-calendar').count()==1;assert page.locator('.calendar-attendance').count()==1;assert page.locator('.cal-date.attended').count()==1;assert page.locator('.weekly-class').count()==2;assert 'Kids training' not in page.locator('.weekly-sheet').inner_text();fit()
  page.locator('.club-info-summary').click();assert page.locator('[data-act="club-edit"]').is_visible();page.locator('.club-info-summary').click();assert page.locator('[data-act="club-edit"]').is_hidden()
  page.evaluate('scrollTo(0,100)');page.wait_for_timeout(100);before=page.evaluate('scrollY');page.locator('[data-act="clubseg"][data-v="members"]').evaluate('(e)=>e.click()');page.wait_for_timeout(150);assert abs(page.evaluate('scrollY')-before)<3;assert page.locator('#main').inner_text().count('Training partners')==1 if lang=='en' else 'хамтрагч' in page.locator('#main').inner_text().lower();assert 'Mat time' in page.locator('#main').inner_text() if lang=='en' else 'Дэвсгэр дээрх хугацаа' in page.locator('#main').inner_text();fit()
  click('clubseg','[data-v="open"]');page.wait_for_selector('.om');assert page.locator('.club-today').count()==0;assert page.locator('.club-competitions').count()==0;fit()
  click('clubseg','[data-v="competition"]');assert 'Next Championship' in page.locator('.club-competitions').inner_text();assert 'Past Championship' not in page.locator('.club-competitions').inner_text();click('club-comp-period','[data-v="past"]');assert 'Past Championship' in page.locator('.club-competitions').inner_text();click('clubseg','[data-v="notices"]');assert 'Club announcement' in page.locator('#main').inner_text();fit()
  click('tab','[data-v="me"]');click('segview','[data-v="comp"]');assert 'Next Championship' in page.locator('#main').inner_text()
  click('tab','[data-v="club"]');page.locator('.club-info-summary').click();click('club-profile');page.wait_for_selector('.public-weekly-schedule');assert page.locator('.public-weekly-schedule .weekly-day').count()==7;assert 'Kids training' in page.locator('.public-weekly-schedule').inner_text();assert page.locator('.coach-photo-card .coach-portrait').count()==1;assert 'National champion' in page.locator('.coach-photo-card').inner_text();assert page.locator('[data-act="club-coach-profile"]').count()==1;fit();page.screenshot(path='/tmp/arrow-v12-club-profile-'+str(width)+'.png',full_page=True)
  click('club-coach-profile');page.wait_for_selector('.profile-hero');assert '@batcoach' in page.locator('.profile-hero').inner_text();page.evaluate('scrollTo(0,80)');before=page.evaluate('scrollY');page.locator('[data-act="profile-section"][data-v="competition"]').evaluate('(e)=>e.click()');page.wait_for_timeout(100);assert abs(page.evaluate('scrollY')-before)<3;fit()
  click('tab','[data-v="home"]');page.evaluate('scrollTo(0,40)');before=page.evaluate('scrollY');page.locator('[data-act="homeseg"][data-v="lead"]').evaluate('(e)=>e.click()');page.wait_for_timeout(300);assert abs(page.evaluate('scrollY')-before)<3
  click('tab','[data-v="tech"]');page.evaluate('scrollTo(0,40)');before=page.evaluate('scrollY');page.locator('[data-act="techview"][data-v="disc"]').evaluate('(e)=>e.click()');page.wait_for_timeout(100);assert abs(page.evaluate('scrollY')-before)<3;fit()
  assert page.evaluate('''()=>{const el=document.querySelector("#main"),t=(x)=>new Touch({identifier:1,target:el,clientX:x,clientY:200});el.dispatchEvent(new TouchEvent("touchstart",{touches:[t(5)],bubbles:true}));const e=new TouchEvent("touchmove",{touches:[t(65)],bubbles:true,cancelable:true});el.dispatchEvent(e);el.dispatchEvent(new TouchEvent("touchend",{touches:[],bubbles:true}));return e.defaultPrevented;}''')
  assert not errors,errors;c.close()
 b.close()
print('PASS V12 club structure, collapsible coach information, single status, track schedule, Today/count/streak, attendance calendar, independent tabs, upcoming/past, You competitions, weekly public sheet, coach cards/profile and section scroll')
