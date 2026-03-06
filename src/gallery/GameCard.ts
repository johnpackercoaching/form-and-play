import type { GameMeta } from '../shared/types';

type AccentShape = 'circle' | 'square' | 'triangle';

export class GameCard {
  private meta: GameMeta;
  private shape: AccentShape;
  private onClick: () => void;

  constructor(meta: GameMeta, shape: AccentShape, onClick: () => void) {
    this.meta = meta;
    this.shape = shape;
    this.onClick = onClick;
  }

  render(): HTMLElement {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.setAttribute('data-game-id', this.meta.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Play ${this.meta.title}`);
    card.onclick = this.onClick;
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.onClick();
      }
    };

    // Thumbnail
    if (this.meta.thumbnail) {
      const img = document.createElement('img');
      img.className = 'game-card-thumbnail';
      img.src = this.meta.thumbnail;
      img.alt = this.meta.title;
      img.loading = 'lazy';
      card.appendChild(img);
    }

    // Geometric accent
    const accent = document.createElement('div');
    accent.className = `game-card-accent game-card-accent--${this.shape}`;
    card.appendChild(accent);

    // Info overlay
    const info = document.createElement('div');
    info.className = 'game-card-info';

    const title = document.createElement('h3');
    title.className = 'game-card-title';
    title.textContent = this.meta.title;

    info.appendChild(title);

    if (this.meta.principle) {
      const principle = document.createElement('span');
      principle.className = 'game-card-principle';
      principle.textContent = this.meta.principle;
      info.appendChild(principle);
    }

    card.appendChild(info);

    return card;
  }
}
