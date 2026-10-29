import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });

async function safeClose(page) {
  // A live Three.js RAF/WebGL context can occasionally make Playwright's
  // normal page close wait forever on Windows. Do not let that mask the
  // deterministic result from the page that already completed.
  await Promise.race([
    page.close().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);
}

async function safeCloseBrowser() {
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 4000))
  ]);
}

async function verifyVehicle(id, screenshotPath) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.__sim?.setQuality?.('balanced'));
  const result = await page.evaluate(async vehicleId => {
    const files = { pickup: 'cesium-milk-truck', sedan: 'toy-car', suv: 'car-concept' };
    const response = await fetch(`/assets/vehicles/${files[vehicleId]}.glb`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const magic = String.fromCharCode(...bytes.slice(0, 4));
    const sim = window.__sim;
    const loadModel = async id => sim?.modelRegistry ? Promise.race([
      sim.modelRegistry.load(id),
      new Promise(resolve => setTimeout(() => resolve(null), 22000))
    ]) : null;
    const model = await loadModel(vehicleId);
    let size = null;
    if (model && window.THREE) {
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const vector = box.getSize(new THREE.Vector3());
      size = { x: +vector.x.toFixed(2), y: +vector.y.toFixed(2), z: +vector.z.toFixed(2) };
    }
    if (sim) {
      sim.spawnEgoVehicle(vehicleId);
      await new Promise(resolve => setTimeout(resolve, 500));
      sim.mode = 'chase';
      sim.stepSimulation(0);
    }
    return {
      vehicleId,
      status: response.status,
      bytes: bytes.length,
      magic,
      simReady: !!sim,
      loaderReady: !!window.SimGLTFLoader,
      routePlannerReady: !!sim?.routePlanner,
      routeGraphVersion: sim?.routePlanner?.graph?.version || null,
      modelId: model?.userData?.modelId || null,
      modelQuality: model?.userData?.modelQuality || null,
      wheelCount: model?.userData?.wheels?.length || 0,
      frontWheelCount: model?.userData?.frontWheels?.length || 0,
      headlightCount: model?.userData?.headlights?.length || 0,
      brakeLightCount: model?.userData?.brakeLights?.length || 0,
      turnSignalCount: Object.values(model?.userData?.turnSignals || {}).flat().length,
      egoModelId: sim?.egoCar?.userData?.modelId || null,
      egoYawOffset: sim?.egoCar?.userData?.modelYawOffset || 0,
      egoOrientationApplied: !!(sim?.egoCar && Math.abs(sim.egoCar.rotation.y - (sim.road.yaw(sim.progress) + (sim.steerYaw || 0) + (sim.egoCar.userData?.modelYawOffset || 0))) < 0.01),
      size
    };
  }, id);
  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, timeout: 120000, animations: 'disabled' });
  }
  await safeClose(page);
  return { result, errors };
}

