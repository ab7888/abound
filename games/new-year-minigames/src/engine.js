"use strict";
const TS=16,H=17,VW=480,VH=272;let W=30,camX=0;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const FONT='"Pixelify Sans", "Courier New", monospace';

/* ---------- palette ---------- */
const C={dayWall:'#c5cff0',dayEdge:'#8f9dd3',dayDeep:'#b2bee6',snow:'#ffffff',
 nightWall:'#86d6f0',nightEdge:'#3f97c4',nightHi:'#d4f4fc',
 amber:'#f2a33a',amberHi:'#ffd08a',amberLo:'#b86d14',teal:'#2fa7a0',tealHi:'#8ee3d8',tealLo:'#17706b',
 rose:'#e8567a',ink:'#1d2433',gold:'#f2c14e'};

/* ---------- sprites (pixel maps) ---------- */
const PAL={K:'#1d2433',W:'#ffffff',P:'#1d2433',O:'#f59f2a',R:'#e8567a',r:'#a8345a',G:'#c9d6ea',
 b:'#a9bfe0',s:'#5f79ab',E:'#1d2433',B:'#7c5a3a'};
const PEN={
stand:["................",".....KKKKKK.....","....KKKKKKKK....","...KKKKKKWWKK...","...KKKKKKWPKK...","...KKKKKKKKOOO..","...KKKKWWWWKO...","...RRRRRRRRRR...","..rRRKWWWWWKK...","..r.KKWWWWWWKK..",".r..KKWWWWWWKK..","...KKWWWWWWWKK..","...KKWWWWWWWK...","....KKWWWWWKK...",".....KKKKKKK....","....OOO..OOO...."],
walk:["................",".....KKKKKK.....","....KKKKKKKK....","...KKKKKKWWKK...","...KKKKKKWPKK...","...KKKKKKKKOOO..","...KKKKWWWWKO...","...RRRRRRRRRR...","..rRRKWWWWWKK...",".r..KKWWWWWWKK..","r...KKWWWWWWKKK.","...KKWWWWWWWK...","...KKWWWWWWWK...","....KKWWWWWKK...",".....KKKKKKK....",".....OOO.OOO...."],
jump:["................",".....KKKKKK.....","....KKKKKKKK....","...KKKKKKWWKK...","...KKKKKKWPKK...","..KKKKKKKKKOOO..",".KKKKKKWWWWKOK..","K..RRRRRRRRRR.K.","..rRRKWWWWWKK...","r...KKWWWWWWK...","....KKWWWWWWK...","...KKWWWWWWWK...","...KKWWWWWWKK...","....KKWWWWKK....",".....KKKKKK.....","....OO....OO...."],
dead:["................",".....KKKKKK.....","....KKKKKKKK....","...KKWKWKWKWK...","...KKKWKKKWKK...","...KKWKWKWKWK...","...KKKKKOOKKK...","..KRRRRRRRRRRK..",".K.KKWWWWWWKK.K.","....KWWWWWWWK...","....KWWWWWWWK...","....KKWWWWWKK...",".....KKKKKKK....","................","....OOO..OOO....","................"]};
const BLOB=[
"................","......WWWW......","....WWWWWWWW....","...WWWWWWWWWW...","..WWWsWWWWsWWW..","..WWWWsWWsWWWW..","..WWWEWWWWEWWW..",".WWWWEWWWWEWWWW.",".WWWWWWWWWWWWWW.",".WbWWWWWWWWWWbW.",".bWWWWsssWWWWWb.","..bbWWWWWWWWbb..","...bbbbbbbbbb...","....BB....BB....","................","................"];
const spriteCache={};
function makeSprite(key,rows){
  const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.'){g.fillStyle=PAL[ch];g.fillRect(x,y,1,1);}}));
  const f=document.createElement('canvas');f.width=16;f.height=16;const h=f.getContext('2d');
  h.translate(16,0);h.scale(-1,1);h.drawImage(c,0,0);spriteCache[key]=[c,f];}
for(const k in PEN)makeSprite('pen_'+k,PEN[k]);makeSprite('blob',BLOB);
{const sv={...PAL};Object.assign(PAL,{W:'#7ccf5a',b:'#4e9e3c',s:'#2f6b2a',B:'#7c5a3a'});makeSprite('blob_g',BLOB);Object.assign(PAL,sv);}
function spr(key,x,y,flip){ctx.drawImage(spriteCache[key][flip?1:0],Math.round(x),Math.round(y));}

/* ---------- input ---------- */
const keys={};const pressed={};
const MAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',
 KeyZ:'jump',Space:'jump',KeyK:'jump',KeyX:'run',ShiftLeft:'run',ShiftRight:'run',KeyJ:'run',Enter:'start',KeyR:'restart',KeyM:'mute',KeyP:'pause',Escape:'pause'};
addEventListener('keydown',e=>{const a=MAP[e.code];if(!a)return;e.preventDefault();audioInit();if(!keys[a])pressed[a]=true;keys[a]=true;});
addEventListener('keyup',e=>{const a=MAP[e.code];if(a){keys[a]=false;e.preventDefault();}});
function hit(a){const v=pressed[a];pressed[a]=false;return v;}
document.querySelectorAll('[data-k]').forEach(b=>{
  const a=b.dataset.k;
  const on=e=>{e.preventDefault();audioInit();if(!keys[a])pressed[a]=true;keys[a]=true;b.classList.add('on');};
  const off=e=>{e.preventDefault();keys[a]=false;b.classList.remove('on');};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
cv.addEventListener('pointerdown',()=>{audioInit();pressed.start=true;});

/* ---------- audio ---------- */
let AC=null,muted=false;
function audioInit(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();}
function tone(f,d,type='square',v=0.06,slide=0,delay=0){if(!AC||muted)return;const t=AC.currentTime+delay;
 const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+0.02);}
const SFX={jump:()=>tone(330,0.14,'square',0.05,2.2),gem:()=>{tone(988,0.07,'square',0.05);tone(1319,0.18,'square',0.05,1,0.07);},
 stomp:()=>tone(220,0.12,'triangle',0.09,0.4),bump:()=>tone(140,0.08,'square',0.06),
 flip:()=>{tone(523,0.08,'square',0.05);tone(784,0.12,'square',0.05,1,0.08);},spring:()=>tone(200,0.25,'triangle',0.08,4),
 boost:()=>tone(400,0.3,'sawtooth',0.04,3),key:()=>[659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.05,1,i*0.08)),
 door:()=>tone(160,0.2,'triangle',0.08,1.5),die:()=>[494,440,392,330,262].forEach((f,i)=>tone(f,0.14,'square',0.05,1,i*0.11)),
 hurt:()=>tone(110,0.3,'sawtooth',0.07,0.5),shoot:()=>tone(90,0.12,'triangle',0.1,0.6),crack:()=>tone(1500,0.15,'triangle',0.05,0.3),
 boom:()=>{if(!AC||muted)return;const b=AC.createBuffer(1,AC.sampleRate*0.4,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=AC.createBufferSource(),g=AC.createGain();g.gain.value=0.12;s.buffer=b;s.connect(g);g.connect(AC.destination);s.start();},
 fanfare:()=>[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i>3?0.35:0.12,'square',0.05,1,i*0.12))};

/* ---------- game state ---------- */
const L1_ROOMS=LEVELS.filter(r=>(r.level||1)===1).length;
const LEVEL_INFO=[{n:1,name:'Frost festival',start:0,time:600},{n:2,name:'Meadow run',start:LEVELS.findIndex(r=>r.level===2),time:400}];
let G={mode:'title',room:0,time:500,gems:0,score:0,deaths:0,frame:0,clock:0,best:{},sel:0,collected:new Set(),medals:0,checkpoint:null,level:1};
let R=null;   // current room state
let P=null;   // player
let parts=[]; // particles
let iris={t:0,dir:0,cb:null,cx:VW/2,cy:VH/2};
try{G.best=JSON.parse(localStorage.getItem('nym-best2'))||{};}catch(e){}

function loadRoom(i,spawnCh){
  const src=LEVELS[i];W=src.map[0].length;let spawns={};
  R={level:src.level||1,sub:src.sub,parent:src.parent,i,theme:src.theme,title:src.title,door:src.door,t:[],flip:0,flipped:false,hasKey:false,keyItem:null,
     ents:[],gemsLeft:0,doorEnt:null,shake:0,reveal:0,msgCells:[],done:false,titleT:(src.auto||src.door==='goal')?0:150,autoFlip:(src.auto||src.door==='goal')?60:0};
  parts=[];
  for(let y=0;y<H;y++){R.t[y]=[];for(let x=0;x<W;x++){
    let ch=src.map[y][x];const px=x*TS,py=y*TS;const ck=i+':'+x+':'+y;
    switch(ch){
      case '@':case 'x':spawns[ch]=[px+2,py+2];ch=' ';break;
      case 'b':case 'q':if(G.collected.has(ck))ch='u';break;
      case 'y':R.ents.push({k:'tower',x:px,y:py,y0:py,w:32,h:96,tx:x,ty:y,vy:0,fly:false,anim:0});ch=' ';break;
      case 'z':{const fly=(src.map[y+1]||'')[x]===' ';R.ents.push({k:'critter',x:px+1,y:py+2,w:14,h:14,alive:true,a:0,fly,vx:fly?0:-0.5,vy:0});ch=' ';break;}
      case 'v':case 'm':R.ents.push({k:'lift',x:px,y:py,x0:px,y0:py,w:32,h:8,ax:ch==='m'?48:0,ay:ch==='v'?40:0,t:0,dx:0,dy:0});ch=' ';break;
      case 'O':if(!G.collected.has(ck))R.ents.push({k:'medal',x:px,y:py,w:16,h:16,ck});ch=' ';break;
      case 'M':R.ents.push({k:'check',x:px,y:py-32,w:16,h:48,up:!!(G.checkpoint&&G.checkpoint.room===i&&G.checkpoint.x===px)});ch=' ';break;
      case 'X':R.ents.push({k:'ladder',x:px,y:py-16,w:16,h:32});ch=' ';break;
      case 'e':R.ents.push({k:'blob',x:px+1,y:py+2,w:14,h:14,vx:-0.5,vy:0,alive:true});ch=' ';break;
      case 'o':case 'h':if(!G.collected.has(ck)){R.ents.push({k:'gem',x:px+3,y:py+3,w:10,h:10,ck,hidden:ch==='h'});R.gemsLeft++;}ch=' ';break;
      case 'i':R.ents.push({k:'edoor',x:px,y:py-16,w:16,h:32});ch=' ';break;
      case 'I':R.ents.push({k:'icicle',x:px,y:TS+2,w:16,h:24,vy:0,state:'hang',t:0,home:TS+2});ch=' ';break;
      case 'K':R.ents.push({k:'cannon',x:px,y:py,w:16,h:16,dir:-1,cd:60,sw:true});ch='#';break;
      case 'k':R.keyItem={k:'key',x:px+2,y:py+3,w:12,h:10,vy:0,free:false};R.ents.push(R.keyItem);ch=' ';break;
      case 'P':R.ents.push({k:'spring',x:px,y:py,w:16,h:16,sq:0});ch=' ';break;
      case 'R':case 'Q':R.ents.push({k:'ring',x:px+8,y:py+8,dx:ch==='R'?1:-1,dy:0,cd:0,spin:0});ch=' ';break;
      case 'D':case 'L':R.doorEnt={k:'door',x:px,y:py-16,w:16,h:32,lock:ch==='L'};ch=' ';break;
      case 'G':R.ents.push({k:'goal',x:px,y:py-48,w:16,h:64});ch=' ';break;
      case 'c':case 'C':R.ents.push({k:'cannon',x:px,y:py,w:16,h:16,dir:ch==='c'?1:-1,cd:150});ch='#';break;
      case 'F':R.ents.push({k:'plant',x:px+16,y:py+16,base:py+16,hp:3,phase:0,t:90,alive:true,inv:0,w:24,h:28});ch=' ';break;
      case 'Z':R.ents.push({k:'boss',x:px-8,y:py+16-52,w:40,h:52,vx:-0.6,hp:3,t:120,inv:0,alive:true,dying:0});
        R.ents.push({k:'icicle',x:14*TS+8-10,y:TS+2,w:20,h:30,vy:0,state:'hang',t:0,home:TS+2,big:true});ch=' ';break;
      case 'T':if(src.door!=='key'&&src.door!=='gems'&&y<8)R.msgCells.push([x,y]);break;
      case 'r':case 'u':case 'd':R.ents.push({k:'sign',x:px,y:py,dir:ch});ch=' ';break;
    }
    R.t[y][x]=ch;}}
  if(src.map.some(r=>r.includes('F'))){R.ents.push({k:'icicle',x:14*TS+8-8,y:TS+2,w:16,h:24,vy:0,state:'hang',t:0,home:TS+2});}
  G.gemsTotalRoom=R.gemsLeft;
  let sp=spawns[spawnCh]||spawns['@'];
  if(!spawnCh&&G.checkpoint&&G.checkpoint.room===i)sp=[G.checkpoint.x+2,G.checkpoint.y+2];
  P=newPlayer(sp[0],sp[1]);camX=clampCam(P.x+6-VW/2);
}
function clampCam(x){return Math.max(0,Math.min(W*TS-VW,x));}
function newPlayer(x,y){return{x,y,w:12,h:14,vx:0,vy:0,face:1,onG:false,coyote:0,buf:0,gH:0.125,gF:0.4375,
  anim:0,dead:0,boost:0,bdx:0,bdy:0,inv:0,surf:null,win:0,suit:!!G.suit,fly:0,charge:true,drill:false,spin:0};}

