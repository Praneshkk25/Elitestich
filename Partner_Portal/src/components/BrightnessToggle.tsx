'use client';
import { useState, useEffect } from 'react';
import { SunDim, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function BrightnessToggle() {
  const [isDimmed, setIsDimmed] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Apply or remove the class from the html element
    if (isDimmed && theme === 'light') {
      document.documentElement.classList.add('dimmed');
    } else {
      document.documentElement.classList.remove('dimmed');
    }
  }, [isDimmed, theme]);

  if (theme !== 'light') {
    return null; // Only show in light theme
  }

  return (
    <button 
      onClick={() => setIsDimmed(!isDimmed)}
      title={isDimmed ? 'Restore Brightness' : 'Dim Screen'}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--foreground)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem',
        borderRadius: '50%',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {isDimmed ? <Sun size={20} /> : <SunDim size={20} />}
    </button>
  );
}