async function verifyTrafficFleet() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.__sim?.setQuality?.('balanced'));
  const result = await page.evaluate(async () => {
    const sim = window.__sim;
    const created = [
      sim.addActor(42, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'sedan' }),
      sim.addActor(54, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'pickup' }),
      sim.addActor(57, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'suv' }),
      sim.addActor(58, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'crossover' }),
      sim.addActor(60, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'boxtruck' }),
      sim.addActor(61, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'semi' }),
      sim.addActor(63, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'motorcycle' }),
      sim.addActor(66, -sim.road.laneW / 2, 'car', true, true, { custom: true, modelId: 'compact' }),
      sim.addActor(78, -sim.road.laneW * 1.5, 'car', true, true, { custom: true, modelId: 'sport' }),
      sim.addActor(80, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'luxury' }),
      sim.addActor(84, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'electric' }),
      sim.addActor(90, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'taxi' }),
      sim.addActor(102, sim.road.travelHalf + 1.1, 'car', true, false, { custom: true, modelId: 'delivery' }),
      sim.addActor(114, sim.road.travelHalf + 2.2, 'car', true, false, { custom: true, modelId: 'van' }),
      sim.addActor(120, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'minivan' }),
      sim.addActor(132, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'coupe' }),
      sim.addActor(126, sim.road.laneW * 1.5, 'bus', true, false, { custom: true }),
      sim.addActor(138, sim.road.laneW * 1.5, 'cyclist', true, false, { custom: true }),
      sim.addActor(150, sim.road.travelHalf + 2.2, 'worker', false, false, { custom: true }),
      sim.addActor(162, sim.road.travelHalf + 3.0, 'pedestrian', false, false, { custom: true, modelId: 'pedestrian' }),
      sim.addActor(174, -sim.road.travelHalf - 3.0, 'pedestrian', false, false, { custom: true, modelId: 'pedestrian-business' })
    ];
    const loadModel = async id => Promise.race([
      sim.modelRegistry.load(id),
      new Promise(resolve => setTimeout(() => resolve(null), 14000))
    ]);
    await Promise.all(created.map(actor => loadModel(actor.modelType)));
    await new Promise(resolve => setTimeout(resolve, 250));
    const wheelBefore = created.map(actor => actor.mesh?.userData?.wheels?.[0]?.quaternion?.toArray?.() || null);
    const bikeBefore = created.map(actor => actor.mesh?.userData?.bikeWheels?.[0]?.rotation?.z ?? null);
    sim.updateActorMeshes(0.1);
    // A traffic-control plan may legitimately hold an actor at a light during
    // the integrated tick above. Probe the animation contracts once more with
    // a deterministic motion sample so this gate validates the rig, not the
    // actor's incidental signal state.
    created.forEach((actor, index) => {
      if (actor.type === 'cyclist') window.SimVehicleVisuals?.animateCyclist?.(actor.mesh, 6, 0.1, index * 0.4);
      else sim.animateVehicleWheels?.(actor.mesh, 6, 0.1, 0.12);
    });
    const semiActor = created.find(actor => actor.modelType === 'semi');
    const semiWasMoving = semiActor?.moving;
    if (semiActor) {
      semiActor.moving = false;
      semiActor.lateralVelocity = 3;
      sim.updateActorMeshes(0.1);
    }
    const semiArticulation = semiActor?.mesh?.userData?.trailer ? Math.abs(semiActor.mesh.userData.trailer.rotation.y) : 0;
    if (semiActor) semiActor.moving = semiWasMoving;
    return {
      actors: created.map((actor, index) => ({ modelType: actor.modelType, modelId: actor.mesh?.userData?.modelId || null, modelQuality: actor.mesh?.userData?.modelQuality || null, vehicleProfile: actor.mesh?.userData?.vehicleProfile || null, paintColor: actor.paintColor || actor.mesh?.userData?.paintColor || null, wheelCount: actor.mesh?.userData?.wheels?.length || 0, wheelAnimated: !!(wheelBefore[index] && actor.mesh?.userData?.wheels?.[0]?.quaternion?.toArray?.().some((value, component) => Math.abs(value - wheelBefore[index][component]) > 1e-6)), headlightCount: actor.mesh?.userData?.headlights?.length || 0, brakeLightCount: actor.mesh?.userData?.brakeLights?.length || 0, turnSignalCount: Object.values(actor.mesh?.userData?.turnSignals || {}).flat().length, bikeWheelCount: actor.mesh?.userData?.bikeWheels?.length || 0, bikeWheelAnimated: !!(bikeBefore[index] != null && Math.abs((actor.mesh?.userData?.bikeWheels?.[0]?.rotation?.z ?? bikeBefore[index]) - bikeBefore[index]) > 1e-6), roundedParts: (() => { let count = 0; actor.mesh?.traverse?.(node => { if (node.userData?.roundedVehiclePart) count++; }); return count; })() })),
      semiArticulation,
      loaded: [...sim.modelRegistry.loaded.keys()]
    };
  });
  await page.screenshot({ path: 'output/local-glb-traffic-fleet.png', timeout: 120000, animations: 'disabled' });
  await safeClose(page);
  return { result, errors };
}

