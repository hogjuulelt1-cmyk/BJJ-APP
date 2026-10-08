"""Offline mobile journeys; no production accounts or data are changed."""
import json,sys
from pathlib import Path
from datetime import date
from playwright.sync_api import sync_playwright
from static_fixture import install
source=Path('tests/arrow-v3-smoke.py').read_text();exec(source[:source.index('with sync_playwright()')])
base['log']={'items':[{'id':'own-training','d':date.today().isoformat(),'type':'gi','min':60,'rolls':3,'audience':'public','with':[]}]}
club['club/test/feed/'+ym]['list'].append({'id':'own-training','uid':'local','n':'@batcoach','d':date.today().isoformat(),'type':'gi','min':60,'rounds':3,'audience':'public','kudos':[]})
club['club/test/friends']['list'][0]['status']='accepted'
club['club/test/profiles/peer']={'uid':'peer','bio':'Training every week','show':{'workouts':True,'scores':True,'competition':True,'friends':True},'workouts':[{'id':'post1','d':date.today().isoformat(),'type':'gi','min':60,'rounds':4}],'competition':[{'n':'Open Championship','d':date.today().isoformat(),'medal':'gold'}]}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=browser.new_context(viewport={'width':390,'height':844});install(c)
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'));c.route('https://fonts.googleapis.com/**',lambda r:r.abort());c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.add_init_script('localStorage.setItem("bjj-v1",'+json.dumps(json.dumps(base))+');localStorage.setItem("bjj-club-local",'+json.dumps(json.dumps(club))+');localStorage.setItem("bjj-lang","en");')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('.feed');page.wait_for_timeout(900)
 def click(act,extra=''):
  locator=page.locator('#sheet-body [data-act="'+act+'"]'+extra) if page.locator('#sheet.open').count() and page.locator('#sheet-body [data-act="'+act+'"]'+extra).count() else page.locator('[data-act="'+act+'"]'+extra)
  locator.first.click();page.wait_for_timeout(180)
 def overflow():
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('[document.documentElement.scrollWidth,innerWidth]')
 assert page.locator('#boot-splash').count()==0
 assert page.locator('[data-act="homeseg"]').count()==2
 click('homeseg','[data-v="lead"]');page.wait_for_selector('.llist');assert '@dorj' in page.locator('.llist').inner_text();assert page.locator('.llist .lrow').count()==2
 click('homeseg','[data-v="feed"]');click('member-profile','[data-uid="peer"]');page.wait_for_selector('.profile-club');assert 'Test Club' in page.locator('.profile-club').inner_text();assert page.locator('.feed').count()==1;click('profile-section','[data-v="competition"]');assert 'Open Championship' in page.locator('#main').inner_text();click('profile-section','[data-v="friends"]');assert page.locator('.profile-friend').count()==1;overflow();page.screenshot(path='/tmp/arrow-v9-public-profile.png',full_page=True)
 click('profile-back');click('profile');click('profile-edit');assert page.locator('.visibility-toggle').count()==4;page.locator('#visible-workouts').uncheck();page.locator('#visible-scores').uncheck();click('sheet-save');page.wait_for_timeout(800)
 published=page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/profiles/local"]');assert published['show']['workouts']==False and published['show']['scores']==False;assert 'workouts' not in published;assert not any(k in published for k in ['birthDate','phone','address','name']);click('profile-section','[data-v="friends"]');assert page.locator('.profile-friend').count()==1;click('profile-section','[data-v="workouts"]')
 click('my-workouts');page.wait_for_timeout(500);assert page.locator('[data-act="edit-sess"][data-id="own-training"]').count()==1;click('profile-back');assert page.locator('[data-act="profile-edit"]').count()==1
 click('profile-edit');overflow();assert page.locator('#sheet-body').evaluate('(e)=>e.scrollWidth<=e.clientWidth');page.screenshot(path='/tmp/arrow-v9-edit-profile.png',full_page=True);click('sheet-close');click('profile-back')
 click('tab','[data-v="me"]');page.locator('#main .seg').first.evaluate('(e)=>e.scrollLeft=e.scrollWidth');page.wait_for_timeout(200);menuLeft=page.locator('#main .seg').first.evaluate('(e)=>e.scrollLeft');assert menuLeft>0
 click('segview','[data-v="comp"]');assert abs(page.locator('#main .seg').first.evaluate('(e)=>e.scrollLeft')-menuLeft)<3
 click('tab','[data-v="home"]');page.evaluate('scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100);click('tab','[data-v="me"]');assert page.evaluate('scrollY')==0;assert abs(page.locator('#main .seg').first.evaluate('(e)=>e.scrollLeft')-menuLeft)<3
 click('tab','[data-v="home"]');click('live-start');click('sheet-save');page.wait_for_timeout(800)
 # Set the live tracker start 83 seconds earlier, reload without reseeding this tab.
 page.evaluate('const s=JSON.parse(localStorage.getItem("bjj-v1"));s.settings.live.t0=Date.now()-83000;localStorage.setItem("bjj-v1",JSON.stringify(s));');c.clear_cookies()
 # init script reseeds on reload, so use a fresh context carrying current persisted state.
 state=page.evaluate('({data:JSON.parse(localStorage.getItem("bjj-v1")),club:JSON.parse(localStorage.getItem("bjj-club-local"))})');c2=browser.new_context(viewport={'width':390,'height':844});install(c2);c2.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'));c2.route('https://fonts.googleapis.com/**',lambda r:r.abort());c2.route('https://fonts.gstatic.com/**',lambda r:r.abort());c2.add_init_script('localStorage.setItem("bjj-v1",'+json.dumps(json.dumps(state['data']))+');localStorage.setItem("bjj-club-local",'+json.dumps(json.dumps(state['club']))+');localStorage.setItem("bjj-lang","en");');page=c2.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('https://arrow.fixture/');page.wait_for_selector('[data-act="live-finish"]');click('live-finish');assert 1.3<float(page.locator('#f-min').input_value())<1.7
 assert page.locator('.partner-section').count()==1 and page.locator('.partner-section').bounding_box()['y']<page.locator('.training-options').bounding_box()['y'];assert page.locator('[data-act="duration-preset"]').count()==6
 click('with-toggle','[data-who="peer"]');assert page.locator('.partner-tile[data-who="peer"]').get_attribute('aria-pressed')=='true';assert page.locator('.partner-tile .av').first.evaluate('(e)=>getComputedStyle(e).borderRadius')=='50%'
 page.locator('#f-effort').fill('4');page.locator('#f-effort').dispatch_event('input');assert page.locator('#effort-value').inner_text()=='4/5';click('duration-preset','[data-min="45"]');assert page.locator('#f-min').input_value()=='45';overflow();page.screenshot(path='/tmp/arrow-v9-finish.png',full_page=True)
 click('sheet-save');page.wait_for_selector('.share-sheet.open');click('sheet-close');page.wait_for_timeout(700)
 saved=page.evaluate('JSON.parse(localStorage.getItem("bjj-v1"))');training=saved['log']['items'][-1];assert training['min']==45 and training['rpe']==4 and training['with']==['peer'];assert 83<=training['elapsedSeconds']<100;assert training['stoppedAt']>training['startedAt'];shared=page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))');key='club/test/partner-sessions/local_'+training['id'];assert shared[key]['participants']==['peer'];assert 'subs' not in shared[key] and 'good' not in shared[key]
 # View the same shared record from the other member's independent private account.
 peerState={'settings':{**base['settings'],'name':'Дорж','username':'dorj'},'belt':base['belt']};c3=browser.new_context(viewport={'width':390,'height':844});install(c3);c3.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'));c3.route('https://fonts.googleapis.com/**',lambda r:r.abort());c3.route('https://fonts.gstatic.com/**',lambda r:r.abort());
 # Local mode uid is always local; reverse source/recipient to exercise the recipient history read.
 shared[key]['owner']='peer';shared[key]['participants']=['local'];c3.add_init_script('localStorage.setItem("bjj-v1",'+json.dumps(json.dumps(peerState))+');localStorage.setItem("bjj-club-local",'+json.dumps(json.dumps(shared))+');localStorage.setItem("bjj-lang","en");');peer=c3.new_page();peer.goto('https://arrow.fixture/');peer.wait_for_timeout(1200);peer.locator('[data-act="profile"]').click();peer.locator('[data-act="my-workouts"]').first.click();peer.wait_for_selector('[data-act="partner-hide"]');assert '45 min' in peer.locator('#main').inner_text();peer.locator('[data-act="partner-hide"]').click();assert peer.locator('[data-act="partner-hide"]').count()==0
 click('post-options','[data-id="'+training['id']+'"]');click('delete-training','[data-id="'+training['id']+'"]');click('sheet-save');page.wait_for_timeout(500);assert page.locator('.feed[data-post-id="'+training['id']+'"]').count()==0;assert page.evaluate('(id)=>!JSON.parse(localStorage.getItem("bjj-v1")).log.items.some(s=>s.id===id)',training['id']);assert page.evaluate('(key)=>JSON.parse(localStorage.getItem("bjj-club-local"))[key].participants.length===0',key)
 assert not errors,errors
 # First entry must not trigger a camera prompt; rapid reopening reuses one paused stream.
 page.evaluate('window.cameraCalls=0;window.track={readyState:"live",enabled:true,stop(){this.readyState="ended"}};window.media={getTracks:()=>[track]};Object.defineProperty(navigator,"permissions",{value:{query:async()=>({state:"prompt"})},configurable:true});Object.defineProperty(navigator,"mediaDevices",{value:{getUserMedia:async()=>{cameraCalls++;return media;}},configurable:true});Object.defineProperty(HTMLMediaElement.prototype,"srcObject",{set(v){this._stream=v},get(){return this._stream},configurable:true});HTMLMediaElement.prototype.play=async()=>{};HTMLMediaElement.prototype.pause=()=>{};window.BarcodeDetector=class{async detect(){return []}};void 0;')
 click('record');page.wait_for_timeout(200)
 # record opens check-in automatically on this version.
 if not page.locator('#scan-v').count():click('rec-go','[data-v="att"]')
 assert page.evaluate('cameraCalls')==0;click('scan-start');assert page.evaluate('cameraCalls')==1;click('sheet-close');assert page.evaluate('track.enabled')==False;click('record')
 if not page.locator('#scan-v').count():click('rec-go','[data-v="att"]')
 page.wait_for_timeout(200);assert page.evaluate('cameraCalls')==1;click('sheet-close');assert page.evaluate('track.enabled')==False
 assert not errors,errors
 browser.close()
print('PASS V9 community, privacy, mobile navigation, finish training, partner history, delete and camera journeys')
