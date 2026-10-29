# Self-Driving Car Simulation

An interactive browser-based 3D autonomous-driving and perception simulator built with Three.js and Vite. Explore traffic behavior, vehicle handling, road environments, and simulated sensors through live telemetry and multiple camera views.

## Overview

The current simulator is `merged.html`, backed by the modules in `src/` and local models in `public/`. Vite serves the project during development and bundles the modules and assets for deployment. No backend is required.

## Features

- Autonomous, assisted, and human control with vehicle-specific steering, acceleration, braking, grip, and body motion
- Traffic following, smooth lane changes, curvature anticipation, and vehicle-size-aware collision clearance
- A varied vehicle fleet with procedural models, animated wheels and lights, and attributed local GLB assets
- Streamed downtown, suburban, rural, highway, and night-city environments
- Weather, road-surface conditions, day-night cycles, animated landmarks, and rail crossings
- Camera detection boxes, simulated LiDAR and radar, sensor fusion, route overlays, and multiple camera views
- Authored scenario presets, a custom scenario editor, scoring, replay, and live safety/comfort telemetry
- Deterministic stepping and browser regression scripts

## Controls

Use **Start**, **Pause**, and **Reset** in the left panel. Select a map, vehicle, control source, scenario, and sensor overlays to explore their effects.

In assist or human mode, use **W / Up** for throttle, **S / Down** for braking, and **A / Left** or **D / Right** to steer.

## Project Structure

```text
self-driving-car-simulation/
├── index.html                    # Redirects to the current simulator
├── merged.html                   # Simulator interface and runtime integration
├── src/                          # Driving, traffic, world, rendering, and sensor modules
├── public/                       # Static assets, GLB models, and attribution
├── scripts/                      # Browser regressions and model capture scripts
├── package.json                  # Development, build, and verification commands
├── vite.config.js                # Production HTML entry points
├── vercel.json                   # Vite build and homepage routing
├── Self driving simulation.html  # Preserved earlier prototype
├── different-version.html        # Preserved alternate prototype
├── progress.md                   # Implementation notes and verification history
└── README.md
```

## Running Locally

Install Node.js and npm, then clone and start the project:

```bash
git clone https://github.com/tanujranjith/self-driving-car-simulation.git
cd self-driving-car-simulation
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`.

The main Three.js runtime currently loads from a CDN, so the simulation needs an internet connection. Local GLB assets are served by Vite.

## Production Build

```bash
npm run build
npm run preview -- --port 4174
```

The build is written to `dist/`. Preview the built simulator at `http://127.0.0.1:4174/`.

## Verification

Install the Chromium browser used by Playwright:

```bash
npx playwright install chromium
```

With the production preview running on port 4174, run the existing regressions in a second terminal:

```bash
npm run test:driving
npm run test:traffic-headway
npm run test:scenario
npm run test:world
```

The scripts default to `http://127.0.0.1:4174/merged.html`; set `SIM_URL` to use another server. Screenshots and verification artifacts are written to `output/`. Additional focused model and scenario checks are listed in `package.json`.

## Deployment

The included `vercel.json` selects Vite, installs dependencies with `npm ci`, runs `npm run build`, and serves `dist/`. The site root points to the current `merged.html` simulator. The preserved prototype HTML files remain in the repository.

## Tech

- HTML
- CSS
- JavaScript
- Three.js
- Vite
- Playwright browser regression scripts
- Canvas-based overlays and HUD rendering

See `public/assets/vehicles/ATTRIBUTION.md` and `public/assets/actors/ATTRIBUTION.md` for model sources and licenses.

## Purpose

This project is an interactive visualization of autonomous-driving concepts and perception systems. It is intended for experimentation, learning, and demonstration rather than as a production autonomous-driving stack or physically accurate vehicle-control system.
