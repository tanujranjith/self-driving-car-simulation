import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);

const result = await page.evaluate(() => {
  const sim = window.__sim;
  const inspectMap = mapName => {
    sim.mapType = mapName;
    sim.reset();
    sim.paused = true;
    sim.progress = mapName === 'rural' ? 1050 : 1250;
    sim.mode = 'chase';
    sim.updateRoute();
    sim.updateCamera();
    sim.stepSimulation(0);
    const turbine = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'wind-turbine');
    let meshes = 0;
    turbine?.traverse?.(node => { if (node.isMesh) meshes += 1; });
    let size = null;
    if (turbine && window.THREE) {
      turbine.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(turbine);
      const vector = box.getSize(new THREE.Vector3());
      size = { x: +vector.x.toFixed(2), y: +vector.y.toFixed(2), z: +vector.z.toFixed(2) };
    }
    const rotor = turbine?.userData?.windTurbineRotor;
    const beacon = turbine?.userData?.windTurbineBeacon;
    window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, 0, .1, mapName);
    const firstRotation = rotor?.rotation?.z ?? null;
    const firstOpacity = beacon?.material?.opacity ?? null;
    const beaconSamples = [firstOpacity];
    for (const sampleTime of [.8, 1.6, 2.4, 3.2, 4.0]) {
      window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, sampleTime, .1, mapName);
      beaconSamples.push(beacon?.material?.opacity ?? null);
    }
    const secondRotation = rotor?.rotation?.z ?? null;
    const secondOpacity = beaconSamples.at(-1);
    if (turbine && mapName === 'rural') {
      sim.camera.position.set(turbine.position.x + 22, 8.2, turbine.position.z + 22);
      sim.camera.lookAt(turbine.position.x, 8.0, turbine.position.z);
      sim.renderer.render(sim.scene, sim.camera);
    }
    return {
      map: mapName,
      present: !!turbine,
      modelQuality: turbine?.userData?.modelQuality || null,
      interaction: turbine?.userData?.worldInteraction || null,
      meshes,
      size,
      blades: turbine?.userData?.windTurbineBlades?.length || 0,
      rotor: !!rotor,
      beacon: !!beacon,
      rotorAnimated: Number.isFinite(firstRotation) && Number.isFinite(secondRotation) && Math.abs(secondRotation - firstRotation) > 1e-6,
      beaconPulse: beaconSamples.every(Number.isFinite) && Math.max(...beaconSamples) - Math.min(...beaconSamples) > 1e-6,
      worldModelCount: sim.worldModelCounts?.['wind-turbine'] || 0,
      state: JSON.parse(sim.renderGameToText())
    };
  };
  return { rural: inspectMap('rural'), highway: inspectMap('highway') };
});

await page.evaluate(() => {
  const sim = window.__sim;
  sim.mapType = 'rural';
  sim.reset();
  sim.paused = true;
  sim.progress = 1050;
  sim.mode = 'chase';
  sim.updateRoute();
  sim.updateCamera();
  sim.stepSimulation(0);
  const turbine = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'wind-turbine');
  if (turbine) {
    sim.camera.position.set(turbine.position.x + 22, 8.2, turbine.position.z + 22);
    sim.camera.lookAt(turbine.position.x, 8.0, turbine.position.z);
    sim.renderer.render(sim.scene, sim.camera);
  }
});

await page.screenshot({ path: 'output/wind-turbine-approach.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));
const checks = [
  errors.length === 0,
  result.rural.present && result.highway.present,
  result.rural.modelQuality === 'premium-procedural' && result.highway.modelQuality === 'premium-procedural',
  result.rural.interaction === 'renewable-landmark' && result.highway.interaction === 'renewable-landmark',
  result.rural.meshes >= 15 && result.rural.size?.y > 17,
  result.rural.blades === 3 && result.rural.rotor && result.rural.beacon,
  result.rural.rotorAnimated && result.rural.beaconPulse,
  result.rural.worldModelCount === 1 && result.highway.worldModelCount === 1,
  result.rural.state.environment.map === 'rural' && result.highway.state.environment.map === 'highway'
];
if (checks.some(value => !value)) process.exitCode = 1;
