# Ink Wash World · 山水无限

An interactive, seed-based landscape journey through misty mountains and water. Built with vanilla JavaScript, CSS, and a procedural WebGL landscape. No external runtime dependencies.

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
- Collapse the console for an unobstructed view.

Moving manually cancels cruise. Leaving the page pauses movement. Backtracking preserves the same landscape; generation depends on the seed and world coordinates, not elapsed time. Distance is a virtual scene measure. Very long journeys may eventually encounter GPU floating-point precision limits.

## Files

- `dist/index.html`: interface and metadata
- `dist/style.css`: responsive layout
- `dist/app.js`: renderer, deterministic terrain, and input handling
- `server.mjs`: local development server

The site can be served by any static web host. Sites deployment configuration lives in `.openai/hosting.json`.
