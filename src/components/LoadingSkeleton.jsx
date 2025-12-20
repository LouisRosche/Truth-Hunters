/**
 * LOADING SKELETON
 * S-tier UX: Shows content structure while loading
 * Better perceived performance than spinners
 */

import PropTypes from 'prop-types';

export function LoadingSkeleton({ type = 'claim' }) {
  const shimmer = `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .skeleton {
      animation: shimmer 2s infinite linear;
      background: linear-gradient(
        90deg,
        var(--bg-elevated) 0%,
        var(--border) 50%,
        var(--bg-elevated) 100%
      );
      background-size: 1000px 100%;
    }
  `;

  if (type === 'claim') {
    return (
      <>
        <style>{shimmer}</style>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          {/* Subject badge skeleton */}
          <div className="skeleton" style={{
            width: '80px',
            height: '20px',
            borderRadius: '4px',
            marginBottom: '0.75rem'
          }} />

          {/* Claim text skeleton */}
          <div className="skeleton" style={{
            width: '100%',
            height: '16px',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }} />
          <div className="skeleton" style={{
            width: '90%',
            height: '16px',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }} />
          <div className="skeleton" style={{
            width: '70%',
            height: '16px',
            borderRadius: '4px'
          }} />
        </div>
      </>
    );
  }

  if (type === 'leaderboard') {
    return (
      <>
        <style>{shimmer}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div className="skeleton" style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%'
              }} />
              <div className="skeleton" style={{
                flex: 1,
                height: '16px',
                borderRadius: '4px'
              }} />
              <div className="skeleton" style={{
                width: '40px',
                height: '16px',
                borderRadius: '4px'
              }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (type === 'stats') {
    return (
      <>
        <style>{shimmer}</style>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div className="skeleton" style={{
                width: '60px',
                height: '32px',
                borderRadius: '4px',
                margin: '0 auto 0.5rem'
              }} />
              <div className="skeleton" style={{
                width: '80px',
                height: '12px',
                borderRadius: '4px',
                margin: '0 auto'
              }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  // Default generic skeleton
  return (
    <>
      <style>{shimmer}</style>
      <div className="skeleton" style={{
        width: '100%',
        height: '100px',
        borderRadius: '8px'
      }} />
    </>
  );
}

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['claim', 'leaderboard', 'stats', 'generic'])
};
