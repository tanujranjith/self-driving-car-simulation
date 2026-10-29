import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
const probe = await page.evaluate(() => {
  const sim = window.__sim;
  sim.mapType = 'highway';
  sim.reset();
  sim.paused = true;
  sim.progress = 1580;
  sim.mode = 'chase';
  sim.updateRoute();
  sim.updateCamera();
  sim.stepSimulation(0);
  const portal = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'tunnel-portal');
  const lights = portal?.userData?.tunnelLights || [];
  window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, 0, .1, 'highway');
  const firstOpacity = lights[0]?.material?.opacity ?? null;
  window.SimWorldVisuals?.animateWorldModels?.(sim.cityGroup, .8, .1, 'highway');
  const secondOpacity = lights[0]?.material?.opacity ?? null;
  sim.renderer.render(sim.scene, sim.camera);
  return {
    state: JSON.parse(sim.renderGameToText()),
    portal: { present: !!portal, parts: portal?.children?.length || 0, lights: lights.length, firstOpacity, secondOpacity, lightPulse: Math.abs((secondOpacity || 0) - (firstOpacity || 0)) > 1e-6, worldModelCount: sim.worldModelCounts?.['tunnel-portal'] || 0 }
  };
});
await page.screenshot({ path: 'output/tunnel-portal-approach.png', timeout: 120000, animations: 'disabled' });
console.log(JSON.stringify({ probe, errors }, null, 2));
await page.close();
await browser.close();
if (errors.length || !probe.portal.present || probe.portal.parts < 10 || probe.portal.lights < 4 || !probe.portal.lightPulse || probe.portal.worldModelCount < 1) process.exitCode = 1;
