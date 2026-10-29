import { chromium } from 'playwright';

const url = process.env.SIM_URL || 'http://127.0.0.1:4174/merged.html';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);

const maps = ['downtown', 'suburb', 'rural', 'highway', 'nightcity'];
const reports = [];
for (const map of maps) {
  const report = await page.evaluate(({ mapName, screenshot }) => {
    const sim = window.__sim;
    sim.mapType = mapName;
    sim.reset();
    sim.mode = 'chase';
    sim.stepSimulation(0);
    if (screenshot) sim.renderer.render(sim.scene, sim.camera);
    const firstMesh = root => {
      let found = null;
      root?.traverse?.(node => {
        if (!found && node.isMesh && node.material) found = node;
      });
      return found;
    };
    const firstMaterialWith = (root, key) => {
      let found = null;
      root?.traverse?.(node => {
        if (found || !node.isMesh || !node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        found = materials.find(material => Number.isFinite(material?.[key])) || null;
      });
      return found;
    };
    const tree = sim.cityGroup?.children?.find(node => String(node.userData?.worldModel || '').startsWith('tree-'));
    const storefront = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'storefront');
    const barricade = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'construction-barricade');
    const tunnelPortal = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'tunnel-portal');
    const windTurbine = sim.cityGroup?.children?.find(node => node.userData?.worldModel === 'wind-turbine');
    const pedestrianSignal = sim.intersectionGroup?.children?.find(node => node.userData?.worldModel === 'pedestrian-signal');
    const trafficSignal = sim.controls?.find(control => control.type === 'stoplight')?.mesh || null;
    const roughnessMaterial = firstMaterialWith(sim.cityGroup, 'roughness');
    const roadRoughnessMaterial = firstMaterialWith(sim.roadGroup, 'roughness');
    const dryWeather = sim.env.weather;
    const drySurface = sim.env.surface;
    sim.env.weather = 'clear';
    sim.env.surface = 'dry';
    sim.applyEnvironment();
    const dryRoughness = roughnessMaterial?.roughness ?? null;
    const dryRoadRoughness = roadRoughnessMaterial?.roughness ?? null;
    sim.env.weather = dryWeather;
    sim.env.surface = drySurface;
    sim.applyEnvironment();
    const wetRoughness = roughnessMaterial?.roughness ?? null;
    const wetRoadRoughness = roadRoughnessMaterial?.roughness ?? null;
    let treeAnimated = false;
    if (tree && window.SimWorldVisuals) {
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 0, .1, mapName);
      const firstRotation = tree.rotation.z;
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 1.1, .1, mapName);
      treeAnimated = Math.abs(tree.rotation.z - firstRotation) > 1e-6;
    }
    const emissiveMaterial = firstMaterialWith(storefront, 'emissiveIntensity');
    let storefrontEmissionPulse = false;
    if (storefront && emissiveMaterial && window.SimWorldVisuals) {
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 0, .1, mapName);
      const firstIntensity = emissiveMaterial.emissiveIntensity;
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, Math.PI / 1.6, .1, mapName);
      storefrontEmissionPulse = Math.abs(emissiveMaterial.emissiveIntensity - firstIntensity) > 1e-6;
    }
    let constructionWarningPulse = false;
    if (barricade && window.SimWorldVisuals) {
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 0, .1, mapName);
      const firstOpacity = barricade.userData.warningLights?.[0]?.material?.opacity ?? null;
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, .8, .1, mapName);
      const secondOpacity = barricade.userData.warningLights?.[0]?.material?.opacity ?? null;
      constructionWarningPulse = Number.isFinite(firstOpacity) && Number.isFinite(secondOpacity) && Math.abs(secondOpacity - firstOpacity) > 1e-6;
    }
    let pedestrianSignalPulse = false;
    if (pedestrianSignal && window.SimWorldVisuals) {
      window.SimWorldVisuals.animateWorldModels(sim.intersectionGroup, 0, .1, mapName);
      const firstWalkOpacity = pedestrianSignal.userData.walkLamp?.material?.opacity ?? null;
      window.SimWorldVisuals.animateWorldModels(sim.intersectionGroup, 4.36, .1, mapName);
      const secondWalkOpacity = pedestrianSignal.userData.walkLamp?.material?.opacity ?? null;
      pedestrianSignalPulse = Number.isFinite(firstWalkOpacity) && Number.isFinite(secondWalkOpacity) && Math.abs(secondWalkOpacity - firstWalkOpacity) > 1e-6;
    }
    let tunnelLightPulse = false;
    if (tunnelPortal && window.SimWorldVisuals) {
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 0, .1, mapName);
      const firstOpacity = tunnelPortal.userData.tunnelLights?.[0]?.material?.opacity ?? null;
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, .8, .1, mapName);
      const secondOpacity = tunnelPortal.userData.tunnelLights?.[0]?.material?.opacity ?? null;
      tunnelLightPulse = Number.isFinite(firstOpacity) && Number.isFinite(secondOpacity) && Math.abs(secondOpacity - firstOpacity) > 1e-6;
    }
    let windTurbineRotorPulse = false;
    let windTurbineBeaconPulse = false;
    if (windTurbine && window.SimWorldVisuals) {
      const rotor = windTurbine.userData?.windTurbineRotor;
      const beacon = windTurbine.userData?.windTurbineBeacon;
      window.SimWorldVisuals.animateWorldModels(sim.cityGroup, 0, .1, mapName);
      const firstRotation = rotor?.rotation?.z ?? null;
      const firstOpacity = beacon?.material?.opacity ?? null;
      const beaconSamples = [firstOpacity];
      for (const sampleTime of [.8, 1.6, 2.4, 3.2, 4.0]) {
        window.SimWorldVisuals.animateWorldModels(sim.cityGroup, sampleTime, .1, mapName);
        beaconSamples.push(beacon?.material?.opacity ?? null);
      }
      const secondRotation = rotor?.rotation?.z ?? null;
      const secondOpacity = beaconSamples.at(-1);
      windTurbineRotorPulse = Number.isFinite(firstRotation) && Number.isFinite(secondRotation) && Math.abs(secondRotation - firstRotation) > 1e-6;
      windTurbineBeaconPulse = beaconSamples.every(Number.isFinite) && Math.max(...beaconSamples) - Math.min(...beaconSamples) > 1e-6;
    }
    const trafficSignalHeads = trafficSignal?.userData?.signalHeads || 0;
    const signalClock = sim.simTime;
    const trafficSignalStates = [...new Set([0, 2.5, 5.2, 8.1].map(time => {
      sim.simTime = time;
      const control = sim.controls?.find(value => value.type === 'stoplight');
      return control ? sim.lightState({ ...control, offset: 0, scenarioRedUntil: 0 }) : null;
    }))].filter(Boolean).length;
    sim.simTime = signalClock;
    const state = JSON.parse(sim.renderGameToText());
    const streamWindows = sim.worldStream?.windows?.(sim.progress) || null;
    return {
      map: mapName,
      worldModels: state.models.worldCounts,
      environment: state.environment,
      state: state.state,
      environmentBuilderSource: state.environment.environmentBuilderSource,
      worldBuilderSource: state.environment.worldBuilderSource,
      worldStreamSource: sim.worldStreamSource || 'inline',
      streamWindows: streamWindows ? { roadSpan: streamWindows.road.max - streamWindows.road.min, citySpan: streamWindows.city.max - streamWindows.city.min, roadTrigger: streamWindows.road.trigger, cityTrigger: streamWindows.city.trigger } : null,
      visuals: { treeAnimated, storefrontEmissionPulse, constructionWarningPulse, pedestrianSignalPulse, tunnelLightPulse, windTurbineRotorPulse, windTurbineBeaconPulse, trafficSignalHeads, trafficSignalStates, dryRoughness, wetRoughness, dryRoadRoughness, wetRoadRoughness }
    };
  }, { mapName: map, screenshot: map === 'nightcity' });
  reports.push(report);
  if (map === 'downtown' || map === 'suburb' || map === 'rural' || map === 'highway' || map === 'nightcity') {
    await page.screenshot({ path: `output/world-models-${map}.png`, timeout: 120000, animations: 'disabled' });
  }
}
await page.screenshot({ path: 'output/world-models-final.png', timeout: 120000, animations: 'disabled' });
await page.close();
await browser.close();

