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
  sim.controls = [];
  sim.sensorHealth.dropoutUntil = 0;
  sim.progress = 405;
  sim.mode = 'chase';
  sim.lane = sim.road.laneW / 2;
  sim.targetLane = sim.lane;
  Object.assign(sim.env, { timeOfDay: 'day', weather: 'clear', surface: 'dry', visibility: 800 });
  sim.applyEnvironment();

  const crossing = sim.railCrossings?.[0] || null;
  const base = (crossing?.model?.position?.z || 0) * .010;
  let activeTime = null;
  let inactiveTime = null;
  for (let time = 0; time <= 10; time += .05) {
    const active = Math.sin(time * 1.9 + base) > .55;
    if (active && activeTime === null) activeTime = +time.toFixed(2);
    if (!active && inactiveTime === null) inactiveTime = +time.toFixed(2);
  }

  const inspect = (time) => {
    sim.simTime = time;
    const analysis = sim.analyze();
    sim.lastAnalysis = analysis;
    return {
      time,
      reason: analysis.reason,
      railCrossingDecision: analysis.railCrossingDecision,
      desiredMph: +analysis.desiredMph.toFixed(2),
      nearest: analysis.nearest ? {
        kind: analysis.nearest.kind,
        distance: +analysis.nearest.distance.toFixed(2)
      } : null
    };
  };

  const active = inspect(activeTime);
  const activeText = JSON.parse(sim.renderGameToText());
  const clear = inspect(inactiveTime);

  sim.simTime = activeTime;
  sim.progress = 382;
  sim.lastAnalysis = sim.analyze();
  window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, activeTime, .5, 'rural');
  const qaCrossing = sim.railCrossings?.[0]?.model;
  if (qaCrossing) {
    const approach = sim.road.point(386, 0);
    sim.camera.position.set(approach.x, 4.0, approach.z);
    sim.camera.lookAt(qaCrossing.position.x, 1.35, qaCrossing.position.z);
    sim._lastPausedRender = performance.now();
    sim.renderer.render(sim.scene, sim.camera);
  }

  return {
    active,
    clear,
    activeText: activeText.decision,
    crossingCount: sim.railCrossings?.length || 0,
    activeTime,
    inactiveTime,
    text: JSON.parse(sim.renderGameToText())
  };
});

await page.screenshot({ path: 'output/rail-crossing-active-stop.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));

const checks = [
  result.crossingCount === 1,
  result.activeTime !== null,
  result.inactiveTime !== null,
  result.active.railCrossingDecision === 'active',
  result.active.reason === 'rail-crossing',
  result.active.nearest?.kind === 'active rail crossing',
  result.active.desiredMph < result.clear.desiredMph,
  result.clear.railCrossingDecision === 'clear',
  result.clear.reason !== 'rail-crossing',
  result.activeText.railCrossing === 'active',
  result.text.decision.railCrossing === 'active',
  errors.length === 0
];
console.log(JSON.stringify({ checks }, null, 2));
if (checks.some(value => !value)) process.exitCode = 1;
