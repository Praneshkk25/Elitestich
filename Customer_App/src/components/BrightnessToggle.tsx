'use client';
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Permanently applies dimmed mode in light theme — no toggle needed
export default function BrightnessToggle() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('dimmed');
    } else {
      document.documentElement.classList.remove('dimmed');
    }
  }, [theme]);

  return null; // No button rendered
}