/* ---------- tiles ---------- */
function tileAt(tx,ty){if(ty>=H)return ' ';if(tx<0||ty<0||tx>=W)return '#';return R.t[ty][tx];}
function solidCh(ch){return ch==='#'||ch==='S'||ch==='W'||ch==='b'||ch==='q'||ch==='u'||ch==='H'||ch==='<'||ch==='>'||(ch==='A'&&R.flip===0)||(ch==='T'&&R.flip===1);}
function solidAt(px,py){return solidCh(tileAt(Math.floor(px/TS),Math.floor(py/TS)));}
function rectHitsSolid(x,y,w,h){for(let ty=Math.floor(y/TS);ty<=Math.floor((y+h-0.01)/TS);ty++)for(let tx=Math.floor(x/TS);tx<=Math.floor((x+w-0.01)/TS);tx++)if(solidCh(tileAt(tx,ty)))return true;return false;}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

function slopeSurf(px,ty){const tx=Math.floor(px/TS),ch=tileAt(tx,ty),lx=px-tx*TS;
  if(ch==='/')return ty*TS+TS-lx;if(ch==='\\')return ty*TS+lx;return null;}
function slopeSnap(o,stick){const cx=o.x+o.w/2,b=o.y+o.h;let best=null;
  for(let ty=Math.floor((b-10)/TS);ty<=Math.floor((b+(stick?9:0))/TS);ty++){const s=slopeSurf(cx,ty);if(s===null)continue;
    const d=b-s;if(d>=-(stick?9:0)&&d<=10){if(best===null||Math.abs(d)<Math.abs(b-best))best=s;}}
  if(best!==null){o.y=best-o.h;return true;}return false;}
function onSlope(o){const cx=o.x+o.w/2,b=o.y+o.h;const c=tileAt(Math.floor(cx/TS),Math.floor((b-1)/TS));return c==='/'||c==='\\';}
function centerSlope(o){const cx=Math.floor((o.x+o.w/2)/TS),b=o.y+o.h;for(const yy of[b-2,b+2]){const c=tileAt(cx,Math.floor(yy/TS));if(c==='/'||c==='\\')return true;}return false;}
function underSlope(tx,ty,o){if(o.y+o.h>ty*TS+11)return false;const a=tileAt(tx,ty-1);return a==='/'||a==='\\'||centerSlope(o);}
/* body movement with tile collision; returns flags */
function moveBody(o,dx,dy,semi=true,step=false){
  const res={l:false,r:false,up:false,down:false,headTiles:[]};
  o.x+=dx;
  if(dx!==0&&step&&rectHitsSolid(o.x,o.y,o.w,o.h)){for(let k=1;k<=6;k++)if(!rectHitsSolid(o.x,o.y-k,o.w,o.h)){o.y-=k;break;}}
  if(dx!==0){const edge=dx>0?o.x+o.w-0.01:o.x;const tx=Math.floor(edge/TS);
    for(let ty=Math.floor(o.y/TS);ty<=Math.floor((o.y+o.h-0.01)/TS);ty++){
      if(solidCh(tileAt(tx,ty))&&!underSlope(tx,ty,o)){if(dx>0){o.x=tx*TS-o.w;res.r=true;}else{o.x=(tx+1)*TS;res.l=true;}break;}}}
  const prevBottom=o.y+o.h;o.y+=dy;
  if(dy>0){const ty=Math.floor((o.y+o.h-0.01)/TS);
    for(let tx=Math.floor(o.x/TS);tx<=Math.floor((o.x+o.w-0.01)/TS);tx++){const ch=tileAt(tx,ty);
      if((solidCh(ch)&&!underSlope(tx,ty,o))||(semi&&ch==='-'&&prevBottom<=ty*TS+0.01)){o.y=ty*TS-o.h;res.down=true;break;}}}
  else if(dy<0){const ty=Math.floor(o.y/TS);
    for(let tx=Math.floor(o.x/TS);tx<=Math.floor((o.x+o.w-0.01)/TS);tx++){if(solidCh(tileAt(tx,ty))){res.headTiles.push([tx,ty]);}}
    if(res.headTiles.length){o.y=(ty+1)*TS;res.up=true;}}
  return res;
}
function groundUnder(o){const y=o.y+o.h+0.5;let best=null;
  for(let tx=Math.floor(o.x/TS);tx<=Math.floor((o.x+o.w-0.01)/TS);tx++){const ch=tileAt(tx,Math.floor(y/TS));
    if(solidCh(ch)||ch==='-'||ch==='/'||ch==='\\'){if(ch==='<'||ch==='>')return ch;best=ch;}}if(!best&&onSlope(o))best='/';return best;}

/* ---------- switch ---------- */
function flipSwitch(tx,ty){
  if(R.flipCd>0)return;R.flipCd=12;R.flip^=1;SFX.flip();
  R.bumps=R.bumps||[];if(tx!=null)R.bumps.push({x:tx,y:ty,t:8});
  // push player out if a newly solid block traps them
  if(rectHitsSolid(P.x,P.y,P.w,P.h)){for(let k=1;k<=24;k++){if(!rectHitsSolid(P.x,P.y-k,P.w,P.h)){P.y-=k;break;}}}
  for(const e of R.ents)if(e.k==='blob'&&e.alive&&rectHitsSolid(e.x,e.y,e.w,e.h))e.y-=TS;
  if(!R.flipped&&R.msgCells.length){R.reveal=1;fireworks(R.msgCells);G.score+=1000;}
  R.flipped=true;
  for(const e of R.ents)if(e.k==='icicle'&&e.state==='hang'){e.state='fall';e.vy=0.5;SFX.crack();}
}
function fireworks(cells){
  let minx=99,maxx=0,miny=99,maxy=0;cells.forEach(([x,y])=>{minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);});
  for(let i=0;i<5;i++)setTimeout(()=>{if(!R)return;const cx=(minx+Math.random()*(maxx-minx+1))*TS,cy=(miny+Math.random()*(maxy-miny+1))*TS;burst(cx,cy,34);SFX.boom();},i*260);
}
const FW=['#f2a33a','#2fa7a0','#e8567a','#ffffff','#8ee3d8','#ffd08a'];
function burst(x,y,n,cols=FW,sp=2.4){for(let i=0;i<n;i++){const a=Math.PI*2*i/n+Math.random()*0.2,s=sp*(0.5+Math.random()*0.6);
  parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:40+Math.random()*25,c:cols[(Math.random()*cols.length)|0],g:0.04});}}
function puff(x,y,n=8,c='#ffffff'){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-0.5)*2,vy:-Math.random()*1.8,life:20+Math.random()*12,c,g:0.08});}

