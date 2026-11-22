// FORGEBOUND — the card catalog and the deck. Every card is one plain
// object: its suit, its mana cost, and its effect as numbers (damage,
// heal, shield, draw, mana, pierce). No card copies a commercial game;
// every name, suit and line of rules text is original.
//
// Effect fields: dmg (damage to the rival), heal (restore own HP),
// shield (block that soaks damage), draw (cards drawn), mana (crystals
// gained this turn), pierce (damage that ignores shield).
export const CATALOG = [
  { id: 'spark', name: 'Spark', suit: 'ember', cost: 1, dmg: 3, text: 'Deal 3 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'ember', cost: 2, dmg: 5, text: 'Deal 5 damage.' },
  { id: 'immolate', name: 'Immolate', suit: 'ember', cost: 3, dmg: 8, text: 'Deal 8 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', suit: 'ember', cost: 4, dmg: 11, text: 'Deal 11 damage.' },
  { id: 'ember-tithe', name: 'Ember Tithe', suit: 'ember', cost: 2, dmg: 4, mana: 1, text: 'Deal 4 damage. Gain 1 mana.' },
  { id: 'spring-water', name: 'Spring Water', suit: 'tide', cost: 1, heal: 4, text: 'Restore 4 life.' },
  { id: 'deep-current', name: 'Deep Current', suit: 'tide', cost: 2, heal: 6, draw: 1, text: 'Restore 6 life. Draw a card.' },
  { id: 'tidal-blessing', name: 'Tidal Blessing', suit: 'tide', cost: 3, heal: 9, text: 'Restore 9 life.' },
  { id: 'bramble-guard', name: 'Bramble Guard', suit: 'thorn', cost: 1, shield: 5, text: 'Gain 5 shield.' },
  { id: 'thornmail', name: 'Thorn Mail', suit: 'thorn', cost: 2, shield: 7, dmg: 3, text: 'Gain 7 shield. Deal 3 damage.' },
  { id: 'vine-snare', name: 'Vine Snare', suit: 'thorn', cost: 2, shield: 4, dmg: 4, text: 'Gain 4 shield. Deal 4 damage.' },
  { id: 'stone-fist', name: 'Stone Fist', suit: 'stone', cost: 3, dmg: 8, pierce: true, text: 'Deal 8 damage. Ignores shield.' },
  { id: 'granite-wall', name: 'Granite Wall', suit: 'stone', cost: 2, shield: 10, text: 'Gain 10 shield.' },
  { id: 'quake-slam', name: 'Quake Slam', suit: 'stone', cost: 4, dmg: 6, shield: 5, text: 'Deal 6 damage. Gain 5 shield.' },
  { id: 'avalanche', name: 'Avalanche', suit: 'stone', cost: 5, dmg: 12, text: 'Deal 12 damage.' },
];

export const CARD_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

// A full deck: two copies of every catalog card, thirty cards in all.
export function buildDeck() {
  const deck = [];
  for (const card of CATALOG) {
    deck.push(card.id, card.id);
  }
  return deck;
}

let nextUid = 1;

export function makeCardInstance(cardId) {
  return { uid: nextUid++, id: cardId };
}

// The big number printed in the middle of a card face: its main effect.
export function cardMainValue(card) {
  if (card.dmg) return card.dmg;
  if (card.heal) return card.heal;
  if (card.shield) return card.shield;
  return 0;
}

export function cardMainKind(card) {
  if (card.dmg) return 'damage';
  if (card.heal) return 'heal';
  if (card.shield) return 'shield';
  return 'effect';
}