async function verifyPedestrian() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.__sim?.setQuality?.('balanced'));
  const result = await page.evaluate(async () => {
    const response = await fetch('/assets/actors/cesium-man.glb');
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sim = window.__sim;
    const model = sim?.modelRegistry ? await sim.modelRegistry.load('pedestrian') : null;
    const actor = sim?.addActor ? sim.addActor(30, sim.road.laneW / 2, 'pedestrian', false, false, { custom: true }) : null;
    await new Promise(resolve => setTimeout(resolve, 250));
    if (sim) sim.stepSimulation(0);
    return {
      status: response.status,
      bytes: bytes.length,
      magic: String.fromCharCode(...bytes.slice(0, 4)),
      loaderReady: !!window.SimGLTFLoader,
      routePlannerReady: !!sim?.routePlanner,
      modelId: model?.userData?.modelId || null,
      actorModelId: actor?.mesh?.userData?.modelId || null,
      modelQuality: actor?.mesh?.userData?.modelQuality || null
    };
  });
  await page.screenshot({ path: 'output/local-glb-pedestrian.png', timeout: 120000, animations: 'disabled' });
  await safeClose(page);
  return { result, errors };
}

async function verifyEgoVariants() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1800);
  const result = await page.evaluate(async () => {
    const sim = window.__sim;
    const ids = ['compact', 'sport', 'coupe', 'luxury', 'electric', 'crossover', 'boxtruck', 'semi', 'delivery', 'taxi', 'motorcycle', 'minivan'];
    const variants = [];
    for (const id of ids) {
      sim.vehicleTypeName = id;
      sim.spawnEgoVehicle(id);
      await new Promise(resolve => setTimeout(resolve, 35));
      const props = sim.getVehicleProps();
      variants.push({ requested: id, modelId: sim.egoCar?.userData?.modelId || null, modelQuality: sim.egoCar?.userData?.modelQuality || null, topSpeed: props?.topSpeed || null, wheelbase: props?.wheelbase || null });
    }
    sim.mode = 'chase';
    sim.stepSimulation(0);
    return variants;
  });
  await page.screenshot({ path: 'output/local-glb-motorcycle.png', timeout: 120000, animations: 'disabled' });
  await safeClose(page);
  return { result, errors };
}

const pickup = await verifyVehicle('pickup', 'output/local-glb-pickup.png');
const sedan = await verifyVehicle('sedan', 'output/local-glb-sedan.png');
// Car Concept is a heavyweight hero asset; validate its binary, dimensions,
// registry identity, and ego replacement without making the GPU screenshot a
// correctness gate for the rest of the asset pack.
const suv = await verifyVehicle('suv', null);
const pedestrian = await verifyPedestrian();
const egoVariants = await verifyEgoVariants();
const trafficFleet = await verifyTrafficFleet();
console.log(JSON.stringify({ pickup, sedan, suv, pedestrian, egoVariants, trafficFleet }, null, 2));
await safeCloseBrowser();

