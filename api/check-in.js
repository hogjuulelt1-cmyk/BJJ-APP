'use strict';
const config=require('../config.js');
const checkin=require('../check-in.js');
const identity=require('../arrow-core.js');

module.exports=async function(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const authorization=req.headers.authorization||'';
  if(!/^Bearer \S+$/.test(authorization))return res.status(401).json({error:'Sign in required'});
  let body=req.body;
  try{if(typeof body==='string')body=JSON.parse(body);}catch(_){return res.status(400).json({error:'Invalid request'});}
  const club=body&&body.club,code=String(body&&body.code||'').trim().toUpperCase();
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(club||'')||!code||code.length>16)return res.status(400).json({error:'Invalid request'});
  const headers={apikey:config.supabaseAnonKey,Authorization:authorization};
  async function read(path){const r=await fetch(config.supabaseUrl+path,{headers,signal:AbortSignal.timeout(10000)});if(!r.ok){const e=new Error('Upstream request failed');e.status=r.status===401||r.status===403?r.status:502;throw e;}return r.json();}
  async function rows(path){return read('/rest/v1/docs?'+new URLSearchParams({select:'data,updated_at',path:'eq.'+path}));}
  async function doc(path){return (await rows(path))[0]?.data;}
  try{
    const user=await read('/auth/v1/user');
    const [profile,members,settings]=await Promise.all([doc('club/'+club+'/profile'),doc('club/'+club+'/members'),doc('bjj/u/'+user.id+'/settings')]);
    const member=(members?.list||[]).find(m=>m.uid===user.id);
    if(!profile||!member)return res.status(403).json({error:'Club membership required'});
    if(code!==String(profile.code||'').toUpperCase())return res.status(403).json({error:'Wrong club code'});
    const timezone=profile.timezone||'Asia/Ulaanbaatar',today=checkin.clock(Date.now(),timezone).date;
    const age=identity.age(settings?.birthDate,today);
    if(age===null)return res.status(400).json({error:'Complete your date of birth'});
    const slot=checkin.windowFor(profile.schedule,age<16?'kids':'adult',Date.now(),timezone,(profile.admins||[]).includes(user.id));
    if(!slot)return res.status(409).json({error:'Outside check-in window',reason:'window'});
    const path='club/'+club+'/att/'+slot.date.slice(0,7);
    // Optimistic update prevents concurrent scans from overwriting another attendee.
    for(let attempt=0;attempt<4;attempt++){
      const existing=(await rows(path))[0],data=existing?.data||{days:{}};data.days=data.days||{};
      const names=data.days[slot.date]||[];
      if(names.includes(user.id))return res.status(200).json({date:slot.date,time:slot.time,attendance:data,already:true});
      data.days[slot.date]=[...names,user.id];
      const query=new URLSearchParams({path:'eq.'+path});
      if(existing)query.set('updated_at','eq.'+existing.updated_at);
      const r=await fetch(config.supabaseUrl+'/rest/v1/docs'+(existing?'?'+query:''),{method:existing?'PATCH':'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(existing?{data,updated_at:new Date().toISOString()}:{path,data,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});
      if(!existing&&r.status===409)continue;
      if(!r.ok)return res.status(r.status===401||r.status===403?r.status:502).json({error:'Could not save attendance'});
      if((await r.json()).length)return res.status(200).json({date:slot.date,time:slot.time,attendance:data,already:false});
    }
    return res.status(409).json({error:'Please scan again',reason:'retry'});
  }catch(e){return res.status(e.status||502).json({error:'Could not check in'});}
};
