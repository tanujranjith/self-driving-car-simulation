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
  sim.mapType = 'nightcity';
  sim.reset();
  sim.paused = true;
  sim.frame = 2;
  sim.env.weather = 'rain';
  sim.env.timeOfDay = 'night';
  sim.sensorHealth.lens = .62;
  sim.laneVelocity = .8;
  sim.applyEnvironment();
  sim.updateCamFx();
  const camFx = document.getElementById('camFxCanvas');
  const firstPixels = camFx?.getContext('2d')?.getImageData(0, 0, Math.min(12, camFx.width), Math.min(12, camFx.height)).data || [];
  const pixelEnergy = [...firstPixels].reduce((sum, value) => sum + value, 0);
  sim.dayCycle = true;
  sim.cycleSpeed = 1;
  sim.env.timeOfDay = 'day';
  sim._cycleT = .99;
  sim.frame = 1;
  sim.updateDayCycle(.5);
  const state = JSON.parse(sim.renderGameToText());
  sim.renderer.render(sim.scene, sim.camera);
  return {
    rendererEffectsSource: state.environment.rendererEffectsSource,
    dayCycleAdvanced: sim.env.timeOfDay === 'dawn' && sim._cycleT === 0,
    sunAngle: sim.env.sunAngle,
    camFxSized: !!camFx && camFx.width > 0 && camFx.height > 0,
    camFxRendered: pixelEnergy > 0,
    weather: state.environment.weather,
    timeOfDay: state.environment.timeOfDay || sim.env.timeOfDay,
    state
  };
});

await page.screenshot({ path: 'output/renderer-effects-night-rain.png', timeout: 120000, animations: 'disabled' });
await page.close().catch(() => {});
await browser.close().catch(() => {});
console.log(JSON.stringify({ result, errors }, null, 2));
const checks = [
  errors.length === 0,
  result.rendererEffectsSource === 'module',
  result.dayCycleAdvanced,
  Number.isFinite(result.sunAngle),
  result.camFxSized,
  result.camFxRendered,
  result.weather === 'rain'
];
if (checks.some(value => !value)) process.exitCode = 1;
