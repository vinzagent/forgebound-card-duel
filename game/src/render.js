// FORGEBOUND — everything the player sees. The DOM shell lives in
// index.html; this file fills it from the state: the two fighters, the
// table, the hand, the overlays. Cards are plain DOM, so their values
// stay crisp and legible even when the screenshot is shrunk to a
// thumbnail.
import { CARD_BY_ID, cardMainValue, cardMainKind } from './cards.js';
import { SUITS, MAX_MANA, RIVAL_NAME } from './config.js';
import { intentLabel, pickTaunt } from './ai.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function suitGlyph(suit) {
  const span = el('span', `glyph glyph-${suit}`);
  span.setAttribute('aria-label', SUITS[suit].name);
  return span;
}

export function cardElement(inst, opts = {}) {
  const card = CARD_BY_ID[inst.id];
  const suit = SUITS[card.suit];
  const node = el('div', `card suit-${card.suit}`);
  node.dataset.uid = inst.uid;
  if (opts.small) node.classList.add('small');
  if (opts.playable === false) node.classList.add('unplayable');
  if (opts.selected) node.classList.add('selected');
  if (opts.dealt) {
    node.classList.add('dealt');
    node.style.animationDelay = `${(opts.dealtIndex || 0) * 60}ms`;
  }

  const cost = el('div', 'cost', String(card.cost));
  cost.title = `${card.cost} mana`;
  node.appendChild(cost);

  const head = el('div', 'card-head');
  head.appendChild(suitGlyph(card.suit));
  const nameEl = el('span', 'card-name', card.name);
  nameEl.style.flex = '1';
  nameEl.style.minWidth = '0';
  head.appendChild(nameEl);
  node.appendChild(head);

  const big = el('div', 'card-big', String(cardMainValue(card)));
  node.appendChild(big);
  node.appendChild(el('div', 'card-kind', cardMainKind(card).toUpperCase()));

  const body = el('div', 'card-text', card.text);
  node.appendChild(body);

  const foot = el('div', 'card-foot');
  foot.appendChild(el('span', 'card-suit-name', suit.name.toUpperCase()));
  if (opts.surged) foot.appendChild(el('span', 'surge-tag', 'SURGE +3'));
  node.appendChild(foot);
  return node;
}

function cardBack() {
  const node = el('div', 'card back');
  const inner = el('div', 'back-mark', 'F');
  node.appendChild(inner);
  return node;
}

function hpBar(fighter, label) {
  const wrap = el('div', 'hp-wrap');
  const row = el('div', 'hp-row');
  row.appendChild(el('span', 'fighter-name', label));
  const bar = el('div', 'hpbar');
  const fill = el('div', 'hpfill');
  fill.style.width = `${Math.max(0, (fighter.hp / fighter.maxHp) * 100)}%`;
  if (fighter.hp <= 10) fill.classList.add('low');
  bar.appendChild(fill);
  row.appendChild(bar);
  row.appendChild(el('span', 'hp-text', `${fighter.hp} / ${fighter.maxHp}`));
  if (fighter.shield > 0) {
    const badge = el('span', 'shield-badge', `SHIELD ${fighter.shield}`);
    row.appendChild(badge);
  }
  wrap.appendChild(row);
  return wrap;
}

function manaRow(fighter) {
  const row = el('div', 'mana-row');
  row.appendChild(el('span', 'mana-label', 'MANA'));
  const pips = el('div', 'mana-pips');
  for (let i = 0; i < MAX_MANA; i++) {
    const pip = el('span', 'pip');
    if (i < fighter.mana) pip.classList.add('filled');
    if (i < fighter.maxMana) pip.classList.add('unlocked');
    pips.appendChild(pip);
  }
  row.appendChild(pips);
  row.appendChild(el('span', 'mana-text', `${fighter.mana} / ${fighter.maxMana}`));
  return row;
}

function surgeRow(state) {
  const row = el('div', 'surge-row');
  row.appendChild(el('span', 'surge-label', 'SURGE'));
  for (const suit of Object.keys(SUITS)) {
    const chip = el('span', 'surge-chip');
    chip.appendChild(suitGlyph(suit));
    if (state.surgeSuits[suit]) chip.classList.add('lit');
    row.appendChild(chip);
  }
  row.appendChild(el('span', 'surge-hint', '2nd of a suit: +3'));
  return row;
}

