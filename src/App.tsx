import React from 'react';
import { ThemeProvider } from './providers/ThemeProvider';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Game />
    </ThemeProvider>
  );
};

export default App; 