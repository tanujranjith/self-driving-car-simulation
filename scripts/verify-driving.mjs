import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
const report = await page.evaluate(async () => {
  const sim = window.__sim;
  if (!sim) return { error: 'simulation did not initialize' };
  sim.paused = false;
  sim.setControlSource('autonomy');
  sim.advanceTime(3000);
  const autonomy = JSON.parse(sim.renderGameToText());
  const fleetMaps = ['downtown', 'nightcity', 'suburb', 'highway', 'rural'];
  const fleetRegression = Object.fromEntries(fleetMaps.map(map => {
    const profile = window.SimTrafficFleet?.fleetProfile?.(map) || null;
    const samples = Array.from({ length: 12 }, (_, index) => window.SimTrafficFleet?.vehicleAssetForActor?.('car', index, map) || null);
    return [map, { profile, samples, heavyRigs: samples.filter(id => id === 'semi' || id === 'boxtruck').length, distinct: [...new Set(samples)].length }];
  }));
  autonomy.environment.trafficFleetSource = sim.trafficFleetSource || (window.SimTrafficFleet ? 'module' : 'inline');
  autonomy.environment.fleetRegression = fleetRegression;
  const steeringAuthorityDynamics = new window.SimCore.VehicleDynamics();
  steeringAuthorityDynamics.reset(sim.road.laneW / 2, 6);
  const lowSpeedAuthority = steeringAuthorityDynamics.step(.05, { targetLane: sim.road.laneW * 1.5, targetSpeed: 6, controlSource: 'human', steeringInput: 1, throttleInput: 0, brakeInput: 0 }).steeringAuthority;
  steeringAuthorityDynamics.reset(sim.road.laneW / 2, 28);
  const highSpeedAuthority = steeringAuthorityDynamics.step(.05, { targetLane: sim.road.laneW * 1.5, targetSpeed: 28, controlSource: 'human', steeringInput: 1, throttleInput: 0, brakeInput: 0 }).steeringAuthority;
  autonomy.ego.steeringAuthorityProbe = { lowSpeed: +lowSpeedAuthority.toFixed(3), highSpeed: +highSpeedAuthority.toFixed(3) };
  const sensorProbe = { source: sim.sensorBuilderSource || 'inline', lidarHits: sim.lidarHits?.length || 0, radarTracks: sim.radarTracks?.length || 0, radarGhosts: sim.radarGhosts?.length || 0 };
  sim.setControlSource('human');
  sim.takeoverInput.keys.add('KeyW');
  sim.takeoverInput.keys.add('KeyD');
  sim.advanceTime(1000);
  sim.takeoverInput.keys.clear();
  sim.advanceTime(250);
  const takeover = JSON.parse(sim.renderGameToText());
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const bus = sim.addActor(170, sim.road.laneW / 2, 'bus', true, false, { custom: true, modelId: 'bus' });
  bus.nextBusStopZ = 170;
  bus.speed = 0;
  sim.updateActorMeshes(0.1);
  const dwellStarted = bus.busStopState === 'dwell' && bus.busDwell > 0 && bus.turnSignal === 'right';
  const doorOpen = (bus.mesh?.userData?.busDoors || []).some(door => Math.abs(door.rotation.y) > 0.001);
  for (let i = 0; i < 40; i++) sim.updateActorMeshes(0.1);
  const busProbe = { dwellStarted, doorOpen, stopCount: bus.busStopCount || 0, nextStop: bus.nextBusStopZ, state: bus.busStopState, signal: bus.turnSignal };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const crossControl = sim.controls.find(control => control.type === 'stoplight');
  const savedRandom = Math.random;
  Math.random = () => 0.1;
  sim.spawnIntersectionTraffic(crossControl);
  Math.random = savedRandom;
  const crossTraffic = sim.actors.find(actor => actor.crossTraffic);
  const crossStart = crossTraffic?.lateral ?? null;
  if (crossTraffic) sim.updateActorMeshes(0.5);
  const crossMoved = !!crossTraffic && Math.abs(crossTraffic.lateral - crossStart) > 1;
  for (let i = 0; i < 90 && crossTraffic?.moving; i++) sim.updateActorMeshes(0.1);
  const crossTrafficProbe = { spawned: !!crossTraffic, moved: crossMoved, cleared: crossTraffic?.crossTrafficState === 'cleared' && !crossTraffic.moving, modelId: crossTraffic?.mesh?.userData?.modelId || null };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const turnControl = sim.controls.find(control => control.type === 'stoplight');
  turnControl.offset = 0;
  const turner = sim.addActor(turnControl.z - 58, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact', turnIntent: 'right' });
  turner.speed = 8;
  turner.desiredSpeed = 12;
  sim.assignTrafficTurnIntents();
  let turnSignalSeen = false;
  let turnLaneSeen = false;
  for (let i = 0; i < 260; i++) {
    sim.updateActorMeshes(0.1);
    turnSignalSeen ||= turner.turnState === 'approach' || turner.turnState === 'committed';
    turnLaneSeen ||= turner.turnSignal === 'right' && Math.abs((turner.turnTargetLane || 0) - sim.road.laneW * 1.5) < 0.05;
    if (turner.turnState === 'completed') break;
  }
  const turnProbe = { signalSeen: turnSignalSeen, targetLaneSeen: turnLaneSeen, completed: turner.turnState === 'completed', finalLane: +turner.lateral.toFixed(2), state: turner.turnState, signal: turner.turnSignal };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const redLight = sim.controls.find(control => control.type === 'stoplight');
  redLight.offset = 6.5;
  const redTraffic = sim.addActor(redLight.z - 55, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  redTraffic.speed = 8;
  redTraffic.desiredSpeed = 12;
  let redStopObserved = false;
  for (let i = 0; i < 120; i++) {
    sim.updateActorMeshes(0.1);
    redStopObserved ||= redTraffic.controlState === 'red' && redTraffic.speed === 0;
  }
  const redLightProbe = { redStopObserved, state: redTraffic.controlState, speed: redTraffic.speed, stopHold: +(redTraffic.controlStopHold || 0).toFixed(1) };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const yellowLight = sim.controls.find(control => control.type === 'stoplight');
  yellowLight.offset = 5.0;
  const yellowTraffic = sim.addActor(yellowLight.z - 20, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  yellowTraffic.speed = 8;
  yellowTraffic.desiredSpeed = 12;
  sim.updateActorMeshes(0.1);
  const yellowDilemmaProbe = { state: yellowTraffic.controlState, speedBefore: 8, speedAfter: +yellowTraffic.speed.toFixed(2), signalDecision: yellowTraffic.controlState === 'yellow-go' ? 'yellow-go' : 'yellow-stop' };
  const lightingModel = sim.factory.compact();
  const lightingHeadlights = lightingModel?.userData?.headlights || [];
  const firstHeadlightMaterial = lightingHeadlights[0] ? (Array.isArray(lightingHeadlights[0].material) ? lightingHeadlights[0].material[0] : lightingHeadlights[0].material) : null;
  const headlightOff = Number.isFinite(firstHeadlightMaterial?.emissiveIntensity) ? firstHeadlightMaterial.emissiveIntensity : null;
  sim.animateVehicleLights(lightingModel, false, true);
  const headlightOn = Number.isFinite(firstHeadlightMaterial?.emissiveIntensity) ? firstHeadlightMaterial.emissiveIntensity : null;
  sim.animateVehicleLights(lightingModel, false, false);
  const headlightRestored = Number.isFinite(firstHeadlightMaterial?.emissiveIntensity) ? firstHeadlightMaterial.emissiveIntensity : null;
  const signalLamps = lightingModel?.userData?.turnSignals?.left || [];
  const firstSignalMaterial = signalLamps[0] ? (Array.isArray(signalLamps[0].material) ? signalLamps[0].material[0] : signalLamps[0].material) : null;
  const signalOff = Number.isFinite(firstSignalMaterial?.opacity) ? firstSignalMaterial.opacity : null;
  sim.animateVehicleTurnSignals(lightingModel, 'left', true);
  const signalOn = Number.isFinite(firstSignalMaterial?.opacity) ? firstSignalMaterial.opacity : null;
  sim.animateVehicleTurnSignals(lightingModel, 'none', false);
  const signalRestored = Number.isFinite(firstSignalMaterial?.opacity) ? firstSignalMaterial.opacity : null;
  const vehicleLightingProbe = { headlightCount: lightingHeadlights.length, headlightOff, headlightOn, headlightRestored, brakeLightCount: lightingModel?.userData?.brakeLights?.length || 0, turnSignalCount: Object.values(lightingModel?.userData?.turnSignals || {}).flat().length, signalOff, signalOn, signalRestored };
  const stopSign = sim.controls.find(control => control.type === 'stopsign');
  const stopTraffic = sim.addActor(stopSign.z - 55, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  stopTraffic.speed = 8;
  stopTraffic.desiredSpeed = 12;
  let stopObserved = false;
  let stopServed = false;
  for (let i = 0; i < 100; i++) {
    sim.updateActorMeshes(0.1);
    stopObserved ||= stopTraffic.controlState === 'stop' && stopTraffic.speed === 0;
    stopServed ||= stopTraffic.controlServedId === stopSign.id || stopTraffic.controlState === 'proceed';
  }
  const stopSignProbe = { stopObserved, stopServed, state: stopTraffic.controlState, speed: +stopTraffic.speed.toFixed(2) };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const pedestrianTraffic = sim.addActor(28, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  pedestrianTraffic.speed = 12;
  pedestrianTraffic.desiredSpeed = 14;
  const crossingPedestrian = sim.addActor(32, sim.road.travelHalf + 1.1, 'pedestrian', false, false, { custom: true, modelId: 'pedestrian' });
  crossingPedestrian.crossingStarted = true;
  crossingPedestrian.crossingDir = -1;
  crossingPedestrian.crossingTarget = -sim.road.travelHalf - 1.1;
  crossingPedestrian.crossingStartRange = 64;
  let pedestrianYieldObserved = false;
  let pedestrianTrafficMinSpeed = pedestrianTraffic.speed;
  for (let i = 0; i < 80; i++) {
    sim.updateActorMeshes(0.1);
    pedestrianYieldObserved ||= pedestrianTraffic.pedestrianYielding === true;
    pedestrianTrafficMinSpeed = Math.min(pedestrianTrafficMinSpeed, pedestrianTraffic.speed);
  }
  const pedestrianTrafficProbe = { pedestrianYieldObserved, minSpeed: +pedestrianTrafficMinSpeed.toFixed(2), behavior: pedestrianTraffic.pedestrianYielding ? 'crosswalk-yield' : 'cruise' };
  sim.mapType = 'downtown';
  sim.reset();
  for (const actor of [...sim.actors]) sim.dynamic.remove(actor.mesh);
  sim.actors = [];
  for (const control of sim.controls) if (control.type === 'stoplight') control.offset = 0;
  sim.paused = false;
  sim.setControlSource('autonomy');
  sim.vehicleDynamics.reset(sim.lane, 12);
  sim.vehicleState = sim.vehicleDynamics.state;
  sim.speed = 12;
  const emergency = sim.addActor(72, -sim.road.laneW / 2, 'car', true, true, { custom: true, modelId: 'emergency' });
  emergency.speed = 20;
  const emergencyAnalysis = sim.updateVehicle(0.05);
  const emergencyProbe = { reason: emergencyAnalysis?.reason, desiredLane: emergencyAnalysis?.desiredLane, pullOverLane: sim.road.laneW * 1.5, desiredMph: emergencyAnalysis?.desiredMph, yields: sim.metrics.emergencyYields || 0, signal: sim.turnSignal };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  sim.laneChangeActive = true;
  sim.signalIntentLane = sim.road.laneW * 1.5;
  const courtesy = sim.addActor(12, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'compact' });
  courtesy.speed = 10;
  courtesy.desiredSpeed = 18;
  const courtesySpeedBefore = courtesy.speed;
  sim.trafficAgentStep(courtesy, 0.1);
  const mergeCourtesyProbe = { mergeYielding: courtesy.mergeYielding === true, behavior: courtesy.mergeYielding ? 'merge-courtesy' : 'cruise', speedBefore: courtesySpeedBefore, speedAfter: +courtesy.speed.toFixed(2), yields: sim.metrics.mergeYields || 0 };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const closingFollower = sim.addActor(20, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  const closingLead = sim.addActor(34, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  closingFollower.speed = 18;
  closingFollower.desiredSpeed = 22;
  closingLead.speed = 4;
  closingLead.desiredSpeed = 6;
  sim.trafficAgentStep(closingFollower, 0.1);
  const ttcProbe = { reactionTime: closingFollower.reactionTime, leadTtc: closingFollower.leadTtc, yielding: closingFollower.yielding === true, speedAfter: +closingFollower.speed.toFixed(2) };
  sim.mapType = 'downtown';
  sim.reset();
  for (const actor of [...sim.actors]) sim.dynamic.remove(actor.mesh);
  sim.actors = [];
  sim.paused = true;
  const passLane = sim.road.laneW / 2;
  const passFollower = sim.addActor(20, passLane, 'car', true, false, { custom: true, modelId: 'compact' });
  const passLead = sim.addActor(38, passLane, 'car', true, false, { custom: true, modelId: 'sedan' });
  passFollower.speed = 17;
  passFollower.desiredSpeed = 24;
  passFollower.laneChangeCooldown = 0;
  passLead.speed = 4;
  passLead.desiredSpeed = 6;
  let passSignalSeen = false;
  let passLaneSeen = false;
  let returnSignalSeen = false;
  let returnedToLane = false;
  for (let i = 0; i < 180; i++) {
    sim.trafficAgentStep(passFollower, 0.1);
    passFollower.z += passFollower.speed * 0.1;
    passLead.z += passLead.speed * 0.1;
    passSignalSeen ||= passFollower.passState === 'moving-out' && passFollower.turnSignal !== 'none';
    passLaneSeen ||= passFollower.passState === 'passing';
    returnSignalSeen ||= passFollower.passState === 'returning' && passFollower.turnSignal !== 'none';
    returnedToLane ||= passFollower.passState === 'cruise' && Math.abs(passFollower.lateral - passLane) < 0.08 && passFollower.z > passLead.z + 8;
  }
  const passReturnProbe = { passSignalSeen, passLaneSeen, returnSignalSeen, returnedToLane, state: passFollower.passState, lateral: +passFollower.lateral.toFixed(2), baseLane: passLane, leadGap: +(passFollower.z - passLead.z).toFixed(1) };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  const speedAware = sim.addActor(500, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  speedAware.speed = 21;
  speedAware.desiredSpeed = 26;
  const speedLimitApproach = sim.trafficSpeedLimitPlan(speedAware);
  const speedBeforeLimit = speedAware.speed;
  sim.trafficAgentStep(speedAware, 0.5);
  const approachingSpeedLimit = { state: speedAware.speedLimitState, limitMph: speedAware.speedLimitMph, distance: speedAware.speedLimitDistance, capMph: +(speedAware.speedLimitCapMps / 0.44704).toFixed(1) };
  speedAware.z = 640;
  const speedLimitObeying = sim.trafficSpeedLimitPlan(speedAware);
  sim.trafficAgentStep(speedAware, 1.0);
  const speedLimitProbe = { approachState: speedLimitApproach?.state, approachLimitMph: speedLimitApproach?.limitMph, approachDistance: speedLimitApproach?.distance, obeyingState: speedLimitObeying?.state, obeyingLimitMph: speedLimitObeying?.limitMph, capMph: +(speedAware.speedLimitCapMps / 0.44704).toFixed(1), speedBefore: speedBeforeLimit, speedAfter: +speedAware.speed.toFixed(2) };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  sim.progress = 700;
  sim.env.weather = 'clear';
  sim.env.visibility = 620;
  sim.sensorConfig = { camera: true, lidar: false, radar: false, gps: true, noise: 0, range: 125 };
  sim.sensorHealth = { lens: 1, lidar: 1, gps: 1, lensMsg: 'OK' };
  const nominalPerception = sim.perceptionPolicy();
  const nominalPerceptionAnalysis = sim.analyze();
  sim.env.weather = 'fog';
  sim.env.visibility = 100;
  sim.sensorConfig = { camera: true, lidar: false, radar: false, gps: false, noise: 75, range: 125 };
  sim.sensorHealth = { lens: .35, lidar: .4, gps: .25, lensMsg: 'LENS DIRTY', dropoutUntil: sim.simTime + 5 };
  const degradedPerception = sim.perceptionPolicy();
  const degradedPerceptionAnalysis = sim.analyze();
  const perceptionProbe = { nominalState: nominalPerception.state, nominalConfidence: nominalPerception.confidence, nominalSpeedFactor: nominalPerception.speedFactor, nominalTrackingRange: nominalPerception.trackingRange, nominalControlRange: nominalPerception.controlRange, nominalDesiredMph: nominalPerceptionAnalysis.desiredMph, degradedState: degradedPerception.state, degradedConfidence: degradedPerception.confidence, degradedSpeedFactor: degradedPerception.speedFactor, degradedTrackingRange: degradedPerception.trackingRange, degradedControlRange: degradedPerception.controlRange, degradedDesiredMph: degradedPerceptionAnalysis.desiredMph, degradedReason: degradedPerceptionAnalysis.reason, moduleSource: sim.perceptionPolicySource };
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  sim.progress = 1120;
  sim.speed = 8;
  sim.vehicleDynamics.reset(sim.lane, sim.speed);
  sim.vehicleState = sim.vehicleDynamics.state;
  sim._speedCommandMps = sim.speed;
  const roundaboutAnalysis = sim.updateVehicle(0.05);
  const directRoundaboutAnalysis = sim.analyze();
  const roundaboutMesh = sim.intersectionGroup?.children?.find(node => node.userData?.roundabout);
  const roundaboutProbe = { model: !!roundaboutMesh, modelParts: roundaboutMesh?.children?.length || 0, worldModelCount: sim.worldModelCounts?.roundabout || 0, progress: sim.progress, roadProfile: sim.road.profile, inZone: sim.road.isRoundaboutZone(sim.progress + 25), state: sim.roundaboutState, reason: directRoundaboutAnalysis?.reason, desiredMph: directRoundaboutAnalysis?.desiredMph, updateReason: roundaboutAnalysis?.reason, targetLane: +sim.targetLane.toFixed(2) };
  sim.mapType = 'rural';
  sim.reset();
  const frictionDynamics = new window.SimCore.VehicleDynamics();
  const frictionParams = { targetLane: sim.road.laneW * 1.5, targetSpeed: 22, maxSteer: .50, steeringResponse: 6, steeringRate: 5, lateralResponse: 4, referenceSpeed: 22 };
  frictionDynamics.reset(sim.road.laneW / 2, 22);
  const dryFrictionState = frictionDynamics.step(.05, { ...frictionParams, surfaceGrip: 1 });
  frictionDynamics.reset(sim.road.laneW / 2, 22);
  const wetFrictionState = frictionDynamics.step(.05, { ...frictionParams, surfaceGrip: .58 });
  const gripResponseProbe = { drySteering: +dryFrictionState.steering.toFixed(4), wetSteering: +wetFrictionState.steering.toFixed(4), dryYaw: +dryFrictionState.yawRate.toFixed(4), wetYaw: +wetFrictionState.yawRate.toFixed(4), wetSteerRate: +wetFrictionState.steerRate.toFixed(4) };
  const curveDynamics = new window.SimCore.VehicleDynamics();
  const signedRoadCurvature = sim.road.signedCurvature?.(18) || 0;
  curveDynamics.reset(sim.road.laneW / 2, 18);
  const curveState = curveDynamics.step(.05, { targetLane: sim.road.laneW / 2, targetSpeed: 18, roadCurvature: signedRoadCurvature, surfaceGrip: .92, maxSteer: .50, steeringResponse: 6, steeringRate: 5, lateralResponse: 4, referenceSpeed: 22 });
  const curveFeedForwardProbe = { curvature: +signedRoadCurvature.toFixed(5), steering: +curveState.steering.toFixed(4), yaw: +curveState.yawRate.toFixed(4), corneringAccel: +curveState.corneringAccel.toFixed(4) };
  const curveProbe = [0, 120, 240, 360, 480, 900, 1020, 1120, 1220].map(z => ({ z, cap: sim.curveSpeedCapMph(z) }));
  sim.mapType = 'rural';
  sim.reset();
  sim.paused = true;
  const curveProbePositions = [0, 120, 240, 360, 480, 900, 1020, 1120, 1220];
  const curveProbePosition = curveProbePositions.find(z => Math.max(...[14, 26, 40, 58, 82, 110].map(offset => sim.road.curvature(z + offset))) > .002) ?? null;
  const curvePreviewModels = ['sport', 'suv', 'semi'].map((modelId, index) => {
    const actor = sim.addActor(curveProbePosition ?? 0, sim.road.laneW / 2 + index * .02, 'car', true, false, { custom: true, modelId });
    actor.speed = 24;
    actor.desiredSpeed = 27;
    const preview = sim.trafficCurvePreview(actor);
    return { modelId, state: preview?.state || null, capMph: Number.isFinite(preview?.capMph) ? +preview.capMph.toFixed(2) : null, distance: preview?.distance ?? null, curvature: preview?.curvature ?? null, lateralAccel: preview?.lateralAccel ?? null, brakingDistanceM: preview?.brakingDistanceM ?? null };
  });
  const curvePreviewProbe = { position: curveProbePosition, found: curveProbePosition !== null, models: curvePreviewModels, anticipatory: curvePreviewModels.every(sample => Number.isFinite(sample.capMph) && sample.distance > 0 && sample.distance <= 110), differentiated: curvePreviewModels[0]?.capMph > curvePreviewModels[1]?.capMph && curvePreviewModels[1]?.capMph > curvePreviewModels[2]?.capMph };
  const minivanShape = sim.factory.minivan(sim.factory.mats.car2);
  minivanShape.updateMatrixWorld(true);
  const minivanBounds = new THREE.Box3().setFromObject(minivanShape).getSize(new THREE.Vector3());
  const minivanActor = sim.addActor(54, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'minivan' });
  const minivanTelemetry = JSON.parse(sim.renderGameToText()).actors.find(actor => actor.modelId === 'minivan');
  const minivanTuning = sim.trafficModelTuning('minivan', 'car');
  const minivanProbe = { label: minivanShape.userData?.label || null, profile: minivanShape.userData?.vehicleProfile || null, details: minivanShape.userData?.minivanDetails || null, wheels: minivanShape.userData?.wheels?.length || 0, width: +minivanBounds.x.toFixed(2), height: +minivanBounds.y.toFixed(2), length: +minivanBounds.z.toFixed(2), actorModel: minivanActor?.mesh?.userData?.modelId || minivanActor?.modelType || null, actorLoadState: minivanActor?.modelLoadState || null, telemetryModel: minivanTelemetry?.modelId || null, tuning: minivanTuning };
  const coupeShape = sim.factory.coupe(sim.factory.mats.car);
  coupeShape.updateMatrixWorld(true);
  const coupeBounds = new THREE.Box3().setFromObject(coupeShape).getSize(new THREE.Vector3());
  const coupeActor = sim.addActor(72, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'coupe' });
  const coupeTelemetry = JSON.parse(sim.renderGameToText()).actors.find(actor => actor.modelId === 'coupe');
  const coupeTuning = sim.trafficModelTuning('coupe', 'car');
  const coupeProbe = { label: coupeShape.userData?.label || null, profile: coupeShape.userData?.vehicleProfile || null, details: coupeShape.userData?.coupeDetails || null, wheels: coupeShape.userData?.wheels?.length || 0, width: +coupeBounds.x.toFixed(2), height: +coupeBounds.y.toFixed(2), length: +coupeBounds.z.toFixed(2), actorModel: coupeActor?.mesh?.userData?.modelId || coupeActor?.modelType || null, telemetryModel: coupeTelemetry?.modelId || null, tuning: coupeTuning };
  const steeringVisualProbe = (() => {
    const sample = (actor, steering) => {
      const mesh = actor?.mesh;
      const front = mesh?.userData?.frontWheels?.[0];
      const rear = mesh?.userData?.wheels?.find(wheel => !mesh.userData.frontWheels?.includes(wheel));
      if (!mesh || !front || !rear) return null;
      for (let i = 0; i < 18; i++) sim.animateVehicleWheels(mesh, 0, .1, steering);
      return { angle: +(mesh.userData.wheelSteeringAngle || 0).toFixed(4), front: front.quaternion.toArray().map(value => +value.toFixed(4)), rear: rear.quaternion.toArray().map(value => +value.toFixed(4)) };
    };
    const minivanTurn = sample(minivanActor, .52);
    const coupeTurn = sample(coupeActor, .52);
    return { minivan: minivanTurn, coupe: coupeTurn, coupeRespondsFaster: (coupeTurn?.angle || 0) > (minivanTurn?.angle || 0) };
  })();
  const laneChangeProbe = (() => {
    const sample = (actor, target) => {
      actor.targetLateral = target;
      actor.speed = 12;
      actor.desiredSpeed = actor.modelType === 'coupe' ? 28 : 21;
      actor.laneChangeCooldown = 99;
      actor.turnPlanActive = true;
      const steps = [];
      for (let i = 0; i < 10; i++) {
        sim.trafficAgentStep(actor, .1);
        steps.push({ lateral: actor.lateral, velocity: actor.lateralVelocity, state: actor.laneChangeState });
      }
      actor.turnPlanActive = false;
      return { duration: +(actor.laneChangeDuration || 0).toFixed(3), progress: +(actor.laneChangeProgress || 0).toFixed(3), state: actor.laneChangeState, maxStep: +Math.max(...steps.map((value, index) => index ? Math.abs(value.lateral - steps[index - 1].lateral) : 0)).toFixed(3), samples: steps };
    };
    const minivan = sample(minivanActor, sim.road.laneW * 1.5);
    const coupe = sample(coupeActor, sim.road.laneW / 2);
    return { minivan, coupe, minivanSlower: (minivan?.duration || 0) > (coupe?.duration || 0) };
  })();
  const semiActor = sim.addActor(96, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'semi' });
  const collisionFootprintProbe = { source: (sim.collisionLateralLimit(minivanActor), sim.vehicleFootprintSource || 'inline'), sedan: sim.collisionLateralLimit({ type: 'car', modelType: 'sedan' }), coupe: sim.collisionLateralLimit(coupeActor), minivan: sim.collisionLateralLimit(minivanActor), semi: sim.collisionLateralLimit(semiActor) };
  const clearance = window.SimVehicleFootprint?.vehicleFollowingClearance;
  const longitudinalClearanceProbe = { source: typeof clearance === 'function' ? 'module' : 'inline', sedan: clearance?.({ type: 'car', modelType: 'sedan' }, { type: 'car', modelType: 'sedan' }) ?? null, minivan: clearance?.({ type: 'car', modelType: 'minivan' }, { type: 'car', modelType: 'minivan' }) ?? null, semi: clearance?.({ type: 'car', modelType: 'semi' }, { type: 'car', modelType: 'semi' }) ?? null };
  const graphPlanner = new window.SimRoute.RoutePlanner({ laneCount: 3, laneWidth: sim.road.laneW });
  const graphPlan = graphPlanner.plan({ currentLane: sim.road.laneW / 2, targetLane: sim.road.laneW * 2.5, isLaneChange: true, progress: 0, horizon: 144 });
  const graphSamples = graphPlanner.samples({ road: sim.road, progress: 0, plan: graphPlan });
  const routeGraphProbe = { lanePath: graphPlan.lanePath, transitionState: graphPlanner.telemetry({ progress: 20 }).state, settledState: graphPlanner.telemetry({ progress: 90 }).state, forwardLink: graphPlanner.graph.nodes[0]?.forward || null, sampleCount: graphSamples.length };
  sim.mode = 'chase';
  sim.stepSimulation(0);
  return { autonomy, takeover, sensorProbe, busProbe, crossTrafficProbe, turnProbe, redLightProbe, yellowDilemmaProbe, vehicleLightingProbe, stopSignProbe, pedestrianTrafficProbe, emergencyProbe, mergeCourtesyProbe, ttcProbe, passReturnProbe, speedLimitProbe, perceptionProbe, roundaboutProbe, gripResponseProbe, curveFeedForwardProbe, curveProbe, curvePreviewProbe, minivanProbe, coupeProbe, steeringVisualProbe, laneChangeProbe, collisionFootprintProbe, longitudinalClearanceProbe, routeGraphProbe, routePlannerReady: !!sim.routePlanner, routeSource: autonomy?.route?.source || 'inline', routeState: autonomy?.route?.state || 'fallback', routeLanePath: autonomy?.route?.lanePath || [], graphVersion: sim.routePlanner?.graph?.version || null, factorySource: window.SimModelFactory === sim.factory?.constructor ? 'module' : 'inline', roadSource: window.SimRoad?.Road === sim.road?.constructor ? 'module' : 'inline', roadBuilderSource: autonomy?.environment?.roadBuilderSource || 'inline', intersectionBuilderSource: autonomy?.environment?.intersectionBuilderSource || 'inline', sensorBuilderSource: autonomy?.environment?.sensorBuilderSource || 'inline', trafficBehaviorSource: autonomy?.environment?.trafficBehaviorSource || 'inline' };
});

await page.screenshot({ path: 'output/driving-regression-chase.png', timeout: 60000 });
console.log(JSON.stringify({ report, errors }, null, 2));
await browser.close();

const ok = report?.autonomy?.ego?.progress > 0 &&
  report?.autonomy?.controlSource === 'autonomy' &&
  report?.takeover?.controlSource === 'human' &&
  report?.takeover?.ego?.speedMph > 0 &&
  Number.isFinite(report?.autonomy?.safety?.maxJerk) && report.autonomy.safety.maxJerk > 0 && report.autonomy.safety.maxJerk < 16 &&
  Number.isFinite(report?.autonomy?.ego?.wheelSlip) &&
  Number.isFinite(report?.autonomy?.ego?.bodyPitchDeg) &&
  Number.isFinite(report?.autonomy?.ego?.corneringAccel) &&
  Number.isFinite(report?.autonomy?.ego?.loadTransfer) &&
  typeof report.autonomy.ego?.tractionControl === 'boolean' && typeof report.autonomy.ego?.absActive === 'boolean' &&
  typeof report.autonomy.ego?.stabilityAssist === 'boolean' &&
  report?.routePlannerReady &&
  report?.routeSource === 'module' &&
  Array.isArray(report?.routeLanePath) && report.routeLanePath.length >= 1 &&
  report?.graphVersion >= 2 &&
  JSON.stringify(report?.routeGraphProbe?.lanePath) === JSON.stringify([0, 1, 2]) &&
  report?.routeGraphProbe?.transitionState === 'transition' &&
  report?.routeGraphProbe?.settledState === 'settled' &&
  typeof report?.routeGraphProbe?.forwardLink === 'string' &&
  report?.routeGraphProbe?.sampleCount >= 2 &&
  report?.factorySource === 'module' &&
  report?.roadSource === 'module' &&
  report?.roadBuilderSource === 'module' &&
  report?.intersectionBuilderSource === 'module' &&
  report?.autonomy?.environment?.sensorBuilderSource === 'module' &&
  report?.autonomy?.environment?.trafficBehaviorSource === 'module' &&
  report?.trafficBehaviorSource === 'module' &&
  report?.sensorProbe?.source === 'module' &&
  Number.isFinite(report?.sensorProbe?.lidarHits) && Number.isFinite(report?.sensorProbe?.radarTracks) && Number.isFinite(report?.sensorProbe?.radarGhosts) &&
  report?.busProbe?.dwellStarted && report?.busProbe?.stopCount >= 1 &&
  report?.crossTrafficProbe?.spawned && report?.crossTrafficProbe?.moved && report?.crossTrafficProbe?.cleared &&
  report?.turnProbe?.signalSeen && report?.turnProbe?.targetLaneSeen && report?.turnProbe?.completed &&
  report?.redLightProbe?.redStopObserved &&
  report?.yellowDilemmaProbe?.state === 'yellow-go' && report?.yellowDilemmaProbe?.speedAfter > 0 && report?.yellowDilemmaProbe?.signalDecision === 'yellow-go' &&
  report?.vehicleLightingProbe?.headlightCount >= 2 && report?.vehicleLightingProbe?.headlightOn > report?.vehicleLightingProbe?.headlightOff && report?.vehicleLightingProbe?.headlightRestored === report?.vehicleLightingProbe?.headlightOff && report?.vehicleLightingProbe?.brakeLightCount >= 2 && report?.vehicleLightingProbe?.turnSignalCount >= 2 && report?.vehicleLightingProbe?.signalOn > report?.vehicleLightingProbe?.signalOff && report?.vehicleLightingProbe?.signalRestored === report?.vehicleLightingProbe?.signalOff &&
  report?.stopSignProbe?.stopObserved && report?.stopSignProbe?.stopServed &&
  report?.pedestrianTrafficProbe?.pedestrianYieldObserved && report?.pedestrianTrafficProbe?.minSpeed < 12 &&
  report?.emergencyProbe?.reason === 'emergency' && report?.emergencyProbe?.desiredLane === report?.emergencyProbe?.pullOverLane && report?.emergencyProbe?.yields >= 1 &&
  report?.mergeCourtesyProbe?.mergeYielding && report?.mergeCourtesyProbe?.speedAfter < report?.mergeCourtesyProbe?.speedBefore && report?.mergeCourtesyProbe?.yields >= 1 &&
  Number.isFinite(report?.ttcProbe?.reactionTime) && Number.isFinite(report?.ttcProbe?.leadTtc) && report.ttcProbe.leadTtc < report.ttcProbe.reactionTime + 1 && report.ttcProbe.yielding &&
  report?.passReturnProbe?.passSignalSeen && report.passReturnProbe.passLaneSeen && report.passReturnProbe.returnSignalSeen && report.passReturnProbe.returnedToLane &&
  report?.speedLimitProbe?.approachState === 'approaching' && report.speedLimitProbe.approachLimitMph === 35 && report.speedLimitProbe.approachDistance > 100 && report.speedLimitProbe.obeyingState === 'obeying' && report.speedLimitProbe.obeyingLimitMph === 35 && report.speedLimitProbe.capMph === 35 && report.speedLimitProbe.speedAfter < report.speedLimitProbe.speedBefore &&
  report?.perceptionProbe?.moduleSource === 'module' && report.perceptionProbe.nominalState !== 'dropout' && report.perceptionProbe.degradedState === 'dropout' && report.perceptionProbe.degradedConfidence < report.perceptionProbe.nominalConfidence && report.perceptionProbe.degradedSpeedFactor < report.perceptionProbe.nominalSpeedFactor && report.perceptionProbe.degradedDesiredMph < report.perceptionProbe.nominalDesiredMph && report.perceptionProbe.degradedReason === 'perception' &&
  report.perceptionProbe.degradedTrackingRange < report.perceptionProbe.nominalTrackingRange && report.perceptionProbe.degradedControlRange < report.perceptionProbe.nominalControlRange &&
  report?.roundaboutProbe?.model && report.roundaboutProbe.modelParts >= 5 && report.roundaboutProbe.worldModelCount >= 2 && report.roundaboutProbe.state === 'approach' && report.roundaboutProbe.reason === 'roundabout' && report.roundaboutProbe.desiredMph <= 14 && Math.abs(report.roundaboutProbe.targetLane - 1.7) < .01 &&
  report?.gripResponseProbe?.wetSteering < report.gripResponseProbe.drySteering && report.gripResponseProbe.wetYaw < report.gripResponseProbe.dryYaw && Number.isFinite(report.gripResponseProbe.wetSteerRate) &&
  Math.abs(report?.curveFeedForwardProbe?.curvature || 0) > 0 && Math.abs(report?.curveFeedForwardProbe?.steering || 0) > 0 && Math.abs(report?.curveFeedForwardProbe?.yaw || 0) > 0 &&
  report?.curveProbe?.some(sample => Number.isFinite(sample.cap) && sample.cap >= 12) &&
  report?.curvePreviewProbe?.found && report.curvePreviewProbe.anticipatory && report.curvePreviewProbe.differentiated &&
  report?.minivanProbe?.label === 'Passenger minivan' && report.minivanProbe.profile === 'minivan' && report.minivanProbe.details?.passengerWindows >= 4 && report.minivanProbe.details?.slidingDoorRails === 2 && report.minivanProbe.wheels >= 4 && report.minivanProbe.length > report.minivanProbe.width * 1.5 && report.minivanProbe.actorModel === 'minivan' && report.minivanProbe.telemetryModel === 'minivan' && report.minivanProbe.tuning?.time > 1.4 && report.minivanProbe.tuning?.pass === true && report.minivanProbe.tuning?.laneRate < .8 && report.minivanProbe.tuning?.jerk < 5 &&
  report?.coupeProbe?.label === 'Sport coupe' && report.coupeProbe.profile === 'coupe' && report.coupeProbe.details?.doors === 2 && report.coupeProbe.details?.fastbackRoof === true && report.coupeProbe.details?.rearDiffuser === true && report.coupeProbe.wheels >= 4 && report.coupeProbe.height < report.coupeProbe.width && report.coupeProbe.actorModel === 'coupe' && report.coupeProbe.telemetryModel === 'coupe' && report.coupeProbe.tuning?.v0 === 28 && report.coupeProbe.tuning?.pass === true && report.coupeProbe.tuning?.laneRate > 1 && report.coupeProbe.tuning?.jerk > 7 && report.coupeProbe.tuning.laneRate > report.minivanProbe.tuning.laneRate &&
  report?.steeringVisualProbe?.minivan?.angle > 0 && report.steeringVisualProbe.coupe?.angle > report.steeringVisualProbe.minivan.angle && report.steeringVisualProbe.coupeRespondsFaster &&
  report?.laneChangeProbe?.minivan?.duration > report.laneChangeProbe?.coupe?.duration && report.laneChangeProbe.minivan?.state === 'blending' && report.laneChangeProbe.coupe?.state === 'blending' && report.laneChangeProbe.minivan?.maxStep < .25 && report.laneChangeProbe.coupe?.maxStep < .25 &&
  report?.collisionFootprintProbe?.source === 'module' && report.collisionFootprintProbe.coupe > report.collisionFootprintProbe.sedan && report.collisionFootprintProbe.minivan > report.collisionFootprintProbe.sedan && report.collisionFootprintProbe.semi > report.collisionFootprintProbe.minivan &&
  report?.longitudinalClearanceProbe?.source === 'module' && report.longitudinalClearanceProbe.minivan > report.longitudinalClearanceProbe.sedan && report.longitudinalClearanceProbe.semi > report.longitudinalClearanceProbe.minivan &&
  errors.length === 0;
if (!ok) process.exitCode = 1;
const fleetOk = report?.autonomy?.environment?.trafficFleetSource === 'module' &&
  report?.autonomy?.environment?.fleetRegression?.downtown?.distinct >= 6 &&
  report?.autonomy?.environment?.fleetRegression?.highway?.heavyRigs >= 2 &&
  report?.autonomy?.environment?.fleetRegression?.rural?.heavyRigs >= 2 &&
  report?.autonomy?.environment?.fleetRegression?.nightcity?.samples.includes('electric');
if (!fleetOk) process.exitCode = 1;
const steeringAuthorityOk = report?.autonomy?.ego?.steeringAuthorityProbe?.lowSpeed > report?.autonomy?.ego?.steeringAuthorityProbe?.highSpeed &&
  report?.autonomy?.ego?.steeringAuthorityProbe?.highSpeed >= 0.72;
if (!steeringAuthorityOk) process.exitCode = 1;
const busDoorOk = report?.busProbe?.dwellStarted && report?.busProbe?.doorOpen === true;
if (!busDoorOk) process.exitCode = 1;
