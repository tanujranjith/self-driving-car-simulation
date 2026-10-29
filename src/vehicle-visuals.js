let wheelAxis=null;
let wheelSpinQuaternion=null;
let wheelSteerQuaternion=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const WHEEL_STEER_RESPONSE={
  coupe:9.4,sport:8.6,emergency:8.6,electric:8.0,compact:7.8,taxi:7.2,sedan:6.8,
  luxury:6.1,crossover:5.7,suv:5.2,pickup:4.8,minivan:4.2,van:3.8,delivery:3.6,
  boxtruck:3.0,bus:3.1,semi:2.6
};

function three(){return globalThis.THREE;}

export function decorateVehicleAsset(asset){
  if(!asset)return asset;
  const wheelCandidates=[];
  const brakeLights=[];
  const headlights=[];
  const turnSignals={left:[],right:[]};
  asset.traverse?.(node=>{
    if(!node.isMesh)return;
    const nodeName=String(node.name||'').toLowerCase();
    const materials=Array.isArray(node.material)?node.material:[node.material];
    const materialNames=materials.map(material=>String(material?.name||'').toLowerCase()).join(' ');
    const semanticName=`${nodeName} ${materialNames}`;
    const proceduralWheel=node.geometry?.type==='CylinderGeometry'&&Math.abs(node.position.x)>.4&&node.position.y<.68;
    const steeringWheel=/steering.?wheel|wheel.?steering/.test(semanticName);
    const brakePart=/brake|disc|pad/.test(semanticName);
    const namedWheel=/(?:wheel|wheels|tire[a-z]*|tyre[a-z]*|(?<!t)rim\d*)/.test(semanticName)&&!steeringWheel&&!brakePart;
    if(proceduralWheel||namedWheel)wheelCandidates.push(node);
    if(node.userData?.brakeLight||/brake|tail.?light|rear.?light|stop.?light/.test(semanticName))brakeLights.push(node);
    if(!/brake|tail.?light|rear.?light|stop.?light/.test(semanticName)&&(node.userData?.headlight||/headlight|headlamp|front.?light|low.?beam|high.?beam/.test(semanticName)))headlights.push(node);
    const signalSide=node.userData?.signalSide;
    if(signalSide==='left'||signalSide==='right')turnSignals[signalSide].push(node);
  });
  const treadWheels=wheelCandidates.filter(node=>{
    const name=`${String(node.name||'').toLowerCase()} ${String(node.material?.name||'').toLowerCase()}`;
    return /tiretread|tyretread|tire.?tread|tyre.?tread/.test(name);
  });
  const wheels=treadWheels.length>=4?treadWheels:wheelCandidates;
  const T=three();
  if(asset.userData?.modelQuality==='pbr-glb'&&T?.Box3&&T?.MeshStandardMaterial&&T?.MeshBasicMaterial&&T?.BoxGeometry){
    asset.updateMatrixWorld(true);
    const worldBox=new T.Box3().setFromObject(asset);
    const worldSize=worldBox.getSize(new T.Vector3());
    const worldScale=asset.getWorldScale?.(new T.Vector3())||new T.Vector3(1,1,1);
    const worldQuaternion=asset.getWorldQuaternion(new T.Quaternion());
    const forward=new T.Vector3(0,0,1).applyQuaternion(worldQuaternion).normalize();
    const sideAxis=new T.Vector3(1,0,0).applyQuaternion(worldQuaternion).normalize();
    const worldCenter=worldBox.getCenter(new T.Vector3());
    const worldFront=worldCenter.clone().add(forward.clone().multiplyScalar(worldSize.z*.5+.018));
    const worldRear=worldCenter.clone().add(forward.clone().multiplyScalar(-worldSize.z*.5-.018));
    worldFront.y=worldRear.y=worldBox.min.y+worldSize.y*.42;
    const addLamp=(target,material,metadata={},scaleFactor=1)=>{
      const lampWidth=Math.max(.012,Math.max(.12,Math.min(.34,worldSize.x*.11))*scaleFactor/Math.max(.001,Math.abs(worldScale.x)));
      const lampHeight=Math.max(.008,Math.max(.07,Math.min(.18,worldSize.y*.075))*scaleFactor/Math.max(.001,Math.abs(worldScale.y)));
      const lampDepth=Math.max(.004,Math.max(.035,Math.min(.10,worldSize.x*.025))*scaleFactor/Math.max(.001,Math.abs(worldScale.z)));
      const lamp=new T.Mesh(new T.BoxGeometry(lampWidth,lampHeight,lampDepth),material);
      lamp.position.copy(asset.worldToLocal(target.clone()));
      lamp.castShadow=true;lamp.receiveShadow=true;
      Object.assign(lamp.userData,metadata);
      asset.add(lamp);return lamp;
    };
    if(!headlights.length){
      const material=new T.MeshStandardMaterial({color:0xd8e8f8,roughness:.06,metalness:.5,emissive:0xffffff,emissiveIntensity:0});
      for(const side of [-1,1])headlights.push(addLamp(worldFront.clone().add(sideAxis.clone().multiplyScalar(side*worldSize.x*.28)),material.clone(),{headlight:true,baseHeadlightIntensity:0}));
    }
    if(!brakeLights.length){
      const material=new T.MeshStandardMaterial({color:0xff2211,roughness:.18,metalness:.05,emissive:0xff2200,emissiveIntensity:.18});
      for(const side of [-1,1])brakeLights.push(addLamp(worldRear.clone().add(sideAxis.clone().multiplyScalar(side*worldSize.x*.28)),material.clone(),{brakeLight:true,baseBrakeIntensity:.18}));
    }
    if(!turnSignals.left.length&&!turnSignals.right.length){
      for(const [signalSide,side] of [['left',-1],['right',1]]){
        const frontLamp=addLamp(worldFront.clone().add(sideAxis.clone().multiplyScalar(side*worldSize.x*.35)),new T.MeshBasicMaterial({color:0x5b3b12,transparent:true,opacity:.18}),{signalSide},.72);
        const rearLamp=addLamp(worldRear.clone().add(sideAxis.clone().multiplyScalar(side*worldSize.x*.35)),new T.MeshBasicMaterial({color:0x5b3b12,transparent:true,opacity:.18}),{signalSide},.72);
        turnSignals[signalSide].push(frontLamp,rearLamp);
      }
    }
  }
  if(wheels.length<4&&asset.userData?.modelQuality==='pbr-glb'&&T?.Box3&&T?.Group&&T?.CylinderGeometry&&T?.MeshStandardMaterial){
    asset.updateMatrixWorld(true);
    const worldBox=new T.Box3().setFromObject(asset);
    const worldSize=worldBox.getSize(new T.Vector3());
    const worldScale=asset.getWorldScale?.(new T.Vector3())||new T.Vector3(1,1,1);
    const worldQuaternion=asset.getWorldQuaternion(new T.Quaternion());
    const forward=new T.Vector3(0,0,1).applyQuaternion(worldQuaternion).normalize();
    const sideAxis=new T.Vector3(1,0,0).applyQuaternion(worldQuaternion).normalize();
    const worldCenter=worldBox.getCenter(new T.Vector3());
    const radius=Math.max(.18,Math.min(.34,worldSize.y*.18));
    const axleOffset=worldSize.z*.30;
    const lateralOffset=worldSize.x*.43;
    const tireWidth=Math.max(.12,Math.min(.24,worldSize.x*.085));
    const tireMaterial=new T.MeshStandardMaterial({color:0x05070a,roughness:.82,metalness:.04});
    const rimMaterial=new T.MeshStandardMaterial({color:0xb7c1cc,roughness:.2,metalness:.86});
    const existingWheelPositions=wheels.map(wheel=>wheel.getWorldPosition(new T.Vector3()));
    for(const axle of [-1,1])for(const side of [-1,1]){
      const target=worldCenter.clone().add(forward.clone().multiplyScalar(axle*axleOffset)).add(sideAxis.clone().multiplyScalar(side*lateralOffset));
      target.y=worldBox.min.y+radius;
      const occupied=existingWheelPositions.some(position=>position.distanceTo(target)<Math.max(.22,worldSize.x*.18));
      if(occupied)continue;
      const wheel=new T.Group();
      const tire=new T.Mesh(new T.CylinderGeometry(radius/Math.max(.001,Math.abs(worldScale.y)),radius/Math.max(.001,Math.abs(worldScale.y)),tireWidth/Math.max(.001,Math.abs(worldScale.x)),18),tireMaterial.clone());
      tire.rotation.z=Math.PI/2;wheel.add(tire);
      const rim=new T.Mesh(new T.CylinderGeometry(radius*.53/Math.max(.001,Math.abs(worldScale.y)),radius*.53/Math.max(.001,Math.abs(worldScale.y)),tireWidth*1.02/Math.max(.001,Math.abs(worldScale.x)),12),rimMaterial.clone());
      rim.rotation.z=Math.PI/2;wheel.add(rim);
      wheel.position.copy(asset.worldToLocal(target));
      wheel.userData.syntheticWheel=true;
      asset.add(wheel);wheels.push(wheel);existingWheelPositions.push(target);
    }
  }
  for(const wheel of wheels){
    wheel.userData=wheel.userData||{};
    if(!wheel.userData.baseWheelQuaternion)wheel.userData.baseWheelQuaternion=wheel.quaternion.clone();
    const worldPosition=T?.Vector3?wheel.getWorldPosition(new T.Vector3()):null;
    wheel.userData.wheelZ=worldPosition?.z??wheel.position.z;
  }
  const assetPosition=T?.Vector3?asset.getWorldPosition(new T.Vector3()):null;
  const assetForward=T?.Vector3?new T.Vector3(0,0,1).applyQuaternion(asset.getWorldQuaternion(new T.Quaternion())).normalize():null;
  const frontWheels=assetPosition&&assetForward?wheels.filter(node=>{const p=node.getWorldPosition(new T.Vector3());return p.sub(assetPosition).dot(assetForward)>.15;}):wheels.filter(node=>node.position.z>.2);
  for(const lamp of brakeLights){
    lamp.userData=lamp.userData||{};
    if(!Number.isFinite(lamp.userData.baseBrakeIntensity))lamp.userData.baseBrakeIntensity=Number.isFinite(lamp.material?.emissiveIntensity)?lamp.material.emissiveIntensity:0;
  }
  for(const lamp of headlights){
    lamp.userData=lamp.userData||{};
    const materials=Array.isArray(lamp.material)?lamp.material:[lamp.material];
    for(const material of materials){
      if(material?.clone){
        const cloned=material.clone();
        if(Array.isArray(lamp.material))lamp.material=lamp.material.map(value=>value===material?cloned:value);
        else lamp.material=cloned;
      }
    }
    const refreshed=Array.isArray(lamp.material)?lamp.material:[lamp.material];
    lamp.userData.baseHeadlightIntensity=Number.isFinite(lamp.userData.baseHeadlightIntensity)?lamp.userData.baseHeadlightIntensity:(Number.isFinite(refreshed[0]?.emissiveIntensity)?refreshed[0].emissiveIntensity:0);
  }
  asset.userData={...(asset.userData||{}),wheels,frontWheels,brakeLights,headlights,turnSignals,vehicleProfile:asset.userData?.vehicleProfile||asset.userData?.modelId||null};
  return asset;
}

