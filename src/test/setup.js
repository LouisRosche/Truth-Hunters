/**
 * Test Setup
 * Configures the testing environment
 */

import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
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