const checks = [pickup, sedan, suv, pedestrian].flatMap(({ result, errors }) => [
  result.status === 200,
  result.magic === 'glTF',
  result.loaderReady,
  result.routePlannerReady || result.vehicleId === undefined,
  result.modelId === result.vehicleId || result.modelId === 'pedestrian',
  result.vehicleId === undefined ? result.actorModelId === 'pedestrian' : result.egoModelId === result.vehicleId,
  result.vehicleId === undefined || result.egoOrientationApplied,
  errors.length === 0
]);
checks.push(trafficFleet.result.actors.every(actor => actor.modelId === actor.modelType));
checks.push(pickup.result.wheelCount >= 2 && pickup.result.frontWheelCount >= 1);
checks.push(suv.result.wheelCount >= 4 && suv.result.frontWheelCount >= 2);
checks.push(sedan.result.wheelCount >= 4 && sedan.result.frontWheelCount >= 2);
checks.push([pickup, sedan, suv].every(({ result }) => result.headlightCount >= 1 && result.brakeLightCount >= 1 && result.turnSignalCount >= 2));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'van' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'minivan' && actor.modelQuality === 'premium-procedural' && actor.vehicleProfile === 'minivan' && actor.wheelCount >= 4));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'coupe' && actor.modelQuality === 'premium-procedural' && actor.vehicleProfile === 'coupe' && actor.wheelCount >= 4));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'delivery' && actor.modelQuality === 'pbr-glb'));
checks.push(trafficFleet.result.actors.filter(actor => ['van', 'delivery'].includes(actor.modelType)).every(actor => actor.vehicleProfile === actor.modelType));
checks.push(trafficFleet.result.actors.some(actor => ['compact', 'sport', 'luxury', 'crossover', 'taxi'].includes(actor.modelType) && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'luxury' && actor.vehicleProfile === 'luxury' && actor.roundedParts >= 4));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'suv' && actor.modelQuality === 'pbr-glb'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'pedestrian-business' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'bus' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'boxtruck' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'semi' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'motorcycle' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'cyclist' && actor.modelQuality === 'premium-procedural'));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'worker' && actor.modelQuality === 'premium-procedural'));
const proceduralVehicleModels = ['compact', 'sport', 'coupe', 'luxury', 'electric', 'crossover', 'taxi', 'van', 'minivan', 'boxtruck', 'semi', 'motorcycle', 'bus'];
checks.push(trafficFleet.result.actors.filter(actor => proceduralVehicleModels.includes(actor.modelType)).every(actor => actor.wheelCount >= 4 && actor.wheelAnimated));
checks.push(trafficFleet.result.actors.filter(actor => proceduralVehicleModels.includes(actor.modelType)).every(actor => actor.headlightCount >= 1));
checks.push(trafficFleet.result.actors.filter(actor => ['sedan', 'pickup', 'suv', ...proceduralVehicleModels].includes(actor.modelType)).every(actor => actor.brakeLightCount >= 1 && actor.turnSignalCount >= 2));
checks.push(trafficFleet.result.actors.filter(actor => actor.modelType === 'delivery').every(actor => actor.wheelCount >= 4 && actor.wheelAnimated && actor.headlightCount >= 1 && actor.brakeLightCount >= 1 && actor.turnSignalCount >= 2));
checks.push(trafficFleet.result.actors.filter(actor => proceduralVehicleModels.includes(actor.modelType)).every(actor => actor.roundedParts > 0));
checks.push(trafficFleet.result.actors.some(actor => actor.modelType === 'cyclist' && actor.bikeWheelCount === 2 && actor.bikeWheelAnimated));
const trafficPaints = trafficFleet.result.actors
  .filter(actor => ['car', 'parked', 'sedan', 'suv', 'crossover', 'pickup', 'van', 'delivery', 'compact', 'sport', 'coupe', 'luxury', 'electric', 'taxi', 'boxtruck', 'semi', 'motorcycle', 'bus'].includes(actor.modelType))
  .map(actor => actor.paintColor)
  .filter(Boolean);
checks.push(new Set(trafficPaints).size >= 2);
checks.push(trafficFleet.errors.length === 0);
checks.push(egoVariants.result.every(variant => variant.modelId === variant.requested && ['premium-procedural', 'pbr-glb'].includes(variant.modelQuality) && Number.isFinite(variant.topSpeed) && Number.isFinite(variant.wheelbase)));
checks.push((() => { const variant = egoVariants.result.find(value => value.requested === 'motorcycle'); return variant?.topSpeed === 86 && variant?.wheelbase === 2.12; })());
checks.push((() => { const variant = egoVariants.result.find(value => value.requested === 'semi'); return variant?.topSpeed === 62 && variant?.wheelbase === 5.10; })());
checks.push(egoVariants.errors.length === 0);
checks.push(trafficFleet.result.semiArticulation > 0.001);
if (checks.some(value => !value)) process.exitCode = 1;
