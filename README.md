# Self-Driving Car Simulation

An interactive browser-based 3D autonomous-perception simulator that explores how a self-driving vehicle interprets a changing road environment. Built with Three.js, the project combines a real-time 3D road scene with simulated perception systems, sensor overlays, telemetry, and live event logging in a compact browser experience.

## Overview

The simulator is designed to make autonomous-vehicle perception easier to visualize. Instead of only showing a car moving through a scene, it exposes the information an autonomous system might use to understand the world around it, including camera detections, LiDAR and radar data, lane awareness, tracked objects, and fused sensor information.

The main experience runs directly in the browser with no backend or build system required.

## Features

- Real-time 3D road environment rendered with **Three.js**
- Camera-style object detection boxes and perception overlays
- Simulated **LiDAR** and **radar** sensor visualization
- Sensor-fusion view combining multiple perception sources
- Lane and road-awareness visualization
- Adjustable target speed
- Multiple traffic / scenario difficulty settings
- Configurable time-of-day and weather conditions
- Live telemetry and autonomous-system status
- Minimap and driving HUD
- Real-time event / diagnostics log
- Multiple camera and visualization controls
- Responsive interface for different screen sizes

## Controls

The left control panel lets you change the driving environment and perception display while the simulation is running. You can adjust speed, traffic conditions, time of day, weather, and sensor-related visualization options to see how the scene and autonomous-perception output respond.

## Project Structure

```text
self-driving-car-simulation/
├── Self driving simulation.html   # Main simulator and deployed entry point
├── different-version.html         # Alternate grid-city simulation experiment
├── merged.html                    # Alternate / merged simulation iteration
├── vercel.json                    # Routes the deployment root to the main simulator
└── README.md
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/tanujranjith/self-driving-car-simulation.git
cd self-driving-car-simulation
```

Then open `Self driving simulation.html` in a modern desktop browser.

The simulator loads Three.js from a CDN, so an internet connection is required for the library to load unless you replace it with a local copy.

## Deployment

The included `vercel.json` rewrites the site root to `Self driving simulation.html`, allowing the project to be deployed as a static Vercel site without an additional application framework.

## Tech

- HTML
- CSS
- JavaScript
- Three.js
- Canvas-based overlays and HUD rendering

## Purpose

This project is an interactive visualization of autonomous-driving concepts and perception systems. It is intended for experimentation, learning, and demonstration rather than as a production autonomous-driving stack or physically accurate vehicle-control system.
