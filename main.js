const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),rnd=Math.random;
const gs=()=>rnd()+rnd()+rnd()+rnd()-2,lerp=(a,b,t)=>a+(b-a)*t;
const mobile=Math.min(innerWidth,innerHeight)<700,N=mobile?9000:16000,DPR=Math.min(devicePixelRatio||1,2);
const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});ren.setPixelRatio(DPR);$('#neb').after(ren.domElement);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.1,600),D=30;
let W,H,Wf,Hf,U,Rp,d0,built=false,started=false,tStart=0,state='hide',sIdx=0,rainOn=false,gateDone=false,mx=0,my=0;
const cvs=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]};
const T=c=>new THREE.CanvasTexture(c);
function blob(g,x,y,r,col,a){const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,col);q.addColorStop(1,col+'00');g.globalAlpha=a;g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r);g.globalAlpha=1}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const dotTex=(()=>{const[c,g]=cvs(64,64);g.fillStyle='#000';g.fillRect(0,0,64,64);const q=g.createRadialGradient(32,32,0,32,32,32);q.addColorStop(0,'#fff');q.addColorStop(.3,'#fff');q.addColorStop(.6,'#555');q.addColorStop(1,'#000');g.fillStyle=q;g.fillRect(0,0,64,64);return T(c)})();

/* Hành tinh */
const pg=new THREE.Group();scene.add(pg);
const [pc,pgx]=cvs(512,256);
{const q=pgx.createLinearGradient(0,0,512,256);q.addColorStop(0,'#ff9fc6');q.addColorStop(.5,'#ffd3e6');q.addColorStop(1,'#ff8cb9');pgx.fillStyle=q;pgx.fillRect(0,0,512,256);
[['#fff27a',90,60,95],['#8affc8',420,150,85],['#ff4f9a',250,80,90],['#9ad0ff',60,200,70],['#ffffff',300,190,85],['#ffe66b',470,40,65],['#d36bff',170,160,60]].forEach(([c,x,y,r])=>blob(pgx,x,y,r,c,.7))}
const ptex=T(pc);ptex.wrapS=THREE.RepeatWrapping;
const pm0=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshBasicMaterial({map:ptex}));pg.add(pm0);
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xff7ab8,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.setScalar(5);pg.add(glow);
const moon=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));pg.add(moon);
let rings=[];

/* Nền: tinh vân, sao, vệt sáng */
const neb=[];
function stars(n,size,map,col,op=1){const p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=(rnd()-.5)*150;p[i*3+1]=(rnd()-.5)*130;p[i*3+2]=-70+rnd()*95}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const s=new THREE.Points(g,new THREE.PointsMaterial({size,color:col,sizeAttenuation:false,map,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(s);return s}
const st=[stars(2600,1.5,dotTex,0xffffff),stars(900,1.1,dotTex,0x9fb4ff),stars(45,4.5,null,0xffffff),stars(80,11,dotTex,0xaab8ff,.1),stars(40,7,dotTex,0xffffff,.2),stars(140,2.6,dotTex,0xff80b4,.5)];
const streaks=new THREE.Group();scene.add(streaks);
const heads=[];for(let i=0;i<4;i++){const g=new THREE.BufferGeometry().setFromPoints(Array.from({length:49},(_,q)=>{const x=-130+q*260/48;return new THREE.Vector3(x,x*x*(.0009+i*.0003)*(i%2?1:-1),0)}));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xaaaaaa,transparent:true,opacity:.45}));l.position.set((rnd()-.5)*20,(rnd()-.5)*30,-6-i*3);l.rotation.z=(rnd()-.5)*.9;streaks.add(l);const h=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));h.scale.setScalar(.9);h.position.x=(rnd()-.5)*200;h.userData.v=(3+rnd()*5)*(rnd()<.5?1:-1);h.userData.c=(.0009+i*.0003)*(i%2?1:-1);l.add(h);heads.push(h)}

