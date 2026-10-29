const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

class MeshFactory{
  constructor(){
    const asphaltMap=this.makeRoadTexture(256,256);
    asphaltMap.wrapS=THREE.RepeatWrapping;
    asphaltMap.wrapT=THREE.RepeatWrapping;
    asphaltMap.repeat.set(1.8,18);
    asphaltMap.needsUpdate=true;
    const shoulderMap=this.makeShoulderTexture(192,192);
    shoulderMap.wrapS=THREE.RepeatWrapping;
    shoulderMap.wrapT=THREE.RepeatWrapping;
    shoulderMap.repeat.set(1.2,14);
    shoulderMap.needsUpdate=true;
    this.mats={
      asphalt:new THREE.MeshStandardMaterial({color:0x2d3642,roughness:.97,metalness:0,map:asphaltMap}),
      shoulder:new THREE.MeshStandardMaterial({color:0x303946,roughness:1,map:shoulderMap}),
      roadBase:new THREE.MeshStandardMaterial({color:0x1b2430,roughness:1}),
      concrete:new THREE.MeshStandardMaterial({color:0x6e7884,roughness:.92}),
      curb:new THREE.MeshStandardMaterial({color:0xb7c1cc,roughness:.75}),
      grass:new THREE.MeshStandardMaterial({color:0x182719,roughness:1}),
      white:new THREE.MeshStandardMaterial({color:0xe8edf2,roughness:.7}),
      yellow:new THREE.MeshStandardMaterial({color:0xffd166,roughness:.7}),
      laneWhite:new THREE.MeshStandardMaterial({color:0xf4f7fb,roughness:.58}),
      laneYellow:new THREE.MeshStandardMaterial({color:0xf7d363,roughness:.58}),
      roadPatch:new THREE.MeshStandardMaterial({color:0x252f3a,roughness:1,transparent:true,opacity:.68}),
      tar:new THREE.MeshStandardMaterial({color:0x141b24,roughness:1}),
      cyan:new THREE.MeshBasicMaterial({color:0x4ee7ff,transparent:true,opacity:.78}),
      green:new THREE.MeshBasicMaterial({color:0x42f58c,transparent:true,opacity:.85}),
      red:new THREE.MeshBasicMaterial({color:0xff5c7a}),
      car:new THREE.MeshPhysicalMaterial({color:0xbfd2e8,roughness:.34,metalness:.18,clearcoat:.38,clearcoatRoughness:.16}),
      car2:new THREE.MeshPhysicalMaterial({color:0x8aa4c5,roughness:.40,metalness:.14,clearcoat:.28,clearcoatRoughness:.18}),
      dark:new THREE.MeshStandardMaterial({color:0x111827,roughness:.6}),
      tire:new THREE.MeshStandardMaterial({color:0x05070a,roughness:.8}),
      cone:new THREE.MeshStandardMaterial({color:0xff7a36,roughness:.65}),
      ped:new THREE.MeshStandardMaterial({color:0xffd166,roughness:.7}),
      sign:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55}),
      signRed:new THREE.MeshStandardMaterial({color:0xd82032,roughness:.45}),
      pole:new THREE.MeshStandardMaterial({color:0x8f9aab,roughness:.5}),
      windowLit:new THREE.MeshStandardMaterial({color:0xa7c3d9,roughness:.32,metalness:.08,emissive:0x23384c,emissiveIntensity:.18}),
      brick:new THREE.MeshStandardMaterial({color:0x5e4a45,roughness:.92}),
      facade:new THREE.MeshStandardMaterial({color:0x4f5c69,roughness:.9}),
      awning:new THREE.MeshStandardMaterial({color:0x2b3647,roughness:.82}),
      leaf:new THREE.MeshStandardMaterial({color:0x47745a,roughness:.96}),
      leafDark:new THREE.MeshStandardMaterial({color:0x2f503b,roughness:1}),
      leafAutumn:new THREE.MeshStandardMaterial({color:0xb96335,roughness:.94}),
      wood:new THREE.MeshStandardMaterial({color:0x5a3c2b,roughness:.96}),
      rim:new THREE.MeshStandardMaterial({color:0xc8d0d8,roughness:.18,metalness:.82}),
      glass:new THREE.MeshPhysicalMaterial({color:0x0d1a2a,roughness:.06,metalness:.12,transmission:.12,ior:1.45,transparent:true,opacity:.76,side:THREE.DoubleSide}),
      headlight:new THREE.MeshStandardMaterial({color:0xd8e8f8,roughness:.06,metalness:.5,emissive:0xffffff,emissiveIntensity:0}),
      marker:new THREE.MeshStandardMaterial({color:0xffb347,roughness:.32,metalness:.12,emissive:0x6b2f08,emissiveIntensity:.18}),
      taillight:new THREE.MeshStandardMaterial({color:0xff2211,roughness:.18,metalness:.05,emissive:0xff2200,emissiveIntensity:0.28}),
      chrome:new THREE.MeshStandardMaterial({color:0xd4dce6,roughness:.05,metalness:.96}),
      lampGlow:new THREE.MeshBasicMaterial({color:0xfff4bf})
    };
  }
  makeRoadTexture(w,h){
    const c=document.createElement('canvas');
    c.width=w;c.height=h;
    const x=c.getContext('2d');
    x.fillStyle='#384250';
    x.fillRect(0,0,w,h);
    for(let i=0;i<3800;i++){
      const g=48+Math.floor(Math.random()*78);
      x.fillStyle=`rgb(${g},${g+2},${g+6})`;
      x.fillRect(Math.random()*w,Math.random()*h,1,1);
    }
    for(let i=0;i<22;i++){
      x.fillStyle=`rgba(24,30,38,${0.08+Math.random()*0.12})`;
      x.fillRect(0,Math.random()*h,w,1+Math.random()*2.2);
    }
    for(let i=0;i<70;i++){
      x.strokeStyle=`rgba(205,212,220,${Math.random()*0.06})`;
      x.lineWidth=.5+Math.random()*.9;
      const y=Math.random()*h;
      x.beginPath();
      x.moveTo(0,y);
      x.lineTo(w,y+Math.random()*5-2.5);
      x.stroke();
    }
    return new THREE.CanvasTexture(c);
  }
  makeShoulderTexture(w,h){
    const c=document.createElement('canvas');
    c.width=w;c.height=h;
    const x=c.getContext('2d');
    x.fillStyle='#495666';
    x.fillRect(0,0,w,h);
    for(let i=0;i<2200;i++){
      const g=84+Math.floor(Math.random()*58);
      x.fillStyle=`rgb(${g},${g+2},${g+4})`;
      x.fillRect(Math.random()*w,Math.random()*h,1,1);
    }
    for(let i=0;i<10;i++){
      x.fillStyle='rgba(22,29,37,.16)';
      x.fillRect(0,i*(h/10),w,1.1);
    }
    return new THREE.CanvasTexture(c);
  }
  box(w,h,d,mat){const isBrakeLight=mat===this.mats.taillight;const isHeadlight=mat===this.mats.headlight;const actualMat=(isBrakeLight||isHeadlight)&&mat?.clone?mat.clone():mat;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),actualMat);m.castShadow=true;m.receiveShadow=true;if(isBrakeLight){m.userData.brakeLight=true;m.userData.baseBrakeIntensity=Number.isFinite(actualMat?.emissiveIntensity)?actualMat.emissiveIntensity:0;}if(isHeadlight){m.userData.headlight=true;m.userData.baseHeadlightIntensity=Number.isFinite(actualMat?.emissiveIntensity)?actualMat.emissiveIntensity:0;}return m;}
  signTexture(label,bg,fg,shape='panel'){
    const speed=shape==='speed';const c=document.createElement('canvas');c.width=320;c.height=speed?420:320;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
    if(shape==='octagon'){
      const cx=c.width/2,cy=c.height/2,r=142;x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;i?x.lineTo(px,py):x.moveTo(px,py);}x.closePath();x.fillStyle=bg;x.fill();x.strokeStyle=fg;x.lineWidth=12;x.stroke();
      x.fillStyle=fg;x.font='700 56px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,cx,cy+4);
    }else{
      x.fillStyle=bg;x.fillRect(18,18,c.width-36,c.height-36);x.strokeStyle='#c9d1da';x.lineWidth=8;x.strokeRect(18,18,c.width-36,c.height-36);
      if(speed){x.beginPath();x.arc(c.width/2,155,104,0,Math.PI*2);x.fillStyle='#f4f7fb';x.fill();x.strokeStyle='#d82032';x.lineWidth=16;x.stroke();x.fillStyle=fg;x.font='700 64px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,c.width/2,160);x.font='700 22px Arial,sans-serif';x.fillText('SPEED',c.width/2,270);x.fillText('LIMIT',c.width/2,296);}
      else{x.fillStyle=fg;x.font='700 42px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,c.width/2,c.height/2);}
    }
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
  }
  vehicleBox(w,h,d,mat,bevel=.10){
    const radius=Math.min(Math.max(.025,bevel),w*.22,h*.22,d*.12);
    const x=w/2,y=h/2,r=radius;
    const shape=new THREE.Shape();
    shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);
    shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);shape.lineTo(-x+r,y);
    shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,curveSegments:3,steps:1,bevelSize:Math.min(r*.62,.065),bevelThickness:Math.min(r*.52,.055)});
    geometry.translate(0,0,-d/2);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.roundedVehiclePart=true;return mesh;
  }
  vehiclePaintColor(index=0,oncoming=false){
    const palette=oncoming?[0x263b63,0x6d3444,0x59606b,0x3c5361,0x7b5b35]:[0x2f7dd1,0xb53f55,0x4f9c78,0xc38a3a,0x8f98a6,0x6d5aa8,0x2e9dba];
    return palette[Math.abs(index)%palette.length];
  }
  vehiclePaint(index=0,oncoming=false){
    const material=(oncoming?this.mats.car2:this.mats.car).clone();
    material.color.setHex(this.vehiclePaintColor(index,oncoming));
    return material;
  }
  addTurnSignals(g,width,length,height=.72){
    const signals={left:[],right:[]};
    for(const side of [-1,1])for(const z of [length*.505,-length*.505]){
      const mat=new THREE.MeshBasicMaterial({color:0x5b3b12,transparent:true,opacity:.18});
      const lamp=this.box(.075,.11,.11,mat);lamp.position.set(side*(width*.5+.025),height,z);lamp.userData.signalSide=side<0?'left':'right';g.add(lamp);signals[side<0?'left':'right'].push(lamp);
    }
    g.userData=g.userData||{};g.userData.turnSignals=signals;return g;
  }
  premiumVehicleDetail(g,profile='sedan'){
    const specs={sedan:{w:1.04,z:1.42,r:.32,y:.31,body:2.04,length:4.22},suv:{w:1.12,z:1.62,r:.36,y:.35,body:2.16,length:4.62},pickup:{w:1.08,z:1.70,r:.34,y:.33,body:2.06,length:4.90},van:{w:1.12,z:1.96,r:.34,y:.33,body:2.22,length:5.46}}[profile]||{w:1.04,z:1.42,r:.32,y:.31,body:2.04,length:4.22};
    const trim=this.mats.chrome, dark=this.mats.dark;
    const sill=this.box(specs.body*.92,.07,.18,dark);sill.position.set(0,.40,0);g.add(sill);
    const shoulder=this.box(specs.body*.90,.045,.06,trim);shoulder.position.set(0,.93,-.05);g.add(shoulder);
    const frontLip=this.box(specs.body*.82,.06,.16,trim);frontLip.position.set(0,.37,specs.length*.49);g.add(frontLip);
    const plate=this.box(.52,.16,.035,this.mats.sign);plate.position.set(0,.56,specs.length*.505);g.add(plate);
    const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.018,.028,.28,8),dark);antenna.position.set(0,1.85,-.35);antenna.rotation.z=-.18;g.add(antenna);
    for(const x of [-specs.w,specs.w]){
      const arch=new THREE.Mesh(new THREE.TorusGeometry(specs.r+.025,.045,6,18),dark);arch.rotation.y=Math.PI/2;arch.position.set(x,.34,0);arch.scale.z=1.25;g.add(arch);
      const rocker=this.box(.055,.14,specs.length*.58,dark);rocker.position.set(x*.99,.48,0);g.add(rocker);
    }
    g.userData=g.userData||{};g.userData.modelQuality='premium-procedural';g.userData.vehicleProfile=profile;
    return this.registerVehicleWheels(g);
  }
  fleetVehicleDetail(g,profile='van'){
    const marker=new THREE.MeshStandardMaterial({color:0xffb347,roughness:.32,metalness:.12,emissive:0x6b2f08,emissiveIntensity:.18});
    const reflective=new THREE.MeshStandardMaterial({color:0xffd166,roughness:.38,metalness:.05,emissive:0x4b2504,emissiveIntensity:.12});
    if(profile==='van'){
      for(const x of [-.68,.68]){
        const pane=this.box(.82,.62,.035,this.mats.glass);pane.position.set(x,1.38,-2.79);g.add(pane);
      }
      for(const x of [-1.145,1.145]){
        const handle=this.box(.055,.07,.30,this.mats.chrome);handle.position.set(x,1.24,.38);g.add(handle);
        for(const z of [-2.56,2.58]){const lamp=this.box(.10,.12,.06,marker);lamp.position.set(x*.94,1.86,z);g.add(lamp);}
      }
      const rearPlate=this.box(.54,.16,.035,this.mats.sign);rearPlate.position.set(0,.58,-2.875);g.add(rearPlate);
      g.userData.fleetDetail='rear-glass-door-hardware';
    }else if(profile==='boxtruck'){
      for(const x of [-1.255,1.255]){
        const rail=this.box(.055,.07,3.56,this.mats.chrome);rail.position.set(x,1.12,-.46);g.add(rail);
        for(const z of [-2.54,2.35]){const lamp=this.box(.12,.13,.06,marker);lamp.position.set(x*.96,2.43,z);g.add(lamp);}
      }
      for(const x of [-.98,.98]){
        const hinge=this.box(.09,.24,.12,this.mats.chrome);hinge.position.set(x,1.48,-2.62);g.add(hinge);
        const mud=this.box(.16,.44,.08,this.mats.dark);mud.position.set(x*1.01,.34,-1.78);g.add(mud);
      }
      const rearPlate=this.box(.58,.16,.035,this.mats.sign);rearPlate.position.set(0,.58,-2.76);g.add(rearPlate);
      g.userData.fleetDetail='cargo-rails-rear-hardware';
    }else if(profile==='emergency'){
      for(const x of [-.985,.985]){
        const stripe=this.box(.045,.11,3.42,reflective);stripe.position.set(x,.88,-.02);g.add(stripe);
        const handle=this.box(.055,.07,.26,this.mats.chrome);handle.position.set(x*1.02,1.18,.38);g.add(handle);
      }
      const grille=this.box(1.30,.16,.045,this.mats.chrome);grille.position.set(0,.65,2.225);g.add(grille);
      const plate=this.box(.54,.16,.035,this.mats.sign);plate.position.set(0,.56,2.225);g.add(plate);
      g.userData.fleetDetail='reflective-stripe-response-kit';
    }
    return g;
  }
  registerVehicleWheels(g){
    return window.SimVehicleVisuals?.registerVehicleWheels?.(g)||g;
  }
  car(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car;
    // Lower body
    const body=this.vehicleBox(2.04,.62,4.22,mat,.14);body.position.y=.50;g.add(body);
    // Upper door panels
    const upper=this.vehicleBox(1.90,.28,3.80,mat,.09);upper.position.y=.92;g.add(upper);
    // Cabin
    const cabin=this.vehicleBox(1.36,.52,1.80,this.mats.dark,.12);cabin.position.set(0,1.14,-.26);g.add(cabin);
    // Windshield
    const ws=this.box(1.28,.46,.08,this.mats.glass);ws.position.set(0,1.10,.60);ws.rotation.x=.32;g.add(ws);
    // Rear window
    const rw=this.box(1.24,.42,.08,this.mats.glass);rw.position.set(0,1.08,-1.12);rw.rotation.x=-.30;g.add(rw);
    // Side windows
    for(const x of [-.96,.96]){const sw=this.box(.08,.36,1.42,this.mats.glass);sw.position.set(x,1.14,-.28);g.add(sw);}
    // Hood panel
    const hood=this.vehicleBox(1.92,.07,1.38,mat,.035);hood.position.set(0,.84,1.12);g.add(hood);
    // Front bumper
    const fb=this.box(2.00,.24,.14,this.mats.dark);fb.position.set(0,.36,2.14);g.add(fb);
    // Rear bumper
    const rb=this.box(2.00,.24,.14,this.mats.dark);rb.position.set(0,.36,-2.14);g.add(rb);
    // Grille
    const gr=this.box(1.22,.18,.08,this.mats.dark);gr.position.set(0,.64,2.15);g.add(gr);
    // Headlights
    for(const x of [-.62,.62]){const hl=this.box(.32,.14,.08,this.mats.headlight);hl.position.set(x,.72,2.13);g.add(hl);}
    // Tail lights
    for(const x of [-.70,.70]){const tl=this.box(.28,.12,.08,this.mats.taillight);tl.position.set(x,.70,-2.13);g.add(tl);}
    // Brake strip
    const brake=this.box(1.38,.07,.06,this.mats.red);brake.position.set(0,.79,2.14);g.add(brake);
    // Side mirrors
    for(const x of [-1.08,1.08]){const m=this.box(.09,.11,.18,this.mats.dark);m.position.set(x,1.02,.42);g.add(m);}
    // Tires + rims
    for(const x of [-1.04,1.04])for(const z of [-1.42,1.42]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.24,18),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.30,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.25,10),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.30,z);g.add(r);
    }
    g.userData={cameraHeight:1.18,cameraZ:1.9,label:'sedan'};this.addTurnSignals(g,2.04,4.22,.72);return this.premiumVehicleDetail(g,'sedan');
  }
  compact(colorMat){
    const g=this.car(colorMat);
    g.scale.set(.92,.90,.88);
    g.position.y=.015;
    const spoiler=this.box(1.18,.10,.20,this.mats.dark);spoiler.position.set(0,1.43,-1.92);g.add(spoiler);
    const roofRail=this.box(.06,.06,1.25,this.mats.chrome);for(const x of [-.52,.52]){const rail=roofRail.clone();rail.position.set(x,1.58,-.25);g.add(rail);}
    g.userData={...(g.userData||{}),label:'compact hatchback',vehicleProfile:'compact'};
    return g;
  }
  sport(colorMat){
    const g=this.car(colorMat);
    g.scale.set(1.01,.86,1.04);
    g.position.y=.015;
    const splitter=this.box(1.72,.08,.22,this.mats.chrome);splitter.position.set(0,.34,2.18);g.add(splitter);
    const wing=this.box(1.35,.08,.18,this.mats.chrome);wing.position.set(0,1.37,-1.94);g.add(wing);
    for(const x of [-.62,.62]){const fin=this.box(.08,.32,.10,this.mats.chrome);fin.position.set(x,1.48,-1.94);g.add(fin);}
    g.userData={...(g.userData||{}),label:'sport sedan',vehicleProfile:'sport'};
    return g;
  }
  coupe(colorMat){
    const g=this.car(colorMat);
    g.scale.set(1.04,.80,1.08);g.position.y=.012;
    const roof=this.vehicleBox(1.28,.40,1.48,this.mats.dark,.12);roof.position.set(0,1.23,-.22);g.add(roof);
    const roofGlass=this.vehicleBox(1.12,.22,1.18,this.mats.glass,.07);roofGlass.position.set(0,1.30,-.22);g.add(roofGlass);
    for(const side of [-1,1]){
      const window=this.vehicleBox(.06,.26,1.22,this.mats.glass,.025);window.position.set(side*.70,1.25,-.20);g.add(window);
      const handle=this.box(.055,.055,.25,this.mats.chrome);handle.position.set(side*1.00,1.00,.18);g.add(handle);
      const sill=this.vehicleBox(.08,.10,2.48,this.mats.dark,.035);sill.position.set(side*1.04,.48,-.02);g.add(sill);
    }
    const splitter=this.vehicleBox(1.74,.08,.24,this.mats.chrome,.035);splitter.position.set(0,.34,2.28);g.add(splitter);
    const diffuser=this.vehicleBox(1.68,.10,.26,this.mats.dark,.045);diffuser.position.set(0,.36,-2.29);g.add(diffuser);
    const spoiler=this.vehicleBox(1.22,.09,.20,this.mats.chrome,.035);spoiler.position.set(0,1.30,-2.20);g.add(spoiler);
    const ventMat=new THREE.MeshStandardMaterial({color:0x111821,roughness:.42,metalness:.32});
    for(const side of [-1,1]){const vent=this.vehicleBox(.30,.035,.62,ventMat,.025);vent.position.set(side*.56,.89,1.24);vent.rotation.y=side*.12;g.add(vent);}
    g.userData={...(g.userData||{}),cameraHeight:1.12,cameraZ:2.04,label:'Sport coupe',vehicleProfile:'coupe',coupeDetails:{doors:2,fastbackRoof:true,roofGlass:true,frontVents:2,rearDiffuser:true}};
    return g;
  }
  luxury(colorMat){
    const g=this.car(colorMat);
    g.scale.set(1.04,.94,1.06);
    g.position.y=.018;
    const metal=this.mats.chrome;
    const glass=this.mats.glass;
    const grilleFrame=this.vehicleBox(1.12,.27,.10,metal,.055);grilleFrame.position.set(0,.64,2.17);g.add(grilleFrame);
    const grille=this.vehicleBox(.82,.17,.035,this.mats.dark,.025);grille.position.set(0,.64,2.225);g.add(grille);
    const grilleBars=[];
    for(const x of [-.30,-.15,0,.15,.30]){const bar=this.box(.025,.12,.045,metal);bar.position.set(x,.64,2.25);g.add(bar);grilleBars.push(bar);}
    const roof=this.vehicleBox(1.30,.065,1.96,glass,.045);roof.position.set(0,1.47,-.20);g.add(roof);
    const ledMat=new THREE.MeshStandardMaterial({color:0xf3fbff,roughness:.05,metalness:.42,emissive:0x8bdcff,emissiveIntensity:.62});
    const led=this.box(1.52,.055,.045,ledMat);led.position.set(0,.84,2.18);led.userData.headlight=true;led.userData.baseHeadlightIntensity=.62;g.add(led);
    const tailMat=new THREE.MeshStandardMaterial({color:0xff3950,roughness:.20,metalness:.12,emissive:0x7b101b,emissiveIntensity:.34});
    const tail=this.box(1.52,.065,.045,tailMat);tail.position.set(0,.82,-2.20);tail.userData.brakeLight=true;tail.userData.baseBrakeIntensity=.34;g.add(tail);
    for(const side of [-1,1]){
      const shoulder=this.box(.035,.045,3.18,metal);shoulder.position.set(side*1.035,.92,-.02);g.add(shoulder);
      const handle=this.box(.055,.055,.24,metal);handle.position.set(side*1.025,1.01,.22);g.add(handle);
      const sill=this.box(.045,.09,2.72,this.mats.dark);sill.position.set(side*1.02,.50,-.02);g.add(sill);
    }
    g.userData={...(g.userData||{}),label:'luxury sedan',vehicleProfile:'luxury',modelQuality:'premium-procedural',luxuryDetails:{panoramicRoof:true,grilleBars:grilleBars.length,continuousLed:true}};
    return g;
  }
  electric(colorMat){
    const g=this.car(colorMat);
    g.scale.set(1.01,.91,1.02);
    const roof=this.vehicleBox(1.28,.055,1.72,this.mats.glass,.04);roof.position.set(0,1.47,-.16);g.add(roof);
    const fascia=this.vehicleBox(1.64,.16,.30,this.mats.dark,.06);fascia.position.set(0,.58,2.17);g.add(fascia);
    const ledMat=new THREE.MeshStandardMaterial({color:0xe5f5ff,roughness:.05,metalness:.35,emissive:0x8ed9ff,emissiveIntensity:.55});
    const led=this.box(1.38,.065,.045,ledMat);led.position.set(0,.84,2.18);led.userData.headlight=true;led.userData.baseHeadlightIntensity=.55;g.add(led);
    for(const x of [-.92,.92]){
      const handle=this.box(.055,.055,.22,this.mats.chrome);handle.position.set(x,1.02,.18);g.add(handle);
      const aero=this.vehicleBox(.12,.08,.68,this.mats.dark,.03);aero.position.set(x*.98,.35,.12);g.add(aero);
    }
    const chargeMat=new THREE.MeshStandardMaterial({color:0x42f58c,roughness:.28,metalness:.42,emissive:0x42f58c,emissiveIntensity:.34});
    const chargePort=this.box(.10,.12,.035,chargeMat);chargePort.position.set(-1.035,.77,-.72);g.add(chargePort);
    const badge=this.box(.24,.07,.035,chargeMat);badge.position.set(0,.99,-2.17);g.add(badge);
    g.userData={...(g.userData||{}),label:'electric sedan',vehicleProfile:'electric',propulsion:'electric',modelQuality:'premium-procedural'};
    return g;
  }
  taxi(colorMat){
    const g=this.car(colorMat);
    const taxiYellow=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.52,metalness:.05});
    const belt=this.box(1.95,.10,2.55,taxiYellow);belt.position.set(0,.86,-.18);g.add(belt);
    const signBase=this.box(.62,.10,.30,this.mats.dark);signBase.position.set(0,1.56,-.08);g.add(signBase);
    const sign=this.box(.48,.13,.24,taxiYellow);sign.position.set(0,1.64,-.08);g.add(sign);
    g.userData={...(g.userData||{}),label:'taxi sedan',vehicleProfile:'taxi'};
    return g;
  }
  delivery(colorMat){
    const g=this.van(colorMat);
    const logoMat=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.6});
    const logo=this.box(.78,.42,.06,logoMat);logo.position.set(0,1.28,.28);g.add(logo);
    const stripe=this.box(2.24,.10,2.72,logoMat);stripe.position.set(0,1.02,-.02);g.add(stripe);
    g.userData={...(g.userData||{}),label:'delivery van',vehicleProfile:'delivery'};
    return g;
  }
  cone(){const g=new THREE.Group();const base=this.box(.75,.08,.75,this.mats.cone);base.position.y=.04;g.add(base);const c=new THREE.Mesh(new THREE.ConeGeometry(.36,1.1,20),this.mats.cone);c.position.y=.62;c.castShadow=true;g.add(c);return g;}
  pedestrian(style='casual'){
    const g=new THREE.Group();
    const looks={
      casual:{shirt:0x2d7dd2,pants:0x2c3e50,skin:0xc68642,scale:1},
      business:{shirt:0x364152,pants:0x1a1a2e,skin:0xe8a87c,scale:1},
      backpack:{shirt:0xf45d01,pants:0x2b4590,skin:0x8d5524,scale:1},
      child:{shirt:0x06d6a0,pants:0x2d3436,skin:0xf4c894,scale:.78}
    };
    const look=looks[style]||looks.casual;
    const shirt=new THREE.MeshStandardMaterial({color:look.shirt,roughness:.88});
    const pants=new THREE.MeshStandardMaterial({color:look.pants,roughness:.90});
    const skin=new THREE.MeshStandardMaterial({color:look.skin,roughness:.92});
    // Shoes
    for(const x of [-.10,.10]){const s=this.box(.13,.08,.23,this.mats.dark);s.position.set(x,.04,.02);g.add(s);}
    const legRig=[],armRig=[];
    // Lower legs
    for(const x of [-.10,.10]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.068,.062,.52,8),pants);l.position.set(x,.36,0);l.castShadow=true;g.add(l);legRig.push(l);}
    // Hips
    const hips=this.box(.38,.34,.20,pants);hips.position.set(0,.78,0);g.add(hips);
    // Torso
    const torso=this.box(.42,.52,.22,shirt);torso.position.set(0,1.14,0);torso.castShadow=true;g.add(torso);
    // Arms
    for(const x of [-.28,.28]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.062,.056,.60,8),shirt);a.rotation.z=x<0?.18:-.18;a.position.set(x,1.08,0);a.castShadow=true;g.add(a);armRig.push(a);}
    // Neck
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.16,8),skin);neck.position.set(0,1.50,0);g.add(neck);
    // Head
    const head=new THREE.Mesh(new THREE.SphereGeometry(.21,14,12),skin);head.position.set(0,1.68,0);head.castShadow=true;g.add(head);
    const hairMat=new THREE.MeshStandardMaterial({color:style==='child'?0x5b3828:style==='business'?0x263241:0x3a271f,roughness:.94});
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.225,14,8,0,Math.PI*2,0,Math.PI*.48),hairMat);hair.position.set(0,1.79,-.015);hair.castShadow=true;g.add(hair);
    for(const x of [-.22,.22]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),skin);ear.position.set(x,1.68,0);g.add(ear);}
    const nose=this.box(.055,.07,.055,skin);nose.position.set(0,1.68,.205);g.add(nose);
    for(const x of [-.28,.28]){const hand=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),skin);hand.position.set(x,0.77,0);g.add(hand);}
    const belt=this.box(.32,.045,.24,style==='business'?this.mats.chrome:this.mats.dark);belt.position.set(0,.92,.115);g.add(belt);
    if(style==='business'){
      const tieMat=new THREE.MeshStandardMaterial({color:0xb43b54,roughness:.62});
      const tie=this.box(.055,.30,.035,tieMat);tie.position.set(0,1.24,.125);g.add(tie);
      const collarMat=new THREE.MeshStandardMaterial({color:0xe6edf4,roughness:.72});
      for(const x of [-.09,.09]){const collar=this.box(.10,.08,.04,collarMat);collar.position.set(x,1.38,.125);collar.rotation.z=x<0?.35:-.35;g.add(collar);}
    }else if(style==='backpack'){
      const packMat=new THREE.MeshStandardMaterial({color:0x263b63,roughness:.86});
      const pack=this.box(.30,.40,.16,packMat);pack.position.set(0,1.18,-.16);g.add(pack);
      for(const x of [-.16,.16]){const strap=this.box(.035,.38,.035,packMat);strap.position.set(x,1.22,.105);strap.rotation.z=x<0?.18:-.18;g.add(strap);}
    }else if(style==='child'){
      const capMat=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.72});
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8,0,Math.PI*2,0,Math.PI*.42),capMat);cap.position.set(0,1.84,0);g.add(cap);
    }
    g.scale.setScalar(look.scale);
    g.userData={label:'pedestrian',pedestrianStyle:style,walkRig:{legs:legRig,arms:armRig},modelQuality:'premium-procedural'};
    return g;
  }
  pedestrianBusiness(){return this.pedestrian('business');}
  pedestrianBackpack(){return this.pedestrian('backpack');}
  pedestrianChild(){return this.pedestrian('child');}
  roadBlock(){const g=new THREE.Group();const b=this.box(2.4,.7,1.0,this.mats.signRed);b.position.y=.38;g.add(b);for(const x of [-.75,.75]){const stripe=this.box(.25,.72,1.05,this.mats.sign);stripe.position.set(x,.4,0);stripe.rotation.z=.4;g.add(stripe);}return g;}
  building(w,h,d,matA,matB,detail='full',style='mixed'){
    const g=new THREE.Group();
    const shell=this.box(w,h,d,matA||this.mats.facade); shell.position.y=h/2; g.add(shell);
    const roof=this.box(w*.94,.25,d*.94,this.mats.dark); roof.position.y=h+.12; g.add(roof);
    if(detail==='proxy')return g;
    const trimMat=new THREE.MeshStandardMaterial({color:0x303946,roughness:.86});
    const signMat=new THREE.MeshStandardMaterial({color:[0x22384a,0x2c3e50,0x3f4550,0x21322f][Math.floor(Math.random()*4)],roughness:.82});
    const doorMat=new THREE.MeshStandardMaterial({color:0x142030,roughness:.62,metalness:.04});
    // Very light facade structure so buildings read as city blocks without expensive geometry.
    const cornice=this.box(w*.98,.10,.08,trimMat);cornice.position.set(0,h-.45,d/2+.055);g.add(cornice);
    const baseTrim=this.box(w*.96,.08,.08,trimMat);baseTrim.position.set(0,1.05,d/2+.055);g.add(baseTrim);
    const seamCount=clamp(Math.floor(w/4),1,3);
    for(let i=1;i<=seamCount;i++){
      const sx=-w*.42+i*(w*.84/(seamCount+1));
      const seam=this.box(.045,Math.max(2,h-2.2),.055,trimMat);
      seam.position.set(sx,h/2+.55,d/2+.062);g.add(seam);
    }
    const rows=Math.min(8,Math.max(2,Math.floor(h/3.8)));
    const cols=Math.min(7,Math.max(2,Math.floor(w/2.2)));
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const wx=-w*.36 + c*(w*.72/Math.max(1,cols-1));
        const wy=1.45 + r*((h-2.9)/Math.max(1,rows-1));
        const pane=this.box(.72,.92,.06,matB||this.mats.windowLit);
        pane.position.set(wx,wy,d/2+.04);g.add(pane);
        if((r+c)%2===0){
          const mullion=this.box(.04,.88,.065,trimMat);mullion.position.set(wx,wy,d/2+.078);g.add(mullion);
        }
        if(r%2===1){
          const sill=this.box(.84,.045,.065,trimMat);sill.position.set(wx,wy-.52,d/2+.078);g.add(sill);
        }
      }
    }
    // Ground-floor storefront hint on some buildings.
    if(h>12&&w>9){
      const sign=this.box(w*.52,.36,.08,signMat);sign.position.set(0,2.65,d/2+.09);g.add(sign);
      const door=this.box(.82,1.75,.075,doorMat);door.position.set(-w*.22,1.02,d/2+.10);g.add(door);
      const display=this.box(1.15,1.05,.075,matB||this.mats.windowLit);display.position.set(w*.20,1.18,d/2+.10);g.add(display);
    }
    const resolved=String(style||'mixed').replace(/^building-/,'');
    if(resolved==='modern'){
      const mullionMat=new THREE.MeshStandardMaterial({color:0x9eb9c9,roughness:.25,metalness:.55});
      const count=Math.min(6,Math.max(2,Math.floor(w/3.2)));
      for(let i=0;i<count;i++){
        const x=-w*.42+i*(w*.84/Math.max(1,count-1));
        const fin=this.box(.055,Math.max(4,h*.78),.09,mullionMat);fin.position.set(x,h*.57,d/2+.10);g.add(fin);
      }
      const crown=this.box(w*.72,.18,d*.70,mullionMat);crown.position.y=h+.29;g.add(crown);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,Math.min(3.2,h*.18),7),this.mats.pole);mast.position.set(0,h+1.8,0);g.add(mast);
    }else if(resolved==='brick'){
      const lintelMat=new THREE.MeshStandardMaterial({color:0x2e3039,roughness:.88});
      for(let row=0;row<Math.min(8,Math.max(2,Math.floor(h/4)));row++){
        const lintel=this.box(w*.78,.06,.08,lintelMat);lintel.position.set(0,1.85+row*3.7,d/2+.09);g.add(lintel);
      }
      const fireEscape=new THREE.Group();
      const deck=this.box(Math.min(3.8,w*.34),.08,1.2,this.mats.chrome);deck.position.set(-w*.28,Math.min(h-1.1,3.7),d/2+.54);fireEscape.add(deck);
      for(const x of [-1,1]){const rail=this.box(.05,.75,1.25,this.mats.chrome);rail.position.set(-w*.28+x*Math.min(1.7,w*.16),Math.min(h-1.1,4.1),d/2+.54);fireEscape.add(rail);}
      g.add(fireEscape);
    }else if(resolved==='residential'){
      const balconyMat=new THREE.MeshStandardMaterial({color:0x778998,roughness:.64,metalness:.22});
      const balconyRows=Math.max(1,Math.min(4,Math.floor((h-4)/3.2)));
      for(let row=0;row<balconyRows;row++){
        const balcony=this.box(w*.48,.08,1.0,balconyMat);balcony.position.set(w*.18,2.35+row*3.2,d/2+.47);g.add(balcony);
        for(const x of [-.20,.20]){const post=this.box(.035,.72,.035,balconyMat);post.position.set(w*.18+x*w*.18,2.70+row*3.2,d/2+.90);g.add(post);}
        const rail=this.box(w*.45,.05,.035,balconyMat);rail.position.set(w*.18,3.03+row*3.2,d/2+.91);g.add(rail);
      }
    }else if(resolved==='podium'){
      const parapet=this.box(w*.98,.28,d*.96,this.mats.chrome);parapet.position.y=Math.max(5,h*.42);g.add(parapet);
      for(const x of [-w*.26,w*.26]){
        const hvac=this.box(Math.min(1.6,w*.16),.72,Math.min(1.4,d*.18),this.mats.dark);hvac.position.set(x,h+.48,0);g.add(hvac);
      }
      const canopy=this.box(w*.65,.12,.95,this.mats.awning);canopy.position.set(0,3.05,d/2+.48);g.add(canopy);
    }else if(resolved==='mobility-hub'){
      const deckMat=new THREE.MeshStandardMaterial({color:0x263542,roughness:.82,metalness:.12});
      const accentMat=new THREE.MeshStandardMaterial({color:0x42f58c,roughness:.36,metalness:.18,emissive:0x0b5a42,emissiveIntensity:.22});
      const levelCount=Math.max(2,Math.min(7,Math.floor((h-2.4)/3.15)));
      for(let level=0;level<levelCount;level++){
        const y=2.05+level*3.05;
        const deck=this.box(w*.96,.14,d*.96,deckMat);deck.position.y=y;g.add(deck);
        for(const x of [-w*.42,w*.42]){
          const pillar=this.box(.18,2.84,.18,this.mats.chrome);pillar.position.set(x,y-1.42,d/2+.12);g.add(pillar);
        }
        for(const x of [-w*.30,0,w*.30]){
          const bay=this.box(w*.18,.08,.05,accentMat);bay.position.set(x,y+.12,d/2+.08);g.add(bay);
        }
      }
      const ramp=this.box(w*.16,Math.max(3.8,h*.66),d*.82,accentMat);ramp.position.set(w*.31,h*.46,0);ramp.rotation.z=-.12;g.add(ramp);
      const entrance=this.box(w*.44,2.05,.12,this.mats.dark);entrance.position.set(-w*.12,1.08,d/2+.12);g.add(entrance);
      const hubSign=this.box(w*.54,.48,.08,accentMat);hubSign.position.set(0,Math.min(h-1.2,4.0),d/2+.14);g.add(hubSign);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.46,5.4),.28),new THREE.MeshBasicMaterial({map:this.signTexture('MOBILITY','#42f58c','#102029','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,Math.min(h-1.2,4.0),d/2+.19);g.add(face);
    }else if(resolved==='suburban'){
      const roofMat=new THREE.MeshStandardMaterial({color:0x394352,roughness:.82});
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.62,Math.max(1.5,Math.min(3.2,h*.34)),4),roofMat);
      roof.rotation.y=Math.PI/4;roof.position.y=h+.85;roof.scale.set(1,.55,Math.max(.65,w/Math.max(1,d)));g.add(roof);
      const garage=this.box(Math.min(3.2,w*.26),1.45,.08,this.mats.dark);garage.position.set(-w*.24,.78,d/2+.10);g.add(garage);
    }
    return g;
  }
  tree(style='deciduous'){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.23,2.4,8),this.mats.wood);trunk.position.y=1.2;trunk.castShadow=true;g.add(trunk);
    const branchMat=this.mats.wood;
    for(const [x,z,rot] of [[-.28,0,-.55],[.28,.08,.55],[0,.18,0]]){
      const branch=new THREE.Mesh(new THREE.CylinderGeometry(.045,.09,.92,7),branchMat);branch.position.set(x,2.08,z);branch.rotation.z=rot;branch.rotation.x=.24;branch.castShadow=true;g.add(branch);
    }
    if(style==='pine'){
      for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25-i*.22,1.55,9),this.mats.leafDark);crown.position.y=2.35+i*.72; crown.castShadow=true;g.add(crown);}
    }else{
      const mat=style==='autumn'?this.mats.leafAutumn:this.mats.leaf;
      for(const [x,y,z,s] of [[0,2.85,0,1.15],[-.62,2.65,.08,.86],[.58,2.62,-.04,.9],[.08,3.45,.04,.82]]){
        const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),mat);crown.position.set(x,y,z);crown.castShadow=true;g.add(crown);
      }
    }
    g.userData={label:'tree',modelQuality:'premium-procedural'};return g;
  }
  bench(){
    const g=new THREE.Group();const frame=this.mats.dark;
    for(const z of [-.14,0,.14]){const slat=this.box(1.55,.10,.11,this.mats.wood);slat.position.set(0,.72,z);g.add(slat);}
    for(const y of [.90,1.06,1.22]){const slat=this.box(1.55,.10,.10,this.mats.wood);slat.position.set(0,y,-.17);g.add(slat);}
    for(const x of [-.58,.58]){
      const leg=this.box(.09,.72,.09,frame);leg.position.set(x,.36,0);g.add(leg);
      const backPost=this.box(.08,.95,.08,frame);backPost.position.set(x,.97,-.15);g.add(backPost);
      const armPost=this.box(.07,.42,.07,frame);armPost.position.set(x,.88,.02);g.add(armPost);
      const arm=this.box(.22,.07,.07,frame);arm.position.set(x,.99,-.02);g.add(arm);
    }
    const brace=this.box(1.10,.06,.07,frame);brace.position.set(0,.22,0);g.add(brace);
    g.userData={label:'bench',modelQuality:'premium-procedural'};return g;
  }
  planter(){
    const g=new THREE.Group();const pot=new THREE.Mesh(new THREE.CylinderGeometry(.42,.58,.64,12),this.mats.concrete);pot.position.y=.32;pot.castShadow=true;g.add(pot);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.47,.055,7,18),this.mats.curb);rim.position.y=.64;g.add(rim);
    const soil=new THREE.Mesh(new THREE.CylinderGeometry(.40,.40,.07,12),this.mats.dark);soil.position.y=.65;g.add(soil);
    for(const [x,z,h] of [[-.22,0,.68],[.18,.08,.78],[0,-.18,.58]]){
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,h,7),this.mats.wood);stem.position.set(x,.65+h/2,z);g.add(stem);
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1),this.mats.leaf);leaf.position.set(x,.78+h,z);g.add(leaf);
    }
    g.userData={label:'planter',modelQuality:'premium-procedural'};return g;
  }
  bollard(){
    const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.10,12),this.mats.dark);base.position.y=.05;g.add(base);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.075,.11,.72,12),this.mats.pole);stem.position.y=.43;g.add(stem);
    const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.087,.087,.12,12),this.mats.signRed);stripe.position.y=.60;g.add(stripe);
    const reflector=this.box(.07,.08,.018,this.mats.laneWhite);reflector.position.set(0,.60,-.09);g.add(reflector);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.11,12,8),this.mats.pole);cap.position.y=.80;g.add(cap);
    g.userData={label:'bollard',modelQuality:'premium-procedural'};return g;
  }
  hydrant(){
    const g=new THREE.Group();const redMat=new THREE.MeshStandardMaterial({color:0xc73b38,roughness:.48,metalness:.18});
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.23,.27,.10,12),this.mats.dark);base.position.y=.05;g.add(base);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.70,12),redMat);stem.position.y=.40;g.add(stem);
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.10,12),redMat);collar.position.y=.70;g.add(collar);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),redMat);cap.scale.y=.62;cap.position.y=.82;g.add(cap);
    for(const x of [-.19,.19]){const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.065,.08,.16,10),redMat);nozzle.rotation.z=Math.PI/2;nozzle.position.set(x,.46,0);g.add(nozzle);const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.025,8),this.mats.chrome);bolt.rotation.z=Math.PI/2;bolt.position.set(x>0?x+.085:x-.085,.46,0);g.add(bolt);}
    g.userData={label:'hydrant',modelQuality:'premium-procedural'};return g;
  }
  busStop(){
    const g=new THREE.Group();const frame=this.mats.pole;
    const pad=this.box(3.05,.06,1.32,this.mats.concrete);pad.position.set(0,.03,0);g.add(pad);
    for(const x of [-1.35,1.35]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,2.25,10),frame);post.position.set(x,1.12,0);g.add(post);}
    const roof=this.box(3.0,.14,1.16,this.mats.awning);roof.position.y=2.28;g.add(roof);
    const roofTrim=this.box(2.88,.06,.06,this.mats.chrome);roofTrim.position.set(0,2.18,-.58);g.add(roofTrim);
    const glass=new THREE.Mesh(new THREE.BoxGeometry(2.72,1.55,.035),this.mats.glass);glass.position.set(0,1.18,-.46);g.add(glass);
    const ad=this.box(.58,.88,.025,this.mats.sign);ad.position.set(-.84,1.20,-.49);g.add(ad);
    for(const z of [-.09,.09]){const slat=this.box(1.8,.09,.10,this.mats.wood);slat.position.set(0,.72,z);g.add(slat);}
    const seatFrame=this.box(1.34,.08,.07,frame);seatFrame.position.set(0,.55,.04);g.add(seatFrame);
    const signPole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.90,9),frame);signPole.position.set(1.48,.95,0);g.add(signPole);
    const sign=this.box(.42,.48,.08,this.mats.sign);sign.position.set(1.48,2.0,.0);g.add(sign);
    const signFace=new THREE.Mesh(new THREE.PlaneGeometry(.34,.38),new THREE.MeshBasicMaterial({map:this.signTexture('BUS','#1d6fe8','#ffffff','panel'),transparent:true,side:THREE.DoubleSide}));signFace.position.set(1.48,2.0,-.051);g.add(signFace);
    g.userData={label:'bus stop',modelQuality:'premium-procedural'};return g;
  }
  roadsidePost(){
    const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(.11,.15,.08,10),this.mats.dark);base.position.y=.04;g.add(base);
    const post=this.box(.10,.86,.10,this.mats.sign);post.position.y=.43;g.add(post);
    const stripe=this.box(.13,.10,.11,this.mats.signRed);stripe.position.set(0,.65,0);g.add(stripe);
    const cap=this.box(.18,.20,.08,this.mats.signRed);cap.position.set(0,.80,0);g.add(cap);
    const reflector=this.box(.12,.08,.02,this.mats.laneWhite);reflector.position.set(0,.65,.055);g.add(reflector);
    g.userData={label:'roadside post',modelQuality:'premium-procedural'};return g;
  }
  parkingMeter(){
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.16,.20,.08,12),this.mats.dark);base.position.y=.04;g.add(base);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,1.12,10),this.mats.chrome);post.position.y=.60;g.add(post);
    const head=this.vehicleBox(.28,.34,.20,this.mats.sign,.06);head.position.set(0,1.25,0);g.add(head);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.16,.12),new THREE.MeshBasicMaterial({color:0x42f58c}));face.position.set(0,1.27,-.106);g.add(face);
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.012,12),this.mats.yellow);coin.rotation.x=Math.PI/2;coin.position.set(0,1.18,-.111);g.add(coin);
    g.userData={label:'parking meter',modelQuality:'premium-procedural'};return g;
  }
  bikeRack(){
    const g=new THREE.Group();const metal=this.mats.chrome;
    const base=this.box(1.55,.06,.30,this.mats.dark);base.position.y=.03;g.add(base);
    for(const x of [-.58,0,.58]){
      const hoop=new THREE.Mesh(new THREE.TorusGeometry(.34,.035,6,16,Math.PI),metal);hoop.rotation.x=Math.PI/2;hoop.position.set(x,.40,0);g.add(hoop);
    }
    g.userData={label:'bike rack',modelQuality:'premium-procedural'};return g;
  }
  trafficCamera(){
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.17,.22,.08,12),this.mats.dark);base.position.y=.04;g.add(base);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,3.35,10),this.mats.pole);pole.position.y=1.72;g.add(pole);
    const arm=this.box(1.05,.06,.06,this.mats.pole);arm.position.set(.46,3.28,0);g.add(arm);
    const housing=this.vehicleBox(.34,.24,.28,this.mats.dark,.07);housing.position.set(.93,3.16,0);g.add(housing);
    const lens=new THREE.Mesh(new THREE.SphereGeometry(.065,12,10),this.mats.lampGlow);lens.position.set(1.08,3.14,-.15);g.add(lens);
    const status=this.box(.05,.05,.05,this.mats.red);status.position.set(.92,3.27,-.15);g.add(status);
    g.userData={label:'traffic camera',modelQuality:'premium-procedural'};return g;
  }
  mailbox(){
    const g=new THREE.Group();const blue=new THREE.MeshStandardMaterial({color:0x315b84,roughness:.64,metalness:.18});
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.085,1.08,10),this.mats.wood);post.position.y=.54;g.add(post);
    const body=this.vehicleBox(.48,.36,.72,blue,.12);body.position.set(0,1.10,0);g.add(body);
    const door=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.025,16,1,false,0,Math.PI),blue);door.rotation.y=Math.PI/2;door.position.set(0,1.10,.37);g.add(door);
    const flagPole=this.box(.035,.38,.035,this.mats.signRed);flagPole.position.set(.28,1.13,.04);g.add(flagPole);
    const flag=this.box(.18,.045,.035,this.mats.signRed);flag.position.set(.28,1.31,.04);g.add(flag);
    g.userData={label:'mailbox',modelQuality:'premium-procedural'};return g;
  }
  utilityBox(){
    const g=new THREE.Group();const boxMat=new THREE.MeshStandardMaterial({color:0x68746a,roughness:.86,metalness:.08});
    const body=this.vehicleBox(.72,.78,.42,boxMat,.08);body.position.y=.39;g.add(body);
    const lid=this.box(.64,.035,.34,this.mats.dark);lid.position.set(0,.80,0);g.add(lid);
    for(const y of [.36,.46,.56]){const vent=this.box(.34,.025,.02,this.mats.dark);vent.position.set(0,y,-.222);g.add(vent);}
    const warning=this.box(.22,.18,.025,this.mats.signRed);warning.position.set(0,.65,-.224);g.add(warning);
    g.userData={label:'utility box',modelQuality:'premium-procedural'};return g;
  }
  evCharger(){
    const g=new THREE.Group();
    const base=this.box(.72,.06,.52,this.mats.dark);base.position.y=.03;g.add(base);
    const body=this.vehicleBox(.36,1.02,.24,this.mats.dark,.07);body.position.set(0,.58,0);g.add(body);
    const face=this.box(.25,.42,.035,this.mats.glass);face.position.set(0,1.02,-.14);g.add(face);
    const faceText=new THREE.Mesh(new THREE.PlaneGeometry(.21,.30),new THREE.MeshBasicMaterial({map:this.signTexture('EV','#42f58c','#102029','panel'),transparent:true,side:THREE.DoubleSide}));faceText.position.set(0,1.02,-.162);g.add(faceText);
    const cableMat=new THREE.MeshStandardMaterial({color:0x202a35,roughness:.78,metalness:.08});
    const cable=new THREE.Mesh(new THREE.TorusGeometry(.34,.018,6,22,Math.PI*1.28),cableMat);cable.rotation.x=Math.PI/2;cable.position.set(.22,.45,.02);g.add(cable);
    const handle=this.vehicleBox(.10,.22,.12,this.mats.green,.03);handle.position.set(.50,.42,.02);g.add(handle);
    const status=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),this.mats.lampGlow);status.position.set(0,1.31,-.14);g.add(status);
    g.userData={label:'EV charger',modelQuality:'premium-procedural',worldInteraction:'charging'};return g;
  }
  streetSign(){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.075,2.9,10),this.mats.pole);pole.position.y=1.45;g.add(pole);
    const arm=this.box(1.35,.06,.06,this.mats.pole);arm.position.set(.54,2.48,0);g.add(arm);
    const board=this.vehicleBox(1.52,.38,.08,this.mats.sign,.04);board.position.set(.96,2.48,0);g.add(board);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.30,.25),new THREE.MeshBasicMaterial({map:this.signTexture('MAIN ST','#1f6b48','#ffffff','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(.96,2.48,-.052);g.add(face);
    g.userData={label:'street sign',modelQuality:'premium-procedural'};return g;
  }
  billboard(){
    const g=new THREE.Group();
    const boardMat=new THREE.MeshStandardMaterial({color:0x24364a,roughness:.62,metalness:.08});
    for(const x of [-1.42,1.42]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.075,.11,3.15,10),this.mats.pole);post.position.set(x,1.58,0);g.add(post);}
    const board=this.box(3.32,1.52,.16,boardMat);board.position.y=3.05;g.add(board);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(3.02,1.20),new THREE.MeshBasicMaterial({map:this.signTexture('DRIVE SAFE','#24364a','#42f58c','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,3.05,-.092);g.add(face);
    const cap=this.box(3.50,.08,.20,this.mats.chrome);cap.position.y=3.84;g.add(cap);
    g.userData={label:'roadside billboard',modelQuality:'premium-procedural'};return g;
  }
  waterTower(){
    const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x788b91,roughness:.48,metalness:.58});
    const tankMat=new THREE.MeshStandardMaterial({color:0x4f7885,roughness:.42,metalness:.28,emissive:0x092b34,emissiveIntensity:.08});
    const trim=new THREE.MeshStandardMaterial({color:0xc6d2d2,roughness:.34,metalness:.64});
    const signMat=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.44,metalness:.08,emissive:0x3d2704,emissiveIntensity:.10});
    const beaconMat=new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.92});
    const tank=new THREE.Mesh(new THREE.SphereGeometry(4.05,24,14),tankMat);tank.scale.y=.56;tank.position.y=8.15;tank.castShadow=true;g.add(tank);
    const tankBand=new THREE.Mesh(new THREE.TorusGeometry(3.92,.14,8,32),trim);tankBand.rotation.x=Math.PI/2;tankBand.position.y=8.15;g.add(tankBand);
    const collar=new THREE.Mesh(new THREE.CylinderGeometry(1.10,1.42,.48,20),trim);collar.position.y=6.35;g.add(collar);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(4.12,1.02,24),trim);roof.position.y=10.05;g.add(roof);
    for(const [x,z] of [[-2.55,-2.25],[2.55,-2.25],[-2.55,2.25],[2.55,2.25]]){
      const leg=this.box(.22,6.2,.22,steel);leg.position.set(x,3.12,z);g.add(leg);
      const foot=this.box(.62,.16,.62,trim);foot.position.set(x,.08,z);g.add(foot);
    }
    const platform=new THREE.Mesh(new THREE.TorusGeometry(3.10,.10,8,32),trim);platform.rotation.x=Math.PI/2;platform.position.y=6.38;g.add(platform);
    for(const z of [-2.25,2.25]){const brace=this.box(.12,6.0,.12,steel);brace.position.set(0,3.15,z);brace.rotation.z=.54;g.add(brace);}
    for(const x of [-2.55,2.55]){const brace=this.box(.12,6.0,.12,steel);brace.position.set(x,3.15,0);brace.rotation.x=.54;g.add(brace);}
    const ladderRailA=this.box(.08,5.8,.08,trim);ladderRailA.position.set(-3.34,3.55,-2.02);g.add(ladderRailA);
    const ladderRailB=this.box(.08,5.8,.08,trim);ladderRailB.position.set(-3.08,3.55,-2.02);g.add(ladderRailB);
    for(let y=1.0;y<6.2;y+=.62){const rung=this.box(.34,.06,.06,trim);rung.position.set(-3.21,y,-2.02);g.add(rung);}
    const sign=this.box(2.10,.64,.08,signMat);sign.position.set(0,7.95,-3.72);g.add(sign);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.78,.34),new THREE.MeshBasicMaterial({map:this.signTexture('WATER','#f0bd2d','#1c2a31','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,7.95,-3.77);g.add(face);
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),beaconMat);beacon.position.set(0,10.62,0);beacon.userData.waterTowerBeacon=true;g.add(beacon);
    g.userData={label:'rural water tower',modelQuality:'premium-procedural',worldInteraction:'rural-landmark',waterTowerBeacon:beacon};
    return g;
  }
  windTurbine(){
    const g=new THREE.Group();
    const concrete=new THREE.MeshStandardMaterial({color:0x89939a,roughness:.86,metalness:.05});
    const steel=new THREE.MeshStandardMaterial({color:0xb9c5cb,roughness:.32,metalness:.78});
    const darkSteel=new THREE.MeshStandardMaterial({color:0x46545e,roughness:.48,metalness:.72});
    const bladeMat=new THREE.MeshStandardMaterial({color:0xe9f2f5,roughness:.26,metalness:.30});
    const warningMat=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.42,metalness:.12,emissive:0x3d2704,emissiveIntensity:.08});
    const beaconMat=new THREE.MeshBasicMaterial({color:0xff5c7a,transparent:true,opacity:.86});
    const foundation=new THREE.Mesh(new THREE.CylinderGeometry(1.72,1.92,.20,24),concrete);foundation.position.y=.10;foundation.castShadow=true;g.add(foundation);
    const baseRing=new THREE.Mesh(new THREE.TorusGeometry(1.50,.10,8,28),steel);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.24;g.add(baseRing);
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(.38,.86,14.0,18),steel);tower.position.y=7.22;tower.castShadow=true;g.add(tower);
    for(const y of [3.8,7.1,10.4]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.62-(y-3.8)*.035,.055,7,22),darkSteel);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring);}
    const accessDoor=this.box(.30,.92,.06,darkSteel);accessDoor.position.set(0,1.14,-.84);g.add(accessDoor);
    const serviceBox=this.vehicleBox(.64,.52,.48,darkSteel,.08);serviceBox.position.set(1.14,.46,.18);g.add(serviceBox);
    const sign=this.box(1.82,.48,.07,warningMat);sign.position.set(0,2.35,-.88);g.add(sign);
    const signFace=new THREE.Mesh(new THREE.PlaneGeometry(1.48,.25),new THREE.MeshBasicMaterial({map:this.signTexture('WIND FARM','#f0bd2d','#1c2a31','panel'),transparent:true,side:THREE.DoubleSide}));signFace.position.set(0,2.35,-.925);g.add(signFace);
    const nacelle=this.vehicleBox(1.15,.62,2.05,darkSteel,.16);nacelle.position.set(0,14.25,-.12);nacelle.castShadow=true;g.add(nacelle);
    const tail=this.box(.62,.34,.92,steel);tail.position.set(0,14.36,-1.52);tail.rotation.x=-.12;g.add(tail);
    const rotor=new THREE.Group();rotor.position.set(0,14.35,1.00);g.add(rotor);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),steel);hub.position.z=.02;hub.castShadow=true;rotor.add(hub);
    const blades=[];
    for(let i=0;i<3;i++){
      const blade=this.vehicleBox(.24,3.45,.16,bladeMat,.08);blade.position.y=1.82;blade.rotation.z=i*Math.PI*2/3;blade.castShadow=true;rotor.add(blade);blades.push(blade);
    }
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),beaconMat);beacon.position.set(0,15.12,-.12);beacon.userData.windTurbineBeacon=true;g.add(beacon);
    g.userData={label:'wind turbine',modelQuality:'premium-procedural',worldInteraction:'renewable-landmark',windTurbineRotor:rotor,windTurbineBlades:blades,windTurbineBeacon:beacon};
    return g;
  }
  railCrossing(style='rural'){
    const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x59636b,roughness:.48,metalness:.72});
    const railMat=new THREE.MeshStandardMaterial({color:0x9aa4aa,roughness:.28,metalness:.84});
    const timber=new THREE.MeshStandardMaterial({color:0x4f3b2c,roughness:.92,metalness:.03});
    const signMat=new THREE.MeshStandardMaterial({color:0xf0bd2d,roughness:.44,metalness:.08});
    const railLamps=[];
    const railGates=[];
    for(const z of [-1.15,1.15]){
      const rail=this.box(19.5,.13,.18,railMat);rail.position.set(0,.12,z);g.add(rail);
      for(let x=-8.5;x<=8.5;x+=2.15){const sleeper=this.box(.46,.10,3.3,timber);sleeper.position.set(x,.055,0);g.add(sleeper);}
    }
    const ballast=this.box(19.7,.08,3.55,new THREE.MeshStandardMaterial({color:0x45494a,roughness:.96,metalness:.05}));ballast.position.y=.045;g.add(ballast);
    for(const side of [-1,1]){
      const post=this.box(.24,3.15,.24,steel);post.position.set(side*7.55,1.58,0);post.castShadow=true;g.add(post);
      const foot=this.box(.58,.16,.58,this.mats.concrete);foot.position.set(side*7.55,.08,0);g.add(foot);
      const gate=new THREE.Group();gate.position.set(side*7.55,1.62,0);
      const arm=this.box(7.0,.14,.16,this.mats.signRed);arm.position.x=-side*3.5;gate.add(arm);
      for(const offset of [1.1,3.5,5.9]){const stripe=this.box(.26,.18,.19,this.mats.sign);stripe.position.set(-side*offset,.02,.09);gate.add(stripe);}
      gate.userData.railGateSide=side;railGates.push(gate);g.add(gate);
      for(const x of [side*7.16,side*6.78]){
        const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),new THREE.MeshBasicMaterial({color:0xff4a45,transparent:true,opacity:.18}));lamp.position.set(x,2.58,-.16);lamp.userData.railLamp=true;railLamps.push(lamp);g.add(lamp);
      }
      const bell=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.18,14),this.mats.dark);bell.rotation.z=Math.PI/2;bell.position.set(side*7.46,3.22,0);g.add(bell);
      for(const approach of [-1,1]){
        const signPost=this.box(.12,2.65,.12,steel);signPost.position.set(side*7.05,1.34,approach*2.25);g.add(signPost);
        const armA=this.box(1.70,.16,.10,signMat);armA.position.set(side*7.05,2.74,approach*2.25);armA.rotation.z=.58;g.add(armA);
        const armB=this.box(1.70,.16,.10,signMat);armB.position.set(side*7.05,2.74,approach*2.25);armB.rotation.z=-.58;g.add(armB);
        const plate=this.box(1.26,.34,.07,signMat);plate.position.set(side*7.05,3.48,approach*2.25);g.add(plate);
      }
    }
    const centerSign=new THREE.Mesh(new THREE.PlaneGeometry(3.3,.30),new THREE.MeshBasicMaterial({map:this.signTexture(style==='suburb'?'RAIL CROSSING':'RAIL XING','#f0bd2d','#20272b','panel'),transparent:true,side:THREE.DoubleSide}));centerSign.position.set(0,1.02,-1.82);g.add(centerSign);
    g.userData={label:'rail crossing',modelQuality:'premium-procedural',worldInteraction:'rail-crossing',railStyle:style,railLamps,railGates};
    return g;
  }
  highwayGantry(){
    const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x9aa7b3,roughness:.56,metalness:.62});
    const green=new THREE.MeshStandardMaterial({color:0x1f6b48,roughness:.56,metalness:.10});
    const signSpecs=[[-2.15,3.55,'I-95 EAST'],[1.55,3.10,'CITY EXIT']];
    for(const x of [-4.85,4.85]){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,6.5,10),steel);pole.position.set(x,3.25,0);pole.castShadow=true;g.add(pole);
      const foot=this.box(.46,.16,.46,this.mats.concrete);foot.position.set(x,.08,0);g.add(foot);
    }
    const cross=this.box(10.0,.16,.16,steel);cross.position.set(0,5.95,0);g.add(cross);
    for(const [x,w,label] of signSpecs){
      const board=this.vehicleBox(w,1.15,.14,green,.04);board.position.set(x,5.28,-.02);g.add(board);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(w-.30,.82),new THREE.MeshBasicMaterial({map:this.signTexture(label,'#1f6b48','#ffffff','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(x,5.28,-.105);g.add(face);
      const trim=this.box(w+.10,.06,.18,this.mats.chrome);trim.position.set(x,5.89,.02);g.add(trim);
    }
    for(const x of [-3.15,0,3.15]){
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),this.mats.lampGlow);lamp.position.set(x,6.08,-.12);g.add(lamp);
    }
    g.userData={label:'highway directional gantry',modelQuality:'premium-procedural',worldInteraction:'directional-signage'};return g;
  }
  guardrailSegment(style='highway'){
    const highway=style==='highway';
    const metal=new THREE.MeshStandardMaterial({color:highway?0x8d99a6:0x66735d,roughness:.42,metalness:highway?.72:.28});
    const dark=new THREE.MeshStandardMaterial({color:highway?0x3d4650:0x3e4937,roughness:.72,metalness:.18});
    const reflectorMat=new THREE.MeshStandardMaterial({color:highway?0xffd166:0xffb347,roughness:.24,metalness:.12,emissive:highway?0x4d3500:0x4a2200,emissiveIntensity:.28});
    const g=new THREE.Group();
    const beam=this.vehicleBox(.14,.52,23.2,metal,.045);beam.position.set(0,.86,0);g.add(beam);
    const lower=this.box(.10,.16,23.2,dark);lower.position.set(0,.48,0);g.add(lower);
    for(const z of [-10.2,-4.1,2.0,8.1]){
      const post=this.box(.13,.92,.13,metal);post.position.set(0,.48,z);g.add(post);
      const foot=this.vehicleBox(.40,.07,.34,dark,.025);foot.position.set(0,.055,z);g.add(foot);
    }
    const reflectors=[];
    for(const z of [-9.0,-3.0,3.0,9.0]){
      const reflector=this.box(.045,.16,.28,reflectorMat);reflector.position.set(.085,.88,z);g.add(reflector);reflectors.push(reflector);
    }
    g.userData={label:'guardrail segment',modelQuality:'premium-procedural',worldInteraction:'roadside-barrier',guardrailStyle:style,reflectors};
    return g;
  }
  serviceStation(){
    const g=new THREE.Group();
    const canopyMat=new THREE.MeshStandardMaterial({color:0x24364a,roughness:.42,metalness:.18});
    const accentMat=new THREE.MeshStandardMaterial({color:0x42f58c,roughness:.34,metalness:.08,emissive:0x0b5a42,emissiveIntensity:.24});
    const fuelMat=new THREE.MeshStandardMaterial({color:0xffb12a,roughness:.44,metalness:.08});
    const pad=this.box(13.8,.08,18.8,this.mats.concrete);pad.position.y=.04;g.add(pad);
    const store=this.vehicleBox(9.6,3.7,5.2,this.mats.facade,.12);store.position.set(0,1.85,-6.0);g.add(store);
    const storeGlass=this.box(7.8,1.42,.07,this.mats.windowLit);storeGlass.position.set(0,1.38,-3.34);g.add(storeGlass);
    const door=this.box(1.02,1.88,.08,this.mats.dark);door.position.set(-3.1,1.06,-3.38);g.add(door);
    const storeBand=this.box(8.8,.28,.10,accentMat);storeBand.position.set(0,2.62,-3.39);g.add(storeBand);
    const canopy=this.vehicleBox(12.2,.24,7.3,canopyMat,.08);canopy.position.set(0,3.62,.10);g.add(canopy);
    const canopyBand=this.box(11.8,.32,.12,accentMat);canopyBand.position.set(0,3.43,3.67);g.add(canopyBand);
    for(const x of [-5.15,5.15])for(const z of [-2.65,2.65]){
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,3.52,10),this.mats.chrome);post.position.set(x,1.78,z);g.add(post);
    }
    for(const x of [-3.45,-1.15,1.15,3.45]){
      const pump=this.vehicleBox(.72,1.18,.92,this.mats.dark,.06);pump.position.set(x,.64,.35);g.add(pump);
      const face=this.box(.52,.46,.035,this.mats.glass);face.position.set(x,1.00,-.12);g.add(face);
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(.42,.22),new THREE.MeshBasicMaterial({map:this.signTexture('FUEL','#102029','#42f58c','panel'),transparent:true,side:THREE.DoubleSide}));screen.position.set(x,1.02,-.145);g.add(screen);
      const hose=new THREE.Mesh(new THREE.TorusGeometry(.25,.018,6,18,Math.PI*1.35),this.mats.dark);hose.rotation.x=Math.PI/2;hose.position.set(x+.27,.60,.05);g.add(hose);
      const nozzle=this.box(.10,.26,.12,fuelMat);nozzle.position.set(x+.49,.55,.07);g.add(nozzle);
    }
    const pylonPole=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,4.3,10),this.mats.pole);pylonPole.position.set(7.15,2.15,-5.2);g.add(pylonPole);
    const pylon=this.vehicleBox(1.72,1.84,.24,canopyMat,.08);pylon.position.set(7.15,4.34,-5.2);g.add(pylon);
    const pylonFace=new THREE.Mesh(new THREE.PlaneGeometry(1.40,1.46),new THREE.MeshBasicMaterial({map:this.signTexture('$3.49','#102029','#ffd166','panel'),transparent:true,side:THREE.DoubleSide}));pylonFace.position.set(7.15,4.34,-5.34);g.add(pylonFace);
    const logo=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.42),new THREE.MeshBasicMaterial({map:this.signTexture('SERVICE','#24364a','#42f58c','panel'),transparent:true,side:THREE.DoubleSide}));logo.position.set(0,2.98,-3.40);g.add(logo);
    g.userData={label:'fuel service station',modelQuality:'premium-procedural',worldInteraction:'refuel'};return g;
  }
  bridgeOverpass(){
    const g=new THREE.Group();
    const deckMat=new THREE.MeshStandardMaterial({color:0x53616b,roughness:.76,metalness:.22});
    const barrierMat=new THREE.MeshStandardMaterial({color:0x9aa7b3,roughness:.58,metalness:.55});
    const accentMat=new THREE.MeshStandardMaterial({color:0x42f58c,roughness:.38,metalness:.18,emissive:0x0b5a42,emissiveIntensity:.16});
    const deck=this.box(34,.48,8.6,deckMat);deck.position.y=6.25;g.add(deck);
    for(const z of [-3.84,3.84]){
      const barrier=this.box(33.5,.72,.18,barrierMat);barrier.position.set(0,6.82,z);g.add(barrier);
      for(let x=-15;x<=15;x+=3){const post=this.box(.08,.72,.22,barrierMat);post.position.set(x,7.18,z);g.add(post);}
    }
    for(const z of [-2.95,2.95]){const beam=this.box(32.6,.30,.32,deckMat);beam.position.set(0,5.86,z);g.add(beam);}
    for(const x of [-14,14]){
      const pier=this.box(1.0,5.9,1.0,deckMat);pier.position.set(x,2.95,0);g.add(pier);
      const foot=this.box(2.0,.34,2.0,this.mats.concrete);foot.position.set(x,.17,0);g.add(foot);
      const marker=this.box(.16,3.8,.12,accentMat);marker.position.set(x>0?x-.54:x+.54,3.15,-.53);g.add(marker);
    }
    const sign=this.box(5.6,.62,.10,accentMat);sign.position.set(0,7.35,-3.96);g.add(sign);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(4.9,.34),new THREE.MeshBasicMaterial({map:this.signTexture('OVERPASS','#42f58c','#102029','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,7.35,-4.02);g.add(face);
    g.userData={label:'highway overpass',modelQuality:'premium-procedural',worldInteraction:'grade-separated-crossing'};return g;
  }
  tunnelPortal(style='highway'){
    const highway=style==='highway';
    const span=highway?24.8:18.2;
    const concrete=new THREE.MeshStandardMaterial({color:highway?0x56636d:0x5e6258,roughness:.82,metalness:.14});
    const trim=new THREE.MeshStandardMaterial({color:highway?0x9aa7b3:0x7e806e,roughness:.62,metalness:highway?.46:.18});
    const dark=new THREE.MeshStandardMaterial({color:highway?0x101820:0x1b211c,roughness:.96,metalness:.03});
    const warning=new THREE.MeshStandardMaterial({color:highway?0xffb347:0xff7a36,roughness:.42,metalness:.10,emissive:0x512200,emissiveIntensity:.18});
    const g=new THREE.Group();
    const sideX=span*.5+1.45;
    for(const side of [-1,1]){
      const wing=this.vehicleBox(2.9,5.6,2.35,concrete,.18);wing.position.set(side*sideX,2.8,0);g.add(wing);
      const cap=this.box(3.18,.24,2.58,trim);cap.position.set(side*sideX,5.66,0);g.add(cap);
      for(const z of [-.72,.72]){
        const rib=this.box(.18,5.0,.18,trim);rib.position.set(side*(span*.5+.22),2.55,z);g.add(rib);
      }
      const reflector=this.box(.10,.30,.06,warning);reflector.position.set(side*(span*.5+.06),3.05,-1.20);g.add(reflector);
    }
    const header=this.vehicleBox(span+3.0,1.28,2.35,concrete,.22);header.position.set(0,5.78,0);g.add(header);
    const headerTrim=this.box(span+2.7,.14,2.52,trim);headerTrim.position.set(0,5.16,-.02);g.add(headerTrim);
    const soffit=this.box(span,.22,1.72,dark);soffit.position.set(0,5.18,.34);g.add(soffit);
    const portalBand=this.box(span*.72,.38,.08,warning);portalBand.position.set(0,6.52,-1.20);g.add(portalBand);
    const portalFace=new THREE.Mesh(new THREE.PlaneGeometry(span*.62,.22),new THREE.MeshBasicMaterial({map:this.signTexture(highway?'TUNNEL AHEAD':'ROAD TUNNEL',highway?'#ffb347':'#ff7a36','#17202b','panel'),transparent:true,side:THREE.DoubleSide}));portalFace.position.set(0,6.52,-1.25);g.add(portalFace);
    const tunnelLights=[];
    for(const x of [-span*.34,-span*.11,span*.11,span*.34]){
      const light=new THREE.Mesh(new THREE.BoxGeometry(.30,.06,.20),new THREE.MeshBasicMaterial({color:0xfff1b0,transparent:true,opacity:.82}));
      light.position.set(x,5.02,.24);light.userData.tunnelLight=true;tunnelLights.push(light);g.add(light);
    }
    const laneMarker=new THREE.Mesh(new THREE.BoxGeometry(.12,.04,1.42),warning);laneMarker.position.set(0,.08,-1.42);g.add(laneMarker);
    g.userData={label:'tunnel portal',modelQuality:'premium-procedural',worldInteraction:'tunnel-entrance',tunnelStyle:style,tunnelLights};
    return g;
  }
  constructionBarricade(){
    const g=new THREE.Group();
    const warningLights=[];
    for(const x of [-.85,.85]){
      const foot=this.box(.46,.10,.34,this.mats.dark);foot.position.set(x,.05,0);g.add(foot);
      const leg=this.box(.12,.82,.12,this.mats.dark);leg.position.set(x,.41,0);g.add(leg);
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),new THREE.MeshBasicMaterial({color:0xffc24b,transparent:true,opacity:.95}));lamp.position.set(x,.91,-.07);lamp.userData.warningLamp=true;warningLights.push(lamp);g.add(lamp);
    }
    const bar=this.box(2.0,.42,.10,this.mats.cone);bar.position.y=1.02;g.add(bar);
    for(const x of [-.52,0,.52]){const stripe=this.box(.18,.46,.12,this.mats.sign);stripe.position.set(x,1.02,.06);stripe.rotation.z=.52;g.add(stripe);}
    const placard=this.box(.72,.16,.06,this.mats.signRed);placard.position.set(0,1.30,.02);g.add(placard);
    g.userData={label:'construction barricade',modelQuality:'premium-procedural',warningLights,worldInteraction:'roadwork'};return g;
  }
  streetLight(){
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.20,.24,.10,12),this.mats.dark);base.position.y=.05;g.add(base);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.075,4.6,12),this.mats.pole); pole.position.y=2.3; pole.castShadow=true; g.add(pole);
    const arm=this.box(1.1,.09,.09,this.mats.pole); arm.position.set(.42,4.35,0); g.add(arm);
    const head=this.box(.42,.20,.30,this.mats.dark); head.position.set(.95,4.25,0); g.add(head);
    const lens=this.box(.27,.05,.18,this.mats.lampGlow);lens.position.set(.98,4.10,0);g.add(lens);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.12,12,12),this.mats.lampGlow); glow.position.set(.98,4.06,0); g.add(glow);
    g.userData={label:'street light',modelQuality:'premium-procedural'};
    return g;
  }
  trafficLight(){
    const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.13,5.2,14),this.mats.pole);pole.position.y=2.6;pole.castShadow=true;g.add(pole);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.12,14),this.mats.dark);base.position.y=.06;g.add(base);
    const arm=this.box(3.2,.14,.14,this.mats.pole);arm.position.set(-1.4,5.1,0);g.add(arm);
    const brace=this.box(.10,1.12,.10,this.mats.pole);brace.position.set(-2.82,4.58,0);brace.rotation.z=-.34;g.add(brace);
    const ringMat=new THREE.MeshStandardMaterial({color:0x05070a,roughness:.42,metalness:.25});
    const lamps={},secondaryLamps={};
    const addHead=(x,scale,target)=>{
      const housing=this.box(.78*scale,1.86*scale,.44,this.mats.dark);housing.position.set(x,4.85,0);g.add(housing);
      const face=this.box(.64*scale,1.68*scale,.05,this.mats.dark);face.position.set(x,4.85,-.245);g.add(face);
      for(const [name,offset,col] of [['red',.50,0xff5c7a],['yellow',0,0xffd166],['green',-.50,0x42f58c]]){
        const y=4.85+offset*scale;
        const visor=this.box(.42*scale,.08*scale,.16,this.mats.dark);visor.position.set(x,y+.205*scale,-.29);g.add(visor);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.225*scale,.035*scale,8,20),ringMat);ring.position.set(x,y,-.29);g.add(ring);
        const s=new THREE.Mesh(new THREE.SphereGeometry(.18*scale,18,18),new THREE.MeshBasicMaterial({color:col}));s.position.set(x,y,-.30);s.userData.baseColor=col;g.add(s);target[name]=s;
      }
      const servicePlate=this.box(.34*scale,.16*scale,.035,this.mats.chrome);servicePlate.position.set(x,3.88,-.235);g.add(servicePlate);
    };
    addHead(-3.0,1,lamps);
    addHead(-1.95,.82,secondaryLamps);
    const rearPlate=this.box(.64,1.68,.05,this.mats.dark);rearPlate.position.set(-3.0,4.85,.245);g.add(rearPlate);
    g.userData={lamps,secondaryLamps,signalHeads:2,label:'traffic light',modelQuality:'premium-procedural'};return g;
  }
  stopSign(){
    const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,2.6,12),this.mats.pole);pole.position.y=1.3;g.add(pole);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.09,8),this.mats.signRed);base.rotation.x=Math.PI/2;base.position.y=2.75;g.add(base);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.10,1.10),new THREE.MeshBasicMaterial({map:this.signTexture('STOP','#d82032','#ffffff','octagon'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,2.75,-.061);g.add(face);
    g.userData={label:'stop sign',modelQuality:'premium-procedural'};return g;
  }
  yieldSign(){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,2.55,12),this.mats.pole);pole.position.y=1.28;g.add(pole);
    const red=new THREE.Mesh(new THREE.ShapeGeometry(this.triangleShape(.72)),this.mats.signRed);red.position.set(0,2.48,0);g.add(red);
    const white=new THREE.Mesh(new THREE.ShapeGeometry(this.triangleShape(.53)),this.mats.sign);white.position.set(0,2.48,.012);g.add(white);
    g.userData={label:'yield sign',modelQuality:'premium-procedural'};return g;
  }
  triangleShape(size){const shape=new THREE.Shape();shape.moveTo(-size,-size*.70);shape.lineTo(size,-size*.70);shape.lineTo(0,size*.86);shape.closePath();return shape;}
  speedSign(limit){
    const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,2.5,12),this.mats.pole);pole.position.y=1.25;g.add(pole);
    const sign=this.box(1.05,1.35,.08,this.mats.sign);sign.position.y=2.75;g.add(sign);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.90,1.18),new THREE.MeshBasicMaterial({map:this.signTexture(String(limit||35),'#f4f7fb','#141a24','speed'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,2.75,-.051);g.add(face);
    g.userData={limit:limit,label:'speed limit sign',modelQuality:'premium-procedural'};return g;
  }
  crosswalkSign(){
    const g=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.075,2.45,10),this.mats.pole);pole.position.y=1.22;g.add(pole);
    const board=this.box(.88,.88,.07,this.mats.yellow);board.position.set(0,2.28,0);board.rotation.z=Math.PI/4;g.add(board);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.63,.63),new THREE.MeshBasicMaterial({map:this.signTexture('XING','#f7d363','#17202b','panel'),transparent:true,side:THREE.DoubleSide}));face.position.set(0,2.28,-.052);face.rotation.z=Math.PI/4;g.add(face);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),this.mats.pole);cap.position.y=2.77;g.add(cap);
    g.userData={label:'crosswalk sign',modelQuality:'premium-procedural'};return g;
  }
  pedestrianSignal(){
    const g=new THREE.Group();
    const housingMat=new THREE.MeshStandardMaterial({color:0x17202b,roughness:.48,metalness:.22});
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,2.72,10),this.mats.pole);pole.position.y=1.36;g.add(pole);
    const arm=this.box(.55,.07,.07,this.mats.pole);arm.position.set(.20,2.53,0);g.add(arm);
    const housing=this.vehicleBox(.44,.86,.28,housingMat,.06);housing.position.set(.48,2.20,0);g.add(housing);
    const stopLamp=new THREE.Mesh(new THREE.CircleGeometry(.115,14),new THREE.MeshBasicMaterial({color:0xff4e68,transparent:true,opacity:.88,side:THREE.DoubleSide}));stopLamp.position.set(.48,2.42,-.147);g.add(stopLamp);
    const walkLamp=new THREE.Mesh(new THREE.CircleGeometry(.115,14),new THREE.MeshBasicMaterial({color:0x42f58c,transparent:true,opacity:.10,side:THREE.DoubleSide}));walkLamp.position.set(.48,2.08,-.147);g.add(walkLamp);
    const visorTop=this.box(.28,.06,.08,this.mats.dark);visorTop.position.set(.48,2.57,-.17);g.add(visorTop);
    const visorBottom=this.box(.28,.06,.08,this.mats.dark);visorBottom.position.set(.48,1.91,-.17);g.add(visorBottom);
    const buttonHousing=this.vehicleBox(.18,.28,.12,this.mats.dark,.04);buttonHousing.position.set(.10,1.34,-.10);g.add(buttonHousing);
    const button=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.02,12),this.mats.yellow);button.rotation.x=Math.PI/2;button.position.set(.10,1.39,-.17);g.add(button);
    const speaker=this.box(.10,.08,.04,this.mats.chrome);speaker.position.set(.10,1.26,-.17);g.add(speaker);
    g.userData={label:'pedestrian signal',modelQuality:'premium-procedural',worldInteraction:'pedestrian-signal',stopLamp,walkLamp};return g;
  }
  suv(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car;
    const body=this.vehicleBox(2.16,.88,4.62,mat,.16);body.position.y=.72;g.add(body);
    const upper=this.vehicleBox(2.00,.32,4.20,mat,.10);upper.position.y=1.22;g.add(upper);
    const cabin=this.vehicleBox(1.52,.64,2.42,this.mats.dark,.14);cabin.position.set(0,1.48,.02);g.add(cabin);
    const ws=this.box(1.44,.56,.10,this.mats.glass);ws.position.set(0,1.44,.96);ws.rotation.x=.28;g.add(ws);
    const rw=this.box(1.40,.50,.10,this.mats.glass);rw.position.set(0,1.42,-1.02);rw.rotation.x=-.28;g.add(rw);
    for(const x of [-1.00,1.00]){const sw=this.box(.10,.48,1.90,this.mats.glass);sw.position.set(x,1.48,.02);g.add(sw);}
    const fb=this.box(2.12,.28,.18,this.mats.dark);fb.position.set(0,.40,2.42);g.add(fb);
    const rb=this.box(2.12,.28,.18,this.mats.dark);rb.position.set(0,.40,-2.42);g.add(rb);
    for(const x of [-.68,.68]){const hl=this.box(.36,.16,.10,this.mats.headlight);hl.position.set(x,.82,2.40);g.add(hl);}
    for(const x of [-.74,.74]){const tl=this.box(.32,.14,.10,this.mats.taillight);tl.position.set(x,.82,-2.40);g.add(tl);}
    for(const x of [-.80,.80]){const rail=this.box(.06,.08,3.20,this.mats.chrome);rail.position.set(x,1.82,0);g.add(rail);}
    for(const x of [-1.14,1.14]){const m=this.box(.10,.14,.22,this.mats.dark);m.position.set(x,1.18,.80);g.add(m);}
    for(const x of [-1.12,1.12])for(const z of [-1.62,1.62]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.28,18),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.34,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.30,10),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.34,z);g.add(r);
    }
    const brake=this.box(1.58,.08,.07,this.mats.red);brake.position.set(0,.88,2.40);g.add(brake);
    g.userData={cameraHeight:1.44,cameraZ:2.0,label:'SUV'};this.addTurnSignals(g,2.24,4.62,.86);return this.premiumVehicleDetail(g,'suv');
  }
  crossover(colorMat){
    const g=this.suv(colorMat);
    g.scale.set(.97,.94,.98);
    const cladding=new THREE.MeshStandardMaterial({color:0x202b35,roughness:.76,metalness:.04});
    const sill=this.vehicleBox(2.18,.16,3.52,cladding,.07);sill.position.set(0,.48,-.04);g.add(sill);
    const skid=this.vehicleBox(1.86,.13,.34,this.mats.chrome,.05);skid.position.set(0,.44,2.32);g.add(skid);
    const rearSkid=this.vehicleBox(1.82,.13,.28,cladding,.05);rearSkid.position.set(0,.44,-2.30);g.add(rearSkid);
    for(const x of [-1.06,1.06]){
      const arch=new THREE.Mesh(new THREE.TorusGeometry(.365,.045,6,18),cladding);arch.rotation.y=Math.PI/2;arch.position.set(x,.39,0);arch.scale.z=1.20;g.add(arch);
      const rail=this.box(.065,.08,3.12,this.mats.chrome);rail.position.set(x*.73,1.86,-.02);g.add(rail);
    }
    const spoiler=this.vehicleBox(1.44,.10,.22,cladding,.04);spoiler.position.set(0,1.82,-2.02);g.add(spoiler);
    g.userData={...(g.userData||{}),cameraHeight:1.36,cameraZ:2.02,label:'Crossover SUV',vehicleProfile:'crossover',modelQuality:'premium-procedural'};
    return g;
  }
  pickup(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car;
    // Cab
    const cab=this.vehicleBox(2.06,.84,2.54,mat,.15);cab.position.set(0,.72,-1.22);g.add(cab);
    const cabU=this.vehicleBox(1.90,.24,2.30,mat,.08);cabU.position.set(0,1.18,-1.22);g.add(cabU);
    const roof=this.vehicleBox(1.56,.54,1.70,this.mats.dark,.13);roof.position.set(0,1.36,-1.20);g.add(roof);
    // Windshield
    const ws=this.box(1.48,.48,.10,this.mats.glass);ws.position.set(0,1.32,-.04);ws.rotation.x=.30;g.add(ws);
    const rw=this.box(1.44,.42,.10,this.mats.glass);rw.position.set(0,1.30,-2.28);rw.rotation.x=-.24;g.add(rw);
    for(const x of [-1.00,1.00]){const sw=this.box(.10,.38,1.36,this.mats.glass);sw.position.set(x,1.32,-1.20);g.add(sw);}
    // Bed
    const bed=this.vehicleBox(2.06,.38,2.24,mat,.08);bed.position.set(0,.52,1.10);g.add(bed);
    const bwall=this.vehicleBox(2.06,.60,.10,mat,.05);bwall.position.set(0,.70,2.24);g.add(bwall);
    for(const x of [-1.00,1.00]){const rail=this.box(.06,.22,2.22,this.mats.chrome);rail.position.set(x,.68,1.10);g.add(rail);}
    // Bumpers
    const fb=this.box(2.06,.26,.16,this.mats.dark);fb.position.set(0,.38,2.30);g.add(fb);
    const rb=this.box(2.06,.26,.16,this.mats.dark);rb.position.set(0,.38,-2.50);g.add(rb);
    for(const x of [-.62,.62]){const hl=this.box(.30,.14,.10,this.mats.headlight);hl.position.set(x,.78,2.32);g.add(hl);}
    for(const x of [-.72,.72]){const tl=this.box(.24,.22,.10,this.mats.taillight);tl.position.set(x,.70,2.22);g.add(tl);}
    for(const x of [-1.10,1.10]){const m=this.box(.10,.14,.22,this.mats.dark);m.position.set(x,1.16,-.04);g.add(m);}
    for(const x of [-1.08,1.08])for(const z of [-1.72,1.66]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.28,18),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.32,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.29,10),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.32,z);g.add(r);
    }
    const brake=this.box(1.55,.09,.07,this.mats.red);brake.position.set(0,.76,2.28);g.add(brake);
    g.userData={cameraHeight:1.28,cameraZ:2.2,label:'Pickup Truck'};this.addTurnSignals(g,2.06,4.90,.76);return this.premiumVehicleDetail(g,'pickup');
  }
  van(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car2;
    // Main body
    const body=this.vehicleBox(2.22,1.82,5.46,mat,.18);body.position.y=1.04;g.add(body);
    // Front lower section
    const front=this.vehicleBox(2.18,.32,1.10,mat,.09);front.position.set(0,.62,2.18);g.add(front);
    // Windshield
    const ws=this.box(2.08,.74,.10,this.mats.glass);ws.position.set(0,1.12,2.60);ws.rotation.x=.22;g.add(ws);
    // Cab side windows
    for(const x of [-1.08,1.08]){const sw=this.box(.10,.50,1.08,this.mats.glass);sw.position.set(x,1.12,2.18);g.add(sw);}
    // Sliding door seam lines
    for(const x of [-1.10,1.10]){const dl=this.box(.06,.90,2.80,this.mats.dark);dl.position.set(x,1.04,.12);g.add(dl);}
    // Rear door split
    const rd=this.box(.08,1.42,.10,this.mats.dark);rd.position.set(0,1.04,-2.78);g.add(rd);
    // Bumpers
    const fb=this.box(2.18,.28,.18,this.mats.dark);fb.position.set(0,.34,2.82);g.add(fb);
    const rb=this.box(2.18,.28,.18,this.mats.dark);rb.position.set(0,.34,-2.84);g.add(rb);
    for(const x of [-.72,.72]){const hl=this.box(.34,.20,.10,this.mats.headlight);hl.position.set(x,.82,2.84);g.add(hl);}
    for(const x of [-.80,.80]){const tl=this.box(.28,.40,.10,this.mats.taillight);tl.position.set(x,.96,-2.80);g.add(tl);}
    for(const x of [-1.14,1.14]){const m=this.box(.10,.20,.28,this.mats.dark);m.position.set(x,1.52,2.24);g.add(m);}
    for(const x of [-1.12,1.12])for(const z of [-1.96,1.96]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.30,18),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.32,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.31,10),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.32,z);g.add(r);
    }
    const brake=this.box(1.68,.09,.07,this.mats.red);brake.position.set(0,.90,2.76);g.add(brake);
    g.userData={cameraHeight:1.82,cameraZ:2.4,label:'Cargo Van'};this.addTurnSignals(g,2.22,5.46,.86);return this.fleetVehicleDetail(this.premiumVehicleDetail(g,'van'),'van');
  }
  minivan(colorMat){
    const g=this.van(colorMat);
    g.scale.set(.98,.88,.95);g.position.y=.018;
    const glass=this.mats.glass,chrome=this.mats.chrome,dark=this.mats.dark;
    for(const side of [-1,1]){
      for(const z of [-.92,-2.02]){
        const pane=this.vehicleBox(.07,.58,.86,glass,.045);pane.position.set(side*1.115,1.34,z);g.add(pane);
      }
      const rail=this.box(.045,.055,1.78,chrome);rail.position.set(side*1.125,.88,-.80);g.add(rail);
      const handle=this.box(.055,.07,.30,chrome);handle.position.set(side*1.135,1.20,.20);g.add(handle);
      const sill=this.vehicleBox(.08,.15,3.74,dark,.04);sill.position.set(side*1.125,.48,-.18);g.add(sill);
    }
    const roofRail=this.box(.055,.07,3.12,chrome);
    for(const side of [-1,1]){const rail=roofRail.clone();rail.position.set(side*.76,2.02,-.22);g.add(rail);}
    const rearSpoiler=this.vehicleBox(1.42,.10,.24,dark,.045);rearSpoiler.position.set(0,2.00,-2.66);g.add(rearSpoiler);
    const rearBadge=this.box(.34,.08,.04,chrome);rearBadge.position.set(0,1.36,-2.87);g.add(rearBadge);
    g.userData={...(g.userData||{}),cameraHeight:1.56,cameraZ:2.32,label:'Passenger minivan',vehicleProfile:'minivan',minivanDetails:{passengerWindows:4,slidingDoorRails:2,roofRails:2,rearSpoiler:true},modelQuality:'premium-procedural'};
    return g;
  }
  boxTruck(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car2;
    // Tall cargo box with a separate cab gives highway traffic a readable
    // silhouette at distance while keeping the mesh lightweight.
    const cargo=this.vehicleBox(2.48,2.28,4.22,mat,.20);cargo.position.set(0,1.48,-.46);g.add(cargo);
    const lower=this.vehicleBox(2.42,.30,4.48,mat,.08);lower.position.set(0,.52,-.30);g.add(lower);
    const cab=this.vehicleBox(2.36,1.02,1.62,mat,.15);cab.position.set(0,.84,2.42);g.add(cab);
    const roof=this.vehicleBox(2.18,.14,1.48,mat,.06);roof.position.set(0,1.44,2.40);g.add(roof);
    const windshield=this.box(2.04,.64,.10,this.mats.glass);windshield.position.set(0,1.25,3.22);windshield.rotation.x=.20;g.add(windshield);
    for(const x of [-1.17,1.17]){const sideWindow=this.box(.10,.48,.82,this.mats.glass);sideWindow.position.set(x,1.22,2.62);g.add(sideWindow);}
    const cargoSeam=this.box(.055,1.82,3.82,this.mats.dark);cargoSeam.position.set(0,1.48,-.46);g.add(cargoSeam);
    for(const x of [-.76,.76]){const rearLamp=this.box(.20,.42,.08,this.mats.taillight);rearLamp.position.set(x,.90,-2.60);g.add(rearLamp);}
    const rearBumper=this.box(2.30,.24,.16,this.mats.dark);rearBumper.position.set(0,.38,-2.66);g.add(rearBumper);
    const frontBumper=this.box(2.30,.26,.18,this.mats.dark);frontBumper.position.set(0,.40,3.28);g.add(frontBumper);
    for(const x of [-.68,.68]){const headlamp=this.box(.34,.18,.10,this.mats.headlight);headlamp.position.set(x,.80,3.30);g.add(headlamp);}
    for(const x of [-1.24,1.24])for(const z of [-1.78,2.35]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.30,18),this.mats.tire);tire.rotation.z=Math.PI/2;tire.position.set(x,.36,z);tire.castShadow=true;g.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.31,10),this.mats.rim);rim.rotation.z=Math.PI/2;rim.position.set(x,.36,z);g.add(rim);
    }
    const brake=this.box(1.72,.09,.07,this.mats.red);brake.position.set(0,.90,3.24);g.add(brake);
    for(const x of [-1.30,1.30]){const mirror=this.box(.10,.20,.26,this.mats.dark);mirror.position.set(x,1.18,2.92);g.add(mirror);}
    g.userData={cameraHeight:1.72,cameraZ:2.65,label:'Box Truck',vehicleProfile:'boxtruck',modelQuality:'premium-procedural'};
    this.addTurnSignals(g,2.48,5.92,.92);return this.registerVehicleWheels(this.fleetVehicleDetail(g,'boxtruck'));
  }
  semiTruck(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car2;
    const tractor=new THREE.Group();const trailer=new THREE.Group();g.add(tractor);g.add(trailer);
    // The trailer group is pivoted at the fifth wheel so the rig can visibly
    // settle into a turn instead of rotating as one rigid sedan-like body.
    const trailerBody=this.vehicleBox(2.60,2.62,6.35,mat,.18);trailerBody.position.set(0,1.72,-.72);trailer.add(trailerBody);
    const trailerLower=this.vehicleBox(2.56,.28,6.42,this.mats.dark,.06);trailerLower.position.set(0,.52,-.72);trailer.add(trailerLower);
    const trailerRoof=this.vehicleBox(2.48,.10,6.15,this.mats.chrome,.04);trailerRoof.position.set(0,3.06,-.72);trailer.add(trailerRoof);
    const rearDoors=this.vehicleBox(2.28,2.26,.10,this.mats.dark,.04);rearDoors.position.set(0,1.72,-3.95);trailer.add(rearDoors);
    const rearSplit=this.box(.055,2.05,.035,this.mats.chrome);rearSplit.position.set(0,1.72,-4.01);trailer.add(rearSplit);
    for(const x of [-1.31,1.31]){
      const markerRail=this.box(.055,.08,5.65,this.mats.chrome);markerRail.position.set(x,1.06,-.72);trailer.add(markerRail);
      for(const z of [-3.25,-2.15,-1.05,.05,1.15,2.25]){const marker=this.box(.11,.12,.06,this.mats.marker||this.mats.headlight);marker.position.set(x*.98,1.17,z);trailer.add(marker);}
    }
    for(const x of [-.90,.90]){const tailLamp=this.box(.25,.40,.08,this.mats.taillight);tailLamp.position.set(x,.95,-4.03);trailer.add(tailLamp);}
    const trailerBrake=this.box(1.72,.09,.07,this.mats.red);trailerBrake.position.set(0,1.02,-4.05);trailer.add(trailerBrake);
    for(const x of [-1.30,1.30]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.30,18),this.mats.tire);tire.name='semi-wheel-trailer';tire.rotation.z=Math.PI/2;tire.position.set(x,.38,-2.82);tire.castShadow=true;trailer.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.31,10),this.mats.rim);rim.rotation.z=Math.PI/2;rim.position.set(x,.38,-2.82);trailer.add(rim);
    }
    const cabLower=this.vehicleBox(2.58,.34,2.38,mat,.08);cabLower.position.set(0,.54,3.20);tractor.add(cabLower);
    const cab=this.vehicleBox(2.50,1.62,2.30,mat,.16);cab.position.set(0,1.22,3.23);tractor.add(cab);
    const cabRoof=this.vehicleBox(2.36,.12,2.12,mat,.06);cabRoof.position.set(0,2.08,3.22);tractor.add(cabRoof);
    const windshield=this.box(2.18,.70,.10,this.mats.glass);windshield.position.set(0,1.54,4.40);windshield.rotation.x=.18;tractor.add(windshield);
    for(const x of [-1.27,1.27]){const sideWindow=this.box(.10,.56,.92,this.mats.glass);sideWindow.position.set(x,1.52,3.55);tractor.add(sideWindow);}
    const grille=this.vehicleBox(1.42,.38,.08,this.mats.dark,.025);grille.position.set(0,.70,4.40);tractor.add(grille);
    const frontBumper=this.box(2.54,.26,.18,this.mats.chrome);frontBumper.position.set(0,.40,4.43);tractor.add(frontBumper);
    for(const x of [-.72,.72]){const headlamp=this.box(.34,.20,.10,this.mats.headlight);headlamp.position.set(x,.84,4.44);tractor.add(headlamp);}
    for(const x of [-1.38,1.38]){const mirror=this.box(.11,.24,.34,this.mats.dark);mirror.position.set(x,1.42,4.06);mirror.rotation.x=-.16;tractor.add(mirror);}
    for(const x of [-1.30,1.30])for(const z of [-1.52,2.90]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.30,18),this.mats.tire);tire.name=`semi-wheel-${z>1?'front':'drive'}`;tire.rotation.z=Math.PI/2;tire.position.set(x,.38,z);tire.castShadow=true;tractor.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.31,10),this.mats.rim);rim.rotation.z=Math.PI/2;rim.position.set(x,.38,z);tractor.add(rim);
    }
    const fifthWheel=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.12,18),this.mats.dark);fifthWheel.position.set(0,.70,2.24);tractor.add(fifthWheel);
    trailer.position.z=2.24;
    trailer.children.forEach(child=>{child.position.z-=2.24;});
    g.userData={cameraHeight:2.05,cameraZ:2.90,label:'Semi truck',vehicleProfile:'semi',modelQuality:'premium-procedural',tractor,trailer,articulationAngle:0,articulationMax:.24};
    this.addTurnSignals(g,2.58,8.85,1.05);return this.registerVehicleWheels(g);
  }
  motorcycle(colorMat){
    const g=new THREE.Group();const mat=colorMat||this.mats.car;
    const frame=this.box(.16,.16,1.92,this.mats.dark);frame.position.set(0,.66,.04);g.add(frame);
    const engine=this.vehicleBox(.42,.38,.58,this.mats.dark,.08);engine.position.set(0,.72,.02);g.add(engine);
    const tank=this.vehicleBox(.66,.40,.92,mat,.13);tank.position.set(0,1.02,.38);g.add(tank);
    const rearCowl=this.vehicleBox(.58,.28,.78,mat,.11);rearCowl.position.set(0,.98,-.62);g.add(rearCowl);
    const seat=this.vehicleBox(.46,.13,.72,this.mats.dark,.05);seat.position.set(0,1.19,-.30);g.add(seat);
    const fairing=this.vehicleBox(.56,.46,.40,mat,.12);fairing.position.set(0,1.14,.98);g.add(fairing);
    const windscreen=this.box(.38,.30,.06,this.mats.glass);windscreen.position.set(0,1.36,1.13);windscreen.rotation.x=.20;g.add(windscreen);
    for(const x of [-.14,.14]){const fork=this.box(.07,.07,.94,this.mats.chrome);fork.position.set(x,.78,.83);fork.rotation.x=-.12;g.add(fork);}
    const handlebar=this.box(.82,.06,.06,this.mats.chrome);handlebar.position.set(0,1.48,.67);g.add(handlebar);
    for(const x of [-.46,.46]){const grip=this.box(.16,.08,.08,this.mats.dark);grip.position.set(x,1.48,.67);g.add(grip);}
    const headlamp=this.box(.25,.20,.10,this.mats.headlight);headlamp.position.set(0,1.16,1.21);g.add(headlamp);
    const rearLamp=this.box(.22,.10,.08,this.mats.taillight);rearLamp.position.set(0,.98,-1.05);g.add(rearLamp);
    const torso=this.vehicleBox(.34,.58,.34,this.mats.dark,.07);torso.position.set(0,1.52,-.18);g.add(torso);
    const helmet=new THREE.Mesh(new THREE.SphereGeometry(.19,12,9),mat);helmet.position.set(0,1.93,.03);helmet.castShadow=true;g.add(helmet);
    const visor=this.box(.27,.10,.06,this.mats.glass);visor.position.set(0,1.93,.19);g.add(visor);
    for(const x of [-.15,.15]){const arm=this.box(.09,.40,.09,this.mats.dark);arm.position.set(x,1.38,.36);arm.rotation.x=-.58;g.add(arm);const leg=this.box(.10,.46,.10,this.mats.dark);leg.position.set(x,1.12,-.36);leg.rotation.x=.35;g.add(leg);}
    for(const z of [-1.02,1.10]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,18),this.mats.tire);tire.name=`motorcycle-wheel-${z>0?'front':'rear'}`;tire.rotation.z=Math.PI/2;tire.position.set(0,.37,z);tire.castShadow=true;g.add(tire);
      const rim=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.19,10),this.mats.rim);rim.name=`motorcycle-wheel-rim-${z>0?'front':'rear'}`;rim.rotation.z=Math.PI/2;rim.position.set(0,.37,z);g.add(rim);
    }
    g.userData={cameraHeight:1.30,cameraZ:1.85,label:'Motorcycle',vehicleProfile:'motorcycle',modelQuality:'premium-procedural'};
    this.addTurnSignals(g,.82,2.30,.88);return this.registerVehicleWheels(g);
  }
  bus(colorMat){
    const g=new THREE.Group();const mat=colorMat||new THREE.MeshStandardMaterial({color:0x3a6ea5,roughness:.6});
    const body=this.vehicleBox(2.4,2.0,9.5,mat,.20);body.position.y=1.25;g.add(body);
    const stripe=this.box(2.42,.3,9.0,new THREE.MeshStandardMaterial({color:0xffd166,roughness:.6}));stripe.position.y=1.0;g.add(stripe);
    const lowerSkirt=this.vehicleBox(2.34,.34,8.9,this.mats.dark,.08);lowerSkirt.position.y=.52;g.add(lowerSkirt);
    for(let i=0;i<5;i++){const w=this.box(.06,.7,1.1,this.mats.glass);w.position.set(-1.21,1.7,-3.2+i*1.6);g.add(w);const w2=w.clone();w2.position.x=1.21;g.add(w2);}
    const frontDoorFrame=this.box(.08,1.34,.92,this.mats.dark);frontDoorFrame.position.set(1.225,1.28,2.92);g.add(frontDoorFrame);
    const rearDoorFrame=this.box(.08,1.34,.92,this.mats.dark);rearDoorFrame.position.set(1.225,1.28,-.28);g.add(rearDoorFrame);
    const busDoors=[];
    for(const z of [2.92,-.28]){
      const door=new THREE.Group();door.position.set(1.255,1.28,z);
      const panel=this.box(.055,1.14,.42,this.mats.glass);panel.position.set(0,0,0);door.add(panel);
      const seam=this.box(.065,1.18,.035,this.mats.chrome);seam.position.set(0,0,.215);door.add(seam);
      g.add(door);busDoors.push(door);
    }
    const destination=this.box(1.34,.30,.06,this.mats.dark);destination.position.set(0,2.12,4.79);g.add(destination);
    const destinationFace=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.22),new THREE.MeshBasicMaterial({map:this.signTexture('CITY 12','#17202b','#ffd166','panel'),side:THREE.DoubleSide}));destinationFace.position.set(0,2.12,4.755);g.add(destinationFace);
    const ws=this.box(2.2,.8,.1,this.mats.glass);ws.position.set(0,1.6,4.76);g.add(ws);
    const rearWindow=this.box(2.18,.78,.08,this.mats.glass);rearWindow.position.set(0,1.60,-4.76);g.add(rearWindow);
    const frontBumper=this.box(2.28,.24,.18,this.mats.chrome);frontBumper.position.set(0,.42,4.86);g.add(frontBumper);
    const rearBumper=this.box(2.28,.24,.18,this.mats.dark);rearBumper.position.set(0,.42,-4.86);g.add(rearBumper);
    for(const x of [-.78,.78]){const hl=this.box(.38,.20,.10,this.mats.headlight);hl.position.set(x,.88,4.84);g.add(hl);const tl=this.box(.30,.34,.10,this.mats.taillight);tl.position.set(x,.96,-4.84);g.add(tl);}
    const brake=this.box(1.48,.08,.07,this.mats.red);brake.position.set(0,1.16,-4.84);g.add(brake);
    for(const x of [-1.28,1.28]){const mirror=this.box(.10,.22,.34,this.mats.dark);mirror.position.set(x,1.82,4.34);mirror.rotation.x=-.18;g.add(mirror);}
    for(const x of [-1.15,1.15])for(const z of [-3.2,3.2]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,14),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.42,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.31,12),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.42,z);g.add(r);
      const arch=new THREE.Mesh(new THREE.TorusGeometry(.45,.055,6,18),this.mats.dark);arch.rotation.y=Math.PI/2;arch.position.set(x,.44,z);g.add(arch);
    }
    const roofUnit=this.vehicleBox(.76,.22,1.26,this.mats.dark,.08);roofUnit.position.set(-.35,2.36,-.82);g.add(roofUnit);
    const roofVent=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.12,12),this.mats.chrome);roofVent.position.set(.52,2.48,-.82);g.add(roofVent);
    g.userData={cameraHeight:2.0,cameraZ:2.6,label:'City bus',vehicleProfile:'bus',busDoors,busDoorAngle:0};this.addTurnSignals(g,2.4,9.5,1.55);return this.registerVehicleWheels(g);
  }
  cyclistRig(){
    const g=new THREE.Group();
    const ped=this.pedestrian();ped.scale.set(.9,.9,.9);ped.position.y=.35;g.add(ped);
    const frame=this.box(.08,.08,1.6,this.mats.dark);frame.position.y=.45;g.add(frame);
    const bikeWheels=[];
    for(const z of [-.7,.7]){const w=new THREE.Mesh(new THREE.TorusGeometry(.32,.05,8,16),this.mats.tire);w.position.set(0,.32,z);g.add(w);bikeWheels.push(w);}
    g.userData={label:'cyclist',bikeWheels,rider:ped};return g;
  }
  worker(){
    const g=this.pedestrian();
    const vest=this.box(.46,.3,.26,new THREE.MeshStandardMaterial({color:0xff7a36,roughness:.7,emissive:0xff7a36,emissiveIntensity:.25}));vest.position.set(0,1.18,0);g.add(vest);
    g.userData.label='worker';return g;
  }
  emergency(){
    const g=new THREE.Group();
    const bodyMat=new THREE.MeshStandardMaterial({color:0x152055,roughness:.38,metalness:.14});
    // Body
    const body=this.vehicleBox(2.04,.62,4.22,bodyMat,.14);body.position.y=.50;g.add(body);
    const upper=this.vehicleBox(1.90,.28,3.80,bodyMat,.09);upper.position.y=.92;g.add(upper);
    const cabin=this.vehicleBox(1.36,.52,1.80,this.mats.dark,.12);cabin.position.set(0,1.14,-.26);g.add(cabin);
    // Windshield / rear window
    const ws=this.box(1.28,.46,.08,this.mats.glass);ws.position.set(0,1.10,.60);ws.rotation.x=.32;g.add(ws);
    const rw=this.box(1.24,.42,.08,this.mats.glass);rw.position.set(0,1.08,-1.12);rw.rotation.x=-.30;g.add(rw);
    // Bull bar
    const bull=this.box(1.80,.44,.14,this.mats.chrome);bull.position.set(0,.56,2.18);g.add(bull);
    // Bumpers
    const fb=this.box(2.00,.24,.14,this.mats.dark);fb.position.set(0,.36,2.14);g.add(fb);
    const rb=this.box(2.00,.24,.14,this.mats.dark);rb.position.set(0,.36,-2.14);g.add(rb);
    // Headlights / taillights
    for(const x of [-.62,.62]){const hl=this.box(.30,.14,.08,this.mats.headlight);hl.position.set(x,.72,2.14);g.add(hl);}
    for(const x of [-.70,.70]){const tl=this.box(.28,.12,.08,this.mats.taillight);tl.position.set(x,.70,-2.14);g.add(tl);}
    // Light bar base
    const barBase=this.box(.86,.10,.28,this.mats.dark);barBase.position.set(0,1.54,-.18);g.add(barBase);
    // Red/blue sections (animated in updateActorMeshes)
    const barR=new THREE.Mesh(new THREE.BoxGeometry(.40,.13,.26),new THREE.MeshBasicMaterial({color:0xff2244}));barR.position.set(.21,1.54,-.18);barR.userData.emgRed=true;g.add(barR);
    const barB=new THREE.Mesh(new THREE.BoxGeometry(.40,.13,.26),new THREE.MeshBasicMaterial({color:0x2255ff}));barB.position.set(-.21,1.54,-.18);barB.userData.emgBlue=true;g.add(barB);
    // Side mirrors
    for(const x of [-1.08,1.08]){const m=this.box(.09,.11,.18,this.mats.dark);m.position.set(x,1.02,.42);g.add(m);}
    // Tires + rims
    for(const x of [-1.04,1.04])for(const z of [-1.42,1.42]){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.24,18),this.mats.tire);t.rotation.z=Math.PI/2;t.position.set(x,.30,z);t.castShadow=true;g.add(t);
      const r=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.25,10),this.mats.rim);r.rotation.z=Math.PI/2;r.position.set(x,.30,z);g.add(r);
    }
    g.userData={cameraHeight:1.18,cameraZ:1.9,label:'emergency vehicle',isEmergency:true};return this.registerVehicleWheels(this.fleetVehicleDetail(g,'emergency'));
  }
}


export { MeshFactory };
if(typeof window!=='undefined')window.SimModelFactory=MeshFactory;
