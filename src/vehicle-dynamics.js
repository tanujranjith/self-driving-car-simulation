const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export class VehicleDynamics{
  constructor(){this.state={lane:0,speed:0,lateralVelocity:0,yawRate:0,steering:0,steerRate:0,steeringAuthority:1,throttle:0,brake:0,accel:0,jerk:0,bodyRoll:0,bodyPitch:0,corneringAccel:0,loadTransfer:0,slipAngle:0,wheelSlip:0,tractionControl:false,absActive:false,stabilityAssist:false};}
  reset(lane=0,speed=0){this.state={lane,speed,lateralVelocity:0,yawRate:0,steering:0,steerRate:0,steeringAuthority:1,throttle:0,brake:0,accel:0,jerk:0,bodyRoll:0,bodyPitch:0,corneringAccel:0,loadTransfer:0,slipAngle:0,wheelSlip:0,tractionControl:false,absActive:false,stabilityAssist:false};return this.state;}
  step(dt,params={}){
    const p={lane:this.state.lane,speed:this.state.speed,targetLane:this.state.lane,targetSpeed:0,surfaceGrip:1,massKg:1700,wheelbase:2.75,maxSteer:.48,maxAccel:3.4,maxBrake:8.5,maxJerk:9.5,steeringResponse:5.5,steeringRate:4.8,lateralResponse:3.4,understeer:.12,downforce:.35,cgHeight:.56,trackWidth:1.60,rollGain:.045,pitchGain:.010,corneringGrip:.92,referenceSpeed:22,drag:.012,rolling:.18,controlSource:'autonomy',steeringInput:null,throttleInput:null,brakeInput:null,...params};
    const s=this.state,h=Math.max(.001,Math.min(.08,dt)),grip=clamp(p.surfaceGrip,.18,1.15),speed=Math.max(0,s.speed),laneError=p.targetLane-p.lane;
    const curveUndersteer=1+Math.max(0,p.understeer)*Math.pow(speed/Math.max(10,p.referenceSpeed),2);
    const curveSteer=Math.atan((Number(p.roadCurvature)||0)*p.wheelbase*curveUndersteer)/Math.max(.12,p.maxSteer);
    const aiSteer=clamp(laneError*1.08-s.lateralVelocity*.52+curveSteer,-1,1),hasHuman=Number.isFinite(p.steeringInput);
    let steerInput=aiSteer;
    if(p.controlSource==='human'&&hasHuman)steerInput=clamp(p.steeringInput,-1,1);
    else if(p.controlSource==='assist'&&hasHuman)steerInput=clamp(aiSteer*.35+p.steeringInput*.65,-1,1);
    const gripSteerFactor=clamp(.76+grip*.24,.76,1);
    // At speed, a full steering command should produce a composed lane change
    // rather than an abrupt yaw spike. Keep low-speed maneuvering responsive,
    // then taper authority smoothly as velocity rises.
    const speedSteerFactor=clamp(1-Math.max(0,speed-8)*.012,.72,1);
    s.steeringAuthority=gripSteerFactor*speedSteerFactor;
    const steerTarget=steerInput*p.maxSteer*s.steeringAuthority;
    const priorSteering=s.steering;
    const steerBlend=1-Math.exp(-p.steeringResponse*(.72+grip*.28)*h);
    const steerRateLimit=Math.max(1.8,Number(p.steeringRate)||4.8)*(.72+grip*.28);
    s.steering=clamp(lerp(s.steering,steerTarget,steerBlend),priorSteering-steerRateLimit*h,priorSteering+steerRateLimit*h);
    s.steerRate=(s.steering-priorSteering)/h;
    const loadAccel=9.81+Math.max(0,p.downforce)*speed*speed/Math.max(1,p.massKg);
    const maxLateralAccel=grip*loadAccel*clamp(p.corneringGrip,.55,1.08);
    const kinematicYaw=(speed/Math.max(.5,p.wheelbase))*Math.tan(s.steering);
    const lowGripUndersteer=Math.max(0,1-grip)*.28*Math.pow(speed/Math.max(10,p.referenceSpeed),2);
    const understeerFactor=1+Math.max(0,p.understeer)*Math.pow(speed/Math.max(10,p.referenceSpeed),2)+lowGripUndersteer;
    const yawDemand=kinematicYaw/understeerFactor;
    const yawLimit=maxLateralAccel/Math.max(2.5,speed);
    const gripLimitedYaw=clamp(yawDemand,-yawLimit,yawLimit);
    s.stabilityAssist=Math.abs(yawDemand)>Math.abs(gripLimitedYaw)+.015;
    s.yawRate=lerp(s.yawRate,gripLimitedYaw,1-Math.exp(-p.lateralResponse*h));
    const desiredLateralVelocity=s.yawRate*Math.max(speed,1.2),maxLatVelocity=(.75+speed*.055)*grip;
    s.lateralVelocity=lerp(s.lateralVelocity,clamp(desiredLateralVelocity,-maxLatVelocity,maxLatVelocity),1-Math.exp(-p.lateralResponse*h));
    s.lane+=s.lateralVelocity*h;
    s.corneringAccel=s.yawRate*speed;
    s.bodyRoll=clamp(-s.corneringAccel*p.rollGain,-.18,.18);
    s.slipAngle=clamp((s.lateralVelocity-desiredLateralVelocity)/Math.max(2,speed),-.28,.28);
    let throttle,brake;
    if(p.controlSource==='human'&&hasHuman){throttle=clamp(Number(p.throttleInput)||0,0,1);brake=clamp(Number(p.brakeInput)||0,0,1);}
    else if(p.controlSource==='assist'&&hasHuman){const desiredError=p.targetSpeed-s.speed;throttle=clamp(Math.max(0,desiredError*.32),0,1)*.38+clamp(Number(p.throttleInput)||0,0,1)*.62;brake=clamp(Math.max(0,-desiredError*.34),0,1)*.38+clamp(Number(p.brakeInput)||0,0,1)*.62;}
    else{const error=p.targetSpeed-s.speed;throttle=clamp(error*.30,0,1);brake=clamp(-error*.46,0,1);}
    s.throttle=lerp(s.throttle,throttle,1-Math.exp(-8*h));
    s.brake=lerp(s.brake,brake,1-Math.exp(-11*h));
    const aero=p.drag*speed*speed,rolling=speed>.2?p.rolling:0,tractionLimit=Math.max(.55,grip*9.81);
    const requestedDrive=s.throttle*p.maxAccel,requestedBrake=s.brake*p.maxBrake;
    s.tractionControl=requestedDrive>tractionLimit*.96&&s.throttle>.08;
    s.absActive=requestedBrake>tractionLimit*.96&&s.brake>.08;
    const drive=Math.min(requestedDrive,tractionLimit*.94);
    const braking=Math.min(requestedBrake,tractionLimit*.94);
    s.wheelSlip=clamp((Math.max(requestedDrive,requestedBrake)/Math.max(.55,tractionLimit)-.82)*.62,0,1);
    let accel=drive-braking-aero-rolling;accel=clamp(accel,-tractionLimit,tractionLimit);
    const previousAccel=Number.isFinite(s.accel)?s.accel:0;
    const jerkLimit=Math.max(2.2,Number(p.maxJerk)||9.5)*Math.sqrt(clamp(grip,.35,1.08));
    accel=clamp(accel,previousAccel-jerkLimit*h,previousAccel+jerkLimit*h);
    const nextSpeed=Math.max(0,speed+accel*h);s.accel=nextSpeed<=0&&accel<0?accel:(nextSpeed-speed)/h;s.jerk=(s.accel-previousAccel)/h;s.speed=nextSpeed;
    s.bodyPitch=clamp(-s.accel*p.pitchGain,-.10,.10);
    s.loadTransfer=clamp((s.corneringAccel*p.cgHeight/Math.max(.5,p.trackWidth)+s.accel*p.cgHeight/Math.max(.5,p.wheelbase))/Math.max(.1,loadAccel),-.95,.95);
    if(s.speed<.05){s.speed=0;s.lateralVelocity*=Math.exp(-h*6);}return s;
  }
}
