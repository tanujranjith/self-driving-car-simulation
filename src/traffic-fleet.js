const FLEET_PALETTES = {
  downtown: ['sedan', 'compact', 'electric', 'taxi', 'crossover', 'sport', 'coupe', 'luxury', 'minivan', 'van', 'delivery', 'suv', 'electric'],
  nightcity: ['sedan', 'electric', 'sport', 'coupe', 'taxi', 'crossover', 'compact', 'luxury', 'minivan', 'van', 'delivery', 'motorcycle', 'electric'],
  suburb: ['sedan', 'suv', 'crossover', 'compact', 'pickup', 'minivan', 'van', 'delivery', 'electric', 'taxi', 'luxury', 'suv'],
  highway: ['sedan', 'suv', 'pickup', 'boxtruck', 'semi', 'sedan', 'compact', 'delivery', 'semi', 'motorcycle', 'van', 'semi'],
  rural: ['pickup', 'sedan', 'suv', 'semi', 'boxtruck', 'van', 'sedan', 'motorcycle', 'semi', 'crossover']
};

const PEDESTRIAN_PALETTE = ['pedestrian', 'pedestrian-business', 'pedestrian-backpack', 'pedestrian-child'];

function paletteIndex(index, length, map = 'downtown') {
  const n = Math.abs(Math.floor(Number(index) || 0));
  // A coprime stride avoids a repeated visual rhythm when the actor pool is
  // spawned at a fixed spacing, while retaining deterministic replays.
  const salt = String(map).length * 3 + 1;
  return (n * 7 + salt) % Math.max(1, length);
}

export function vehicleAssetForActor(type, index = 0, map = this?.mapType || 'downtown') {
  if (type === 'bus') return 'bus';
  if (type === 'cyclist') return 'cyclist';
  if (type === 'worker') return 'worker';
  if (type === 'parked') return Math.abs(Math.floor(Number(index) || 0)) % 3 === 0 ? 'delivery' : 'van';
  if (type !== 'car') return null;
  const palette = FLEET_PALETTES[map] || FLEET_PALETTES.downtown;
  return palette[paletteIndex(index, palette.length, map)];
}

export function pedestrianAssetForActor(index = 0) {
  return PEDESTRIAN_PALETTE[Math.abs(Math.floor(Number(index) || 0)) % PEDESTRIAN_PALETTE.length];
}

export function fleetProfile(map = 'downtown') {
  const palette = FLEET_PALETTES[map] || FLEET_PALETTES.downtown;
  return {
    map,
    palette: [...palette],
    heavyRigCount: palette.filter(id => id === 'semi' || id === 'boxtruck').length,
    electricCount: palette.filter(id => id === 'electric').length,
    serviceVehicleCount: palette.filter(id => id === 'van' || id === 'delivery').length
  };
}

if (typeof window !== 'undefined') window.SimTrafficFleet = { vehicleAssetForActor, pedestrianAssetForActor, fleetProfile };
