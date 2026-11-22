// FORGEBOUND — tuning constants. One place holds every number the rules
// use, so a balance pass touches this file and nothing else.
export const MAX_HP = 30;
export const START_MANA = 2;
export const MAX_MANA = 10;
export const OPENING_HAND = 4;
export const HAND_LIMIT = 7;
export const DECK_SIZE = 30;
export const SURGE_BONUS = 3;
export const RIVAL_NAME = 'Vex, the Cinder Warden';
export const PLAYER_NAME = 'You, the Forgebound';

// The four suits. Each is told apart by colour AND shape, never by text
// alone: Ember is a red triangle, Tide a blue circle, Thorn a green
// diamond, Stone an amber square.
export const SUITS = {
  ember: { name: 'Ember', color: '#ff5a3c', dark: '#a11f0e', glyph: 'ember', blurb: 'Burns the rival' },
  tide: { name: 'Tide', color: '#3fa9ff', dark: '#0d4d8f', glyph: 'tide', blurb: 'Heals and draws' },
  thorn: { name: 'Thorn', color: '#4ecb5d', dark: '#14632a', glyph: 'thorn', blurb: 'Shields and bites' },
  stone: { name: 'Stone', color: '#ffb02e', dark: '#8a5a00', glyph: 'stone', blurb: 'Heavy and piercing' },
};

// Surge: the second card of a suit played in one turn gains +3 to its
// main number. It rewards holding a suit together instead of spending it.
export const SURGE_TEXT = 'Surge: a 2nd card of this suit in one turn gains +3.';