export function render(state) {
  document.body.classList.toggle('screen-title', state.screen === 'title');
  document.body.classList.toggle('screen-win', state.screen === 'win');
  document.body.classList.toggle('screen-loss', state.screen === 'loss');

  $('#turn-label').textContent = state.screen === 'play' ? `TURN ${state.turn}` : 'FORGEBOUND';
  $('#deck-you').textContent = `Deck ${state.player.deck.length}`;
  $('#deck-vex').textContent = `Deck ${state.rival.deck.length}`;

  // Rival zone.
  const rivalZone = $('#rival-zone');
  rivalZone.replaceChildren();
  const rivalHead = el('div', 'fighter-head');
  const avatar = el('div', 'avatar rival-avatar', 'V');
  rivalHead.appendChild(avatar);
  const rivalInfo = el('div', 'fighter-info');
  rivalInfo.appendChild(el('div', 'fighter-title', RIVAL_NAME));
  rivalInfo.appendChild(hpBar(state.rival, 'LIFE'));
  const intent = state.screen === 'play' && state.phase === 'player' ? intentLabel(state.intent) : null;
  if (intent) {
    const banner = el('div', `intent intent-${intent.tone}`, intent.text);
    rivalInfo.appendChild(banner);
  } else if (state.phase === 'rival') {
    rivalInfo.appendChild(el('div', 'intent intent-warn', 'Vex is playing...'));
  }
  rivalHead.appendChild(rivalInfo);
  rivalZone.appendChild(rivalHead);
  const rivalHand = el('div', 'rival-hand');
  for (let i = 0; i < state.rival.hand.length; i++) rivalHand.appendChild(cardBack());
  rivalHand.appendChild(el('span', 'hand-count', `${state.rival.hand.length} cards`));
  rivalZone.appendChild(rivalHand);

  // Table: last played cards and the combat log.
  const table = $('#table-zone');
  table.replaceChildren();
  const playedRow = el('div', 'played-row');
  if (state.played.length === 0) {
    playedRow.appendChild(el('div', 'table-hint', state.screen === 'play' ? 'Play a card — click it, or press 1-7. End Turn with Space.' : ''));
  } else {
    for (const p of state.played) {
      const wrap = el('div', 'played-card');
      wrap.appendChild(el('div', 'played-by', p.by === 'player' ? 'YOU' : 'VEX'));
      wrap.appendChild(cardElement(p.inst, { small: true, surged: p.surged }));
      playedRow.appendChild(wrap);
    }
  }
  table.appendChild(playedRow);
  const log = el('div', 'log');
  for (const line of state.log.slice(-2)) log.appendChild(el('div', 'log-line', line));
  table.appendChild(log);
  const taunt = pickTaunt(state);
  if (taunt && state.screen === 'play') {
    table.appendChild(el('div', 'taunt', `"${taunt}"`));
  }

  // Player zone.
  const playerZone = $('#player-zone');
  playerZone.replaceChildren();
  const playerHead = el('div', 'fighter-head');
  playerHead.appendChild(el('div', 'avatar player-avatar', 'Y'));
  const playerInfo = el('div', 'fighter-info');
  playerInfo.appendChild(el('div', 'fighter-title', 'YOU — THE FORGEBOUND'));
  playerInfo.appendChild(hpBar(state.player, 'LIFE'));
  playerInfo.appendChild(manaRow(state.player));
  playerHead.appendChild(playerInfo);
  playerHead.appendChild(surgeRow(state));
  playerZone.appendChild(playerHead);

  const handRow = el('div', 'hand-row');
  state.player.hand.forEach((inst, i) => {
    const card = CARD_BY_ID[inst.id];
    const playable = state.screen === 'play' && state.phase === 'player' && state.player.mana >= card.cost;
    const node = cardElement(inst, { playable, dealt: true, dealtIndex: i });
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.title = playable ? `Play ${card.name} (${card.cost} mana) — or press ${i + 1}` : `${card.name} needs ${card.cost} mana`;
    handRow.appendChild(node);
  });
  playerZone.appendChild(handRow);

  const endBtn = $('#end-turn');
  endBtn.disabled = !(state.screen === 'play' && state.phase === 'player');
  endBtn.textContent = state.phase === 'rival' ? 'VEX IS PLAYING...' : 'END TURN  (Space)';

  renderOverlay(state);
}

