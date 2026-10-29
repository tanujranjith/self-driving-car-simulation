const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function forEachMaterial(mesh,callback){
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of materials)if(material)callback(material);
}

export function applyWorldEnvironment(root,{weather='clear',surface='dry'}={}){
  if(!root)return;
  const wet=weather==='rain'||surface==='wet';
  const frozen=weather==='snow'||surface==='snowy'||surface==='icy';
  const roughnessDelta=wet?-.18:frozen?.06:0;
  root.traverse?.(node=>{
    if(!node.isMesh||!node.material)return;
    forEachMaterial(node,material=>{
      if('roughness' in material){
        material.userData=material.userData||{};
        if(!Number.isFinite(material.userData.baseRoughness))material.userData.baseRoughness=material.roughness;
        material.roughness=clamp(material.userData.baseRoughness+roughnessDelta,.14,1);
      }
      if('metalness' in material){
        material.userData=material.userData||{};
        if(!Number.isFinite(material.userData.baseMetalness))material.userData.baseMetalness=material.metalness;
        material.metalness=clamp(material.userData.baseMetalness+(wet?.08:0),0,1);
      }
    });
  });
}

export function animateWorldModels(root,time,dt,map='downtown'){
  if(!root||dt<=0)return;
  for(const model of root.children||[]){
    const id=String(model.userData?.worldModel||'');
    if(id.startsWith('tree-')){
      const phase=time*1.15+(model.position.z*.017)+(model.position.x*.031);
      model.rotation.x=Math.sin(phase)*.006;
      model.rotation.z=Math.cos(phase*.83)*.012;
    }else if(id==='storefront'&&map==='nightcity'){
      const phase=time*.8+model.position.z*.012;
      model.traverse?.(node=>{
        if(!node.isMesh||!node.material)return;
        forEachMaterial(node,material=>{
          if('emissiveIntensity' in material&&material.emissiveIntensity>.05){
            material.userData=material.userData||{};
            if(!Number.isFinite(material.userData.baseWorldEmissive))material.userData.baseWorldEmissive=material.emissiveIntensity;
            material.emissiveIntensity=material.userData.baseWorldEmissive*(.92+Math.sin(phase)*.08);
          }
        });
      });
    }else if(id==='construction-barricade'){
      const phase=time*4.4+model.position.z*.018;
      const pulse=Math.sin(phase)>0?.96:.20;
      for(const lamp of model.userData?.warningLights||[]){
        if(lamp?.material?.opacity!==undefined)lamp.material.opacity=pulse;
      }
    }else if(id==='pedestrian-signal'){
      const phase=time*.72+model.position.z*.014;
      const walkOn=Math.sin(phase)>.18;
      const stopLamp=model.userData?.stopLamp;
      const walkLamp=model.userData?.walkLamp;
      if(stopLamp?.material?.opacity!==undefined)stopLamp.material.opacity=walkOn?.16:.92;
      if(walkLamp?.material?.opacity!==undefined)walkLamp.material.opacity=walkOn?.96:.10;
    }else if(id==='tunnel-portal'){
      const phase=time*1.8+model.position.z*.009;
      const pulse=.72+Math.sin(phase)*.18;
      for(const lamp of model.userData?.tunnelLights||[]){
        if(lamp?.material?.opacity!==undefined)lamp.material.opacity=pulse;
      }
    }else if(id==='water-tower'){
      const phase=time*2.2+model.position.z*.011;
      const pulse=.35+Math.max(0,Math.sin(phase))*.65;
      const beacon=model.userData?.waterTowerBeacon;
      if(beacon?.material?.opacity!==undefined)beacon.material.opacity=pulse;
    }else if(id==='wind-turbine'){
      const phase=time*1.6+model.position.z*.009;
      const rotor=model.userData?.windTurbineRotor;
      if(rotor)rotor.rotation.z+=dt*(1.05+Math.sin(phase)*.08);
      const beacon=model.userData?.windTurbineBeacon;
      if(beacon?.material?.opacity!==undefined)beacon.material.opacity=.20+Math.max(0,Math.sin(phase))* .76;
    }else if(id==='rail-crossing'){
      const phase=time*1.9+model.position.z*.010;
      const active=model.userData?.railScenarioActive===true||Math.sin(phase)>.55;
      const pulse=active?.96:.16;
      for(const lamp of model.userData?.railLamps||[]){
        if(lamp?.material?.opacity!==undefined)lamp.material.opacity=pulse;
      }
      for(const gate of model.userData?.railGates||[]){
        const side=gate.userData?.railGateSide||1;
        const target=active?-side*1.08:0;
        gate.rotation.z+=(target-gate.rotation.z)*Math.min(1,Math.max(0,dt)*4.2);
      }
    }
  }
}

if(typeof window!=='undefined')window.SimWorldVisuals={applyWorldEnvironment,animateWorldModels};
