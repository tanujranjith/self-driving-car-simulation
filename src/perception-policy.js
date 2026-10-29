const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function perceptionPolicy(){
  const host=this;
  const cfg=host.sensorConfig||{};
  const health=host.sensorHealth||{};
  const weather=host.env?.weather||'clear';
  const visibility=Number(host.env?.visibility)||620;
  const noise=clamp((Number(cfg.noise)||0)/100,0,1);
  const camera=cfg.camera?clamp(Number.isFinite(health.lens)?health.lens:1,0,1):0;
  const lidar=cfg.lidar?clamp(Number.isFinite(health.lidar)?health.lidar:1,0,1):0;
  const radar=cfg.radar?clamp(Number.isFinite(health.lidar)?Math.max(.45,health.lidar):1,0,1):0;
  const gps=cfg.gps?clamp(Number.isFinite(health.gps)?health.gps:1,0,1):0;
  const active=[camera,lidar,radar,gps].filter(v=>v>0).length;
  let confidence=camera*.55+lidar*.20+radar*.20+gps*.15;
  if(!active)confidence=.24;
  confidence*=clamp(1-noise*.34,.58,1);
  if(host.sensorDropout?.())confidence*=.46;
  const visibilityFactor=clamp(visibility/620,.34,1);
  confidence=clamp(confidence*visibilityFactor,.12,1);
  const speedFactor=confidence>=.78?1:confidence>=.62?.92:confidence>=.44?.78:.58;
  const rangeFactor=clamp(.56+confidence*.44,.56,1);
  const sensorRange=Math.max(30,Number(cfg.range)||125);
  const trackingRange=Math.round(clamp(sensorRange*rangeFactor,30,sensorRange));
  const controlRange=Math.round(clamp(sensorRange*(.68+confidence*.32),34,sensorRange));
  const state=host.sensorDropout?.()?'dropout':confidence<.44?'degraded':confidence<.78?'cautious':'nominal';
  return {confidence:+confidence.toFixed(3),state,speedFactor,rangeFactor,trackingRange,controlRange,activeSensors:active,weather,visibility:Math.round(visibility),dropout:!!host.sensorDropout?.()};
}

if(typeof window!=='undefined')window.SimPerception={perceptionPolicy};
