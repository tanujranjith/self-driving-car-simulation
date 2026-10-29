const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const randomRange=(min,max)=>min+Math.random()*(max-min);

export function buildWeatherParticles(host,weather){
  const T=globalThis.THREE;
  if(!T||!host?.weatherGroup)return;
  const n=Math.min(1600,Math.round((weather==='rain'?1400:1000)*(host.weatherQuality||1)));
  const range=82;
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    pos[i*3]=randomRange(-range,range);
    pos[i*3+1]=randomRange(0,17);
    pos[i*3+2]=randomRange(-range,range);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  const mat=new T.PointsMaterial({color:weather==='snow'?0xdce8f4:0x7899bb,size:weather==='rain'?.07:.18,transparent:true,opacity:weather==='rain'?.50:.68,sizeAttenuation:true});
  host.weatherParticles=new T.Points(geo,mat);
  host.weatherParticleCount=n;
  host.weatherParticleFall=weather==='rain'?9.5:1.4;
  host.weatherGroup.add(host.weatherParticles);
}

export function updateWeather(host,dt){
  if(!host?.weatherParticles)return;
  const eP=host.road.point(host.progress,host.lane);
  host.weatherGroup.position.set(eP.x,0,eP.z);
  if(host.frame%2!==0)return;
  const pos=host.weatherParticles.geometry.attributes.position;
  const range=82;const fall=host.weatherParticleFall*2;
  const stride=2;const n=host.weatherParticleCount;
  for(let i=host.frame%stride;i<n;i+=stride){
    pos.array[i*3+1]-=fall*dt;
    if(pos.array[i*3+1]<0){
      pos.array[i*3]=randomRange(-range,range);
      pos.array[i*3+1]=randomRange(12,18);
      pos.array[i*3+2]=randomRange(-range,range);
    }
  }
  pos.needsUpdate=true;
}

export function applyEnvironment(host){
  if(!host?.scene||!host.env)return;
  const T=globalThis.THREE;
  const {timeOfDay:tod,weather,visibility:vis,sunAngle,surface}=host.env;
  const bgC={day:0xa4b6c7,dawn:0xd4623a,dusk:0x8c3a22,night:0x050a14};
  const fogC={day:0xa4b6c7,dawn:0xb85230,dusk:0x7c3218,night:0x080e1c};
  let bgCol=bgC[tod],fogCol=fogC[tod],fogNear=90,fogFar=vis;
  if(weather==='fog'){bgCol=0x9aacb8;fogCol=0x9aacb8;fogNear=14;fogFar=Math.min(vis,140);}
  else if(weather==='rain'){bgCol=0x607888;fogCol=0x607888;fogNear=55;fogFar=Math.min(vis,480);}
  else if(weather==='snow'){bgCol=0xb8cad6;fogCol=0xb8cad6;fogNear=35;fogFar=Math.min(vis,300);}
  else if(weather==='overcast'){bgCol=0x7a8e9a;fogCol=0x7a8e9a;fogNear=80;fogFar=Math.min(vis,500);}
  host.scene.background.setHex(bgCol);
  host.scene.fog.color.setHex(fogCol);
  host.scene.fog.near=fogNear;host.scene.fog.far=fogFar;
  const sunI={day:2.15,dawn:.95,dusk:.65,night:.03};
  const hemiI={day:1.18,dawn:.60,dusk:.40,night:.07};
  const wxM={clear:1,overcast:.32,rain:.28,fog:.36,snow:.52};
  if(host.sun){
    host.sun.intensity=sunI[tod]*(wxM[weather]??1);
    const ang=((sunAngle||75)/90)*(Math.PI/2);
    host.sun.position.set(-55*Math.cos(ang),95*Math.sin(ang),-45);
  }
  if(host.hemi)host.hemi.intensity=hemiI[tod];
  const surfCol={dry:0xffffff,wet:0xaabbcc,icy:0xb8d4e2,snowy:0xd8e5ec};
  if(host.roadStripMaterial)host.roadStripMaterial.color.setHex(surfCol[surface]||0xffffff);
  host.surfaceFriction={dry:1.0,wet:.74,icy:.40,snowy:.56}[surface]||1.0;
  const hlI={day:0,dawn:1.2,dusk:1.8,night:3.2}[tod]||0;
  if(host.factory){
    host.factory.mats.headlight.emissiveIntensity=hlI;
    host.factory.mats.taillight.emissiveIntensity=.28+hlI*.55;
    const lampOn=tod==='night'||tod==='dawn'||tod==='dusk';
    host.factory.mats.lampGlow.color.setHex(lampOn?0xfff4bf:0x888866);
  }
  const egoHLI={day:0,dawn:1.4,dusk:2.2,night:3.8}[tod]||0;
  if(host._egoHLights)host._egoHLights.forEach(light=>light.intensity=egoHLI);
  if(host.weatherGroup){
    while(host.weatherGroup.children.length){const child=host.weatherGroup.children[0];if(child.geometry)child.geometry.dispose();host.weatherGroup.remove(child);}
  }
  host.weatherParticles=null;
  if(weather==='rain'||weather==='snow')buildWeatherParticles(host,weather);
  window.SimWorldVisuals?.applyWorldEnvironment?.(host.cityGroup,{weather,surface});
  window.SimWorldVisuals?.applyWorldEnvironment?.(host.roadGroup,{weather,surface});
  host.environmentBuilderSource='module';
  host.log?.add(`Scene: ${tod}, ${weather}${surface!=='dry'?', '+surface+' surface':''}`);
}

if(typeof window!=='undefined')window.SimEnvironment={applyEnvironment,buildWeatherParticles,updateWeather};
