# PT_Visualizer — Mockup UI for Boston Public Transportation

This is a small Vite + React boilerplate intended as a modular mock-up for visualizing public transportation data in Boston.

Getting started (PowerShell):

```powershell
cd C:\Users\veres\Documents\BostonHackathon\PT_Visualizer
npm install
npm run dev
```

This project uses TypeScript. If you already ran `npm install` before the TypeScript conversion, run `npm install` again to fetch the new dev-dependencies.

If you prefer to use the original JS files while iterating, they are left as small re-export stubs pointing to the TypeScript source.

To run a TypeScript type-check only (optional):

```powershell
npx tsc --noEmit
```

What is included:
- React + Vite project scaffold
- Bootstrap 5 for quick, modern UI
- `src/components` with `Navbar`, `ControlPanel`, and `MapArea` components
- `src/services/dataAdapters.js` showing a `mockFetchData` and adapter stubs for OSM/Unreal

Next steps / integrations:
- Replace `MapArea` placeholder with a mapping library (Leaflet, Mapbox GL, or a custom WebGL canvas)
 - Replace `MapArea` placeholder with a mapping library (Leaflet, Mapbox GL, or a custom WebGL canvas). The map is now styled as a full-screen background and UI panels float above it.
- Implement an adapter in `src/services/dataAdapters.js` for your chosen data source (Unreal VM, OSM Overpass, GTFS realtime)
- Add authentication, telemetry, and styling tokens as needed
