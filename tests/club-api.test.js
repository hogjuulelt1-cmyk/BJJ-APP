'use strict';
const assert=require('node:assert/strict'),handler=require('../api/club'),config=require('../config');
let who={id:'coach',email:'coach@example.com'},conflict=false;
const docs={
 'club/test/profile':{id:'test',n:'Test',admins:['coach'],code:'PRIVATE_CODE',coachCode:'PRIVATE_COACH',ageKeys:{coach:'PRIVATE_KEY'},pay:{account:'PRIVATE_BANK'},status:'approved',open:true},
 'club/other/profile':{id:'other',n:'Other',admins:['other-coach'],status:'approved'},
 'club/test/members':{list:[{id:'coach-id',uid:'coach'},{id:'member-id',uid:'member'},{id:'child-id',uid:'child'}]},
 'clubs/index':{list:[{id:'test',n:'Test'}]},
 'bjj/u/member/settings':{birthDate:'2000-01-01',username:'member'},
 'bjj/u/child/settings':{birthDate:new Date().getUTCFullYear()-10+'-01-01',username:'child'}
};
const versions=new Map();
global.fetch=async(url,opt={})=>{assert.equal(opt.headers.Authorization,'Bearer fixture');const u=new URL(url),q=u.searchParams,path=(q.get('path')||'').slice(3);const answer=x=>new Response(JSON.stringify(x),{status:200});
 if(u.pathname==='/auth/v1/user')return answer(who);
 if(opt.method==='PATCH'){if(conflict){conflict=false;return answer([]);}docs[path]=JSON.parse(opt.body).data;versions.set(path,JSON.parse(opt.body).updated_at);return answer([{data:docs[path]}]);}
 if(opt.method==='POST'){const b=JSON.parse(opt.body);docs[b.path]=b.data;return answer([]);}
 if(q.get('path')?.startsWith('like.'))return answer(Object.entries(docs).filter(([p])=>p.startsWith(q.get('path').slice(5,-1))).map(([path,data])=>({path,data})));
 return answer(docs[path]?[{data:structuredClone(docs[path]),updated_at:versions.get(path)||'v1'}]:[]);
};
async function call(action,data,club='test',authenticated=true){const r={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};await handler({method:action==='profile'?'GET':'POST',url:'/api/club?'+new URLSearchParams({club,action}),headers:authenticated?{authorization:'Bearer fixture'}:{},body:data||{}},r);return r;}
(async()=>{
 assert.equal((await call('profile',null,'test',false)).code,401);
 let r=await call('profile');assert.equal(r.code,200);assert(r.data.canEdit);assert(r.data.profile.teachers.some(t=>t.uid==='coach'));for(const secret of ['PRIVATE_CODE','PRIVATE_COACH','PRIVATE_KEY','PRIVATE_BANK'])assert(!JSON.stringify(r.data).includes(secret));
 who={id:'member',email:'member@example.com'};assert.equal((await call('update',{version:'v1',profile:{about:'Denied'}})).code,403);assert.equal((await call('member-remove',{id:'child'})).code,403);
 who={id:'coach',email:'coach@example.com'};assert.equal((await call('update',{version:'v1',profile:{}},'other')).code,403);assert.equal((await call('update',{version:'stale',profile:{}})).code,409);
 r=await call('update',{version:'v1',profile:{about:'Academy',logo:'data:image/png;base64,YQ==',website:'javascript:alert(1)',admins:['member'],code:'REPLACE',gallery:[{id:'g',kind:'team',photo:'data:image/jpeg;base64,YQ==',caption:'Team'}],teachers:[{id:'t',uid:'member',name:'Coach',bio:'Biography'}]}});assert.equal(r.code,200);assert.equal(r.data.profile.website,'');assert.equal(docs['club/test/profile'].teachers[0].uid,'');assert.equal(docs['club/test/profile'].code,'PRIVATE_CODE');assert.deepEqual(docs['club/test/profile'].admins,['coach']);assert.equal(docs['clubs/index'].list[0].logo,'data:image/png;base64,YQ==');
 assert.equal((await call('member-remove',{id:'coach-id'})).code,400);conflict=true;assert.equal((await call('member-remove',{id:'member-id'})).code,200);assert(!docs['club/test/members'].list.some(m=>m.uid==='member'));assert(docs['club/test/members'].removed.member);assert(docs['bjj/u/member/settings']);assert.equal((await call('member-restore',{id:'member'})).code,200);assert(docs['club/test/members'].list.some(m=>m.uid==='member'));assert(!docs['club/test/members'].removed.member);
 who={id:'child',email:'child@example.com'};assert.equal((await call('review',{rating:5,comment:'No'})).code,403);
 who={id:'outsider',email:'outsider@example.com'};assert.equal((await call('review',{rating:5})).code,403);
 who={id:'member',email:'member@example.com'};assert.equal((await call('review',{rating:6})).code,400);assert.equal((await call('review',{rating:4,comment:'Great',uid:'coach'})).code,200);assert(!docs['club/test/reviews/coach']);r=await call('profile');assert.equal(r.data.rating,4);assert.equal(r.data.reviewCount,1);assert.equal(r.data.reviews[0].username,'member');assert.equal((await call('review-remove',{})).code,200);assert.equal((await call('profile')).data.reviewCount,0);
 console.log('PASS club API: canonical identity, private projection, coach scope, revision guard, logo sync, member removal/restore, coach protection and age/owner review checks');
})().catch(e=>{console.error(e);process.exitCode=1;});