/* Hạt: trái tim / chữ / mây */
const pos=new Float32Array(N*3),colA=new Float32Array(N*3);
for(let i=0;i<N*3;i++)pos[i]=gs()*20;
const pgm=new THREE.BufferGeometry();pgm.setAttribute('position',new THREE.BufferAttribute(pos,3));pgm.setAttribute('aC',new THREE.BufferAttribute(colA,3));pgm.setAttribute('aS',new THREE.BufferAttribute(Float32Array.from({length:N},()=>.55+rnd()*1.15),1));pgm.setAttribute('aP',new THREE.BufferAttribute(Float32Array.from({length:N},rnd),1));
const pmat=new THREE.ShaderMaterial({uniforms:{uSize:{value:.16},uH:{value:500},uT:{value:0},uO:{value:0},uB:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'attribute vec3 aC;attribute float aS,aP;uniform float uSize,uH,uT;varying vec3 vC;varying float vT;void main(){vC=aC;vT=.72+.28*sin(uT*3.+aP*6.283);vec4 m=modelViewMatrix*vec4(position,1.);gl_PointSize=max(1.5,uSize*aS*uH/-m.z);gl_Position=projectionMatrix*m;}',fragmentShader:'varying vec3 vC;varying float vT;uniform float uO,uB;void main(){float d=length(gl_PointCoord-.5);float a=1.-smoothstep(.12,.5,d);gl_FragColor=vec4(vC*vT*uB,a*uO);}'});
const mkS=c=>{const q=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(q);return q},hg=mkS(0xff5fa8),b1=mkS(0xffffff),b2=mkS(0xffffff);
const pts=new THREE.Points(pgm,pmat);pts.frustumCulled=false;scene.add(pts);
let TH,TN,TF,CB,CH_,CN,CF,CC,DN,DF,hs=1;
const PAL=[[1,.62,.82],[1,1,1],[.8,.7,1]];
function fromCv(cv){const g=cv.getContext('2d'),w=cv.width,h=cv.height,d=g.getImageData(0,0,w,h).data,ix=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]>120)ix.push(i,x,y)}
 const p=new Float32Array(N*3),c=new Float32Array(N*3),dl=new Float32Array(N),m=ix.length/3;
 for(let k=0;k<N;k++){const j=Math.floor(rnd()*m)*3,i=ix[j],b=.5+rnd()*.35;p[k*3]=((ix[j+1]+rnd())/w-.5)*Wf;p[k*3+1]=-((ix[j+2]+rnd())/h-.5)*Hf;p[k*3+2]=gs()*.25;dl[k]=(p[k*3]/Wf+.5)*.8+rnd()*.2;c[k*3]=d[i]/255*b;c[k*3+1]=d[i+1]/255*b;c[k*3+2]=d[i+2]/255*b}
 return[p,c,dl]}
function lines(a){const CW=900,CH=Math.round(CW*Hf/Wf),[cv,g]=cvs(CW,CH);g.textAlign='center';g.textBaseline='middle';
 a.forEach(([t,cy,wf,rot,col])=>{g.save();g.font='400 100px Pacifico,cursive';const fs=100*wf*CW/g.measureText(t).width;g.font='400 '+fs+'px Pacifico,cursive';g.translate(CW/2,cy*CH);g.rotate(rot);g.fillStyle=g.strokeStyle=col;g.lineJoin='round';g.lineWidth=fs*.045;g.fillText(t,0,0);g.strokeText(t,0,0);g.restore()});return cv}
