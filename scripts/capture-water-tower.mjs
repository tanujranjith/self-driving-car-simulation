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
  sim.mapType = 'rural';
  sim.reset();
  sim.paused = true;
  sim.progress = 700;
  sim.mode = 'chase';
  sim.updateRoute();
  sim.updateCamera();
  sim.stepSimulation(0);
  const tower = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'water-tower');
  const beacon = tower?.userData?.waterTowerBeacon;
  let meshes = 0;
  tower?.traverse?.(node => { if (node.isMesh) meshes += 1; });
  let size = null;
  if (tower && window.THREE) {
    tower.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tower);
    const vector = box.getSize(new THREE.Vector3());
    size = { x: +vector.x.toFixed(2), y: +vector.y.toFixed(2), z: +vector.z.toFixed(2) };
  }
  window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, 0, .1, 'rural');
  const firstOpacity = beacon?.material?.opacity ?? null;
  window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, 0.8, .1, 'rural');
  const secondOpacity = beacon?.material?.opacity ?? null;
  if (tower) {
    sim.camera.position.set(tower.position.x + 18, 6.5, tower.position.z + 18);
    sim.camera.lookAt(tower.position.x, 5.2, tower.position.z);
    sim.renderer.render(sim.scene, sim.camera);
  }
  return {
    state: JSON.parse(sim.renderGameToText()),
    tower: {
      present: !!tower,
      modelQuality: tower?.userData?.modelQuality || null,
      interaction: tower?.userData?.worldInteraction || null,
      meshes,
      size,
      beacon: !!beacon,
      firstOpacity,
      secondOpacity,
      beaconPulse: Number.isFinite(firstOpacity) && Number.isFinite(secondOpacity) && Math.abs(secondOpacity - firstOpacity) > 1e-6,
      worldModelCount: sim.worldModelCounts?.['water-tower'] || 0
    }
  };
});
await page.screenshot({ path: 'output/water-tower-approach.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));
const checks = [
  result.tower.present,
  result.tower.modelQuality === 'premium-procedural',
  result.tower.interaction === 'rural-landmark',
  result.tower.meshes >= 30,
  result.tower.size?.y > 9,
  result.tower.beacon,
  result.tower.beaconPulse,
  result.tower.worldModelCount === 1,
  result.state.environment.map === 'rural',
  errors.length === 0
];
if (checks.some(value => !value)) process.exitCode = 1;
