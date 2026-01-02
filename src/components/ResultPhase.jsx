/**
 * RESULT PHASE - ULTRA MINIMAL
 * Just result, points, and next button
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

function ResultPhaseComponent({ resultData, isLastRound, onNext }) {
  if (!resultData) return null;

  return (
    <div style={{
      marginTop: '0.25rem',
      padding: '0.5rem',
      textAlign: 'center',
      background: resultData.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `2px solid ${resultData.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
      borderRadius: '6px'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        {resultData.correct ? '✓' : '✗'}
      </div>
      <div className="mono" style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: resultData.points >= 0 ? 'var(--correct)' : 'var(--incorrect)',
        marginBottom: '0.5rem'
      }}>
        {resultData.points >= 0 ? '+' : ''}{resultData.points}
      </div>
      <Button onClick={onNext} fullWidth>
        {isLastRound ? '📊 Results' : 'Next →'}
      </Button>
    </div>
  );
}

ResultPhaseComponent.propTypes = {
  resultData: PropTypes.shape({
    correct: PropTypes.bool.isRequired,
    points: PropTypes.number.isRequired
  }),
  isLastRound: PropTypes.bool.isRequired,
  onNext: PropTypes.func.isRequired
};

ResultPhaseComponent.defaultProps = {
  resultData: null
};

export const ResultPhase = memo(ResultPhaseComponent);
export default ResultPhase;
