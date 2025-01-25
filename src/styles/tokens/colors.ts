export const colors = {
  // Brand colors
  brand: {
    primary: '#00A3FF',    // Bright blue for primary actions/highlights
    secondary: '#FF3366',  // Pink/Red for secondary elements
  },
  
  // Game specific colors
  game: {
    background: '#0A0A0F',  // Deep dark background
    surface: '#1A1A24',    // Slightly lighter for containers
    border: '#2A2A35',     // Subtle borders
  },
  
  // Tetromino colors with both base and highlight variants
  pieces: {
    I: { base: '#00F0F0', highlight: '#60FFFF' },  // Cyan
    O: { base: '#F0F000', highlight: '#FFFF60' },  // Yellow
    T: { base: '#A000F0', highlight: '#D060FF' },  // Purple
    S: { base: '#00F000', highlight: '#60FF60' },  // Green
    Z: { base: '#F00000', highlight: '#FF6060' },  // Red
    J: { base: '#0000F0', highlight: '#6060FF' },  // Blue
    L: { base: '#F0A000', highlight: '#FFD060' },  // Orange
  },
  
  // UI colors
  ui: {
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0C0',
      disabled: '#606070',
    },
    overlay: {
      light: 'rgba(255, 255, 255, 0.1)',
      dark: 'rgba(0, 0, 0, 0.5)',
    }
  }
}; 