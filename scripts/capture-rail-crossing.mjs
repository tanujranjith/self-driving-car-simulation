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
  const inspect = (map, z) => {
    sim.mapType = map;
    sim.reset();
    sim.paused = true;
    const crossing = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'rail-crossing');
    let meshes = 0;
    crossing?.traverse?.(node => { if (node.isMesh) meshes += 1; });
    const lampSamples = [];
    const gateSamples = [];
    for (let time = 0; time <= 4; time += .4) {
      window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, time, .4, map);
      lampSamples.push(crossing?.userData?.railLamps?.[0]?.material?.opacity ?? null);
      gateSamples.push(Math.abs(crossing?.userData?.railGates?.[0]?.rotation?.z || 0));
    }
    let size = null;
    if (crossing && window.THREE) {
      crossing.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(crossing);
      const vector = box.getSize(new THREE.Vector3());
      size = { x: +vector.x.toFixed(2), y: +vector.y.toFixed(2), z: +vector.z.toFixed(2) };
    }
    return {
      map,
      present: !!crossing,
      style: crossing?.userData?.railStyle || null,
      meshes,
      size,
      lamps: crossing?.userData?.railLamps?.length || 0,
      gates: crossing?.userData?.railGates?.length || 0,
      lampRange: lampSamples.length ? +(Math.max(...lampSamples) - Math.min(...lampSamples)).toFixed(2) : 0,
      gateMaxAngle: gateSamples.length ? +Math.max(...gateSamples).toFixed(2) : 0,
      worldModelCount: sim.worldModelCounts?.['rail-crossing'] || 0
    };
  };

  const rural = inspect('rural', 420);
  sim.mapType = 'rural';
  sim.reset();
  sim.paused = true;
  sim.mode = 'chase';
  sim.progress = 382;
  const crossing = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'rail-crossing');
  if (crossing) {
    const approach = sim.road.point(386, 0);
    sim.camera.position.set(approach.x, 4.0, approach.z);
    sim.camera.lookAt(crossing.position.x, 1.35, crossing.position.z);
    sim._lastPausedRender = performance.now();
    sim.renderer.render(sim.scene, sim.camera);
  }
  const suburb = inspect('suburb', 560);
  sim.mapType = 'rural';
  sim.reset();
  sim.paused = true;
  sim.mode = 'chase';
  sim.progress = 382;
  const qaCrossing = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'rail-crossing');
  if (qaCrossing) {
    const approach = sim.road.point(386, 0);
    sim.camera.position.set(approach.x, 4.0, approach.z);
    sim.camera.lookAt(qaCrossing.position.x, 1.35, qaCrossing.position.z);
    sim._lastPausedRender = performance.now();
    sim.renderer.render(sim.scene, sim.camera);
  }
  return { rural, suburb, text: JSON.parse(sim.renderGameToText()) };
});

await page.screenshot({ path: 'output/rail-crossing-approach.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));

const checks = [
  result.rural.present,
  result.rural.style === 'rural',
  result.rural.meshes >= 35,
  result.rural.size?.x > 15,
  result.rural.size?.y > 3,
  result.rural.lamps === 4,
  result.rural.gates === 2,
  result.rural.lampRange > .4,
  result.rural.gateMaxAngle > .4,
  result.rural.worldModelCount === 1,
  result.suburb.present,
  result.suburb.style === 'suburb',
  result.suburb.worldModelCount === 1,
  result.text.environment.map === 'rural',
  errors.length === 0
];
console.log(JSON.stringify({ checks }, null, 2));
if (checks.some(value => !value)) process.exitCode = 1;
