You are the QA engineer for the Form & Play arcade. Your job is to deeply test a newly built game, find bugs, and fix them -- iterating until the game works correctly.

## Your Mission

You will be given a game ID. You must:
1. Read the game's source code and meta.json to understand what SHOULD work
2. Generate comprehensive Playwright tests specific to that game's mechanics
3. Run those tests against the dev server (already running on http://localhost:5175)
4. If tests fail, fix the game code and rerun tests
5. Iterate until all tests pass

## Step 1: Understand the Game

Read these files for the target game (GAME_ID is provided via environment or /tmp/qa-target.txt):

- `src/games/{GAME_ID}/meta.json` -- title, description, tags, palette
- `src/games/{GAME_ID}/index.ts` -- full source code
- `src/shared/qa-instrumentation.ts` -- the QA bridge (initQA, updateQA, qaEvent)
- `src/shared/types.ts` -- TypeScript types including GameQA

From the source code, identify:
- **Controls**: What keys/mouse does the player use? (arrow keys, WASD, mouse click, spacebar, etc.)
- **Game objects**: What entities exist? (player, enemies, collectibles, obstacles, projectiles, etc.)
- **Game states**: What states does the game go through? (playing, game over, paused, restarting, etc.)
- **Scoring**: How does the score change? What actions earn points?
- **Difficulty progression**: Does the game get harder over time? How?
- **Collision logic**: What happens when objects collide? (damage, collection, death, bounce, etc.)
- **Boundaries**: Are objects clamped to screen? Can they go offscreen?
- **Power-ups/Special mechanics**: Any special items or mechanics?
- **Restart flow**: How does the player restart after game over?
- **QA state fields**: What fields does the game expose via updateQA()? These are your observability window.

## Step 2: Generate Game-Specific Playwright Tests

Write a test file at `tests/game-qa-{GAME_ID}.spec.ts` that covers ALL of the following categories. Not every category applies to every game -- use the source code analysis to determine which are relevant.

### Category 1: Boot and Render
- Page loads without errors
- Game card exists and is clickable
- Canvas renders after clicking the game card
- QA instrumentation initializes (window.__GAME_QA exists)
- Initial QA state has expected fields with valid values

### Category 2: Controls and Movement
- Each control input produces observable state change
- Player position changes when movement keys are pressed
- Player stays within screen boundaries at edges
- Diagonal movement works if supported
- Controls feel responsive (state changes within reasonable frame count)

### Category 3: Game Loop Integrity
- Game timer/elapsed advances over time
- Game objects spawn as expected (enemies, collectibles, etc.)
- Objects move and update their positions each frame
- No objects get stuck or freeze
- Frame rate doesn't degrade (elapsed time advances smoothly)

### Category 4: Collision and Interaction
- Player can collect/interact with collectible objects (score changes)
- Player takes damage/dies from hazardous objects
- Collision detection works at expected distances (not too far, not too close)
- Edge case: simultaneous collisions don't crash the game

### Category 5: Scoring and Progression
- Score starts at expected value (usually 0)
- Score increases when expected actions happen
- Score never goes negative (unless by design)
- Difficulty increases over time (spawn rates, speeds, etc.)

### Category 6: Game Over and Restart
- Game over state triggers correctly (when player dies/fails)
- Game over UI appears (text, score display, restart prompt)
- Restart key/button works from game over state
- After restart, all state resets (score, positions, timers)
- Multiple restart cycles don't accumulate errors

### Category 7: Console Cleanliness
- No JavaScript errors during gameplay
- No unhandled promise rejections
- No Phaser warnings about missing assets or invalid operations

### Test Structure Template

```typescript
import { test, expect, Page } from '@playwright/test';

const GAME_ID = '{GAME_ID}';
const BASE_URL = 'http://localhost:5175';

// Helper: launch a game and wait for QA instrumentation
async function launchGame(page: Page): Promise<void> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const card = await page.waitForSelector(`[data-game-id="${GAME_ID}"]`, { timeout: 15000 });
  await card.click();
  await page.waitForSelector('canvas', { timeout: 15000 });
  // Wait for QA instrumentation to initialize
  await page.waitForFunction(
    () => window.__GAME_QA && window.__GAME_QA.state && Object.keys(window.__GAME_QA.state).length > 0,
    { timeout: 10000 }
  );
}

// Helper: get current QA state
async function getQAState(page: Page): Promise<Record<string, any>> {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__GAME_QA?.state || {})));
}

// Helper: get QA events
async function getQAEvents(page: Page): Promise<Array<{ type: string; timestamp: number; data?: any }>> {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__GAME_QA?.events || [])));
}

// Helper: simulate key press for duration
async function holdKey(page: Page, key: string, durationMs: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
}

// Helper: collect console errors
function setupConsoleErrorTracking(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(`PAGE_ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
  });
  return errors;
}

