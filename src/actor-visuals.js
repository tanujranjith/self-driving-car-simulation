const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getVisuals() {
  return globalThis.window?.SimVehicleVisuals || globalThis.SimVehicleVisuals || null;
}

function seededRange(host, seed, min, max) {
  const sample = typeof host?.seededRand === 'function' ? host.seededRand(seed) : 0.5;
  return min + sample * (max - min);
}

function updatePedestrian(host, actor, dt) {
  const dz = actor.z - host.progress;
  if (actor.crossingDir == null) {
    const outward = actor.lateral >= 0 ? 1 : -1;
    actor.crossingDir = outward;
    actor.crossingTarget = outward * (host.road.travelHalf + host.road.sidewalk + 0.65);
    actor.crossingSpeed = seededRange(host, actor.z * 0.031 + actor.lateral * 0.17, 1.18, 1.62);
    actor.crossingStarted = false;
    actor.clearLog = false;
    actor.walkPhase = seededRange(host, actor.z * 0.047 + actor.lateral * 0.23, 0, Math.PI * 2);
  }
  const startRange = actor.crossingStartRange ?? 72;
  if (dz < startRange && dz > -10) actor.crossingStarted = true;
  if (actor.crossingStarted && Math.abs(actor.lateral - actor.crossingTarget) > 0.08) {
    actor.crossingSpeed = Math.max(actor.crossingSpeed || 1.35, 1.18);
    const step = actor.crossingDir * actor.crossingSpeed * dt;
    const next = actor.lateral + step;
    actor.lateral = actor.crossingDir > 0 ? Math.min(next, actor.crossingTarget) : Math.max(next, actor.crossingTarget);
    actor.walkPhase = (actor.walkPhase || 0) + dt * 7;
    actor.mesh.position.y = Math.sin(actor.walkPhase) * 0.018;
    if (!actor.clearLog && dz < 38 && Math.abs(actor.lateral - host.lane) > 2.65) {
      actor.clearLog = true;
      host.log.add('Pedestrian clearing crosswalk');
    }
  }
  const walkRig = actor.mesh.userData?.walkRig;
  if (walkRig) {
    if (!actor.crossingStarted) actor.walkPhase = (actor.walkPhase || 0) + dt * (actor.type === 'worker' ? 1.4 : 0.55);
    const active = actor.crossingStarted || actor.type === 'worker';
    const stride = active ? 0.24 : 0.045;
    for (const [joint, index] of (walkRig.legs || []).map((joint, index) => [joint, index])) {
      joint.rotation.z = Math.sin((actor.walkPhase || 0) + index * Math.PI) * stride;
    }
    for (const [joint, index] of (walkRig.arms || []).map((joint, index) => [joint, index])) {
      joint.rotation.z = (index === 0 ? 0.18 : -0.18) + Math.sin((actor.walkPhase || 0) + index * Math.PI) * stride * 0.72;
    }
  }
}

function updateCyclist(host, actor, dt) {
  actor.walkPhase = (actor.walkPhase || 0) + dt * (1.4 + Math.abs(actor.speed || 0) * 1.8);
  const visuals = getVisuals();
  visuals?.animateCyclist?.(actor.mesh, (actor.oncoming ? -1 : 1) * (actor.speed || 0), dt, actor.walkPhase);
  actor.mesh.rotation.z = clamp((actor.lateralVelocity || 0) * 0.16, -0.14, 0.14);
}

function updatePose(host, actor, dt) {
  const point = host.road.point(actor.z, actor.lateral);
  actor.mesh.position.copy(point);
  if ((actor.type === 'pedestrian' || actor.type === 'worker') && actor.crossingStarted) {
    actor.mesh.position.y = Math.sin(actor.walkPhase || 0) * 0.018;
  }
  if (actor.crossTraffic) {
    actor.mesh.rotation.y = host.road.yaw(actor.z) + (actor.crossTrafficDir > 0 ? Math.PI / 2 : -Math.PI / 2) + (actor.mesh.userData?.modelYawOffset || 0);
  } else if ((actor.type === 'pedestrian' || actor.type === 'worker') && actor.crossingStarted) {
    actor.mesh.rotation.y = host.road.yaw(actor.z) + (actor.crossingDir > 0 ? Math.PI / 2 : -Math.PI / 2);
  } else {
    const trafficYaw = clamp((actor.lateralVelocity || 0) * 0.08, -0.16, 0.16);
    actor.mesh.rotation.y = host.road.yaw(actor.z) + (actor.oncoming ? Math.PI : 0) + trafficYaw + (actor.mesh.userData?.modelYawOffset || 0);
  }
  return point;
}

function updateSemiArticulation(actor, dt) {
  if (actor.modelType !== 'semi' || !actor.mesh.userData?.trailer) return;
  const rig = actor.mesh.userData;
  const max = rig.articulationMax || 0.24;
  const target = clamp(-(actor.lateralVelocity || 0) * 0.045, -max, max);
  const blend = 1 - Math.exp(-Math.max(0, dt) * 3.8);
  rig.articulationAngle += (target - (rig.articulationAngle || 0)) * blend;
  rig.trailer.rotation.y = rig.articulationAngle;
  rig.trailer.rotation.z = clamp(-(actor.lateralVelocity || 0) * 0.012, -0.035, 0.035);
}

function updateEmergencyBar(host, actor) {
  if (!actor.mesh.userData.isEmergency) return;
  const flashTick = Math.floor(host.simTime * 4.2) % 2;
  actor.mesh.traverse(node => {
    if (node.userData.emgRed) node.material.color.setHex(flashTick ? 0xff2244 : 0x220005);
    if (node.userData.emgBlue) node.material.color.setHex(flashTick ? 0x1133bb : 0x2255ff);
  });
}

export function updateActorVisual(host, actor, dt) {
  if (!host || !actor?.mesh || !host.road) return false;
  if (actor.type === 'pedestrian' || actor.type === 'worker') updatePedestrian(host, actor, dt);
  if (actor.type === 'cyclist') updateCyclist(host, actor, dt);
  const point = updatePose(host, actor, dt);
  updateSemiArticulation(actor, dt);
  if (['car', 'bus', 'parked'].includes(actor.type)) {
    host.animateVehicleBody(actor.mesh, actor.lateralVelocity || 0, actor.accel || 0, actor.type, actor.modelType);
  }
  if (actor.type === 'bus') host.animateBusDoors(actor.mesh, actor.busStopState === 'dwell', dt);
  host.animateVehicleTurnSignals(actor.mesh, actor.turnSignal, Math.floor(host.simTime * 2.2) % 2 === 0);
  if (actor.moving) {
    host.animateVehicleWheels(actor.mesh, (actor.oncoming ? -1 : 1) * actor.speed, dt, (actor.type === 'car' || actor.type === 'bus') ? clamp((actor.lateralVelocity || 0) * 0.2, -0.52, 0.52) : 0);
  }
  host.animateVehicleLights(actor.mesh, !!(actor.accel < -0.22 || actor.yielding));
  actor.worldPos = point.clone();
  updateEmergencyBar(host, actor);
  return true;
}

if (typeof window !== 'undefined') window.SimActorVisuals = { updateActorVisual };
