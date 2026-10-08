/* Arrow share exports: original jiu-jitsu artwork with post/story safe margins. */
(function(){
'use strict';
window.ARROW_FRAME={draw(canvas,data){
 const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height,story=H/W>1.5,p=70,top=story?210:80,bottom=story?240:80;
 const dark=data.frame!=='ticket',ink=dark?'#f7f7f9':'#141820',muted=dark?'#adb4c2':'#6b7280';
 g.clearRect(0,0,W,H);g.fillStyle=dark?'#0f141d':'#f2ede4';g.fillRect(0,0,W,H);
 if(data.image){const im=data.image,r=Math.max(W/im.width,H/im.height);g.drawImage(im,(W-im.width*r)/2,(H-im.height*r)/2,im.width*r,im.height*r);const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(9,13,20,.38)');shade.addColorStop(.4,'rgba(9,13,20,.25)');shade.addColorStop(1,'rgba(9,13,20,.96)');g.fillStyle=shade;g.fillRect(0,0,W,H);}
 const text=(t,x,y,size,color=ink,weight=700)=>{g.fillStyle=color;g.font=weight+' '+size+'px system-ui,sans-serif';g.fillText(t,x,y);};
 const fitText=(t,x,y,size,width,color=ink)=>{while(size>20){g.font='700 '+size+'px system-ui,sans-serif';if(g.measureText(t).width<=width)break;size-=2;}text(t,x,y,size,color);};
 function grappler(x,y,flip,color){g.save();g.translate(x,y);g.scale(flip,1);g.strokeStyle=color;g.fillStyle=color;g.lineCap='round';g.lineJoin='round';g.lineWidth=58;g.beginPath();g.arc(0,-150,52,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(-35,-62);g.quadraticCurveTo(-90,35,-30,110);g.lineTo(100,195);g.moveTo(-20,110);g.quadraticCurveTo(-100,180,-220,205);g.moveTo(-45,-25);g.quadraticCurveTo(60,25,160,70);g.moveTo(-38,-10);g.quadraticCurveTo(-90,85,10,130);g.stroke();g.restore();}
 if(!data.image){if(data.frame==='mat'){g.strokeStyle='#1c2635';g.lineWidth=2;for(let x=-H;x<W+H;x+=90){g.beginPath();g.moveTo(x,0);g.lineTo(x+H,H);g.stroke();}grappler(410,top+410,1,'#fc5200');grappler(690,top+460,-1,'#355a92');}
 else if(data.frame==='belt'){g.fillStyle='#182133';g.fillRect(p,top+160,W-2*p,480);g.strokeStyle='#fc5200';g.lineWidth=7;g.beginPath();g.moveTo(360,top+220);g.lineTo(540,top+415);g.lineTo(720,top+220);g.moveTo(720,top+220);g.lineTo(830,top+610);g.moveTo(360,top+220);g.lineTo(250,top+610);g.stroke();text('柔術',W/2-160,top+530,150,'#f7f7f9');}
 else{g.fillStyle='#fffdf7';g.fillRect(p,top+120,W-2*p,H-top-bottom-130);g.strokeStyle='#d6cfbf';g.lineWidth=2;g.setLineDash([12,12]);g.strokeRect(p+20,top+140,W-2*p-40,H-top-bottom-170);g.setLineDash([]);text('JIU-JITSU',p+60,top+250,66);text('TRAINING RECEIPT',p+60,top+310,28,muted);}}
 text('ARROW',p,top,48,data.image?'#fff':ink);text('JIU-JITSU CLUB',p,top+46,23,data.image?'#e8e8ed':muted,500);
 g.textAlign='right';text(data.date,W-p,top,28,data.image?'#fff':muted,500);g.textAlign='left';
 const y=H-bottom-470,left=data.frame==='ticket'?p+60:p;
 if(data.image&&data.frame==='belt'){g.save();g.globalAlpha=.65;g.strokeStyle='#fc5200';g.lineWidth=9;g.beginPath();g.moveTo(320,top+190);g.lineTo(540,top+430);g.lineTo(760,top+190);g.stroke();text('柔術',380,top+570,120,'#fff');g.restore();}
 if(data.image&&data.frame==='ticket'){g.fillStyle='rgba(255,253,247,.94)';g.fillRect(p,y-65,W-2*p,H-bottom-y+130);}
 const photoInk=data.image&&data.frame!=='ticket'?'#fff':ink,photoMuted=data.image&&data.frame!=='ticket'?'#c2c9d3':muted;
 fitText(data.club||'ON THE MAT',left,y,46,W-left-p,photoInk);
 text(data.type.toUpperCase(),left,y+75,25,'#fc5200');
 const stats=[[data.minutes,'MINUTES'],[data.rounds,'ROUNDS'],[data.submissions,'SUBMISSIONS']];
 stats.forEach((s,i)=>{const x=left+i*(W-left-p)/3;text(String(s[0]),x,y+205,92,photoInk);text(s[1],x,y+250,20,photoMuted,500);});
 const bw=W-left-p,by=y+315;g.fillStyle=data.beltColor||'#f3f3f3';g.fillRect(left,by,bw,22);g.fillStyle='#0a0b0e';g.fillRect(left+bw*.72,by,bw*.28,22);for(let i=0;i<data.stripes;i++){g.fillStyle='#fff';g.fillRect(left+bw*.72+12+i*22,by,9,22);}
 fitText('@'+data.username,left,y+402,32,W-left-p,photoInk);text('SHOW UP. TAP. LEARN. REPEAT.',left,H-bottom+30,19,photoMuted,500);
}};
})();
