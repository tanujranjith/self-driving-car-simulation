import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);

const result = await page.evaluate(async () => {
  const sim = window.__sim;
  localStorage.removeItem('aplab.scenario');
  const lane = sim.road.laneW / 2;
  const lead = sim.addActor(42, lane, 'car', true, false, { custom: true, modelId: 'pickup' });
  lead.speed = 6.2;
  lead.desiredSpeed = 9.8;
  lead.driverStyle = 'cautious';
  lead.turnIntent = 'right';
  lead.scenarioRole = 'delivery-lead';
  const cyclist = sim.addActor(58, sim.road.laneW * 1.5, 'cyclist', true, false, { custom: true, modelId: 'cyclist' });
  cyclist.speed = 4.4;
  cyclist.crossingTarget = sim.road.travelHalf + 1.4;
  cyclist.crossingStartRange = 34;
  document.getElementById('customModel').value = 'semi';
  sim.addCustom('car');
  const before = sim.scenarioData();
  sim.saveScenario();
  const saved = JSON.parse(localStorage.getItem('aplab.scenario'));
  const savedSummary = saved.items.map(item => ({ type: item.type, modelId: item.modelId, driverStyle: item.driverStyle, turnIntent: item.turnIntent }));
  const removed = sim.clearCustomActors();
  const afterClear = sim.actors.filter(actor => actor.custom).length;
  sim.loadScenario();
  await new Promise(resolve => setTimeout(resolve, 250));
  const restored = sim.actors.filter(actor => actor.custom).map(actor => ({
    type: actor.type,
    modelType: actor.modelType,
    speed: actor.speed,
    desiredSpeed: actor.desiredSpeed,
    driverStyle: actor.driverStyle,
    turnIntent: actor.turnIntent,
    scenarioRole: actor.scenarioRole,
    crossingTarget: actor.crossingTarget
  }));
  return { before, saved, savedSummary, removed, afterClear, restored };
});

await page.screenshot({ path: 'output/scenario-authoring.png', animations: 'disabled' });
await page.close();
await browser.close();

console.log(JSON.stringify({ result, errors }, null, 2));
const valid = result.saved?.v === 2 &&
  result.saved?.kind === 'self-driving-sim-scenario' &&
  result.savedSummary?.some(item => item.type === 'car' && item.modelId === 'pickup' && item.driverStyle === 'cautious' && item.turnIntent === 'right') &&
  result.savedSummary?.some(item => item.type === 'cyclist' && item.modelId === 'cyclist') &&
  result.savedSummary?.some(item => item.type === 'car' && item.modelId === 'semi') &&
  result.removed >= 3 &&
  result.afterClear === 0 &&
  result.restored?.length === 3 &&
  result.restored.some(item => item.modelType === 'pickup' && item.driverStyle === 'cautious' && item.turnIntent === 'right' && item.scenarioRole === 'delivery-lead') &&
  result.restored.some(item => item.modelType === 'cyclist' && item.type === 'cyclist') &&
  result.restored.some(item => item.modelType === 'semi') &&
  errors.length === 0;
if (!valid) process.exitCode = 1;
