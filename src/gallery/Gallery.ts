import type { GameMeta, GameModule } from '../shared/types';
import { GameCard } from './GameCard';
import { GameLauncher } from './GameLauncher';

const metaModules = import.meta.glob('../games/*/meta.json', { eager: true }) as Record<string, { default: GameMeta }>;
const gameModules = import.meta.glob('../games/*/index.ts') as Record<string, () => Promise<GameModule>>;

export class Gallery {
  private container: HTMLElement;
  private launcher: GameLauncher;
  private galleryEl: HTMLElement | null = null;
  private navEl: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.launcher = new GameLauncher(container, () => this.showGallery());
  }

  init(): void {
    this.render();
  }

  private getGames(): { meta: GameMeta; loader: () => Promise<GameModule> }[] {
    const games: { meta: GameMeta; loader: () => Promise<GameModule> }[] = [];

    for (const [path, mod] of Object.entries(metaModules)) {
      if (path.includes('_template')) continue;
      const meta = (mod as any).default ?? mod;
      const dir = path.replace('/meta.json', '');
      const indexPath = dir + '/index.ts';
      const loader = gameModules[indexPath];
      if (loader) {
        games.push({ meta, loader: loader as () => Promise<GameModule> });
      }
    }

    return games.sort((a, b) => {
      const dateCompare = (b.meta.created || '').localeCompare(a.meta.created || '');
      if (dateCompare !== 0) return dateCompare;
      return b.meta.id.localeCompare(a.meta.id);
    });
  }

  private render(): void {
    const games = this.getGames();

    // Nav
    this.navEl = document.createElement('nav');
    this.navEl.className = 'gallery-nav';
    this.navEl.setAttribute('role', 'banner');

    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    brand.setAttribute('aria-label', 'Form & Play home');
    brand.onclick = () => this.showGallery();

    const mark = document.createElement('span');
    mark.className = 'nav-mark';

    const title = document.createElement('span');
    title.className = 'nav-title';
    title.textContent = 'Form & Play';

    const count = document.createElement('span');
    count.className = 'nav-count';
    count.textContent = games.length === 1 ? '1 game' : `${games.length} games`;

    brand.append(mark, title);
    this.navEl.append(brand, count);
    document.body.prepend(this.navEl);

    // Gallery container
    this.galleryEl = document.createElement('main');
    this.galleryEl.className = 'gallery';

    if (games.length === 0) {
      // Empty state -- inviting, not preachy
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';

      // Animated shapes as a playful loading/waiting state
      const shapes = document.createElement('div');
      shapes.className = 'empty-shapes';

      const circle = document.createElement('div');
      circle.className = 'empty-shape empty-shape--circle';
      const square = document.createElement('div');
      square.className = 'empty-shape empty-shape--square';
      const triangle = document.createElement('div');
      triangle.className = 'empty-shape empty-shape--triangle';

      shapes.append(circle, square, triangle);

      const emptyTitle = document.createElement('h1');
      emptyTitle.className = 'gallery-empty-title';
      emptyTitle.textContent = 'Games incoming';

      const emptySub = document.createElement('p');
      emptySub.className = 'gallery-empty-subtitle';
      emptySub.textContent = 'New games drop every hour. Check back soon.';

      empty.append(shapes, emptyTitle, emptySub);
      this.galleryEl.append(empty);
    } else {
      // Game grid -- games front and center, no hero manifesto
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';

      const shapes = ['circle', 'square', 'triangle'] as const;
      games.forEach((game, i) => {
        const card = new GameCard(game.meta, shapes[i % 3], () => {
          this.launchGame(game.meta, game.loader);
        });
        grid.appendChild(card.render());
      });

      this.galleryEl.append(grid);
    }

    this.container.appendChild(this.galleryEl);
  }

  private async launchGame(meta: GameMeta, loader: () => Promise<GameModule>): Promise<void> {
    if (this.galleryEl) this.galleryEl.style.display = 'none';
    const mod = await loader();
    this.launcher.launch(meta, mod);
  }

  private showGallery(): void {
    this.launcher.destroy();
    if (this.galleryEl) this.galleryEl.style.display = '';
  }
}
