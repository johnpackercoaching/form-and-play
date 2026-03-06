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
    brand.setAttribute('role', 'link');
    brand.setAttribute('tabindex', '0');
    brand.setAttribute('aria-label', 'Form and Play home');
    brand.onclick = () => this.showGallery();
    brand.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.showGallery();
      }
    };

    const mark = document.createElement('span');
    mark.className = 'nav-mark';
    mark.setAttribute('aria-hidden', 'true');

    const title = document.createElement('span');
    title.className = 'nav-title';
    title.textContent = 'Form & Play';

    const count = document.createElement('span');
    count.className = 'nav-count';
    count.setAttribute('aria-live', 'polite');
    count.textContent = games.length === 0
      ? '0 games'
      : games.length === 1
        ? '1 game'
        : `${games.length} games`;

    brand.append(mark, title);
    this.navEl.append(brand, count);
    document.body.prepend(this.navEl);

    // Gallery container
    this.galleryEl = document.createElement('main');
    this.galleryEl.className = 'gallery';
    this.galleryEl.setAttribute('role', 'main');

    if (games.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderGameGrid(games);
    }

    this.container.appendChild(this.galleryEl);
  }

  private renderEmptyState(): void {
    const hero = document.createElement('div');
    hero.className = 'hero-composition';

    // Geometric shapes layer (behind text)
    const shapes = document.createElement('div');
    shapes.className = 'hero-shapes';
    shapes.setAttribute('aria-hidden', 'true');

    const circle = document.createElement('div');
    circle.className = 'hero-shape hero-shape--circle';

    const square = document.createElement('div');
    square.className = 'hero-shape hero-shape--square';

    const triangle = document.createElement('div');
    triangle.className = 'hero-shape hero-shape--triangle';

    shapes.append(circle, square, triangle);

    // Text layer (above shapes)
    const text = document.createElement('div');
    text.className = 'hero-text';

    const heroTitle = document.createElement('h1');
    heroTitle.className = 'hero-title';
    const titleForm = document.createTextNode('Form ');
    const titleAmp = document.createElement('span');
    titleAmp.className = 'hero-amp';
    titleAmp.textContent = '&';
    const titlePlay = document.createTextNode(' Play');
    heroTitle.append(titleForm, titleAmp, titlePlay);

    const heroSubtitle = document.createElement('p');
    heroSubtitle.className = 'hero-subtitle';
    heroSubtitle.textContent = 'Game One Is Coming';

    text.append(heroTitle, heroSubtitle);
    hero.append(shapes, text);

    this.galleryEl!.appendChild(hero);
  }

  private renderGameGrid(games: { meta: GameMeta; loader: () => Promise<GameModule> }[]): void {
    // Section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'gallery-section-header';

    const sectionLabel = document.createElement('span');
    sectionLabel.className = 'gallery-section-label';
    sectionLabel.textContent = 'Arcade';

    const sectionCount = document.createElement('span');
    sectionCount.className = 'gallery-section-count';
    sectionCount.textContent = games.length === 1 ? '1 game' : `${games.length} games`;

    sectionHeader.append(sectionLabel, sectionCount);

    const sectionLine = document.createElement('div');
    sectionLine.className = 'gallery-section-line';
    sectionLine.setAttribute('aria-hidden', 'true');

    // Game grid
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', 'Available games');

    const shapes = ['circle', 'square', 'triangle'] as const;
    games.forEach((game, i) => {
      const card = new GameCard(game.meta, shapes[i % 3], () => {
        this.launchGame(game.meta, game.loader);
      });
      const cardEl = card.render();
      cardEl.setAttribute('role', 'listitem');
      grid.appendChild(cardEl);
    });

    this.galleryEl!.append(sectionHeader, sectionLine, grid);
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
