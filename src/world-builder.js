export function buildBaseScene(host){
  const T=globalThis.THREE;
  if(!T||!host?.scene||!host.world||!host.factory)return null;
  host.worldBuilderSource='module';
  host.worldRoadBuilderSource='module';
  host.worldIntersectionBuilderSource='module';
  host.intersectionBuilderSource='module';
  host.buildRoadStrip=(minZ,maxZ)=>buildRoadStrip(host,minZ,maxZ);
  host._drawIntersection=z=>drawIntersection(host,z);
  host._drawRoundabout=z=>drawRoundabout(host,z);
  host.hemi=new T.HemisphereLight(0xcfe8ff,0x253219,1.18);host.scene.add(host.hemi);
  host.sun=new T.DirectionalLight(0xffffff,2.15);host.sun.position.set(-55,95,-45);host.sun.castShadow=true;host.sun.shadow.mapSize.set(1024,1024);host.sun.shadow.camera.left=-110;host.sun.shadow.camera.right=110;host.sun.shadow.camera.top=110;host.sun.shadow.camera.bottom=-110;host.scene.add(host.sun);
  const ground=new T.Mesh(new T.PlaneGeometry(1400,2200),host.factory.mats.grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.035;ground.receiveShadow=true;host.world.add(ground);host.ground=ground;
  host.cityGroup=new T.Group();host.world.add(host.cityGroup);
  host.buildCityBlocks(-700,1800);
  host.intersectionGroup=new T.Group();host.scene.add(host.intersectionGroup);
  host.radarGroup=new T.Group();host.scene.add(host.radarGroup);
  host.debugGroup=new T.Group();host.scene.add(host.debugGroup);
  host.weatherGroup=new T.Group();host.scene.add(host.weatherGroup);
  host.drawnIntersections=[];
  host.buildRoadStrip(-800,3600);
  return host;
}

export function drawIntersection(host,z){
  const THREE=globalThis.THREE;
  if(!THREE||!host?.intersectionGroup||!host.factory||!host.road)return null;
  if(host.drawnIntersections?.some(v=>Math.abs(v-z)<60))return null;
  host.drawnIntersections=host.drawnIntersections||[];
  host.drawnIntersections.push(z);
  const yaw=host.road.yaw(z);
  const add=m=>{m.userData=m.userData||{};m.userData.intersectionZ=z;host.intersectionGroup.add(m);return m;};
  const roadW=host.road.travelHalf*2;
  const crossStreet=host.factory.box(roadW+host.road.sidewalk*2+4,.035,13,host.factory.mats.asphalt);
  const crossPoint=host.road.point(z,0);
  crossStreet.position.set(crossPoint.x,.018,crossPoint.z);crossStreet.rotation.y=yaw;crossStreet.castShadow=false;crossStreet.receiveShadow=true;crossStreet.userData.crossStreet=true;add(crossStreet);
  for(const side of [-1,1]){
    const p=host.road.point(z+side*11.5,0);
    const bar=host.factory.box(roadW,.06,.52,host.factory.mats.white);
    bar.position.set(p.x,.050,p.z);bar.rotation.y=yaw;bar.castShadow=false;add(bar);
  }
  const stripeD=.56,gapD=.52,nStripes=7;
  const cwHalf=(nStripes*(stripeD+gapD)-gapD)/2;
  for(const side of [-1,1]){
    const cwZ=z+side*9.2;
    for(let i=0;i<nStripes;i++){
      const off=-cwHalf+i*(stripeD+gapD)+stripeD/2;
      const p=host.road.point(cwZ+off,0);
      const stripe=host.factory.box(roadW,.06,stripeD,host.factory.mats.white);
      stripe.position.set(p.x,.050,p.z);stripe.rotation.y=yaw;stripe.castShadow=false;add(stripe);
    }
  }
  for(const side of [-1,1]){
    const sign=host.factory.crosswalkSign();
    const p=host.road.point(z+side*9.2,side*(host.road.travelHalf+host.road.sidewalk*.62));
    sign.position.set(p.x,0,p.z);sign.rotation.y=yaw;host.tagWorldModel(sign,'crosswalk-sign');add(sign);
    const signal=host.factory.pedestrianSignal?.();
    if(signal){
      const sp=host.road.point(z+side*8.0,side*(host.road.travelHalf+host.road.sidewalk*.62+.95));
      signal.position.set(sp.x,0,sp.z);signal.rotation.y=yaw+(side<0?Math.PI:0);host.tagWorldModel(signal,'pedestrian-signal');add(signal);
    }
  }
  return host.intersectionGroup;
}

export function drawRoundabout(host,z=1200){
  const T=globalThis.THREE;
  if(!T||!host?.intersectionGroup||!host.factory||!host.road?.isRoundaboutZone?.(z))return null;
  host.drawnRoundabouts=host.drawnRoundabouts||[];
  const existing=host.intersectionGroup.children.find(m=>m.userData?.roundabout&&Math.abs((m.userData.intersectionZ||0)-z)<2);
  if(host.drawnRoundabouts.some(v=>Math.abs(v-z)<2)||existing){
    host.worldModelCounts=host.worldModelCounts||{};
    host.worldModelCounts.roundabout=Math.max(2,host.worldModelCounts.roundabout||0);
    return existing||null;
  }
  const group=new T.Group();
  group.userData={intersectionZ:z,roundabout:true,worldModel:'roundabout'};
  const center=host.road.roundaboutCenter(z);
  const radius=host.road.roundaboutRadius?.()||12.4;
  const centerLat=host.road.travelHalf+6;
  const yaw=host.road.yaw(z);
  const add=m=>{m.userData={...(m.userData||{}),intersectionZ:z,roundabout:true};group.add(m);return m;};
  const apron=new T.Mesh(new T.CylinderGeometry(radius,radius,.08,48),host.factory.mats.asphalt);
  apron.position.set(center.x,.035,center.z);apron.receiveShadow=true;add(apron);
  const island=new T.Mesh(new T.CylinderGeometry(4.45,4.85,.42,32),host.factory.mats.grass);
  island.position.set(center.x,.25,center.z);island.castShadow=true;island.receiveShadow=true;add(island);
  const islandCurb=new T.Mesh(new T.TorusGeometry(4.72,.18,8,40),host.factory.mats.curb);
  islandCurb.rotation.x=Math.PI/2;islandCurb.position.set(center.x,.47,center.z);islandCurb.castShadow=true;add(islandCurb);
  const outerStripe=new T.Mesh(new T.TorusGeometry(radius*.82,.075,6,48),host.factory.mats.laneWhite);
  outerStripe.rotation.x=Math.PI/2;outerStripe.position.set(center.x,.105,center.z);add(outerStripe);
  const innerStripe=new T.Mesh(new T.TorusGeometry(5.55,.075,6,40),host.factory.mats.laneWhite);
  innerStripe.rotation.x=Math.PI/2;innerStripe.position.set(center.x,.108,center.z);add(innerStripe);
  for(const side of [-1,1]){
    const connector=host.factory.box(Math.max(8.5,centerLat-host.road.travelHalf+radius*.48),.045,4.15,host.factory.mats.asphalt);
    const p=host.road.point(z+side*6,host.road.travelHalf+(centerLat-host.road.travelHalf)*.52);
    connector.position.set(p.x,.06,p.z);connector.rotation.y=yaw;connector.receiveShadow=true;add(connector);
    const sign=host.factory.yieldSign?.();
    if(sign){
      const sp=host.road.point(z+side*8.5,host.road.travelHalf+1.05);
      sign.position.set(sp.x,0,sp.z);sign.rotation.y=yaw+(side<0?Math.PI:0);host.tagWorldModel(sign,'roundabout');add(sign);
    }
  }
  const marker=new T.Mesh(new T.CylinderGeometry(.18,.18,.05,16),host.factory.mats.laneYellow);
  marker.position.set(center.x,.12,center.z);add(marker);
  host.intersectionGroup.add(group);host.drawnRoundabouts.push(z);
  return group;
}

function bakeRoadTexture(host,withMarkings){
  const THREE=globalThis.THREE;
  const outer=host.road.width/2;
  const travel=host.road.travelHalf;
  const laneW=host.road.laneW;
  const period=26.0;
  const W=1024,H=1024;
  const c=document.createElement('canvas');
  c.width=W;c.height=H;
  const x=c.getContext('2d');
  const u=lat=>((lat+outer)/(2*outer))*W;
  x.fillStyle='#384250';x.fillRect(0,0,W,H);
  for(let k=0;k<22000;k++){
    const g=46+Math.floor(Math.random()*78);
    x.fillStyle=`rgb(${g},${g+2},${g+6})`;
    x.fillRect(Math.random()*W,Math.random()*H,1.2,1.2);
  }
  for(let k=0;k<18;k++){
    x.fillStyle=`rgba(24,30,38,${0.06+Math.random()*0.08})`;
    x.fillRect(0,Math.random()*H,W,1+Math.random()*1.6);
  }
  const shL=u(-travel),shR=u(travel);
  x.fillStyle='rgba(70,84,100,.42)';
  x.fillRect(0,0,shL,H);x.fillRect(shR,0,W-shR,H);
  for(let k=0;k<6000;k++){
    const xp=Math.random()*W;
    if(xp>shL&&xp<shR)continue;
    const g=82+Math.floor(Math.random()*54);
    x.fillStyle=`rgb(${g},${g+2},${g+4})`;
    x.fillRect(xp,Math.random()*H,1.1,1.1);
  }
  for(const lane of [-laneW*1.5,-laneW/2,laneW/2,laneW*1.5]){
    const bL=u(lane-.85),bR=u(lane+.85);
    x.fillStyle='rgba(20,26,36,.16)';x.fillRect(bL,0,bR-bL,H);
    x.fillStyle='rgba(20,26,36,.08)';x.fillRect(bL+2,0,bR-bL-4,H);
    for(let k=0;k<18;k++){
      const px=u(lane+(-.72+Math.random()*1.44));
      const py=Math.random()*H;
      const len=18+Math.random()*70;
      x.fillStyle=`rgba(12,18,26,${0.025+Math.random()*0.035})`;
      x.fillRect(px,py,.7+Math.random()*1.6,len);
    }
  }
  for(let k=0;k<42;k++){
    const px=u(-travel+Math.random()*travel*2);
    const py=Math.random()*H;
    x.strokeStyle=`rgba(12,17,24,${0.025+Math.random()*0.04})`;
    x.lineWidth=.55+Math.random()*.8;
    x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.random()*18-9,py+16+Math.random()*50);x.stroke();
  }
  if(withMarkings){
    const cx=u(0);
    const yLine=Math.max(2.2,.15/(2*outer)*W);
    x.fillStyle='#f7d363';x.fillRect(cx-yLine*1.8,0,yLine,H);x.fillRect(cx+yLine*.8,0,yLine,H);
    const edgeOff=.30;
    const eW=Math.max(2.5,.20/(2*outer)*W);
    x.fillStyle='#f2f6fa';x.fillRect(u(-travel+edgeOff),0,eW,H);x.fillRect(u(travel-edgeOff)-eW,0,eW,H);
    const dashLen=6.6,cycleLen=13.0;
    const dW=Math.max(2.2,.18/(2*outer)*W);
    x.fillStyle='#f4f7fb';
    for(const lane of [-laneW,laneW]){
      const px=u(lane);
      for(let pz=0;pz<period;pz+=cycleLen){
        const y0=(pz/period)*H;
        const y1=((pz+dashLen)/period)*H;
        x.fillRect(px-dW/2,y0,dW,y1-y0);
      }
    }
    x.fillStyle='rgba(255,255,255,.18)';
    x.fillRect(u(-outer+.18),0,1.6,H);x.fillRect(u(outer-.18)-1.6,0,1.6,H);
  }
  const texture=new THREE.CanvasTexture(c);
  texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;texture.needsUpdate=true;
  return texture;
}

