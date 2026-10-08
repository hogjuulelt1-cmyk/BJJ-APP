/* Privileged account access lives only in this function. Never expose the server key. */
'use strict';
const config=require('../config.js');
const A=require('../arrow-core.js');
const {randomUUID,webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const clean=(v,max=200)=>String(v||'').trim().slice(0,max);
const PROFILE_FIELDS=['name','username','birthDate','phone','address','socialAddress','bio'];
module.exports=async function admin(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'});}
 const bearer=req.headers.authorization||'';if(!/^Bearer \S+$/.test(bearer))return res.status(401).json({error:'Sign in required'});
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY||'';
 const url=process.env.SUPABASE_URL||config.supabaseUrl;
 const anon={apikey:config.supabaseAnonKey,Authorization:bearer};
 const privileged=secret?{apikey:secret,Authorization:'Bearer '+secret}:anon;
 async function request(path,opt={},headers=privileged){
  const r=await fetch(url+path,{...opt,headers:{...headers,...opt.headers},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw fail(r.status===401?401:r.status===409?409:502,r.status===409?'Өөрчлөлт давхцлаа. Шинэчлээд дахин оролдоно уу.':'Мэдээллийн сервертэй холбогдож чадсангүй.');
  return r.status===204?null:r.json().catch(()=>null);
 }
 async function row(path){const rows=await request('/rest/v1/docs?'+new URLSearchParams({select:'data,updated_at',path:'eq.'+path}));return rows[0]||{data:null,updated_at:null};}
 async function rows(pattern){const all=[];for(let offset=0;offset<20000;offset+=1000){const batch=await request('/rest/v1/docs?'+new URLSearchParams({select:'path,data,updated_at',path:'like.'+pattern,order:'path.asc',limit:'1000',offset:String(offset)}));all.push(...batch);if(batch.length<1000)return all;}throw fail(503,'Мэдээллийн хэмжээ их байна. Админтай холбогдоно уу.');}
 async function put(path,data,version){
  if(version){const found=await request('/rest/v1/docs?'+new URLSearchParams({path:'eq.'+path,updated_at:'eq.'+version}),{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({data,updated_at:new Date().toISOString()})});if(!found.length)throw fail(409,'Өөрчлөлт давхцлаа. Шинэчлээд дахин оролдоно уу.');}
  else await request('/rest/v1/docs',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({path,data,owner:actor.id,updated_at:new Date().toISOString()})});
 }
 let actor;
 try{
  actor=await request('/auth/v1/user',{},anon);
  const allowed=(config.admins||[]).concat((process.env.ARROW_ADMIN_EMAILS||'').split(',')).map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!actor?.id||!allowed.includes(String(actor.email||'').toLowerCase()))throw fail(403,'Зөвхөн аппын админ ашиглана.');
  const q=new URL(req.url,'https://arrowbjjapp.vercel.app').searchParams;
  let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body);}catch(_){throw fail(400,'Invalid JSON');}}
  const action=req.method==='GET'?q.get('action'):body.action;
  const requireSecret=()=>{if(!secret)throw fail(503,'Бүх бүртгэлийг удирдах серверийн эрх тохируулаагүй байна. Клубийн гишүүдийг харж, клуб болон коучийн эрхийг удирдаж болно.');};
  const audit=async(target,details={})=>{try{await put('bjj/u/'+actor.id+'/admin-audit/'+randomUUID(),{action,target,actor:actor.id,at:new Date().toISOString(),...details},null);return true;}catch(_){return false;}};
  if(action==='capabilities')return res.status(200).json({accountsReady:!!secret,auditScope:secret?'all':'own',admin:true});
  if(action==='users'&&req.method==='GET'){
   requireSecret();const page=Number(q.get('page')||1);if(!Number.isInteger(page)||page<1||page>10000)throw fail(400,'Invalid page');
   const data=await request('/auth/v1/admin/users?page='+page+'&per_page=50');const batch=(data.users||[]).slice(0,50),ids=batch.map(u=>u.id).filter(safeId);const settings=ids.length?await request('/rest/v1/docs?'+new URLSearchParams({select:'path,data',path:'in.('+ids.map(id=>'bjj/u/'+id+'/settings').join(',')+')'})):[];const profiles=new Map(settings.map(r=>[r.path.split('/')[2],r.data]));const users=batch.map(u=>({id:u.id,email:u.email||'',name:profiles.get(u.id)?.name||u.user_metadata?.name||'',username:profiles.get(u.id)?.username||u.user_metadata?.username||'',createdAt:u.created_at,lastSignIn:u.last_sign_in_at,confirmed:!!u.email_confirmed_at}));
   return res.status(200).json({users,page,hasMore:users.length===50,total:data.total??null});
  }
  if(action==='user'&&req.method==='GET'){
   requireSecret();const id=q.get('id');if(!safeId(id))throw fail(400,'Invalid user');const [raw,settings]=await Promise.all([request('/auth/v1/admin/users/'+id),row('bjj/u/'+id+'/settings')]);const user=raw.user||raw;const profile={};for(const k of PROFILE_FIELDS)profile[k]=settings.data?.[k]||user.user_metadata?.[k]||'';
   return res.status(200).json({id,email:user.email||'',profile,version:settings.updated_at,createdAt:user.created_at,lastSignIn:user.last_sign_in_at});
  }
  if(action==='audit'&&req.method==='GET'){
   const path=secret?'bjj/u/*/admin-audit/*':'bjj/u/'+actor.id+'/admin-audit/*';const data=await request('/rest/v1/docs?'+new URLSearchParams({select:'data',path:'like.'+path,order:'updated_at.desc',limit:'100'}));return res.status(200).json({list:data.map(x=>x.data),scope:secret?'all':'own'});
  }
  if(req.method!=='POST')throw fail(400,'Unknown action');
  if(action==='club-update'||action==='coach-change'){
   if(!safeId(body.club))throw fail(400,'Invalid club');const path='club/'+body.club+'/profile',current=await row(path);if(!current.data)throw fail(404,'Club not found');if(!body.version||body.version!==current.updated_at)throw fail(409,'Клубийн мэдээлэл шинэчлэгдсэн. Шинэчлээд дахин оролдоно уу.');
   const c=JSON.parse(JSON.stringify(current.data));let warnings=[];
   if(action==='club-update'){
    const p=body.profile||{};if(!clean(p.n))throw fail(400,'Клубийн нэр оруулна уу.');for(const k of ['n','city','addr','phone','coach','ig'])c[k]=clean(p[k]);
    if(!['approved','pending','rejected'].includes(p.status))throw fail(400,'Invalid status');c.status=p.status;c.open=!!p.open;
    const month=Number(p.month),kidsMonth=Number(p.kidsMonth),drop=Number(p.drop);if([month,kidsMonth,drop].some(x=>!Number.isFinite(x)||x<0||x>100000000))throw fail(400,'Төлбөрийн дүн буруу байна.');c.fee={...c.fee,month,kidsMonth,drop};c.pay={...c.pay};for(const k of ['bank','account','holder','qpay','note'])c.pay[k]=clean(p[k],k==='note'?1000:200);
    // Revision-check index before any write; profile contains the full authoritative record.
    const index=await row('clubs/index');await put(path,c,current.updated_at);
    const idx=index.data||{list:[]};idx.list=(idx.list||[]).filter(x=>x.id!==body.club);if(c.status!=='rejected')idx.list.push({id:body.club,n:c.n,city:c.city,status:c.status,open:c.open});
    try{await put('clubs/index',idx,index.updated_at);}catch(_){warnings.push('Клуб хадгалагдсан. Клубийн жагсаалтыг шинэчлэхийн тулд дахин хадгална уу.');}
   }else{
    if(!safeId(body.uid)||typeof body.grant!=='boolean')throw fail(400,'Invalid coach');c.admins=[...new Set(c.admins||[])];
    const members=await row('club/'+body.club+'/members'),doc=members.data||{list:[]};const member=doc.list.find(x=>x.uid===body.uid);
    if(body.grant&&!member)throw fail(400,'Эхлээд энэ клубт нэвтрэх эрхтэй гишүүнээр нэмнэ үү.');
    if(!body.grant&&c.admins.includes(body.uid)&&c.admins.length<=1)throw fail(400,'Сүүлчийн коучийг хасах боломжгүй. Эхлээд өөр коуч нэмнэ үү.');
    if(body.grant&&!c.admins.includes(body.uid))c.admins.push(body.uid);
    if(!body.grant){c.admins=c.admins.filter(x=>x!==body.uid);if(c.ageKeys)delete c.ageKeys[body.uid];}
    await put(path,c,current.updated_at);
    if(!body.grant){for(const m of doc.list){if(m.ageSealed)delete m.ageSealed[body.uid];if(m.privateProfile?.keys)delete m.privateProfile.keys[body.uid];}try{await put('club/'+body.club+'/members',doc,members.updated_at);}catch(_){warnings.push('Коучийн эрх хасагдсан. Гишүүдийн хувийн мэдээллийн түлхүүрийг дахин шинэчлэх шаардлагатай.');}}
    // Members automatically re-encrypt for the new coach after key registration.
    if(body.grant)warnings.push('Шинэ коуч нэвтэрч, гишүүд аппдаа ороход нас болон хувийн мэдээллийн эрх шинэчлэгдэнэ.');
   }
   const logged=await audit(body.club,{user:action==='coach-change'?body.uid:undefined,grant:action==='coach-change'?body.grant:undefined});if(!logged)warnings.push('Өөрчлөлт хадгалагдсан ч түүх бүртгэгдсэнгүй.');return res.status(200).json({ok:true,warnings});
  }
  if(action==='user-link'){
   requireSecret();if(!safeId(body.id)||!safeId(body.club))throw fail(400,'Invalid member');const [raw,settings,club,roster,all]=await Promise.all([request('/auth/v1/admin/users/'+body.id),row('bjj/u/'+body.id+'/settings'),row('club/'+body.club+'/profile'),row('club/'+body.club+'/members'),rows('club/*/members')]);
   if(!club.data||club.data.status==='rejected')throw fail(400,'Идэвхтэй клуб сонгоно уу.');if(all.some(r=>r.path!=='club/'+body.club+'/members'&&(r.data.list||[]).some(m=>m.uid===body.id)))throw fail(409,'Хэрэглэгч өөр клубт бүртгэлтэй байна. Клуб шилжүүлэхэд одоогийн коучтай тохиролцоно уу.');
   const user=raw.user||raw,p={...user.user_metadata,...settings.data},doc=roster.data||{list:[]};if(!doc.list.some(m=>m.uid===body.id)){const age=A.age(p.birthDate),m={id:randomUUID(),uid:body.id,n:p.name||user.email,username:p.username||'',email:user.email,track:age!==null&&age<16?'kids':'adult',socialAllowed:age!==null&&age>=13,belt:'white',stripes:0,since:new Date().toISOString().slice(0,10),ageSealed:{}};const keys={};for(const coach of club.data.admins||[]){if(club.data.ageKeys?.[coach]){keys[coach]=club.data.ageKeys[coach];if(age!==null)m.ageSealed[coach]=await A.sealAge(p.birthDate,keys[coach]);}}m.privateProfile=await A.sealPayload({phone:p.phone||'',address:p.address||'',social:p.socialAddress||''},keys);doc.list.push(m);await put('club/'+body.club+'/members',doc,roster.updated_at);}
   const data={...settings.data,clubId:body.club};if(settings.updated_at)await put('bjj/u/'+body.id+'/settings',data,settings.updated_at);else await request('/rest/v1/docs',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({path:'bjj/u/'+body.id+'/settings',data,owner:body.id})});return res.status(200).json({ok:true,warnings:await audit(body.id)?[]:['Гишүүн нэмэгдсэн ч түүх бүртгэгдсэнгүй.']});
  }
  if(action==='user-update'){
   requireSecret();if(!safeId(body.id))throw fail(400,'Invalid user');const p=body.profile||{};if(!clean(p.name)||!A.validUsername(p.username)||A.age(p.birthDate)===null)throw fail(400,'Нэр, username, төрсөн огноог шалгана уу.');
   const path='bjj/u/'+body.id+'/settings',cur=await row(path);if((cur.updated_at||null)!==(body.version||null))throw fail(409,'Хэрэглэгчийн мэдээлэл шинэчлэгдсэн. Дахин нээнэ үү.');
   const settings=cur.data||{};for(const k of PROFILE_FIELDS)settings[k]=clean(p[k],k==='address'?1000:k==='bio'?300:200);settings.username=A.username(p.username);
   // Preserve owner on existing private documents. Missing private docs belong to the target.
   if(cur.updated_at)await put(path,settings,cur.updated_at);else await request('/rest/v1/docs',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({path,data:settings,owner:body.id,updated_at:new Date().toISOString()})});
   const warnings=[];try{await request('/auth/v1/admin/users/'+body.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_metadata:{name:settings.name,username:settings.username,birthDate:settings.birthDate}})});}catch(_){warnings.push('Профайл хадгалагдсан. Нэвтрэх бүртгэлийн мэдээллийг дахин шинэчлэх шаардлагатай.');}
   const [rosters,profiles]=await Promise.all([rows('club/*/members'),rows('club/*/profile')]);const clubs=new Map(profiles.map(x=>[x.path.split('/')[1],x.data]));
   for(const roster of rosters){const m=(roster.data.list||[]).find(x=>x.uid===body.id);if(!m)continue;try{const c=clubs.get(roster.path.split('/')[1])||{};m.n=settings.name;m.username=settings.username;m.track=A.age(settings.birthDate)<16?'kids':'adult';m.socialAllowed=A.age(settings.birthDate)>=13;m.coachSet=true;m.setBy=actor.id;const keys={};m.ageSealed={};for(const coach of c.admins||[]){if(c.ageKeys?.[coach]){keys[coach]=c.ageKeys[coach];m.ageSealed[coach]=await A.sealAge(settings.birthDate,keys[coach]);}}m.privateProfile=await A.sealPayload({phone:settings.phone,address:settings.address,social:settings.socialAddress},keys);await put(roster.path,roster.data,roster.updated_at);}catch(_){warnings.push('Профайл хадгалагдсан. '+roster.path.split('/')[1]+' клубийн мэдээллийг дахин шинэчлэх шаардлагатай.');}}
   if(!await audit(body.id))warnings.push('Өөрчлөлтийн түүх бүртгэгдсэнгүй.');return res.status(200).json({ok:true,warnings});
  }
  throw fail(400,'Unknown action');
 }catch(e){if(!e.status)console.error('admin request failed',e.name);return res.status(e.status||502).json({error:e.status?e.message:'Админ хүсэлт амжилтгүй. Дахин оролдоно уу.'});}
};