export function registerVehicleWheels(asset){
  return decorateVehicleAsset(asset);
}

export function animateVehicleWheels(mesh,speed,dt,steering=0){
  const T=three();
  const wheels=mesh?.userData?.wheels;
  if(!T||!mesh||!wheels?.length||dt<=0)return;
  const spin=(mesh.userData.wheelSpin||0)+speed*dt*.94;
  mesh.userData.wheelSpin=spin;
  wheelAxis=wheelAxis||new T.Vector3(0,1,0);
  wheelSpinQuaternion=wheelSpinQuaternion||new T.Quaternion();
  wheelSteerQuaternion=wheelSteerQuaternion||new T.Quaternion();
  wheelSpinQuaternion.setFromAxisAngle(wheelAxis,spin);
  const profile=mesh.userData?.vehicleProfile||mesh.userData?.modelId||'sedan';
  const targetSteering=clamp(Number(steering)||0,-.58,.58)*.34;
  const response=WHEEL_STEER_RESPONSE[profile]||6.4;
  const blend=1-Math.exp(-response*Math.min(.20,Math.max(0,Number(dt)||0)));
  const currentSteering=Number(mesh.userData.wheelSteeringAngle)||0;
  const steeringAngle=currentSteering+(targetSteering-currentSteering)*blend;
  mesh.userData.wheelSteeringAngle=steeringAngle;
  mesh.userData.wheelSteeringTarget=targetSteering;
  wheelSteerQuaternion.setFromAxisAngle(wheelAxis,steeringAngle);
  const front=mesh.userData.frontWheels||[];
  for(const wheel of wheels){
    const base=wheel.userData?.baseWheelQuaternion;
    if(!base)wheel.userData.baseWheelQuaternion=wheel.quaternion.clone();
    const original=wheel.userData.baseWheelQuaternion;
    if(front.includes(wheel))wheel.quaternion.copy(wheelSteerQuaternion).multiply(original).multiply(wheelSpinQuaternion);
    else wheel.quaternion.copy(original).multiply(wheelSpinQuaternion);
  }
}

