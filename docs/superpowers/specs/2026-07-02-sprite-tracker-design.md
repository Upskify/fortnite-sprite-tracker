# Sprite Tracker — design

## Purpose
A personal iPhone PWA to track which Fortnite "Creature Sprites" (collectible creature decals: Water, Earth, Ghost, etc., each with variants Base/Gold/Candy/Galaxy/Gem/Holofoil) the user has already found in-game. Tap to mark as owned, filter/search, back up progress.

## Platform
Progressive Web App (HTML/CSS/vanilla JS, no build tooling, no backend). Installed on iPhone via Safari "Add to Home Screen." Works fully offline after first load via a service worker that caches the app shell and all sprite images.

Rejected: native Swift/Xcode app — requires a Mac, Apple Developer account, and re-signing every 7 days without a paid account. Not worth it for a single-user collection tracker.

## Hosting
GitHub Pages. The project is pushed to a GitHub repo (account `Upskify`, already authenticated locally via `gh`) with Pages enabled on the `main` branch (or a `docs/` folder / `gh-pages` branch, TBD in plan). This gives a permanent HTTPS URL, required for the service worker and "Add to Home Screen" to work with full offline support — a `file://` path or ad-hoc local server would not support this reliably.

## Data source
Extracted from a locally saved snapshot of `https://fortnite.gg/sprites` (the live page blocks scripted fetches with a 403/Cloudflare challenge, so it cannot be fetched at runtime — a static, one-time export is required).

The saved HTML embeds full server-rendered data per sprite card (`data-sprite`, `data-parent`, `data-rarity`, `data-variant`, image `src`, display name, and pill text containing drop-chance % and an optional "Starter" tag).

Parsed result: **82 items**, grouped under **18 creature families** (Water, Earth, Air, Boss, BurntPeanut, Demon, Drifter, Duck, Fishy, Ghost, Grim, King, Punk, Seven, Sleepy, Soccer, Spitfire, ZeroPoint), each with 1–6 variants (Base/Gold/Candy/Galaxy/Gem/Holofoil — not every family has all variants). Rarities observed: rare, epic, legendary, mythic, special.

Build step (one-time, not run by the app): parse the saved HTML into `data/sprites.json`:
```
{ id, name, family, variant, rarity, chancePercent, isStarter, image }
```
Sprite images (82 `.webp` files) are downloaded once from `https://fortnite.gg/img/x/sprites/icons/...` and bundled locally under `assets/sprites/`. The app never calls fortnite.gg at runtime.

## UI
Single screen, dark Fortnite-styled theme (rarity color-coded: blue=rare, purple=epic, gold=legendary, orange=mythic, varied=special).

- Header: search input (by name), rarity filter dropdown, "show missing only" toggle, progress bar + counter ("23 / 82 collected")
- Body: sprites grouped by family (18 section headers), each showing its variants in a small grid. Owned sprites show a green checkmark badge and full opacity; unowned are dimmed. Tapping a card toggles owned/unowned.
- Footer: "Export backup" / "Import backup" buttons (Web Share API / file input) for JSON backup of owned-state, independent of the device.

## State & persistence
- Owned/unowned state stored in `localStorage`, keyed by sprite id. Survives app restarts.
- Export produces a small JSON file (`{ownedIds: [...]}`) sharable via iOS share sheet or downloadable.
- Import reads a JSON file and merges/replaces the local owned-state.

## Out of scope
- No other cosmetic categories (outfits, sprays, emotes, etc.) — sprites only.
- No live sync between devices — backup file is the only cross-device mechanism.
- No runtime fetching from fortnite.gg or any API (blocked/unreliable) — dataset is static and only refreshed if the user redoes the export process later.
