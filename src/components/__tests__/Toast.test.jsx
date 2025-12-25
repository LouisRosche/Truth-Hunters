/**
 * Toast Component Tests
 * Tests for toast notification system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('ToastProvider', () => {
    it('renders children without toasts', () => {
      render(
        <ToastProvider>
          <div>Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      function TestComponent() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('Test')}>Show Toast</button>;
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Show Toast')).toBeInTheDocument();
    });
  });

  describe('useToast hook', () => {
    it('throws error when used outside ToastProvider', () => {
      function BadComponent() {
        useToast();
        return null;
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<BadComponent />)).toThrow(
        'useToast must be used within a ToastProvider'
      );

      consoleSpy.mockRestore();
    });

    it('provides showToast and dismissToast functions', () => {
      let toastContext;

      function TestComponent() {
        toastContext = useToast();
        return null;
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(toastContext).toHaveProperty('showToast');
      expect(toastContext).toHaveProperty('dismissToast');
      expect(typeof toastContext.showToast).toBe('function');
      expect(typeof toastContext.dismissToast).toBe('function');
    });
  });

  describe('showToast', () => {
    function ToastTester() {
      const { showToast } = useToast();

      return (
        <div>
          <button onClick={() => showToast('Info message')}>Show Info</button>
          <button onClick={() => showToast('Success!', 'success')}>Show Success</button>
          <button onClick={() => showToast('Error!', 'error')}>Show Error</button>
          <button onClick={() => showToast('Warning!', 'warning')}>Show Warning</button>
          <button onClick={() => showToast('Permanent', 'info', 0)}>Show Permanent</button>
        </div>
      );
    }

    it('displays info toast by default', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays success toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('displays error toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('displays warning toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('auto-dismisses toast after duration', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      });
    });

    it('does not auto-dismiss when duration is 0', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Permanent'));

      expect(screen.getByText('Permanent')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(screen.getByText('Permanent')).toBeInTheDocument();
    });

    it('allows multiple toasts simultaneously', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));
      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('assigns unique IDs to each toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));
      await user.click(screen.getByText('Show Info'));

      const toasts = screen.getAllByText('Info message');
      expect(toasts).toHaveLength(2);
    });
  });

  describe('dismissToast', () => {
    function DismissableTester() {
      const { showToast, dismissToast } = useToast();

      return (
        <div>
          <button onClick={() => {
            const id = showToast('Dismissable', 'info', 0);
            setTimeout(() => dismissToast(id), 100);
          }}>
            Show and Dismiss
          </button>
        </div>
      );
    }

    it('manually dismisses a toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <DismissableTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show and Dismiss'));

      expect(screen.getByText('Dismissable')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText('Dismissable')).not.toBeInTheDocument();
      });
    });
  });

  describe('ToastItem interactions', () => {
    function InteractiveTester() {
      const { showToast } = useToast();

      return (
        <button onClick={() => showToast('Click me', 'info', 0)}>
          Show Interactive
        </button>
      );
    }

    it('dismisses toast on click', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <InteractiveTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Interactive'));

      const toast = screen.getByText('Click me');
      expect(toast).toBeInTheDocument();

      await user.click(toast);

      await waitFor(() => {
        expect(screen.queryByText('Click me')).not.toBeInTheDocument();
      });
    });

    it('dismisses toast on close button click', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <InteractiveTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Interactive'));

      expect(screen.getByText('Click me')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Dismiss notification');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Click me')).not.toBeInTheDocument();
      });
    });

    it('dismisses toast on Escape key', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <InteractiveTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Interactive'));

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();

      toast.focus();
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Click me')).not.toBeInTheDocument();
      });
    });

    it('dismisses toast on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <InteractiveTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Interactive'));

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();

      toast.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Click me')).not.toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    function AccessibilityTester() {
      const { showToast } = useToast();

      return (
        <button onClick={() => showToast('Accessible toast', 'success', 0)}>
          Show Toast
        </button>
      );
    }

    it('has proper ARIA roles', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <AccessibilityTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('is focusable with keyboard', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <AccessibilityTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Toast'));

      const toast = screen.getByRole('alert');
      toast.focus();
      expect(toast).toHaveFocus();
    });

    it('has aria-live region for screen readers', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <AccessibilityTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Toast'));

      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-atomic', 'true');
    });

    it('has accessible close button label', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <AccessibilityTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Toast'));

      const closeButton = screen.getByLabelText('Dismiss notification');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty message', async () => {
      function EmptyTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('')}>Show Empty</button>;
      }

      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <EmptyTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Empty'));

      // Toast should still render even with empty message
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles very long messages', async () => {
      function LongTester() {
        const { showToast } = useToast();
        const longMessage = 'A'.repeat(500);
        return <button onClick={() => showToast(longMessage, 'info', 0)}>Show Long</button>;
      }

      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <LongTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Long'));

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles special characters in message', async () => {
      function SpecialTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('<script>alert("xss")</script>')}>Show Special</button>;
      }

      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <SpecialTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Special'));

      // Message should be displayed as text, not executed
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    });

    it('handles invalid toast type gracefully', async () => {
      function InvalidTypeTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('Test', 'invalid-type', 0)}>Show Invalid</button>;
      }

      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <InvalidTypeTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Invalid'));

      // Should fallback to info type
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });

    it('handles negative duration', async () => {
      function NegativeDurationTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('Test', 'info', -1000)}>Show Negative</button>;
      }

      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <NegativeDurationTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Negative'));

      expect(screen.getByText('Test')).toBeInTheDocument();

      // Should not auto-dismiss with negative duration
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('cleanup and unmounting', () => {
    it('prevents updates after unmount', async () => {
      const user = userEvent.setup({ delay: null });

      function UnmountTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('Test', 'info', 1000)}>Show</button>;
      }

      const { unmount } = render(
        <ToastProvider>
          <UnmountTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show'));

      // Unmount before auto-dismiss
      unmount();

      // Advance timers - should not cause errors
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('clears all timers on unmount', () => {
      function MultiToastTester() {
        const { showToast } = useToast();
        return (
          <button onClick={() => {
            showToast('Toast 1', 'info', 1000);
            showToast('Toast 2', 'info', 2000);
            showToast('Toast 3', 'info', 3000);
          }}>
            Show Multiple
          </button>
        );
      }

      const { unmount } = render(
        <ToastProvider>
          <MultiToastTester />
        </ToastProvider>
      );

      unmount();

      // Advance all timers
      act(() => {
        vi.runAllTimers();
      });

      // Should not cause errors
      expect(true).toBe(true);
    });
  });

  describe('ToastContainer visibility', () => {
    it('does not render container when no toasts', () => {
      const { container } = render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );

      // Container should not have aria-live region when empty
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeInTheDocument();
    });

    it('renders container when toasts are present', async () => {
      function ContainerTester() {
        const { showToast } = useToast();
        return <button onClick={() => showToast('Test', 'info', 0)}>Show</button>;
      }

      const user = userEvent.setup({ delay: null });
      const { container } = render(
        <ToastProvider>
          <ContainerTester />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show'));

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});
