const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const MPH_TO_MS=.44704;
const smoothLaneBlend=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
const followingClearance=(actor,lead)=>globalThis.SimVehicleFootprint?.vehicleFollowingClearance?.(actor,lead)||(actor?.modelType==='semi'||lead?.modelType==='semi'?8.8:actor?.type==='bus'||lead?.type==='bus'?9.5:actor?.type==='cyclist'||lead?.type==='cyclist'?2.2:4.6);

function mark(host){
  if(host)host.trafficBehaviorSource='module';
  return host;
}

export function trafficModelTuning(modelId,type){
  const host=mark(this);
  const tuning={
    sedan:{v0:24.5,accel:2.25,brake:3.9,time:1.35,gap:4.5,pass:true},
    suv:{v0:22.8,accel:2.05,brake:3.75,time:1.55,gap:5.2,pass:true},
    crossover:{v0:22.6,accel:2.12,brake:3.85,time:1.48,gap:5.0,pass:true},
    pickup:{v0:22.5,accel:2.0,brake:3.6,time:1.6,gap:5.0,pass:true},
    compact:{v0:23.0,accel:2.1,brake:4.0,time:1.25,gap:4.1,pass:true},
    sport:{v0:27.0,accel:2.8,brake:4.3,time:1.05,gap:3.8,pass:true,preferredStyle:'assertive'},
    coupe:{v0:28.0,accel:2.95,brake:4.45,time:1.08,gap:3.9,pass:true,preferredStyle:'assertive',laneRate:1.12,jerk:7.2},
    luxury:{v0:25.2,accel:2.55,brake:4.35,time:1.30,gap:4.8,pass:true},
    electric:{v0:25.5,accel:3.0,brake:4.5,time:1.22,gap:4.4,pass:true},
    taxi:{v0:23.4,accel:2.2,brake:3.8,time:1.45,gap:4.6,pass:true},
    van:{v0:20.5,accel:1.85,brake:3.4,time:1.75,gap:5.4,pass:false},
    boxtruck:{v0:18.2,accel:1.30,brake:2.85,time:2.1,gap:7.8,pass:false},
    semi:{v0:17.4,accel:1.05,brake:2.4,time:2.3,gap:9.2,pass:false},
    motorcycle:{v0:22.8,accel:2.7,brake:4.2,time:1.15,gap:3.7,pass:true,preferredStyle:'assertive'},
    delivery:{v0:19.0,accel:1.55,brake:3.2,time:1.9,gap:5.8,pass:false,preferredStyle:'cautious'},
    minivan:{v0:21.0,accel:1.95,brake:3.55,time:1.62,gap:5.2,pass:true,laneRate:.74,jerk:4.8},
    emergency:{v0:29.0,accel:3.2,brake:4.8,time:1.0,gap:3.0,pass:true,preferredStyle:'assertive'},
    bus:{v0:15.5,accel:1.55,brake:2.7,time:1.9,gap:7.5,pass:false},
    cyclist:{v0:7.4,accel:1.15,brake:2.1,time:1.6,gap:3.0,pass:false}
  }[modelId];
  if(tuning)return tuning;
  if(type==='bus')return {v0:15.5,accel:1.55,brake:2.7,time:1.9,gap:7.5,pass:false};
  if(type==='cyclist')return {v0:7.4,accel:1.15,brake:2.1,time:1.6,gap:3.0,pass:false};
  return {v0:24.5,accel:2.25,brake:3.9,time:1.35,gap:4.5,pass:true};
}

export function trafficLead(actor,maxDist=80){
  const host=mark(this);
  let lead=null;
  for(const other of host.actors){
    if(other===actor||other.oncoming||!other.moving)continue;
    const dz=other.z-actor.z;
    if(dz<=0||dz>maxDist||Math.abs(other.lateral-actor.lateral)>1.75)continue;
    if(!lead||dz<lead.distance)lead={actor:other,distance:dz,clearanceM:followingClearance(actor,other)};
  }
  return lead;
}

