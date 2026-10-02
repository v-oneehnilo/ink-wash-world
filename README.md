# Ink Wash World · 山水无限

An interactive, seed-based landscape journey through misty mountains and water, with four painting styles. Built with vanilla JavaScript, CSS, and a procedural WebGL landscape. No external runtime dependencies.

## Run locally

Requires Node.js 18 or later:

```sh
node server.mjs
```

Open http://127.0.0.1:4173. A browser with WebGL and hardware acceleration is required.

## Controls

- Enter a text or numeric seed and select **生成山水** to generate a world.
- Hold **前进 / 后退**, or the up/down arrow keys, to move.
- Toggle **自动前进**, or press Space outside a form control, to cruise.
- Adjust speed from 0.25× to 3×.
- Adjust **观察高度** from 3 to 80 scene meters and **上下视角** from 55° down to 30° up. **恢复默认视角** restores 16 meters / 8° down without changing the seed, journey, features, or cruise state.
- Select **回到起点** to return to the beginning with the same seed.
- Choose **宋画水墨 / 宣纸写意 / 青绿山水 / 雨雾实景** in the left-side drawer. Switching style keeps the current seed, position, speed, and cruise state.
- Expand **景致与生趣** to independently add or remove pines, boats, pavilions, birds, drifting mist, water ripples, and alternating narrow/wide river sections. **纯山水** disables all seven additions; **全部加入** enables them. These switches preserve the journey and painting style.
- Close the drawer with its **×** button or Escape. Use the left-edge **操控台** handle to reopen it. On smaller screens, the drawer scrolls independently.

Moving manually cancels cruise. Leaving the page pauses movement. Backtracking preserves the same landscape; generation depends on the seed and world coordinates, not elapsed time. Distance is a virtual scene measure. Very long journeys may eventually encounter GPU floating-point precision limits.

## Painting styles

The four modes share terrain geometry, enabling direct comparisons of the same viewpoint. Song-inspired ink uses rock fibres and layered ink values; expressive ink uses broken strokes and stepped washes; blue-green landscape uses azurite, malachite, and ochre-inspired colors; mist mode uses softer light and reflected water. Ink modes use sparse water marks and paper-colored negative space. Rock marks are tied to world coordinates, while subtle paper grain stays fixed on the viewing surface. These are procedural interpretations, not reproductions of historical paintings.

## Optional scenery

Landmarks are sparse and anchored to seed-defined world positions. Boats and pavilions use three-dimensional signed-distance geometry with per-surface normals and shared terrain/water depth. Boats vary between open skiffs, covered boats and sailboats, with seed-defined scale and yaw; their hulls are hollow, with gunwales, floor and seats. Pavilions have foundations, four columns, rails and a hipped roof. Their full rotated footprint sits on a level terrace smoothly joined to the natural slope, avoiding the previous single-point placement that buried parts of the building in terrain. Pine and bird silhouettes retain their ink-illustration treatment.

The river-opening option smoothly changes width along the route while keeping the camera in the channel. Turning that option off restores the original fixed-width river. Switching pavilions off also removes their terrain terraces. Observation height changes the camera position; pitch rotates its view while preserving the route.

Birds, mist, and ripples animate gently even while the viewer is stationary. Those three options start disabled when the browser requests reduced motion; they can be explicitly enabled. Ambient animation pauses in a hidden tab. Static landmarks and terrain are repeatable for the same seed, position, and feature settings; animation phase naturally changes over time. Disabling drifting mist retains the base distance haze needed for depth.

## Files

- `dist/index.html`: interface and metadata
- `dist/style.css`: responsive layout
- `dist/app.js`: renderer, deterministic terrain, and input handling
- `dist/solids.js`: volumetric boat and pavilion geometry, materials, and ray intersections
- `server.mjs`: local development server

The site can be served by any static web host. Sites deployment configuration lives in `.openai/hosting.json`.
