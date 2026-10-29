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
  sim.renderer.render = () => {};
  sim.setScenarioPreset('rail-crossing-stop');
  for (const actor of sim.actors) if (actor.mesh) sim.dynamic.remove(actor.mesh);
  sim.actors = [];
  sim.nextActorZ = 99999;
  sim.nextOncomingZ = 99999;
  sim.nextPedestrianZ = 99999;
  sim.nextCyclistZ = 99999;
  sim.nextEmergencyZ = 99999;
  sim.paused = false;
  sim.controlSource = 'autonomy';
  Object.assign(sim.env, { timeOfDay: 'day', weather: 'clear', surface: 'dry', visibility: 800 });
  sim.applyEnvironment();
  sim.advanceTime(50000);
  const text = JSON.parse(sim.renderGameToText());
  return {
    scenario: text.scenario,
    ego: text.ego,
    decision: text.decision,
    map: text.environment.map,
    crossingCount: sim.railCrossings?.length || 0,
    crossingReleased: !!sim._railCrossingReleased,
    log: sim.log?.items?.slice(0, 8) || []
  };
});

await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));

const checks = [
  result.map === 'rural',
  result.crossingCount === 1,
  result.crossingReleased,
  result.scenario.id === 'rail-crossing-stop',
  result.scenario.metrics.railCrossingStops > 0,
  result.scenario.status === 'COMPLETE',
  result.scenario.failed === false,
  result.scenario.metrics.collisions === 0,
  result.scenario.metrics.ruleViolations === 0,
  result.decision.railCrossing === 'none',
  result.ego.progress >= 470,
  errors.length === 0
];
console.log(JSON.stringify({ checks }, null, 2));
if (checks.some(value => !value)) process.exitCode = 1;