export function trafficLaneSafety(actor,lane,opts={}){
  const host=mark(this);
  const aheadNeed=opts.aheadNeed??22;
  const rearNeed=opts.rearNeed??16;
  const sideNeed=opts.sideNeed??6;
  let aheadClear=120,rearClear=90,sideClear=40,minTtc=Infinity,blocked=false,reason='clear';
  const reactionTime=Number.isFinite(actor.reactionTime)?actor.reactionTime:.9;
  for(const other of host.actors){
    if(!other||other===actor||other.oncoming)continue;
    const dz=other.z-actor.z;
    const latGap=Math.abs(other.lateral-lane);
    if(latGap<1.9){
      if(dz>=0){
        aheadClear=Math.min(aheadClear,dz);
        const movingMergeOk=other.moving&&other.type==='car'&&dz>Math.max(10,aheadNeed*.7)&&other.speed>=actor.speed*.55;
        if(dz<aheadNeed&&!movingMergeOk){blocked=true;reason=`${other.type} ahead`;}
        const closing=(actor.speed||0)-(other.speed||0);
        if(other.moving&&closing>.2){
          const ttc=dz/closing;
          minTtc=Math.min(minTtc,ttc);
          if(ttc<Math.max(2.2,reactionTime+.65)&&!movingMergeOk){blocked=true;reason=`${other.type} closing ahead`;}
        }
      }else{
        rearClear=Math.min(rearClear,Math.abs(dz));
        if(Math.abs(dz)<rearNeed){blocked=true;reason=`${other.type} behind`;}
      }
    }
    const swept=Math.abs(other.lateral-(actor.lateral+lane)*.5);
    if(Math.abs(dz)<sideNeed&&swept<Math.max(2.15,host.collisionLateralLimit(other))){
      sideClear=Math.min(sideClear,Math.abs(dz));blocked=true;reason='side conflict';
    }
  }
  const ttcPenalty=Number.isFinite(minTtc)?Math.max(0,7.5-minTtc)*4.2:0;
  const score=aheadClear*1.05+rearClear*.85+sideClear*.55-Math.abs(lane-actor.lateral)*3-ttcPenalty;
  return {safe:!blocked,score,reason,aheadClear,rearClear,sideClear,ttc:Number.isFinite(minTtc)?minTtc:null};
}

export function trafficCurvePreview(actor,tuning=null){
  const host=mark(this);
  if(!actor||!host.road?.curvature)return null;
  const profile=tuning||trafficModelTuning.call(host,actor.modelType,actor.type);
  const model=actor.modelType||actor.type||'sedan';
  const curveFactor={
    sedan:1.00,compact:1.04,sport:1.10,coupe:1.12,luxury:.98,electric:1.02,taxi:.99,
    suv:.88,crossover:.91,pickup:.82,van:.78,minivan:.84,delivery:.76,boxtruck:.70,semi:.62,
    motorcycle:1.08,bus:.72,cyclist:.86,emergency:1.04
  }[model]??(actor.type==='bus'?.72:actor.type==='cyclist'?.86:1);
  const styleFactor=actor.driverStyle==='cautious'?.92:actor.driverStyle==='assertive'?1.03:1;
  const grip=clamp(Number(host.surfaceFriction)||1,.22,1.08);
  const lateralAccel=clamp(1.65*grip*curveFactor*styleFactor,.72,2.45);
  const comfortableBrake=Math.max(1.25,(profile.brake||3.8)*grip);
  const offsets=[14,26,40,58,82,110];
  let selected=null;
  for(const distance of offsets){
    const curvature=Math.abs(Number(host.road.curvature(actor.z+distance))||0);
    if(curvature<.0004)continue;
    const cornerCap=Math.sqrt(lateralAccel/curvature)*.88;
    const entryBuffer=model==='semi'?10.5:actor.type==='bus'?8.5:actor.type==='cyclist'?3.5:5.5;
    const available=Math.max(0,distance-entryBuffer);
    const approachCap=Math.sqrt(cornerCap*cornerCap+2*comfortableBrake*available);
    const capMps=Math.min(profile.v0||30,approachCap);
    if(!selected||capMps<selected.capMps)selected={distance,curvature,cornerCap,capMps};
  }
  const speed=Math.max(0,Number(actor.speed)||0);
  if(!selected){
    actor.curvePreviewState='clear';actor.curvePreviewDistance=null;actor.curvePreviewCapMps=null;actor.curvePreviewMph=null;
    return {state:'clear',capMps:null,capMph:null,distance:null,curvature:0,lateralAccel,brakingDistanceM:+(speed*speed/(2*comfortableBrake)).toFixed(2)};
  }
  const brakingDistance=speed*speed/(2*comfortableBrake);
  const margin=Math.max(.35,speed*.035);
  const state=speed>selected.capMps+margin?'braking':selected.distance<32?'corner-approach':'preview';
  const result={state,capMps:selected.capMps,capMph:selected.capMps/MPH_TO_MS,distance:selected.distance,curvature:selected.curvature,lateralAccel,brakingDistanceM:brakingDistance};
  actor.curvePreviewState=state;
  actor.curvePreviewDistance=selected.distance;
  actor.curvePreviewCapMps=selected.capMps;
  actor.curvePreviewMph=selected.capMps/MPH_TO_MS;
  actor.curvePreviewCurvature=selected.curvature;
  return result;
}

