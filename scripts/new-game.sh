#!/bin/bash
# Create a new game from the template
set -e

if [ -z "$1" ]; then
  echo "Usage: npm run new-game -- <game-id>"
  echo "Example: npm run new-game -- 001-circle-chase"
  exit 1
fi

GAME_ID="$1"
GAME_DIR="src/games/$GAME_ID"

if [ -d "$GAME_DIR" ]; then
  echo "Error: Game directory $GAME_DIR already exists"
  exit 1
fi

cp -r src/games/_template "$GAME_DIR"

# Update meta.json with the new game ID and today's date
DATE=$(date +%Y-%m-%d)
sed -i '' "s/_template/$GAME_ID/g" "$GAME_DIR/meta.json"
sed -i '' "s/2026-01-01/$DATE/g" "$GAME_DIR/meta.json"
sed -i '' "s/Template Game/$GAME_ID/g" "$GAME_DIR/meta.json"

echo "Created new game: $GAME_DIR"
echo "Edit $GAME_DIR/meta.json to set title, description, and palette"
