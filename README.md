# Ultimate Randomizer

Super Smash Bros. Ultimate character randomizer with per-fighter weights, multi-player profiles, and phone-to-phone QR transfer.

Fan utility — not affiliated with Nintendo.

## Features

- Weighted random picks for 1–8 players
- Profiles with Rare / Normal / Often / Favorite / custom multipliers
- Built-in **Default** (equal odds) and **Smash 64** (original 12 fighters) — locked
- Per-player profile assignment
- JSON + QR export/import for custom profiles
- Live probability on each fighter card

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (Vite binds to port 8080).

```bash
npm run typecheck
npm run build
```

## Stack

React 19, TypeScript, Vite, TanStack Start, Tailwind v4, Zustand.