export function assignTrafficTurnIntents(){
  const host=mark(this);
  if(!host.controls?.length)return;
  const lanes=host.travelLanes();
  for(const actor of host.actors){
    if(!actor||actor.crossTraffic||actor.oncoming||!actor.moving||!['car','bus'].includes(actor.type))continue;
    let next=null;
    for(const control of host.controls){
      if(!control||control.type==='speedlimit')continue;
      const distance=control.z-actor.z;
      if(distance<=8||distance>190)continue;
      if(!next||distance<next.distance)next={control,distance};
    }
    if(!next)continue;
    if(!actor.turnIntentAssigned){
      const roll=host.seededRand(actor.z*.071+actor.lateral*1.7+host.mapType.length*13.1);
      actor.turnIntent=roll<.16?'right':roll<.29?'left':'through';
      actor.turnIntentAssigned=true;
    }
    if(actor.turnIntent!=='through'&&!actor.turnControlId)actor.turnControlId=next.control.id;
    if(!actor.turnControlId&&actor.turnIntent==='through')actor.turnControlId=next.control.id;
    if(actor.turnIntent!=='through'&&Number.isFinite(actor.turnTargetLane))continue;
    if(actor.turnIntent==='through')actor.turnState='cruise';
    if(actor.turnIntent!=='through'&&!Number.isFinite(actor.turnTargetLane)){
      actor.turnTargetLane=actor.turnIntent==='right'?lanes[1]:lanes[0];
    }
  }
}

export function trafficTurnPlan(actor){
  const host=mark(this);
  if(!actor||actor.crossTraffic||actor.oncoming||!actor.moving||!['car','bus'].includes(actor.type)||actor.turnIntent==='through'){
    if(actor)actor.turnPlanActive=false;
    return null;
  }
  let control=host.controls.find(c=>c.id===actor.turnControlId);
  if(!control||control.type==='speedlimit'){
    control=host.controls.filter(c=>c.type!=='speedlimit'&&c.z>actor.z+8).sort((a,b)=>a.z-b.z)[0];
    if(control)actor.turnControlId=control.id;
  }
  if(!control){actor.turnPlanActive=false;return null;}
  const stopZ=control.z-11.5;
  const distance=stopZ-actor.z;
  if(distance>58){actor.turnPlanActive=false;actor.turnState='cruise';return null;}
  if(distance<-14){actor.turnPlanActive=false;actor.turnState='completed';actor.turnSignal='none';actor.targetLateral=null;return null;}
  const lanes=host.travelLanes();
  const target=actor.turnIntent==='right'?lanes[1]:lanes[0];
  actor.turnTargetLane=target;
  actor.turnPlanActive=true;
  actor.targetLateral=target;
  actor.turnState=distance>3?'approach':'committed';
  actor.turnSignal=actor.turnIntent;
  return {control,distance,targetLane:target,intent:actor.turnIntent,state:actor.turnState};
}

