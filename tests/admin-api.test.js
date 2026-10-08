'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/admin.js'),config=require('../config.js');
let seq=1,identity={id:'admin',email:config.admins[0]},docs={},users={},calls=[];
const version=()=>String(seq++);
function set(path,data){docs[path]={data:structuredClone(data),updated_at:version()};}
function reset(){seq=1;calls=[];identity={id:'admin',email:config.admins[0]};docs={};users={peer:{id:'peer',email:'peer@member.bjjclub.mn',user_metadata:{name:'Дорж',username:'dorj',birthDate:'2000-01-01'},app_metadata:{secret:'never-return'},created_at:'2026-01-01'},free:{id:'free',email:'free@example.com',user_metadata:{name:'Сул',username:'freeuser',birthDate:'1990-01-01'}}};set('club/test/profile',{id:'test',n:'Club',admins:['coach'],code:'KEEP',coachCode:'KEEP2',schedule:[{d:3,t:'18:00'}],fee:{month:100000,kidsMonth:50000,drop:10000}});set('club/test/members',{list:[{id:'p',uid:'peer',n:'Дорж'},{id:'c',uid:'coach',n:'Коуч'}]});set('clubs/index',{list:[{id:'test',n:'Club'}]});set('bjj/u/peer/settings',{name:'Дорж',username:'dorj',birthDate:'2000-01-01',phone:'99112233',address:'Old address',socialKey:{privateKey:'DO NOT RETURN'},coachAgeKeys:{secret:'DO NOT RETURN'}});}
const originalFetch=global.fetch;
global.fetch=async (raw,opt={})=>{const url=new URL(raw);calls.push({url:String(raw),method:opt.method||'GET',body:opt.body&&JSON.parse(opt.body)});const body=opt.body&&JSON.parse(opt.body);const respond=(j,status=200)=>new Response(JSON.stringify(j),{status});
 if(url.pathname==='/auth/v1/user')return respond(identity);
 if(url.pathname==='/auth/v1/admin/users')return respond({users:Object.values(users),total:Object.keys(users).length});
 if(url.pathname.startsWith('/auth/v1/admin/users/')){const id=url.pathname.split('/').pop();if(!users[id])return respond({},404);if(opt.method==='PUT')users[id].user_metadata={...users[id].user_metadata,...body.user_metadata};return respond(users[id]);}
 if(url.pathname==='/rest/v1/docs'){
  if(opt.method==='POST'){if(docs[body.path])return respond({},409);set(body.path,body.data);docs[body.path].owner=body.owner;return respond(null,201);}
  const q=url.searchParams,p=q.get('path')||'',pattern=p.slice(5).split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');let rows=Object.entries(docs).filter(([path])=>p.startsWith('eq.')?path===p.slice(3):new RegExp('^'+pattern+'$').test(path));
  if(q.get('updated_at'))rows=rows.filter(([_,r])=>r.updated_at===q.get('updated_at').slice(3));
  if(opt.method==='PATCH'){for(const [path]of rows){set(path,body.data);}return respond(rows.map(([path])=>docs[path]));}
  if(q.get('order')==='updated_at.desc')rows.reverse();const offset=+(q.get('offset')||0),limit=+(q.get('limit')||1000);return respond(rows.slice(offset,offset+limit).map(([path,r])=>({path,...r})));
 }throw Error('Unexpected fetch '+url.pathname);
};
async function call(action,body,headers={authorization:'Bearer valid'}){let result;const res={setHeader(){},status(s){this.code=s;return this;},json(data){result={status:this.code,data};return result;}};await handler({method:body?'POST':'GET',url:'/api/admin?action='+action,headers,body:body?{action,...body}:undefined},res);return result;}
(async()=>{try{
 reset();delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.SUPABASE_SECRET_KEY;
 assert.equal((await call('capabilities',null,{})).status,401);identity={id:'ordinary',email:'member@example.com'};set('app/config',{admins:['member@example.com']});assert.equal((await call('capabilities')).status,403);
 identity={id:'admin',email:config.admins[0]};assert.equal((await call('capabilities')).data.accountsReady,false);assert.equal((await call('users')).status,503);
 let c=docs['club/test/profile'];assert.equal((await call('coach-change',{club:'test',uid:'coach',grant:false,version:c.updated_at})).status,400);
 assert.equal((await call('coach-change',{club:'test',uid:'peer',grant:true,version:'stale'})).status,409);
 assert.equal((await call('coach-change',{club:'test',uid:'peer',grant:true,version:c.updated_at})).status,200);assert.deepEqual(docs['club/test/profile'].data.admins,['coach','peer']);
 c=docs['club/test/profile'];assert.equal((await call('coach-change',{club:'test',uid:'coach',grant:false,version:c.updated_at})).status,200);assert.deepEqual(docs['club/test/profile'].data.admins,['peer']);assert.equal(docs['club/test/profile'].data.code,'KEEP');
 c=docs['club/test/profile'];const profile={n:'Шинэ клуб',status:'approved',open:true,month:120000,kidsMonth:60000,drop:15000,city:'УБ',bank:'Bank',account:'123'};assert.equal((await call('club-update',{club:'test',version:c.updated_at,profile})).status,200);assert.equal(docs['club/test/profile'].data.coachCode,'KEEP2');assert.equal(docs['club/test/profile'].data.schedule.length,1);assert.equal(docs['clubs/index'].data.list[0].n,'Шинэ клуб');
 assert.equal((await call('club-update',{club:'test',version:c.updated_at,profile})).status,409);
 process.env.SUPABASE_SERVICE_ROLE_KEY='server-only-test';assert.equal((await call('users')).status,200);const userList=(await call('users')).data;assert(!JSON.stringify(userList).includes('never-return'));assert.equal(userList.users.length,2);
 const user=(await call('user&id=peer')).data;assert.equal(user.profile.phone,'99112233');assert(!JSON.stringify(user).includes('DO NOT RETURN'));
 let data={id:'peer',version:user.version,profile:{name:'Болд',username:'BOLD',birthDate:'2015-01-01',phone:'',address:'Шинэ хаяг',socialAddress:'',bio:'BJJ'}};
 assert.equal((await call('user-update',{...data,version:'stale'})).status,409);assert.equal((await call('user-update',data)).status,200);const saved=docs['bjj/u/peer/settings'].data;assert.equal(saved.name,'Болд');assert.equal(saved.username,'bold');assert.deepEqual(saved.socialKey,{privateKey:'DO NOT RETURN'});assert.equal(users.peer.user_metadata.name,'Болд');const member=docs['club/test/members'].data.list.find(m=>m.uid==='peer');assert.equal(member.track,'kids');assert.equal(member.socialAllowed,false);assert.equal(member.username,'bold');
 assert.equal((await call('user-link',{id:'free',club:'test'})).status,200);assert.equal(docs['bjj/u/free/settings'].owner,'free');assert.equal(docs['bjj/u/free/settings'].data.clubId,'test');assert(docs['club/test/members'].data.list.some(m=>m.uid==='free'));
 const audit=(await call('audit')).data;assert(audit.list.some(r=>r.action==='user-update'));assert(!JSON.stringify(audit).includes('Шинэ хаяг'));
 console.log('PASS admin API: canonical JWT + trusted allowlist, no shared-config elevation, missing-key mode, last-coach guard, revision conflicts, profile/index sync, account whitelist, preserved secrets, age/social changes, linked-account owner, audit without private values');
 }finally{global.fetch=originalFetch;delete process.env.SUPABASE_SERVICE_ROLE_KEY;}})().catch(e=>{console.error(e);process.exitCode=1;});
