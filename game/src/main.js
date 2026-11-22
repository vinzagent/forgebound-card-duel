// FORGEBOUND — bootstrap and turn orchestration. The state machine
// (state.js) decides the rules; the renderer (render.js) draws; this file
// wires them together, runs the rival's turn card by card with a beat
// between plays, and handles the ?shot= staging used for screenshots.
import { newGame, startGame, startPlayerTurn, playCard, rivalTurn, addLog } from './state.js';
import { render, floatText, shakeApp } from './render.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import { sfx, unlockAudio } from './audio.js';
import { CARD_BY_ID } from './cards.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let state;
if (shotName) {
  state = stageShot(shotName, seed);
  document.body.classList.add('shot');
} else {
  state = newGame((Math.random() * 0xffffffff) >>> 0);
}

let rivalBusy = false;

function refresh() {
  render(state);
}

function afterPlay(inst, node) {
  const card = CARD_BY_ID[inst.id];
  if (card.dmg) {
    sfx.damage();
    shakeApp();
    const rivalHp = document.querySelector('#rival-zone .hpbar');
    floatText(rivalHp, `-${card.dmg}`, 'damage');
  } else if (card.heal) {
    sfx.heal();
    const playerHp = document.querySelector('#player-zone .hpbar');
    floatText(playerHp, `+${card.heal}`, 'heal');
  } else if (card.shield) {
    sfx.shield();
  } else {
    sfx.play();
  }
  if (state.surgeFlash) {
    sfx.surge();
    state.surgeFlash = null;
  }
  refresh();
  if (state.over) endGame();
}

function onCardClick(uid, node) {
  if (state.screen !== 'play' || state.phase !== 'player' || rivalBusy) return;
  const inst = state.player.hand.find((c) => c.uid === uid);
  if (!inst) return;
  const card = CARD_BY_ID[inst.id];
  if (state.player.mana < card.cost) {
    sfx.click();
    if (node) {
      node.classList.remove('denied');
      void node.offsetWidth;
      node.classList.add('denied');
    }
    return;
  }
  if (playCard(state, state.player, uid)) afterPlay(inst, node);
}

function onEndTurn() {
  if (state.screen !== 'play' || state.phase !== 'player' || rivalBusy) return;
  rivalBusy = true;
  sfx.turn();
  const plays = rivalTurn(state);
  refresh();
  if (state.over) {
    rivalBusy = false;
    endGame();
    return;
  }
  // Play the rival's cards one at a time, a beat apart, so the table
  // reads like a duel instead of a ledger.
  let i = 0;
  const step = () => {
    if (i >= plays.length) {
      rivalBusy = false;
      if (state.over) {
        endGame();
        return;
      }
      startPlayerTurn(state);
      sfx.turn();
      refresh();
      return;
    }
    const uid = plays[i++];
    const inst = state.rival.hand.find((c) => c.uid === uid);
    if (inst && playCard(state, state.rival, uid)) {
      const card = CARD_BY_ID[inst.id];
      if (card.dmg) {
        sfx.damage();
        shakeApp();
        const playerHp = document.querySelector('#player-zone .hpbar');
        floatText(playerHp, `-${card.dmg}`, 'damage');
      } else if (card.heal) {
        sfx.heal();
      } else if (card.shield) {
        sfx.shield();
      }
      refresh();
    }
    if (state.over) {
      rivalBusy = false;
      endGame();
      return;
    }
    setTimeout(step, 650);
  };
  setTimeout(step, 500);
}

function endGame() {
  refresh();
  if (state.winner === 'player') {
    sfx.win();
    addLog(state, 'Vex falls. The forge is yours.');
  } else if (state.winner === 'rival') {
    sfx.loss();
    addLog(state, 'Your light gutters out.');
  }
  refresh();
}

function startFresh() {
  const fresh = newGame((Math.random() * 0xffffffff) >>> 0);
  state = fresh;
  rivalBusy = false;
  startGame(state);
  sfx.deal();
  refresh();
}

bindInput(state, {
  onCardClick,
  onEndTurn,
  onPlay: () => {
    if (state.screen !== 'title') return;
    if (state.started) {
      // Returning from Help mid-duel: resume, never re-deal.
      state.screen = 'play';
      refresh();
      return;
    }
    startGame(state);
    sfx.deal();
    refresh();
  },
  onPlayAgain: startFresh,
  onHelp: () => {
    state.screen = 'title';
    refresh();
  },
});

document.querySelector('#restart-btn').addEventListener('click', () => {
  unlockAudio();
  startFresh();
});

refresh();
export { state };