/* ---------- player ---------- */
function killPlayer(){if(P.dead||P.win)return;if(P.inv>0)return;if(P.suit){P.suit=false;G.suit=false;P.inv=90;P.fly=0;SFX.hurt();R.shake=4;puff(P.x+6,P.y,10,C.rose);return;}P.dead=1;P.vy=-4.2;P.vx=0;G.deaths++;G.suit=false;SFX.die();}
function updatePlayer(){
  if(P.dead){P.dead++;if(P.dead>28){P.vy+=0.22;P.y+=P.vy;}
    if(P.dead===110)startIris(-1,()=>{loadRoom(G.room);startIris(1);});return;}
  if(P.win)return;
  const dir=(keys.right?1:0)-(keys.left?1:0);const run=!!keys.run;
  if(P.inv>0)P.inv--;
  if(hit('jump'))P.buf=6;else if(P.buf>0)P.buf--;
  if(P.boost>0){P.boost--;P.vx=P.bdx*5;P.vy=P.bdy*5;
    if(P.boost%3===0)parts.push({x:P.x+6,y:P.y+7,vx:0,vy:0,life:14,c:C.gold,g:0});
    if(P.boost===0){P.vx=P.bdx*2.6;P.vy=Math.min(P.vy,0);}}
  else{
    const maxV=run?2.56:1.56,acc=run?0.056:0.037;
    if(dir){P.face=dir;
      if(P.vx*dir<0)P.vx+=dir*(P.onG?0.10:0.06);
      else if(Math.abs(P.vx)<maxV)P.vx=dir*Math.min(maxV,Math.abs(P.vx)+acc);
      else if(P.onG)P.vx-=Math.sign(P.vx)*0.03;}
    else if(P.onG){const f=0.052;P.vx=Math.abs(P.vx)<=f?0:P.vx-Math.sign(P.vx)*f;}
    if(P.buf>0&&(P.onG||P.coyote>0)){P.buf=0;P.coyote=0;const s=Math.abs(P.vx);
      if(s<1){P.vy=-4;P.gH=0.125;P.gF=0.4375;}else if(s<2.31){P.vy=-4;P.gH=0.117;P.gF=0.375;}else{P.vy=-5;P.gH=0.156;P.gF=0.5625;}
      P.onG=false;SFX.jump();}
    if(P.suit&&!P.onG&&P.charge&&P.buf>0&&P.coyote===0){P.buf=0;P.charge=false;P.fly=20;P.vy=-6.3;P.gH=0.125;P.gF=0.44;SFX.boost();}
    P.drill=P.suit&&!P.onG&&keys.down&&P.vy>0;
    P.vy+=(P.vy<0&&keys.jump)?P.gH:P.gF;
    const maxFall=P.suit&&!P.onG&&!P.charge?(P.drill?5:1.25):4.5;if(P.vy>maxFall)P.vy=(P.suit&&!P.onG&&!P.charge&&!P.drill)?Math.max(maxFall,P.vy-0.5):maxFall;
    if(P.fly>0)P.fly--;if(P.suit&&!P.charge)P.spin+=P.drill?0.9:0.4;
  }
  let conv=0;if(P.onG){const g=groundUnder(P);if(g==='<')conv=-0.9;else if(g==='>')conv=0.9;}
  P.prevB=P.y+P.h;P.fallV=P.vy;
  const r=moveBody(P,P.vx+conv,P.vy,true,P.onG);
  if(r.l||r.r){if(P.boost>0){P.boost=0;}P.vx=0;}
  if(r.up){P.vy=0.5;SFX.bump();
    let best=null,bd=99;for(const[tx,ty]of r.headTiles){const d=Math.abs(tx*TS+8-(P.x+6));if(d<bd){bd=d;best=[tx,ty];}}
    if(best&&tileAt(best[0],best[1])==='S'){flipSwitch(best[0],best[1]);launchTowers(best[0],best[1]);}
    else if(best&&(tileAt(best[0],best[1])==='b'||tileAt(best[0],best[1])==='q'))popCrate(best[0],best[1]);
    else if(best){R.bumps=R.bumps||[];R.bumps.push({x:best[0],y:best[1],t:6,soft:true});}}
  const was=P.onG;P.onG=r.down;
  if(P.vy>=0&&slopeSnap(P,was)){P.onG=true;}
  if(P.onG){P.vy=0;P.charge=true;P.drill=false;}
  if(was&&!P.onG&&P.vy>=0)P.coyote=5;else if(P.coyote>0)P.coyote--;
  P.anim+=Math.abs(P.vx)*0.12;
  // hazards
  for(let ty=Math.floor((P.y+4)/TS);ty<=Math.floor((P.y+P.h-0.01)/TS);ty++)for(let tx=Math.floor((P.x+2)/TS);tx<=Math.floor((P.x+P.w-2.01)/TS);tx++)
    if(tileAt(tx,ty)==='^'&&P.y+P.h>ty*TS+8)killPlayer();
  if(P.y>VH+20)killPlayer();
  // burrow hole
  if(P.onG&&hit('down')&&R.sub!=null){const t=tileAt(Math.floor((P.x+6)/TS),Math.floor((P.y+P.h+2)/TS));
    if(t==='H'){SFX.door();P.win=1;startIris(-1,()=>{G.room=R.sub;loadRoom(G.room);startIris(1);});}}
}
/* a tower rests on two switch blocks; bumping either one launches it up its shaft */
function launchTowers(bx,by){for(const e of R.ents)if(e.k==='tower'&&!e.fly&&by===e.ty+6&&(bx===e.tx||bx===e.tx+1)){e.fly=true;e.vy=-5.2;SFX.spring();puff(e.x+16,e.y+96,10,'#d4f4fc');}}
/* shared ground walker for blobs and moles: gravity, slopes, turn at walls and ledges */
function walkEnt(e){
  e.vy=Math.min(e.vy+0.3,4);
  const r=moveBody(e,e.vx,e.vy,true,true);if(r.down)e.vy=0;if(e.vy>=0&&slopeSnap(e,r.down||e.gnd)){r.down=true;e.vy=0;}e.gnd=r.down;
  if(r.l||r.r)e.vx*=-1;
  else if(r.down){const ax=e.vx>0?e.x+e.w+1:e.x-1;const ch=tileAt(Math.floor(ax/TS),Math.floor((e.y+e.h+2)/TS)),ch2=tileAt(Math.floor(ax/TS),Math.floor((e.y+e.h-2)/TS));if(!(solidCh(ch)||ch==='-'||ch==='/'||ch==='\\'||ch2==='/'||ch2==='\\'))e.vx*=-1;}
  return r;}
function popCrate(tx,ty){const wasQ=R.t[ty][tx]==='q';R.t[ty][tx]='u';if(!wasQ)G.collected.add(R.i+':'+tx+':'+ty);R.bumps=R.bumps||[];R.bumps.push({x:tx,y:ty,t:8});
  if(wasQ){R.ents.push({k:'suit',x:tx*TS+2,y:ty*TS-2,w:12,h:12,vy:-1.6,t:0});SFX.key();return;}
  G.gems++;G.score+=200;SFX.gem();parts.push({x:tx*TS+3,y:ty*TS-12,vx:0,vy:-1.2,life:26,c:'gem',g:0.06});
  for(const e of R.ents)if(e.k==='blob'&&e.alive&&Math.abs(e.x+7-(tx*TS+8))<14&&Math.abs(e.y+e.h-ty*TS)<3){e.alive=false;puff(e.x+7,e.y+8,10);G.score+=100;}}

/* ---------- entities ---------- */
function updateEnts(){
  const pBox={x:P.x,y:P.y,w:P.w,h:P.h};
  for(const e of R.ents){
    switch(e.k){
    case 'blob':{if(!e.alive){e.dt=(e.dt||0)+1;break;}
      walkEnt(e);
      if(e.y>VH+30){e.gone=true;break;}
      e.a=(e.a||0)+0.1;
      if(!P.dead&&overlap(pBox,e)){
        if((P.fallV>0&&P.prevB<=e.y+6)||P.drill){e.alive=false;P.vy=keys.jump?-4.6:-3;G.score+=100;SFX.stomp();puff(e.x+7,e.y+8,10);}
        else if(P.boost>0){e.alive=false;SFX.stomp();puff(e.x+7,e.y+8,10);}
        else killPlayer();}
      break;}
    case 'gem':if(e.hidden&&!R.flipped)break;if(!e.got&&overlap(pBox,e)){e.got=true;G.collected.add(e.ck);R.gemsLeft--;G.gems++;G.score+=200;SFX.gem();burst(e.x+5,e.y+5,8,['#8ee3d8','#fff'],1.2);
        if(R.door==='gems'&&R.gemsLeft===0){SFX.fanfare();burst(R.doorEnt.x+8,R.doorEnt.y+16,30);}}break;
    case 'key':if(e.free){e.vy=Math.min(e.vy+0.2,3);const g=groundUnder(e);const cx=g==='<'?-0.9:g==='>'?0.9:0;const r=moveBody(e,cx,e.vy);if(r.down)e.vy=-e.vy*0.4;}
      if(!R.hasKey&&(e.free||!e.hidden)&&overlap(pBox,e)){R.hasKey=true;e.gone=true;SFX.key();burst(e.x+6,e.y+5,16,[C.gold,'#fff']);}break;
    case 'spring':if(e.sq>0)e.sq--;
      if(!P.dead&&P.fallV>0&&overlap(pBox,{x:e.x+1,y:e.y+4,w:14,h:12})&&P.prevB<=e.y+10){P.y=e.y+4-P.h;P.vy=keys.jump?-7.3:-5.2;P.gH=0.125;P.gF=0.4375;P.onG=false;e.sq=10;SFX.spring();}
      else if(!P.dead&&overlap(pBox,e)&&P.prevB>e.y+8){ if(P.x+P.w/2<e.x+8)P.x=e.x-P.w;else P.x=e.x+16;P.vx=0;}
      break;
    case 'ring':e.spin+=0.08;if(e.cd>0)e.cd--;
      if(!P.dead&&e.cd===0&&Math.hypot(P.x+6-e.x,P.y+7-e.y)<16){P.x=e.x-6;P.y=e.y-7;P.boost=38;P.bdx=e.dx;P.bdy=e.dy;e.cd=40;SFX.boost();burst(e.x,e.y,14,[C.gold,'#fff'],1.5);}
      break;
    case 'cannon':if(e.sw&&(!R.flipped||!R.ents.some(c=>c.k==='critter'&&c.alive)))break;if(--e.cd<=0){e.cd=190;R.ents.push({k:'ball',x:e.x+(e.dir>0?16:-10),y:e.y+3,w:10,h:10,vx:e.dir*1.6,vy:0,g:0});SFX.shoot();puff(e.x+(e.dir>0?16:0),e.y+8,5,'#cfd8ea');}break;
    case 'ball':{e.x+=e.vx;e.vy+=e.g;e.y+=e.vy;
      if(solidAt(e.x+5,e.y+5)||e.y>VH||e.x<-20||e.x>W*TS+20){e.gone=true;puff(e.x+5,e.y+5,6);break;}
      for(const c of R.ents){
        if(c.k==='critter'&&c.alive&&overlap(e,c)){killCritter(c);e.gone=true;break;}
        if(c.k==='plant'&&c.alive&&c.inv===0&&c.phase!==0&&overlap(e,{x:c.x-12,y:c.y,w:24,h:24})){hurtPlant(c);e.gone=true;puff(e.x+5,e.y+5,8);break;}}
      if(e.gone)break;
      if(!P.dead&&overlap({x:P.x+2,y:P.y+2,w:8,h:10},e))killPlayer();break;}
    case 'plant':updatePlant(e,pBox);break;
    case 'boss':updateBoss(e,pBox);break;
    case 'icicle':updateIcicle(e);break;
    case 'goal':if(!P.dead&&!P.win&&overlap(pBox,e)){P.win=1;G.score+=5000;SFX.fanfare();for(let i=0;i<6;i++)setTimeout(()=>{burst(60+Math.random()*360,30+Math.random()*120,36);SFX.boom();},i*300);
        setTimeout(finishLevel,2200);}break;
    case 'suit':e.t++;if(e.t<14){e.y+=e.vy;}else{e.vx=e.vx||0.45;e.g=Math.min((e.g||0)+0.2,3);const r=moveBody(e,e.vx,e.g);if(r.down)e.g=0;if(r.l||r.r)e.vx*=-1;}
      if(e.t>10&&overlap(pBox,e)){e.gone=true;P.suit=true;G.suit=true;P.inv=20;G.score+=1000;SFX.fanfare();burst(e.x+6,e.y+6,20,[C.rose,'#fff',C.gold]);}break;
    case 'lift':{e.t+=0.02;const nx=e.x0+Math.sin(e.t)*e.ax,ny=e.y0+Math.sin(e.t)*e.ay;e.dx=nx-e.x;e.dy=ny-e.y;e.x=nx;e.y=ny;
      if(!P.dead&&P.fallV>=0&&P.x+P.w>e.x+1&&P.x<e.x+e.w-1&&P.prevB<=e.y+6+Math.max(0,-e.dy)&&P.y+P.h>=e.y-1){P.y=e.y-P.h;P.x+=e.dx;P.onG=true;P.vy=0;P.charge=true;P.drill=false;}break;}
    case 'tower':{if(!e.fly)break;e.anim++;e.vy+=0.22;e.y+=e.vy;
      if(e.y>=e.y0){e.y=e.y0;e.vy=0;e.fly=false;R.shake=5;SFX.stomp();puff(e.x+4,e.y+96,6,'#d4f4fc');puff(e.x+28,e.y+96,6,'#d4f4fc');break;}
      // the rising tower knocks any mole crossing the shaft cap off the strip
      const top={x:e.x-2,y:e.y-8,w:36,h:20};
      for(const c of R.ents)if(c.k==='critter'&&c.alive&&overlap(top,c)){c.dropAt={x:(e.tx-1)*TS+2,y:(e.ty-1)*TS};killCritter(c);G.score+=200;c.vy=-3;}
      break;}
    case 'critter':if(!e.alive){if(e.dt==null){e.dt=0;}e.dt++;e.vy+=0.25;e.y+=e.vy;break;}e.a+=0.1;
      if(!e.fly)walkEnt(e);
      if(!P.dead&&overlap(pBox,e)){if(P.fallV>0&&P.prevB<=e.y+6){killCritter(e);P.vy=-4;}else killPlayer();}break;
    case 'medal':e.t=(e.t||0)+1;if(overlap(pBox,e)){e.gone=true;G.collected.add(e.ck);G.medals++;G.score+=2000;SFX.key();burst(e.x+8,e.y+8,30,[C.gold,'#fff',C.rose]);}break;
    case 'check':if(!e.up&&overlap(pBox,e)){e.up=true;G.checkpoint={room:R.i,x:e.x,y:e.y+32};SFX.flip();burst(e.x+8,e.y,16,[C.teal,'#fff']);}break;
    case 'ladder':if(!P.dead&&P.onG&&keys.up&&overlap(pBox,e)&&!P.win){P.win=1;SFX.door();startIris(-1,()=>{G.room=R.parent;loadRoom(G.room,'x');startIris(1);});}break;
    }
  }
  const crit=R.ents.filter(e=>e.k==='critter');if(crit.length&&!R.keyDropped&&R.door==='key'&&!R.keyItem&&crit.every(c=>!c.alive)){R.keyDropped=true;SFX.fanfare();const at=R.lastCrit||{x:14*TS+10,y:1*TS};R.ents.push({k:'key',x:at.x,y:at.y,w:12,h:10,vy:0,free:true});burst(at.x+6,at.y+5,24,[C.gold,'#fff']);}
  R.ents=R.ents.filter(e=>!e.gone&&!(e.k==='blob'&&!e.alive&&e.dt>20)&&!(e.k==='critter'&&!e.alive&&e.dt>70));
  // door
  const d=R.doorEnt;if(d&&!P.dead&&P.onG&&hit('up')){
    if(overlap(pBox,{x:d.x+2,y:d.y,w:12,h:32})){
      const open=doorOpen();
      if(open){SFX.door();if(d.lock)d.lock=false;G.score+=500;P.win=0;d.opening=1;
        startIris(-1,()=>{G.room++;loadRoom(G.room);startIris(1);},P.x+6,P.y+7);}
      else{SFX.bump();R.shake=6;}}}
}
function killCritter(c){c.alive=false;c.vy=0;R.lastCrit=c.dropAt||{x:c.x+1,y:c.y+2};G.score+=100;SFX.stomp();burst(c.x+7,c.y+7,16,['#fff','#cfd8ea']);}
function hurtPlant(t){t.hp--;t.inv=40;SFX.hurt();G.score+=300;R.shake=8;t.phase=3;
  if(t.hp<=0){t.alive=false;SFX.boom();burst(t.x,t.y,40);G.score+=2000;R.ents.push({k:'key',x:t.x-6,y:t.y-30,w:12,h:10,vy:-3,free:true});}}
