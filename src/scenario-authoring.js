const SCENARIO_VERSION = 2;

const finite = (value, fallback = null) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function snapshotActor(actor, progress = 0) {
  return {
    dz: +((actor.z || 0) - progress).toFixed(2),
    lateral: finite(actor.lateral, 0),
    type: actor.type || 'car',
    modelId: actor.modelType || actor.mesh?.userData?.modelId || null,
    moving: actor.moving ? 1 : 0,
    oncoming: actor.oncoming ? 1 : 0,
    speed: finite(actor.speed, 0),
    desiredSpeed: finite(actor.desiredSpeed, null),
    driverStyle: actor.driverStyle || null,
    turnIntent: actor.turnIntent || 'through',
    turnControlId: actor.turnControlId || null,
    scenarioRole: actor.scenarioRole || null,
    crossingTarget: finite(actor.crossingTarget, null),
    crossingStartRange: finite(actor.crossingStartRange, null),
    crossingSpeed: finite(actor.crossingSpeed, null)
  };
}

export function serializeScenario(host) {
  const items = (host?.actors || [])
    .filter(actor => actor?.custom)
    .map(actor => snapshotActor(actor, host.progress || 0));
  return {
    v: SCENARIO_VERSION,
    kind: 'self-driving-sim-scenario',
    context: {
      mapType: host?.mapType || 'downtown',
      weather: host?.env?.weather || 'clear',
      surface: host?.env?.surface || 'dry',
      preset: host?.scenarioPreset || 'free-drive'
    },
    items
  };
}

export function clearCustomActors(host) {
  if (!host) return 0;
  const ids = new Set(host.customActors || []);
  const removed = (host.actors || []).filter(actor => actor?.custom || ids.has(actor?.id));
  for (const actor of removed) {
    host.dynamic?.remove(actor.mesh);
  }
  host.actors = (host.actors || []).filter(actor => !removed.includes(actor));
  host.customActors = [];
  return removed.length;
}

function restoreActor(host, item) {
  if (!host?.addActor || !item) return null;
  const type = ['car', 'parked', 'bus', 'cyclist', 'worker', 'pedestrian', 'cone'].includes(item.type) ? item.type : 'car';
  const lateral = finite(item.lateral, host.road?.laneW / 2 || 1.7);
  const actor = host.addActor(
    (host.progress || 0) + finite(item.dz, 35),
    lateral,
    type,
    !!item.moving,
    !!item.oncoming,
    { custom: true, modelId: item.modelId || undefined, turnIntent: item.turnIntent || 'through', turnControlId: item.turnControlId || null }
  );
  if (!actor) return null;
  if (Number.isFinite(Number(item.speed))) actor.speed = Math.max(0, Number(item.speed));
  if (Number.isFinite(Number(item.desiredSpeed))) actor.desiredSpeed = Math.max(0, Number(item.desiredSpeed));
  if (item.driverStyle) actor.driverStyle = item.driverStyle;
  if (item.scenarioRole) actor.scenarioRole = item.scenarioRole;
  if (item.crossingTarget != null && Number.isFinite(Number(item.crossingTarget))) actor.crossingTarget = Number(item.crossingTarget);
  if (item.crossingStartRange != null && Number.isFinite(Number(item.crossingStartRange))) actor.crossingStartRange = Number(item.crossingStartRange);
  if (item.crossingSpeed != null && Number.isFinite(Number(item.crossingSpeed))) actor.crossingSpeed = Number(item.crossingSpeed);
  host.customActors.push(actor.id);
  return actor;
}

export function restoreScenario(host, data, { clear = true } = {}) {
  const items = Array.isArray(data?.items) ? data.items : [];
  if (clear) clearCustomActors(host);
  const actors = items.map(item => restoreActor(host, item)).filter(Boolean);
  return { version: Number(data?.v) || 1, count: actors.length, actors, context: data?.context || null };
}

if (typeof window !== 'undefined') {
  window.SimScenarioAuthoring = { SCENARIO_VERSION, serializeScenario, clearCustomActors, restoreScenario };
}
