# RepLog — lift. log. repeat.

A fast, mobile-first **workout tracker** for one person, running **entirely in your browser**. No accounts, no server, no cloud. Open it at the gym, log sets in a tap or two, rest with a built-in timer, and watch your lifts trend over time.

> **Privacy by design:** every workout lives in your device's IndexedDB. Nothing is sent anywhere — no analytics, no telemetry, no third-party calls. The only way data leaves is if *you* export it.

## Features

- **Active logging** — start a session, add exercises, log weight × reps. Writes persist instantly.
- **Rest timer** — auto-starts after a set, plus a dedicated minute-based **Timer** tab. One shared, timestamp-based timer that survives navigation and refresh, with sound + haptics and an optional screen wake lock.
- **PR detection** — automatic personal-record celebration (confetti + haptic) based on estimated 1RM.
- **Stats** — per-exercise history, est-1RM / top-weight / volume charts, and a **double-progression** next-session recommendation you can apply in one tap.
- **History** — browse past sessions, open any session, edit or delete sets/exercises, and delete whole sessions (with a 5-second undo). Deleting recomputes PRs and stats automatically.
- **Backup & restore** — one-tap JSON export/import (Zod-validated). Your only safety net, so export regularly.
- **Plate math & 1RM** — pure, unit-tested helpers (kg/lb).
- Installable, dark, OLED-friendly, one-handed, and built to respect `prefers-reduced-motion`.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · **Dexie (IndexedDB)** · Zustand · Zod · Recharts · Motion · Vitest. No database server, no ORM, no auth, no API keys.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

That's it — there's no environment to configure.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit tests (calc/progression logic) |

## Your data

All data is stored locally in IndexedDB on the device you use. Clearing site data, switching phones, or browser eviction will erase it — so **use Settings → Export** to download a backup, and Import to restore it on a new device.

## Deploying

This is a standard Next.js app and deploys to any Node host (e.g. **Vercel** — import the repo, no configuration needed). Because all data is client-side, the server only ever serves the app shell.

---

Built with [Claude Code](https://claude.com/claude-code).
