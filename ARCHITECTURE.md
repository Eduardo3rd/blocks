# Tetris Effect Clone - Technical Architecture

A browser-based Tetris clone inspired by **Tetris Effect**, built with React, TypeScript, and modern web technologies. Features the signature Zone mechanic, neon aesthetics, and gamepad support.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Directory Structure](#directory-structure)
4. [Core Systems](#core-systems)
5. [State Management](#state-management)
6. [Rendering & Components](#rendering--components)
7. [Styling System](#styling-system)
8. [Input Handling](#input-handling)
9. [Game Mechanics](#game-mechanics)
10. [Performance Optimizations](#performance-optimizations)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | CSS Modules + Tailwind CSS |
| State | Custom hook with `useSyncExternalStore` + Zustand |
| Fonts | Press Start 2P (retro), Roboto Mono |

---

## Architecture Overview

The application follows a **clean separation between game logic and rendering**:

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI Layer                         │
│  (TetrisGame, GameBoard, GameStats, PiecePreview, etc.)    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ useSyncExternalStore
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   useGameEngine Hook                        │
│         (Bridges React ↔ Pure TypeScript Engine)           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Game Engine (Pure TS)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │GameEngine│ │  Board   │ │  Piece   │ │  Input   │       │
│  │ (State)  │ │(Collision│ │ (Shapes, │ │ Handler  │       │
│  │          │ │ Clearing)│ │ Rotation)│ │ (DAS/ARR)│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: The game engine is **pure TypeScript** with no React dependencies. This makes it testable, portable, and easy to reason about.

---

## Directory Structure

```
src/
├── engine/                 # Pure TypeScript game logic (no React)
│   ├── types.ts           # All type definitions, enums, constants
│   ├── GameEngine.ts      # Main game loop, state machine, events
│   ├── Board.ts           # Board ops, collision, line clearing, T-spin
│   ├── Piece.ts           # Tetromino shapes, colors, SRS rotation
│   ├── InputHandler.ts    # Keyboard & gamepad input with DAS/ARR
│   └── ZoneSystem.ts      # Zone mechanic encapsulation
│
├── hooks/
│   └── useGameEngine.ts   # React hook binding engine to UI
│
├── components/
│   ├── game/
│   │   └── TetrisGame.tsx # Main game container & layout
│   ├── Board/
│   │   ├── GameBoard.tsx  # Game board rendering with drop trail
│   │   └── GameBoard.module.css
│   └── HUD/
│       ├── GameStats.tsx  # Score, level, lines, Zone meter
│       ├── PiecePreview.tsx # Hold piece & next queue
│       └── *.module.css
│
├── styles/
│   ├── Mino.module.css    # Unified tetromino block styling
│   ├── theme.ts           # Theme tokens
│   └── tokens/            # Design tokens (colors, spacing, etc.)
│
├── systems/
│   ├── ScoringSystem.ts   # Score calculation utilities
│   ├── LevelSystem.ts     # Level progression
│   └── AudioSystem.ts     # Audio stub (future)
│
└── utils/                  # Shared utilities
```

---

## Core Systems

### GameEngine (`src/engine/GameEngine.ts`)

The central orchestrator. Manages:

- **Game state machine**: `idle` → `playing` → `paused` / `zoneActive` → `gameOver`
- **Game loop**: Called via `requestAnimationFrame`, applies gravity, lock delay
- **Event system**: Emits events (`pieceSpawned`, `linesCleared`, `zoneActivated`, etc.)
- **Input processing**: Converts `InputAction` into state changes

```typescript
// Key state interface
interface GameState {
  phase: GamePhase;
  board: Board;
  currentPiece: Tetromino | null;
  ghostY: number;
  holdPiece: TetrominoType | null;
  nextPieces: TetrominoType[];
  score: number;
  level: number;
  linesCleared: number;
  lock: LockState;
  combo: ComboState;
  zone: ZoneState;
}
```

### Board (`src/engine/Board.ts`)

Handles all board-level operations:

- **Collision detection**: `checkCollision()`, `isOnGround()`
- **Piece movement**: `movePiece()`, `rotatePiece()` with SRS wall kicks
- **Line clearing**: `findCompletedLines()`, `clearLines()`
- **Zone mechanics**: `zonePushLinesToBottom()`, `clearZoneLines()`
- **T-Spin detection**: 3-corner rule implementation
- **Ghost piece**: `getGhostY()` for drop preview

### Piece (`src/engine/Piece.ts`)

Defines tetromino data:

- **Shapes**: 4x4 grid definitions for each rotation state
- **Colors**: Neon color palette per piece type
- **SRS Wall Kicks**: Standard + I-piece kick tables
- **7-Bag Randomizer**: Ensures fair piece distribution

### Types (`src/engine/types.ts`)

Central type definitions:

```typescript
// Tetromino types
enum TetrominoType { I, O, T, S, Z, J, L }

// Board dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;  // 20 visible + 20 buffer
const VISIBLE_HEIGHT = 20;

// Clear types for scoring
type ClearType = 'single' | 'double' | 'triple' | 'tetris' 
              | 'tSpinSingle' | 'tSpinDouble' | 'tSpinTriple' | 'allClear' | ...
```

---

## State Management

### Primary: `useGameEngine` Hook

Uses React 18's `useSyncExternalStore` for efficient state sync:

```typescript
function useGameEngine(initialStage?: StageInfo): UseGameEngineReturn {
  // Engine runs independently
  const engineRef = useRef<GameEngine>(createGameEngine());
  
  // Only re-render when meaningful state changes
  const hasStateChanged = (state) => {
    // Compare: phase, score, level, piece position, etc.
    // Ignores: timer ticks, internal counters
  };
  
  // Game loop via requestAnimationFrame
  const gameLoop = (timestamp) => {
    engine.update(deltaTime);
    if (hasStateChanged(state)) {
      notifyListeners(); // Trigger React re-render
    }
  };
}
```

### Alternative: Zustand Store

Also available for more complex state needs:

```typescript
const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  state: null,
  initialize: () => { /* ... */ },
  start: () => { /* ... */ },
  handleInput: (action) => { /* ... */ },
}));
```

---

## Rendering & Components

### Component Hierarchy

```
TetrisGame
├── GameBoard (center)
│   ├── DropTrail (Zone mode only)
│   ├── BoardRow[] (memoized)
│   │   └── Mino / EmptyCell
│   └── PauseOverlay
├── Left Panel
│   ├── HoldPiece
│   ├── ZoneMeter (4 segments)
│   └── GameStats (score, level, lines)
└── Right Panel
    └── NextQueue (5 pieces)
```

### Memoization Strategy

All components use `React.memo` with carefully chosen dependencies:

```typescript
// Memoized single block
const Mino = memo<MinoProps>(({ color, isGhost, isCurrent }) => {
  // ...
});

// Memoized row - only re-renders when row data changes
const BoardRow = memo<RowProps>(({ y, rowData, currentPieceCells, ... }) => {
  // ...
});

// Board uses useMemo for computed values
const currentPieceCells = useMemo(() => {
  // Only recompute when piece position/rotation changes
}, [piece?.position.x, piece?.position.y, piece?.rotation, piece?.type]);
```

---

## Styling System

### CSS Architecture

1. **CSS Modules**: Scoped styles per component (`.module.css`)
2. **Shared Mino Styles**: `Mino.module.css` defines all block appearances
3. **CSS Custom Properties**: Easy theming and consistency

### Mino Styling (`Mino.module.css`)

All tetromino blocks share the same base style with state modifiers:

```css
/* Base block with 3D bevel and neon glow */
.mino.filled {
  box-shadow: 
    inset 2px 2px 4px var(--mino-highlight),
    inset -2px -2px 3px var(--mino-shadow),
    0 0 8px var(--mino-color),
    0 0 16px var(--mino-color);
}

/* State modifiers */
.mino.filled.current { /* Extra bright glow */ }
.mino.filled.locked { /* Slightly dimmer */ }
.mino.ghost { /* Dashed outline */ }

/* Size variants */
.mino.small { --mino-size: 14px; }
.mino.preview { --mino-size: 18px; }
```

### Visual Theme (Tetris Effect Aesthetic)

| Element | Style |
|---------|-------|
| Background | Deep space gradient with nebula effects and stars |
| Board Frame | Metallic 3D beveled border |
| Empty Cells | Very dark, semi-transparent |
| Filled Blocks | Neon glow with 3D bevel |
| Drop Trail | Vertical light beam (Zone mode only) |
| Zone Meter | 4-segment display with fill animations |

---

## Input Handling

### InputHandler (`src/engine/InputHandler.ts`)

Handles keyboard input with DAS/ARR:

```typescript
interface InputConfig {
  das: number;  // Delayed Auto Shift (167ms default)
  arr: number;  // Auto Repeat Rate (33ms default)
  sdf: number;  // Soft Drop Factor (20x)
}

// Key bindings
const DEFAULT_KEY_BINDINGS = {
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
  ArrowDown: 'softDrop',
  ArrowUp: 'hardDrop',    // Tetris Effect style
  KeyZ: 'rotateCCW',
  KeyX: 'rotateCW',
  KeyC: 'hold',
  KeyE: 'zone',
  Escape: 'pause',
};
```

### GamepadHandler

Full PS5 DualSense support with Tetris Effect mappings:

```typescript
// Button mappings (PS5 controller)
const buttonMappings = {
  0: 'rotateCCW',  // Cross
  1: 'rotateCW',   // Circle
  4: 'hold',       // L1
  5: 'hold',       // R1
  6: 'zone',       // L2
  7: 'zone',       // R2
  12: 'hardDrop',  // D-pad Up
  13: 'softDrop',  // D-pad Down
  14: 'moveLeft',  // D-pad Left
  15: 'moveRight', // D-pad Right
};
```

---

## Game Mechanics

### Implemented (Tetris Guideline + Tetris Effect)

| Mechanic | Description |
|----------|-------------|
| **SRS Rotation** | Super Rotation System with wall kicks |
| **7-Bag Randomizer** | Fair piece distribution |
| **Hold Piece** | Store piece for later |
| **Ghost Piece** | Drop preview |
| **Lock Delay** | 500ms with up to 15 move resets |
| **T-Spin Detection** | 3-corner rule, mini vs full |
| **Combos** | Consecutive line clears |
| **Back-to-Back** | Bonus for consecutive difficult clears |
| **Zone Mechanic** | Freeze time, stack lines at bottom |
| **DAS/ARR** | Smooth piece movement |

### Zone Mode (Signature Feature)

1. Fill meter by clearing lines (8% per line)
2. Activate with full meter (press E or L2/R2)
3. During Zone:
   - Gravity disabled
   - Timer counts down (15 seconds)
   - Cleared lines **stack at bottom** (don't disappear)
   - Drop trail visual effect active
4. Zone ends → all stacked lines clear at once
5. Scoring: Exponential bonus based on total lines (Decahexatris = 16 lines!)

---

## Performance Optimizations

### Engine Level

- **Direct state mutation** for hot paths (timer updates) to reduce GC pressure
- **Immutable updates** only for meaningful state changes

### React Level

- **`useSyncExternalStore`**: Only re-render when state actually changes
- **Throttled updates**: Zone timer only triggers re-render every 100ms
- **`React.memo`** on all components with proper dependency arrays
- **`useMemo`** for computed values (piece cells, ghost cells)

### CSS Level

- Removed expensive animations during Zone mode
- Simplified `box-shadow` intensities
- No `filter` effects on locked pieces

---

## Future Considerations

- **Audio System**: Web Audio API integration (stubs exist)
- **Journey Mode**: Stage progression with themes
- **Particle Effects**: Line clear celebrations
- **Leaderboards**: Online high scores
- **Replays**: Record and playback games

---

## Key Files for Reference

| File | Purpose |
|------|---------|
| `src/engine/types.ts` | All type definitions |
| `src/engine/GameEngine.ts` | Core game logic |
| `src/engine/Board.ts` | Board operations |
| `src/hooks/useGameEngine.ts` | React integration |
| `src/components/Board/GameBoard.tsx` | Main board render |
| `src/styles/Mino.module.css` | Block styling |
| `src/components/game/TetrisGame.module.css` | Layout & background |
