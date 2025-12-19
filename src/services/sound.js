/**
 * SOUND MANAGER
 * Simple sound effect system using Web Audio API
 * Optimized for Chromebook compatibility
 */

export const SoundManager = {
  ctx: null,
  enabled: true,

  /**
   * Initialize the audio context
   */
  init() {
    try {
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) {
      console.warn('Audio not available:', e);
      this.ctx = null;
    }
  },

  /**
   * Play a sound effect
   * @param {string} type - Sound type: 'correct' | 'incorrect' | 'tick' | 'achievement' | 'streak'
   */
  play(type) {
    if (!this.enabled || !this.ctx) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      switch(type) {
        case 'correct':
          osc.frequency.setValueAtTime(523, now); // C5
          osc.frequency.setValueAtTime(659, now + 0.1); // E5
          osc.frequency.setValueAtTime(784, now + 0.2); // G5
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;

        case 'incorrect':
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.setValueAtTime(150, now + 0.15);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'tick':
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;

        case 'achievement':
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.1);
          osc.frequency.setValueAtTime(784, now + 0.2);
          osc.frequency.setValueAtTime(1047, now + 0.3);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;

        case 'streak':
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554, now + 0.08);
          osc.frequency.setValueAtTime(659, now + 0.16);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        default:
          // No sound for unknown types
          return;
      }

      // Clean up audio nodes after sound completes to prevent memory leaks
      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch (e) {
          // Ignore disconnect errors (node may already be disconnected)
        }
      };
    } catch (e) {
      // Silently fail if audio doesn't work
      console.warn('Sound playback failed:', e);
    }
  },

  /**
   * Toggle sound on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};