export function buildRoadStrip(host,minZ=host?.progress-800,maxZ=host?.progress+7200){
  const THREE=globalThis.THREE;
  if(!THREE||!host?.road||!host.roadGroup)return null;
  const step=1.5;
  if(!Number.isFinite(minZ))minZ=host.progress-800;
  if(!Number.isFinite(maxZ))maxZ=host.progress+7200;
  minZ=Math.floor(minZ/step)*step;
  maxZ=Math.ceil(maxZ/step)*step;
  host.roadWindowStart=minZ;host.roadWindowEnd=maxZ;
  while(host.roadGroup.children.length){
    const m=host.roadGroup.children.pop();
    if(m.geometry)m.geometry.dispose();
    host.roadGroup.remove(m);
  }
  const outer=host.road.width/2;
  const period=26.0;
  if(!host.roadTexPlain||!host.roadTexMarked){
    host.roadTexPlain=bakeRoadTexture(host,false);
    host.roadTexMarked=bakeRoadTexture(host,true);
  }
  if(!host.roadStripMaterial)host.roadStripMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94,metalness:0,map:host.roadTexMarked,side:THREE.DoubleSide});
  {
    const v=[],u=[],i=[];let m=0;
    for(let z=minZ;z<=maxZ;z+=step){
      const a=host.road.point(z,-outer),b=host.road.point(z,outer);
      v.push(a.x,.02,a.z,b.x,.02,b.z);u.push(0,z/period,1,z/period);
      if(m>0)i.push(m-2,m-1,m,m-1,m+1,m);m+=2;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(i);g.computeVertexNormals();
    host.roadStrip=new THREE.Mesh(g,host.roadStripMaterial);host.roadStrip.receiveShadow=true;host.roadGroup.add(host.roadStrip);
  }
  for(const side of [-1,1]){
    const latL=side<0?-(outer+host.road.sidewalk):outer;
    const latR=side<0?-outer:outer+host.road.sidewalk;
    const v=[],i=[];let m=0;
    for(let z=minZ;z<=maxZ;z+=step){
      const a=host.road.point(z,latL),b=host.road.point(z,latR);
      v.push(a.x,.20,a.z,b.x,.20,b.z);
      if(m>0)i.push(m-2,m-1,m,m-1,m+1,m);m+=2;
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(i);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x6e7884,roughness:.92,side:THREE.DoubleSide}));
    mesh.receiveShadow=true;host.roadGroup.add(mesh);
  }
  for(const side of [-1,1]){
    const v=[],i=[];let m=0;
    for(let z=minZ;z<=maxZ;z+=step){
      const p=host.road.point(z,side*outer);
      v.push(p.x,.02,p.z,p.x,.22,p.z);
      if(m>0)i.push(m-2,m-1,m,m-1,m+1,m);m+=2;
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(i);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x9aa4b0,roughness:.78,side:THREE.DoubleSide}));
    mesh.receiveShadow=true;host.roadGroup.add(mesh);
  }
  globalThis.SimWorldVisuals?.applyWorldEnvironment?.(host.roadGroup,{weather:host.env?.weather,surface:host.env?.surface});
  return host.roadStrip;
}

