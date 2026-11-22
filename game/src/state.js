// FORGEBOUND — the game state and its rules. Pure logic, no DOM here:
// render.js reads this state, input.js calls these functions, and the
// screenshot stager builds states directly through the same constructors.
import { buildDeck, makeCardInstance, CARD_BY_ID } from './cards.js';
import { shuffleDeck, mulberry32 } from './random.js';
import {
  MAX_HP, START_MANA, MAX_MANA, OPENING_HAND, HAND_LIMIT, SURGE_BONUS,
} from './config.js';

export function makeFighter(name) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    discard: [],
    fatigue: 0,
  };
}

export function newGame(seed) {
  const rand = mulberry32(seed || (Math.random() * 0xffffffff) >>> 0);
  const state = {
    seed,
    rand,
    screen: 'title',
    phase: 'player',
    turn: 1,
    over: false,
    winner: null,
    log: [],
    played: [],
    surgeSuits: {},
    surgeFlash: null,
    stats: { damageDealt: 0, damageTaken: 0, healed: 0, cardsPlayed: 0, turns: 0 },
    intent: null,
    player: makeFighter('player'),
    rival: makeFighter('rival'),
    lastEvent: null,
  };
  state.player.deck = shuffleDeck(buildDeck().map(makeCardInstance), rand);
  state.rival.deck = shuffleDeck(buildDeck().map(makeCardInstance), rand);
  return state;
}

export function drawCards(state, fighter, count) {
  for (let i = 0; i < count; i++) {
    if (fighter.deck.length === 0) {
      fighter.fatigue += 1;
      dealDamage(state, fighter, fighter.fatigue, { fatigue: true });
      if (state.over) return;
      continue;
    }
    const card = fighter.deck.pop();
    if (fighter.hand.length >= HAND_LIMIT) {
      fighter.discard.push(card);
    } else {
      fighter.hand.push(card);
    }
  }
}

export function startGame(state) {
  state.started = true;
  state.screen = 'play';
  state.phase = 'player';
  state.turn = 1;
  state.player.maxMana = START_MANA;
  state.player.mana = START_MANA;
  state.rival.maxMana = START_MANA;
  state.rival.mana = START_MANA;
  drawCards(state, state.player, OPENING_HAND);
  drawCards(state, state.rival, OPENING_HAND);
  addLog(state, 'The duel begins. Your move, Forgebound.');
  updateIntent(state);
}

export function startPlayerTurn(state) {
  state.phase = 'player';
  state.turn += 1;
  state.stats.turns = state.turn;
  const p = state.player;
  const r = state.rival;
  // The round tick grows BOTH fighters' mana together. Growing the
  // rival's on its own turn instead left it one crystal ahead forever.
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.mana = p.maxMana;
  r.maxMana = Math.min(MAX_MANA, r.maxMana + 1);
  state.played = [];
  state.surgeSuits = {};
  drawCards(state, p, 1);
  if (state.over) return;
  addLog(state, `Turn ${state.turn}: you draw a card and gain ${p.maxMana} mana.`);
  updateIntent(state);
}

export function dealDamage(state, target, amount, opts = {}) {
  if (amount <= 0 || state.over) return 0;
  let left = amount;
  if (!opts.pierce && target.shield > 0) {
    const soaked = Math.min(target.shield, left);
    target.shield -= soaked;
    left -= soaked;
  }
  if (left > 0) {
    target.hp = Math.max(0, target.hp - left);
  }
  if (target === state.player) state.stats.damageTaken += left;
  if (target === state.rival) state.stats.damageDealt += left;
  checkEnd(state);
  return left;
}

export function healFighter(state, fighter, amount) {
  if (amount <= 0) return 0;
  const healed = Math.min(amount, fighter.maxHp - fighter.hp);
  fighter.hp += healed;
  if (fighter === state.player) state.stats.healed += healed;
  return healed;
}

function checkEnd(state) {
  if (state.over) return;
  if (state.rival.hp <= 0 && state.player.hp <= 0) {
    state.over = true;
    state.winner = 'draw';
    state.screen = 'win';
  } else if (state.rival.hp <= 0) {
    state.over = true;
    state.winner = 'player';
    state.screen = 'win';
  } else if (state.player.hp <= 0) {
    state.over = true;
    state.winner = 'rival';
    state.screen = 'loss';
  }
  if (state.over) state.phase = 'over';
}

