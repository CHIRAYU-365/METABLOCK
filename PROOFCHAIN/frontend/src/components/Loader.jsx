import React from 'react';

const Loader = () => {
  return (
    <div style={styles.container}>
      <div className="spinner"></div>
      <p style={styles.text}>Decrypting...</p>
      <style>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(168, 85, 247, 0.2);
          border-top: 4px solid var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    width: '100%',
  },
  text: {
    marginTop: '1.5rem',
    color: 'var(--text-secondary)',
    letterSpacing: '2px',
    fontSize: '0.9rem',
    fontWeight: '500',
    animation: 'pulse 2s infinite',
  }
};

export default Loader;
