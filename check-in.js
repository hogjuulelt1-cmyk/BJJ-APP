/* Club wall-clock schedule gate, shared by the browser and Vercel check-in API. */
(function (root) {
  'use strict';
  function clock(now, timezone) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'Asia/Ulaanbaatar', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).formatToParts(new Date(now));
    const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
    return { date: p.year+'-'+p.month+'-'+p.day, wall: Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second) + (Number(now)%1000) };
  }
  function group(x) { return x.kind==='open'?'all':x.kind==='kids'?'kids':x.group||'adult'; }
  function windowFor(schedule, track, now, timezone, coach) {
    const c = clock(now, timezone), midnight = Date.parse(c.date+'T00:00:00Z'), matches=[];
    for (const shift of [-1,0,1]) {
      const day = new Date(midnight+shift*86400000), dow=(day.getUTCDay()+6)%7;
      for (const x of schedule||[]) {
        if (+x.d!==dow || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.t||'') || (!coach&&group(x)!=='all'&&group(x)!==track)) continue;
        const [hour,minute]=x.t.split(':').map(Number), start=day.getTime()+(hour*60+minute)*60000, delta=c.wall-start;
        if (delta>=-60*60000 && delta<=40*60000) matches.push({ date:day.toISOString().slice(0,10),time:x.t,name:x.n||'',delta });
      }
    }
    return matches.sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta))[0] || null;
  }
  const api = { clock, windowFor, group };
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.ARROW_CHECKIN=api;
})(typeof window==='undefined'?globalThis:window);