function renderOverlay(state) {
  const overlay = $('#overlay');
  overlay.replaceChildren();
  if (state.screen === 'title') {
    const box = el('div', 'panel title-panel');
    box.appendChild(el('div', 'title-kicker', 'A DUEL OF THE FOUR SUITS'));
    const title = el('h1', 'game-title');
    title.innerHTML = 'FORGE<span>BOUND</span>';
    box.appendChild(title);
    box.appendChild(el('p', 'title-sub', 'Outwit Vex, the Cinder Warden, in a duel of ember, tide, thorn and stone. Thirty life each. Ten mana at most. One forge, one winner.'));
    const legend = el('div', 'suit-legend');
    for (const [key, suit] of Object.entries(SUITS)) {
      const item = el('div', 'legend-item');
      item.appendChild(suitGlyph(key));
      const txt = el('div');
      txt.appendChild(el('div', 'legend-name', suit.name.toUpperCase()));
      txt.appendChild(el('div', 'legend-blurb', suit.blurb));
      item.appendChild(txt);
      legend.appendChild(item);
    }
    box.appendChild(legend);
    box.appendChild(el('p', 'howto', 'HOW TO PLAY — Click a card to play it (or press 1-7). Cards cost mana; mana refills and grows each turn. Play two cards of one suit in a turn for SURGE +3. Watch Vex\u2019s intent, then shield or strike. First to 0 life loses.'));
    const play = el('button', 'big-btn', state.started ? 'BACK TO THE DUEL' : 'PLAY THE DUEL');
    play.id = 'play-btn';
    box.appendChild(play);
    box.appendChild(el('p', 'title-foot', 'Original game, art and rules. No network, no account, no ads.'));
    overlay.appendChild(box);
    overlay.classList.remove('hidden');
    return;
  }
  if (state.screen === 'win' || state.screen === 'loss') {
    const won = state.screen === 'win';
    const box = el('div', won ? 'panel win-panel' : 'panel loss-panel');
    box.appendChild(el('div', 'end-kicker', won ? 'THE FORGE IS YOURS' : 'THE CINDERS KEEP YOU'));
    box.appendChild(el('h1', 'end-title', won ? 'VICTORY' : 'DEFEAT'));
    box.appendChild(el('p', 'end-sub', won
      ? 'Vex bows to the new Forgebound. The warden\u2019s forge burns for you now.'
      : 'Vex stands over the embers. The forge is patient — it will let you try again.'));
    const stats = el('div', 'stats-grid');
    const stat = (label, value) => {
      const s = el('div', 'stat');
      s.appendChild(el('div', 'stat-value', String(value)));
      s.appendChild(el('div', 'stat-label', label));
      stats.appendChild(s);
    };
    stat('TURNS', state.stats.turns);
    stat('DAMAGE DEALT', state.stats.damageDealt);
    stat('LIFE RESTORED', state.stats.healed);
    stat('CARDS PLAYED', state.stats.cardsPlayed);
    box.appendChild(stats);
    const again = el('button', 'big-btn', won ? 'DUEL AGAIN' : 'TRY AGAIN');
    again.id = 'again-btn';
    box.appendChild(again);
    overlay.appendChild(box);
    overlay.classList.remove('hidden');
    return;
  }
  overlay.classList.add('hidden');
}

export function floatText(anchorEl, text, kind) {
  if (!anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  const app = $('#app').getBoundingClientRect();
  const node = el('div', `floater floater-${kind}`, text);
  node.style.left = `${rect.left - app.left + rect.width / 2}px`;
  node.style.top = `${rect.top - app.top}px`;
  $('#floaters').appendChild(node);
  setTimeout(() => node.remove(), 1000);
}

export function shakeApp() {
  const app = $('#app');
  app.classList.remove('shake');
  void app.offsetWidth;
  app.classList.add('shake');
}
