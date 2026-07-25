import React from 'react';

const Loader = () => (
  <div style={styles.container}>
    <div style={styles.spinner}>
      <div style={styles.ring} />
      <div style={styles.dot} />
    </div>
    <style>{`
      @keyframes loaderSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes loaderPulse {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
      }
    `}</style>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '48px',
    height: '48px',
    position: 'relative',
  },
  ring: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '2px solid transparent',
    borderTopColor: 'var(--neon-cyan)',
    borderRightColor: 'rgba(0, 240, 255, 0.3)',
    animation: 'loaderSpin 1s linear infinite',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.15)',
  },
  dot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--neon-cyan)',
    transform: 'translate(-50%, -50%)',
    animation: 'loaderPulse 1s ease-in-out infinite',
    boxShadow: '0 0 10px var(--neon-cyan)',
  }
};

export default Loader;
