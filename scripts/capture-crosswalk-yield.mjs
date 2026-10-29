import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
const state = await page.evaluate(() => {
  const sim = window.__sim;
  sim.setQuality('balanced');
  sim.mapType = 'downtown';
  sim.reset();
  for (const actor of [...sim.actors]) sim.dynamic.remove(actor.mesh);
  sim.actors = [];
  sim.paused = true;
  const car = sim.addActor(20, sim.road.laneW / 2, 'car', true, false, { custom: true, modelId: 'compact' });
  car.speed = 12;
  car.desiredSpeed = 14;
  const pedestrian = sim.addActor(28, sim.road.travelHalf + 1.1, 'pedestrian', false, false, { custom: true, modelId: 'pedestrian' });
  pedestrian.crossingStarted = true;
  pedestrian.crossingDir = -1;
  pedestrian.crossingTarget = -sim.road.travelHalf - 1.1;
  pedestrian.crossingStartRange = 64;
  sim.paused = false;
  sim.mode = 'chase';
  sim.advanceTime(1200);
  sim.paused = true;
  sim.stepSimulation(0);
  return {
    trafficCar: { speed: +car.speed.toFixed(2), pedestrianYielding: !!car.pedestrianYielding, behavior: car.pedestrianYielding ? 'crosswalk-yield' : 'cruise' },
    pedestrian: { lateral: +pedestrian.lateral.toFixed(2), crossingStarted: !!pedestrian.crossingStarted },
    state: JSON.parse(sim.renderGameToText())
  };
});
await page.screenshot({ path: 'output/web-game-ambient-crosswalk-yield-final/gameplay-crosswalk.png', timeout: 120000, animations: 'disabled' });
console.log(JSON.stringify({ state, errors }, null, 2));
await browser.close();
if (errors.length || !state.trafficCar.pedestrianYielding || state.trafficCar.speed >= 12) process.exitCode = 1;
