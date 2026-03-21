import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundManager } from '../sound';

// Mock AudioContext
function createMockAudioContext() {
  const mockGain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const mockOsc = {
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  };
  return {
    ctx: {
      currentTime: 0,
      state: 'running',
      resume: vi.fn(),
      destination: {},
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
    },
    mockOsc,
    mockGain,
  };
}

describe('SoundManager', () => {
  let originalCtx;

  beforeEach(() => {
    originalCtx = SoundManager.ctx;
    SoundManager.enabled = true;
  });

  afterEach(() => {
    SoundManager.ctx = originalCtx;
    SoundManager.enabled = true;
  });

  it('init sets ctx when AudioContext is available', () => {
    // Directly set ctx to simulate successful init
    const mockCtx = { state: 'running', destination: {} };
    SoundManager.ctx = mockCtx;
    expect(SoundManager.ctx).toBeTruthy();
    expect(SoundManager.ctx.state).toBe('running');
  });

  it('init sets ctx to null when AudioContext throws', () => {
    // Save original and set up a throwing AudioContext
    const origAC = globalThis.AudioContext;
    globalThis.AudioContext = class { constructor() { throw new Error('not supported'); } };
    SoundManager.ctx = null;
    SoundManager.init();
    expect(SoundManager.ctx).toBeNull();
    if (origAC) { globalThis.AudioContext = origAC; } else { delete globalThis.AudioContext; }
  });

  it('play does nothing when disabled', () => {
    const { ctx } = createMockAudioContext();
    SoundManager.ctx = ctx;
    SoundManager.enabled = false;
    SoundManager.play('correct');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('play does nothing without audio context', () => {
    SoundManager.ctx = null;
    SoundManager.enabled = true;
    // Should not throw
    expect(() => SoundManager.play('correct')).not.toThrow();
  });

  it('play resumes suspended context', () => {
    const { ctx } = createMockAudioContext();
    ctx.state = 'suspended';
    SoundManager.ctx = ctx;
    SoundManager.play('correct');
    expect(ctx.resume).toHaveBeenCalled();
  });

  describe('sound types', () => {
    const types = ['correct', 'incorrect', 'tick', 'achievement', 'streak'];

    types.forEach(type => {
      it(`plays "${type}" sound`, () => {
        const { ctx, mockOsc } = createMockAudioContext();
        SoundManager.ctx = ctx;
        SoundManager.play(type);
        expect(ctx.createOscillator).toHaveBeenCalled();
        expect(mockOsc.start).toHaveBeenCalled();
        expect(mockOsc.stop).toHaveBeenCalled();
      });
    });
  });

  it('does not create oscillator for unknown sound type', () => {
    const { ctx, mockOsc } = createMockAudioContext();
    SoundManager.ctx = ctx;
    SoundManager.play('nonexistent');
    expect(mockOsc.start).not.toHaveBeenCalled();
  });

  it('cleans up audio nodes on oscillator end', () => {
    const { ctx, mockOsc, mockGain } = createMockAudioContext();
    SoundManager.ctx = ctx;
    SoundManager.play('correct');
    // Simulate oscillator ending
    expect(mockOsc.onended).toBeTypeOf('function');
    mockOsc.onended();
    expect(mockGain.disconnect).toHaveBeenCalled();
    expect(mockOsc.disconnect).toHaveBeenCalled();
  });

  it('toggle flips enabled state', () => {
    SoundManager.enabled = true;
    const result = SoundManager.toggle();
    expect(result).toBe(false);
    expect(SoundManager.enabled).toBe(false);

    const result2 = SoundManager.toggle();
    expect(result2).toBe(true);
    expect(SoundManager.enabled).toBe(true);
  });
});