const sp2=n=>{const w=n.split(' ');if(w.length<3)return[n];const m=Math.ceil(w.length/2);return[w.slice(0,m).join(' '),w.slice(m).join(' ')]};
function build(){
 const land=W/H>1,P='#ffa6dc',L='#e9deff',Wh='#ffffff';
 const a1=sp2(CONFIG.name1),a2=sp2(CONFIG.name2);
 [TN,CN,DN]=fromCv(lines(land||a1.length<2?[[CONFIG.name1,.5,.6,0,L]]:[[a1[0],.45,.84,0,L],[a1[1],.55,.5,0,L]]));
  [TF,CF,DF]=fromCv(lines(land||a2.length<2?[[CONFIG.love,.27,.5,0,P],[CONFIG.name2,.72,.84,-.05,Wh]]:[[CONFIG.love,.3,.84,0,P],[a2[0],.64,.86,-.04,Wh],[a2[1],.74,.62,-.04,Wh]]));
 TH=new Float32Array(N*3);CH_=new Float32Array(N*3);CB=new Float32Array(N*3);CC=new Float32Array(N*3);
 const s=hs=(land?.26*Wf:.62*Wf)/34,CP=[[1,.62,.82],[.8,.7,1],[.55,.95,1],[.6,1,.7],[1,1,1],[1,.85,.5]];
 for(let k=0;k<N;k++){let x,y,u=rnd();
  if(u<.06){x=gs()*.35;y=-rnd()*17}else{const t=rnd()*6.2832;x=16*Math.pow(Math.sin(t),3);y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);const f=u<.82?1-Math.abs(gs())*.12:Math.sqrt(rnd())*.95;x=x*f+gs()*.5;y=y*f+gs()*.5}
  TH[k*3]=x*s;TH[k*3+1]=y*s;TH[k*3+2]=gs()*.4*s;
  const a=(x>3&&rnd()<.4)?[.55,.82,1]:PAL[Math.floor(rnd()*3)],b=.55+rnd()*.3,c=CP[Math.floor(rnd()*6)];
  CH_.set([a[0]*b,a[1]*b,a[2]*b],k*3);CC.set([c[0]*.6,c[1]*.6,c[2]*.6],k*3);
  CB[k*3]=gs()*U*.17;CB[k*3+1]=gs()*U*.1;CB[k*3+2]=gs()*3}
 built=true}

/* Vòng chữ quanh hành tinh */
function mkRings(){const mc=cvs(8,8)[1];mc.font='700 84px Quicksand,Arial';
 rings=[['CHÚC MỪNG 20/10 •',2.15,.5,1.05,.5,.25],['NAMDEX •',2.95,.4,1.35,-.6,-.18],['ĐỪNG BAO GIỜ LÀM EM BUỒN •',1.6,.2,.35,1,.35]].map(([t,r,h,rx,rz,sp])=>{
  const w=Math.ceil(mc.measureText(t).width)+70,[c,g]=cvs(w,128);g.fillStyle='#fff';g.font='700 84px Quicksand,Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,66);
  const tx=T(c);tx.wrapS=THREE.RepeatWrapping;tx.anisotropy=4;tx.repeat.x=Math.max(1,Math.round(2*Math.PI*r/(h*w/128)));
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,96,1,true),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  const hd=new THREE.Object3D();hd.rotation.set(rx,0,rz);hd.add(m);pg.add(hd);return{m,sp}})}

/* Bố cục tự co giãn theo màn hình */
const rc=$('#rain'),x2=rc.getContext('2d');
function layout(){W=innerWidth;H=innerHeight;ren.setSize(W,H);cam.aspect=W/H;cam.updateProjectionMatrix();
 Hf=2*Math.tan(Math.PI/7.2)*D;Wf=Hf*W/H;U=Math.min(Wf,Hf*1.7);Rp=.04*U;pg.scale.setScalar(Rp);d0=(2*Rp/.36)/(.9326*Math.min(1,W/H));
 neb.forEach(n=>{const f=1.67,v=n.userData;n.position.set(v.x*Wf*f,v.y*Hf*f,-20);n.scale.setScalar(v.s*U*f*.9)});
 rc.width=W*DPR;rc.height=H*DPR;x2.setTransform(DPR,0,0,DPR,0,0);pmat.uniforms.uSize.value=.16*Math.min(1,.45+W/H*.9);pmat.uniforms.uH.value=H*DPR/2;
 if(built)build();if(memes){scene.remove(memes);memes=null;spawnMemes();mp=1}}
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(layout,150)});addEventListener('orientationchange',()=>setTimeout(layout,300));
addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5)});

