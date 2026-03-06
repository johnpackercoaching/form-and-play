import type { GameMeta, GameModule } from '../shared/types';

export class GameLauncher {
  private container: HTMLElement;
  private onClose: () => void;
  private launcherEl: HTMLElement | null = null;
  private currentModule: GameModule | null = null;

  constructor(container: HTMLElement, onClose: () => void) {
    this.container = container;
    this.onClose = onClose;
  }

  launch(meta: GameMeta, mod: GameModule): void {
    this.destroy();

    this.launcherEl = document.createElement('div');
    this.launcherEl.className = 'game-launcher';

    // Header
    const header = document.createElement('div');
    header.className = 'game-launcher-header';

    const title = document.createElement('span');
    title.className = 'game-launcher-title';
    title.textContent = meta.title;

    const close = document.createElement('button');
    close.className = 'game-launcher-close';
    close.textContent = 'Exit';
    close.setAttribute('aria-label', 'Close game');
    close.onclick = () => this.onClose();

    header.append(title, close);

    // Canvas area
    const canvasArea = document.createElement('div');
    canvasArea.className = 'game-launcher-canvas';

    this.launcherEl.append(header, canvasArea);
    this.container.appendChild(this.launcherEl);

    // Launch the game
    this.currentModule = mod;
    mod.default.launch(canvasArea);

    // ESC to close
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        this.onClose();
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  destroy(): void {
    if (this.currentModule?.default.destroy) {
      this.currentModule.default.destroy();
    }
    if (this.launcherEl) {
      this.launcherEl.remove();
      this.launcherEl = null;
    }
    this.currentModule = null;
  }
}
