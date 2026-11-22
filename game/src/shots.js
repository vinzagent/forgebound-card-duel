// FORGEBOUND — the four staged screenshots, all real states of the real
// game, seeded the same every time. The cover is the title screen; the
// table shot is the densest moment of a duel (both hands, both life
// totals, mana, a surge lit, Vex's intent telegraphed, two cards on the
// table); the win and loss shots are the two end screens over a finished
// table. Nothing here is drawn by hand: every pixel comes from the game's
// own renderer.
import { newGame, drawCards, playCard, startGame } from './state.js';
import { makeCardInstance, CARD_BY_ID } from './cards.js';
import { START_MANA } from './config.js';

function handOf(ids) {
  return ids.map((id) => makeCardInstance(id));
}

function stageTable(state) {
  startGame(state);
  // A mid-duel position, fixed by hand so the shot never drifts.
  state.turn = 5;
  state.player.hp = 24;
  state.player.shield = 6;
  state.player.maxMana = 6;
  state.player.mana = 6;
  state.player.hand = handOf(['flame-lash', 'immolate', 'deep-current', 'thornmail', 'stone-fist']);
  state.rival.hp = 18;
  state.rival.shield = 0;
  state.rival.hand = handOf(['spark', 'vine-snare', 'granite-wall', 'cinder-burst', 'spring-water']);
  state.surgeSuits = { ember: true };
  state.played = [
    { inst: makeCardInstance('spark'), card: CARD_BY_ID.spark, by: 'player', surged: false },
    { inst: makeCardInstance('bramble-guard'), card: CARD_BY_ID['bramble-guard'], by: 'rival', surged: false },
  ];
  state.log = [
    'You play Spark (deals 3 damage).',
    'Vex plays Bramble Guard (gains 5 shield).',
  ];
  state.intent = { plays: [], totalDmg: 9, totalHeal: 0, totalShield: 0 };
  return state;
}

function stageWin(state) {
  stageTable(state);
  state.rival.hp = 0;
  state.rival.shield = 0;
  state.player.hp = 17;
  state.over = true;
  state.winner = 'player';
  state.screen = 'win';
  state.phase = 'over';
  state.stats = { damageDealt: 34, damageTaken: 13, healed: 9, cardsPlayed: 11, turns: 7 };
  state.log = ['You play Avalanche (deals 12 damage).', 'Vex falls. The forge is yours.'];
  return state;
}

function stageLoss(state) {
  stageTable(state);
  state.player.hp = 0;
  state.player.shield = 0;
  state.rival.hp = 11;
  state.over = true;
  state.winner = 'rival';
  state.screen = 'loss';
  state.phase = 'over';
  state.stats = { damageDealt: 19, damageTaken: 31, healed: 6, cardsPlayed: 9, turns: 8 };
  state.log = ['Vex plays Cinder Burst (deals 11 damage).', 'Your light gutters out.'];
  return state;
}

export function stageShot(name, seed) {
  const state = newGame(seed || 1);
  if (name === 'table') return stageTable(state);
  if (name === 'win') return stageWin(state);
  if (name === 'loss') return stageLoss(state);
  return state; // 'title' (or anything unknown): the title screen.
}

export { START_MANA, drawCards, playCard };
