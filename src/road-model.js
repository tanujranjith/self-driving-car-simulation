const ROAD_PROFILES={
  highway:{laneW:3.8,shoulder:3.2,sidewalk:.4},
  suburb:{laneW:3.3,shoulder:1.5,sidewalk:5.2},
  downtown:{laneW:3.4,shoulder:1.8,sidewalk:4.4},
  rural:{laneW:3.1,shoulder:1.2,sidewalk:.6},
  nightcity:{laneW:3.4,shoulder:1.8,sidewalk:4.4}
};

export class Road{
  constructor(){this.profile='downtown';this.setProfile('downtown');}
  setProfile(profile){
    this.profile=profile||'downtown';
    const cfg=ROAD_PROFILES[this.profile]||ROAD_PROFILES.downtown;
    this.laneW=cfg.laneW;this.travelHalf=this.laneW*2;this.shoulder=cfg.shoulder;this.width=this.travelHalf*2+this.shoulder*2;this.sidewalk=cfg.sidewalk;
  }
  centerX(z){
    if(this.profile==='highway')return Math.sin(z*.0016)*3.5;
    if(this.profile==='rural')return Math.sin(z*.0068)*19+Math.sin(z*.018)*4.5;
    if(this.profile==='suburb')return Math.sin(z*.0042)*13+Math.sin(z*.0105)*2;
    if(this.profile==='nightcity')return Math.sin(z*.0032)*4;
    return Math.sin(z*.0025)*2.5;
  }
  dx(z){
    if(this.profile==='highway')return Math.cos(z*.0016)*.0056;
    if(this.profile==='rural')return Math.cos(z*.0068)*.1292+Math.cos(z*.018)*.081;
    if(this.profile==='suburb')return Math.cos(z*.0042)*.0546+Math.cos(z*.0105)*.021;
    if(this.profile==='nightcity')return Math.cos(z*.0032)*.0128;
    return Math.cos(z*.0025)*.00625;
  }
  yaw(z){return Math.atan2(this.dx(z),1);}
  signedCurvature(z){const h=3;const a=this.yaw(z-h),b=this.yaw(z+h);return (b-a)/(2*h);}
  curvature(z){return Math.abs(this.signedCurvature(z));}
  point(z,lateral=0){const d=this.dx(z);const inv=1/Math.hypot(1,d);const nx=inv,nz=-d*inv;return new globalThis.THREE.Vector3(this.centerX(z)+nx*lateral,0,z+nz*lateral);}
  laneName(lat){if(lat<0)return'oncoming lane';return lat<this.laneW?'inner lane':'outer lane';}
  crossStreetZ(z){const spacing=(this.profile==='downtown'||this.profile==='nightcity')?185:260;const k=Math.round(z/spacing);return k*spacing;}
  distToCrossStreet(z){return Math.abs(z-this.crossStreetZ(z));}
  isRoundaboutZone(z){return this.profile!=='highway'&&this.profile!=='rural'&&(Math.abs(z-1200)<60);}
  roundaboutCenter(z){return this.point(1200,this.travelHalf+6);}
  roundaboutRadius(){return this.profile==='suburb'?11.2:12.4;}
}

if(typeof window!=='undefined')window.SimRoad={Road,ROAD_PROFILES};