export function buildCityBlocks(host,minZ=-700,maxZ=7200){
  const THREE=globalThis.THREE;
  if(!THREE||!host?.factory)return null;
    if(!host.cityGroup)return;
    host.cityGroup.traverse(c=>{if(c.geometry)c.geometry.dispose();});
    host.cityGroup.clear();
    const map=host.mapType||'downtown';
    host.worldModelCounts={};
    host.railCrossings=[];
    host.cityWindowStart=minZ;
    host.cityWindowEnd=maxZ;
    const palette=[
      [host.factory.mats.facade,host.factory.mats.windowLit],
      [new THREE.MeshStandardMaterial({color:0x5e6977,roughness:.88}), host.factory.mats.windowLit],
      [new THREE.MeshStandardMaterial({color:0x4c5562,roughness:.9}), host.factory.mats.windowLit],
      [host.factory.mats.brick, new THREE.MeshStandardMaterial({color:0xc7d8e5,roughness:.36,metalness:.05,emissive:0x1c2d40,emissiveIntensity:.14})]
    ];
    const buildingStep=map==='nightcity'?34:map==='downtown'?40:map==='suburb'?58:210;
    const firstTower=Math.floor(minZ/buildingStep)*buildingStep;
    const lastTower=maxZ+220;
    for(let z=firstTower;z<lastTower;z+=buildingStep){
      for(const side of [-1,1]){
        if(map==='highway'||map==='rural')continue;
        let seed=z*.017+side*19.37;
        const r=()=>host.seededRand(seed+=1.61803398875);
        const rr=(a,b)=>a+r()*(b-a);
        const setback = host.road.width/2 + host.road.sidewalk + (map==='rural'?36:map==='highway'?27:map==='suburb'?20:12) + rr(0,18);
        const p=host.road.point(z,side*setback);
        const yaw=host.road.yaw(z) + rr(-.025,.025);
        const [matA,matB]=palette[Math.floor(r()*palette.length)%palette.length];
        const buildingDetail=Math.abs(z-host.progress)<120?'full':'proxy';
        const forcedHub=(map==='downtown'||map==='nightcity')&&Math.abs(z%(map==='downtown'?240:238))<1;
        const towerModel=forcedHub?'mobility-hub':host.pickWorldModel(map,Math.floor(z*.17)+side*13,'building');
        const tower=host.factory.building(rr(map==='suburb'?10:8,map==='suburb'?20:15),map==='nightcity'?rr(28,58):map==='downtown'?rr(18,42):map==='suburb'?rr(5,12):rr(4,10),rr(map==='suburb'?10:8,map==='suburb'?18:14),matA,matB,buildingDetail,towerModel);
        host.tagWorldModel(tower,towerModel);tower.position.set(p.x,0,p.z);
        tower.rotation.y=yaw;
        host.cityGroup.add(tower);
        if((map==='downtown'||map==='nightcity')&&r()<.88){
          const rearSetback=setback+rr(16,28);const rearP=host.road.point(z+rr(-15,15),side*rearSetback);const rearModel=host.pickWorldModel(map,Math.floor(z*.23)+side*31+7,'building');const rear=host.factory.building(rr(9,17),map==='nightcity'?rr(34,66):rr(22,48),rr(9,16),palette[Math.floor(r()*palette.length)%palette.length][0],host.factory.mats.windowLit,Math.abs(z-host.progress)<120?'full':'proxy',rearModel);host.tagWorldModel(rear,rearModel);rear.position.set(rearP.x,0,rearP.z);rear.rotation.y=host.road.yaw(z)+rr(-.03,.03);host.cityGroup.add(rear);
        }else if(map==='suburb'&&r()<.82){
          const houseP=host.road.point(z+buildingStep*.48+rr(-7,7),side*(host.road.width/2+host.road.sidewalk+12+rr(0,8)));const houseModel='building-suburban';const house=host.factory.building(rr(10,16),rr(5.5,9),rr(10,16),r()<.5?host.factory.mats.brick:host.factory.mats.facade,host.factory.mats.windowLit,Math.abs(z-host.progress)<120?'full':'proxy',houseModel);host.tagWorldModel(house,houseModel);house.position.set(houseP.x,0,houseP.z);house.rotation.y=host.road.yaw(z);host.cityGroup.add(house);const drive=host.factory.box(4,.04,9,new THREE.MeshStandardMaterial({color:0x777f86,roughness:.95}));drive.position.set(houseP.x,.025,houseP.z-side*8);drive.rotation.y=host.road.yaw(z);host.cityGroup.add(drive);
        }

        if(map!=='highway'&&map!=='rural'&&r()<(map==='suburb'?.56:.92)){
          const front=host.road.point(z+rr(-10,10),side*(host.road.width/2+host.road.sidewalk+4.8));
          const shopW=rr(9,15), shopD=rr(6,9);
          const shop=host.factory.box(shopW,4.7,shopD,new THREE.MeshStandardMaterial({color:0x586371,roughness:.92}));
          shop.position.set(front.x,2.35,front.z);
          shop.rotation.y=host.road.yaw(z);
          shop.receiveShadow=true;shop.castShadow=true;
          host.tagWorldModel(shop,'storefront');host.cityGroup.add(shop);
          const awning=host.factory.box(shopW*.76,.18,1.0,host.factory.mats.awning);
          awning.position.set(front.x,3.2,front.z + Math.cos(host.road.yaw(z))*shopD*.48);
          awning.rotation.y=host.road.yaw(z);
          host.cityGroup.add(awning);
          const signColors=[0x24364a,0x344054,0x2d3f34,0x493a2a];
          const signMat=new THREE.MeshStandardMaterial({color:signColors[Math.floor(r()*signColors.length)%signColors.length],roughness:.82});
          const storeSign=host.factory.box(shopW*.62,.42,.08,signMat);
          storeSign.position.set(0,1.52,shopD/2+.08);shop.add(storeSign);
          const doorMat=new THREE.MeshStandardMaterial({color:0x142033,roughness:.64,metalness:.05});
          const door=host.factory.box(.92,1.7,.08,doorMat);
          door.position.set(-shopW*.30,-1.05,shopD/2+.09);shop.add(door);
          for(let i=-1;i<=1;i++){
            const win=host.factory.box(1.1,1.0,.07,host.factory.mats.windowLit);
            win.position.set(i*shopW*.22,.35,shopD/2+.05);
            shop.add(win);
            const sill=host.factory.box(1.25,.05,.08,host.factory.mats.dark);
            sill.position.set(i*shopW*.22,-.20,shopD/2+.09);
            shop.add(sill);
          }
        }
      }
    }
    const lampStep=map==='nightcity'?20:map==='downtown'?24:map==='suburb'?42:90;const firstLamp=Math.floor(minZ/lampStep)*lampStep;
    const lastLamp=maxZ+80;
    for(let z=firstLamp;z<lastLamp;z+=lampStep){
      for(const side of [-1,1]){
        const lampPos=host.road.point(z,side*(host.road.width/2+host.road.sidewalk*.48));
        const lamp=host.factory.streetLight();
        host.tagWorldModel(lamp,'streetlight-urban');
        lamp.position.copy(lampPos);
        lamp.rotation.y=host.road.yaw(z)+(side<0?Math.PI:0);
        host.cityGroup.add(lamp);
        if(map!=='highway'&&map!=='rural'&&Math.abs((z%128))<1){
          const plaza=host.road.point(z+8,side*(host.road.width/2+host.road.sidewalk+4.2));
          const pad=host.factory.box(11,.05,8,new THREE.MeshStandardMaterial({color:0x8a949e,roughness:.96}));
          pad.position.set(plaza.x,.026,plaza.z);
          pad.rotation.y=host.road.yaw(z);
          host.cityGroup.add(pad);
        }
        if(map!=='highway'&&map!=='rural'&&Math.abs(z%96)<1){
          const forcedPropId=map==='highway'&&side>0&&Math.abs(z%1440)<1?'service-station':map==='suburb'&&side<0&&Math.abs(z%840)<1?'service-station':map==='suburb'&&side>0&&Math.abs(z%192)<1?'ev-charger':map==='suburb'&&side>0&&Math.abs((z-672)%1344)<1?'mailbox':map==='suburb'&&side<0&&Math.abs((z-1344)%1344)<1?'utility-box':map==='nightcity'&&side<0&&Math.abs(z%192)<1?'ev-charger':map==='downtown'&&side>0&&Math.abs(z%192)<1?'street-sign':(map==='downtown'&&side<0&&Math.abs(z%384)<1)||(map==='nightcity'&&side>0&&Math.abs(z%400)<1)||(map==='suburb'&&side<0&&Math.abs((z-672)%1344)<1)?'construction-barricade':null;
          const propId=forcedPropId||host.pickWorldModel(map,Math.floor(z/96)+side*3,'prop');
          const prop=propId==='bench'?host.factory.bench():propId==='planter'?host.factory.planter():propId==='bollard'?host.factory.bollard():propId==='hydrant'?host.factory.hydrant():propId==='parking-meter'?host.factory.parkingMeter():propId==='bike-rack'?host.factory.bikeRack():propId==='traffic-camera'?host.factory.trafficCamera():propId==='mailbox'?host.factory.mailbox():propId==='utility-box'?host.factory.utilityBox():propId==='ev-charger'?host.factory.evCharger():propId==='street-sign'?host.factory.streetSign():propId==='construction-barricade'?host.factory.constructionBarricade():propId==='billboard'?host.factory.billboard():propId==='service-station'?host.factory.serviceStation():host.factory.busStop();
          const propLateral=propId==='service-station'?side*(host.road.width/2+host.road.sidewalk+7.0):side*(host.road.width/2+host.road.sidewalk*.74);
          const propPos=host.road.point(z+7,propLateral);
          prop.position.copy(propPos);prop.rotation.y=host.road.yaw(z)+(side<0?Math.PI:0);
          host.tagWorldModel(prop,propId);host.cityGroup.add(prop);
        }
      }
    }
    // Open-road maps use roadside barriers and trees instead of dense city blocks.
    if(map==='highway'||map==='rural'){
      for(let z=Math.floor(minZ/24)*24;z<maxZ+24;z+=24){for(const side of [-1,1]){const rail=host.factory.guardrailSegment?.(map)||host.factory.box(.14,.72,25,new THREE.MeshStandardMaterial({color:map==='highway'?0x9aa7b3:0x6d7d55,roughness:.72,metalness:map==='highway'?.45:.05}));const rp=host.road.point(z,side*(host.road.width/2+1.25));rail.position.set(rp.x,0,rp.z);rail.rotation.y=host.road.yaw(z);host.tagWorldModel(rail,'guardrail-segment');host.cityGroup.add(rail);if(z%48===0){const post=host.factory.roadsidePost();post.position.copy(host.road.point(z+6,side*(host.road.width/2+1.45)));post.rotation.y=host.road.yaw(z);host.tagWorldModel(post,'roadside-post');host.cityGroup.add(post);}if(z%240===0){const special=map==='highway'?host.factory.trafficCamera():host.factory.utilityBox();special.position.copy(host.road.point(z+11,side*(host.road.width/2+3.0)));special.rotation.y=host.road.yaw(z)+(side<0?Math.PI:0);host.tagWorldModel(special,map==='highway'?'traffic-camera':'utility-box');host.cityGroup.add(special);}if(map==='highway'&&side>0&&z%720===0){const billboard=host.factory.billboard();billboard.position.copy(host.road.point(z+15,side*(host.road.width/2+5.0)));billboard.rotation.y=host.road.yaw(z)+(side<0?Math.PI:0);host.tagWorldModel(billboard,'billboard');host.cityGroup.add(billboard);}if(map==='highway'&&side>0&&Math.abs(z%1440)<1){const station=host.factory.serviceStation();station.position.copy(host.road.point(z+18,side*(host.road.width/2+host.road.sidewalk+7.0)));station.rotation.y=host.road.yaw(z);host.tagWorldModel(station,'service-station');host.cityGroup.add(station);}}}
      if(map==='highway'){
        for(let z=Math.floor(minZ/960)*960;z<maxZ+960;z+=960){
          const overpass=host.factory.bridgeOverpass?.();
          if(overpass){const p=host.road.point(z,0);overpass.position.set(p.x,0,p.z);overpass.rotation.y=host.road.yaw(z);host.tagWorldModel(overpass,'bridge-overpass');host.cityGroup.add(overpass);}
        }
        for(let z=Math.floor(minZ/360)*360;z<maxZ+360;z+=360){const p=host.road.point(z,0);const gantry=host.factory.highwayGantry?.()||new THREE.Group();gantry.position.copy(p);gantry.rotation.y=host.road.yaw(z);host.tagWorldModel(gantry,'highway-gantry');host.cityGroup.add(gantry);}
      }
      const tunnelZ=map==='highway'?1680:1560;
      if(tunnelZ>minZ-80&&tunnelZ<maxZ+80){
        const portal=host.factory.tunnelPortal?.(map);
        if(portal){const p=host.road.point(tunnelZ,0);portal.position.set(p.x,0,p.z);portal.rotation.y=host.road.yaw(tunnelZ);host.tagWorldModel(portal,'tunnel-portal');host.cityGroup.add(portal);}
      }
    }
    if(map==='nightcity'){
      const neonColors=[0x00d8ff,0xff3ea5,0x8b5cff,0x38ff9b];for(let z=Math.floor(minZ/96)*96;z<maxZ+96;z+=96){for(const side of [-1,1]){const p=host.road.point(z,side*(host.road.width/2+host.road.sidewalk+5.4));const mat=new THREE.MeshBasicMaterial({color:neonColors[Math.abs(Math.floor(z/96)+side+8)%neonColors.length]});const sign=host.factory.box(3.8,1.05,.12,mat);sign.position.set(p.x,4.3,p.z);sign.rotation.y=host.road.yaw(z)+(side<0?Math.PI:0);host.cityGroup.add(sign);}}}
    if(map==='rural'||map==='suburb'){
      const treeStep=map==='rural'?42:78;
      for(let z=Math.floor(minZ/treeStep)*treeStep;z<maxZ+treeStep;z+=treeStep){for(const side of [-1,1]){const p=host.road.point(z+host.seededRand(z+side*7)*12,side*(host.road.width/2+host.road.sidewalk+10+host.seededRand(z+side*13)*18));const treeStyle=map==='rural'?(host.seededRand(z+side*19)>.62?'pine':'deciduous'):(host.seededRand(z+side*19)>.72?'autumn':'deciduous');const tree=host.factory.tree(treeStyle);tree.position.copy(p);tree.rotation.y=host.seededRand(z+side*23)*.3;host.tagWorldModel(tree,treeStyle==='pine'?'tree-pine':treeStyle==='autumn'?'tree-autumn':'tree-deciduous');host.cityGroup.add(tree);}}}
    if(map==='rural'){
      const waterTowerZ=720;
      if(waterTowerZ>minZ-100&&waterTowerZ<maxZ+100){
        const tower=host.factory.waterTower?.();
        if(tower){const p=host.road.point(waterTowerZ,host.road.width/2+10.5);tower.position.set(p.x,0,p.z);tower.rotation.y=host.road.yaw(waterTowerZ);host.tagWorldModel(tower,'water-tower');host.cityGroup.add(tower);}
      }
    }
    if(map==='rural'||map==='highway'){
      const windTurbineZ=map==='rural'?1120:1320;
      if(windTurbineZ>minZ-120&&windTurbineZ<maxZ+120){
        const turbine=host.factory.windTurbine?.();
        if(turbine){const p=host.road.point(windTurbineZ,host.road.width/2+18.5);turbine.position.set(p.x,0,p.z);turbine.rotation.y=host.road.yaw(windTurbineZ);host.tagWorldModel(turbine,'wind-turbine');host.cityGroup.add(turbine);}
      }
    }
    if(map==='rural'||map==='suburb'){
      const railCrossingZ=map==='rural'?420:560;
      if(railCrossingZ>minZ-100&&railCrossingZ<maxZ+100){
        const crossing=host.factory.railCrossing?.(map);
        if(crossing){const p=host.road.point(railCrossingZ,0);crossing.position.set(p.x,0,p.z);crossing.rotation.y=host.road.yaw(railCrossingZ);host.tagWorldModel(crossing,'rail-crossing');host.cityGroup.add(crossing);host.railCrossings.push({z:railCrossingZ,model:crossing,map});}
      }
    }
    window.SimWorldVisuals?.applyWorldEnvironment?.(host.cityGroup,{weather:host.env.weather,surface:host.env.surface});
  }



if(typeof window!=='undefined')window.SimWorldBuilder={buildBaseScene,buildCityBlocks,buildRoadStrip,drawIntersection,drawRoundabout};
