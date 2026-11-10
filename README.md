# Network Digital Twin & Netverse Ops Integration

Integrated cyber-physical datacenter & digital twin network monitoring platform.

## Architecture

- **Digital Twin Network (`/digital-twin-network`)**: 3D interactive Three.js network topology simulator with real-time packet animation, device metrics, status monitoring, and alert management.
- **Netverse Ops (`/netverse-ops`)**: 3D first-person React Three Fiber datacenter facility simulator featuring physical cable patching, server rack inspections, morning/night cycles, and live network incident response.
- **Unified Deployment (`/digital-twin-network/netverse`)**: Production-optimized standalone build of Netverse Ops embedded directly into the Digital Twin Network web app for zero-latency, cross-origin-free integration.

## Features

1. **Top Bar Quick Launch**: Prominent `⚡ Netverse Ops [3D]` button in the top navigation bar.
2. **Sidebar Quick Action**: `⚡ Launch Netverse Ops` button in the left control panel.
3. **Seamless Embedded Modal View**:
   - High-fidelity overlay window with loading state.
   - Pointer-lock & fullscreen support for interactive first-person control.
   - `↗ New Tab` button to open Netverse Ops in an independent browser tab.
   - `⛶ Fullscreen` toggle for maximum immersion.
   - `✕ Close` button & `Esc` key listener.
4. **Bidirectional Navigation**: Netverse Ops includes a dedicated `DIGITAL TWIN` switch button to return to the Digital Twin view.

## Quick Start

### Option 1: Run with any static server
```bash
npx serve "digital-twin-network"
# Or
python -m http.server 8000 --directory "digital-twin-network"
```
Open `http://localhost:3000` (or `http://localhost:8000`) in your browser. Click **⚡ Netverse Ops** to explore the datacenter!

### Option 2: Active Development on Netverse Ops
```bash
cd netverse-ops
npm run dev
```
To update the integrated production build:
```bash
npm run build:netverse
```
