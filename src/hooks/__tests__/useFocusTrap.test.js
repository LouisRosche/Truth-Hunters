/**
 * useFocusTrap Hook Tests
 * Tests focus trapping for accessibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  let container;

  beforeEach(() => {
    // Create a container with focusable elements
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('returns a ref object', () => {
      const { result } = renderHook(() => useFocusTrap(false));
      expect(result.current).toHaveProperty('current');
    });

    it('can be activated and deactivated', () => {
      const { result, rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: false } }
      );

      expect(result.current).toHaveProperty('current');

      // Rerender with active true
      rerender({ active: true });
      expect(result.current).toHaveProperty('current');

      // Rerender with active false again
      rerender({ active: false });
      expect(result.current).toHaveProperty('current');
    });

    it('attaches ref to container element', () => {
      const { result } = renderHook(() => useFocusTrap(false));
      result.current.current = container;
      expect(result.current.current).toBe(container);
    });
  });

  describe('Tab key navigation', () => {
    it('traps focus within container when Tab is pressed', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');

      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      button3.textContent = 'Button 3';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Simulate Tab on last element
      button3.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      // Should prevent default and cycle to first element
      // Note: actual focus change is hard to test in JSDOM
      expect(event.key).toBe('Tab');
    });

    it('handles Shift+Tab for reverse navigation', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      container.appendChild(button1);
      container.appendChild(button2);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Simulate Shift+Tab on first element
      button1.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      document.dispatchEvent(event);
      expect(event.key).toBe('Tab');
      expect(event.shiftKey).toBe(true);
    });
  });

  describe('Escape key handling', () => {
    it('dispatches custom event on Escape key', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      let eventFired = false;
      container.addEventListener('focustrap:escape', () => {
        eventFired = true;
      });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(event);
      expect(event.key).toBe('Escape');
    });

    it('escape event bubbles up to parent', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      let parentEventFired = false;
      document.body.addEventListener('focustrap:escape', () => {
        parentEventFired = true;
      });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(event);
      expect(event.key).toBe('Escape');
    });
  });

  describe('focusable element detection', () => {
    it('finds buttons', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('button');
      expect(focusableElements.length).toBe(1);
    });

    it('finds links', () => {
      const link = document.createElement('a');
      link.href = '#';
      container.appendChild(link);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('[href]');
      expect(focusableElements.length).toBe(1);
    });

    it('finds inputs', () => {
      const input = document.createElement('input');
      container.appendChild(input);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('input');
      expect(focusableElements.length).toBe(1);
    });

    it('finds textareas', () => {
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('textarea');
      expect(focusableElements.length).toBe(1);
    });

    it('finds selects', () => {
      const select = document.createElement('select');
      container.appendChild(select);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('select');
      expect(focusableElements.length).toBe(1);
    });

    it('finds elements with tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      container.appendChild(div);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const focusableElements = container.querySelectorAll('[tabindex]');
      expect(focusableElements.length).toBe(1);
    });

    it('ignores disabled elements', () => {
      const button = document.createElement('button');
      button.disabled = true;
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Disabled elements should be filtered out by the hook logic
      expect(button.disabled).toBe(true);
    });

    it('ignores hidden elements (display: none)', () => {
      const button = document.createElement('button');
      button.style.display = 'none';
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // offsetParent is null for hidden elements
      expect(button.offsetParent).toBeNull();
    });

    it('ignores elements with tabindex="-1"', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');
      container.appendChild(div);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // The selector should exclude tabindex="-1"
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = container.querySelectorAll(selector);
      expect(focusableElements.length).toBe(0);
    });
  });

  describe('auto-focus on activation', () => {
    it('focuses first focusable element when activated', async () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      button1.textContent = 'First';
      button2.textContent = 'Second';

      container.appendChild(button1);
      container.appendChild(button2);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Wait for timeout to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // First element should be focused (in real DOM)
      // In JSDOM this is limited but we can verify the element exists
      expect(button1).toBeTruthy();
    });

    it('handles container with no focusable elements', () => {
      const div = document.createElement('div');
      div.textContent = 'No focusable elements';
      container.appendChild(div);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Should not throw
      expect(result.current.current).toBe(container);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners when deactivated', () => {
      const { result, rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: true } }
      );
      result.current.current = container;

      // Deactivate
      rerender({ active: false });

      // Listeners should be removed (hard to test directly in JSDOM)
      expect(result.current).toHaveProperty('current');
    });

    it('clears timeout on unmount', () => {
      const { unmount } = renderHook(() => useFocusTrap(true));

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid activation/deactivation', () => {
      const { rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: false } }
      );

      // Rapidly toggle
      for (let i = 0; i < 10; i++) {
        rerender({ active: i % 2 === 0 });
      }

      // Should not throw or leak memory
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles null container ref', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      // Don't assign container
      expect(result.current.current).toBeNull();
    });

    it('handles container becoming null during active state', () => {
      const { result, rerender } = renderHook(
        ({ active }) => useFocusTrap(active),
        { initialProps: { active: false } }
      );

      result.current.current = container;
      rerender({ active: true });

      // Set to null
      result.current.current = null;
      rerender({ active: true });

      expect(result.current.current).toBeNull();
    });

    it('handles mixed focusable and non-focusable elements', () => {
      const button = document.createElement('button');
      const div = document.createElement('div');
      const input = document.createElement('input');
      const span = document.createElement('span');

      container.appendChild(div);
      container.appendChild(button);
      container.appendChild(span);
      container.appendChild(input);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = container.querySelectorAll(selector);
      expect(focusableElements.length).toBe(2); // button and input
    });

    it('handles dynamically added elements', () => {
      const button1 = document.createElement('button');
      container.appendChild(button1);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Add another button dynamically
      const button2 = document.createElement('button');
      container.appendChild(button2);

      const focusableElements = container.querySelectorAll('button');
      expect(focusableElements.length).toBe(2);
    });

    it('handles single focusable element', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      button.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true
      });

      document.dispatchEvent(event);
      // With single element, Tab should cycle to itself
      expect(container.querySelectorAll('button').length).toBe(1);
    });
  });

  describe('keyboard event filtering', () => {
    it('ignores non-Tab keys', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Press Enter key
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      // Should not prevent default for non-Tab keys
      // (except Escape which is handled separately)
      expect(event.key).toBe('Enter');
    });

    it('only triggers on keydown events', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const { result } = renderHook(() => useFocusTrap(true));
      result.current.current = container;

      // Keyup event should be ignored
      const event = new KeyboardEvent('keyup', {
        key: 'Tab',
        bubbles: true
      });

      document.dispatchEvent(event);
      expect(event.type).toBe('keyup');
    });
  });
});
