const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const SCENARIO_PRESETS={
  'free-drive':{label:'Free drive',distance:0,objective:'Explore the streamed route.'},
  'safe-merge':{label:'Safe merge',distance:220,objective:'Pass a slower vehicle with a clean, signaled merge.',requiredEvent:'laneChanges'},
  crosswalk:{label:'Crosswalk yield',distance:180,objective:'Yield to the crossing pedestrian, then continue safely.',requiredEvent:'pedestrianYields'},
  'cyclist-pass':{label:'Cyclist pass',distance:190,objective:'Give the cyclist space, signal, and complete a clean pass.',requiredEvent:'cyclistPasses'},
  construction:{label:'Construction bypass',distance:260,objective:'Navigate the lane closure without contact or a departure.'},
  'emergency-yield':{label:'Emergency pull-over',distance:180,objective:'Detect the approaching emergency vehicle, yield right, and continue safely.',requiredEvent:'emergencyYields'},
  'signalized-approach':{label:'Signalized approach',distance:100,objective:'Read the signal, stop behind the line, then proceed without a rule violation.',requiredEvent:'signalStops'},
  'pass-return':{label:'Pass and return',distance:220,objective:'Pass a slower lead vehicle, then safely return to the original lane.',requiredEvent:'passReturns'},
  'rail-crossing-stop':{label:'Rail crossing stop',distance:470,objective:'Approach the active crossing, stop behind the gates, then continue safely.',requiredEvent:'railCrossingStops'}
};

export class ScenarioEvaluator{
  constructor(){this.configure('free-drive',0);}
  configure(id='free-drive',startProgress=0){
    const preset=SCENARIO_PRESETS[id]||SCENARIO_PRESETS['free-drive'];
    this.id=SCENARIO_PRESETS[id]?id:'free-drive';
    this.label=preset.label;this.objective=preset.objective;this.startProgress=startProgress;
    this.done=this.id==='free-drive';this.failed=false;this.status=this.done?'READY':'RUNNING';this.elapsed=0;this.progress=0;this.score=100;this.lastReason='';this.scoreBreakdown={safety:100,comfort:100,progress:this.done?100:0,objective:this.done?100:0};this.metrics={collisions:0,laneDepartures:0,hardBrakes:0,nearMisses:0,ruleViolations:0,signalStops:0,laneChanges:0,pedestrianYields:0,cyclistPasses:0,emergencyYields:0,passReturns:0,railCrossingStops:0,minTtc:null,maxJerk:0,routeError:0,interventions:0};
    return this.snapshot();
  }
  update(input={}){
    const progress=Math.max(0,(input.progress??0)-this.startProgress);this.progress=progress;this.elapsed=input.elapsed||this.elapsed;
    const collisions=input.collisions||0,laneDepartures=input.laneDepartures||0,hardBrakes=input.hardBrakes||0;
    const comfortPenalty=input.comfortPenalty||0,nearMisses=input.nearMisses||0;
    const laneChanges=input.laneChanges||0,pedestrianYields=input.pedestrianYields||0,cyclistPasses=input.cyclistPasses||0,emergencyYields=input.emergencyYields||0,passReturns=input.passReturns||0,railCrossingStops=input.railCrossingStops||0;
    const signalStops=input.signalStops||0,ruleViolations=input.ruleViolations||0;
    const minTtc=Number.isFinite(input.minTtc)?Number(input.minTtc):null;
    const maxJerk=Number.isFinite(input.maxJerk)?Number(input.maxJerk):0;
    const routeError=Number.isFinite(input.routeError)?Number(input.routeError):0;
    const interventions=input.interventions||0;
    this.metrics={collisions,laneDepartures,hardBrakes,nearMisses,ruleViolations,signalStops,laneChanges,pedestrianYields,cyclistPasses,emergencyYields,passReturns,railCrossingStops,minTtc,maxJerk,routeError,interventions};
    const preset=SCENARIO_PRESETS[this.id]||SCENARIO_PRESETS['free-drive'];
    const safety=clamp(100-collisions*100-laneDepartures*45-ruleViolations*70-nearMisses*12,0,100);
    const comfort=clamp(100-hardBrakes*8-comfortPenalty*2.2,0,100);
    const progressScore=preset.distance?clamp(progress/preset.distance*100,0,100):100;
    const objectiveScore=this.id==='free-drive'?100:(preset.requiredEvent?((this.metrics[preset.requiredEvent]||0)>0?100:0):(progress>=preset.distance?100:0));
    this.scoreBreakdown={safety:+safety.toFixed(1),comfort:+comfort.toFixed(1),progress:+progressScore.toFixed(1),objective:+objectiveScore.toFixed(1)};
    this.score=clamp(100-collisions*36-laneDepartures*15-hardBrakes*5-nearMisses*4-ruleViolations*16-comfortPenalty*2.2,0,100);
    if(this.id!=='free-drive'){
      if(collisions>0){this.failed=true;this.status='FAILED';this.lastReason='Contact detected';}
      else if(ruleViolations>0){this.failed=true;this.status='FAILED';this.lastReason='Traffic rule violation';}
      else if(laneDepartures>0){this.failed=true;this.status='FAILED';this.lastReason='Lane departure detected';}
      else if(this.done)this.status='COMPLETE';
      else if(progress>=((SCENARIO_PRESETS[this.id]||{}).distance||0)){
        const maneuverMet=preset.requiredEvent?((this.metrics[preset.requiredEvent]||0)>0):true;
        if(maneuverMet){this.done=true;this.status='COMPLETE';this.lastReason='Maneuver and objective distance reached';}
      }
      else if(this.status!=='FAILED')this.status='RUNNING';
    }
    return this.snapshot();
  }
  snapshot(){
    const preset=SCENARIO_PRESETS[this.id]||SCENARIO_PRESETS['free-drive'];
    return {id:this.id,label:this.label,status:this.status,objective:this.objective,progress:+this.progress.toFixed(1),targetDistance:preset.distance,requiredEvent:preset.requiredEvent||null,elapsed:+this.elapsed.toFixed(2),score:+this.score.toFixed(1),scoreBreakdown:this.scoreBreakdown,metrics:this.metrics,done:this.done,failed:this.failed,reason:this.lastReason};
  }
}

if(typeof window!=='undefined')window.SimScenario={ScenarioEvaluator,SCENARIO_PRESETS};
