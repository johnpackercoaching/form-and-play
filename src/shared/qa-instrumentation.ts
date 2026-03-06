import type { GameQA } from './types';

export function initQA(scene: any, gameId: string): void {
  const qa: GameQA = {
    gameId,
    scene,
    state: {},
    events: [],
  };
  window.__GAME_QA = qa;
}

export function updateQA(state: Record<string, any>): void {
  if (window.__GAME_QA) {
    window.__GAME_QA.state = { ...window.__GAME_QA.state, ...state };
  }
}

export function qaEvent(type: string, data?: any): void {
  if (window.__GAME_QA) {
    window.__GAME_QA.events.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }
}
