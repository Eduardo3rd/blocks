# Original Project Brief

> **Note**: This was the original project specification from early development. The actual implementation evolved significantly beyond this brief, particularly with:
> - React DOM rendering instead of HTML5 Canvas
> - Tetris Effect-inspired Zone mechanic
> - Full gamepad support
> - Mobile GameBoy-style UI
> - Web Audio synthesized sound effects
> - Online leaderboard via Supabase
> - Engine-based architecture (see `src/engine/`)

---

## Project Overview
Create a modern web-based Tetris clone that faithfully reproduces the core gameplay mechanics of the classic game while adding modern features and a polished user interface.

## Technical Requirements

### Frontend Stack
- React 18+ for UI components
- HTML5 Canvas for game rendering
- TypeScript for type safety and better code organization
- Tailwind CSS for styling UI components

### Core Game Features
1. Game Board
   - 10x20 grid (standard Tetris dimensions)
   - Rendered using HTML5 Canvas
   - Clear visual distinction between active piece and placed blocks

2. Tetromino Pieces
   - All 7 standard shapes (I, O, T, S, Z, J, L)
   - Random piece generation using bag randomization
   - Ghost piece showing where the active piece will land
   - Preview of next piece(s)
   - Hold piece functionality

3. Game Mechanics
   - Standard piece rotation (Super Rotation System)
   - Wall kicks for rotation near boundaries
   - Soft drop (faster descent)
   - Hard drop (instant placement)
   - Line clear detection and animation
   - Basic collision detection
   - Progressive difficulty (increasing speed)

4. Scoring System
   - Points for line clears (single, double, triple, tetris)
   - Additional points for T-spins
   - Combo system for consecutive line clears
   - Level progression based on lines cleared

5. Controls
   - Keyboard input handling
   - Left/Right: Move piece
   - Up: Rotate clockwise
   - Z: Rotate counterclockwise
   - Down: Soft drop
   - Space: Hard drop
   - C: Hold piece
   - P: Pause game
   - Optional touch controls for mobile

### UI/UX Requirements
1. Game Interface
   - Clean, modern design
   - Responsive layout
   - Clear visibility of:
     - Current score
     - Level
     - Lines cleared
     - Next piece preview
     - Hold piece
     - Game over state

2. Menus and Screens
   - Start screen with game options
   - Pause menu
   - Game over screen with final score
   - High score display
   - Basic settings (music, SFX volume)

3. Visual Effects
   - Line clear animation
   - Piece locking animation
   - Level up indication
   - Score popup for special moves

4. Audio
   - Background music
   - Sound effects for:
     - Piece movement
     - Rotation
     - Line clear
     - Game over

### Technical Implementation Details

1. Game Loop
```typescript
interface GameState {
  board: number[][];
  currentPiece: Tetromino;
  nextPieces: Tetromino[];
  holdPiece: Tetromino | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
}

interface Tetromino {
  shape: number[][];
  position: { x: number; y: number };
  type: TetrominoType;
}

enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L'
}
```

2. Project Structure
```
src/
├── components/
│   ├── Game.tsx
│   ├── GameBoard.tsx
│   ├── NextPiece.tsx
│   ├── HoldPiece.tsx
│   ├── ScoreBoard.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── Menu.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useGameLoop.ts
│   ├── useControls.ts
│   └── useAudio.ts
├── logic/
│   ├── gameState.ts
│   ├── pieces.ts
│   ├── collision.ts
│   ├── rotation.ts
│   └── scoring.ts
└── utils/
    ├── constants.ts
    ├── types.ts
    └── helpers.ts
```

## Development Phases

1. Phase 1: Core Mechanics
   - Basic game board rendering
   - Piece movement and rotation
   - Collision detection
   - Line clearing

2. Phase 2: Game Features
   - Scoring system
   - Level progression
   - Hold piece
   - Next piece preview
   - Ghost piece

3. Phase 3: UI/UX
   - Menu systems
   - Visual effects
   - Audio implementation
   - Mobile responsiveness

4. Phase 4: Polish
   - Bug fixes
   - Performance optimization
   - Additional features
   - Testing and refinement

## Testing Requirements
- Unit tests for game logic
- Integration tests for game state management
- Performance testing for smooth gameplay
- Cross-browser compatibility
- Mobile device testing

## Performance Targets
- 60 FPS gameplay
- < 16ms input latency
- Smooth animations
- Efficient memory usage
- Fast initial load time (< 2s)

## Accessibility Considerations
- Keyboard controls remapping
- High contrast mode
- Screen reader support for menus
- Colorblind-friendly piece colors
- Adjustable game speed

This brief provides a foundation for creating a modern, polished Tetris clone. The implementation should focus on code quality, performance, and user experience while maintaining the classic Tetris gameplay that players expect.

