const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function updateRadar(host){
  const T=globalThis.THREE;
  if(!T||!host?.radarGroup||!host?.road){return;}
  host.sensorBuilderSource='module';
  if(host.frame%2!==0&&host._radarCache)return;
  while(host.radarGroup.children.length){const mesh=host.radarGroup.children[0];if(mesh.geometry)mesh.geometry.dispose();if(mesh.material?.dispose)mesh.material.dispose();host.radarGroup.remove(mesh);}
  host.radarTracks=[];host.radarGhosts=[];
  if(!host.sensorConfig?.radar||host.sensorDropout?.())return;
  const origin=host.road.point(host.progress,host.lane);
  const yaw=host.road.yaw(host.progress);const sweep=Math.PI*.68;const steps=28;
  for(const [distance,opacity] of [[20,.38],[40,.26],[60,.15]]){
    const points=[];
    for(let i=0;i<=steps;i++){const angle=yaw-sweep/2+(sweep/steps)*i;points.push(new T.Vector3(origin.x+Math.sin(angle)*distance,.35,origin.z+Math.cos(angle)*distance));}
    const geometry=new T.BufferGeometry().setFromPoints(points);
    host.radarGroup.add(new T.Line(geometry,new T.LineBasicMaterial({color:0xffd166,transparent:true,opacity})));
  }
  const egoSpeed=host.speed||0;
  const perception=host.perceptionPolicyState||host.perceptionPolicy?.();
  const trackRange=Math.min(62,perception?.trackingRange||62);
  for(const actor of host.actors||[]){
    const distance=actor.z-host.progress;if(distance<1||distance>trackRange)continue;
    const jitter=host.worldJitter?.(distance);if(jitter?.drop)continue;
    const point=host.road.point(actor.z+(jitter?.z||0),actor.lateral+(jitter?.x||0));
    const angle=Math.atan2(point.x-origin.x,point.z-origin.z);
    const relativeAngle=((angle-yaw)+Math.PI*3)%(Math.PI*2)-Math.PI;
    if(Math.abs(relativeAngle)>sweep/2)continue;
    const actorSpeed=actor.moving?(actor.oncoming?-actor.speed:actor.speed):0;
    const relativeSpeed=actorSpeed-egoSpeed;const closing=-relativeSpeed;
    const color=closing>6?0xff453a:closing>2?0xffd166:0x30d158;
    host.radarTracks.push({actor,dz:distance,relV:relativeSpeed,closing});
    const blip=new T.Mesh(new T.SphereGeometry(closing>6?.42:.28,6,6),new T.MeshBasicMaterial({color,transparent:true,opacity:.85}));
    blip.position.set(point.x,.5,point.z);host.radarGroup.add(blip);
  }
  const ghostRate={clear:0,overcast:.1,rain:.5,fog:.7,snow:.45}[host.env?.weather]||0;
  const ghostCount=Math.round(ghostRate*((host.sensorConfig?.noise||0)/40+1)*2);
  const random=host.rand||((min,max)=>min+Math.random()*(max-min));
  for(let i=0;i<ghostCount;i++){
    const distance=random(8,trackRange),lateral=random(-host.road.travelHalf,host.road.travelHalf),point=host.road.point(host.progress+distance,lateral);
    host.radarGhosts.push({dz:distance,lat:lateral});
    const ghost=new T.Mesh(new T.SphereGeometry(.2,5,5),new T.MeshBasicMaterial({color:0x8e8eff,transparent:true,opacity:.4}));
    ghost.position.set(point.x,.5,point.z);host.radarGroup.add(ghost);
  }
  host._radarCache=true;
}

export function updateLidar(host){
  const T=globalThis.THREE;
  if(!T||!host?.lidarGroup||!host?.road)return;
  host.sensorBuilderSource='module';
  const showFan=!!host.layers?.lidar&&!!host.sensorConfig?.lidar&&!['sensor','fusion','avstack'].includes(host.mode);
  if(!host.sensorConfig?.lidar){if(host._lidarSeg)host._lidarSeg.visible=false;host.lidarHits=[];if(host.fusionStats)host.fusionStats.points=0;return;}
  if(host.sensorDropout?.()||host.sensorHealth?.lidar<.25){if(host._lidarSeg)host._lidarSeg.visible=false;host.lidarHits=[];if(host.fusionStats)host.fusionStats.points=0;return;}
  const origin=host.road.point(host.progress,host.lane);origin.y=.9;
  const rayCount=32,maxRange=Math.min(host.sensorConfig.range||125,120)*(host.sensorHealth?.lidar??1),yaw=host.road.yaw(host.progress);
  if(!host._lidarSeg){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(rayCount*2*3),3));
    host._lidarSeg=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0x4ee7ff,transparent:true,opacity:.3}));
    host._lidarSeg.frustumCulled=false;host.lidarGroup.add(host._lidarSeg);
    host._lidarHitMat=new T.LineBasicMaterial({color:0x42f58c,transparent:true,opacity:.55});
  }
  if(host.frame%3!==0){host._lidarSeg.visible=showFan;return;}
  const nearby=[];
  for(const actor of host.actors||[]){
    const distance=actor.z-host.progress;if(distance<-4||distance>maxRange+8)continue;
    const point=actor.worldPos||host.road.point(actor.z,actor.lateral);
    nearby.push({dx:point.x-origin.x,dz:point.z-origin.z,r:actor.type==='bus'?1.7:actor.type==='car'||actor.type==='parked'?1.4:.8,label:actor.type});
  }
  const positions=host._lidarSeg.geometry.attributes.position;host.lidarHits=[];
  const jitter=(host.sensorConfig.noise||0)/100*1.5;const random=host.rand||((min,max)=>min+Math.random()*(max-min));
  for(let i=0;i<rayCount;i++){
    const angle=-Math.PI*.5+(i/(rayCount-1))*Math.PI+yaw,dx=Math.sin(angle),dz=Math.cos(angle);let length=maxRange,hit=null;
    for(const candidate of nearby){
      const projection=candidate.dx*dx+candidate.dz*dz;if(projection<0||projection>length)continue;
      const px=candidate.dx-dx*projection,pz=candidate.dz-dz*projection,radius2=candidate.r*candidate.r;
      if(px*px+pz*pz<radius2){const hitDistance=projection-Math.sqrt(Math.max(0,radius2-px*px-pz*pz));if(hitDistance>0&&hitDistance<length){length=hitDistance;hit=candidate.label;}}
    }
    length=clamp(length+random(-jitter,jitter),1,maxRange);
    positions.array[i*6]=origin.x;positions.array[i*6+1]=.9;positions.array[i*6+2]=origin.z;
    positions.array[i*6+3]=origin.x+dx*length;positions.array[i*6+4]=.9;positions.array[i*6+5]=origin.z+dz*length;
    if(length<maxRange-1)host.lidarHits.push({dist:length,pt:new T.Vector3(origin.x+dx*length,.9,origin.z+dz*length),actor:hit});
  }
  positions.needsUpdate=true;host._lidarSeg.visible=showFan;host._lidarSeg.material=host.lidarHits.length>4?host._lidarHitMat:host._lidarSeg.material;
  if(host.fusionStats)host.fusionStats.points=host.lidarHits.length;
}

if(typeof window!=='undefined')window.SimSensors={updateRadar,updateLidar};