/* Meme panda */
let memes=null,mp=0,mats=null,belt=[],big=[];
function memeMats(){const cap=['TUI TIN BẠN','CẢM ĐỘNG|MUỐN KHÓC','Em không sao thật mà|Anh cứ đi chơi đi','Một gương mặt ngập tràn|niềm tin và lẽ sống','Tin tức đáng tin cậy'];
 return cap.map((t,k)=>{const[c,g]=cvs(240,300);g.fillStyle='#f6f6f6';rr(g,0,0,240,300,16);g.fill();
  g.fillStyle='#111';[[52,58],[188,58]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,34,0,7);g.fill()});
  if(k==2){g.fillStyle='#e0203a';g.beginPath();g.arc(184,36,10,0,7);g.arc(206,50,10,0,7);g.fill()}
  g.fillStyle='#111';g.beginPath();g.moveTo(14,300);g.quadraticCurveTo(20,196,120,200);g.quadraticCurveTo(220,196,226,300);g.fill();
  g.fillStyle='#ececec';g.strokeStyle='#222';g.lineWidth=4;g.beginPath();g.ellipse(120,122,88,78,0,0,7);g.fill();g.stroke();
  const F=[[0,1],[-6,-1],[-8,-1],[5,0],[0,-1]][k];g.strokeStyle='#222';g.fillStyle='#222';g.lineWidth=5;g.lineCap='round';
  g.beginPath();g.moveTo(72,104+F[0]);g.lineTo(106,104-F[0]);g.moveTo(134,104-F[0]);g.lineTo(168,104+F[0]);g.stroke();
  g.beginPath();g.arc(90,124,6,0,7);g.moveTo(156,124);g.arc(150,124,6,0,7);g.fill();
  g.beginPath();if(F[1]>0)g.arc(120,140,24,.15*Math.PI,.85*Math.PI);else if(F[1]<0)g.arc(120,176,24,1.15*Math.PI,1.85*Math.PI);else{g.moveTo(98,158);g.lineTo(142,158)}g.stroke();
  if(k==1||k==2){g.fillStyle='#8cc8ff';g.beginPath();g.ellipse(82,146,5,10,0,0,7);g.fill()}
  g.fillStyle='#fff';g.font='700 21px Quicksand,Arial';g.textAlign='center';const ls=t.split('|');ls.forEach((s,i)=>g.fillText(s,120,246+i*24+(ls.length<2?10:0),215));
  return new THREE.MeshBasicMaterial({map:T(c),alphaTest:.5,side:THREE.DoubleSide})})}
function spawnMemes(){if(memes)return;mats=mats||memeMats();memes=new THREE.Group();scene.add(memes);belt=[];big=[];const geo=new THREE.PlaneGeometry(1,1.25);
 const mk=(w,o)=>{const m=new THREE.Mesh(geo,mats[Math.floor(rnd()*5)]);m.rotation.set(rnd()*3,rnd()*3,rnd()*3);m.userData={w,sp:[gs()*.8,gs()*.8,gs()*.8],...o};memes.add(m);return m};
 const nb=mobile?170:260;for(let i=0;i<nb;i++)belt.push(mk(U*(.022+rnd()*.03),{a:rnd()*6.28,r:U*(.07+Math.abs(gs())*.3),y:gs()*U*.03,v:(.08+rnd()*.12)*(rnd()<.5?1:-1)}));
 for(let i=0;i<9;i++)big.push(mk(U*(.1+rnd()*.07),{x:(rnd()-.5)*Wf*.9,yy:(rnd()-.5)*Hf*.8,z:6+rnd()*10,vx:gs()*.5,vy:gs()*.3}));
 mp=0}

/* Nền 2D: mưa tim, sao băng điều ước, tia lửa */
const hearts=[],sparks=[];let comets=[];
function hp(g,x,y,s){g.beginPath();g.moveTo(x,y+s);g.bezierCurveTo(x-s*1.6,y-s*.2,x-s*.7,y-s*1.2,x,y-s*.4);g.bezierCurveTo(x+s*.7,y-s*1.2,x+s*1.6,y-s*.2,x,y+s);g.fill()}
function plPos(){const v=new THREE.Vector3(0,0,0).project(cam);return[(v.x*.5+.5)*W,(-v.y*.5+.5)*H]}
function shoot(txt){const b=$('#wish').getBoundingClientRect(),[tx,ty]=plPos();comets.push({t:0,d:1.9,a:[b.left+b.width/2,b.top],c:[W*(rnd()<.5?.18:.82),H*.5],e:[tx,ty],tr:[],txt})}
function arrive(txt){const[px,py]=plPos();for(let i=0;i<55;i++){const a=rnd()*6.28,s=40+rnd()*110;sparks.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1})}
 const w=$('#wt'),pr=Rp/(Math.tan(Math.PI/7.2)*D)*H/2;w.textContent=txt;w.style.left=px+'px';w.style.top=(py-pr*1.7)+'px';w.style.opacity=1;clearTimeout(w._t);w._t=setTimeout(()=>w.style.opacity=0,26000);spawnMemes()}
