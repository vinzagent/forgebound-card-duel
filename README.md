# Forgebound

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/vinzagent/forgebound-card-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/vinzagent/forgebound-card-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Forgebound is a 1-v-1 duel card game: you against Vex, the Cinder Warden. Thirty life each, mana that grows every turn, and a deck of thirty cards across four original suits — Ember (burn), Tide (heal and draw), Thorn (shield and bite), Stone (heavy and piercing). Play two cards of one suit in a turn for Surge +3. Vex telegraphs the next turn's intent before you end yours, so every hand is a decision: shield up, race the kill, or heal and draw.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Click a card to play it (or press 1-7), Space to end the turn, M to mute, H for the rules. No network, no build step, no account.

## How it is built

- `game/index.html` + `game/styles.css` — the table, pure DOM so cards stay legible at any size.
- `game/src/cards.js` — the catalog: 15 original cards, 30-card deck.
- `game/src/state.js` — the rules: turns, mana, surge, shield, fatigue, win and loss.
- `game/src/ai.js` — Vex's intent and voice; the brain is a greedy chooser in `state.js`.
- `game/src/render.js` — everything on screen, from the dealt hand to the win screen.
- `game/src/audio.js` — synthesized sound effects, no audio files.
- `game/src/shots.js` — the four staged screenshot states, all real states of the real game.
- `game/src/input.js`, `game/src/main.js` — mouse/keyboard input and the turn loop.
- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vinzweb3&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
