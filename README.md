# Solar Roof POC

An interactive web app for designing rooftop solar installations. Pick a location on a map, trace the roof outline, and get a real-time 3D visualization of panel placement — complete with sun-path simulation, shading analysis, and an auto-generated system report.

## Features

- 📍 **Location search & satellite view** — powered by Google Maps, pick any address and pull up its satellite imagery
- ✏️ **Roof outline editor** — trace roof sections, mark elevation changes, and place obstacles (AC units, water tanks, trees)
- 🏗️ **3D building & panel viewer** — built with `react-three-fiber` / Three.js, renders the building geometry, roof, and solar array in 3D
- ☀️ **Sun path & shading simulation** — accurate sun position calculated per month/hour, used to drive lighting and shadow casting
- 🔋 **System sizing & financials** — panel count, capacity, estimated production, cost, incentives, and payback period
- ⚡ **Electrical design** — stringing plan and single-line diagram generation
- 📄 **Report generation** — exportable summary of the proposed system

## Tech Stack

- **React** (Vite)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — 3D rendering
- **Google Maps JavaScript API** & **Google Solar API** — location, imagery, and solar data

## Prerequisites

- Node.js 18+
- A [Google Cloud API key](https://console.cloud.google.com/google/maps-apis) with the following enabled:
  - Maps JavaScript API
  - Places API
  - Solar API

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/solar-roof-poc.git
   cd solar-roof-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example env file and add your API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or whatever port Vite assigns).

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # UI components (MapView, RoofEditor, 3D viewer, report modal, etc.)
├── hooks/                # Custom React hooks (Google Maps loader)
├── services/             # External API calls (Maps, Solar API)
├── styles/               # Global CSS
└── utils/                # Geometry, physics, and calculation helpers
    ├── buildingUtils.js  # 3D mesh generation for roofs/walls
    ├── collisionUtils.js # Obstacle/panel collision detection
    ├── heatmapUtils.js   # Solar flux heatmap rendering
    ├── heightUtils.js    # LiDAR-based building height extraction
    ├── polygonUtils.js   # 2D/3D polygon math
    ├── reportUtils.js    # System sizing & financial calculations
    ├── scaleUtils.js     # Real-world ↔ 3D-scene unit conversion
    └── sunUtils.js        # Sun position & path calculations
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud API key with Maps, Places, and Solar APIs enabled |
