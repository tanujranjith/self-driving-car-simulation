import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
const result = await page.evaluate(async () => {
  const sim = window.__sim;
  sim.setQuality?.('balanced');
  sim.spawnEgoVehicle('luxury');
  const actor = sim.addActor(54, sim.road.laneW * 1.5, 'car', true, false, { custom: true, modelId: 'luxury' });
  await new Promise(resolve => setTimeout(resolve, 250));
  sim.mode = 'chase';
  sim.paused = true;
  sim.updateActorMeshes?.(0.1);
  sim.stepSimulation(0);
  const model = sim.egoCar;
  let parts = 0;
  model?.traverse?.(() => { parts += 1; });
  const details = model?.userData?.luxuryDetails || {};
  return {
    ego: {
      modelId: model?.userData?.modelId || null,
      modelQuality: model?.userData?.modelQuality || null,
      source: model?.userData?.modelSource || null,
      profile: model?.userData?.vehicleProfile || null,
      parts,
      wheels: model?.userData?.wheels?.length || 0,
      headlights: model?.userData?.headlights?.length || 0,
      brakeLights: model?.userData?.brakeLights?.length || 0,
      turnSignals: Object.values(model?.userData?.turnSignals || {}).flat().length,
      details
    },
    actor: {
      modelId: actor?.mesh?.userData?.modelId || null,
      modelQuality: actor?.mesh?.userData?.modelQuality || null,
      profile: actor?.mesh?.userData?.vehicleProfile || null
    },
    props: sim.getVehicleProps?.() || null,
    state: JSON.parse(sim.renderGameToText())
  };
});
await page.screenshot({ path: 'output/luxury-sedan.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));
const checks = [
  result.ego.modelId === 'luxury',
  result.ego.modelQuality === 'premium-procedural',
  result.ego.source === 'fallback',
  result.ego.profile === 'luxury',
  result.ego.parts >= 35,
  result.ego.wheels >= 4,
  result.ego.headlights >= 2,
  result.ego.brakeLights >= 2,
  result.ego.turnSignals >= 4,
  result.ego.details.panoramicRoof === true,
  result.ego.details.grilleBars === 5,
  result.ego.details.continuousLed === true,
  result.actor.modelId === 'luxury',
  result.actor.profile === 'luxury',
  result.props?.topSpeed === 86,
  result.props?.wheelbase === 2.96,
  errors.length === 0
];
if (checks.some(value => !value)) process.exitCode = 1;
