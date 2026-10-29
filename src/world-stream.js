export class WorldStreamController{
  constructor({roadAhead=3600,roadBehind=900,cityAhead=1800,cityBehind=700,roadTrigger=1600,cityTrigger=1400}={}){
    this.roadAhead=roadAhead;this.roadBehind=roadBehind;this.cityAhead=cityAhead;this.cityBehind=cityBehind;this.roadTrigger=roadTrigger;this.cityTrigger=cityTrigger;
  }
  windows(progress=0){
    return {
      road:{min:progress-this.roadBehind,max:progress+this.roadAhead,trigger:progress+this.roadTrigger},
      city:{min:progress-this.cityBehind,max:progress+this.cityAhead,trigger:progress+this.cityTrigger}
    };
  }
  needsRoadRebuild(progress,start,end){return !Number.isFinite(end)||!Number.isFinite(start)||progress+this.roadTrigger>end||progress-600<start;}
  needsCityRebuild(progress,start,end){return !Number.isFinite(end)||!Number.isFinite(start)||progress+this.cityTrigger>end||progress-500<start;}
}

export function updateInfiniteWorld(host){
  if(!host)return null;
  host.worldStreamSource='module';
  const windows=host.worldStream?.windows?.(host.progress);
  const aheadRoad=windows?windows.road.max-host.progress:3600;
  const behindRoad=windows?host.progress-windows.road.min:900;
  const roadNeeds=windows?host.worldStream.needsRoadRebuild(host.progress,host.roadWindowStart,host.roadWindowEnd):(!Number.isFinite(host.roadWindowEnd)||host.progress+2200>host.roadWindowEnd||host.progress-600<host.roadWindowStart);
  if(roadNeeds)host.buildRoadStrip(host.progress-behindRoad,host.progress+aheadRoad);
  const aheadCity=windows?windows.city.max-host.progress:1800;
  const behindCity=windows?host.progress-windows.city.min:700;
  const cityNeeds=windows?host.worldStream.needsCityRebuild(host.progress,host.cityWindowStart,host.cityWindowEnd):(!Number.isFinite(host.cityWindowEnd)||host.progress+2600>host.cityWindowEnd||host.progress-500<host.cityWindowStart);
  if(cityNeeds)host.buildCityBlocks(host.progress-behindCity,host.progress+aheadCity);
  if(host.intersectionGroup?.children?.length){
    for(let i=host.intersectionGroup.children.length-1;i>=0;i--){
      const mesh=host.intersectionGroup.children[i];
      if(Number.isFinite(mesh.userData?.intersectionZ)&&mesh.userData.intersectionZ<host.progress-500){
        host.intersectionGroup.remove(mesh);
        if(mesh.geometry)mesh.geometry.dispose();
      }
    }
  }
  if(Array.isArray(host.drawnIntersections))host.drawnIntersections=host.drawnIntersections.filter(z=>z>host.progress-520&&z<host.progress+7200);
  if(Array.isArray(host.drawnRoundabouts))host.drawnRoundabouts=host.drawnRoundabouts.filter(z=>z>host.progress-520&&z<host.progress+7200);
  if(host.mapType!=='highway'&&host.mapType!=='rural'&&1200>host.progress-520&&1200<host.progress+7200)host.drawRoundabout(1200);
  return windows;
}

if(typeof window!=='undefined')window.SimWorld={WorldStreamController,updateInfiniteWorld};
