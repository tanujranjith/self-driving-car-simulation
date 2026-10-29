const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const byId=id=>typeof document!=='undefined'?document.getElementById(id):null;

export function updateCamFx(host){
  if(!host)return;
  const frame=host.frame||0;
  if(frame%2!==0)return;
  const cv=byId('camFxCanvas');
  if(!cv)return;
  const stage=host.stage;
  const r=stage?.getBoundingClientRect?.();
  if(!r||!r.width||!r.height)return;
  const d=Math.min(1.5,window.devicePixelRatio||1);
  if(cv.width!==Math.floor(r.width*d)||cv.height!==Math.floor(r.height*d)){cv.width=Math.floor(r.width*d);cv.height=Math.floor(r.height*d);}
  const ctx=cv.getContext('2d');
  if(!ctx)return;
  ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);
  if(host.mode==='fusion'||host.mode==='avstack')return;
  const W=r.width,H=r.height;
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.42,W/2,H/2,Math.max(W,H)*.75);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.38)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(host.env?.weather==='rain'){
    ctx.strokeStyle='rgba(150,200,240,.28)';ctx.lineWidth=1;
    const t=(host.simTime||0)*900;
    for(let i=0;i<36;i++){const x=(i*97+t*(1+i%3))%W;const y=(i*61+t*1.7)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+14);ctx.stroke();}
    if((host.sensorHealth?.lens??1)<.7){ctx.fillStyle='rgba(150,190,230,.12)';for(let i=0;i<8;i++){const x=(i*173)%W,y=(i*97)%H;ctx.beginPath();ctx.arc(x,y,8+((i*7)%14),0,7);ctx.fill();}}
  }
  if(host.env?.timeOfDay==='night'){
    ctx.fillStyle='rgba(255,255,255,.05)';
    for(let i=0;i<45;i++){const x=(i*53+frame*2)%W,y=(i*89)%H;ctx.fillRect(x,y,1,1);}
  }
  if(Math.abs(host.laneVelocity||0)>.6){ctx.fillStyle='rgba(100,210,255,.05)';ctx.fillRect(0,0,W,H);}
  if((host.sensorHealth?.lens??1)<.45){ctx.fillStyle='rgba(120,90,40,.10)';ctx.fillRect(0,0,W,H);}
}

export function updateDayCycle(host,dt){
  if(!host?.dayCycle)return;
  const order=['day','dawn','dusk','night'];
  host._cycleT=(host._cycleT||0)+dt*host.cycleSpeed*.05;
  if(host._cycleT>1){host._cycleT=0;const i=order.indexOf(host.env.timeOfDay);host.env.timeOfDay=order[(i+1)%order.length];const el=byId('timeOfDay');if(el)el.value=host.env.timeOfDay;}
  const base={day:75,dawn:25,dusk:20,night:8}[host.env.timeOfDay]||60;
  host.env.sunAngle=clamp(base+Math.sin(host._cycleT*Math.PI*2)*18,5,90);
  if((host.frame||0)%20===0)host.applyEnvironment();
}

if(typeof window!=='undefined')window.SimRendererEffects={updateCamFx,updateDayCycle};