export function trafficControlPlan(actor,dt){
  const host=mark(this);
  if(!actor||!actor.moving||actor.type==='parked'||!['car','bus'].includes(actor.type))return null;
  const direction=actor.oncoming?-1:1;
  let nearest=null;
  for(const c of host.controls){
    if(!c||!['stoplight','stopsign'].includes(c.type))continue;
    const stopZ=c.z+(actor.oncoming?11.5:-11.5);
    const distance=(stopZ-actor.z)*direction;
    if(distance<-3){
      if(actor.controlServedId===c.id)actor.controlServedId=null;
      continue;
    }
    if(distance<0||distance>110)continue;
    if(c.type==='stopsign'&&actor.controlServedId===c.id)continue;
    if(!nearest||distance<nearest.distance)nearest={control:c,stopZ,distance};
  }
  if(!nearest){
    actor.controlState='cruise';actor.controlTargetId=null;actor.controlTargetSpeed=null;actor.controlStopHold=0;return null;
  }
  const control=nearest.control;
  const state=control.type==='stoplight'?host.lightState(control):'stop';
  const tuning=trafficModelTuning.call(host,actor.modelType,actor.type);
  const grip=Math.max(.42,host.surfaceGripValue());
  const brake=Math.max(1.2,tuning.brake*grip);
  const buffer=actor.modelType==='semi'?3.3:actor.type==='bus'?2.4:1.75;
  const stopDistance=(actor.speed||0)*(actor.speed||0)/(2*brake)+(actor.speed||0)*.35+buffer;
  const yellowDilemma=state==='yellow'&&(actor.speed||0)>2.2&&nearest.distance<=stopDistance+2.5;
  const mustStop=control.type==='stopsign'?actor.controlServedId!==control.id:(state==='red'||(state==='yellow'&&!yellowDilemma));
  actor.controlTargetId=control.id;
  actor.controlState=mustStop?state:(state==='green'?'green':yellowDilemma?'yellow-go':'cruise');
  if(!mustStop){actor.controlTargetSpeed=null;actor.controlStopHold=0;return {hold:false,targetSpeed:null,control,state,yellowDilemma};}
  const remaining=Math.max(0,nearest.distance-buffer);
  const target=nearest.distance<=buffer+1.2?0:Math.min(actor.desiredSpeed||tuning.v0,Math.sqrt(Math.max(0,2*brake*remaining)));
  actor.controlTargetSpeed=target;
  if(nearest.distance<=buffer+1.2&&actor.speed<1.35){
    actor.z=nearest.stopZ-direction*buffer;actor.speed=0;actor.accel=0;actor.controlStopHold=(actor.controlStopHold||0)+dt;
    if(control.type==='stopsign'&&actor.controlStopHold>=.85){
      actor.controlServedId=control.id;actor.controlStopHold=0;actor.controlState='proceed';actor.controlTargetSpeed=Math.min(actor.desiredSpeed||tuning.v0,8);
      return {hold:false,targetSpeed:actor.controlTargetSpeed,control,state:'proceed'};
    }
    return {hold:true,targetSpeed:0,control,state};
  }
  return {hold:false,targetSpeed:target,control,state,yellowDilemma};
}

export function trafficSpeedLimitPlan(actor){
  const host=mark(this);
  if(!actor||!actor.moving||!Array.isArray(host.controls))return null;
  const direction=actor.oncoming?-1:1;
  let upcoming=null;
  let latest=null;
  for(const control of host.controls){
    if(!control||control.type!=='speedlimit'||!Number.isFinite(control.limit))continue;
    const distance=(control.z-actor.z)*direction;
    if(distance>0&&distance<=220&&(!upcoming||distance<upcoming.distance))upcoming={control,distance};
    if(distance<=0&&(!latest||distance>latest.distance))latest={control,distance};
  }
  const active=latest?.control||null;
  const target=active||upcoming?.control||null;
  if(!target){
    actor.speedLimitMph=null;actor.speedLimitState='none';actor.speedLimitDistance=null;actor.speedLimitCapMps=null;
    return null;
  }
  const approaching=!!upcoming&&(!active||upcoming.control.id!==active.id);
  const limitMph=Number(target.limit);
  actor.speedLimitMph=limitMph;
  actor.speedLimitState=approaching?'approaching':'obeying';
  actor.speedLimitDistance=approaching?+upcoming.distance.toFixed(1):0;
  actor.speedLimitControlId=target.id;
  actor.speedLimitCapMps=limitMph*MPH_TO_MS;
  return {control:target,limitMph,state:actor.speedLimitState,distance:actor.speedLimitDistance,capMps:actor.speedLimitCapMps};
}

