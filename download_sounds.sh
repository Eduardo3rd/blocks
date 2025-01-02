#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p sounds

# Download sound files from direct sources
curl -o sounds/move.wav "https://opengameart.org/sites/default/files/click4.wav"
curl -o sounds/rotate.wav "https://opengameart.org/sites/default/files/click5.wav"
curl -o sounds/drop.wav "https://opengameart.org/sites/default/files/hit2.wav"
curl -o sounds/clear.wav "https://opengameart.org/sites/default/files/powerup2.wav"
curl -o sounds/tetris.wav "https://opengameart.org/sites/default/files/powerup3.wav"
curl -o sounds/levelup.wav "https://opengameart.org/sites/default/files/levelup.wav"
curl -o sounds/gameover.wav "https://opengameart.org/sites/default/files/gameover.wav"
curl -o sounds/bgm.mp3 "https://opengameart.org/sites/default/files/puzzle-game-4.mp3"

# Verify downloads
echo "Verifying downloads..."
for file in sounds/*.{wav,mp3}; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ Failed to download $file"
    fi
done