export const effects = {
  shadows: {
    piece: '0 2px 4px rgba(0, 0, 0, 0.3)',
    container: '0 4px 6px rgba(0, 0, 0, 0.2)',
    elevated: '0 8px 16px rgba(0, 0, 0, 0.4)',
  },
  
  gradients: {
    piece: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    surface: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
    glow: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
  },
  
  animations: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
}; 