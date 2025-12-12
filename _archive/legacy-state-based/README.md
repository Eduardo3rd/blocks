# Legacy State-Based Implementation

This folder contains the original implementation of the Blocks game that used direct React state management (`useState`/`useReducer`) instead of the engine-based architecture.

## Why Archived

The codebase was refactored to use a cleaner separation between game logic and React rendering:

- **Old approach**: Game logic mixed with React state updates in component files
- **New approach**: Pure TypeScript `GameEngine` class with React binding via `useSyncExternalStore`

## When This Was Used

This code was the primary implementation before the engine-based refactor. The new implementation lives in:

- `src/engine/` - Pure TypeScript game engine
- `src/hooks/useGameEngine.ts` - React hook binding
- `src/components/game/BlocksGame.tsx` - Main game component

## Files in This Archive

### Components
- `Game.tsx` - Main game component with all state management inline
- `GameBoard.tsx` - Legacy board renderer
- `Game.css` - Styles for legacy Game component
- `game/Board/` - Legacy board components using styled-components
- `game/HeldPiece/` - Orphan CSS file (component was moved)

### Utils
- `gameLogic.ts` - Game logic functions (collision, rotation, scoring)
- `types.ts` - Type definitions for legacy state structure

## Key Differences

| Aspect | Legacy (This) | Current |
|--------|--------------|---------|
| State | `useState<GameState>` | `GameEngine` class |
| Game Loop | `setInterval` in component | `requestAnimationFrame` in engine |
| Input | Direct `setGameState` calls | `InputHandler` with DAS/ARR |
| Types | `Tetromino` with `shape` array | `Piece` with just `type` + `rotation` |
| Zone Mode | Not implemented | Full implementation |

## Note

This code is kept for historical reference. Do not import from these files - they are not maintained and may have breaking dependencies.

