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
- Select **回到起点** to return to the beginning with the same seed.
- Choose **宋画水墨 / 宣纸写意 / 青绿山水 / 雨雾实景** in the left-side drawer. Switching style keeps the current seed, position, speed, and cruise state.
- Close the drawer with its **×** button or Escape. Use the left-edge **操控台** handle to reopen it. On smaller screens, the drawer scrolls independently.

Moving manually cancels cruise. Leaving the page pauses movement. Backtracking preserves the same landscape; generation depends on the seed and world coordinates, not elapsed time. Distance is a virtual scene measure. Very long journeys may eventually encounter GPU floating-point precision limits.

## Painting styles

The four modes share terrain geometry, enabling direct comparisons of the same viewpoint. Song-inspired ink uses rock fibres and layered ink values; expressive ink uses broken strokes and stepped washes; blue-green landscape uses azurite, malachite, and ochre-inspired colors; mist mode uses softer light and reflected water. Ink modes use sparse water marks and paper-colored negative space. Rock marks are tied to world coordinates, while subtle paper grain stays fixed on the viewing surface. These are procedural interpretations, not reproductions of historical paintings.

## Files

- `dist/index.html`: interface and metadata
- `dist/style.css`: responsive layout
- `dist/app.js`: renderer, deterministic terrain, and input handling
- `server.mjs`: local development server

The site can be served by any static web host. Sites deployment configuration lives in `.openai/hosting.json`.
