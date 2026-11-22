// FORGEBOUND — the rival's voice and its telegraphed intent. The brain
// lives in state.js (chooseRivalPlays); this file turns a plan into words
// the player can read, and gives Vex lines so the duel feels like a
// person across the table, not a spreadsheet.
export function intentLabel(plan) {
  if (!plan) return null;
  if (plan.totalDmg >= 12) return { text: `Vex plans a crushing blow (${plan.totalDmg} damage)`, tone: 'danger' };
  if (plan.totalDmg >= 6) return { text: `Vex plans a heavy strike (${plan.totalDmg} damage)`, tone: 'danger' };
  if (plan.totalDmg > 0) return { text: `Vex plans a strike (${plan.totalDmg} damage)`, tone: 'warn' };
  if (plan.totalHeal > 0) return { text: `Vex plans to mend wounds (+${plan.totalHeal} life)`, tone: 'calm' };
  if (plan.totalShield > 0) return { text: `Vex plans to raise a wall (+${plan.totalShield} shield)`, tone: 'calm' };
  return { text: 'Vex is watching you, waiting.', tone: 'calm' };
}

export const TAUNTS = {
  start: 'So. Another spark thinks it can burn the Warden.',
  playerSurge: 'A surge? Cute. The forge remembers every spark.',
  rivalLow: 'You fight well. It will not be enough.',
  playerLow: 'Your light is guttering, little ember.',
  win: 'The forge is yours. Spend it well.',
  loss: 'The cinders keep what they catch.',
};

export function pickTaunt(state) {
  if (state.rival.hp <= 8) return TAUNTS.rivalLow;
  if (state.player.hp <= 8) return TAUNTS.playerLow;
  if (state.surgeFlash) return TAUNTS.playerSurge;
  return null;
}
