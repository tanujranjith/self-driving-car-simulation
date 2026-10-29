const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class LaneGraph{
  constructor({laneCount=2,laneWidth=3.4}={}){this.laneCount=laneCount;this.laneWidth=laneWidth;this.version=1;this.nodes=[];this.nodeIndex=new Map();}
  laneCenter(index){return (clamp(index,0,this.laneCount-1)+.5)*this.laneWidth;}
  neighbours(index){const lane=Math.round(clamp(index,0,this.laneCount-1));return [lane-1,lane+1].filter(next=>next>=0&&next<this.laneCount);}
  laneIndex(lateral){return Math.round(clamp(lateral/this.laneWidth-.5,0,this.laneCount-1));}
  lanePath(startLane,targetLane){
    const start=Math.round(clamp(startLane,0,this.laneCount-1));
    const target=Math.round(clamp(targetLane,0,this.laneCount-1));
    const path=[start];
    const direction=Math.sign(target-start);
    for(let lane=start+direction;direction&&lane!==target+direction;lane+=direction)path.push(lane);
    return path;
  }
  rebuild({start=0,end=120,step=12}={}){
    this.nodes=[];
    this.nodeIndex.clear();
    const samples=[];
    for(let s=start;s<=end;s+=step)samples.push(s);
    for(let row=0;row<samples.length;row++){
      const s=samples[row];
      for(let lane=0;lane<this.laneCount;lane++){
        const id=`${Math.round(s)}:${lane}`;
        const forward=row<samples.length-1?`${Math.round(samples[row+1])}:${lane}`:null;
        const backward=row>0?`${Math.round(samples[row-1])}:${lane}`:null;
        const lateral=this.neighbours(lane).map(next=>`${Math.round(s)}:${next}`);
        const node={id,s,lane,neighbors:lateral,forward,backward,links:[...lateral,...(forward?[forward]:[])]};
        this.nodes.push(node);this.nodeIndex.set(id,node);
      }
    }
    this.version++;
    return this.nodes;
  }
}

export class RoutePlanner{
  constructor(options={}){this.graph=new LaneGraph(options);this.lastPlan=null;}
  plan({currentLane=0,targetLane=currentLane,horizon=120,step=6,start=3,isLaneChange=false,holdDist=8,bendDist=48,progress=0}={}){
    if(!this.graph.nodes.length)this.graph.rebuild({start:0,end:horizon,step:Math.max(6,step*2)});
    const shift=targetLane-currentLane;
    const currentLaneIndex=this.graph.laneIndex(currentLane);
    const targetLaneIndex=this.graph.laneIndex(targetLane);
    const lanePath=this.graph.lanePath(currentLaneIndex,targetLaneIndex);
    const transitionStart=start+holdDist;
    const transitionEnd=transitionStart+Math.max(1,bendDist);
    const plan={currentLane,targetLane,shift,horizon,step,start,isLaneChange,holdDist,bendDist,progress,currentLaneIndex,targetLaneIndex,lanePath,transitionStart,transitionEnd,graphVersion:this.graph.version};
    this.lastPlan=plan;
    return plan;
  }
  stateAt(progress=this.lastPlan?.progress||0){
    const plan=this.lastPlan;
    if(!plan)return'fallback';
    if(!plan.isLaneChange||Math.abs(plan.shift)<.3)return'settled';
    const distance=progress-(plan.progress||0);
    if(distance<plan.transitionStart)return'approach';
    if(distance<=plan.transitionEnd)return'transition';
    return'settled';
  }
  telemetry({progress=this.lastPlan?.progress||0}={}){
    const plan=this.lastPlan;
    if(!plan)return null;
    return {state:this.stateAt(progress),lanePath:plan.lanePath.slice(),currentLaneIndex:plan.currentLaneIndex,targetLaneIndex:plan.targetLaneIndex,shift:+plan.shift.toFixed(2),transitionStart:+plan.transitionStart.toFixed(1),transitionEnd:+plan.transitionEnd.toFixed(1),graphVersion:plan.graphVersion};
  }
  samples({road,progress,y=.12,plan}={}){
    if(!road||!plan)return [];
    const pts=[];
    for(let z=progress+plan.start;z<=progress+plan.horizon;z+=plan.step){
      const dz=z-progress;
      let blend;
      if(plan.isLaneChange){
        const x=clamp((dz-plan.holdDist)/Math.max(1,plan.bendDist),0,1);
        blend=x*x*x*(x*(x*6-15)+10);
      }else{
        const t=clamp((z-(progress+plan.start))/Math.max(1,plan.horizon-plan.start),0,1);
        blend=t*t*t*(t*(t*6-15)+10)*.44+.04;
      }
      const p=road.point(z,plan.currentLane+plan.shift*blend);p.y=y;pts.push(p);
    }
    const end=road.point(progress+plan.horizon,plan.targetLane);end.y=y;
    if(!pts.length||pts[pts.length-1].distanceTo(end)>1.2)pts.push(end);
    return pts;
  }
}

window.SimRoute={LaneGraph,RoutePlanner};
