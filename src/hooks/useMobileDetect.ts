// =============================================================================
// MOBILE DETECTION HOOK
// Auto-detect mobile devices for mobile UI
// =============================================================================

import { useState, useEffect } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTouchDevice: boolean;
  isPortrait: boolean;
}

/**
 * Check if the current device is mobile (can be called outside React)
 */
function checkMobileDevice(): MobileDetectResult {
  // SSR safety
  if (typeof window === 'undefined') {
    return { isMobile: false, isTouchDevice: false, isPortrait: true };
  }

  // Check for touch capability
  const isTouchDevice = 
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;

  // Check viewport width (typical mobile breakpoint)
  const isSmallScreen = window.innerWidth <= 768;

  // Check orientation
  const isPortrait = window.innerHeight > window.innerWidth;

  // Check user agent for mobile devices
  // Includes: iPhone, iPad, iPod, Android, and various mobile browsers
  const ua = navigator.userAgent;
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);

  // Special case: iPad with "Request Desktop Site" enabled reports as Macintosh
  // Detect it by checking for Macintosh + touch support
  const isIPadDesktopMode = /Macintosh/i.test(ua) && isTouchDevice;

  // Consider it mobile if:
  // 1. Touch device with small screen, OR
  // 2. Mobile user agent detected, OR
  // 3. iPad in desktop mode
  const isMobile = (isTouchDevice && isSmallScreen) || mobileUserAgent || isIPadDesktopMode;

  return {
    isMobile,
    isTouchDevice,
    isPortrait,
  };
}

/**
 * Hook to detect if the current device is mobile
 * Checks viewport width, touch capability, and user agent
 */
export function useMobileDetect(): MobileDetectResult {
  // Initialize with actual check (not false) to prevent flash of wrong UI
  const [result, setResult] = useState<MobileDetectResult>(checkMobileDevice);

  useEffect(() => {
    const handleChange = () => {
      setResult(checkMobileDevice());
    };

    // Listen for resize and orientation changes
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return result;
}

export default useMobileDetect;
