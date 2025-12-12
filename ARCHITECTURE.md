# Blocks - Technical Architecture

A browser-based block puzzle game built with React, TypeScript, and modern web technologies. Features the Zone mechanic, neon aesthetics, synthesized audio, and full gamepad support.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Directory Structure](#directory-structure)
4. [Core Systems](#core-systems)
5. [State Management](#state-management)
6. [Rendering & Components](#rendering--components)
7. [Input Handling](#input-handling)
8. [Audio System](#audio-system)
9. [Game Mechanics](#game-mechanics)
10. [Mobile Support](#mobile-support)
11. [Performance Optimizations](#performance-optimizations)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | CSS Modules + Tailwind CSS |
| State | Custom hook with `useSyncExternalStore` |
| Audio | Web Audio API (synthesized) |
| Backend | Supabase (leaderboard) |
| Fonts | Press Start 2P, Roboto Mono |

---

## Architecture Overview

The application follows a **clean separation between game logic and rendering**:

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI Layer                         │
│  (BlocksGame, GameBoard, GameStats, MobileGame, etc.)      │
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
│  ┌──────────┐ ┌──────────┐                                  │
│  │  Zone    │ │ Particle │                                  │
│  │  System  │ │  System  │                                  │
│  └──────────┘ └──────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: The game engine is **pure TypeScript** with no React dependencies. This makes it testable, portable, and easy to reason about.

---

## Directory Structure

```
src/
├── engine/                    # Pure TypeScript game logic (no React)
│   ├── types.ts              # All type definitions, enums, constants
│   ├── GameEngine.ts         # Main game loop, state machine, events
│   ├── Board.ts              # Board ops, collision, line clearing, T-spin
│   ├── Piece.ts              # Piece shapes, colors, SRS rotation
│   ├── InputHandler.ts       # Keyboard & gamepad input with DAS/ARR
│   ├── ZoneSystem.ts         # Zone mechanic encapsulation
│   └── ParticleSystem.ts     # Visual effects system
│
├── hooks/
│   ├── useGameEngine.ts      # React hook binding engine to UI
│   ├── useMobileDetect.ts    # Device detection for mobile UI
│   └── useParticles.ts       # Particle effect hook
│
├── components/
│   ├── Board/
│   │   └── GameBoard.tsx     # Main game board rendering
│   ├── HUD/
│   │   ├── GameStats.tsx     # Score, level, lines, Zone meter
│   │   └── PiecePreview.tsx  # Hold piece & next queue
│   ├── game/
│   │   ├── BlocksGame.tsx    # Main desktop game container
│   │   ├── CurrentHighScore/ # Live high score display
│   │   ├── GameOverModal/    # Score submission modal
│   │   ├── HighScores/       # Leaderboard display
│   │   ├── HoldArea/         # Hold piece display
│   │   ├── NextPiece/        # Next piece queue
│   │   ├── Settings/         # DAS/ARR configuration
│   │   ├── StartScreen/      # Title screen with controls
│   │   └── Stats/            # In-game statistics
│   ├── mobile/
│   │   ├── MobileGame.tsx    # GameBoy-style mobile UI
│   │   └── controls/         # Touch D-pad and buttons
│   └── common/
│       └── ErrorBoundary.tsx # Error handling wrapper
│
├── systems/
│   ├── AudioSystem.ts        # Web Audio API synthesized SFX
│   ├── ScoringSystem.ts      # Score calculation utilities
│   └── LevelSystem.ts        # Level progression
│
├── styles/
│   ├── Mino.module.css       # Unified block styling
│   ├── theme.ts              # Theme tokens
│   └── tokens/               # Design tokens (colors, spacing, etc.)
│
└── utils/
    ├── constants.ts          # Game constants (shapes, colors, speeds)
    ├── highScores.ts         # Supabase leaderboard integration
    ├── keyBindingsStorage.ts # Persist custom key bindings
    └── gamepadControls.ts    # Gamepad state management
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
interface GameState {
  phase: GamePhase;
  board: Board;
  currentPiece: Piece | null;
  ghostY: number;
  holdPiece: PieceType | null;
  nextPieces: PieceType[];
  score: number;
  level: number;
  linesCleared: number;
  lock: LockState;
  combo: ComboState;
  zone: ZoneState;
  lastClear: ClearType | null;
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

Defines piece data:

- **Shapes**: 4x4 grid definitions for each rotation state
- **Colors**: Neon color palette per piece type
- **SRS Wall Kicks**: Standard + I-piece kick tables
- **7-Bag Randomizer**: Ensures fair piece distribution

### InputHandler (`src/engine/InputHandler.ts`)

Handles keyboard and gamepad input with professional-grade timing:

```typescript
interface InputConfig {
  das: number;  // Delayed Auto Shift (167ms default)
  arr: number;  // Auto Repeat Rate (33ms default)
  sdf: number;  // Soft Drop Factor (20x)
}
```

---

## State Management

### `useGameEngine` Hook (`src/hooks/useGameEngine.ts`)

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

**Why this pattern?**

1. **No React in engine**: Game logic is pure TypeScript, testable without React
2. **Selective re-renders**: Only update React when meaningful state changes
3. **60 FPS game loop**: Engine updates independently of React render cycle
4. **Event-driven audio**: Audio system subscribes to game events

---

## Rendering & Components

### Component Hierarchy

```
App
├── BlocksGame (desktop)                    # or MobileGame (mobile)
│   ├── GameBoard (center)
│   │   ├── Grid cells (memoized rows)
│   │   ├── Ghost piece
│   │   └── Current piece
│   ├── Left Panel
│   │   ├── HoldPiece
│   │   ├── ZoneMeter
│   │   └── GameStats
│   └── Right Panel
│       ├── NextQueue (5 pieces)
│       └── CurrentHighScore
│
└── MobileGame (phones)
    ├── Compact GameBoard
    ├── GameBoy-style controls
    │   ├── D-Pad
    │   └── ABXY buttons
    └── System buttons (pause, zone)
```

### Memoization Strategy

All components use `React.memo` with carefully chosen dependencies to minimize re-renders:

- **Board rows**: Only re-render when row data changes
- **Preview pieces**: Memoized by piece type
- **Stats**: Only re-render when values change

---

## Input Handling

### Keyboard Controls

| Action | Default Keys |
|--------|-------------|
| Move Left/Right | ← → |
| Soft Drop | ↓ |
| Hard Drop | Space |
| Rotate CW | ↑ or X |
| Rotate CCW | Z |
| Rotate 180° | A |
| Hold | C or Shift |
| Zone | E |
| Pause | Escape |

### Gamepad Support

Full PS5 DualSense / Xbox controller support:

```typescript
const buttonMappings = {
  0: 'rotateCCW',  // Cross / A
  1: 'rotateCW',   // Circle / B
  4: 'hold',       // L1 / LB
  5: 'hold',       // R1 / RB
  6: 'zone',       // L2 / LT
  7: 'zone',       // R2 / RT
  12: 'hardDrop',  // D-pad Up
  13: 'softDrop',  // D-pad Down
  14: 'moveLeft',  // D-pad Left
  15: 'moveRight', // D-pad Right
};
```

---

## Audio System

The audio system (`src/systems/AudioSystem.ts`) uses the **Web Audio API** for synthesized sound effects:

### Features

- **Quantized tones**: Musical notes from C Major Pentatonic scale
- **Procedural SFX**: All sounds generated programmatically (no audio files for SFX)
- **Zone mode effect**: Low-pass filter for "underwater" audio effect
- **Event-driven**: Subscribes to game events via `useGameAudio` hook

### Sound Types

| Event | Sound |
|-------|-------|
| Rotate | Cycling scale notes |
| Move | Short quantized tone |
| Hard Drop | Low thud + noise burst |
| Line Clear | Ascending arpeggio |
| Quad | Triumphant chord |
| Zone Activate | High sustained tone |

---

## Game Mechanics

### Implemented Features

| Mechanic | Description |
|----------|-------------|
| **SRS Rotation** | Super Rotation System with wall kicks |
| **7-Bag Randomizer** | Fair piece distribution |
| **Hold Piece** | Store piece for later (once per piece) |
| **Ghost Piece** | Drop preview |
| **Lock Delay** | 500ms with up to 15 move/rotate resets |
| **T-Spin Detection** | 3-corner rule, mini vs full |
| **Combos** | Consecutive line clears |
| **Back-to-Back** | 1.5x bonus for consecutive difficult clears |
| **Perfect Clear** | Bonus for clearing entire board |
| **Zone Mechanic** | Freeze time, stack lines at bottom |
| **DAS/ARR** | Configurable delayed auto-shift |

### Zone Mode (Signature Feature)

1. Fill meter by clearing lines (25% per line)
2. Activate with full meter (press E or L2/R2)
3. During Zone:
   - Gravity disabled
   - Timer counts down (up to 20 seconds based on fill)
   - Cleared lines **stack at bottom** (don't disappear)
   - Each cleared line extends zone time
4. Zone ends → all stacked lines clear at once
5. Scoring: Exponential bonus based on total lines

| Zone Clear | Lines | Base Score |
|------------|-------|------------|
| Sexdeca | 16+ | 26,000 |
| Dodeca | 12-15 | 18,000 |
| Octo | 8-11 | 10,000 |

---

## Mobile Support

### Device Detection

`useMobileDetect` hook checks viewport width and touch capability to render the appropriate UI:

- **Desktop**: Full BlocksGame with keyboard/gamepad
- **Mobile**: GameBoy-inspired MobileGame with touch controls

### Touch Controls

GameBoy-style control layout:

- **D-Pad**: Left side for movement (swipe gestures)
- **ABXY Buttons**: Right side for rotation
- **System Buttons**: Top for pause, zone, hold

---

## Performance Optimizations

### Engine Level

- **Direct state mutation** for hot paths (timer updates) to reduce GC pressure
- **Primitive comparisons** in state change detection (no string concatenation)
- **Lazy board comparisons**: Only check board when lines are cleared

### React Level

- **`useSyncExternalStore`**: Only re-render when state actually changes
- **Throttled zone timer**: Visual updates every 100ms, not every frame
- **`React.memo`** on all components with proper dependency arrays
- **`useMemo`** for computed values (piece cells, ghost position)

### Audio Level

- **Non-blocking context resume**: Fire-and-forget for audio context
- **Efficient oscillator creation**: Minimal node graph per sound
- **No audio file loading**: All SFX synthesized on demand

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/engine/types.ts` | All type definitions |
| `src/engine/GameEngine.ts` | Core game logic & state machine |
| `src/engine/Board.ts` | Board operations & collision |
| `src/engine/Piece.ts` | Piece data & 7-bag |
| `src/hooks/useGameEngine.ts` | React integration |
| `src/components/game/BlocksGame.tsx` | Desktop game container |
| `src/components/mobile/MobileGame.tsx` | Mobile game container |
| `src/components/Board/GameBoard.tsx` | Main board render |
| `src/systems/AudioSystem.ts` | Web Audio SFX |
| `src/styles/Mino.module.css` | Block styling |
