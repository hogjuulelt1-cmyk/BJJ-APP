import json, os
from playwright.sync_api import sync_playwright
from datetime import date
ym=date.today().isoformat()[:7]
base={'settings':{'name':'Бат-Эрдэнэ','username':'batcoach','birthDate':'1990-02-01','clubId':'test','seeded':False},'belt':{'track':'adult','belt':'white','stripes':0}}
club={'clubs/index':{'seeded':True,'list':[{'id':'test','n':'Test Club','status':'approved'}]},'club/test/profile':{'id':'test','n':'Test Club','status':'approved','admins':['local'],'code':'ABCDEF','coachCode':'COACH123','schedule':[{'d':0,'t':'10:00','kind':'kids','n':'Kids training'},{'d':2,'t':'18:00','kind':'gi','n':'Adult training'},{'d':5,'t':'12:00','kind':'open','n':'Open mat'}]},'club/test/members':{'list':[{'id':'coach','uid':'local','n':'Бат-Эрдэнэ','username':'batcoach','socialAllowed':True,'track':'adult','belt':'white'},{'id':'peer','uid':'peer','n':'Дорж','username':'dorj','socialAllowed':True,'track':'adult','belt':'white'},{'id':'child','uid':'child','n':'Хүү','username':'little','socialAllowed':False,'track':'kids','belt':'white'}]},'club/test/notes':{'list':[{'id':'note1','d':date.today().isoformat(),'text':'Club announcement'}]},'club/test/friends':{'list':[{'id':'friend1','from':'peer','to':'local','status':'pending'}]},'club/test/feed/'+ym:{'list':[{'id':'post1','uid':'peer','n':'Дорж','d':date.today().isoformat(),'type':'gi','min':60,'kudos':[]},{'id':'postchild','uid':'child','n':'Хүү','d':date.today().isoformat(),'type':'gi','min':60,'kudos':[]}]}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(**p.devices['iPhone 13'])
 c.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'))
 page=c.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('ARROW_TEST_URL','http://127.0.0.1:8080/'))
 def reset(data=base,theme='light',lang='en'):
  page.evaluate('(v)=>{localStorage.clear();localStorage.setItem("bjj-v1",JSON.stringify(v.data));localStorage.setItem("bjj-club-local",JSON.stringify(v.club));localStorage.setItem("bjj-lang",v.lang);localStorage.setItem("bjj-theme",v.theme)}',{'data':data,'club':club,'lang':lang,'theme':theme})
  page.reload(); page.wait_for_timeout(1000)
 def click(act,extra=''):
  page.locator(('#sheet-body ' if act=='sheet-close' else '')+'[data-act="'+act+'"]'+extra).first.click();page.wait_for_timeout(200)
 def saved():
  page.wait_for_timeout(900);return page.evaluate('JSON.parse(localStorage.getItem("bjj-v1"))')
 reset()
 assert page.locator('#title').inner_text()=='Arrow'
 assert page.locator('[data-act="kudos"]').count()==1
 assert '@dorj' in page.locator('#main').inner_text() and 'Хүү' not in page.locator('#main').inner_text()
 assert page.locator('#sync').is_hidden()
 click('homeseg','[data-v="friends"]'); assert page.locator('[data-act="arrow-friend"]').count()==1
 click('arrow-friend'); assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/friends"].list[0].status')=='accepted'
 click('arrow-notices');assert 'Club announcement' in page.locator('#sheet-body').inner_text();click('sheet-save'); assert page.locator('.notice-count').count()==0
 click('profile');click('profile-edit');page.locator('#pf-photo').set_input_files({'name':'avatar.png','mimeType':'image/png','buffer':page.screenshot()});page.wait_for_timeout(300);page.locator('.avatar-crop').wait_for();page.locator('.crop-zoom input').evaluate('(e)=>{e.value=2;e.dispatchEvent(new Event("input"))}');before=page.locator('#pf-av img').get_attribute('src');page.locator('.avatar-crop').press('ArrowDown');assert page.locator('#pf-av img').get_attribute('src')!=before;page.locator('#f-name').fill('Бат Монгол');page.locator('#f-username').fill('batnew');click('sheet-save');assert saved()['settings']['name']=='Бат Монгол';assert saved()['settings']['avatar'].startswith('data:image/jpeg');assert page.evaluate('async()=>{const im=new Image();im.src=JSON.parse(localStorage.getItem("bjj-v1")).settings.avatar;await im.decode();return im.naturalWidth===50&&im.naturalHeight===50}');assert not page.locator('#sheet').evaluate('(e)=>e.classList.contains("open")')
 assert page.evaluate('!JSON.stringify(JSON.parse(localStorage.getItem("bjj-club-local"))).includes("1990-02-01")')
 result=page.evaluate('async()=>{const s=JSON.parse(localStorage.getItem("bjj-v1"));const m=JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/members"].list.find(m=>m.uid==="local"); return await ARROW.openAge(m.ageSealed.local,s.settings.coachAgeKeys.test.privateKey)}');assert result==date.today().year-1990-(date.today().strftime("%m-%d")<"02-01"),result
 click('tab','[data-v="home"]');click('live-start');click('sheet-save');
 for key in ['subs','tech','taps']:
  click('live-inc','[data-k="'+key+'"]');click('live-inc','[data-k="'+key+'"]'); assert not page.locator('#sheet').evaluate('(e)=>e.classList.contains("open")')
 assert len(saved()['settings']['live']['subs'])==2
 click('live-pick','[data-k="subs"]');page.locator('#pki-live-subs').fill('Armbar');page.locator('#pki-live-subs').press('Enter');assert len(saved()['settings']['live']['subs'])==2
 click('live-finish');click('sheet-save');page.wait_for_timeout(1000)
 assert page.locator('#sh-cv').count()==1,'Share did not open'
 assert len(saved()['log']['items'])==1
 assert page.evaluate('ARROW.count(JSON.parse(localStorage.getItem("bjj-v1")).log.items[0].subs)')==2
 assert page.locator('#sheet-body .foot').inner_text()=='Done';click('sheet-close')
 click('tab','[data-v="club"]');assert page.locator('.club-codes').count()==1;assert not page.locator('.club-codes').evaluate('(e)=>e.open')
 click('clubseg','[data-v="sched"]');assert 'Kids classes' in page.locator('#main').inner_text();assert 'Adult classes' in page.locator('#main').inner_text()
 click('club-sess',':not([data-i])');click('pick','[data-group="agegroup"][data-v="kids"]');page.locator('#s-n').fill('New kids');click('sheet-save');assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/profile"].schedule.at(-1).group')=='kids'
 click('clubseg','[data-v="members"]');click('club-member','[data-id="peer"]');page.locator('#f-belt').select_option('blue');click('pick','[data-group="stripes"][data-v="2"]');click('sheet-save');assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/members"].list.find(m=>m.uid==="peer").belt')=='blue'
 click('tab','[data-v="me"]');assert page.locator('.seg-hint').count()>0;assert page.locator('.cal-marks .kids').count()>0;assert page.locator('.cal-marks .openmat').count()>0
 click('arrow-day');click('sheet-close')
 for theme in ['light','dark']:
  reset(theme=theme,lang='mn');assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth');page.screenshot(path='/tmp/arrow-'+theme+'.png',full_page=True)
 reset({'settings':{'name':'Хүүхэд','username':'little','birthDate':'2017-01-01','clubId':'test'},'belt':{'track':'kids','belt':'white'}})
 assert page.locator('[data-act="homeseg"]').count()==0 and page.locator('[data-act="kudos"]').count()==0
 reset({'settings':{'name':'No Age','username':'missing'}});assert page.locator('#arrow-age').count()==1
 assert page.evaluate('ARROW.age("2013-10-07","2026-10-07")===13 && ARROW.age("2013-10-08","2026-10-07")===12 && ARROW.age("2025-02-30")===null')
 assert not errors,errors
 print('PASS mobile profile, private coach age, friends, notifications, unnamed live counts, share Done, belt, schedules, calendars, age gate, under13, light/dark, no JS errors')
 b.close()
