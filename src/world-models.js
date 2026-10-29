export const WORLD_MODEL_MANIFEST = {
  'building-modern': { family: 'environment', quality: 'premium-procedural', source: 'Procedural glass-and-steel tower' },
  'building-brick': { family: 'environment', quality: 'premium-procedural', source: 'Procedural brick loft block' },
  'building-residential': { family: 'environment', quality: 'premium-procedural', source: 'Procedural residential block' },
  'building-podium': { family: 'environment', quality: 'premium-procedural', source: 'Procedural podium building' },
  'mobility-hub': { family: 'environment', quality: 'premium-procedural', source: 'Procedural multi-level mobility hub' },
  'building-suburban': { family: 'environment', quality: 'premium-procedural', source: 'Procedural suburban building' },
  storefront: { family: 'environment', quality: 'premium-procedural', source: 'Procedural storefront' },
  'streetlight-urban': { family: 'environment', quality: 'premium-procedural', source: 'Procedural urban streetlight' },
  'tree-deciduous': { family: 'environment', quality: 'premium-procedural', source: 'Procedural deciduous tree' },
  'tree-pine': { family: 'environment', quality: 'premium-procedural', source: 'Procedural pine tree' },
  'tree-autumn': { family: 'environment', quality: 'premium-procedural', source: 'Procedural autumn tree' },
  bench: { family: 'environment', quality: 'premium-procedural', source: 'Procedural public bench' },
  planter: { family: 'environment', quality: 'premium-procedural', source: 'Procedural street planter' },
  bollard: { family: 'environment', quality: 'premium-procedural', source: 'Procedural sidewalk bollard' },
  hydrant: { family: 'environment', quality: 'premium-procedural', source: 'Procedural fire hydrant' },
  'bus-stop': { family: 'environment', quality: 'premium-procedural', source: 'Procedural transit shelter' },
  'roadside-post': { family: 'environment', quality: 'premium-procedural', source: 'Procedural roadside delineator' },
  'construction-barricade': { family: 'environment', quality: 'premium-procedural', source: 'Procedural construction barricade' },
  'parking-meter': { family: 'environment', quality: 'premium-procedural', source: 'Procedural parking meter' },
  'bike-rack': { family: 'environment', quality: 'premium-procedural', source: 'Procedural sidewalk bike rack' },
  'traffic-camera': { family: 'environment', quality: 'premium-procedural', source: 'Procedural traffic camera' },
  mailbox: { family: 'environment', quality: 'premium-procedural', source: 'Procedural suburban mailbox' },
  'utility-box': { family: 'environment', quality: 'premium-procedural', source: 'Procedural utility cabinet' },
  'crosswalk-sign': { family: 'environment', quality: 'premium-procedural', source: 'Procedural fluorescent crosswalk sign' },
  'pedestrian-signal': { family: 'environment', quality: 'premium-procedural', source: 'Procedural pedestrian walk signal' },
  'ev-charger': { family: 'environment', quality: 'premium-procedural', source: 'Procedural EV charging kiosk' },
  'street-sign': { family: 'environment', quality: 'premium-procedural', source: 'Procedural street-name sign' },
  billboard: { family: 'environment', quality: 'premium-procedural', source: 'Procedural roadside billboard' },
  'service-station': { family: 'environment', quality: 'premium-procedural', source: 'Procedural fuel and service station' },
  roundabout: { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural raised-island roundabout' },
  'bridge-overpass': { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural grade-separated highway overpass' },
  'highway-gantry': { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural highway directional gantry' },
  'tunnel-portal': { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural lit highway/rural tunnel portal' },
  'guardrail-segment': { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural W-beam guardrail segment' },
  'water-tower': { family: 'environment', quality: 'premium-procedural', source: 'Procedural rural water tower landmark' },
  'wind-turbine': { family: 'environment', quality: 'premium-procedural', source: 'Procedural renewable-energy landmark' },
  'rail-crossing': { family: 'road-infrastructure', quality: 'premium-procedural', source: 'Procedural gated rural rail crossing' }
};

export const WORLD_MODEL_STYLES = {
  downtown: ['building-modern', 'building-brick', 'building-residential', 'building-podium', 'mobility-hub'],
  nightcity: ['building-modern', 'building-modern', 'building-podium', 'building-brick', 'mobility-hub'],
  suburb: ['building-residential', 'building-suburban', 'building-brick'],
  highway: [],
  rural: []
};

export const WORLD_PROP_STYLES = {
  downtown: ['bench', 'planter', 'bollard', 'hydrant', 'bus-stop', 'parking-meter', 'bike-rack', 'traffic-camera', 'ev-charger', 'street-sign', 'construction-barricade'],
  nightcity: ['planter', 'bollard', 'bus-stop', 'hydrant', 'parking-meter', 'traffic-camera', 'ev-charger', 'street-sign', 'construction-barricade'],
  suburb: ['bench', 'planter', 'hydrant', 'mailbox', 'utility-box', 'ev-charger', 'street-sign', 'service-station', 'construction-barricade', 'rail-crossing'],
  highway: ['roadside-post', 'traffic-camera', 'billboard', 'service-station', 'bridge-overpass', 'wind-turbine'],
  rural: ['roadside-post', 'tree-pine', 'tree-deciduous', 'utility-box', 'water-tower', 'wind-turbine', 'rail-crossing']
};

export function pickWorldModel(map = 'downtown', seed = 0, role = 'building') {
  const source = role === 'building' ? WORLD_MODEL_STYLES[map] : WORLD_PROP_STYLES[map];
  const choices = source?.length ? source : (role === 'building' ? ['building-suburban'] : ['roadside-post']);
  const n = Math.abs(Math.floor(Number(seed) || 0));
  return choices[n % choices.length];
}

if (typeof window !== 'undefined') {
  window.SimWorldModels = { WORLD_MODEL_MANIFEST, WORLD_MODEL_STYLES, WORLD_PROP_STYLES, pickWorldModel };
}
