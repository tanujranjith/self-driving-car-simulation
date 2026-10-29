import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
await page.evaluate(() => window.__sim?.setQuality?.('balanced'));
await page.evaluate(() => { const sim = window.__sim; if (sim?.renderer) sim.renderer.render = () => {}; });

const reports = await page.evaluate(() => {
  const sim = window.__sim;
  const presets = [
    ['safe-merge', ['slow-lead', 'merge-traffic']],
    ['pass-return', ['pass-return-lead', 'pass-return-follower']],
    ['crosswalk', ['crosswalk']],
    ['cyclist-pass', ['cyclist-lead', 'pass-lane-traffic']],
    ['construction', ['closure-cone', 'construction-worker']],
    ['emergency-yield', ['emergency-approach']],
    ['signalized-approach', ['signal-bus']],
    ['rail-crossing-stop', []]
  ];
  const reports = presets.map(([id, roles]) => {
    sim.setScenarioPreset(id);
    const before = JSON.parse(sim.renderGameToText());
    const seededRoles = sim.actors.filter(actor => roles.includes(actor.scenarioRole)).map(actor => actor.scenarioRole);
    sim.paused = false;
    sim.controlSource = 'autonomy';
    const evaluationWindow = id === 'signalized-approach' ? 32000 : id === 'rail-crossing-stop' ? 50000 : id === 'safe-merge' ? 9000 : id === 'pass-return' ? 18000 : 6500;
    sim.advanceTime(evaluationWindow);
    const after = JSON.parse(sim.renderGameToText());
    return {
      id,
      before: { scenario: before.scenario, seededRoles },
      after: { scenario: after.scenario, progress: after.ego.progress, safety: after.safety, evaluation: after.evaluation, passActors: id === 'pass-return' ? sim.actors.filter(actor => roles.includes(actor.scenarioRole)).map(actor => ({ role: actor.scenarioRole, z: Number(actor.z?.toFixed?.(1) ?? actor.z), lateral: Number(actor.lateral?.toFixed?.(2) ?? actor.lateral), baseLateral: actor.baseLateral, targetLateral: actor.targetLateral, passState: actor.passState, passLeadId: actor.passLeadId, turnSignal: actor.turnSignal, moving: actor.moving, speed: Number(actor.speed?.toFixed?.(1) ?? actor.speed) })) : undefined }
    };
  });
  const invalidEvaluator = new window.SimCore.ScenarioEvaluator();
  invalidEvaluator.configure('signalized-approach', 0);
  const invalidScenario = invalidEvaluator.update({ progress: 110, ruleViolations: 1 });
  return { reports, invalidScenario };
});

const scenarioReports = reports.reports;

await page.close();

const visualPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
visualPage.on('pageerror', error => errors.push(String(error)));
visualPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await visualPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await visualPage.waitForTimeout(1800);
await visualPage.selectOption('#scenarioPreset', 'signalized-approach');
await visualPage.waitForTimeout(500);
await visualPage.evaluate(() => { const sim = window.__sim; sim.paused = false; sim.controlSource = 'autonomy'; sim.advanceTime(8500); sim.mode = 'chase'; sim.stepSimulation(0); });
await visualPage.screenshot({ path: 'output/scenario-signalized-approach.png', timeout: 120000, animations: 'disabled' });
await visualPage.close();
await browser.close();

console.log(JSON.stringify({ reports: scenarioReports, invalidScenario: reports.invalidScenario, errors }, null, 2));
const checks = scenarioReports.flatMap(report => [
  report.before.scenario.id === report.id,
  report.before.scenario.status === 'RUNNING',
  report.before.seededRoles.length > 0 || report.id === 'rail-crossing-stop',
  report.after.scenario.id === report.id,
  report.after.progress > 0,
  ['RUNNING', 'COMPLETE', 'FAILED'].includes(report.after.scenario.status),
  Number.isFinite(report.after.scenario.score),
  report.after.safety.collisions >= 0,
  report.after.evaluation.comfortScore >= 0,
  Number.isFinite(report.after.scenario.scoreBreakdown?.safety),
  Number.isFinite(report.after.scenario.scoreBreakdown?.comfort),
  report.after.scenario.requiredEvent === (report.id === 'safe-merge' ? 'laneChanges' : report.id === 'pass-return' ? 'passReturns' : report.id === 'crosswalk' ? 'pedestrianYields' : report.id === 'cyclist-pass' ? 'cyclistPasses' : report.id === 'emergency-yield' ? 'emergencyYields' : report.id === 'signalized-approach' ? 'signalStops' : report.id === 'rail-crossing-stop' ? 'railCrossingStops' : null)
]);
checks.push(errors.length === 0);
checks.push(scenarioReports.find(report => report.id === 'safe-merge')?.after.evaluation.laneChanges > 0);
checks.push(scenarioReports.find(report => report.id === 'pass-return')?.after.scenario.metrics.passReturns > 0);
checks.push(scenarioReports.find(report => report.id === 'crosswalk')?.after.evaluation.pedestrianYields > 0);
checks.push(scenarioReports.find(report => report.id === 'cyclist-pass')?.after.evaluation.cyclistPasses > 0);
checks.push(scenarioReports.find(report => report.id === 'emergency-yield')?.after.evaluation.emergencyYields > 0);
checks.push(scenarioReports.find(report => report.id === 'signalized-approach')?.after.evaluation.signalStops > 0);
checks.push(scenarioReports.find(report => report.id === 'signalized-approach')?.after.scenario.status === 'COMPLETE');
checks.push(scenarioReports.find(report => report.id === 'rail-crossing-stop')?.after.evaluation.railCrossingStops > 0);
checks.push(scenarioReports.find(report => report.id === 'rail-crossing-stop')?.after.scenario.status === 'COMPLETE');
checks.push(reports.invalidScenario?.status === 'FAILED' && reports.invalidScenario?.reason === 'Traffic rule violation');
if (checks.some(value => !value)) process.exitCode = 1;
