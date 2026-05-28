# Volleyball Rotations

A browser-based tool for visualizing volleyball formations and rotations. Drag players on a regulation court diagram, step through serve/receive and defensive setups, and switch between a flat 2D map and a 3D court view.

Built with Vue 3, Vuetify, and a Canvas 2D renderer (no WebGL).

## What it does

- Shows a full court with attack lines, three-meter lines, and net (in 3D).
- Places six roster roles on court: setter, opposite, two middles, two left sides, and libero. Who is on court for a given rotation follows predefined lineups (e.g. which middle is front, libero in/out, double-middle when a middle serves).
- Stores many **formation groups**, each with one or more **variants** (e.g. P1 serve, P1 receive, or attack-from-left defense).
- Lets you adjust each player’s position per variant and persist layouts in the browser or via JSON export/import.

## Using the app

### Layout

- **Desktop:** Controls are in a panel on the left; the court fills the rest of the screen.
- **Phone:** The court is on top; controls sit in a panel below.

### Formations panel

1. **Formation group** — Choose a category (e.g. *Start position*, *Defense (A-defense)*, *Free ball*).
2. **Variant** — For groups with multiple rotations, pick a specific situation (e.g. *P4 receive*) or use the **previous / next** buttons to step through variants.
3. **Save** — Writes the current player positions for this variant to browser storage (`localStorage`).
4. **Export** — Downloads all saved positions as `volleyball-formations.json`.
5. **Import** — Loads positions from a previously exported JSON file (invalid files are rejected).

Groups without variants (e.g. some free-ball setups) use a single layout for the whole group.

The URL includes a `rotation` query parameter (e.g. `?rotation=p4-receive`) so you can link directly to a specific variant. Free-ball groups use the group id (e.g. `?rotation=free-ball-setter-back`).

### Court

**2D view (default)**

- Top-down diagram; best for precise positioning.
- **Drag** a player marker to move them. Positions are saved per variant when you press **Save**.
- Tap **3D** (bottom-right) to switch views.

**3D view**

- Perspective court; drag empty space to **orbit** (rotate the camera).
- **Scroll** (or **pinch** on touch) to zoom in/out.
- Player markers show as pins from the side, or as flat discs when looking from above.
- Tap **2D** to return to the diagram.

Markers use role abbreviations (S, O, MB, LE, L). The active variant decides which players appear on court for that rotation.

A **volleyball** (red outline) shows where the ball is for the current situation: opponent serve on receive, our serve on serve variants, left/middle/right at the net on attack defense. Free-ball formations hide the ball. Ball position follows the rotation id only and is not saved with layouts.

## Development

### Requirements

- Node.js `^20.19` or `>=22.12`

### Setup

```sh
npm install
npm run dev
```

### Other scripts

```sh
npm run build    # type-check and production build
npm run preview  # preview production build
npm run lint     # ESLint + oxlint
```

### Court rendering

See [docs/COURT_AND_CAMERA.md](docs/COURT_AND_CAMERA.md) for how the canvas projection, 3D camera, and player markers work.

### Feature flags

Edit `src/config/featureFlags.ts` to toggle features:

- `layoutPersistence` — Save / Export / Import. When false, layouts load from `public/volleyball-formations.json` instead of browser storage.
- `advancedDefense` — When false, hides Defense (A-defense) and the free-ball groups from the formation dropdown (Start position and B-defense remain).

## Recommended IDE

[VS Code](https://code.visualstudio.com/) with the [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension.