function draw2d(dt,now){x2.clearRect(0,0,W,H);
 if(rainOn&&hearts.length<(mobile?45:70)&&rnd()<.3)hearts.push({x:rnd()*W,y:-10,s:3+rnd()*4,v:25+rnd()*45,ph:rnd()*6,a:.5+rnd()*.5,c:rnd()<.6?'#ff6fa5':'#ffb0cf'});
 for(let i=hearts.length-1;i>=0;i--){const h=hearts[i];h.y+=h.v*dt;h.x+=Math.sin(now*.001+h.ph)*.25;if(h.y>H+10){hearts.splice(i,1);continue}x2.globalAlpha=h.a;x2.fillStyle=h.c;hp(x2,h.x,h.y,h.s)}
 x2.globalAlpha=1;
 comets.forEach(c=>{c.t+=dt/c.d;const t=Math.min(c.t,1),u=1-t,x=u*u*c.a[0]+2*u*t*c.c[0]+t*t*c.e[0],y=u*u*c.a[1]+2*u*t*c.c[1]+t*t*c.e[1];c.tr.push([x,y]);if(c.tr.length>28)c.tr.shift();
  for(let i=1;i<c.tr.length;i++){const q=i/c.tr.length;x2.strokeStyle='rgba(255,236,246,'+q*.9+')';x2.lineWidth=q*3;x2.beginPath();x2.moveTo(c.tr[i-1][0],c.tr[i-1][1]);x2.lineTo(c.tr[i][0],c.tr[i][1]);x2.stroke()}
  blob(x2,x,y,15,'#ffffff',.95);for(let k=0;k<2;k++)sparks.push({x,y,vx:gs()*34,vy:gs()*34,l:1});
  if(c.t>=1&&!c.done){c.done=1;arrive(c.txt)}});comets=comets.filter(c=>c.t<1.05);
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt*1.1;if(s.l<=0){sparks.splice(i,1);continue}x2.globalAlpha=s.l;x2.fillStyle='#fff';x2.beginPath();x2.arc(s.x,s.y,1.6,0,7);x2.fill()}
 x2.globalAlpha=1}

