import React from 'react';
import { TetrisGame } from './components/game/TetrisGame';
import '@fontsource/press-start-2p';
import '@fontsource/roboto-mono';

const App: React.FC = () => {
  const handleGameOver = (score: number) => {
    console.log('Game over! Final score:', score);
    // Could trigger high score saving, analytics, etc.
  };

  return (
    <TetrisGame onGameOver={handleGameOver} />
  );
};

export default App; 