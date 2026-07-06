import React from 'react';

const Loader = () => {
  return (
    <div style={styles.container}>
      <img src="/logo.png" alt="Decrypting..." className="technical-logo" />
      <p style={styles.text}>Decrypting Data...</p>
      <style>{`
        .technical-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          animation: pulseAndGlow 2s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5));
        }
        @keyframes pulseAndGlow {
          0% {
            transform: scale(0.95);
            filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.3));
          }
          100% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.8));
          }
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