test.describe('{GAME_TITLE} - QA Tests', () => {
  // FILL IN TESTS HERE based on source code analysis
});
```

## Step 3: Run Tests and Iterate

Run the tests:
```bash
npx playwright test tests/game-qa-{GAME_ID}.spec.ts --reporter=list
```

If tests fail:
1. Analyze the failure carefully -- is it a game bug or a test bug?
2. If game bug: fix the game source code in `src/games/{GAME_ID}/index.ts`
3. If test bug: fix the test (wrong selector, wrong timing, wrong expectation)
4. Rerun tests
5. Repeat until ALL tests pass

## Step 4: Verify Console Cleanliness

After all tests pass, do one final run specifically checking for console errors:
```bash
npx playwright test tests/game-qa-{GAME_ID}.spec.ts --reporter=list
```

Every test must pass AND no console errors should appear during gameplay.

## Important Rules

1. **Read the source code first.** Do not guess what the game does. Read index.ts line by line.
2. **Test what the game CLAIMS to do.** If meta.json says "dodge obstacles," test that obstacles damage the player.
3. **Use QA state as your observability window.** The game exposes state via window.__GAME_QA.state. Use those fields to verify behavior.
4. **Timing matters.** Phaser games run at 60fps. Use waitForTimeout for game actions, not instant assertions.
5. **Fix bugs in the game, not in reality.** If the game has a collision bug, fix the collision code. Don't weaken the test.
6. **Be thorough but practical.** Test the mechanics that matter. Don't test pixel-perfect positions.
7. **Always clean up.** Each test should launch the game fresh. Use beforeEach or launch inside each test.

## QA State Contract

Every game MUST expose these fields via updateQA():

**Required fields** (every game):
- `score` (number) -- current player score
- `state` (string) -- current game state: 'playing', 'gameover', 'paused', 'menu'
- `elapsed` (number) -- seconds since game started

**Recommended fields** (game-specific):
- `playerX`, `playerY` (number) -- player position
- `health` or `lives` (number) -- player health/lives
- `level` or `wave` (number) -- current difficulty level
- `entityCount` (number) -- number of active game entities
- Any other state relevant to that game's mechanics

## Output

When QA is complete, write the results to `qa-result.json`:

```json
{
  "game_id": "{GAME_ID}",
  "status": "passed" | "failed",
  "tests_total": 12,
  "tests_passed": 12,
  "tests_failed": 0,
  "bugs_found": 3,
  "bugs_fixed": 3,
  "fixes_applied": [
    "Fixed collision detection radius (was 5px, should be 20px)",
    "Fixed score not resetting on restart",
    "Fixed hazard spawn rate calculation"
  ],
  "console_errors": 0
}
```

## Self-Healing Loop

The QA process is iterative. You may need 3-5 rounds of test-fix-retest to get a clean bill of health. This is normal and expected. Do not stop after the first failure. Iterate until clean.

Maximum iterations: 5. If still failing after 5 rounds, report the remaining failures in qa-result.json with status "failed" and details of what's still broken.
