import { keyframes } from 'styled-components';

export const animations = {
  piece: {
    enter: keyframes`
      from {
        transform: scale(0.8) rotate(-10deg);
        opacity: 0;
      }
      to {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    `,
    float: keyframes`
      0%, 100% { 
        transform: translateY(0px) rotate(0deg); 
      }
      50% { 
        transform: translateY(-3px) rotate(1deg); 
      }
    `,
    // ... animations from Figma
  }
}; 