/* Vòng lặp chính */
const SEQ=[[7.2,'heart'],[15,'cloud'],[17.5,'name'],[28,'heart'],[32,'cloud'],[34.5,'final']];
function onFinal(){rainOn=true;for(let i=0;i<35;i++)hearts.push({x:rnd()*W,y:rnd()*H,s:3+rnd()*4,v:25+rnd()*45,ph:rnd()*6,a:.5+rnd()*.5,c:rnd()<.6?'#ff6fa5':'#ffb0cf'});$('#mail').classList.add('on');setTimeout(()=>$('#wish').classList.add('on'),900)}
let last=performance.now(),sAt=0,hf=0;const nb=$('#neb');
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
 const t=started?(now-tStart)/1000:0;let k=0;if(started){k=Math.min(t/7.5,1);k=1-Math.pow(1-k,3)}
 while(started&&sIdx<SEQ.length&&t>=SEQ[sIdx][0]){state=SEQ[sIdx][1];sIdx++;if(state==='final')onFinal();sAt=now}
 const ph=(now/1000%1.15)/1.15,pu=Math.exp(-Math.pow((ph-.06)/.055,2))*.075+Math.exp(-Math.pow((ph-.26)/.06,2))*.05,ss=(now-sAt)/1000,ang=state==='heart'?.4*Math.sin(now*.0007):0,cr=Math.cos(ang),sr=Math.sin(ang);
 hf+=((state==='heart'?1:0)-hf)*Math.min(1,dt*2.5);
 hg.material.opacity=hf*(.2+pu*2);hg.scale.setScalar(hs*38*(1+pu*1.5));hg.position.set(0,-hs*2,-1);b1.material.opacity=hf*(.4+pu*5);b1.scale.set(hs*3,hs*9,1);b1.position.set(0,hs*5.5,.5);b2.material.opacity=hf*(.4+pu*5);b2.scale.set(hs*3,hs*8,1);b2.position.set(0,-hs*14,.5);pg.scale.setScalar(Rp*(1+pu*hf*.8));pmat.uniforms.uB.value=1+pu*hf*5;heads.forEach(h=>{h.position.x+=h.userData.v*dt;if(Math.abs(h.position.x)>130)h.position.x*=-.98;h.position.y=h.position.x*h.position.x*h.userData.c});
 const dist=lerp(d0,D,k),az=(1-k)*.9+(started?0:Math.sin(now*.0004)*.12),el=(1-k)*.55+(started?0:Math.sin(now*.0003)*.05);
 cam.position.set(Math.sin(az)*Math.cos(el)*dist+mx*.6,Math.sin(el)*dist-my*.6,Math.cos(az)*Math.cos(el)*dist);cam.lookAt(0,0,0);
 pm0.rotation.y+=dt*.45;rings.forEach(r=>r.m.rotation.y+=r.sp*dt);glow.material.opacity=.35+.2*k;
 moon.position.set(Math.cos(now*.0007)*4.2,Math.sin(now*.0007)*1.2,Math.sin(now*.0007)*3.4);
 nb.style.opacity=.15+.85*k;nb.style.transform='scale('+(1.9-.9*k)+') translate('+(-mx*16)+'px,'+(-my*16)+'px)';st[1].material.opacity=.55+.4*Math.sin(now*.0013);st[0].material.opacity=.82+.18*Math.sin(now*.0009+1);st[0].rotation.z+=dt*.002;st[2].rotation.z+=dt*.003;streaks.rotation.z+=dt*.012;
 if(built&&state!=='hide'){pmat.uniforms.uO.value=Math.min(1,Math.max(0,(t-6)/1.8));pmat.uniforms.uT.value=now*.001;
  let tg,tc,dl,sp=2.6,jit=.0011*Wf;
  if(state==='heart'){tg=TH;tc=CH_;jit=.002*Wf}else if(state==='name'){tg=TN;tc=CN;dl=DN}else if(state==='final'){tg=TF;tc=CF;dl=DF}else{tc=CC;sp=1.1;jit=.004*Wf}
  const f=1-Math.exp(-sp*dt),bt=state==='heart'?1+pu:1,ca=Math.cos(now*.0004),sa=Math.sin(now*.0004);
  for(let i=0,j=0;i<N;i++,j+=3){let tx,ty,tz;
   if(tg&&!(dl&&ss<dl[i]*2.2)){const ux=tg[j]*bt,uz=tg[j+2];tx=ux*cr+uz*sr;ty=tg[j+1]*bt;tz=-ux*sr+uz*cr}else{tx=CB[j]*ca-CB[j+1]*sa;ty=CB[j]*sa+CB[j+1]*ca;tz=CB[j+2]}
   pos[j]+=(tx-pos[j])*f+(rnd()-.5)*jit;pos[j+1]+=(ty-pos[j+1])*f+(rnd()-.5)*jit;pos[j+2]+=(tz-pos[j+2])*f;
   colA[j]+=(tc[j]-colA[j])*.05;colA[j+1]+=(tc[j+1]-colA[j+1])*.05;colA[j+2]+=(tc[j+2]-colA[j+2])*.05}
  pgm.attributes.position.needsUpdate=true;pgm.attributes.aC.needsUpdate=true}
 if(memes){mp=Math.min(1,mp+dt/3.5);const e=1-Math.pow(1-mp,3);memes.rotation.z=Math.sin(now*.0002)*.08;
  belt.forEach(m=>{const d=m.userData;d.a+=d.v*dt;m.position.set(Math.cos(d.a)*d.r*e,d.y+Math.sin(d.a)*d.r*.12*e,Math.sin(d.a)*d.r*.35*e);m.scale.set(d.w*e,d.w*e,1);m.rotation.x+=d.sp[0]*dt;m.rotation.y+=d.sp[1]*dt});
  big.forEach(m=>{const d=m.userData;d.x+=d.vx*dt;d.yy+=d.vy*dt;if(d.x>Wf*.6)d.x=-Wf*.6;if(d.x<-Wf*.6)d.x=Wf*.6;if(Math.abs(d.yy)>Hf*.55)d.vy*=-1;m.position.set(d.x*e,d.yy*e,d.z);m.scale.set(d.w*e,d.w*e,1);m.rotation.x+=d.sp[0]*dt*.5;m.rotation.y+=d.sp[1]*dt*.5})}
 ren.render(scene,cam);draw2d(dt,now)}

