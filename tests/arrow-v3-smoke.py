from static_fixture import install
import json, os
from playwright.sync_api import sync_playwright
from datetime import date
ym=date.today().isoformat()[:7]
base={'settings':{'name':'Бат-Эрдэнэ','username':'batcoach','birthDate':'1990-02-01','clubId':'test','seeded':False,'phone':'99112233','address':'Ulaanbaatar district 1'},'belt':{'track':'adult','belt':'white','stripes':0}}
club={'clubs/index':{'seeded':True,'list':[{'id':'test','n':'Test Club','status':'approved'}]},'club/test/profile':{'id':'test','n':'Test Club','status':'approved','admins':['local'],'code':'ABCDEF','coachCode':'COACH123','schedule':[{'d':0,'t':'10:00','kind':'kids','n':'Kids training'},{'d':2,'t':'18:00','kind':'gi','n':'Adult training'},{'d':5,'t':'12:00','kind':'open','n':'Open mat'}]},'club/test/members':{'list':[{'id':'coach','uid':'local','n':'Бат-Эрдэнэ','username':'batcoach','socialAllowed':True,'track':'adult','belt':'white'},{'id':'peer','uid':'peer','n':'Дорж','username':'dorj','socialAllowed':True,'track':'adult','belt':'white'},{'id':'child','uid':'child','n':'Хүү','username':'little','socialAllowed':False,'track':'kids','belt':'white'}]},'club/test/notes':{'list':[{'id':'note1','d':date.today().isoformat(),'text':'Club announcement'}]},'club/test/friends':{'list':[{'id':'friend1','from':'peer','to':'local','status':'pending'}]},'club/test/feed/'+ym:{'list':[{'id':'post1','uid':'peer','n':'Дорж','d':date.today().isoformat(),'type':'gi','min':60,'kudos':[]},{'id':'postchild','uid':'child','n':'Хүү','d':date.today().isoformat(),'type':'gi','min':60,'kudos':[]}]}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(**p.devices['iPhone 13']);install(c)
 c.route('https://fonts.googleapis.com/**',lambda r:r.abort())
 c.route('https://fonts.gstatic.com/**',lambda r:r.abort())
 c.route('**/config.js',lambda r:r.fulfill(body='window.APP_CONFIG={};',content_type='application/javascript'))
 page=c.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('ARROW_TEST_URL','http://127.0.0.1:8080/'))
 def reset(data=base,theme='light',lang='en'):
  data=json.loads(json.dumps(data));data.setdefault('settings',{})['theme']=theme
  page.evaluate('(v)=>{localStorage.clear();localStorage.setItem("bjj-v1",JSON.stringify(v.data));localStorage.setItem("bjj-club-local",JSON.stringify(v.club));localStorage.setItem("bjj-lang",v.lang);localStorage.setItem("bjj-theme",v.theme)}',{'data':data,'club':club,'lang':lang,'theme':theme})
  page.reload(); page.wait_for_timeout(1000)
 def click(act,extra=''):
  selector='[data-act="'+act+'"]'+extra
  target=page.locator('#sheet-body '+selector) if page.locator('#sheet.open').count() and page.locator('#sheet-body '+selector).count() else page.locator(selector)
  target.first.click();page.wait_for_timeout(200)
 def saved():
  page.wait_for_timeout(900);return page.evaluate('JSON.parse(localStorage.getItem("bjj-v1"))')
 club['club/test/profile']['fee']={'month':100000,'kidsMonth':50000,'drop':20000,'kidsDrop':10000}
 reset()
 assert page.locator('#sync').count()==0
 assert page.evaluate('!JSON.stringify(JSON.parse(localStorage.getItem("bjj-club-local"))).includes("99112233")')
 click('tab','[data-v="club"]');click('clubseg','[data-v="pay"]')
 assert page.locator('.coach-membership').count()==1 and page.locator('[data-act="club-paynow"]').count()==0
 today=date.today().isoformat();expected=page.evaluate('(d)=>ARROW.periodEnd(d,1)',today)
 # Coach approves a member's pending request, while remaining exempt themselves.
 page.evaluate('(v)=>{const c=JSON.parse(localStorage.getItem("bjj-club-local"));c["club/test/pay/peer"]={items:[{id:"pending",d:v.today,per:v.today.slice(0,7),start:v.today,end:v.end,months:1,amt:100000,status:"pending"}]};localStorage.setItem("bjj-club-local",JSON.stringify(c));}',{'today':today,'end':expected})
 page.reload();page.wait_for_timeout(1000)
 click('arrow-notices');assert 'Payment awaiting approval' in page.locator('#sheet-body').inner_text();click('club-confirm')
 assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/pay/peer"].items[0].status')=='ok'
 assert 'Coach · Active' in page.locator('#main').inner_text()
 click('clubseg','[data-v="members"]');click('club-member','[data-id="child"]');click('coach-record-payment')
 assert page.locator('#p-amt').input_value()=='50000'
 click('sheet-save');assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/pay/child"].items[0].status')=='ok'
 click('club-edit');assert page.locator('#c-km').count()==1;page.locator('#c-km').fill('60000');click('sheet-save');assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/profile"].fee.kidsMonth')==60000
 peerkey=page.evaluate('async()=>await ARROW.newAgeKey()');page.evaluate('(key)=>{const c=JSON.parse(localStorage.getItem("bjj-club-local"));c["club/test/members"].list.find(m=>m.uid==="peer").socialPublicKey=key;localStorage.setItem("bjj-club-local",JSON.stringify(c));}',peerkey['publicKey']);page.reload();page.wait_for_timeout(1000);click('tab','[data-v="home"]');click('discover');click('arrow-friend');click('sheet-close')
 # Friends-only sessions are encrypted at rest, including when the account has no eligible recipient keys yet.
 click('tab','[data-v="home"]');click('live-start');click('sheet-save');click('live-inc','[data-k="subs"]');click('live-finish');click('pick','[data-group="audience"][data-v="friends"]');click('sheet-save');page.wait_for_timeout(1300)
 assert page.locator('.share-export [data-act="share-save"]').count()==1 and page.locator('.photo-overlay').count()==1
 for frame in ['mat','belt','ticket']:
  click('arrow-frame','[data-v="'+frame+'"]');assert page.locator('.frame-option.on').get_attribute('data-v')==frame
 page.locator('#sh-photo').set_input_files({'name':'mat.png','mimeType':'image/png','buffer':page.screenshot()});page.wait_for_timeout(250)
 designs=[]
 for frame in ['mat','belt','ticket']:
  click('arrow-frame','[data-v="'+frame+'"]');designs.append(page.locator('#sh-cv').evaluate('(e)=>e.toDataURL()'))
 assert len(set(designs))==3
 page.screenshot(path='/tmp/arrow-share-v3.png',full_page=True)
 assert page.locator('#sh-cv').evaluate('(e)=>e.width===1080 && e.height===1920')
 click('pick','[data-group="fmt"][data-v="post"]');assert page.locator('#sh-cv').evaluate('(e)=>e.height===1350')
 click('sheet-close')
 post=page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/feed/"+new Date().toISOString().slice(0,7)].list.find(p=>p.uid==="local")');assert post['audience']=='friends' and 'sealed' in post and 'min' not in post;assert page.evaluate('async(v)=>(await ARROW.openPayload(v.post.sealed,"peer",v.key)).min===5',{'post':post,'key':peerkey['privateKey']})
 assert page.locator('.feed [data-uid="local"]').count()==1
 assert page.locator('.post-audience[aria-label="Friends"]').count()==1
 assert page.evaluate('async(p)=>await ARROW.openPayload(p.sealed,"outsider",JSON.parse(localStorage.getItem("bjj-v1")).settings.socialKey.privateKey)===null',post)
 # Private sessions never create social posts.
 click('live-start');click('sheet-save');click('live-finish');click('pick','[data-group="audience"][data-v="private"]');click('sheet-save');page.wait_for_timeout(800);click('sheet-close')
 assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/feed/"+new Date().toISOString().slice(0,7)].list.filter(p=>p.uid==="local").length')==1
 # Regular members cannot edit rank; 15-year-olds see children-only dates and plans.
 club['club/test/profile']['admins']=['peer']
 child={'settings':{'name':'Хүүхэд','username':'teenager','birthDate':str(date.today().year-15)+'-01-01','clubId':'test','phone':'99112233','address':'Ulaanbaatar district 1'}}
 reset(child)
 click('tab','[data-v="me"]');assert page.locator('.cal-marks .adult').count()==0 and page.locator('.cal-marks .kids').count()>0
 click('segview','[data-v="belt"]');assert page.locator('[data-act="edit-belt"],[data-act="add-promo"],[data-act="belttrack"]').count()==0
 click('tab','[data-v="club"]');click('clubseg','[data-v="pay"]');assert '50,000' in page.locator('#main').inner_text() and '100,000' not in page.locator('#main').inner_text()
 click('club-paynow');click('sheet-save');assert page.evaluate('JSON.parse(localStorage.getItem("bjj-club-local"))["club/test/pay/local"].items[0].track')=='kids'
 for theme in ['light','dark']:
  reset(theme=theme,lang='mn');click('profile');click('profile-edit');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.evaluate('document.documentElement.dataset.theme')==theme;page.screenshot(path='/tmp/arrow-profile-v3-'+theme+'.png',full_page=True)
  assert page.locator('#f-name').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=16');click('sheet-close')
 assert not errors,errors
 print('PASS V3: fixed payment dates, separate child/adult fees and schedules, coach approval and logging, private contacts, encrypted friends posts, private sessions, three story frames, no self belt editing, mobile layouts')
 b.close()
