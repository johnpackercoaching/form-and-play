You are building a game for the Form & Play arcade. Your only goal: make something genuinely fun that people want to play again.

## Your Task

Read /tmp/game-edit-input.json for the build request. It contains:
- `build_id`: Unique build identifier
- `request_text`: Five random words that are your creative seed
- `game_id`: Target game ID (empty = new game)

Those 5 words are your starting point. They are NOT a specification -- they are inspiration. Use them however you want: as a theme, a mechanic, a visual motif, a title, a feeling. The only rule is that the game must be genuinely good.

## What Makes a Good Arcade Game

- **Immediately playable**: No tutorial needed. The player understands what to do within 3 seconds.
- **One more round**: The player dies and immediately wants to try again.
- **Clean and readable**: You can tell what's happening at a glance, even at speed.
- **Personality**: The game has a feel -- not generic, not corporate, not "another Phaser demo."
- **Tight controls**: Input feels responsive and precise. No floaty movement.
- **Escalation**: Gets harder in a way that feels fair, not random.
- **Satisfying feedback**: Hits feel like hits. Scores feel earned. Deaths feel deserved.

## What Makes a Bad Arcade Game

- Overcomplicated rules
- Sluggish or imprecise controls
- Visual clutter that makes it hard to read the game state
- No personality -- looks like a tutorial project
- Difficulty that feels unfair or random
- No reason to play again after the first try

## Design Quality (Built In, Never Stated)

These are your quality standards -- apply them, never mention them:
- Black background, bold colors, maximum 4 colors per game
- Every visual element serves gameplay -- nothing decorative
- Typography is clean and readable (Inter for UI, JetBrains Mono for scores)
- The screenshot alone should make someone want to play

## Technical Requirements

1. Use Phaser 3
2. Create in `src/games/{NNN}-{slug}/` (NNN = next available number)
3. `meta.json`: id, title, description, created date, palette (4 hex colors), tags
4. `index.ts`: exports `{ launch(container), destroy() }`
5. Canvas: 1280x720, black background
6. Import QA instrumentation from `src/shared/qa-instrumentation.ts`
7. Call `initQA(this, gameId)` in create(), `updateQA({...})` in update()

## QA Instrumentation Contract (CRITICAL)

Your game WILL be automatically tested by a QA agent after building. The QA agent observes your game exclusively through `window.__GAME_QA.state`. You MUST expose enough state for meaningful testing.

### Required State Fields

Every game MUST call `updateQA()` in its update loop with AT LEAST these fields:

```typescript
updateQA({
  // REQUIRED -- every game
  score: this.score,                    // number -- current player score
  state: this.gameOver ? 'gameover' : 'playing',  // string -- 'playing' | 'gameover' | 'paused' | 'menu'
  elapsed: Math.floor(this.elapsed / 1000),        // number -- seconds since game start

  // REQUIRED -- player position
  playerX: this.player.x,              // number -- player X position
  playerY: this.player.y,              // number -- player Y position

  // RECOMMENDED -- game-specific
  lives: this.lives,                   // number -- if the game has lives
  level: this.level,                   // number -- if the game has levels/waves
  entityCount: this.enemies.length,    // number -- active enemy/hazard count
  // ... any other state relevant to your mechanics
});
```

### Required QA Events

Use `qaEvent()` from `src/shared/qa-instrumentation.ts` to log important game events:

```typescript
import { initQA, updateQA, qaEvent } from '../../shared/qa-instrumentation';

// Log when important things happen:
qaEvent('player-hit', { damage: 1, health: this.health });
qaEvent('enemy-killed', { enemyType: 'crystal', points: 10 });
qaEvent('power-up-collected', { type: 'shield', duration: 5000 });
qaEvent('level-up', { newLevel: this.level });
qaEvent('game-over', { finalScore: this.score, cause: 'collision' });
qaEvent('restart', {});
```

### Why This Matters

The QA agent will:
- Verify your game boots and renders a canvas
- Simulate player input (arrow keys, WASD, mouse, spacebar)
- Check that `state` changes from 'playing' to 'gameover' when the player dies
- Verify `score` increases when the player does scoring actions
- Confirm the game restarts cleanly (state resets to 'playing', score to 0)
- Check that `elapsed` advances (game loop is running)
- Look for console errors during all of this

If your updateQA() call is incomplete, the QA agent will fail tests and try to fix your code. Save everyone time: expose full state from the start.

### Game State Machine

Your game MUST have a clean state machine observable through the `state` field:

```
'playing' --> 'gameover' (player dies/fails)
'gameover' --> 'playing' (player presses restart key)
```

The restart key is typically Space. After restart:
- `state` must return to `'playing'`
- `score` must reset to `0`
- `elapsed` must reset to `0`
- All game objects must be recreated fresh

## Output

Write `build-result.json` when complete:
```json
{
  "status": "completed",
  "game_id": "NNN-slug",
  "description": "Brief description",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "tags": ["action", "puzzle", etc]
}
```

Build something you'd actually want to play. Take pride in it.
