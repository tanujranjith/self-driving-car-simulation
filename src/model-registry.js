export class ModelRegistry{
  constructor(){this.entries=new Map();this.loaded=new Map();this.loader=null;this.pending=new Map();this.decorator=null;}
  register(id,entry){this.entries.set(id,{...entry,url:entry?.url||entry?.asset||null});return this;}
  setLoader(loader){this.loader=loader;return this;}
  setDecorator(decorator){this.decorator=typeof decorator==='function'?decorator:null;return this;}
  tag(id,root,source){
    if(!root)return root;
    const entry=this.entries.get(id)||{};
    root.userData={...(root.userData||{}),modelId:id,modelFamily:entry.family||null,modelQuality:entry.quality||'procedural',modelSource:source,modelAsset:entry.source||null};
    return root;
  }
  finalize(id,root){
    if(!root)return root;
    const entry=this.entries.get(id)||{};
    try{this.decorator?.(root,id,entry);}catch(error){root.userData={...(root.userData||{}),modelDecorationError:String(error?.message||error)};}
    return root;
  }
  create(id){
    const entry=this.entries.get(id);if(!entry)return null;
    const cached=this.loaded.get(id);if(cached)return this.finalize(id,cached.clone(true));
    const root=entry.fallback?entry.fallback():null;
    return this.finalize(id,this.tag(id,root,'fallback'));
  }
  prepare(id,root){
    const entry=this.entries.get(id)||{};
    const three=globalThis.THREE;
    if((entry.targetLength||entry.targetHeight)&&three?.Box3){
      root.updateMatrixWorld(true);
      const box=new three.Box3().setFromObject(root),size=box.getSize(new three.Vector3());
      const dimension=entry.targetHeight?size.y:Math.max(size.x,size.z);
      const target=entry.targetHeight||entry.targetLength;
      if(dimension>.001)root.scale.multiplyScalar(target/dimension);
      root.updateMatrixWorld(true);
      const grounded=new three.Box3().setFromObject(root);root.position.y-=grounded.min.y;
    }
    if(Number.isFinite(entry.rotateY))root.rotation.y=entry.rotateY;
    this.tag(id,root,'glb');
    root.userData.modelYawOffset=Number.isFinite(entry.rotateY)?entry.rotateY:0;
    if(entry.cameraHeight)root.userData.cameraHeight=entry.cameraHeight;
    if(entry.cameraZ)root.userData.cameraZ=entry.cameraZ;
    root.traverse?.(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    return root;
  }
  load(id){
    if(this.loaded.has(id))return Promise.resolve(this.finalize(id,this.loaded.get(id).clone(true)));
    if(this.pending.has(id))return this.pending.get(id).then(m=>m?this.finalize(id,m.clone(true)):this.create(id));
    const entry=this.entries.get(id);
    if(!entry||!entry.url||!this.loader)return Promise.resolve(this.create(id));
    const task=new Promise(resolve=>this.loader.load(entry.url,g=>{const root=this.prepare(id,g.scene||g);this.loaded.set(id,root);resolve(root);},undefined,()=>resolve(null)));
    this.pending.set(id,task);
    return task.then(root=>root?this.finalize(id,root.clone(true)):this.create(id)).finally(()=>this.pending.delete(id));
  }
}

export const SIM_MODEL_MANIFEST={
  sedan:{family:'vehicle',quality:'pbr-glb',fallback:'factory.car',asset:'/assets/vehicles/toy-car.glb',source:'Toy Car / Khronos glTF Sample Models',targetLength:4.6,rotateY:Math.PI,cameraHeight:1.18,cameraZ:1.9},
  suv:{family:'vehicle',quality:'pbr-glb',fallback:'factory.suv',asset:'/assets/vehicles/car-concept.glb',source:'Car Concept / Khronos glTF Sample Assets',targetLength:4.7,rotateY:Math.PI,cameraHeight:1.42,cameraZ:2.05},
  crossover:{family:'vehicle',quality:'premium-procedural',fallback:'factory.crossover',asset:null,source:'Premium procedural crossover SUV'},
  pickup:{family:'vehicle',quality:'pbr-glb',fallback:'factory.pickup',asset:'/assets/vehicles/cesium-milk-truck.glb',source:'Cesium Milk Truck / Khronos glTF Sample Models',targetLength:4.8,rotateY:Math.PI,cameraHeight:1.45,cameraZ:2.2},
  van:{family:'vehicle',quality:'premium-procedural',fallback:'factory.van',asset:null,source:'Premium procedural cargo van'},
  minivan:{family:'vehicle',quality:'premium-procedural',fallback:'factory.minivan',asset:null,source:'Premium procedural passenger minivan'},
  boxtruck:{family:'vehicle',quality:'premium-procedural',fallback:'factory.boxTruck',asset:null,source:'Premium procedural box truck'},
  semi:{family:'vehicle',quality:'premium-procedural',fallback:'factory.semiTruck',asset:null,source:'Premium procedural semi truck'},
  motorcycle:{family:'vehicle',quality:'premium-procedural',fallback:'factory.motorcycle',asset:null,source:'Premium procedural motorcycle'},
  compact:{family:'vehicle',quality:'premium-procedural',fallback:'factory.compact',asset:null,source:'Premium procedural compact hatchback'},
  sport:{family:'vehicle',quality:'premium-procedural',fallback:'factory.sport',asset:null,source:'Premium procedural sport sedan'},
  coupe:{family:'vehicle',quality:'premium-procedural',fallback:'factory.coupe',asset:null,source:'Premium procedural sport coupe'},
  luxury:{family:'vehicle',quality:'premium-procedural',fallback:'factory.luxury',asset:null,source:'Premium procedural luxury sedan'},
  electric:{family:'vehicle',quality:'premium-procedural',fallback:'factory.electric',asset:null,source:'Premium procedural electric sedan'},
  taxi:{family:'vehicle',quality:'premium-procedural',fallback:'factory.taxi',asset:null,source:'Premium procedural taxi sedan'},
  delivery:{family:'vehicle',quality:'pbr-glb',fallback:'factory.delivery',asset:'/assets/vehicles/cesium-milk-truck.glb',source:'Cesium Milk Truck / Khronos glTF Sample Models · delivery/service-truck variant',targetLength:5.05,rotateY:Math.PI,cameraHeight:1.48,cameraZ:2.28},
  emergency:{family:'vehicle',quality:'premium-procedural',fallback:'factory.emergency',asset:null,source:'Premium procedural emergency vehicle'},
  bus:{family:'vehicle',quality:'premium-procedural',fallback:'factory.bus',asset:null,source:'Premium procedural city bus'},
  pedestrian:{family:'actor',quality:'pbr-glb',fallback:'factory.pedestrian',asset:'/assets/actors/cesium-man.glb',source:'Cesium Man / Khronos glTF Sample Models',targetHeight:1.78,rotateY:Math.PI},
  'pedestrian-business':{family:'actor',quality:'premium-procedural',fallback:'factory.pedestrianBusiness',asset:null,source:'Premium procedural business pedestrian'},
  'pedestrian-backpack':{family:'actor',quality:'premium-procedural',fallback:'factory.pedestrianBackpack',asset:null,source:'Premium procedural backpack pedestrian'},
  'pedestrian-child':{family:'actor',quality:'premium-procedural',fallback:'factory.pedestrianChild',asset:null,source:'Premium procedural child pedestrian'},
  cyclist:{family:'actor',quality:'premium-procedural',fallback:'factory.cyclistRig',asset:null,source:'Premium procedural bicycle rig'},
  worker:{family:'actor',quality:'premium-procedural',fallback:'factory.worker',asset:null,source:'Premium procedural road worker'},
  building:{family:'environment',quality:'procedural',fallback:'factory.building',asset:null,source:'Procedural streamed city building'}
};
