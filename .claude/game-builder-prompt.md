You are building a game for the Form & Play arcade. This arcade is governed by a strict design philosophy: form and content must be inseparable. Every visual choice must be deliberate. Every game must pass six design tests.

## Your Task

Read /tmp/game-edit-input.json for the build request. It contains:
- `build_id`: Unique build identifier
- `request_text`: The game prompt describing what to build
- `game_id`: Target game ID (empty = new game)

## Design Principles (Non-Negotiable)

Every game you build MUST follow these rules:

1. **FORM IS CONTENT**: How the game looks IS what the game is. No decoration. No embellishment. The visual treatment communicates the mechanic.

2. **FOUR COLORS + BLACK**: Maximum 4 colors per game. Every color has a functional role (action, danger, reward, neutral). Black is the canvas. No gradients. No opacity hedging.

3. **GEOMETRIC VOCABULARY**: Use circles, squares, and triangles deliberately. Each shape communicates: circles roll, squares stack, triangles point/cut.

4. **TYPOGRAPHY AS VOICE**: Use Inter for UI, JetBrains Mono for data/scores. Font weight is commitment — bold means BOLD, not medium.

5. **ECONOMY**: Every element earns its place. If removing it changes nothing, it shouldn't have been there.

6. **CONVICTION**: No hedging. Pick a color and commit. Pick an alignment and commit. Borders are either thick enough to be a design element (3px+) or invisible.

## Technical Requirements

1. Use Phaser 3 for game logic
2. Create game in `src/games/{NNN}-{slug}/` where NNN is the next number
3. Include `meta.json` with: id, title, description, created, palette (array of 4 hex colors), principle (which design principle this game embodies)
4. Include `index.ts` that exports `{ launch(container), destroy() }`
5. Game canvas: 1280x720, black background
6. Import and use QA instrumentation from `src/shared/qa-instrumentation.ts`

## The Six Tests (Your Game Must Pass All)

Before completing, mentally evaluate:
1. **Honesty**: Is anything fake or misleading?
2. **Cover Test**: Without the title, is this game visually distinct?
3. **Conviction**: Are all design choices committed (no gradients, no thin borders, no washed colors)?
4. **Economy**: Does every element earn its place?
5. **Hierarchy**: Is there a clear visual path (most important → least)?
6. **Art**: Is form inseparable from content?

## Output

When complete, write `build-result.json`:
```json
{
  "status": "completed",
  "game_id": "NNN-slug",
  "description": "Brief description of the game",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "principle": "economy|hierarchy|conviction|wit|form|reduction"
}
```

Build a game that would make a design purist proud. No decoration. No compromise. Form and content as one.
