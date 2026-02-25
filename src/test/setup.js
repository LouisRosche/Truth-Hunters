/**
 * Test Setup
 * Configures the testing environment
 */

import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage with full API including length and key()
const localStorageMock = {
  store: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  get length() {
    return Object.keys(this.store).length;
  },
  key(index) {
    return Object.keys(this.store)[index] || null;
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock AudioContext
window.AudioContext = class AudioContext {
  constructor() {
    this.state = 'suspended';
  }
  createOscillator() {
    return {
      connect: () => {},
      frequency: { setValueAtTime: () => {} },
      start: () => {},
      stop: () => {}
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
    };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
};

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});