/* Điều khiển giao diện */
const au=new Audio();au.loop=true;au.preload='auto';au.volume=.85;au.src=CONFIG.music;
const mus=$('#mus'),playM=()=>au.play().then(()=>mus.classList.remove('off')).catch(()=>mus.classList.add('off'));
mus.onclick=()=>au.paused?playM():(au.pause(),mus.classList.add('off'));
function closeGate(ok){$('#gate').classList.remove('show');gateDone=true;mus.classList.add('on');if(ok)playM();else mus.classList.add('off');setTimeout(()=>$('#hint').classList.add('on'),400)}
$('#yes').onclick=()=>closeGate(true);$('#no').onclick=()=>closeGate(false);
addEventListener('pointerdown',e=>{if(!gateDone||started||e.target.closest('.ui,.ov'))return;started=true;tStart=performance.now();state='hide';$('#hint').classList.remove('on')});
$('#wish').onclick=()=>{$('#dlg').classList.add('show');setTimeout(()=>$('#wi').focus(),350)};
$('#dc').onclick=()=>$('#dlg').classList.remove('show');
$('#dg').onclick=()=>{const v=$('#wi').value.trim()||'Anh yêu em';$('#wi').value='';$('#dlg').classList.remove('show');$('#wi').blur();setTimeout(()=>shoot(v),350)};
/* Thư */
const LT=CONFIG.letter.map(t=>[t]).concat([[CONFIG.sign,'sg']]);
let lid=0;
async function typeTo(el,txt,my){const a=document.createElement('span'),b=document.createElement('span');b.style.cssText='opacity:.35;filter:blur(1.2px)';el.append(a,b);
 for(let i=0;i<=txt.length;i++){if(my!==lid)return;a.textContent=txt.slice(0,Math.max(0,i-3));b.textContent=txt.slice(Math.max(0,i-3),i);await sleep(32)}b.remove();a.textContent=txt}
async function openLetter(){const my=++lid,env=$('#env'),card=$('#card'),lb=$('#lb'),cl=$('#cl');lb.innerHTML='';cl.style.opacity=0;card.classList.remove('on');env.className='env';
 $('#lt').classList.add('show');await sleep(250);if(my!==lid)return;env.classList.add('on');await sleep(900);if(my!==lid)return;env.classList.add('op');await sleep(900);if(my!==lid)return;
 env.classList.add('gone');card.classList.add('on');await sleep(1000);
 for(const[t,c]of LT){if(my!==lid)return;const p=document.createElement('p');if(c)p.className=c;lb.append(p);await typeTo(p,t,my);await sleep(220)}
 if(my===lid)cl.style.opacity=1}
function closeLetter(){lid++;$('#lt').classList.remove('show')}
$('#mail').onclick=openLetter;$('#x').onclick=closeLetter;$('#cl').onclick=closeLetter;

/* Khởi động (đợi font để chữ hạt đúng kiểu) */
(async()=>{$('#card h2').textContent=CONFIG.title;$('#hint').textContent=CONFIG.hint;document.title=CONFIG.title;layout();
 await Promise.race([Promise.all(['400 80px Pacifico','700 80px Quicksand','400 16px Charm','700 16px Charm'].map(f=>document.fonts.load(f,'Nguyễn Đặng ễ'))),sleep(3000)]).catch(()=>{});
 mkRings();build();requestAnimationFrame(frame)})();