export function trafficPedestrianLead(actor,maxDist=64){
  const host=mark(this);
  if(!actor||!actor.moving||actor.crossTraffic)return null;
  const direction=actor.oncoming?-1:1;
  let nearest=null;
  for(const pedestrian of host.actors){
    if(!pedestrian||pedestrian===actor||!['pedestrian','worker'].includes(pedestrian.type))continue;
    const distance=(pedestrian.z-actor.z)*direction;
    if(distance<0||distance>maxDist)continue;
    const startRange=pedestrian.crossingStartRange??-999;
    if(!pedestrian.crossingStarted&&startRange<0)continue;
    if(!pedestrian.crossingStarted&&distance>startRange+12)continue;
    const target=Number.isFinite(pedestrian.crossingTarget)?pedestrian.crossingTarget:pedestrian.lateral;
    const corridorMin=Math.min(pedestrian.lateral,target)-1.05;
    const corridorMax=Math.max(pedestrian.lateral,target)+1.05;
    if(actor.lateral<corridorMin||actor.lateral>corridorMax)continue;
    if(!nearest||distance<nearest.distance)nearest={actor:pedestrian,distance};
  }
  return nearest;
}

export function updateBusStopBehavior(actor,dt){
  const host=mark(this);
  if(!actor||actor.type!=='bus'||actor.oncoming||host.mapType==='highway'||host.mapType==='rural')return null;
  const spacing=96,offset=7;
  if(!Number.isFinite(actor.nextBusStopZ)){
    actor.nextBusStopZ=Math.ceil((actor.z-offset+.01)/spacing)*spacing+offset;
    if(actor.nextBusStopZ<=actor.z+6)actor.nextBusStopZ+=spacing;
  }
  if(actor.busSignalTimer>0){
    actor.busSignalTimer=Math.max(0,actor.busSignalTimer-dt);
    if(actor.busSignalTimer<=0)actor.busSignal='none';
  }
  if(actor.busDwell>0){
    actor.busDwell=Math.max(0,actor.busDwell-dt);
    actor.busStopState='dwell';actor.busStopTargetSpeed=0;actor.busSignal='right';
    if(actor.busDwell<=0){
      actor.nextBusStopZ+=spacing;actor.busStopCount=(actor.busStopCount||0)+1;
      actor.busStopState='departing';actor.busStopTargetSpeed=null;actor.busSignal='left';actor.busSignalTimer=1.1;
    }
    return {hold:true};
  }
  const distance=actor.nextBusStopZ-actor.z;
  if(distance<-3){actor.nextBusStopZ+=spacing;actor.busStopState='cruise';actor.busSignal='none';actor.busStopTargetSpeed=null;return null;}
  if(distance<34&&distance>-1.1){
    actor.busStopState='approach';actor.busSignal='right';
    actor.busStopTargetSpeed=clamp(Math.max(0,distance)*.30,.8,Math.max(.8,actor.desiredSpeed||15.5));
    if(distance<=1.1&&actor.speed<1.6){
      actor.z=actor.nextBusStopZ;actor.speed=0;actor.accel=0;actor.busDwell=2.6;actor.busStopState='dwell';return {hold:true};
    }
    return {targetSpeed:actor.busStopTargetSpeed};
  }
  actor.busStopState='cruise';actor.busSignal='none';actor.busStopTargetSpeed=null;return null;
}