console.log(JSON.stringify({ reports, errors }, null, 2));
const downtown = reports.find(report => report.map === 'downtown');
const suburb = reports.find(report => report.map === 'suburb');
const rural = reports.find(report => report.map === 'rural');
const highway = reports.find(report => report.map === 'highway');
const nightcity = reports.find(report => report.map === 'nightcity');
const has = (report, key) => !!report?.worldModels?.[key];
const checks = [
  errors.length === 0,
  reports.every(report => report.environmentBuilderSource === 'module'),
  reports.every(report => report.worldBuilderSource === 'module'),
  reports.every(report => report.worldStreamSource === 'module' && report.streamWindows?.roadSpan === 4500 && report.streamWindows?.citySpan === 2500),
  has(downtown, 'building-modern') && has(downtown, 'building-brick') && has(downtown, 'building-podium'),
  has(downtown, 'mobility-hub'),
  has(downtown, 'storefront') && has(downtown, 'streetlight-urban') && has(downtown, 'bench'),
  has(downtown, 'crosswalk-sign'),
  has(downtown, 'pedestrian-signal'),
  has(downtown, 'parking-meter') && has(downtown, 'bike-rack') && has(downtown, 'traffic-camera'),
  has(downtown, 'ev-charger') && has(downtown, 'street-sign'),
  has(downtown, 'construction-barricade'),
  has(suburb, 'building-suburban') && (has(suburb, 'tree-deciduous') || has(suburb, 'tree-autumn')),
  has(suburb, 'mailbox') && has(suburb, 'utility-box'),
  has(suburb, 'ev-charger'),
  has(suburb, 'service-station'),
  has(suburb, 'construction-barricade'),
  has(rural, 'roadside-post') && (has(rural, 'tree-pine') || has(rural, 'tree-deciduous')),
  has(rural, 'guardrail-segment'),
  has(rural, 'tunnel-portal'),
  has(rural, 'wind-turbine'),
  has(rural, 'utility-box'),
  has(highway, 'roadside-post'),
  has(highway, 'guardrail-segment'),
  has(highway, 'traffic-camera'),
  has(highway, 'billboard'),
  has(highway, 'service-station'),
  has(highway, 'bridge-overpass'),
  has(highway, 'highway-gantry'),
  has(highway, 'tunnel-portal'),
  has(highway, 'wind-turbine'),
  has(nightcity, 'building-modern') && has(nightcity, 'mobility-hub') && has(nightcity, 'streetlight-urban'),
  (suburb?.visuals?.treeAnimated && rural?.visuals?.treeAnimated),
  downtown?.visuals?.constructionWarningPulse === true,
  downtown?.visuals?.pedestrianSignalPulse === true,
  rural?.visuals?.tunnelLightPulse === true && highway?.visuals?.tunnelLightPulse === true,
  rural?.visuals?.windTurbineRotorPulse === true && rural?.visuals?.windTurbineBeaconPulse === true,
  downtown?.visuals?.trafficSignalHeads >= 2 && downtown?.visuals?.trafficSignalStates >= 3,
  Number.isFinite(nightcity?.visuals?.dryRoughness) && Number.isFinite(nightcity?.visuals?.wetRoughness) && nightcity.visuals.wetRoughness < nightcity.visuals.dryRoughness,
  Number.isFinite(nightcity?.visuals?.dryRoadRoughness) && Number.isFinite(nightcity?.visuals?.wetRoadRoughness) && nightcity.visuals.wetRoadRoughness < nightcity.visuals.dryRoadRoughness,
  nightcity?.visuals?.storefrontEmissionPulse === true,
  reports.every(report => Object.values(report.worldModels || {}).every(value => Number.isFinite(value) && value > 0))
];
if (checks.some(value => !value)) process.exitCode = 1;