export function animateVehicleLights(mesh,braking,headlightsOn=false){
  const lamps=mesh?.userData?.brakeLights;
  for(const lamp of lamps||[]){
    const materials=Array.isArray(lamp.material)?lamp.material:[lamp.material];
    for(const material of materials){
      if(material&&'emissiveIntensity' in material)material.emissiveIntensity=(lamp.userData?.baseBrakeIntensity||0)+(braking?1.45:0);
    }
  }
  for(const lamp of mesh?.userData?.headlights||[]){
    const materials=Array.isArray(lamp.material)?lamp.material:[lamp.material];
    for(const material of materials){
      if(material&&'emissiveIntensity' in material)material.emissiveIntensity=headlightsOn?1.8:(lamp.userData?.baseHeadlightIntensity||0);
    }
  }
}

export function animateVehicleTurnSignals(mesh,signal='none',blinkOn=false){
  const turnSignals=mesh?.userData?.turnSignals;
  if(!turnSignals)return;
  for(const side of ['left','right'])for(const lamp of turnSignals[side]||[]){
    const materials=Array.isArray(lamp.material)?lamp.material:[lamp.material];
    const on=blinkOn&&signal===side;
    for(const material of materials){
      if(!material)continue;
      if('opacity' in material)material.opacity=on?.92:.18;
      if(material.color?.setHex)material.color.setHex(on?0xffb12a:0x5b3b12);
    }
  }
}

