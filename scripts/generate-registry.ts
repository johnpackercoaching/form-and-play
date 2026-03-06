import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const gamesDir = join(__dirname, '..', 'src', 'games');
const outDir = join(__dirname, '..', 'src', 'generated');
const outFile = join(outDir, 'game-registry.json');

mkdirSync(outDir, { recursive: true });

const games = readdirSync(gamesDir)
  .filter(d => !d.startsWith('_') && !d.startsWith('.'))
  .map(d => {
    const metaPath = join(gamesDir, d, 'meta.json');
    try {
      return JSON.parse(readFileSync(metaPath, 'utf-8'));
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a: any, b: any) => (b.created || '').localeCompare(a.created || ''));

writeFileSync(outFile, JSON.stringify(games, null, 2));
console.log(`Registry: ${games.length} games written to ${outFile}`);
