import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1200);

const result = await page.evaluate(async () => {
  const sim = window.__sim;
  const actor = sim.addActor(42, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'semi' });
  await sim.modelRegistry.load('semi');
  await new Promise(resolve => setTimeout(resolve, 120));
  const mesh = actor.mesh;
  const rig = mesh?.userData || {};
  const wheelCount = rig.wheels?.length || 0;
  const tractorParts = rig.tractor?.children?.length || 0;
  const trailerParts = rig.trailer?.children?.length || 0;
  const before = rig.trailer?.rotation.y || 0;
  actor.moving = false;
  actor.lateralVelocity = 3;
  sim.updateActorMeshes(.1);
  const after = rig.trailer?.rotation.y || 0;
  sim.animateVehicleBody?.(mesh, 3, 2, 'car', 'semi');
  const tractorRoll = rig.tractor?.rotation.z || 0;
  actor.z = 15;
  actor.lateral = sim.road.laneW / 2;
  actor.moving = false;
  sim.mode = 'chase';
  sim.stepSimulation(0);
  sim.renderer.render(sim.scene, sim.camera);
  return {
    modelId: mesh?.userData?.modelId || null,
    modelQuality: mesh?.userData?.modelQuality || null,
    vehicleProfile: mesh?.userData?.vehicleProfile || null,
    wheelCount,
    tractorParts,
    trailerParts,
    articulationBefore: +before.toFixed(4),
    articulationAfter: +after.toFixed(4),
    articulationMagnitude: +Math.abs(after - before).toFixed(4),
    articulationMax: rig.articulationMax || null,
    tractorRoll: +tractorRoll.toFixed(4)
  };
});

await page.screenshot({ path: 'output/semi-articulation-focused.png', timeout: 120000, animations: 'disabled' });
await page.close();
await browser.close();

console.log(JSON.stringify({ result, errors }, null, 2));
const checks = [
  result.modelId === 'semi',
  result.modelQuality === 'premium-procedural',
  result.vehicleProfile === 'semi',
  result.wheelCount === 12,
  result.tractorParts > 0,
  result.trailerParts > 0,
  result.articulationMagnitude > 0.001,
  Math.abs(result.tractorRoll) > 0.001,
  errors.length === 0
];
if (checks.some(value => !value)) process.exitCode = 1;
