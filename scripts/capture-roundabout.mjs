import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1600);
const probe = await page.evaluate(() => {
  const sim = window.__sim;
  sim.mapType = 'downtown';
  sim.reset();
  sim.paused = true;
  sim.progress = 1165;
  sim.updateRoute();
  sim.updateCamera();
  sim.mode = 'chase';
  sim.stepSimulation(0);
  sim.renderer.render(sim.scene, sim.camera);
  const group = sim.intersectionGroup?.children?.find(node => node.userData?.roundabout);
  return {
    state: JSON.parse(sim.renderGameToText()),
    roundabout: { present: !!group, parts: group?.children?.length || 0, worldModelCount: sim.worldModelCounts?.roundabout || 0, plannerState: sim.roundaboutState }
  };
});
await page.screenshot({ path: 'output/roundabout-approach.png', timeout: 120000, animations: 'disabled' });
console.log(JSON.stringify({ probe, errors }, null, 2));
await browser.close();
if (errors.length || !probe.roundabout.present || probe.roundabout.parts < 5 || probe.roundabout.worldModelCount < 2) process.exitCode = 1;
