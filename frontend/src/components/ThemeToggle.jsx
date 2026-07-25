import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ showLabel = true, style = {} }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="btn-outline"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={18} color="var(--neon-amber)" />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={18} color="var(--neon-violet)" />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
