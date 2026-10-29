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
  sim.mode = 'chase';
  sim.driveMode = 'safe';
  sim.lane = sim.road.laneW / 2;
  sim.targetLane = sim.lane;
  sim.speed = 50 * 0.44704;
  sim.targetMph = 70;
  sim.limitMph = 70;
  const lead = sim.addActor(sim.progress + 35, sim.lane, 'car', true, false, { custom: true, modelId: 'sedan' });
  lead.speed = 65 * 0.44704;
  lead.desiredSpeed = lead.speed;

  const probe = (weather, surface, visibility) => {
    Object.assign(sim.env, { timeOfDay: 'day', weather, surface, visibility });
    sim.applyEnvironment();
    const analysis = sim.analyze();
    sim.lastAnalysis = analysis;
    return {
      weather,
      surface,
      reason: analysis.reason,
      desiredMph: +analysis.desiredMph.toFixed(2),
      following: analysis.following ? {
        state: analysis.following.state,
        desiredHeadwaySec: +analysis.following.desiredHeadwaySec.toFixed(3),
        targetGapM: +analysis.following.targetGapM.toFixed(2),
        comfortGapM: +analysis.following.comfortGapM.toFixed(2),
        actualGapM: +analysis.following.actualGapM.toFixed(2),
        headwaySec: +analysis.following.headwaySec.toFixed(3),
        surfaceRisk: +analysis.following.surfaceRisk.toFixed(3),
        perceptionRisk: +analysis.following.perceptionRisk.toFixed(3),
        risk: +analysis.following.risk.toFixed(3)
      } : null
    };
  };

  const dry = probe('clear', 'dry', 800);
  const cautious = probe('fog', 'wet', 120);
  Object.assign(sim.env, { timeOfDay: 'day', weather: 'overcast', surface: 'wet', visibility: 500 });
  sim.applyEnvironment();
  sim.lastAnalysis = sim.analyze();
  sim.updateCamera();
  sim.renderer.render(sim.scene, sim.camera);
  return {
    dry,
    cautious,
    text: JSON.parse(sim.renderGameToText()),
    leadId: lead.id
  };
});

await page.screenshot({ path: 'output/adaptive-headway.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));

const dryFollow = result.dry.following;
const cautiousFollow = result.cautious.following;
const checks = [
  result.dry.reason === 'following',
  ['following', 'perception'].includes(result.cautious.reason),
  dryFollow?.state === 'following',
  cautiousFollow?.state === 'following',
  cautiousFollow?.desiredHeadwaySec > dryFollow?.desiredHeadwaySec,
  cautiousFollow?.targetGapM > dryFollow?.targetGapM,
  cautiousFollow?.comfortGapM > dryFollow?.comfortGapM,
  cautiousFollow?.risk > dryFollow?.risk,
  result.cautious.desiredMph < result.dry.desiredMph,
  cautiousFollow?.actualGapM === dryFollow?.actualGapM,
  result.text.decision.following?.desiredHeadwaySec > 0,
  errors.length === 0
];
if (checks.some(value => !value)) process.exitCode = 1;
console.log(JSON.stringify({ checks }, null, 2));
