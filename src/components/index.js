/**
 * Component exports
 */

export { ErrorBoundary } from './ErrorBoundary';
export { Header } from './Header';
export { Button } from './Button';
export { ClaimCard } from './ClaimCard';
export { ConfidenceSelector } from './ConfidenceSelector';
export { VerdictSelector } from './VerdictSelector';
export { PredictionModal } from './PredictionModal';
// Note: SetupScreen, PlayingScreen, DebriefScreen, TeacherDashboard are lazy-loaded in App.jsx
// Do not export them here to enable proper code splitting
export { ScrollingLeaderboard } from './ScrollingLeaderboard';
export { SoloStatsView } from './SoloStatsView';
export { ClaimSubmissionForm } from './ClaimSubmissionForm';
export { StudentClaimNotifications } from './StudentClaimNotifications';
export { LiveClassLeaderboard } from './LiveClassLeaderboard';
