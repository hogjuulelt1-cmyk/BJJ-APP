/* Authenticated community projections. Uses the caller JWT; private profile fields stay in owner docs. */
'use strict';
const config=require('../config.js');
const safeId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
module.exports=async function(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const auth=req.headers.authorization||'';if(!/^Bearer \S+$/.test(auth))return res.status(401).json({error:'Sign in required'});
 const q=new URL(req.url,'https://arrowbjjapp.vercel.app').searchParams;let body=req.body||{};
 try{if(typeof body==='string')body=JSON.parse(body);}catch(_){return res.status(400).json({error:'Invalid request'});}
 const club=q.get('club')||body.club,action=q.get('action')||body.action;
 if(!safeId(club)||!['profile','publish','leaderboard','partners','partner-save','remove'].includes(action))return res.status(400).json({error:'Invalid request'});
 if(req.method!==( ['publish','partner-save','remove'].includes(action)?'POST':'GET'))return res.status(405).json({error:'Method not allowed'});
 const headers={apikey:config.supabaseAnonKey,Authorization:auth};
 async function request(path,opt){const r=await fetch(config.supabaseUrl+path,{...opt,headers:{...headers,...opt?.headers},signal:AbortSignal.timeout(15000)});if(!r.ok){const e=new Error('Upstream failed');e.status=[401,403,409].includes(r.status)?r.status:502;throw e;}return r.status===204?[]:r.json();}
 const rows=path=>request('/rest/v1/docs?'+new URLSearchParams({select:'data,updated_at',path:'eq.'+path}));
 const doc=async path=>(await rows(path))[0]?.data;
 const list=(prefix,extra={})=>request('/rest/v1/docs?'+new URLSearchParams({select:'path,data',path:'like.'+prefix+'*',...extra}));
 const set=(path,data)=>request('/rest/v1/docs',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({path,data,updated_at:new Date().toISOString()})});
 async function change(path,fn){for(let n=0;n<4;n++){const row=(await rows(path))[0];if(!row)return;const data=fn(row.data);const changed=await request('/rest/v1/docs?'+new URLSearchParams({path:'eq.'+path,updated_at:'eq.'+row.updated_at}),{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({data,updated_at:new Date().toISOString()})});if(changed.length)return;}const e=new Error('Retry');e.status=409;throw e;}
 try{
  const user=await request('/auth/v1/user'),base='club/'+club+'/';const members=await doc(base+'members'),me=(members?.list||[]).find(m=>m.uid===user.id);
  if(!me)return res.status(403).json({error:'Club membership required'});
  const social=me.socialAllowed===true;
  if(['profile','leaderboard','publish'].includes(action)&&!social)return res.status(403).json({error:'Social unavailable'});
  if(action==='publish'){
   const [settings,log,comp]=await Promise.all(['settings','log','comp'].map(k=>doc('bjj/u/'+user.id+'/'+k)));
   const show=Object.fromEntries(['workouts','scores','competition','friends'].map(k=>[k,settings?.profileVisibility?.[k]!==false]));
   const data={uid:user.id,show,bio:String(settings?.bio||'').slice(0,300),updatedAt:Date.now()};
   if(show.workouts)data.workouts=(log?.items||[]).filter(s=>(s.audience||'public')==='public').sort((a,b)=>b.d.localeCompare(a.d)).slice(0,30).map(s=>({id:s.id,d:s.d,type:s.type,min:s.min,rounds:s.rolls||0}));
   if(show.competition)data.competition=(comp?.events||[]).slice(-30).map(e=>({n:String(e.n||'').slice(0,150),d:e.d,medal:e.medal||'',div:String(e.div||'').slice(0,100)}));
   await set(base+'profiles/'+user.id,data);return res.status(200).json({ok:true});
  }
  if(action==='profile'){
   const id=q.get('uid');if(!safeId(id))return res.status(400).json({error:'Invalid member'});const m=(members.list||[]).find(x=>x.uid===id&&x.socialAllowed===true);if(!m)return res.status(404).json({error:'Profile unavailable'});
   const [p,clubProfile,friends]=await Promise.all([doc(base+'profiles/'+id),doc(base+'profile'),doc(base+'friends')]);const show={workouts:true,scores:true,competition:true,friends:true,...p?.show};
   const profile={uid:id,username:m.username||'member',av:m.av||'',belt:m.belt||'white',stripes:m.stripes||0,club:clubProfile?.n||club,bio:p?.bio||'',show};
   if(show.workouts)profile.workouts=p?.workouts||[];if(show.competition)profile.competition=p?.competition||[];
   if(show.friends)profile.friends=(friends?.list||[]).filter(r=>r.status==='accepted'&&(r.from===id||r.to===id)).map(r=>r.from===id?r.to:r.from).map(uid=>(members.list||[]).find(m=>m.uid===uid&&m.socialAllowed===true)).filter(Boolean).map(m=>({uid:m.uid,username:m.username||'member',av:m.av||''}));
   return res.status(200).json({profile});
  }
  if(action==='leaderboard'){
   const month=new Date().toISOString().slice(0,7),previous=new Date(new Date().getUTCFullYear(),new Date().getUTCMonth()-1,1).toISOString().slice(0,7);const months=q.get('period')==='all'?[month,previous]:[month];
   const [feeds,profiles]=await Promise.all([Promise.all(months.map(m=>doc(base+'feed/'+m))),list(base+'profiles/')]);const visibility=new Map(profiles.map(r=>[r.data.uid,r.data.show?.scores!==false]));const allowed=new Map((members.list||[]).filter(m=>m.socialAllowed===true&&visibility.get(m.uid)!==false).map(m=>[m.uid,m]));const totals=new Map();const seen=new Set();
   for(const feed of feeds)for(const p of feed?.list||[]){if(!allowed.has(p.uid)||p.sealed||p.audience==='friends'||p.audience==='private'||seen.has(p.uid+':'+p.id))continue;seen.add(p.uid+':'+p.id);let r=totals.get(p.uid);if(!r){const m=allowed.get(p.uid);r={uid:p.uid,n:'@'+(m.username||'member'),av:m.av||'',belt:m.belt||'white',sessions:0,min:0,rounds:0,subs:0,kudos:0,streak:0};totals.set(p.uid,r);}r.sessions++;for(const k of ['min','rounds','subs'])r[k]+=Math.max(0,Number(p[k])||0);r.kudos+=(p.kudos||[]).length;r.streak=Math.max(r.streak,Number(p.weeks)||0);}
   return res.status(200).json({rows:[...totals.values()],month});
  }
  if(action==='partner-save'){
   const s=body.session;if(!s||!safeId(s.id)||!/^\d{4}-\d{2}-\d{2}$/.test(s.d||'')||!(+s.min>0&&+s.min<=1440)||!['gi','nogi','open','priv','drill','comp'].includes(s.type)||(s.with!==undefined&&!Array.isArray(s.with)))return res.status(400).json({error:'Invalid session'});
   const participants=[...new Set((s.with||[]).filter(id=>id!==user.id&&(members.list||[]).some(m=>m.uid===id)))].slice(0,100);
   const data={id:s.id,owner:user.id,participants,d:s.d,min:+s.min,type:s.type,rounds:Math.max(0,Math.min(999,+s.rolls||0)),t:Date.now()};await set(base+'partner-sessions/'+user.id+'_'+s.id,data);return res.status(200).json({ok:true});
  }
  if(action==='partners'){
   // Participant filter is applied in Supabase, before pagination; never return teammates' unrelated records.
   let before;try{before=q.get('before')?JSON.parse(q.get('before')):null;}catch(_){return res.status(400).json({error:'Invalid cursor'});}
   if(before&&(!/^\d{4}-\d{2}-\d{2}$/.test(before.d||'')||!safeId(before.key)))return res.status(400).json({error:'Invalid cursor'});
   const extra={'data->participants':'cs.'+JSON.stringify([user.id]),order:'data->>d.desc,path.desc',limit:'31'};
   if(before)extra.or='(data->>d.lt.'+before.d+',and(data->>d.eq.'+before.d+',path.lt.'+base+'partner-sessions/'+before.key+'))';
   const records=await list(base+'partner-sessions/',extra),last=records[29];return res.status(200).json({items:records.slice(0,30).map(r=>r.data).filter(s=>s.owner!==user.id&&(s.participants||[]).includes(user.id)),next:records.length>30?JSON.stringify({d:last.data.d,key:last.path.slice((base+'partner-sessions/').length)}):null});
  }
  if(action==='remove'){
   const id=body.id,d=body.d;if(!safeId(id)||!/^\d{4}-\d{2}-\d{2}$/.test(d||''))return res.status(400).json({error:'Invalid session'});
   const path=base+'feed/'+d.slice(0,7);await change(path,data=>{const p=(data.list||[]).find(p=>p.id===id);if(p&&p.uid!==user.id){const e=new Error('Not owner');e.status=403;throw e;}return {...data,list:(data.list||[]).filter(p=>p.id!==id||p.uid!==user.id)};});
   if(!body.keepPartners)await set(base+'partner-sessions/'+user.id+'_'+id,{id,owner:user.id,participants:[],d,min:0,type:'gi'});return res.status(200).json({ok:true});
  }
 }catch(e){return res.status(e.status||502).json({error:e.status===403?'Not permitted':e.status===409?'Please try again':'Could not complete request'});}
};
