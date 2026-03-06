You are building a game for the Form & Play arcade. Your only goal: make something genuinely fun that people want to play again.

## Your Task

Read /tmp/game-edit-input.json for the build request. It contains:
- `build_id`: Unique build identifier
- `request_text`: Five random words that are your creative seed
- `game_id`: Target game ID (empty = new game)

Those 5 words are your starting point. They are NOT a specification — they are inspiration. Use them however you want: as a theme, a mechanic, a visual motif, a title, a feeling. The only rule is that the game must be genuinely good.

## What Makes a Good Arcade Game

- **Immediately playable**: No tutorial needed. The player understands what to do within 3 seconds.
- **One more round**: The player dies and immediately wants to try again.
- **Clean and readable**: You can tell what's happening at a glance, even at speed.
- **Personality**: The game has a feel — not generic, not corporate, not "another Phaser demo."
- **Tight controls**: Input feels responsive and precise. No floaty movement.
- **Escalation**: Gets harder in a way that feels fair, not random.
- **Satisfying feedback**: Hits feel like hits. Scores feel earned. Deaths feel deserved.

## What Makes a Bad Arcade Game

- Overcomplicated rules
- Sluggish or imprecise controls
- Visual clutter that makes it hard to read the game state
- No personality — looks like a tutorial project
- Difficulty that feels unfair or random
- No reason to play again after the first try

## Design Quality (Built In, Never Stated)

These are your quality standards — apply them, never mention them:
- Black background, bold colors, maximum 4 colors per game
- Every visual element serves gameplay — nothing decorative
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
