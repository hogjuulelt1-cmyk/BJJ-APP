'use strict';
const assert=require('node:assert/strict');
const helper=require('../check-in.js');
const handler=require('../api/check-in.js');
const realNow=Date.now;
const start=Date.parse('2026-10-08T10:00:00Z'); // Thursday 18:00 in Ulaanbaatar.
const schedule=[{d:3,t:'18:00',kind:'gi'}];
for(const [offset,valid] of [[-3600001,false],[-3600000,true],[0,true],[2400000,true],[2400001,false]])assert.equal(!!helper.windowFor(schedule,'adult',start+offset,'Asia/Ulaanbaatar',false),valid);
assert.equal(helper.windowFor(schedule,'kids',start,'Asia/Ulaanbaatar',false),null);
assert.ok(helper.windowFor([{d:3,t:'18:00',kind:'open'}],'kids',start,'Asia/Ulaanbaatar',false));
assert.ok(helper.windowFor([{d:3,t:'18:00',kind:'kids'}],'adult',start,'Asia/Ulaanbaatar',true));
assert.equal(helper.windowFor(schedule,'adult',start+86400000,'Asia/Ulaanbaatar',false),null);
assert.equal(helper.windowFor([{d:6,t:'00:10',kind:'open'}],'adult',Date.parse('2026-10-31T15:20:00Z'),'Asia/Ulaanbaatar',false).date,'2026-11-01');
let docs,writes,user='me',conflict=false;
function reset(){docs={'club/test/profile':{code:'ABCDEF',admins:['coach'],schedule},'club/test/members':{list:[{uid:'me'}]},'bjj/u/me/settings':{birthDate:'1990-01-01'},'club/test/att/2026-10':{days:{'2026-10-08':['existing']}}};writes=0;user='me';}
global.fetch=async(url,opt)=>{
 assert.equal(opt.headers.Authorization,'Bearer fixture-token');const u=new URL(url),method=opt.method||'GET';
 if(u.pathname==='/auth/v1/user')return{ok:true,json:async()=>({id:user})};
 const path=u.searchParams.get('path')?.slice(3);
 if(method==='GET')return{ok:true,json:async()=>docs[path]?[{data:structuredClone(docs[path]),updated_at:'2026-10-08T09:00:00Z'}]:[]};
 if(method==='PATCH'&&conflict){conflict=false;docs[path].days['2026-10-08'].push('concurrent');return{ok:true,json:async()=>[]};}
 const body=JSON.parse(opt.body),key=path||body.path;docs[key]=body.data;writes++;return{ok:true,status:201,json:async()=>[{data:body.data}]};
};
async function request(offset=0,body={club:'test',code:'ABCDEF',now:'2099-01-01'},auth='Bearer fixture-token'){
 Date.now=()=>start+offset;let status,data;const res={setHeader(){},status(s){status=s;return this;},json(d){data=d;return this;}};await handler({method:'POST',headers:{authorization:auth},body},res);return{status,data};
}
(async()=>{
 reset();let r=await request(0,undefined,'');assert.equal(r.status,401);assert.equal(writes,0);
 reset();r=await request(-3600001);assert.equal(r.status,409);assert.equal(writes,0);
 reset();r=await request(2400001);assert.equal(r.status,409);assert.equal(writes,0);
 reset();r=await request(0,{club:'test',code:'WRONG'});assert.equal(r.status,403);assert.equal(writes,0);
 reset();user='outsider';r=await request();assert.equal(r.status,403);
 reset();docs['bjj/u/me/settings'].birthDate='2017-01-01';r=await request();assert.equal(r.status,409);assert.equal(writes,0);
 reset();conflict=true;r=await request(-3600000);assert.equal(r.status,200);assert.equal(r.data.date,'2026-10-08');assert.deepEqual(r.data.attendance.days['2026-10-08'],['existing','concurrent','me']);assert.equal(writes,1);
 r=await request(2400000);assert.equal(r.status,200);assert.equal(r.data.already,true);assert.equal(writes,1);
 console.log('PASS check-in API: exact inclusive time boundaries, timezone/midnight, age tracks, open mat, coach classes, server clock, JWT/code/membership, concurrent scans and idempotency');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>Date.now=realNow);
