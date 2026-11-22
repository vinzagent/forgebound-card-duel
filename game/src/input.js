// FORGEBOUND — mouse and keyboard input. Click a card to play it,
// press 1-7 for the hand, Space or Enter to end the turn, M to mute,
// H for the title screen again. Nothing here touches game rules; it
// only calls the state functions and the renderer.
import { playCard } from './state.js';
import { sfx, unlockAudio, toggleMute, isMuted } from './audio.js';

export function bindInput(state, hooks) {
  const handRow = document.querySelector('#player-zone');
  handRow.addEventListener('click', (event) => {
    const cardNode = event.target.closest('.card');
    if (!cardNode || !cardNode.dataset.uid) return;
    unlockAudio();
    hooks.onCardClick(Number(cardNode.dataset.uid), cardNode);
  });
  handRow.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const cardNode = event.target.closest('.card');
    if (!cardNode || !cardNode.dataset.uid) return;
    event.preventDefault();
    unlockAudio();
    hooks.onCardClick(Number(cardNode.dataset.uid), cardNode);
  });

  document.querySelector('#end-turn').addEventListener('click', () => {
    unlockAudio();
    hooks.onEndTurn();
  });

  document.querySelector('#sound-btn').addEventListener('click', (event) => {
    const muted = toggleMute();
    event.currentTarget.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
    if (!muted) sfx.click();
  });

  document.querySelector('#help-btn').addEventListener('click', () => {
    unlockAudio();
    hooks.onHelp();
  });

  document.addEventListener('click', (event) => {
    const playBtn = event.target.closest('#play-btn');
    if (playBtn) {
      unlockAudio();
      sfx.play();
      hooks.onPlay();
      return;
    }
    const againBtn = event.target.closest('#again-btn');
    if (againBtn) {
      unlockAudio();
      sfx.play();
      hooks.onPlayAgain();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '7') {
      const index = Number(key) - 1;
      const inst = state.player.hand[index];
      if (inst && state.screen === 'play' && state.phase === 'player') {
        unlockAudio();
        hooks.onCardClick(inst.uid, null);
      }
      return;
    }
    if (key === ' ' || key === 'enter') {
      if (state.screen === 'title') {
        unlockAudio();
        hooks.onPlay();
        return;
      }
      if ((state.screen === 'win' || state.screen === 'loss') && key === 'enter') {
        hooks.onPlayAgain();
        return;
      }
      if (state.screen === 'play' && state.phase === 'player') {
        event.preventDefault();
        unlockAudio();
        hooks.onEndTurn();
      }
      return;
    }
    if (key === 'm') {
      const muted = toggleMute();
      document.querySelector('#sound-btn').textContent = muted ? 'SOUND OFF' : 'SOUND ON';
      return;
    }
    if (key === 'escape' && state.screen === 'play') hooks.onHelp();
  });
}

export { playCard, sfx, isMuted };
