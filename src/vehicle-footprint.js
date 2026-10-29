const MODEL_LATERAL_LIMIT={
  sedan:2.25,compact:2.18,sport:2.28,coupe:2.28,luxury:2.36,electric:2.26,taxi:2.25,
  suv:2.42,crossover:2.38,pickup:2.55,van:2.56,minivan:2.55,delivery:2.68,
  boxtruck:2.75,semi:3.05,motorcycle:1.25,emergency:2.30
};
const MODEL_LONGITUDINAL_CLEARANCE={
  sedan:4.60,compact:4.40,sport:4.70,coupe:4.60,luxury:5.00,electric:4.80,taxi:4.60,
  suv:5.00,crossover:4.90,pickup:5.30,van:5.80,minivan:5.60,delivery:6.20,
  boxtruck:7.20,semi:8.80,motorcycle:2.50,emergency:4.60,bus:9.50,cyclist:2.20
};

export function collisionLateralLimit(actor){
  if(!actor)return 1.8;
  if(actor.type==='cone')return 1.75;
  if(actor.type==='pedestrian')return 1.8;
  if(actor.type==='cyclist')return 2.55;
  if(actor.type==='roadblock')return 2.85;
  if(actor.type==='worker')return 1.8;
  const modelLimit=MODEL_LATERAL_LIMIT[actor.modelType];
  if(actor.type==='parked')return Math.max(2.35,modelLimit||2.35);
  if(actor.type==='bus')return 2.90;
  if(actor.type==='car')return modelLimit||2.25;
  return 2.0;
}

export function vehicleFollowingClearance(actor,lead=null){
  const fallback=actor?.type==='bus'?9.5:actor?.type==='cyclist'?2.2:4.6;
  const actorLength=MODEL_LONGITUDINAL_CLEARANCE[actor?.modelType]||fallback;
  const leadFallback=lead?.type==='bus'?9.5:lead?.type==='cyclist'?2.2:4.6;
  const leadLength=MODEL_LONGITUDINAL_CLEARANCE[lead?.modelType]||leadFallback;
  return Math.max(actorLength,leadLength);
}

if(typeof window!=='undefined')window.SimVehicleFootprint={collisionLateralLimit,vehicleFollowingClearance,modelLateralLimits:MODEL_LATERAL_LIMIT,modelLongitudinalClearance:MODEL_LONGITUDINAL_CLEARANCE};
