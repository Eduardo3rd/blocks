import React from 'react';
import { BlocksGame } from './components/game/BlocksGame';
import { MobileGame } from './components/mobile/MobileGame';
import { useMobileDetect } from './hooks/useMobileDetect';
import '@fontsource/press-start-2p';
import '@fontsource/roboto-mono';

const App: React.FC = () => {
  const { isMobile } = useMobileDetect();

  const handleGameOver = (score: number) => {
    console.log('Game over! Final score:', score);
    // Could trigger high score saving, analytics, etc.
  };

  // Render mobile GameBoy-style UI for mobile devices
  if (isMobile) {
    return <MobileGame onGameOver={handleGameOver} />;
  }

  // Render desktop UI for larger screens
  return <BlocksGame onGameOver={handleGameOver} />;
};

export default App;