export function trafficAgentStep(actor,dt){
  const host=mark(this);
  const base=trafficModelTuning.call(host,actor.modelType,actor.type);
  const style=actor.driverStyle||'normal';
  const reactionTime=Number.isFinite(actor.reactionTime)?actor.reactionTime:(style==='cautious'?1.25:style==='assertive'?.68:.92);
  actor.reactionTime=reactionTime;
  const styleMul=style==='cautious'?.86:style==='assertive'?1.06:1;
  const gapMul=style==='cautious'?1.20:style==='assertive'?.84:1;
  const timeMul=style==='cautious'?1.16:style==='assertive'?.86:1;
  const brakeMul=style==='cautious'?1.08:style==='assertive'?1.03:1;
  const profile={...base,v0:(actor.desiredSpeed||base.v0)*styleMul,gap:base.gap*gapMul,time:base.time*timeMul,brake:base.brake*brakeMul};
  const visibility=Number(host.env?.visibility)||620;
  const gripRisk=clamp((1-host.surfaceGripValue())/.82,0,1);
  const visibilityRisk=clamp(1-visibility/620,0,.9);
  const trafficRisk=clamp(gripRisk*.64+visibilityRisk*.36,0,1);
  profile.time*=1+trafficRisk*.70+(host.env?.timeOfDay==='night'?.12:0);
  const speedLimitPlan=trafficSpeedLimitPlan.call(host,actor);
  if(speedLimitPlan?.capMps)profile.v0=Math.min(profile.v0,speedLimitPlan.capMps);
  if(Number.isFinite(actor.busStopTargetSpeed))profile.v0=Math.min(profile.v0,Math.max(0,actor.busStopTargetSpeed));
  if(Number.isFinite(actor.controlTargetSpeed))profile.v0=Math.min(profile.v0,Math.max(0,actor.controlTargetSpeed));
  if(host.mapType==='downtown'||host.mapType==='nightcity')profile.v0*=.78;
  const weatherMul={clear:1,overcast:.98,rain:.88,fog:.78,snow:.68}[host.env.weather]||1;
  profile.v0*=weatherMul;
  if(host.road.isRoundaboutZone(actor.z))profile.v0=Math.min(profile.v0,6.5);
  const curvePreview=trafficCurvePreview.call(host,actor,profile);
  if(curvePreview?.capMps)profile.v0=Math.min(profile.v0,Math.max(3.8,curvePreview.capMps));
  const lead=trafficLead.call(host,actor,72);
  const pedestrianLead=trafficPedestrianLead.call(host,actor,64);
  const speed=Math.max(0,actor.speed||0);
  profile.gap+=trafficRisk*(1.4+speed*.06);
  actor.trafficRisk=trafficRisk;
  actor.followingHeadwaySec=profile.time;
  actor.followingGapM=profile.gap+speed*profile.time;
  let leadTtc=Infinity;
  actor.mergeYielding=false;
  const baseLane=Number.isFinite(actor.baseLateral)?actor.baseLateral:actor.lateral;
  if(!actor.passState)actor.passState='cruise';
  if(actor.turnPlanActive&&actor.passState!=='cruise'){
    actor.passState='cruise';actor.passLeadId=null;actor.passReturnLane=null;
  }
  const scenarioPassActor=host.scenarioPreset==='pass-return'&&actor.scenarioRole==='pass-return-follower'&&actor.scenarioPassPlan&&!actor.scenarioPassComplete;
  const scenarioLead=scenarioPassActor?host.actors.find(other=>other?.scenarioRole==='pass-return-lead'):null;
  if(scenarioPassActor&&actor.passState==='cruise'){
    actor.passState='moving-out';
    actor.targetLateral=host.road.laneW*1.5;
    actor.passLeadId=scenarioLead?.id||actor.passLeadId;
    actor.passReturnLane=baseLane;
    actor.laneChangeCooldown=0;
    actor.turnSignal='right';
  }
  const passLead=actor.passLeadId?host.actors.find(other=>other?.id===actor.passLeadId):null;
  const passCleared=scenarioPassActor?(!scenarioLead||actor.z>scenarioLead.z+8):(!passLead||actor.z>passLead.z+8);
  if(actor.passState==='passing'&&!actor.turnPlanActive&&!actor.laneChangeCooldown&&passCleared){
    const returnSafety=trafficLaneSafety.call(host,actor,baseLane,{aheadNeed:18,rearNeed:15,sideNeed:7});
    const scenarioReturnWindow=scenarioPassActor&&host.simTime>8&&returnSafety.aheadClear>12&&returnSafety.rearClear>12&&returnSafety.sideClear>6;
    if((returnSafety.safe||scenarioReturnWindow)&&Math.abs(actor.lateral-baseLane)>.6){
      actor.targetLateral=baseLane;actor.passState='returning';
      actor.laneChangeCooldown=actor.type==='bus'?4:2.8;
      actor.turnSignal=baseLane>actor.lateral?'right':'left';
    }
  }
  let accel=profile.accel*(1-Math.pow(speed/Math.max(1,profile.v0),4));
  if(lead){
    const gap=Math.max(.8,lead.distance-(lead.clearanceM||followingClearance(actor,lead.actor)));
    const closing=speed-(lead.actor.speed||0);
    leadTtc=closing>.05?gap/closing:Infinity;
    actor.leadTtc=Number.isFinite(leadTtc)?leadTtc:Infinity;
    const desiredGap=profile.gap+speed*profile.time+Math.max(0,speed*closing/(2*Math.sqrt(profile.accel*profile.brake)));
    accel-=profile.accel*Math.pow(desiredGap/gap,2);
    if(leadTtc<reactionTime+.65){
      actor.yielding=true;
      accel-=profile.accel*clamp((reactionTime+.65-leadTtc)/Math.max(.6,reactionTime+1),0,.9);
    }
    if((gap<8&&lead.actor.speed<speed)||leadTtc<reactionTime+.65)actor.yielding=true;
    else actor.yielding=false;
    const wantsPass=gap<Math.max(12,profile.gap+speed*profile.time*.72)&&lead.actor.speed<profile.v0*.82;
    if((actor.type==='car'||actor.type==='bus')&&!actor.oncoming&&wantsPass&&base.pass&&!actor.laneChangeCooldown&&!actor.turnPlanActive&&actor.passState==='cruise'){
      const options=host.travelLanes()
        .filter(l=>Math.abs(l-actor.lateral)>1.2)
        .map(l=>({lane:l,safety:trafficLaneSafety.call(host,actor,l,{aheadNeed:actor.type==='bus'?30:22,rearNeed:actor.type==='bus'?22:15,sideNeed:8})}))
        .filter(candidate=>candidate.safety.safe)
        .sort((a,b)=>b.safety.score-a.safety.score);
      const candidate=options[0];
      if(candidate){
        actor.targetLateral=candidate.lane;actor.laneChangeCooldown=actor.type==='bus'?7:4.5;
        actor.turnSignal=candidate.lane>actor.lateral?'right':'left';
        actor.passState='moving-out';actor.passLeadId=lead.actor.id;actor.passReturnLane=baseLane;
      }
    }
  }else{actor.leadTtc=Infinity;actor.yielding=false;if(!actor.turnPlanActive&&actor.passState==='cruise')actor.turnSignal='none';}
  if(pedestrianLead){
    const pedestrianGap=Math.max(.8,pedestrianLead.distance-(actor.modelType==='semi'?6.8:actor.type==='bus'?4.8:2.4));
    const safePedestrianSpeed=pedestrianGap<=2.2?0:Math.sqrt(Math.max(0,2*profile.brake*Math.max(0,pedestrianGap-2.2)));
    if(safePedestrianSpeed<speed)accel=Math.min(accel,(safePedestrianSpeed-speed)*1.8);
    actor.pedestrianYielding=true;
    actor.crosswalkTargetId=pedestrianLead.actor.id;
    actor.yielding=actor.yielding||pedestrianLead.distance<18;
  }else{
    actor.pedestrianYielding=false;
    actor.crosswalkTargetId=null;
  }
  if(host.laneChangeActive&&Number.isFinite(host.signalIntentLane)&&Math.abs(host.lane-host.signalIntentLane)>.25){
    const mergeGap=actor.z-host.progress;
    const laneGap=Math.abs(actor.lateral-host.signalIntentLane);
    if(laneGap<1.55&&mergeGap>-20&&mergeGap<28){
      const urgency=mergeGap>=0?clamp((20-mergeGap)/16,0,1):clamp((18+mergeGap)/16,0,1);
      if(urgency>.05){
        const courtesyBrake=profile.brake*(mergeGap>=0?.72:.55)*urgency;
        accel=Math.min(accel,-courtesyBrake);
        actor.mergeYielding=true;
        host._mergeCourtesyIds=host._mergeCourtesyIds||new Set();
        if(!host._mergeCourtesyIds.has(actor.id)){host._mergeCourtesyIds.add(actor.id);host.metrics.mergeYields=(host.metrics.mergeYields||0)+1;}
      }
    }
  }
  actor.yielding=actor.yielding||actor.mergeYielding;
  if(actor.laneChangeCooldown)actor.laneChangeCooldown=Math.max(0,actor.laneChangeCooldown-dt);
  const requestedTarget=Number.isFinite(actor.targetLateral)?actor.targetLateral:null;
  const targetLateral=requestedTarget??(Number.isFinite(actor.baseLateral)?actor.baseLateral:actor.lateral);
  const priorLateral=actor.lateral;
  const lateralRate=actor.modelType==='semi'?.38:actor.type==='bus'?.48:actor.type==='cyclist'?.62:(Number(profile.laneRate)|| (style==='assertive'?.95:.78));
  if(requestedTarget===null){
    actor.laneChangeState='cruise';actor.laneChangeProgress=0;actor.laneChangeDuration=0;actor._laneTarget=null;
  }else{
    if(actor._laneTarget===null||!Number.isFinite(actor._laneTarget)||Math.abs(actor._laneTarget-requestedTarget)>.02){
      actor._laneTarget=requestedTarget;
      actor._laneStart=actor.lateral;
      actor._laneChangeElapsed=0;
      actor._laneChangeDuration=Math.max(.85,Math.min(4.2,Math.abs(requestedTarget-actor._laneStart)/Math.max(.38,lateralRate)+.62));
    }
    actor._laneChangeElapsed=Math.min(actor._laneChangeDuration,(actor._laneChangeElapsed||0)+Math.max(0,dt));
    actor.laneChangeProgress=actor._laneChangeDuration?actor._laneChangeElapsed/actor._laneChangeDuration:1;
    actor.laneChangeDuration=actor._laneChangeDuration;
    actor.laneChangeState=actor.laneChangeProgress<.08?'initiating':actor.laneChangeProgress<.92?'blending':'settling';
    actor.lateral=lerp(actor._laneStart,targetLateral,smoothLaneBlend(actor.laneChangeProgress));
  }
  actor.lateralVelocity=(actor.lateral-priorLateral)/Math.max(.001,dt);
  if(Math.abs(actor.lateral-targetLateral)<.08){
    actor.lateral=targetLateral;actor.targetLateral=null;actor._laneTarget=null;actor.laneChangeProgress=1;actor.laneChangeState='settled';
    if(actor.passState==='moving-out')actor.passState='passing';
      else if(actor.passState==='returning'){
        if(actor.passLeadId)host.metrics.passReturns=(host.metrics.passReturns||0)+1;
        actor.passState='cruise';actor.passLeadId=null;actor.passReturnLane=null;
        if(scenarioPassActor)actor.scenarioPassComplete=true;
      }
    if(!actor.turnPlanActive)actor.turnSignal='none';
  }
  const grip=Math.max(.35,host.surfaceGripValue());
  const maxBrake=profile.brake*grip;
  accel=accel<0?Math.max(accel,-maxBrake):Math.min(accel,profile.accel*(1.12-(1-grip)*.3));
  const priorAccel=Number.isFinite(actor.accel)?actor.accel:0;
  const maxJerk=Number(profile.jerk)|| (actor.modelType==='semi'?2.8:actor.type==='bus'?3.6:actor.type==='cyclist'?3.0:style==='assertive'?6.8:style==='cautious'?4.4:5.4);
  const smoothedAccel=clamp(accel,priorAccel-maxJerk*dt,priorAccel+maxJerk*dt);
  actor.accel=smoothedAccel;
  actor.speed=clamp(speed+smoothedAccel*dt,0,profile.v0);
  return actor.speed;
}

if(typeof window!=='undefined')window.SimTraffic={trafficModelTuning,trafficLead,trafficLaneSafety,trafficCurvePreview,assignTrafficTurnIntents,trafficTurnPlan,trafficControlPlan,trafficSpeedLimitPlan,trafficPedestrianLead,updateBusStopBehavior,trafficAgentStep};
