/**
 * FOCUS TRAP HOOK
 * Traps keyboard focus within a modal/dialog for accessibility
 */

import { useEffect, useRef } from 'react';

/**
 * Custom hook for trapping focus within a container
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {React.RefObject} Ref to attach to the container element
 */
export function useFocusTrap(isActive) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll(focusableSelector)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: going backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: going forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle Escape key to close (optional, parent can handle this)
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Dispatch custom event that parent can listen to
        container.dispatchEvent(new CustomEvent('focustrap:escape', { bubbles: true }));
      }
    };

    // Focus first focusable element when trap becomes active
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure element is rendered
      setTimeout(() => focusableElements[0].focus(), 0);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);

  return containerRef;
}
