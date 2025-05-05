import { useEffect, useState } from 'react';

// Define breakpoints
const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export function useScreenSize(): ScreenSize {
  const getSize = () => {
    if (typeof window === 'undefined') return 'desktop'; // SSR default
    const width = window.innerWidth;
    if (width <= MOBILE_MAX) return 'mobile';
    if (width <= TABLET_MAX) return 'tablet';
    return 'desktop';
  };

  const [screen, setScreen] = useState<ScreenSize>(getSize);

  useEffect(() => {
    const handleResize = () => setScreen(getSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screen;
} 