// Play one card from a fighter's hand. Returns false when the card cannot
// be played (wrong phase, not in hand, not enough mana).
export function playCard(state, fighter, uid) {
  const foe = fighter === state.player ? state.rival : state.player;
  const index = fighter.hand.findIndex((c) => c.uid === uid);
  if (index === -1) return false;
  const inst = fighter.hand[index];
  const card = CARD_BY_ID[inst.id];
  if (fighter.mana < card.cost) return false;
  if (fighter === state.player && state.phase !== 'player') return false;

  fighter.mana -= card.cost;
  fighter.hand.splice(index, 1);
  fighter.discard.push(inst);

  const surged = Boolean(state.surgeSuits[card.suit]);
  state.surgeSuits[card.suit] = true;
  const bonus = surged ? SURGE_BONUS : 0;
  if (surged) state.surgeFlash = card.suit;

  const parts = [];
  if (card.dmg) {
    const amount = card.dmg + (card.dmg ? bonus : 0);
    const dealt = dealDamage(state, foe, amount, { pierce: card.pierce });
    parts.push(`deals ${dealt} damage`);
  }
  if (card.heal) {
    const healed = healFighter(state, fighter, card.heal + bonus);
    parts.push(`restores ${healed} life`);
  }
  if (card.shield) {
    fighter.shield += card.shield + bonus;
    parts.push(`gains ${card.shield + bonus} shield`);
  }
  if (card.draw) drawCards(state, fighter, card.draw);
  if (card.mana) fighter.mana = Math.min(fighter.maxMana, fighter.mana + card.mana);

  state.played.push({ inst, card, by: fighter === state.player ? 'player' : 'rival', surged });
  if (state.played.length > 4) state.played.shift();
  if (fighter === state.player) state.stats.cardsPlayed += 1;

  const who = fighter === state.player ? 'You play' : 'Vex plays';
  addLog(state, `${who} ${card.name}${surged ? ' — SURGE +3!' : ''} (${parts.join(', ')}).`);
  state.lastEvent = { kind: card.dmg ? 'damage' : card.heal ? 'heal' : 'shield', by: fighter === state.player ? 'player' : 'rival', surged };
  return true;
}

export function addLog(state, line) {
  state.log.push(line);
  if (state.log.length > 5) state.log.shift();
}

// The rival's intent: what Vex plans to do on the coming turn, shown
// before the player ends theirs, so the player can read it and counter
// with shield or a race to kill. Computed from the same chooser the rival
// really uses, so the telegraph never lies.
export function updateIntent(state) {
  if (state.over) {
    state.intent = null;
    return;
  }
  const plan = chooseRivalPlays(state);
  state.intent = plan;
}

export function chooseRivalPlays(state) {
  const r = state.rival;
  const p = state.player;
  const hand = r.hand.slice();
  // Budget on maxMana, not leftover mana: this same chooser both
  // telegraphs the intent (before the rival's refill) and picks the
  // real plays (after it), so the telegraph never lies.
  let mana = r.maxMana;
  const plays = [];
  let totalDmg = 0;
  let totalHeal = 0;
  let totalShield = 0;
  const suitsSeen = {};
  while (true) {
    let best = null;
    let bestScore = 0;
    for (const inst of hand) {
      const card = CARD_BY_ID[inst.id];
      if (card.cost > mana) continue;
      const surge = suitsSeen[card.suit] ? SURGE_BONUS : 0;
      let score = 0;
      if (card.dmg) score += (card.dmg + surge) * 2 + (card.pierce ? 2 : 0);
      if (card.heal) score += (r.hp < 12 ? (card.heal + surge) * 3 : (card.heal + surge) * 0.4);
      if (card.shield) score += (p.hp <= 8 || totalDmg >= p.hp ? 0.5 : (card.shield + surge) * 0.8);
      if (card.draw) score += 1.5;
      if (card.mana) score += 2;
      score /= card.cost;
      if (score > bestScore) {
        bestScore = score;
        best = { inst, card, surge };
      }
    }
    if (!best) break;
    mana -= best.card.cost;
    suitsSeen[best.card.suit] = true;
    plays.push(best.inst.uid);
    if (best.card.dmg) totalDmg += best.card.dmg + best.surge;
    if (best.card.heal) totalHeal += best.card.heal + best.surge;
    if (best.card.shield) totalShield += best.card.shield + best.surge;
    hand.splice(hand.findIndex((c) => c.uid === best.inst.uid), 1);
  }
  return { plays, totalDmg, totalHeal, totalShield };
}

export function rivalTurn(state) {
  state.phase = 'rival';
  const r = state.rival;
  r.mana = r.maxMana;
  // Surge belongs to the turn that earned it: the rival starts its own
  // turn with a clean slate, never cashing in on the player's suits.
  state.surgeSuits = {};
  drawCards(state, r, 1);
  if (state.over) return [];
  const plan = chooseRivalPlays(state);
  addLog(state, `Vex takes ${r.maxMana} mana and draws.`);
  return plan.plays;
}
