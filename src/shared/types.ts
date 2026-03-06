export interface GameMeta {
  id: string;
  title: string;
  description: string;
  created: string;
  thumbnail?: string;
  palette?: string[];       // The 4 colors + black
  principle?: string;       // Which design principle this game embodies
  tags?: string[];
}

export interface GameModule {
  default: {
    launch: (container: HTMLElement) => void;
    destroy?: () => void;
  };
}

export interface GameQA {
  gameId: string;
  scene: any;
  state: Record<string, any>;
  events: { type: string; timestamp: number; data?: any }[];
}

declare global {
  interface Window {
    __GAME_QA?: GameQA;
  }
}