export function animateVehicleBody(mesh,lateralVelocity=0,accel=0,type='car',modelId=null){
  if(!mesh)return;
  const lateral=Number(lateralVelocity)||0;
  const longitudinal=Number(accel)||0;
  if(modelId==='semi'&&mesh.userData?.tractor){
    // Let the tractor lean into the maneuver while the trailer keeps its own
    // smoothed yaw articulation from the traffic update.
    mesh.rotation.z=0;
    mesh.rotation.x=0;
    mesh.userData.tractor.rotation.z=clamp(-lateral*.055,-.10,.10);
    mesh.userData.tractor.rotation.x=clamp(-longitudinal*.008,-.055,.055);
    if(mesh.userData.trailer)mesh.userData.trailer.rotation.z=clamp(-lateral*.010,-.035,.035);
    return;
  }
  const rollScale=type==='bus'?.070:type==='motorcycle'?.12:.055;
  const pitchScale=type==='bus'?.011:type==='motorcycle'?.006:.009;
  mesh.rotation.z=clamp(-lateral*rollScale,-.11,.11);
  mesh.rotation.x=clamp(-longitudinal*pitchScale,-.065,.065);
}

export function animateBusDoors(mesh,open=false,dt=.016){
  const doors=mesh?.userData?.busDoors;
  if(!doors?.length)return;
  const target=open?.52:0;
  const blend=1-Math.exp(-Math.max(0,Number(dt)||0)*6);
  const current=Number(mesh.userData.busDoorAngle)||0;
  const angle=current+(target-current)*blend;
  mesh.userData.busDoorAngle=angle;
  for(const door of doors)door.rotation.y=angle;
}

export function animateCyclist(mesh,speed,dt,phase=0){
  if(!mesh||dt<=0)return;
  const wheels=mesh.userData?.bikeWheels||[];
  const spin=speed*dt*2.8;
  for(const wheel of wheels)wheel.rotation.z+=(spin||0);
  const rider=mesh.userData?.rider;
  const walkRig=rider?.userData?.walkRig;
  if(!walkRig)return;
  const stride=Math.min(.36,.12+Math.abs(speed)*.035);
  for(const [joint,index] of (walkRig.legs||[]).map((joint,index)=>[joint,index]))joint.rotation.z=Math.sin(phase+index*Math.PI)*stride;
  for(const [joint,index] of (walkRig.arms||[]).map((joint,index)=>[joint,index]))joint.rotation.z=(index===0?.16:-.16)+Math.sin(phase+index*Math.PI)*stride*.38;
}

if(typeof window!=='undefined')window.SimVehicleVisuals={decorateVehicleAsset,registerVehicleWheels,animateVehicleWheels,animateVehicleLights,animateVehicleTurnSignals,animateVehicleBody,animateBusDoors,animateCyclist};
