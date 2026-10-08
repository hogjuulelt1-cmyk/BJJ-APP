/* Offline endpoint checks: real handler, fake Supabase documents, no live writes. */
'use strict';
const assert = require('node:assert/strict');
const handler = require('../api/feed.js');
const paging = require('../feed-page.js');
const month = new Date().toISOString().slice(0,7);
const previous = new Date(new Date().getFullYear(),new Date().getMonth()-1,1).toISOString().slice(0,7);
const prefix='club/test/feed/';
let allowed=true, user='me', upstreamError=false, calls=[];
const posts=Array.from({length:31},(_,i)=>({id:'post-'+String(i).padStart(2,'0'),uid:i===0?'friend':'me',d:month+'-01',t:1000+i,audience:i===0?'friends':'public',...(i===0?{sealed:{cipher:'opaque',keys:{friend:'wrapped'}}}:{min:60})}));
const docs={
 'club/test/members':{list:[{uid:'me',socialAllowed:true},{uid:'child',socialAllowed:false}]},
 [prefix+month]:{list:posts},
 [prefix+previous]:{list:[{id:'older',uid:'me',d:previous+'-01',t:1}]}
};
global.fetch=async(url,opt)=>{
 calls.push({url,opt});
 assert.equal(opt.headers.Authorization,'Bearer fixture-token');
 const u=new URL(url);
 if(upstreamError)return {ok:false,status:500};
 let data;
 if(u.pathname==='/auth/v1/user')data={id:user};
 else if(u.searchParams.get('select')==='path') {
  const bound=u.searchParams.get('and').match(/path\.lte\.([^)]*)/)[1];
  data=Object.keys(docs).filter(k=>k.startsWith(prefix)&&k<=bound).sort().reverse().map(path=>({path}));
 }else{const path=u.searchParams.get('path').slice(3);data=docs[path]?[{data:docs[path]}]:[];}
 return {ok:true,status:200,json:async()=>data};
};
async function request(query='',authorization='Bearer fixture-token',method='GET'){
 let status,body,headers={};
 const res={setHeader(k,v){headers[k]=v;},status(s){status=s;return this;},json(b){body=b;return this;}};
 await handler({url:'/api/feed?club=test'+query,method,headers:{authorization}},res);
 return {status,body,headers};
}
(async()=>{
 let r=await request('','');assert.equal(r.status,401);assert.equal(calls.length,0);
 r=await request('','','POST');assert.equal(r.status,405);
 r=await request('&cursor=bad');assert.equal(r.status,400);
 user='outsider';r=await request();assert.equal(r.status,403);
 user='child';r=await request();assert.equal(r.status,403);
 user='me';calls=[];
 r=await request();assert.equal(r.status,200);assert.equal(r.body.posts.length,12);assert.equal(r.headers['Cache-Control'],'private, no-store');
 assert.equal(calls.filter(c=>new URL(c.url).searchParams.get('path')=== 'eq.'+prefix+previous).length,0,'older month must not load initially');
 const received=[...r.body.posts];let next=r.body.next;
 // New posts between pages must not shift the cursor or create duplicates.
 docs[prefix+month].list.push({id:'later',uid:'me',d:month+'-01',t:Date.now()+1000});
 while(next){r=await request('&cursor='+encodeURIComponent(JSON.stringify(next)));assert.equal(r.status,200);assert.ok(r.body.posts.length<=12);received.push(...r.body.posts);next=r.body.next;}
 assert.equal(received.length,32);assert.equal(new Set(received.map(p=>p.id)).size,32);assert.equal(received.at(-1).id,'older');assert.ok(!received.some(p=>p.id==='later'));
 const friend=received.find(p=>p.id==='post-00');assert.ok(friend.sealed);assert.ok(!('min' in friend),'friend content stays encrypted');
 upstreamError=true;r=await request();assert.equal(r.status,502);
 assert.throws(()=>paging.cursor({month:'2026-99',asOf:1000}));
 console.log('PASS feed API: authentication, membership/child restriction, 12-post responses, older-month deferral, stable cursors, encrypted payloads, errors');
})().catch(e=>{console.error(e);process.exitCode=1;});
