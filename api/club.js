'use strict';
const config=require('../config.js'),A=require('../arrow-core.js'),publicClub=require('../club-public.js');
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v),fail=(status,message)=>Object.assign(new Error(message),{status});
module.exports=async function(req,res){
 res.setHeader('Cache-Control','private, no-store');const authorization=req.headers.authorization||'';if(!/^Bearer \S+$/.test(authorization))return res.status(401).json({error:'Sign in required'});
 let body=req.body||{};try{if(typeof body==='string')body=JSON.parse(body);}catch(_){return res.status(400).json({error:'Invalid request'});}const q=new URL(req.url,'https://arrowbjjapp.vercel.app').searchParams,action=q.get('action')||body.action,club=q.get('club')||body.club;
 if(!id(club)||!['profile','update','review','review-remove','member-remove','member-restore'].includes(action))return res.status(400).json({error:'Invalid request'});if(req.method!==(action==='profile'?'GET':'POST'))return res.status(405).json({error:'Method not allowed'});
 const headers={apikey:config.supabaseAnonKey,Authorization:authorization};
 async function request(path,opt={}){const r=await fetch(config.supabaseUrl+path,{...opt,headers:{...headers,...opt.headers},signal:AbortSignal.timeout(15000)});if(!r.ok)throw fail([401,403,409].includes(r.status)?r.status:502,'Request failed');return r.status===204?null:r.json();}
 const rows=p=>request('/rest/v1/docs?'+new URLSearchParams({select:'data,updated_at',path:'eq.'+p}));const doc=async p=>(await rows(p))[0]?.data;
 const put=(p,data,version)=>request('/rest/v1/docs'+(version?'?'+new URLSearchParams({path:'eq.'+p,updated_at:'eq.'+version}):''),{method:version?'PATCH':'POST',headers:{'Content-Type':'application/json',Prefer:version?'return=representation':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(version?{data,updated_at:new Date().toISOString()}:{path:p,data,updated_at:new Date().toISOString()})});
 try{
  const actor=await request('/auth/v1/user'),base='club/'+club+'/';const [record,members]=await Promise.all([rows(base+'profile'),doc(base+'members')]);const current=record[0];if(!current?.data||current.data.status==='rejected')throw fail(404,'Club unavailable');const p=current.data,superUser=(config.admins||[]).concat((process.env.ARROW_ADMIN_EMAILS||'').split(',')).some(v=>v.trim().toLowerCase()===String(actor.email||'').toLowerCase()),coach=(p.admins||[]).includes(actor.id),member=(members?.list||[]).find(m=>m.uid===actor.id);
  const publicProfile=()=>{const result=publicClub.project(p);const coaches=(members?.list||[]).filter(m=>(p.admins||[]).includes(m.uid));const linked=new Set(result.teachers.map(t=>t.uid).filter(Boolean));for(const m of coaches)if(!linked.has(m.uid))result.teachers.push({id:'account-'+m.uid,uid:m.uid,name:m.n||m.username||'Coach',belt:m.belt||'',photo:publicClub.image(m.av),bio:'',achievements:''});return result;};
  if(action==='profile'){
   const reviews=await request('/rest/v1/docs?'+new URLSearchParams({select:'data',path:'like.'+base+'reviews/*',order:'updated_at.desc',limit:'1000'}));const visible=reviews.map(r=>r.data).filter(r=>r.rating>=1&&r.rating<=5);return res.status(200).json({profile:publicProfile(),version:current.updated_at,canEdit:coach||superUser,canReview:!!member,reviews:visible.slice(0,20).map(r=>({uid:r.uid,username:r.username,rating:r.rating,comment:r.comment,t:r.t})),reviewCount:visible.length,rating:visible.length?visible.reduce((n,r)=>n+r.rating,0)/visible.length:0,myReview:visible.find(r=>r.uid===actor.id)||null});
  }
  if(action==='update'){
   if(!coach&&!superUser)throw fail(403,'Coach only');if(!body.version||body.version!==current.updated_at)throw fail(409,'Club changed. Open the editor again.');const cleaned=publicClub.clean(body.profile||{});for(const t of cleaned.teachers)if(!(p.admins||[]).includes(t.uid))t.uid='';const data={...p,...cleaned};const changed=await put(base+'profile',data,current.updated_at);if(!changed.length)throw fail(409,'Club changed. Open the editor again.');
   // The small logo travels with directory entries; galleries remain on the individual profile.
   for(let attempt=0;attempt<3;attempt++){const entry=(await rows('clubs/index'))[0];if(!entry)break;const index={...entry.data,list:(entry.data.list||[]).map(c=>c.id===club?{...c,logo:cleaned.logo}:c)};if((await put('clubs/index',index,entry.updated_at)).length)break;}
   return res.status(200).json({ok:true,profile:publicClub.project(data)});
  }
  if(action==='member-remove'){
   if(!coach&&!superUser)throw fail(403,'Coach only');if(!id(body.id))throw fail(400,'Invalid member');
   for(let attempt=0;attempt<4;attempt++){const row=(await rows(base+'members'))[0];if(!row)throw fail(404,'Member unavailable');const target=(row.data.list||[]).find(m=>m.id===body.id||m.uid===body.id);if(!target)return res.status(200).json({ok:true});if((p.admins||[]).includes(target.uid))throw fail(400,'Remove coach role before removing this member');const key=target.uid||target.id;const data={...row.data,list:row.data.list.filter(m=>m!==target),removed:{...row.data.removed,[key]:{at:Date.now(),by:actor.id,member:target}}};if((await put(base+'members',data,row.updated_at)).length)return res.status(200).json({ok:true});}throw fail(409,'Members changed. Try again.');
  }
  if(action==='member-restore'){
   if(!coach&&!superUser)throw fail(403,'Coach only');if(!id(body.id))throw fail(400,'Invalid member');for(let attempt=0;attempt<4;attempt++){const row=(await rows(base+'members'))[0],target=row?.data?.removed?.[body.id]?.member;if(!target)throw fail(404,'Archived member unavailable');const data=structuredClone(row.data);if(!data.list.some(m=>(m.uid||m.id)===body.id))data.list.push(target);delete data.removed[body.id];if((await put(base+'members',data,row.updated_at)).length)return res.status(200).json({ok:true});}throw fail(409,'Members changed. Try again.');
  }
  if(action==='review-remove'){await put(base+'reviews/'+actor.id,{uid:actor.id,rating:0,comment:'',t:Date.now()});return res.status(200).json({ok:true});}
  if(action==='review'){
   const settings=await doc('bjj/u/'+actor.id+'/settings');if(!member||A.age(settings?.birthDate)===null||A.age(settings?.birthDate)<13)throw fail(403,'Adult social account and club membership required');const rating=Number(body.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw fail(400,'Choose 1 to 5 stars');await put(base+'reviews/'+actor.id,{uid:actor.id,username:A.username(settings.username)||'member',rating,comment:String(body.comment||'').trim().slice(0,600),t:Date.now()});return res.status(200).json({ok:true});
  }
 }catch(e){return res.status(e.status||502).json({error:e.status?e.message:'Could not complete club request'});}
};
