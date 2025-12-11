// =============================================================================
// MOBILE DETECTION HOOK
// Auto-detect mobile devices for GameBoy-style UI
// =============================================================================

import { useState, useEffect } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTouchDevice: boolean;
  isPortrait: boolean;
}

/**
 * Hook to detect if the current device is mobile
 * Checks viewport width, touch capability, and orientation
 */
export function useMobileDetect(): MobileDetectResult {
  const [result, setResult] = useState<MobileDetectResult>(() => ({
    isMobile: false,
    isTouchDevice: false,
    isPortrait: true,
  }));

  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability
      const isTouchDevice = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;

      // Check viewport width (typical mobile breakpoint)
      const isSmallScreen = window.innerWidth <= 768;

      // Check user agent for mobile devices
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Check orientation
      const isPortrait = window.innerHeight > window.innerWidth;

      // Consider it mobile if it's a touch device with small screen OR mobile user agent
      const isMobile = (isTouchDevice && isSmallScreen) || mobileUserAgent;

      setResult({
        isMobile,
        isTouchDevice,
        isPortrait,
      });
    };

    // Initial check
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return result;
}

export default useMobileDetect;
