import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    initialized: true,
    submitClaim: vi.fn(),
  }
}));

vi.mock('../services/offlineQueue', () => ({
  OfflineQueue: {
    enqueue: vi.fn(),
  }
}));

vi.mock('../services/playerProfile', () => ({
  PlayerProfile: {
    get: vi.fn(() => ({ playerName: 'TestPlayer', avatar: { emoji: '🦊' } }))
  }
}));

vi.mock('../data/constants', () => ({
  SUBJECT_HINTS: {
    Biology: ['hint'],
    History: ['hint'],
    Science: ['hint']
  }
}));

vi.mock('../utils/sanitize', () => ({
  sanitizeUserContent: (text) => text
}));

import { ClaimSubmissionForm } from './ClaimSubmissionForm';
import { FirebaseBackend } from '../services/firebase';
import { OfflineQueue } from '../services/offlineQueue';

describe('ClaimSubmissionForm', () => {
  const onClose = vi.fn();
  const onSubmitSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  it('renders the form with all fields', () => {
    render(<ClaimSubmissionForm onClose={onClose} />);
    expect(screen.getByText('Submit a Claim')).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Claim Statement/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Explanation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Difficulty/)).toBeInTheDocument();
  });

  it('shows submitter info from player profile', () => {
    render(<ClaimSubmissionForm onClose={onClose} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });

  it('shows TRUE/FALSE/MIXED answer buttons', () => {
    render(<ClaimSubmissionForm onClose={onClose} />);
    expect(screen.getByText(/✓ TRUE/)).toBeInTheDocument();
    expect(screen.getByText(/✗ FALSE/)).toBeInTheDocument();
    expect(screen.getByText(/⚡ MIXED/)).toBeInTheDocument();
  });

  it('validates empty claim text', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);

    // Fill explanation but leave claim text empty
    await user.type(screen.getByLabelText(/Explanation/), 'Some explanation');
    await user.click(screen.getByText('Submit for Review'));

    expect(screen.getByText(/Please enter your claim text/)).toBeInTheDocument();
  });

  it('validates short claim text', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'Too short');
    await user.type(screen.getByLabelText(/Explanation/), 'Some explanation');
    await user.click(screen.getByText('Submit for Review'));

    expect(screen.getByText(/at least 20 characters/)).toBeInTheDocument();
  });

  it('validates empty explanation', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a claim that is long enough to pass validation');
    await user.click(screen.getByText('Submit for Review'));

    expect(screen.getByText(/Please explain/)).toBeInTheDocument();
  });

  it('submits successfully online', async () => {
    const user = userEvent.setup();
    FirebaseBackend.submitClaim.mockResolvedValue({ success: true });

    render(<ClaimSubmissionForm onClose={onClose} onSubmitSuccess={onSubmitSuccess} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a valid claim that is long enough');
    await user.type(screen.getByLabelText(/Explanation/), 'Here is why this claim matters');
    await user.click(screen.getByText('Submit for Review'));

    expect(await screen.findByText('Claim Submitted!')).toBeInTheDocument();
    expect(onSubmitSuccess).toHaveBeenCalled();
  });

  it('queues offline when not online', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    render(<ClaimSubmissionForm onClose={onClose} onSubmitSuccess={onSubmitSuccess} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a valid claim that is long enough');
    await user.type(screen.getByLabelText(/Explanation/), 'Here is why this claim matters');
    await user.click(screen.getByText('Submit for Review'));

    expect(await screen.findByText('Claim Saved!')).toBeInTheDocument();
    expect(OfflineQueue.enqueue).toHaveBeenCalledWith('claim', expect.any(Object));
  });

  it('queues on Firebase error', async () => {
    const user = userEvent.setup();
    FirebaseBackend.submitClaim.mockRejectedValue(new Error('Network error'));

    render(<ClaimSubmissionForm onClose={onClose} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a valid claim that is long enough');
    await user.type(screen.getByLabelText(/Explanation/), 'Here is why this claim matters');
    await user.click(screen.getByText('Submit for Review'));

    expect(await screen.findByText('Claim Saved!')).toBeInTheDocument();
    expect(OfflineQueue.enqueue).toHaveBeenCalled();
  });

  it('calls onClose from success view', async () => {
    const user = userEvent.setup();
    FirebaseBackend.submitClaim.mockResolvedValue({ success: true });

    render(<ClaimSubmissionForm onClose={onClose} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a valid claim that is long enough');
    await user.type(screen.getByLabelText(/Explanation/), 'Here is why this claim matters');
    await user.click(screen.getByText('Submit for Review'));

    await screen.findByText('Claim Submitted!');
    await user.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose from cancel button', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);
    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error pattern selector for FALSE claims', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);
    await user.click(screen.getByText(/✗ FALSE/));
    expect(screen.getByLabelText(/Error Type/)).toBeInTheDocument();
  });

  it('hides error pattern selector for TRUE claims', () => {
    render(<ClaimSubmissionForm onClose={onClose} />);
    expect(screen.queryByLabelText(/Error Type/)).not.toBeInTheDocument();
  });

  it('shows MIXED hint text when MIXED selected', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);
    await user.click(screen.getByText(/⚡ MIXED/));
    expect(screen.getByText(/both true and false/)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    let resolveSubmit;
    FirebaseBackend.submitClaim.mockReturnValue(new Promise(r => { resolveSubmit = r; }));

    render(<ClaimSubmissionForm onClose={onClose} />);

    await user.type(screen.getByLabelText(/Your Claim Statement/), 'This is a valid claim that is long enough');
    await user.type(screen.getByLabelText(/Explanation/), 'Here is why this claim matters');
    await user.click(screen.getByText('Submit for Review'));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByText('Submitting...').closest('button')).toBeDisabled();

    resolveSubmit({ success: true });
  });

  it('shows character count for claim text', async () => {
    const user = userEvent.setup();
    render(<ClaimSubmissionForm onClose={onClose} />);
    await user.type(screen.getByLabelText(/Your Claim Statement/), 'Hello');
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});