function doorOpen(){const d=R.door;if(d==='goal'||d==='cave')return true;if(d==='key')return R.hasKey;if(d==='switch')return R.flipped;if(d==='gems')return R.gemsLeft===0;return true;}

function updatePlant(e,pBox){
  if(!e.alive){e.dt=(e.dt||0)+1;return;}
  if(e.inv>0)e.inv--;
  e.t--;
  // phase 0 hidden, 1 rising, 2 up, 3 lowering
  if(e.phase===0&&e.t<=0){e.phase=1;e.t=0;}
  if(e.phase===1){e.y-=1;if(e.y<=e.base-44){e.phase=2;e.t=110;}}
  if(e.phase===2){if(e.t===60){R.ents.push({k:'ball',x:e.x+7,y:e.y,w:10,h:10,vx:(P.x>e.x?1:-1)*1.3,vy:-4.2,g:0.12});SFX.shoot();}
    if(e.t<=0)e.phase=3;}
  if(e.phase===3){e.y+=1;if(e.y>=e.base){e.phase=0;e.t=80;}}
  e.mouth=(Math.sin(G.frame*0.25)+1)/2;
  const box={x:e.x-12,y:e.y-4,w:24,h:Math.max(0,e.base-e.y+4)};
  if(!P.dead&&e.y<e.base-4&&overlap(pBox,box))killPlayer();
}
function updateBoss(e,pBox){
  if(!e.alive){e.dying++;if(e.dying%8===0)puff(e.x+Math.random()*40,e.y+Math.random()*50,6);
    if(e.dying===90){e.gone=true;burst(e.x+20,e.y+26,50);SFX.boom();
      const k={k:'key',x:e.x+14,y:e.y+10,w:12,h:10,vy:-3,free:true};R.ents.push(k);}return;}
  if(e.inv>0)e.inv--;
  e.x+=e.vx*(e.inv>0?0:1)*(e.hp===1?1.6:e.hp===2?1.25:1);
  if(e.x<7*TS){e.x=7*TS;e.vx=Math.abs(e.vx);}if(e.x+e.w>23*TS){e.x=23*TS-e.w;e.vx=-Math.abs(e.vx);}
  if(--e.t<=0&&e.inv===0){e.t=e.hp===1?70:e.hp===2?95:120;
    const tx=P.x+6,sx=e.x+20,sy=e.y+6;const dx=tx-sx;const T=60;
    R.ents.push({k:'ball',x:sx-5,y:sy,w:10,h:10,vx:dx/T,vy:-4.6,g:0.14});SFX.shoot();e.throwT=14;}
  if(e.throwT>0)e.throwT--;
  if(!P.dead&&overlap(pBox,{x:e.x+4,y:e.y+6,w:e.w-8,h:e.h-6}))killPlayer();
}
function updateIcicle(e){
  if(e.state==='hang'){e.wob=Math.sin(G.frame*0.1)*0.5;return;}
  if(e.state==='fall'){e.vy=Math.min(e.vy+0.25,6);e.y+=e.vy;
    if(!P.dead&&overlap({x:P.x+2,y:P.y+2,w:8,h:12},{x:e.x+e.w*0.3,y:e.y+e.h*0.4,w:e.w*0.4,h:e.h*0.6}))killPlayer();
    for(const t of R.ents){
      if(t.k==='plant'&&t.alive&&t.inv===0&&t.phase!==0&&overlap(e,{x:t.x-12,y:t.y,w:24,h:24})){hurtPlant(t);shatter(e);return;}
      if(t.k==='critter'&&t.alive&&overlap(e,t)){killCritter(t);G.score+=200;shatter(e);R.shake=6;return;}
      if(t.k==='boss'&&t.alive&&t.inv===0&&overlap(e,{x:t.x+4,y:t.y,w:t.w-8,h:20})){t.hp--;t.inv=60;shatter(e);SFX.hurt();R.shake=10;G.score+=500;
        if(t.hp<=0){t.alive=false;t.dying=0;G.score+=5000;}return;}}
    if(rectHitsSolid(e.x+2,e.y+e.h-4,e.w-4,4)||e.y>VH){shatter(e);}}
  if(e.state==='gone'){if(--e.t<=0){e.state='grow';e.y=e.home;e.g=0;}}
  if(e.state==='grow'){e.g+=0.04;if(e.g>=1)e.state='hang';}
}
function shatter(e){e.state='gone';e.t=100;SFX.crack();for(let i=0;i<14;i++)parts.push({x:e.x+e.w/2,y:e.y+e.h-4,vx:(Math.random()-0.5)*3,vy:-Math.random()*3,life:30,c:i%2?'#d4f4fc':'#86d6f0',g:0.15,sq:1});}

/* ---------- iris transition ---------- */
function startIris(dir,cb,cx,cy){iris={t:0,dir,cb,cx:(cx??(P?P.x+6:VW/2))-(cx!=null?camX:camX),cy:cy??(P?P.y+7:VH/2)};if(!P)iris.cx=VW/2;}
function irisRadius(){const max=Math.hypot(VW,VH);const k=Math.min(1,iris.t/40);return iris.dir<0?max*(1-k):max*k;}

