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
    count.textContent = `${games.length} games`;

    brand.append(mark, title);
    this.navEl.append(brand, count);
    document.body.prepend(this.navEl);

    // Gallery container
    this.galleryEl = document.createElement('main');
    this.galleryEl.className = 'gallery';

    // Hero
    const hero = document.createElement('section');
    hero.className = 'gallery-hero';

    const heroTitle = document.createElement('h1');
    heroTitle.className = 'hero-title';
    heroTitle.innerHTML = 'Every game<br>is a <em>design</em><br>piece.';

    const heroSub = document.createElement('p');
    heroSub.className = 'hero-subtitle';
    heroSub.textContent = 'An arcade where form and content are inseparable. Every visual choice is deliberate. Every mechanic serves the design.';

    hero.append(heroTitle, heroSub);

    if (games.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';

      const emptyTitle = document.createElement('h2');
      emptyTitle.className = 'gallery-empty-title';
      emptyTitle.textContent = 'The canvas awaits';

      const emptySub = document.createElement('p');
      emptySub.className = 'gallery-empty-subtitle';
      emptySub.textContent = 'Games will appear here as The Studio builds them.';

      empty.append(emptyTitle, emptySub);
      this.galleryEl.append(hero, empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';

      const shapes = ['circle', 'square', 'triangle'] as const;
      games.forEach((game, i) => {
        const card = new GameCard(game.meta, shapes[i % 3], () => {
          this.launchGame(game.meta, game.loader);
        });
        grid.appendChild(card.render());
      });

      this.galleryEl.append(hero, grid);
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
