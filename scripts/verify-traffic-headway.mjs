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
  sim.mapType = 'highway';
  sim.reset();
  sim.paused = true;
  sim.controls = [];
  for (const actor of sim.actors) if (actor.mesh) sim.dynamic.remove(actor.mesh);
  sim.actors = [];
  sim.progress = 180;
  sim.lane = sim.road.laneW / 2;
  sim.targetLane = sim.lane;

  const follower = sim.addActor(sim.progress, sim.lane, 'car', true, false, { custom: true, modelId: 'sedan' });
  follower.driverStyle = 'normal';
  follower.speed = 20.5;
  follower.desiredSpeed = 24.5;
  const lead = sim.addActor(sim.progress + 40, sim.lane, 'car', true, false, { custom: true, modelId: 'sedan' });
  lead.driverStyle = 'normal';
  lead.speed = 21.5;
  lead.desiredSpeed = 24.5;

  const probe = (weather, surface, visibility) => {
    Object.assign(sim.env, { timeOfDay: 'day', weather, surface, visibility });
    sim.applyEnvironment();
    sim.trafficAgentStep(follower, .05);
    return {
      weather,
      surface,
      trafficRisk: +follower.trafficRisk.toFixed(3),
      targetHeadwaySec: +follower.followingHeadwaySec.toFixed(3),
      targetGapM: +follower.followingGapM.toFixed(2),
      leadTtc: Number.isFinite(follower.leadTtc) ? +follower.leadTtc.toFixed(3) : null
    };
  };

  const dry = probe('clear', 'dry', 800);
  const cautious = probe('fog', 'wet', 120);
  Object.assign(sim.env, { timeOfDay: 'day', weather: 'overcast', surface: 'wet', visibility: 500 });
  sim.applyEnvironment();
  sim.trafficAgentStep(follower, .05);
  sim.updateCamera();
  sim.renderer.render(sim.scene, sim.camera);
  const text = JSON.parse(sim.renderGameToText());
  const telemetry = text.actors.find(actor => actor.id === follower.id) || null;
  return { dry, cautious, telemetry, followerId: follower.id, leadId: lead.id };
});

await page.screenshot({ path: 'output/traffic-headway.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));

const checks = [
  result.dry.trafficRisk >= 0,
  result.cautious.trafficRisk > result.dry.trafficRisk,
  result.cautious.targetHeadwaySec > result.dry.targetHeadwaySec,
  result.cautious.targetGapM > result.dry.targetGapM,
  result.cautious.leadTtc === null || result.cautious.leadTtc >= 0,
  result.telemetry?.targetHeadwaySec > result.dry.targetHeadwaySec,
  result.telemetry?.targetGapM > result.dry.targetGapM,
  errors.length === 0
];
console.log(JSON.stringify({ checks }, null, 2));
if (checks.some(value => !value)) process.exitCode = 1;