/* ---------- drawing ---------- */
function drawBG(){
  if(R.theme==='grass'){const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#7cc8ef');g.addColorStop(1,'#d8f0fa');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.arc(420-camX*0.02,46,18,0,7);ctx.fill();ctx.fillStyle='rgba(255,243,176,.35)';ctx.beginPath();ctx.arc(420-camX*0.02,46,26,0,7);ctx.fill();
    {ctx.fillStyle='#a9cfe6';ctx.beginPath();ctx.moveTo(0,VH);for(let x=0;x<=VW;x+=8){const wx=x+camX*0.06;ctx.lineTo(x,150-40*Math.abs(Math.sin(wx*0.006))-14*Math.abs(Math.sin(wx*0.021+1)));}ctx.lineTo(VW,VH);ctx.fill();
     ctx.fillStyle='#e4f1f8';for(let x=0;x<=VW;x+=8){const wx=x+camX*0.06;const y=150-40*Math.abs(Math.sin(wx*0.006))-14*Math.abs(Math.sin(wx*0.021+1));if(y<112)ctx.fillRect(x,y,8,3);}}
    ctx.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<7;i++){const x=((i*173-camX*0.08-G.frame*0.1)%700+700)%700-80,y=20+(i*37)%70;
      ctx.beginPath();ctx.arc(x,y,10,0,7);ctx.arc(x+14,y-5,13,0,7);ctx.arc(x+30,y,10,0,7);ctx.fill();ctx.fillRect(x,y,30,10);}
    const layer=(par,base,amp,f,col,ph)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,VH);for(let x=0;x<=VW;x+=6){const wx=x+camX*par;ctx.lineTo(x,base-amp*(Math.sin(wx*f+ph)*0.6+Math.sin(wx*f*2.3+ph*2)*0.4));}ctx.lineTo(VW,VH);ctx.fill();};
    layer(0.15,170,34,0.008,'#b9e2d0',1);layer(0.3,200,28,0.012,'#8fcf9f',3);
    ctx.fillStyle='#6fb883';for(let i=0;i<14;i++){const x=((i*71-camX*0.3)%560+560)%560-40;const y=200-28*(Math.sin((x+camX*0.3)*0.012+3)*0.6+Math.sin((x+camX*0.3)*0.0276+6)*0.4);
      ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x+5,y-14);ctx.lineTo(x+10,y+2);ctx.fill();}
    return;}
  if(R.theme==='cave'){ctx.fillStyle='#1a2140';ctx.fillRect(0,0,VW,VH);
    for(let i=0;i<60;i++){const x=(i*137+i*i*7)%VW,y=(i*89+i*i*3)%VH;ctx.fillStyle=i%3?'#232c55':'#2c366a';ctx.beginPath();ctx.ellipse(x,y,6+(i%4)*3,4+(i%3)*2,i,0,7);ctx.fill();}
    for(let i=0;i<8;i++){const tw=(Math.sin(G.frame*0.04+i*2)+1)/2;ctx.fillStyle=`rgba(142,227,216,${0.2+tw*0.5})`;ctx.fillRect((i*61+17)%VW,(i*37+40)%VH,2,2);}return;}
  if(R.theme==='day'){const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#d6ebf7');g.addColorStop(1,'#f2f8fc');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='#c4dff0';for(let i=0;i<5;i++){const x=i*110+20;ctx.beginPath();ctx.moveTo(x,VH);ctx.lineTo(x,160);ctx.arc(x+30,160,30,Math.PI,0);ctx.lineTo(x+60,VH);ctx.fill();}
    ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<30;i++){const x=(i*67+G.frame*0.3*(1+i%3))%VW,y=(i*41+G.frame*(0.4+i%3*0.2))%VH;ctx.fillRect(x|0,y|0,1+(i%2),1+(i%2));}}
  else{const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#101a38');g.addColorStop(1,'#1f3263');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    for(let i=0;i<50;i++){const x=(i*97)%VW,y=(i*53)%VH;const tw=(Math.sin(G.frame*0.05+i)+1)/2;ctx.fillStyle=`rgba(255,255,255,${0.3+tw*0.6})`;ctx.fillRect(x,y,1,1);if(i%9===0){ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3);}}}
}
function drawTiles(){
  const day=R.theme==='day';
  const x0=Math.max(0,Math.floor(camX/TS)-1),x1=Math.min(W-1,x0+VW/TS+2);
  for(let y=0;y<H;y++)for(let x=x0;x<=x1;x++){const ch=R.t[y][x];const px=x*TS,py=y*TS;
    let by=0;if(R.bumps)for(const b of R.bumps)if(b.x===x&&b.y===y)by=-Math.sin(b.t/8*Math.PI)*4;
    if(R.theme==='grass'&&(ch==='#'||ch==='H')){
      const up=tileAt(x,y-1);const open=!(solidCh(up)||up==='/'||up==='\\');
      ctx.fillStyle=(y%3===1)?'#c27f42':'#c98545';ctx.fillRect(px,py,TS,TS);ctx.fillStyle='#b06f36';
      if((x+y*3)%4===0)ctx.fillRect(px+3,py+9,3,2);if((x*5+y)%3===0)ctx.fillRect(px+10,py+4,2,2);if((x+y)%5===0)ctx.fillRect(px+8,py+13,4,1);
      ctx.fillStyle='#dea06a';if((x*3+y)%4===1)ctx.fillRect(px+5,py+3,2,1);
      const lo=tileAt(x-1,y),ro=tileAt(x+1,y);ctx.fillStyle='#8f5a2c';
      if(!solidCh(lo)&&lo!=='/'&&lo!=='\\'&&x>0)ctx.fillRect(px,py,2,TS);if(!solidCh(ro)&&ro!=='/'&&ro!=='\\'&&x<W-1)ctx.fillRect(px+TS-2,py,2,TS);
      if(open){ctx.fillStyle='#3f9a3a';ctx.fillRect(px,py,TS,6);ctx.fillStyle='#6fce4f';ctx.fillRect(px,py,TS,4);ctx.fillStyle='#9be36c';ctx.fillRect(px,py,TS,1);
        ctx.fillStyle='#6fce4f';ctx.fillRect(px+((x*7)%12),py-2,1,2);ctx.fillRect(px+((x*3)%12)+2,py-1,1,1);
        const hsh=(x*2654435761>>>0)%23;if(hsh<4){const fx=px+3+hsh*3,fc=['#e8567a','#ffffff','#f2c14e','#c58bf0'][hsh];ctx.fillStyle='#3f9a3a';ctx.fillRect(fx+1,py-4,1,4);ctx.fillStyle=fc;ctx.fillRect(fx,py-6,3,3);ctx.fillStyle='#fff6b0';ctx.fillRect(fx+1,py-5,1,1);}
        else if(hsh===7||hsh===13){ctx.fillStyle='#4fb04a';ctx.beginPath();ctx.arc(px+5,py-2,4,Math.PI,0);ctx.arc(px+11,py-1,5,Math.PI,0);ctx.fill();ctx.fillStyle='#7ddb62';ctx.fillRect(px+3,py-4,2,1);ctx.fillRect(px+9,py-5,2,1);}
        else if(hsh===17){ctx.fillStyle='#8a5a2b';ctx.fillRect(px+2,py-8,2,8);ctx.fillRect(px+12,py-8,2,8);ctx.fillStyle='#c98a45';ctx.fillRect(px,py-7,16,2);ctx.fillRect(px,py-3,16,2);}}
      if(ch==='H'){ctx.fillStyle='#7c5a3a';ctx.fillRect(px-2,py-1,TS+4,5);ctx.fillStyle='#1a1410';ctx.beginPath();ctx.ellipse(px+8,py+3,7,3.5,0,0,7);ctx.fill();
        ctx.fillStyle='#b07a45';ctx.fillRect(px-2,py-2,2,4);ctx.fillRect(px+TS,py-2,2,4);}
    }else if(ch==='/'||ch==='\\'){
      const r=ch==='/';ctx.fillStyle='#c98545';ctx.beginPath();if(r){ctx.moveTo(px,py+TS);ctx.lineTo(px+TS,py);ctx.lineTo(px+TS,py+TS);}else{ctx.moveTo(px,py);ctx.lineTo(px+TS,py+TS);ctx.lineTo(px,py+TS);}ctx.fill();
      ctx.fillStyle='#b06f36';ctx.fillRect(px+(r?11:3),py+12,2,2);
      ctx.strokeStyle='#3f9a3a';ctx.lineWidth=5;ctx.beginPath();if(r){ctx.moveTo(px-1,py+TS+2);ctx.lineTo(px+TS+1,py+2);}else{ctx.moveTo(px-1,py+2);ctx.lineTo(px+TS+1,py+TS+2);}ctx.stroke();
      ctx.strokeStyle='#6fce4f';ctx.lineWidth=3;ctx.beginPath();if(r){ctx.moveTo(px-1,py+TS+0.5);ctx.lineTo(px+TS+1,py+0.5);}else{ctx.moveTo(px-1,py+0.5);ctx.lineTo(px+TS+1,py+TS+0.5);}ctx.stroke();
    }else if(ch==='W'){
      ctx.fillStyle='#6d7390';ctx.fillRect(px,py,TS,TS);ctx.fillStyle='#9aa1c0';ctx.fillRect(px+1,py+1,TS-2,TS-2);ctx.fillStyle='#b9c0dc';ctx.fillRect(px+1,py+1,TS-2,2);ctx.fillRect(px+1,py+1,2,TS-2);
      ctx.fillStyle='#6d7390';ctx.fillRect(px+5,py+5,6,6);ctx.fillStyle='#8a91b0';ctx.fillRect(px+6,py+6,4,4);
    }else if(ch==='b'||ch==='u'||ch==='q'){
      const used=ch==='u';ctx.fillStyle=used?'#6b5440':'#8a5a2b';ctx.fillRect(px,py+by,TS,TS);ctx.fillStyle=used?'#8c7560':'#c98a45';ctx.fillRect(px+1,py+1+by,TS-2,TS-2);
      ctx.fillStyle=used?'#6b5440':'#8a5a2b';ctx.fillRect(px+1,py+5+by,TS-2,1);ctx.fillRect(px+1,py+10+by,TS-2,1);
      if(ch==='q'){ctx.fillStyle=C.rose;ctx.beginPath();ctx.arc(px+8,py+9+by,4,Math.PI,0);ctx.fill();ctx.fillRect(px+4,py+9+by,8,2);ctx.fillStyle='#fff';ctx.fillRect(px+3,py+4+by,10,1.5);ctx.fillRect(px+7.5,py+3+by,1,3);}
      else if(!used){ctx.fillStyle=C.teal;ctx.beginPath();ctx.moveTo(px+8,py+3+by);ctx.lineTo(px+12,py+8+by);ctx.lineTo(px+8,py+13+by);ctx.lineTo(px+4,py+8+by);ctx.fill();ctx.fillStyle='#8ee3d8';ctx.fillRect(px+7,py+6+by,2,2);}
    }else if(ch==='#'&&R.theme==='cave'){
      ctx.fillStyle='#3a4a86';ctx.fillRect(px,py,TS,TS);ctx.fillStyle='#4d5fa5';if((x+y)%2===0)ctx.fillRect(px+2,py+3,6,4);if((x*3+y)%3===0)ctx.fillRect(px+9,py+9,5,4);
      const open=(dx,dy)=>!solidCh(tileAt(x+dx,y+dy));ctx.fillStyle='#8fb3e8';if(open(0,-1))ctx.fillRect(px,py,TS,2);ctx.fillStyle='#232e5c';if(open(0,1))ctx.fillRect(px,py+TS-2,TS,2);
      if(open(-1,0)){ctx.fillStyle='#6f8fd0';ctx.fillRect(px,py,2,TS);}if(open(1,0)){ctx.fillStyle='#6f8fd0';ctx.fillRect(px+TS-2,py,2,TS);}
    }else if(ch==='-'&&(R.theme==='grass'||R.theme==='cave')){
      ctx.fillStyle='#8a5a2b';ctx.fillRect(px,py,TS,6);ctx.fillStyle='#d69a55';ctx.fillRect(px,py,TS,4);ctx.fillStyle='#f0bd7c';ctx.fillRect(px,py,TS,1);
      ctx.fillStyle='#8a5a2b';ctx.fillRect(px+(x%2?4:11),py+1,1,3);
      if(tileAt(x-1,y)!=='-'){ctx.fillStyle='#6b4520';ctx.fillRect(px,py,2,6);}if(tileAt(x+1,y)!=='-'){ctx.fillStyle='#6b4520';ctx.fillRect(px+TS-2,py,2,6);}
    }else if(ch==='#'){
      const open=(dx,dy)=>!solidCh(tileAt(x+dx,y+dy))||tileAt(x+dx,y+dy)==='A'||tileAt(x+dx,y+dy)==='T';
      ctx.fillStyle=day?C.dayWall:C.nightWall;ctx.fillRect(px,py,TS,TS);
      if(day){ctx.fillStyle=C.dayDeep;if((x+y)%3===0)ctx.fillRect(px+5,py+6,2,2);if((x*7+y)%5===0)ctx.fillRect(px+11,py+11,2,2);}
      else{ctx.fillStyle=C.nightHi;if((x*3+y)%4===0)ctx.fillRect(px+4,py+5,2,1);if((x+y*5)%6===0){ctx.fillRect(px+10,py+10,1,3);ctx.fillRect(px+9,py+11,3,1);}}
      const edge=day?C.dayEdge:C.nightEdge;ctx.fillStyle=edge;
      if(open(0,1))ctx.fillRect(px,py+TS-3,TS,3);
      if(open(-1,0))ctx.fillRect(px,py,2,TS);
      if(open(1,0))ctx.fillRect(px+TS-2,py,2,TS);
      if(open(0,-1)){ctx.fillStyle=C.snow;ctx.fillRect(px,py,TS,4);ctx.fillRect(px+((x*5)%10),py+4,5,2);ctx.fillStyle=day?'#dde8f6':'#bfeaf7';ctx.fillRect(px,py+5,TS,1);}
    }else if(ch==='-'){
      ctx.fillStyle='#ffffff';ctx.fillRect(px,py+2,TS,5);ctx.beginPath();ctx.arc(px+5,py+4,4,Math.PI,0);ctx.arc(px+12,py+4,3,Math.PI,0);ctx.fill();
      ctx.fillStyle=day?'#b9cbe8':'#7fb6dc';ctx.fillRect(px,py+7,TS,2);ctx.fillStyle=day?'#8da2cf':'#5a8fbd';ctx.fillRect(px+2,py+9,2,2);ctx.fillRect(px+10,py+9,2,1);
    }else if(ch==='A'||ch==='T'){
      const on=(ch==='A')===(R.flip===0);const[m,hi,lo]=ch==='A'?[C.amber,C.amberHi,C.amberLo]:[C.teal,C.tealHi,C.tealLo];
      const rev=ch==='T'&&R.msgCells.length&&y<8;
      if(on){ctx.fillStyle=lo;ctx.fillRect(px,py+by,TS,TS);ctx.fillStyle=m;ctx.fillRect(px+1,py+1+by,TS-2,TS-2);ctx.fillStyle=hi;ctx.fillRect(px+1,py+1+by,TS-2,2);ctx.fillRect(px+1,py+1+by,2,TS-2);
        ctx.fillStyle=lo;if(ch==='A'){ctx.fillRect(px+6,py+6,4,4);ctx.fillStyle=hi;ctx.fillRect(px+7,py+7,2,2);}else{ctx.beginPath();ctx.arc(px+8,py+8,3.5,0,7);ctx.fill();ctx.fillStyle=m;ctx.beginPath();ctx.arc(px+9.5,py+7,3,0,7);ctx.fill();}
        if(rev&&R.reveal){const tw=(Math.sin(G.frame*0.15+x+y)+1)/2;ctx.fillStyle=`rgba(255,255,255,${tw*0.35})`;ctx.fillRect(px+1,py+1,TS-2,TS-2);}}
      else{ctx.strokeStyle=m;ctx.globalAlpha=0.75;ctx.setLineDash([2,2]);ctx.strokeRect(px+1.5,py+1.5,TS-3,TS-3);ctx.setLineDash([]);ctx.globalAlpha=1;}
    }else if(ch==='S'){
      ctx.fillStyle='#2b3150';ctx.fillRect(px,py+by,TS,TS);ctx.fillStyle='#454d78';ctx.fillRect(px+1,py+1+by,TS-2,TS-2);
      if(R.flip===0){ctx.fillStyle=C.amber;ctx.beginPath();ctx.arc(px+8,py+8+by,4,0,7);ctx.fill();ctx.fillStyle=C.amberHi;for(let i=0;i<8;i++){const a=i*Math.PI/4+G.frame*0.02;ctx.fillRect(px+8+Math.cos(a)*6-0.5,py+8+by+Math.sin(a)*6-0.5,1.5,1.5);}}
      else{ctx.fillStyle=C.tealHi;ctx.beginPath();ctx.arc(px+8,py+8+by,5,0,7);ctx.fill();ctx.fillStyle='#454d78';ctx.beginPath();ctx.arc(px+10,py+6.5+by,4.2,0,7);ctx.fill();}
    }else if(ch==='<'||ch==='>'){
      ctx.fillStyle='#343a5a';ctx.fillRect(px,py,TS,TS);ctx.fillStyle='#4b5380';ctx.fillRect(px,py+1,TS,5);
      const off=((ch==='<'?-1:1)*G.frame*0.9)%8;ctx.fillStyle=C.amber;
      for(let i=-1;i<3;i++){const cx=px+i*8+((off+8)%8);if(cx<px-2||cx>px+TS-2)continue;ctx.fillRect(cx,py+2,2,1);ctx.fillRect(cx+(ch==='<'?-1:1),py+3,2,1);ctx.fillRect(cx,py+4,2,1);}
      ctx.fillStyle='#232842';ctx.fillRect(px,py+10,TS,6);ctx.fillStyle='#6a73a6';ctx.beginPath();ctx.arc(px+8,py+12,2.5,0,7);ctx.fill();
    }else if(ch==='^'){
      ctx.fillStyle='#bfe9f7';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(px+i*4,py+TS);ctx.lineTo(px+i*4+2,py+5);ctx.lineTo(px+i*4+4,py+TS);ctx.fill();}
      ctx.fillStyle='#ffffff';for(let i=0;i<4;i++)ctx.fillRect(px+i*4+2,py+7,1,4);
    }
  }
  if(R.bumps){R.bumps.forEach(b=>b.t--);R.bumps=R.bumps.filter(b=>b.t>0);}
}
function drawDoor(d){
  const x=d.x,y=d.y,open=doorOpen();
  ctx.fillStyle='#5a3a22';ctx.beginPath();ctx.moveTo(x,y+32);ctx.lineTo(x,y+8);ctx.arc(x+8,y+8,8,Math.PI,0);ctx.lineTo(x+16,y+32);ctx.fill();
  ctx.fillStyle=open?'#b07a45':'#8a6a55';ctx.beginPath();ctx.moveTo(x+2,y+32);ctx.lineTo(x+2,y+8);ctx.arc(x+8,y+8,6,Math.PI,0);ctx.lineTo(x+14,y+32);ctx.fill();
  ctx.fillStyle='#8b5a30';ctx.fillRect(x+5,y+6,1,26);ctx.fillRect(x+10,y+6,1,26);
  if(open){ctx.fillStyle=C.gold;ctx.fillRect(x+11,y+19,2,2);
    const g=(Math.sin(G.frame*0.1)+1)/2;ctx.strokeStyle=`rgba(255,220,140,${0.3+g*0.5})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-0.5,y+32);ctx.lineTo(x-0.5,y+8);ctx.arc(x+8,y+8,8.5,Math.PI,0);ctx.lineTo(x+16.5,y+32);ctx.stroke();
    if(P&&Math.abs(P.x+6-(x+8))<12&&Math.abs(P.y-(y+16))<20&&!P.dead){ctx.fillStyle='#fff';ctx.font=`8px ${FONT}`;ctx.textAlign='center';ctx.fillText('▲ enter',x+8,y-4);}}
  else if(R.door==='key'){ctx.fillStyle='#c9ced9';ctx.fillRect(x+4,y+17,8,7);ctx.strokeStyle='#c9ced9';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+8,y+17,2.6,Math.PI,0);ctx.stroke();ctx.fillStyle='#454d78';ctx.fillRect(x+7,y+19,2,3);}
  else{ctx.fillStyle='#c9ced9';ctx.fillRect(x+1,y+14,14,2);ctx.fillRect(x+1,y+22,14,2);
    if(R.door==='gems'){ctx.fillStyle='#fff';ctx.font=`8px ${FONT}`;ctx.textAlign='center';ctx.fillText(R.gemsLeft,x+8,y-3);}}
}
function drawGem(x,y,t){const s=Math.abs(Math.cos(t));const w=Math.max(1,10*s);
  ctx.fillStyle='#2fa7a0';ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+5+w/2,y+3);ctx.lineTo(x+5+w/2,y+7);ctx.lineTo(x+5,y+10);ctx.lineTo(x+5-w/2,y+7);ctx.lineTo(x+5-w/2,y+3);ctx.fill();
  ctx.fillStyle='#8ee3d8';ctx.beginPath();ctx.moveTo(x+5,y+1.5);ctx.lineTo(x+5+w/2-1,y+3.5);ctx.lineTo(x+5,y+5);ctx.lineTo(x+5-w/2+1,y+3.5);ctx.fill();
  if(s>0.7){ctx.fillStyle='#fff';ctx.fillRect(x+3,y+3,1,2);}}
function drawKey(x,y){ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(x+3.5,y+5,3.5,0,7);ctx.fill();ctx.fillRect(x+6,y+4,6,2);ctx.fillRect(x+9,y+6,1,3);ctx.fillRect(x+11,y+6,1,2);
  ctx.fillStyle='#9a6f12';ctx.beginPath();ctx.arc(x+3.5,y+5,1.4,0,7);ctx.fill();}
function drawEnts(){
  for(const e of R.ents){
    switch(e.k){
    case 'sign':{const x=e.x,y=e.y;ctx.fillStyle='#7c5a3a';ctx.fillRect(x+7,y+6,2,10);ctx.fillStyle='#b07a45';ctx.fillRect(x+1,y+1,14,8);ctx.fillStyle=C.rose;
      if(e.dir==='r'){ctx.fillRect(x+3,y+4,7,2);ctx.beginPath();ctx.moveTo(x+9,y+2);ctx.lineTo(x+13,y+5);ctx.lineTo(x+9,y+8);ctx.fill();}
      else if(e.dir==='d'){ctx.fillRect(x+7,y+2,2,4);ctx.beginPath();ctx.moveTo(x+4,y+5);ctx.lineTo(x+8,y+8.5);ctx.lineTo(x+12,y+5);ctx.fill();}
      else{ctx.fillRect(x+7,y+4,2,4);ctx.beginPath();ctx.moveTo(x+4,y+5);ctx.lineTo(x+8,y+1.5);ctx.lineTo(x+12,y+5);ctx.fill();}break;}
    case 'gem':if(e.hidden&&!R.flipped){ctx.strokeStyle='rgba(142,227,216,.45)';ctx.lineWidth=1;ctx.setLineDash([2,2]);ctx.strokeRect(e.x+0.5,e.y+0.5,9,9);ctx.setLineDash([]);break;}
      if(!e.got)drawGem(e.x,e.y+Math.sin(G.frame*0.08+e.x)*1.2,G.frame*0.06+e.x*0.1);break;
    case 'edoor':{const x=e.x,y=e.y;ctx.fillStyle='#5a3a22';ctx.beginPath();ctx.moveTo(x,y+32);ctx.lineTo(x,y+8);ctx.arc(x+8,y+8,8,Math.PI,0);ctx.lineTo(x+16,y+32);ctx.fill();
      ctx.fillStyle='#8a6a55';ctx.beginPath();ctx.moveTo(x+2,y+32);ctx.lineTo(x+2,y+8);ctx.arc(x+8,y+8,6,Math.PI,0);ctx.lineTo(x+14,y+32);ctx.fill();
      ctx.fillStyle='#6b4a33';ctx.fillRect(x+5,y+6,1,26);ctx.fillRect(x+10,y+6,1,26);ctx.fillStyle='#c9ced9';ctx.fillRect(x+11,y+19,2,2);break;}
    case 'key':if(!R.hasKey)drawKey(e.x,e.y+(e.free?0:Math.sin(G.frame*0.08)*1.5));break;
    case 'spring':{const sq=e.sq>0?Math.sin(e.sq/10*Math.PI)*5:0;ctx.fillStyle='#454d78';ctx.fillRect(e.x+1,e.y+13,14,3);
      ctx.strokeStyle=C.rose;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<4;i++){const yy=e.y+5+sq+i*(8-sq)/3.5;ctx.moveTo(e.x+3,yy);ctx.lineTo(e.x+13,yy+1.5);}ctx.stroke();
      ctx.fillStyle='#e7eff9';ctx.fillRect(e.x,e.y+3+sq,16,3);ctx.fillStyle=C.rose;ctx.fillRect(e.x,e.y+3+sq,16,1);break;}
    case 'ring':{ctx.save();ctx.translate(e.x,e.y);const sc=1+0.06*Math.sin(e.spin*3);ctx.scale(sc,sc);
      ctx.strokeStyle='#9a6f12';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();ctx.strokeStyle=C.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();
      ctx.strokeStyle='#fff6d8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,11,e.spin,e.spin+1);ctx.stroke();
      ctx.fillStyle=C.rose;const d=e.dx;ctx.beginPath();ctx.moveTo(5*d,0);ctx.lineTo(-2*d,-5);ctx.lineTo(-2*d,5);ctx.fill();ctx.restore();break;}
    case 'blob':if(e.alive){const bob=Math.abs(Math.sin(e.a*2))*1;spr(R.theme==='grass'?'blob_g':'blob',e.x-1,e.y-2-bob,e.vx>0);}
      else{ctx.fillStyle='#fff';ctx.fillRect(e.x,e.y+10,14,4);ctx.fillStyle='#a9bfe0';ctx.fillRect(e.x+1,e.y+13,12,1);}break;
    case 'cannon':{const x=e.x,y=e.y;ctx.fillStyle='#343a5a';ctx.fillRect(x,y,16,16);ctx.fillStyle='#4b5380';ctx.fillRect(x+1,y+1,14,14);
      ctx.fillStyle='#1d2433';ctx.beginPath();ctx.arc(x+(e.dir>0?14:2),y+8,5,0,7);ctx.fill();ctx.fillStyle='#e7eff9';ctx.fillRect(x+4,y+2,8,2);break;}
    case 'ball':ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(e.x+5,e.y+5,5,0,7);ctx.fill();ctx.fillStyle='#a9bfe0';ctx.beginPath();ctx.arc(e.x+6,e.y+6.5,3,0,Math.PI);ctx.fill();break;
    case 'tower':{const x=e.x,y=Math.round(e.y);ctx.fillStyle='#232842';ctx.fillRect(x,y,32,96);ctx.fillStyle='#343a5a';ctx.fillRect(x+2,y+2,28,92);
      ctx.fillStyle=e.fly?C.gold:'#8a93c4';for(let i=0;i<5;i++){const yy=y+18+i*15-((e.fly?e.anim*1.5:0)%15);if(yy>y+8&&yy<y+90){ctx.beginPath();ctx.moveTo(x+6,yy+6);ctx.lineTo(x+16,yy);ctx.lineTo(x+26,yy+6);ctx.lineTo(x+26,yy+9);ctx.lineTo(x+16,yy+3);ctx.lineTo(x+6,yy+9);ctx.fill();}}
      ctx.fillStyle='#1d2433';ctx.fillRect(x+2,y-6,28,10);ctx.fillStyle=e.fly?'#fff':'#8ee3d8';ctx.fillRect(x+6,y-4,20,4);ctx.fillStyle='#e7eff9';ctx.fillRect(x+4,y-8,24,3);
      ctx.fillStyle=e.fly?C.amberHi:C.amber;ctx.fillRect(x+3,y+92,26,3);break;}
    case 'critter':if(!e.alive){ctx.save();ctx.translate(e.x+7,e.y+7);ctx.rotate(e.dt*0.25);ctx.globalAlpha=Math.max(0,1-e.dt/70);spr('blob',-8,-8,false);ctx.restore();break;}
      {const bob=Math.abs(Math.sin(e.a*2))*2;
      if(e.fly){ctx.fillStyle='#e7eff9';const f=Math.sin(e.a*6)*3;ctx.beginPath();ctx.moveTo(e.x-1,e.y+4-bob);ctx.lineTo(e.x-9,e.y-2-f-bob);ctx.lineTo(e.x-2,e.y+9-bob);ctx.moveTo(e.x+15,e.y+4-bob);ctx.lineTo(e.x+23,e.y-2-f-bob);ctx.lineTo(e.x+16,e.y+9-bob);ctx.fill();}
      spr('blob',e.x-1,e.y-2-bob,Math.sin(e.a*0.5)>0);
      if(R.door==='key'&&!R.keyItem&&R.ents.filter(c=>c.k==='critter').length===1)drawKey(e.x+1,e.y+14-bob);}break;
    case 'suit':drawCap(e.x+6,e.y+8,G.frame*0.5,1.2);break;
    case 'lift':{ctx.fillStyle='#8a5a2b';ctx.fillRect(e.x,e.y,32,8);ctx.fillStyle='#d69a55';ctx.fillRect(e.x,e.y,32,5);ctx.fillStyle='#f0bd7c';ctx.fillRect(e.x,e.y,32,1);ctx.fillStyle='#6b4520';ctx.fillRect(e.x,e.y,2,8);ctx.fillRect(e.x+30,e.y,2,8);ctx.fillRect(e.x+15,e.y+1,2,5);
      ctx.strokeStyle='rgba(107,69,32,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x+4,e.y);ctx.lineTo(e.x0+4,-20);ctx.moveTo(e.x+28,e.y);ctx.lineTo(e.x0+28,-20);ctx.stroke();break;}
    case 'medal':{const t=(e.t||0)*0.05,cx=e.x+8,cy=e.y+8+Math.sin(t*2)*1.5,sx=Math.max(0.15,Math.abs(Math.cos(t)));
      ctx.save();ctx.translate(cx,cy);ctx.scale(sx,1);ctx.fillStyle='#9a6f12';ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(0,0,8,0,7);ctx.fill();
      ctx.fillStyle=C.rose;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillRect(Math.cos(a)*5.5-1,Math.sin(a)*5.5-1,2,2);}ctx.fillStyle='#ffe7a8';ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-5,-5,2,2);ctx.restore();break;}
    case 'check':{const x=e.x,y=e.y;ctx.fillStyle='#7c5a3a';ctx.fillRect(x+7,y,2,48);ctx.fillStyle=e.up?C.teal:'#9aa1c0';
      const fy=e.up?y+2:y+30,w=Math.sin(G.frame*0.12)*1.5;ctx.beginPath();ctx.moveTo(x+9,fy);ctx.lineTo(x+22,fy+5+w);ctx.lineTo(x+9,fy+11);ctx.fill();
      ctx.fillStyle='#fff';ctx.fillRect(x+12,fy+4,3,3);break;}
    case 'ladder':{const x=e.x,y=e.y;ctx.fillStyle='#b07a45';ctx.fillRect(x+2,y-60,2,92);ctx.fillRect(x+12,y-60,2,92);for(let yy=y-56;yy<y+32;yy+=6)ctx.fillRect(x+3,yy,10,2);
      if(Math.abs(P.x+6-(x+8))<12&&!P.dead){ctx.fillStyle='#fff';ctx.font=`8px ${FONT}`;ctx.textAlign='center';ctx.fillText('▲ climb out',x+8,y-64);}break;}
    case 'plant':drawPlant(e);break;
    case 'boss':drawBoss(e);break;
    case 'icicle':drawIcicle(e);break;
    case 'goal':{const x=e.x,y=e.y;ctx.fillStyle='#7c5a3a';ctx.fillRect(x+7,y,2,64);ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(x+8,y,3,0,7);ctx.fill();
      const w=Math.sin(G.frame*0.12)*2;ctx.fillStyle=C.teal;ctx.beginPath();ctx.moveTo(x+9,y+4);ctx.lineTo(x+26,y+10+w);ctx.lineTo(x+9,y+18);ctx.fill();
      ctx.fillStyle='#fff';ctx.font=`bold 7px ${FONT}`;ctx.textAlign='left';ctx.fillText('26',x+11,y+13);break;}
    }
  }
  if(R.doorEnt)drawDoor(R.doorEnt);
}
function drawPlant(e){
  if(!e.alive)return;const x=e.x,top=e.y,base=e.base;
  ctx.save();ctx.beginPath();ctx.rect(x-20,0,40,base-2);ctx.clip();
  if(e.inv>0&&e.inv%6<3)ctx.globalAlpha=0.4;
  ctx.fillStyle='#3f97c4';ctx.fillRect(x-2,top+16,4,base-top);
  ctx.fillStyle='#86d6f0';ctx.beginPath();ctx.ellipse(x-7,top+26,6,3,-0.5,0,7);ctx.ellipse(x+7,top+30,6,3,0.5,0,7);ctx.fill();
  const m=e.mouth*5;
  ctx.fillStyle='#d4f4fc';ctx.beginPath();ctx.moveTo(x-11,top+8);ctx.lineTo(x-8,top-2-m);ctx.lineTo(x-3,top+3-m);ctx.lineTo(x,top-5-m);ctx.lineTo(x+3,top+3-m);ctx.lineTo(x+8,top-2-m);ctx.lineTo(x+11,top+8);ctx.fill();
  ctx.beginPath();ctx.moveTo(x-11,top+10);ctx.lineTo(x-8,top+19+m*0.4);ctx.lineTo(x,top+22+m*0.4);ctx.lineTo(x+8,top+19+m*0.4);ctx.lineTo(x+11,top+10);ctx.fill();
  ctx.fillStyle='#1d2433';ctx.fillRect(x-9,top+8,18,2+m*0.5);
  ctx.fillStyle='#fff';for(let i=-8;i<8;i+=4){ctx.fillRect(x+i,top+8,2,2);}
  ctx.fillStyle=C.rose;ctx.fillRect(x-5,top+2-m*0.6,2,2);ctx.fillRect(x+3,top+2-m*0.6,2,2);
  ctx.restore();
  // hp pips
  for(let i=0;i<3;i++){ctx.fillStyle=i<e.hp?C.rose:'rgba(255,255,255,.25)';ctx.fillRect(x-8+i*6,base+22,4,3);}
}
function drawBoss(e){
  const x=e.x,y=e.y;ctx.save();
  if(!e.alive){ctx.globalAlpha=Math.max(0,1-e.dying/90);ctx.translate((Math.random()-0.5)*3,e.dying*0.2);}
  else if(e.inv>0&&e.inv%8<4)ctx.globalAlpha=0.45;
  const cx=x+20,step=Math.sin(G.frame*0.15)*1.5;
  const ball=(yy,r)=>{ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(cx,y+yy,r,0,7);ctx.fill();ctx.fillStyle='#c9d6ea';ctx.beginPath();ctx.arc(cx+2,y+yy+2,r-1,0.1,Math.PI-0.1);ctx.fill();};
  ball(40+step*0.2,14);ball(24,11);
  // arms
  ctx.strokeStyle='#7c5a3a';ctx.lineWidth=2;const up=e.throwT>0?-10:0;
  ctx.beginPath();ctx.moveTo(cx-10,y+24);ctx.lineTo(cx-22,y+16+up);ctx.moveTo(cx-18,y+18+up*0.7);ctx.lineTo(cx-22,y+22+up);ctx.moveTo(cx+10,y+24);ctx.lineTo(cx+22,y+16+up);ctx.moveTo(cx+18,y+18+up*0.7);ctx.lineTo(cx+24,y+20+up);ctx.stroke();
  ball(9,9);
  // hat (knit)
  ctx.fillStyle=C.rose;ctx.fillRect(cx-9,y-2,18,6);ctx.beginPath();ctx.arc(cx,y-2,8,Math.PI,0);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,y-11,3,0,7);ctx.fill();
  ctx.fillStyle='#a8345a';for(let i=-8;i<9;i+=3)ctx.fillRect(cx+i,y+1,1,3);
  // angry face
  ctx.fillStyle='#1d2433';ctx.fillRect(cx-5,y+7,3,3);ctx.fillRect(cx+2,y+7,3,3);
  ctx.fillRect(cx-6,y+5,4,1);ctx.fillRect(cx-3,y+6,1,1);ctx.fillRect(cx+2,y+5,4,1);ctx.fillRect(cx+2,y+6,1,1);
  ctx.fillStyle=C.amber;ctx.beginPath();const d=e.vx>0?1:-1;ctx.moveTo(cx,y+11);ctx.lineTo(cx+8*d,y+12.5);ctx.lineTo(cx,y+14);ctx.fill();
  ctx.fillStyle='#1d2433';for(let i=-3;i<=3;i+=2)ctx.fillRect(cx+i*1.3-0.5,y+15+Math.abs(i)*-0.3,1.5,1.5);
  for(let i=0;i<3;i++)ctx.fillRect(cx-1,y+20+i*6,2,2);
  ctx.restore();
  if(e.alive)for(let i=0;i<3;i++){ctx.fillStyle=i<e.hp?C.rose:'rgba(255,255,255,.25)';ctx.fillRect(x+10+i*7,y-18,5,3);}
}
function drawIcicle(e){
  if(e.state==='gone')return;const s=e.state==='grow'?e.g:1;const x=e.x+(e.wob||0),y=e.y,w=e.w,h=e.h*s;
  ctx.fillStyle='#86d6f0';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w/2,y+h);ctx.fill();
  ctx.fillStyle='#d4f4fc';ctx.beginPath();ctx.moveTo(x+w*0.2,y);ctx.lineTo(x+w*0.45,y);ctx.lineTo(x+w/2,y+h*0.8);ctx.fill();
  if(e.state==='hang'){ctx.fillStyle='#e7eff9';ctx.fillRect(x-3,y-2,w+6,3);
    // target shadow
    let yy=y+h;while(yy<VH&&!solidAt(x+w/2,yy))yy+=4;ctx.fillStyle='rgba(134,214,240,.25)';ctx.fillRect(x+w/2-6,yy-2,12,2);}
}
function drawPlayer(){
  if(!P)return;if(P.inv>0&&P.inv%4<2)return;
  let key='pen_stand';
  if(P.dead)key='pen_dead';else if(!P.onG||P.boost)key='pen_jump';else if(Math.abs(P.vx)>0.1)key=(Math.floor(P.anim)%2)?'pen_walk':'pen_stand';
  if(P.suit&&!P.onG&&!P.charge&&!P.dead){ctx.save();ctx.translate(P.x+6,P.y+5);ctx.rotate(Math.sin(P.spin)*0.15);ctx.translate(-(P.x+6),-(P.y+5));spr(key,P.x-2,P.y-2,P.face<0);ctx.restore();}
  else spr(key,P.x-2,P.y-2,P.face<0);
  if(P.suit&&!P.dead)drawCap(P.x+6+(P.face<0?1:-1),P.y-1,(P.suit&&!P.onG&&!P.charge)?P.spin:G.frame*0.05);
  if(R.hasKey&&!P.dead){drawKey(P.x-1+(P.face<0?8:-8)+Math.sin(G.frame*0.1)*1,P.y-8+Math.cos(G.frame*0.08)*1.5);}
}
function drawCap(cx,cy,spin,sc=1){ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);
  ctx.fillStyle=C.rose;ctx.beginPath();ctx.arc(0,0,5,Math.PI,0);ctx.fill();ctx.fillStyle='#a8345a';ctx.fillRect(-5,-0.5,10,1.5);ctx.fillStyle=C.gold;ctx.fillRect(-0.5,-7,1,3);
  const w=Math.abs(Math.cos(spin))*6+1;ctx.fillStyle='#e7eff9';ctx.fillRect(-w,-8,w*2,1.5);ctx.restore();}
function drawParts(){for(const p of parts){p.vx*=0.98;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.life--;
  ctx.globalAlpha=Math.min(1,p.life/15);if(p.c==='gem'){drawGem(p.x,p.y,G.frame*0.3);}else{ctx.fillStyle=p.c;ctx.fillRect(p.x|0,p.y|0,2,2);}}ctx.globalAlpha=1;parts=parts.filter(p=>p.life>0);}
function drawHUD(){
  ctx.fillStyle='rgba(16,24,48,.55)';ctx.fillRect(0,0,VW,14);
  ctx.font=`10px ${FONT}`;ctx.textBaseline='middle';ctx.textAlign='left';
  drawGem(6,2,0.3);ctx.fillStyle='#fff';ctx.fillText('× '+G.gems,19,7.5);
  if(R.level===1){ctx.fillText('L1  Room '+(R.i+1)+' / '+L1_ROOMS,62,7.5);ctx.fillStyle='#cfd8ea';ctx.fillText(R.title,172,7.5);}
  else{ctx.fillText('L2',62,7.5);for(let i=0;i<3;i++){ctx.fillStyle=i<G.medals?C.gold:'rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(88+i*12,7,4.5,0,7);ctx.fill();}
    ctx.fillStyle='#cfd8ea';ctx.fillText(R.title,130,7.5);}
  if(P&&P.suit)drawCap(330,8,G.frame*0.1,0.9);
  ctx.textAlign='right';ctx.fillStyle='#fff';ctx.fillText(String(G.score).padStart(8,'0'),400,7.5);
  ctx.fillStyle=G.time<100?'#ff9aa8':'#fff';ctx.fillText('⏱ '+Math.ceil(G.time),474,7.5);ctx.textBaseline='alphabetic';
  if(R.titleT>0){R.titleT--;const a=Math.min(1,R.titleT/30);ctx.globalAlpha=a;ctx.fillStyle='rgba(16,24,48,.7)';ctx.fillRect(VW/2-90,VH/2-60,180,26);
    ctx.fillStyle='#fff';ctx.font=`14px ${FONT}`;ctx.textAlign='center';ctx.fillText(R.title,VW/2,VH/2-42);ctx.globalAlpha=1;}
  // hint
  const hints={switch:'Hit the switch block from below',towers:'A powered tower fires straight up',key:'Find the key, then press ▲ at the door',gems:'Collect every gem to open the door',goal:R.level===2?'Find the 3 sun medallions · with the whirly cap, press jump in mid-air to fly, hold ▼ to drill':'',cave:'Press ▲ at the ladder to climb out'};
  if(R.titleT>0&&hints[R.door]){ctx.globalAlpha=Math.min(1,R.titleT/30);ctx.font=`9px ${FONT}`;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(hints[R.door],VW/2,VH/2-24);ctx.globalAlpha=1;}
}
function drawIris(){if(iris.dir===0&&iris.t===0)return;const r=irisRadius();if(r>Math.hypot(VW,VH)-1&&iris.dir>0)return;
  ctx.fillStyle='#000';ctx.beginPath();ctx.rect(0,0,VW,VH);ctx.arc(iris.cx,iris.cy,Math.max(0,r),0,Math.PI*2,true);ctx.fill('evenodd');}

/* ---------- screens ---------- */
function banner(title,y){ctx.fillStyle=C.amber;ctx.fillRect(60,y,360,34);ctx.fillStyle=C.amberHi;ctx.fillRect(60,y,360,3);ctx.fillStyle=C.amberLo;ctx.fillRect(60,y+31,360,3);
  ctx.fillStyle='#1d2433';ctx.font=`16px ${FONT}`;ctx.textAlign='center';ctx.fillText(title,VW/2,y+22);}
function drawTitle(){
  R=R||{theme:'night'};drawBG();
  banner('✦ New Year Minigames ✦',46);
  ctx.fillStyle='#cfd8ea';ctx.font=`10px ${FONT}`;ctx.fillText('Two levels of switch puzzles, slopes and secrets',VW/2,98);
  const bob=Math.sin(G.frame*0.08)*2;ctx.save();ctx.translate(VW/2-16,118+bob);ctx.scale(2,2);spr('pen_stand',0,0,false);ctx.restore();
  const names=['Level 1  Frost festival','Level 2  Meadow run'];ctx.font=`11px ${FONT}`;
  names.forEach((n,i)=>{const x=VW/2+(i?86:-86);ctx.fillStyle=G.sel===i?C.amber:'rgba(255,255,255,.12)';ctx.fillRect(x-82,160,164,20);ctx.fillStyle=G.sel===i?'#1d2433':'#cfd8ea';ctx.fillText(n,x,174);});
  ctx.fillStyle='#fff';ctx.font=`10px ${FONT}`;if(Math.floor(G.frame/30)%2===0)ctx.fillText(matchMedia('(pointer:coarse)').matches?'◀ ▶ pick a level, then tap Jump':'← → pick a level, Enter to start',VW/2,194);
  ctx.fillStyle='#9fb0d6';ctx.font=`9px ${FONT}`;
  ctx.fillText('← →  move     Z / Space  jump     X / Shift  run     ▲ door    ▼ burrow',VW/2,216);
  ctx.fillText('R  restart room     P  pause     M  mute',VW/2,230);
  const b=G.best['L'+(G.sel+1)];if(b)ctx.fillText(`Best clear: ${b.time.toFixed(1)}s`,VW/2,252);
}
function drawEnd(){
  const clear=G.mode==='clear';R={theme:'night'};drawBG();banner(clear?'Level 1 clear!':'GG!  Happy 2026',50);
  ctx.fillStyle='#fff';ctx.font=`11px ${FONT}`;ctx.textAlign='center';
  const lines=[`Time  ${G.lvClock.toFixed(1)}s`,`Gems  ${G.gems}`,`Score  ${G.score}`,G.level===2?`Sun medallions  ${G.medals} / 3`:`Falls  ${G.deaths}`];
  lines.forEach((l,i)=>ctx.fillText(l,VW/2,112+i*18));
  const bb=G.best['L'+G.level];if(bb)ctx.fillStyle='#9fb0d6',ctx.fillText(`Best  ${bb.time.toFixed(1)}s`,VW/2,192);
  ctx.fillStyle='#fff';if(Math.floor(G.frame/30)%2===0)ctx.fillText(clear?(matchMedia('(pointer:coarse)').matches?'Tap to start Level 2':'Press Enter for Level 2'):(matchMedia('(pointer:coarse)').matches?'Tap to return to the title':'Press Enter to return to the title'),VW/2,226);
  if(G.frame%40===0)burst(40+Math.random()*400,30+Math.random()*80,30);drawParts();
}
function saveBest(){const k='L'+G.level,cur={time:G.lvClock,score:G.score};if(!G.best[k]||cur.time<G.best[k].time){G.best[k]=cur;try{localStorage.setItem('nym-best2',JSON.stringify(G.best));}catch(e){}}}
function startGame(lv){const L=LEVEL_INFO[lv];G={...G,mode:'play',room:L.start,time:L.time,gems:0,score:0,deaths:0,clock:0,collected:new Set(),medals:0,checkpoint:null,level:L.n,lvClock:0,suit:false};loadRoom(L.start);startIris(1);}
function finishLevel(){const L=LEVEL_INFO[G.level-1];saveBest();const nx=LEVEL_INFO[G.level];G.mode=nx?'clear':'end';}
function nextLevel(){const L=LEVEL_INFO[G.level];G={...G,mode:'play',room:L.start,time:L.time,checkpoint:null,level:L.n,lvClock:0};loadRoom(L.start);startIris(1);}

/* ---------- main loop ---------- */
let paused=false,acc=0,last=performance.now();
function step(){
  G.frame++;
  if(hit('mute')){muted=!muted;}
  if(G.mode==='title'){if(hit('left'))G.sel=0;if(hit('right'))G.sel=1;if(hit('start')||hit('jump')){startGame(G.sel);}return;}
  if(G.mode==='end'){if(hit('start')||hit('jump')){G.mode='title';}return;}
  if(G.mode==='clear'){if(hit('start')||hit('jump')){nextLevel();}return;}
  if(hit('pause'))paused=!paused;if(paused)return;
  if(iris.dir!==0){iris.t++;if(iris.t===40){const cb=iris.cb;const d=iris.dir;iris.dir=0;iris.t=0;if(d<0){iris.dir=-2;}if(cb)cb();}
    if(iris.dir===-2)return; if(iris.dir<0)return;}
  if(hit('restart')&&!P.dead){killPlayer();}
  if(R.flipCd>0)R.flipCd--;
  if(R.autoFlip>0&&--R.autoFlip===0)flipSwitch(null,null);
  updatePlayer();if(G.mode!=='play')return;updateEnts();
  if(!P.dead&&!P.win){G.time-=1/60;G.clock+=1/60;G.lvClock+=1/60;if(G.time<=0){G.time=300;killPlayer();}}
  if(R.shake>0)R.shake--;
}
function clearPressed(){for(const k in pressed)pressed[k]=false;}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  if(G.mode==='title'){drawTitle();return;}
  if(G.mode==='end'||G.mode==='clear'){drawEnd();return;}
  const sx=R.shake>0?(Math.random()-0.5)*R.shake*0.6:0,sy=R.shake>0?(Math.random()-0.5)*R.shake*0.6:0;
  if(P&&!P.dead){const t=clampCam(P.x+6-VW/2+P.vx*12);camX+=(t-camX)*0.12;camX=clampCam(camX);}
  const cx=Math.round(camX);
  ctx.setTransform(1,0,0,1,Math.round(sx),Math.round(sy));drawBG();
  ctx.setTransform(1,0,0,1,Math.round(sx)-cx,Math.round(sy));
  drawTiles();drawEnts();drawPlayer();drawParts();
  ctx.setTransform(1,0,0,1,0,0);drawHUD();
  if(paused){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,VW,VH);ctx.fillStyle='#fff';ctx.font=`16px ${FONT}`;ctx.textAlign='center';ctx.fillText('Paused',VW/2,VH/2);}
  if(iris.dir===-2){ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);}else if(iris.dir!==0)drawIris();
}
function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){step();clearPressed();acc-=1000/60;}render();requestAnimationFrame(loop);}
(document.fonts?document.fonts.load(`10px "Pixelify Sans"`):Promise.resolve()).catch(()=>{}).finally(()=>requestAnimationFrame(loop));
