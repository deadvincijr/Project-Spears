/**
 * CABLED IN - Main Entrypoint & Game Engine Loop
 * 
 * Key Architecture:
 * - Momentum Physics: Configurable SPEED and extra slippery FRICTION for high-speed drifting
 * - Server Rack Hitboxes: Elastic deflection, bounce, sparks, slalom gaps, and crossways
 * - Critical Overheat & 30s Explosion: Unresolved errors cause server racks to explode after 30s!
 * - Expensive Replacement Chassis: Exploded racks permanently drop uptime to 0% until replaced (250 ⚡)
 * - Universal Server Code System: ALL servers provide diagnostic PINs when scanned
 * - IT Supply Shop & Powerups: Kiosk station & on-demand store (Nitro, Mag-Grip, Nanobots, Coolant, Replacement Chassis)
 * - Incident 1 (Patch Cable): Drag wire from failing rack and connect to partner across warehouse
 * - Incident 2 (Auth Lockout): Visit the failing rack to retrieve its 4-digit PIN, then enter at South NOC Desk
 * - Virtual Tracking Camera: Smooth follow with velocity lookahead & visceral explosion screen shake
 * - Viewport Culling & Directional Radar: Dynamic edge beacons pointing to objectives, alarms, & kiosks
 */

// ============================================================================
// Procedural Audio Synthesizer (Zero external dependencies)
// ============================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.rebootOsc = null;
    this.rebootGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playGrab() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  playPlugSuccess() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.25, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.19);
      });
    } catch (e) {}
  }

  playError() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.setValueAtTime(180, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playExplosion() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy sub-bass boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 0.65);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.71);

      // Sputtering white/square noise impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'square';
      subOsc.frequency.setValueAtTime(80, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.51);
    } catch (e) {}
  }

  playBump() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playKey() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  playTerminalSuccess() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [659.25, 880, 1318.51].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.17);
      });
    } catch (e) {}
  }

  playTerminalFail() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playBuy() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.25, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.15);
      });
    } catch (e) {}
  }

  playPowerup() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playUpgrade() {
    this.playPowerup();
  }

  playRebootCharge(progress) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const targetFreq = 160 + Math.min(1.0, progress) * 720;
      if (!this.rebootOsc) {
        this.rebootOsc = this.ctx.createOscillator();
        this.rebootGain = this.ctx.createGain();
        this.rebootOsc.type = 'triangle';
        this.rebootOsc.frequency.setValueAtTime(targetFreq, now);
        this.rebootGain.gain.setValueAtTime(0.01, now);
        this.rebootGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        this.rebootOsc.connect(this.rebootGain);
        this.rebootGain.connect(this.ctx.destination);
        this.rebootOsc.start();
      } else {
        this.rebootOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
      }
    } catch (e) {}
  }

  stopRebootCharge() {
    if (this.rebootOsc && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.rebootGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        this.rebootOsc.stop(now + 0.06);
      } catch (e) {}
      this.rebootOsc = null;
      this.rebootGain = null;
    }
  }

  playRebootCancel() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  playBusHop() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.22, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.17);
      });
    } catch (e) {}
  }

  playTimeFreeze() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch (e) {}
  }

  playCannonLaunch() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy sub-bass cannon blast
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(460, now);
      osc1.frequency.exponentialRampToValueAtTime(42, now + 0.36);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.42);

      // Kinetic air hockey snap & laser whoosh
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1300, now);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain2.gain.setValueAtTime(0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  playAirHockeyClack() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {}
  }

  playAlarm() {
    this.playBossAlarm();
  }

  playBossAlarm() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(680, now + i * 0.28);
        osc.frequency.setValueAtTime(440, now + i * 0.28 + 0.14);
        gain.gain.setValueAtTime(0.3, now + i * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.28 + 0.27);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.28);
        osc.stop(now + i * 0.28 + 0.28);
      }
    } catch (e) {}
  }

  playBossRoar() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.85);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.92);
    } catch (e) {}
  }

  playBossLunge() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playBossWrapCinch() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(820, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1400, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(350, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.24);
    } catch (e) {}
  }

  playBossWrapUnwind() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(740, now + 0.16);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.21);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(320, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(920, now + 0.16);
      gain2.gain.setValueAtTime(0.2, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  playPlayerDamage() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.setValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playBossDefeat() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.3, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.62);
      });
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(110, now + 0.2);
      boom.frequency.exponentialRampToValueAtTime(25, now + 0.9);
      boomGain.gain.setValueAtTime(0.5, now + 0.2);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start(now + 0.2);
      boom.stop(now + 1.05);
    } catch (e) {}
  }

  playBugSquish() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Low squish sweep
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(380, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.24);

      // Cyber crunch snap
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1100, now);
      osc2.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.12);

      // Resonant splash pop
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(80, now + 0.04);
      osc3.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain3.gain.setValueAtTime(0.45, now + 0.04);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.04);
      osc3.stop(now + 0.3);
    } catch (e) {}
  }

  playCryoSpray() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-pressure hissing cryo vapor
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.29);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(950, now);
      osc2.frequency.exponentialRampToValueAtTime(450, now + 0.22);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.26);
    } catch (e) {}
  }

  playIceShatter() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-impact crystal fracture chime cluster
      [1100, 1650, 2200, 3100, 4200].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + idx * 0.02 + 0.35);
        gain.gain.setValueAtTime(0.35, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.42);
      });

      // Heavy resonant shatter boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(140, now);
      boom.frequency.exponentialRampToValueAtTime(20, now + 0.8);
      boomGain.gain.setValueAtTime(0.55, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start(now);
      boom.stop(now + 0.88);
    } catch (e) {}
  }

  playPylonDeploy() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 660, 880, 1320].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.28, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.37);
      });
      // Ground anchor thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(120, now + 0.18);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.38);
      thudGain.gain.setValueAtTime(0.4, now + 0.18);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now + 0.18);
      thud.stop(now + 0.44);
    } catch (e) {}
  }

  playLaserGridHum() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  playLimpetAttach() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy metallic magnetic clamp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);

      // High lock ping
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(880, now + 0.06);
      ping.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
      pingGain.gain.setValueAtTime(0.3, now + 0.06);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      ping.start(now + 0.06);
      ping.stop(now + 0.26);
    } catch (e) {}
  }

  playCabinetOpen() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch (e) {}
  }

  playTeleportDeploy(nodeIndex = 0) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (nodeIndex === 0) {
        // Node Alpha: rising futuristic quantum sweep & lock ping
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.22);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.26);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, now + 0.08); // E6 ping
        gain2.gain.setValueAtTime(0.3, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.38);
      } else {
        // Node Beta: Synchronized resonant harmonic chord (Quantum Link Lock!)
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.28, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.48);
        });

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(55, now + 0.4);
        subGain.gain.setValueAtTime(0.4, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        sub.connect(subGain);
        subGain.connect(this.ctx.destination);
        sub.start(now);
        sub.stop(now + 0.44);
      }
    } catch (e) {}
  }

  playTeleportWarp() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Subspace sub-bass sweep drop
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(240, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.38);
      gain1.gain.setValueAtTime(0.55, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.44);

      // Quantum phase-shift swoop
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.linearRampToValueAtTime(1600, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(350, now + 0.32);
      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.35);

      // High-frequency energy spark
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(2200, now);
      osc3.frequency.exponentialRampToValueAtTime(400, now + 0.14);
      gain3.gain.setValueAtTime(0.2, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.18);
    } catch (e) {}
  }

  playIceShatter() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1400, 1850, 2400, 3100].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(300, now + idx * 0.03 + 0.16);
        gain.gain.setValueAtTime(0.18, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.2);
      });
    } catch (e) {}
  }

  playGlitchStatic() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.setValueAtTime(880, now + 0.04);
      osc.frequency.setValueAtTime(140, now + 0.08);
      osc.frequency.setValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playLaserSweep() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.28);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
    } catch (e) {}
  }

  playEmpShockwave() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.5);

      const highOsc = this.ctx.createOscillator();
      const highGain = this.ctx.createGain();
      highOsc.type = 'sawtooth';
      highOsc.frequency.setValueAtTime(1800, now);
      highOsc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
      highGain.gain.setValueAtTime(0.28, now);
      highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      highOsc.connect(highGain);
      highGain.connect(this.ctx.destination);
      highOsc.start(now);
      highOsc.stop(now + 0.4);
    } catch (e) {}
  }

  playNitrousBurn() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.35);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    } catch (e) {}
  }
  playShutdown() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.37);
    } catch (e) {}
  }

  playShake() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playDisinfect() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1600, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  playQuarantineSeal() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 660, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.32);
      });
    } catch (e) {}
  }

}

// ============================================================================
// Constants & Configuration
// ============================================================================
const CONFIG = {
  // ==========================================================================
  // MOVEMENT CONTROLS & PHYSICS (TWEAK THESE DIRECTLY):
  // ==========================================================================
  SPEED: 650,                // Top sliding speed limit (e.g. 400 = slow/tactical, 650 = standard, 900 = hyper-speed)
  FRICTION: 0.982,           // Floor slipperiness (0.90 = grippy rubber, 0.965 = slick, 0.982 = EXTRA SLIPPERY DRIFT, 0.995 = ice)
  ACCELERATION: 1150,        // Keyboard push responsiveness from a standstill
  BRAKE_FRICTION: 0.88,      // Friction when holding [SPACE] to anchor/brake (lower = stops faster)
  INTERACT_RADIUS: 90,       // Distance in pixels to interact with racks or the console
  RESTITUTION: 0.45,         // Bounciness when colliding with server rack hitboxes (0.0 = thud, 0.5 = energetic bounce)

  // Kinetic Cannon Slingshot & Air Hockey Puck Physics
  CANNON: {
    LAUNCH_SPEED: 2150,        // Extreme air hockey puck launch velocity (px/s)
    PUCK_GLIDE_TIME: 2.8,      // Duration of near-frictionless glide in seconds
    PUCK_FRICTION: 0.997,      // Minimal drag for extended air hockey glide
    PUCK_RESTITUTION: 0.92,    // High elastic bounce off racks and walls
    TRAJECTORY_MAX_DIST: 440,  // Length of dotted aiming trajectory line in world pixels
    DOT_SPACING: 20,           // Distance between dots
    COST: 150,                 // Credit cost in shop (set price)
  },

  // Unique Quantum Teleporter Pair (Boss Defeat Reward)
  TELEPORTER: {
    NODE_RADIUS: 28,           // Visual & physical pad radius
    ACTIVATION_RADIUS: 30,     // Proximity distance to auto-trigger step-on teleport
    INTERACT_RADIUS: 52,       // Proximity distance for [E] / [T] prompt
    COOLDOWN: 1.2,             // Cooldown in seconds before pad can warp again
    MIN_DISTANCE: 120,         // Minimum distance between Node Alpha and Node Beta
  },

  WORLD: {
    WIDTH: 4200,
    HEIGHT: 3200,
    TILE_SIZE: 64,
  },
  RACKS: {
    WIDTH: 58,
    HEIGHT: 92,
    ROW_SPACING_X: 300,      // Horizontal distance between aisle columns (~242px wide lanes)
    RACK_SPACING_Y: 155,     // Vertical step (~63px gap between racks for chaotic slalom slides)
    AISLE_BREAK_EVERY: 5,    // Every 5th vertical slot is left open as a cross-aisle corridor
  },
  CAMERA: {
    LERP_SPEED: 0.08,        // Camera follow dampening factor
    LOOKAHEAD_FACTOR: 0.35,  // Camera lead based on player momentum
    CULL_MARGIN: 140,        // Frustum culling buffer in world units
  },
  DIFFICULTY: {
    INITIAL_SPAWN_INTERVAL: 14.0, // Fault interval at start (seconds - slowed down)
    MIN_SPAWN_INTERVAL: 4.5,     // Fastest fault rate at peak escalation (seconds)
    RAMP_DURATION: 600,          // Duration to reach peak threat (600s = 10 minutes)
    INITIAL_MAX_ERRORS: 1,       // Max concurrent faults at start
    PEAK_MAX_ERRORS: 5,          // Max concurrent faults at peak threat
  },
  BOSS: {
    TRIGGER_TIME: 600,           // 10 minutes (600 seconds)
    MIN_WRAPS: 3,                // Minimum cable wraps to defeat
    MAX_WRAPS: 5,                // Maximum cable wraps to defeat
    RADIUS: 46,                  // Collision circle radius
    SPEED: 175,                  // Normal stalk crawling speed
    LUNGE_SPEED: 720,            // Speed during lunge attack
    COLLISION_DAMAGE: 20,        // Contact damage to player HP
    LUNGE_DAMAGE: 25,            // Lunge attack damage
    EMP_DAMAGE: 15,              // Static EMP spark damage
    REWARD_CREDITS: 500,         // Victory bonus credits
  },
  ERRORS: {
    // 4 Core Error Types
    RUN_WIRE: 'RUN_WIRE',
    CABLE_DISCONNECT: 'RUN_WIRE', // Backward compatibility alias
    ACCESS_DENIED: 'ACCESS_DENIED',
    AUTH_LOCKOUT: 'ACCESS_DENIED', // Backward compatibility alias
    RESTART_REQUIRED: 'RESTART_REQUIRED',
    HARD_REBOOT: 'RESTART_REQUIRED', // Backward compatibility alias
    CHAIN_WIRES: 'CHAIN_WIRES',
    MULTI_CABLE_CHAIN: 'CHAIN_WIRES', // Backward compatibility alias

    // 3 Boss-Related Error Types
    SERVER_BUG: 'SERVER_BUG',
    BUG_INFESTATION: 'SERVER_BUG', // Backward compatibility alias
    SERVER_OVERHEAT: 'SERVER_OVERHEAT',
    COOLANT_LEAK: 'SERVER_OVERHEAT', // Backward compatibility alias
    SERVER_SMALL_VIRUS: 'SERVER_SMALL_VIRUS',
    NETWORK_WORM: 'SERVER_SMALL_VIRUS', // Backward compatibility alias

    // Timers & Values
    REBOOT_HOLD_TIME: 5.0,       // Seconds player must hold [E] within range to restart
    MIN_LINK_DISTANCE: 450,      // Min distance to target rack for patch cable
    MAX_LINK_DISTANCE: 1800,     // Max distance to target rack
    CRITICAL_FAIL_TIME: 45.0,    // 45 seconds before critical explosion
    CHAIN_WIRES_TIME: 90.0,      // 1 minute 30 seconds (90s) for multi-rack chain wires
    BUG_RACK_EXPLODE_TIME: 30.0, // 30 seconds before bug destroys rack & moves
    SMALL_VIRUS_TIME: 60.0,      // 60 seconds before small virus erupts into major virus
    REPLACEMENT_COST: 1000,      // Cost in credits (⚡) to replace an exploded server
    SMALL_BUG_SPEED: 180,        // Speed of scuttling rogue bugs across warehouse
  },
  // Modular Boss Catalog (3 Core Bosses with cycling variants; more can be added here)
  BOSS_CATALOG: [
    {
      id: 'BUG_BOSS',
      name: 'MASSIVE BUG',
      baseTitle: 'DEFCON 1 ANOMALY // MASSIVE GLITCH BUG',
      icon: '👾',
      restraintName: 'CONTAINMENT WIRE',
      triggerTime: 600, // 10 minutes
      minWraps: 3,
      maxWraps: 5,
      rewardCredits: 500,
      rewardItem: 'Quantum Teleporter Kit',
      unlockedError: 'SERVER_BUG',
      color: '#ff2a55',
    },
    {
      id: 'OVERHEAT_DAEMON',
      name: 'OVERHEAT DAEMON',
      baseTitle: 'DEFCON 1 OVERHEAT // OVERHEAT DAEMON',
      icon: '🔥',
      restraintName: 'CRYO COOLANT CANISTER',
      triggerTime: 1200, // 20 minutes
      minWraps: 4,
      maxWraps: 6,
      rewardCredits: 750,
      rewardItem: 'Cryo Deflector Shield',
      unlockedError: 'SERVER_OVERHEAT',
      color: '#ff5500',
    },
    {
      id: 'MAJOR_VIRUS',
      name: 'MAJOR VIRUS',
      baseTitle: 'DEFCON 1 BIOLOGICAL // MAJOR VIRUS',
      icon: '🦠',
      restraintName: 'QUARANTINE CONTAINMENT BARRIER',
      triggerTime: 1800, // 30 minutes
      minWraps: 4,
      maxWraps: 6,
      rewardCredits: 1000,
      rewardItem: 'Antivirus Purge Field',
      unlockedError: 'SERVER_SMALL_VIRUS',
      color: '#10b981',
    },
  ],
  getBossForWave(waveNumber) {
    const catalog = this.BOSS_CATALOG;
    const index = (waveNumber - 1) % catalog.length;
    const variantLevel = Math.floor((waveNumber - 1) / catalog.length);
    const base = catalog[index];

    const variantTitles = [
      '',
      ' // OVERCLOCKED VARIANT',
      ' // INFERNAL PRIME VARIANT',
      ' // APEX MUTANT VARIANT',
      ' // OMEGA CORRUPTION',
    ];
    const suffix = variantTitles[Math.min(variantLevel, variantTitles.length - 1)];

    return {
      wave: waveNumber,
      variantLevel: variantLevel,
      id: base.id,
      name: base.name + (variantLevel > 0 ? ` [V${variantLevel + 1}]` : ''),
      title: base.baseTitle + suffix,
      icon: base.icon,
      restraintName: base.restraintName,
      minWraps: base.minWraps + variantLevel,
      maxWraps: base.maxWraps + variantLevel,
      rewardCredits: base.rewardCredits + (variantLevel * 300),
      rewardItem: base.rewardItem,
      unlockedError: base.unlockedError,
      color: variantLevel === 0 ? base.color : (variantLevel === 1 ? '#c084fc' : '#38bdf8'),
    };
  },
  COLORS: {
    BG_TILE_LIGHT: '#111726',
    BG_TILE_DARK: '#0d121e',
    GRID_LINE: '#192237',
    PLAYER: '#00f3ff',
    PLAYER_TRAIL: 'rgba(0, 243, 255, 0.25)',
    RACK_OK: '#1e293b',
    RACK_OK_BORDER: '#334155',
    RACK_LED_GREEN: '#00ff9d',
    RACK_LED_AMBER: '#ffb800',
    RACK_LED_RED: '#ff2a55',
    ALERT_PULSE: 'rgba(255, 42, 85, 0.3)',
    CABLE_ORANGE: '#ff8800',
    CABLE_GLOW: 'rgba(255, 136, 0, 0.4)',
    CABLE_CONNECTED: '#00ff9d',
    CABLE_CHAIN: '#e879f9',
    CABLE_CHAIN_GLOW: 'rgba(232, 121, 249, 0.4)',
    TARGET_BEACON: '#00ff9d',
    CONSOLE_CYAN: '#00f3ff',
    CONSOLE_AMBER: '#ffb800',
    TELEPORTER_ALPHA: '#00f3ff',
    TELEPORTER_BETA: '#e024c3',
    TELEPORTER_LINK: 'rgba(0, 243, 255, 0.35)',
  }
};

// ============================================================================
// Virtual Tracking Camera (Smooth Lerp + Explosion Shake)
// ============================================================================
class Camera2D {
  constructor(viewportWidth, viewportHeight) {
    this.x = CONFIG.WORLD.WIDTH / 2;
    this.y = CONFIG.WORLD.HEIGHT / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  shake(intensity = 18, duration = 0.6) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(target, dt) {
    const lookaheadX = target.vx * CONFIG.CAMERA.LOOKAHEAD_FACTOR;
    const lookaheadY = target.vy * CONFIG.CAMERA.LOOKAHEAD_FACTOR;

    this.targetX = target.x + lookaheadX;
    this.targetY = target.y + lookaheadY;

    this.x += (this.targetX - this.x) * CONFIG.CAMERA.LERP_SPEED;
    this.y += (this.targetY - this.y) * CONFIG.CAMERA.LERP_SPEED;

    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    this.x = Math.max(halfW, Math.min(CONFIG.WORLD.WIDTH - halfW, this.x));
    this.y = Math.max(halfH, Math.min(CONFIG.WORLD.HEIGHT - halfH, this.y));

    // Apply visceral screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const ox = (Math.random() * 2 - 1) * this.shakeIntensity;
      const oy = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.x += ox;
      this.y += oy;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 24 * dt);
    }
  }

  toScreen(worldX, worldY) {
    return {
      x: worldX - (this.x - this.viewportWidth / 2),
      y: worldY - (this.y - this.viewportHeight / 2)
    };
  }

  toWorld(screenX, screenY) {
    return {
      x: screenX + (this.x - this.viewportWidth / 2),
      y: screenY + (this.y - this.viewportHeight / 2)
    };
  }

  isBoundingBoxVisible(x, y, w, h, margin = CONFIG.CAMERA.CULL_MARGIN) {
    const left = this.x - this.viewportWidth / 2 - margin;
    const right = this.x + this.viewportWidth / 2 + margin;
    const top = this.y - this.viewportHeight / 2 - margin;
    const bottom = this.y + this.viewportHeight / 2 + margin;

    return (x + w >= left && x <= right && y + h >= top && y <= bottom);
  }
}

// ============================================================================
// Particle Spark & Explosion Effect System
// ============================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnSparks(x, y, count = 16, color = '#00ff9d') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 1.6 + Math.random() * 1.6,
        color,
        size: 2 + Math.random() * 2.5,
      });
    }
  }

  spawnExplosion(x, y) {
    const colors = ['#ff2a55', '#ff7700', '#ffe600', '#ffffff', '#475569', '#1e293b'];
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 280;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 1.0 + Math.random() * 1.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5.0,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, cam, isOptimized = false) {
    if (isOptimized) {
      for (const p of this.particles) {
        if (!cam.isBoundingBoxVisible(p.x - 5, p.y - 5, 10, 10)) continue;
        const screenPos = cam.toScreen(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(screenPos.x - p.size, screenPos.y - p.size, p.size * 2, p.size * 2);
      }
    } else {
      for (const p of this.particles) {
        if (!cam.isBoundingBoxVisible(p.x - 5, p.y - 5, 10, 10)) continue;
        const screenPos = cam.toScreen(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }
}

// ============================================================================
// Patch Cable Entity
// ============================================================================
class PatchCable {
  constructor(sourceRack, targetRack) {
    this.sourceRack = sourceRack;
    this.targetRack = targetRack;
    this.isConnected = false;
    this.sourcePoint = {
      x: sourceRack.x + sourceRack.width / 2,
      y: sourceRack.y + sourceRack.height / 2,
    };
    this.targetPoint = {
      x: targetRack.x + targetRack.width / 2,
      y: targetRack.y + targetRack.height / 2,
    };

    this.nodes = [
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
    ];

    this.packetProgress = [0.0, 0.33, 0.66];
    this.color = CONFIG.COLORS.CABLE_ORANGE;
  }

  update(player, dt) {
    const endX = this.isConnected ? this.targetPoint.x : player.x;
    const endY = this.isConnected ? this.targetPoint.y : player.y;

    const count = this.nodes.length;
    this.nodes[0].x = this.sourcePoint.x;
    this.nodes[0].y = this.sourcePoint.y;
    this.nodes[count - 1].x = endX;
    this.nodes[count - 1].y = endY;

    for (let i = 1; i < count - 1; i++) {
      const factor = i / (count - 1);
      const targetInterpX = this.sourcePoint.x + (endX - this.sourcePoint.x) * factor;
      const targetInterpY = this.sourcePoint.y + (endY - this.sourcePoint.y) * factor;
      this.nodes[i].x += (targetInterpX - this.nodes[i].x) * (0.25 * 60 * dt);
      this.nodes[i].y += (targetInterpY - this.nodes[i].y) * (0.25 * 60 * dt);
    }

    if (this.isConnected) {
      for (let i = 0; i < this.packetProgress.length; i++) {
        this.packetProgress[i] = (this.packetProgress[i] + 0.85 * dt) % 1.0;
      }
    }
  }

  connect(targetRack) {
    this.isConnected = true;
    this.targetRack = targetRack;
    this.targetPoint = {
      x: targetRack.x + targetRack.width / 2,
      y: targetRack.y + targetRack.height / 2,
    };
    this.color = CONFIG.COLORS.CABLE_CONNECTED;
  }

  render(ctx, cam) {
    const screenNodes = this.nodes.map(n => cam.toScreen(n.x, n.y));

    // Outer Glow
    ctx.beginPath();
    ctx.moveTo(screenNodes[0].x, screenNodes[0].y);
    for (let i = 1; i < screenNodes.length - 1; i++) {
      const xc = (screenNodes[i].x + screenNodes[i + 1].x) / 2;
      const yc = (screenNodes[i].y + screenNodes[i + 1].y) / 2;
      ctx.quadraticCurveTo(screenNodes[i].x, screenNodes[i].y, xc, yc);
    }
    ctx.lineTo(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y);

    ctx.strokeStyle = this.isConnected ? 'rgba(0, 255, 157, 0.25)' : CONFIG.COLORS.CABLE_GLOW;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Core Wire
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Connector ends
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(screenNodes[0].x, screenNodes[0].y, 4, 0, Math.PI * 2);
    ctx.arc(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Data packets
    if (this.isConnected) {
      for (const prog of this.packetProgress) {
        const idx = Math.floor(prog * (screenNodes.length - 1));
        const subProg = (prog * (screenNodes.length - 1)) - idx;
        const n1 = screenNodes[idx];
        const n2 = screenNodes[Math.min(idx + 1, screenNodes.length - 1)];
        const px = n1.x + (n2.x - n1.x) * subProg;
        const py = n1.y + (n2.y - n1.y) * subProg;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ============================================================================
// Multi-Hop Daisy-Chain Cable Entity (Runs cord across multiple servers)
// ============================================================================
class MultiHopCable {
  constructor(sourceRack, hopRacks) {
    this.sourceRack = sourceRack;
    this.hops = hopRacks;
    this.currentHopIndex = 1;
    this.completedSegments = [];
    this.isConnected = false;
    this.color = CONFIG.COLORS.CABLE_CHAIN || '#e879f9';

    this.activeSegment = new PatchCable(this.hops[0], this.hops[1]);
    this.activeSegment.color = this.color;
  }

  getCurrentTargetRack() {
    return this.hops[this.currentHopIndex] || null;
  }

  advanceHop(nearRack) {
    this.activeSegment.connect(nearRack);
    this.completedSegments.push(this.activeSegment);

    this.currentHopIndex++;

    if (this.currentHopIndex < this.hops.length) {
      nearRack.isTargetDestination = false;
      const nextTarget = this.hops[this.currentHopIndex];
      nextTarget.isTargetDestination = true;

      this.activeSegment = new PatchCable(nearRack, nextTarget);
      this.activeSegment.color = this.color;
      return false;
    } else {
      nearRack.isTargetDestination = false;
      this.isConnected = true;
      this.activeSegment = null;
      return true;
    }
  }

  update(player, dt) {
    for (const seg of this.completedSegments) {
      seg.update(player, dt);
    }
    if (!this.isConnected && this.activeSegment) {
      this.activeSegment.update(player, dt);
    }
  }

  render(ctx, cam) {
    for (const seg of this.completedSegments) {
      seg.render(ctx, cam);
    }
    if (!this.isConnected && this.activeSegment) {
      this.activeSegment.render(ctx, cam);
    }
  }
}

// ============================================================================
// High-Voltage Containment Wire Entity (Physically coils around Corrupted Bug Boss)
// ============================================================================
class ContainmentWire {
  constructor(sourceRack, boss) {
    this.sourceRack = sourceRack;
    this.boss = boss;
    this.isConnected = false;
    this.sourcePoint = {
      x: sourceRack.x + sourceRack.width / 2,
      y: sourceRack.y + sourceRack.height / 2,
    };
    this.targetRack = sourceRack;

    // Lead-in nodes: from host server rack to boss entry point
    this.leadInNodes = [
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
    ];

    // Trailing nodes: from boss exit point to player cart
    this.trailingNodes = [
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
      { x: this.sourcePoint.x, y: this.sourcePoint.y },
    ];

    this.packetProgress = [0.0, 0.25, 0.5, 0.75];
    this.color = boss.cableColor || boss.color || '#ff8800';
    this.glowColor = boss.glowColor || 'rgba(255, 136, 0, 0.45)';
    this.sparkTimer = 0;
  }

  update(player, dt, game) {
    const boss = this.boss;
    if (!boss || !boss.isAlive) {
      return;
    }

    const pDist = Math.hypot(player.x - boss.x, player.y - boss.y);
    const curAngle = Math.atan2(player.y - boss.y, player.x - boss.x);

    // Entry angle from boss to host server rack
    const srcAngle = Math.atan2(this.sourcePoint.y - boss.y, this.sourcePoint.x - boss.x);
    const coilRadius = 38;

    // Entry tangent point on boss perimeter
    const entryX = boss.x + Math.cos(srcAngle) * coilRadius;
    const entryY = boss.y + Math.sin(srcAngle) * coilRadius;

    // Update Lead-In Nodes (Host Rack -> Boss Entry Point)
    const leadCount = this.leadInNodes.length;
    this.leadInNodes[0].x = this.sourcePoint.x;
    this.leadInNodes[0].y = this.sourcePoint.y;
    this.leadInNodes[leadCount - 1].x = entryX;
    this.leadInNodes[leadCount - 1].y = entryY;

    for (let i = 1; i < leadCount - 1; i++) {
      const factor = i / (leadCount - 1);
      const tx = this.sourcePoint.x + (entryX - this.sourcePoint.x) * factor;
      const ty = this.sourcePoint.y + (entryY - this.sourcePoint.y) * factor;
      this.leadInNodes[i].x += (tx - this.leadInNodes[i].x) * (0.32 * 60 * dt);
      this.leadInNodes[i].y += (ty - this.leadInNodes[i].y) * (0.32 * 60 * dt);
    }

    // Wrapping Physics Tracking (Supports Clockwise and Counter-Clockwise with Reversal/Unwinding)
    const maxWrapDist = 440; // Proximity to accumulate wraps
    if (pDist < maxWrapDist) {
      if (boss.lastPlayerAngle !== null) {
        let diff = curAngle - boss.lastPlayerAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) > 0.0001) {
          // If no active wrap direction (or completely unwound back to 0), adopt new movement direction
          if (!boss.wrapDirection || (boss.completedWraps === 0 && (boss.currentWrapAngle || 0) <= 0.0001)) {
            if (Math.abs(diff) > 0.005) {
              boss.wrapDirection = Math.sign(diff);
            }
          }

          const dir = boss.wrapDirection || 1;
          const progressDelta = diff * dir;
          let newAngle = (boss.currentWrapAngle || 0) + progressDelta;

          // Forward wrapping: complete full 360-degree revolutions
          while (newAngle >= Math.PI * 2 - 0.001) {
            boss.completedWraps++;
            newAngle = Math.max(0, newAngle - Math.PI * 2);
            boss.flinchTimer = 0.4;

            if (game) {
              game.camera.shake(20, 0.5);
              game.particles.spawnSparks(boss.x, boss.y, 50, boss.cableColor || '#00ff9d');
              game.particles.spawnSparks(boss.x, boss.y, 35, '#00f3ff');
              game.particles.spawnSparks(boss.x, boss.y, 25, '#ffffff');
              game.sound.playBossWrapCinch();
              const rName = boss.restraintName || 'COIL';
              const dirLabel = boss.wrapDirection > 0 ? 'CLOCKWISE' : 'COUNTER-CLOCKWISE';
              game.showTemporaryToast(`⚡ ${rName} ${boss.completedWraps}/${boss.maxWraps} CINCHED! [${dirLabel}]`);
              game.updateBossHUD();

              if (boss.completedWraps >= boss.maxWraps) {
                boss.currentWrapAngle = 0;
                if (game.defeatBoss) {
                  game.defeatBoss(boss);
                } else {
                  game.defeatBugBoss();
                }
                return;
              }
            }
          }

          // Reverse unwinding: if player reverses, unwind in-progress and completed wraps
          while (newAngle < 0) {
            if (boss.completedWraps > 0) {
              boss.completedWraps--;
              newAngle += Math.PI * 2;
              boss.flinchTimer = 0.25;

              if (game) {
                game.camera.shake(10, 0.3);
                game.particles.spawnSparks(boss.x, boss.y, 30, '#ffaa00');
                game.particles.spawnSparks(boss.x, boss.y, 20, '#ff0055');
                game.sound.playBossWrapUnwind();
                const rName = boss.restraintName || 'COIL';
                game.showTemporaryToast(`↩️ ${rName} UNWOUND! [${boss.completedWraps}/${boss.maxWraps}]`, '↩️');
                game.updateBossHUD();
              }
            } else {
              // No completed wraps remaining and newAngle < 0:
              // The rope has completely unwound and player is continuing in reverse!
              // Switch wrap direction so the player now begins wrapping in the reverse direction!
              boss.wrapDirection = -boss.wrapDirection;
              newAngle = -newAngle;
              if (newAngle >= Math.PI * 2 - 0.001) {
                while (newAngle >= Math.PI * 2 - 0.001) {
                  boss.completedWraps++;
                  newAngle = Math.max(0, newAngle - Math.PI * 2);
                }
              }
              break;
            }
          }

          boss.currentWrapAngle = Math.max(0, newAngle);
          if (boss.completedWraps === 0 && boss.currentWrapAngle <= 0.0001) {
            boss.wrapDirection = 0;
            boss.currentWrapAngle = 0;
          }
        }
      }
      boss.lastPlayerAngle = curAngle;
    } else {
      boss.lastPlayerAngle = curAngle;
    }

    // Determine Exit Point where wire leaves monster to player
    let exitX = entryX;
    let exitY = entryY;

    if (boss.completedWraps === 0 && (boss.currentWrapAngle || 0) < 0.06) {
      exitX = this.sourcePoint.x;
      exitY = this.sourcePoint.y;
    } else {
      const dir = boss.wrapDirection || 1;
      const currentAngle = srcAngle + (boss.currentWrapAngle || 0) * dir;
      const wrapSlot = Math.min(boss.maxWraps - 1, boss.completedWraps);
      const spineOff = (wrapSlot - (boss.maxWraps - 1) / 2) * 8.5;
      const r = coilRadius + wrapSlot * 2.0;

      const cosF = Math.cos(boss.facingAngle);
      const sinF = Math.sin(boss.facingAngle);

      exitX = boss.x + Math.cos(currentAngle) * r + spineOff * cosF;
      exitY = boss.y + Math.sin(currentAngle) * r + spineOff * sinF;
    }

    // Update Trailing Nodes (Boss Exit Point -> Player Cart)
    const trailCount = this.trailingNodes.length;
    this.trailingNodes[0].x = exitX;
    this.trailingNodes[0].y = exitY;
    this.trailingNodes[trailCount - 1].x = player.x;
    this.trailingNodes[trailCount - 1].y = player.y;

    for (let i = 1; i < trailCount - 1; i++) {
      const factor = i / (trailCount - 1);
      const tx = exitX + (player.x - exitX) * factor;
      const ty = exitY + (player.y - exitY) * factor;
      this.trailingNodes[i].x += (tx - this.trailingNodes[i].x) * (0.35 * 60 * dt);
      this.trailingNodes[i].y += (ty - this.trailingNodes[i].y) * (0.35 * 60 * dt);
    }

    // Advance high-voltage energy packet animations
    for (let i = 0; i < this.packetProgress.length; i++) {
      this.packetProgress[i] = (this.packetProgress[i] + 1.2 * dt) % 1.0;
    }

    // Periodic electrical sparks at contact pinch points
    this.sparkTimer += dt;
    if (this.sparkTimer > 0.12 && (boss.completedWraps > 0 || boss.currentWrapAngle > 0.2)) {
      this.sparkTimer = 0;
      if (game && Math.random() < 0.6) {
        const randTurn = Math.random() * ((boss.completedWraps || 0) + (boss.currentWrapAngle ? 1 : 0));
        const slot = Math.floor(randTurn);
        const spineOff = (slot - (boss.maxWraps - 1) / 2) * 8.5;
        const sparkAng = Math.random() * Math.PI * 2;
        const r = coilRadius + slot * 2.0;
        const sx = boss.x + Math.cos(sparkAng) * r + spineOff * Math.cos(boss.facingAngle);
        const sy = boss.y + Math.sin(sparkAng) * r + spineOff * Math.sin(boss.facingAngle);
        game.particles.spawnSparks(sx, sy, 3, '#00ff9d');
      }
    }
  }

  render(ctx, cam) {
    const boss = this.boss;
    const isWrapping = boss && boss.isAlive && (boss.completedWraps > 0 || (boss.currentWrapAngle || 0) > 0.06);

    if (!isWrapping) {
      // Prior to wrapping, render as single trailing cord from host rack to player cart
      const screenNodes = this.trailingNodes.map(n => cam.toScreen(n.x, n.y));
      screenNodes[0] = cam.toScreen(this.sourcePoint.x, this.sourcePoint.y);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenNodes[0].x, screenNodes[0].y);
      for (let i = 1; i < screenNodes.length - 1; i++) {
        const xc = (screenNodes[i].x + screenNodes[i + 1].x) / 2;
        const yc = (screenNodes[i].y + screenNodes[i + 1].y) / 2;
        ctx.quadraticCurveTo(screenNodes[i].x, screenNodes[i].y, xc, yc);
      }
      ctx.lineTo(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y);
      ctx.strokeStyle = this.glowColor;
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenNodes[0].x, screenNodes[0].y, 4, 0, Math.PI * 2);
      ctx.arc(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 1. Render Floor Lead-In (Source Rack -> Boss Entry Point)
    const leadScreen = this.leadInNodes.map(n => cam.toScreen(n.x, n.y));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leadScreen[0].x, leadScreen[0].y);
    for (let i = 1; i < leadScreen.length - 1; i++) {
      const xc = (leadScreen[i].x + leadScreen[i + 1].x) / 2;
      const yc = (leadScreen[i].y + leadScreen[i + 1].y) / 2;
      ctx.quadraticCurveTo(leadScreen[i].x, leadScreen[i].y, xc, yc);
    }
    ctx.lineTo(leadScreen[leadScreen.length - 1].x, leadScreen[leadScreen.length - 1].y);
    ctx.strokeStyle = 'rgba(255, 136, 0, 0.4)';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(leadScreen[0].x, leadScreen[0].y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Render Trailing Lead-Out (Boss Exit Point -> Player Cart)
    const trailScreen = this.trailingNodes.map(n => cam.toScreen(n.x, n.y));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trailScreen[0].x, trailScreen[0].y);
    for (let i = 1; i < trailScreen.length - 1; i++) {
      const xc = (trailScreen[i].x + trailScreen[i + 1].x) / 2;
      const yc = (trailScreen[i].y + trailScreen[i + 1].y) / 2;
      ctx.quadraticCurveTo(trailScreen[i].x, trailScreen[i].y, xc, yc);
    }
    ctx.lineTo(trailScreen[trailScreen.length - 1].x, trailScreen[trailScreen.length - 1].y);

    ctx.strokeStyle = 'rgba(0, 255, 157, 0.45)';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(trailScreen[trailScreen.length - 1].x, trailScreen[trailScreen.length - 1].y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderCoilsOnBoss(ctx, cam) {
    const boss = this.boss;
    if (!boss || !boss.isAlive) return;

    const completed = boss.completedWraps || 0;
    const currentWrap = boss.currentWrapAngle || 0;
    if (completed === 0 && currentWrap < 0.05) return;

    const srcAngle = Math.atan2(this.sourcePoint.y - boss.y, this.sourcePoint.x - boss.x);
    const dir = boss.wrapDirection || 1;
    const cosF = Math.cos(boss.facingAngle);
    const sinF = Math.sin(boss.facingAngle);
    const baseRadius = 38;

    ctx.save();

    // 1. Render all locked completed 360-degree cinched coils
    for (let i = 0; i < completed; i++) {
      const spineOff = (i - (boss.maxWraps - 1) / 2) * 8.5;
      const r = baseRadius + i * 2.0;

      ctx.beginPath();
      const step = Math.PI / 20;
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += step) {
        const wx = boss.x + Math.cos(a) * r + spineOff * cosF;
        const wy = boss.y + Math.sin(a) * r + spineOff * sinF;
        const sp = cam.toScreen(wx, wy);
        if (a === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }

      ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 255, 157, 0.55)' : 'rgba(255, 136, 0, 0.55)';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = i % 2 === 0 ? '#00ff9d' : '#ff8800';
      ctx.lineWidth = 4.5;
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cinch clamp buckle on the coil
      const clampAng = srcAngle + i * 0.55 * dir;
      const cx = boss.x + Math.cos(clampAng) * r + spineOff * cosF;
      const cy = boss.y + Math.sin(clampAng) * r + spineOff * sinF;
      const csp = cam.toScreen(cx, cy);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(csp.x, csp.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(csp.x, csp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render In-Progress Active Coil wrapping around monster in real-time
    if (currentWrap > 0.05) {
      const activeSlot = Math.min(boss.maxWraps - 1, completed);
      const spineOff = (activeSlot - (boss.maxWraps - 1) / 2) * 8.5;
      const r = baseRadius + activeSlot * 2.0;

      ctx.beginPath();
      const totalArc = currentWrap;
      const steps = Math.max(6, Math.floor((totalArc / (Math.PI * 2)) * 44));
      const stepAngle = totalArc / steps;

      for (let s = 0; s <= steps; s++) {
        const a = srcAngle + (s * stepAngle * dir);
        const wx = boss.x + Math.cos(a) * r + spineOff * cosF;
        const wy = boss.y + Math.sin(a) * r + spineOff * sinF;
        const sp = cam.toScreen(wx, wy);
        if (s === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.65)';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4.5;
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Glowing contact head spark where wire leads off
      const headAngle = srcAngle + (totalArc * dir);
      const hx = boss.x + Math.cos(headAngle) * r + spineOff * cosF;
      const hy = boss.y + Math.sin(headAngle) * r + spineOff * sinF;
      const hsp = cam.toScreen(hx, hy);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hsp.x, hsp.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hsp.x, hsp.y, 7 + Math.sin(performance.now() * 0.02) * 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ============================================================================
// Heavy High-Tensile Restraint Rope Entity (Retrieved from Supplies Closet)
// ============================================================================
class RestraintRope extends ContainmentWire {
  constructor(sourceStation, boss) {
    super(sourceStation, boss);
    this.sourceStation = sourceStation;
    this.isRope = true;
    this.color = '#d97706'; // Braided hemp/nylon amber
    this.glowColor = 'rgba(217, 119, 6, 0.4)';
  }

  render(ctx, cam) {
    const boss = this.boss;
    const isWrapping = boss && boss.isAlive && (boss.completedWraps > 0 || (boss.currentWrapAngle || 0) > 0.06);

    if (!isWrapping) {
      // Prior to wrapping, render as braided rope from supplies closet to player cart
      const screenNodes = this.trailingNodes.map(n => cam.toScreen(n.x, n.y));
      screenNodes[0] = cam.toScreen(this.sourcePoint.x, this.sourcePoint.y);

      ctx.save();
      // Base dark hemp outline
      ctx.beginPath();
      ctx.moveTo(screenNodes[0].x, screenNodes[0].y);
      for (let i = 1; i < screenNodes.length - 1; i++) {
        const xc = (screenNodes[i].x + screenNodes[i + 1].x) / 2;
        const yc = (screenNodes[i].y + screenNodes[i + 1].y) / 2;
        ctx.quadraticCurveTo(screenNodes[i].x, screenNodes[i].y, xc, yc);
      }
      ctx.lineTo(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 7.5;
      ctx.stroke();

      // Braided amber body
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // Twisted fiber thread highlights
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spool ring and carabiner anchor
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(screenNodes[0].x, screenNodes[0].y, 5, 0, Math.PI * 2);
      ctx.arc(screenNodes[screenNodes.length - 1].x, screenNodes[screenNodes.length - 1].y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 1. Lead-in from Supplies Closet to Boss entry point
    const leadScreen = this.leadInNodes.map(n => cam.toScreen(n.x, n.y));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leadScreen[0].x, leadScreen[0].y);
    for (let i = 1; i < leadScreen.length - 1; i++) {
      const xc = (leadScreen[i].x + leadScreen[i + 1].x) / 2;
      const yc = (leadScreen[i].y + leadScreen[i + 1].y) / 2;
      ctx.quadraticCurveTo(leadScreen[i].x, leadScreen[i].y, xc, yc);
    }
    ctx.lineTo(leadScreen[leadScreen.length - 1].x, leadScreen[leadScreen.length - 1].y);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 7.5;
    ctx.stroke();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 2. Trailing Lead-Out from Boss Exit point to Player Cart
    const trailScreen = this.trailingNodes.map(n => cam.toScreen(n.x, n.y));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trailScreen[0].x, trailScreen[0].y);
    for (let i = 1; i < trailScreen.length - 1; i++) {
      const xc = (trailScreen[i].x + trailScreen[i + 1].x) / 2;
      const yc = (trailScreen[i].y + trailScreen[i + 1].y) / 2;
      ctx.quadraticCurveTo(trailScreen[i].x, trailScreen[i].y, xc, yc);
    }
    ctx.lineTo(trailScreen[trailScreen.length - 1].x, trailScreen[trailScreen.length - 1].y);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 7.5;
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderCoilsOnBoss(ctx, cam) {
    const boss = this.boss;
    if (!boss || !boss.isAlive) return;

    const completed = boss.completedWraps || 0;
    const currentWrap = boss.currentWrapAngle || 0;
    if (completed === 0 && currentWrap < 0.05) return;

    const srcAngle = Math.atan2(this.sourcePoint.y - boss.y, this.sourcePoint.x - boss.x);
    const dir = boss.wrapDirection || 1;
    const cosF = Math.cos(boss.facingAngle);
    const sinF = Math.sin(boss.facingAngle);
    const baseRadius = 38;

    ctx.save();

    // 1. Render all locked completed cinched rope coils
    for (let i = 0; i < completed; i++) {
      const spineOff = (i - (boss.maxWraps - 1) / 2) * 8.5;
      const r = baseRadius + i * 2.0;

      ctx.beginPath();
      const step = Math.PI / 20;
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += step) {
        const wx = boss.x + Math.cos(a) * r + spineOff * cosF;
        const wy = boss.y + Math.sin(a) * r + spineOff * sinF;
        const sp = cam.toScreen(wx, wy);
        if (a === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Knotted rope hitch buckle with steel iron carabiner
      const clampAng = srcAngle + i * 0.55 * dir;
      const cx = boss.x + Math.cos(clampAng) * r + spineOff * cosF;
      const cy = boss.y + Math.sin(clampAng) * r + spineOff * sinF;
      const csp = cam.toScreen(cx, cy);

      // Knot hitch
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(csp.x, csp.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(csp.x, csp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render In-Progress Active Rope Coil
    if (currentWrap > 0.05) {
      const activeSlot = Math.min(boss.maxWraps - 1, completed);
      const spineOff = (activeSlot - (boss.maxWraps - 1) / 2) * 8.5;
      const r = baseRadius + activeSlot * 2.0;

      ctx.beginPath();
      const totalArc = currentWrap;
      const steps = Math.max(6, Math.floor((totalArc / (Math.PI * 2)) * 44));
      const stepAngle = totalArc / steps;

      for (let s = 0; s <= steps; s++) {
        const a = srcAngle + (s * stepAngle * dir);
        const wx = boss.x + Math.cos(a) * r + spineOff * cosF;
        const wy = boss.y + Math.sin(a) * r + spineOff * sinF;
        const sp = cam.toScreen(wx, wy);
        if (s === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

// ============================================================================
// Player Entity (Momentum Physics + Hitbox Collision Handling)
// ============================================================================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.trail = [];
    this.trailMax = 12;
    this.permanentSpeedBonus = 0;
    this.permanentFrictionBonus = 0;

    // Health & Combat System
    this.maxHp = 100;
    this.hp = 100;
    this.invulnerableTimer = 0;

    // Build & Synergy Mechanics
    this.hasNitrous = false;
    this.nitrousTimer = 0;
    this.nitrousCooldown = 0;

    this.hasPhaseDash = false;
    this.dashCooldown = 0;

    this.hasEmpShockwave = false;
    this.empCooldown = 0;

    this.hasSpikedBumper = false;
    this.hasSlalomSprings = false;
    this.hasTeflonSkids = false;

    this.hasCryoShield = false;
    this.cryoShieldCooldown = 0;

    this.hasNanotechHub = false;
    this.defibrillatorCharges = 0;
    this.hasSuperReel = false;
    this.hasHexDecoder = false;
    this.hasPatchDrone = false;
    this.adrenalineTimer = 0;
  }

  takeDamage(amount, knockX = 0, knockY = 0, sound = null, particles = null) {
    if (this.invulnerableTimer > 0) return false;

    // Cryo Deflector Shield absorption
    if (this.hasCryoShield && this.cryoShieldCooldown <= 0) {
      this.cryoShieldCooldown = 45.0; // 45s recharge
      this.invulnerableTimer = 1.2;
      if (sound) sound.playIceShatter();
      if (particles) particles.spawnSparks(this.x, this.y, 40, '#00f3ff');
      return 'SHIELD_ABSORBED';
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 1.2; // 1.2s invulnerability frames
    this.vx += knockX;
    this.vy += knockY;
    if (sound) sound.playPlayerDamage();
    if (particles) particles.spawnSparks(this.x, this.y, 20, '#ff2a55');
    return true;
  }

  update(keys, dt, buffs = {}, isCannonPuck = false, sound = null, particles = null) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    // Active powerup timers
    if (this.nitrousTimer > 0) {
      this.nitrousTimer = Math.max(0, this.nitrousTimer - dt);
      if (particles && Math.random() < 0.8) {
        particles.spawnSparks(this.x - Math.cos(this.angle) * 16, this.y - Math.sin(this.angle) * 16, 2, '#00f3ff');
      }
    }
    if (this.adrenalineTimer > 0) {
      this.adrenalineTimer = Math.max(0, this.adrenalineTimer - dt);
      if (particles && Math.random() < 0.5) {
        particles.spawnSparks(this.x - Math.cos(this.angle) * 14, this.y - Math.sin(this.angle) * 14, 2, '#f59e0b');
      }
    }
    if (this.nitrousCooldown > 0) this.nitrousCooldown = Math.max(0, this.nitrousCooldown - dt);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.empCooldown > 0) this.empCooldown = Math.max(0, this.empCooldown - dt);
    if (this.cryoShieldCooldown > 0) this.cryoShieldCooldown = Math.max(0, this.cryoShieldCooldown - dt);

    // Nanotech Auto-Repair Hub passive regeneration
    if (this.hasNanotechHub && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 3.0 * dt);
    }

    let moveX = 0;
    let moveY = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    const inputLen = Math.hypot(moveX, moveY);
    if (inputLen > 0) {
      moveX /= inputLen;
      moveY /= inputLen;
      this.angle = Math.atan2(moveY, moveX);
    }

    // ACCELERATION: scales responsive push with permanent speed upgrades & nitrous
    let accelBase = (CONFIG.ACCELERATION ?? 1150) + (this.permanentSpeedBonus * 1.2);
    if (this.nitrousTimer > 0) accelBase += 850;
    if (this.adrenalineTimer > 0) accelBase += 550;
    this.vx += moveX * accelBase * dt;
    this.vy += moveY * accelBase * dt;

    // FRICTION:
    // If in Cannon Puck Glide, near-zero friction for effortless air hockey table gliding!
    // Teflon Skids: extra slippery drift.
    const isBraking = Boolean(keys['Space']);
    let friction;
    if (isBraking) {
      friction = CONFIG.BRAKE_FRICTION ?? 0.88;
      if (this.adrenalineTimer > 0) friction = 0.80;
    } else if (isCannonPuck) {
      friction = CONFIG.CANNON.PUCK_FRICTION ?? 0.997;
    } else {
      const baseFriction = this.hasTeflonSkids ? 0.988 : (CONFIG.FRICTION ?? 0.982);
      friction = Math.max(0.920, baseFriction - this.permanentFrictionBonus);
      if (this.adrenalineTimer > 0) friction = Math.max(0.905, friction - 0.012);
    }

    this.vx *= Math.pow(friction, dt * 60);
    this.vy *= Math.pow(friction, dt * 60);

    // SPEED: Permanent energy drinks boost top speed; Nitrous gives +400 px/s burst; Puck state allows cannon velocity
    let maxSpeed = isCannonPuck 
      ? (CONFIG.CANNON.LAUNCH_SPEED ?? 2150) 
      : ((CONFIG.SPEED ?? 650) + this.permanentSpeedBonus + (this.nitrousTimer > 0 ? 400 : 0) + (this.adrenalineTimer > 0 ? 40 : 0));

    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > maxSpeed) {
      this.vx = (this.vx / currentSpeed) * maxSpeed;
      this.vy = (this.vy / currentSpeed) * maxSpeed;
    }

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp / Bounce inside world borders (Air hockey table cushions!)
    if (isCannonPuck) {
      const minX = this.radius;
      const maxX = CONFIG.WORLD.WIDTH - this.radius;
      const minY = this.radius;
      const maxY = CONFIG.WORLD.HEIGHT - this.radius;
      let bounced = false;
      const restitution = CONFIG.CANNON.PUCK_RESTITUTION ?? 0.92;

      if (this.x < minX) {
        this.x = minX;
        this.vx = Math.abs(this.vx) * restitution;
        bounced = true;
      } else if (this.x > maxX) {
        this.x = maxX;
        this.vx = -Math.abs(this.vx) * restitution;
        bounced = true;
      }

      if (this.y < minY) {
        this.y = minY;
        this.vy = Math.abs(this.vy) * restitution;
        bounced = true;
      } else if (this.y > maxY) {
        this.y = maxY;
        this.vy = -Math.abs(this.vy) * restitution;
        bounced = true;
      }

      if (bounced) {
        if (sound) sound.playAirHockeyClack();
        if (particles) particles.spawnSparks(this.x, this.y, 14, '#00f3ff');
      }
    } else {
      this.x = Math.max(this.radius, Math.min(CONFIG.WORLD.WIDTH - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(CONFIG.WORLD.HEIGHT - this.radius, this.y));
    }

    this.trail.push({
      x: this.x,
      y: this.y,
      speed: currentSpeed,
      isPuck: isCannonPuck || this.nitrousTimer > 0
    });
    if (this.trail.length > this.trailMax) {
      this.trail.shift();
    }
  }

  resolveAABBCollision(boxX, boxY, boxW, boxH, sound, particles, buffs = {}, isCannonPuck = false) {
    const closestX = Math.max(boxX, Math.min(this.x, boxX + boxW));
    const closestY = Math.max(boxY, Math.min(this.y, boxY + boxH));

    const dx = this.x - closestX;
    const dy = this.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.radius * this.radius) {
      let dist = Math.sqrt(distSq);
      let nx, ny;
      if (dist < 0.0001) {
        const distLeft = this.x - boxX;
        const distRight = (boxX + boxW) - this.x;
        const distTop = this.y - boxY;
        const distBottom = (boxY + boxH) - this.y;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        if (minDist === distLeft) { nx = -1; ny = 0; }
        else if (minDist === distRight) { nx = 1; ny = 0; }
        else if (minDist === distTop) { nx = 0; ny = -1; }
        else { nx = 0; ny = 1; }
        dist = -minDist;
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }
      const overlap = this.radius - dist;

      this.x += nx * overlap;
      this.y += ny * overlap;

      const dot = this.vx * nx + this.vy * ny;
      if (dot < 0) {
        // Air hockey puck ricochet (0.92) vs magnet grip absorption vs standard bounce (0.45)
        let restitution;
        if (isCannonPuck) {
          restitution = CONFIG.CANNON.PUCK_RESTITUTION ?? 0.92;
        } else {
          restitution = Math.max(0.20, (CONFIG.RESTITUTION ?? 0.45) - (this.permanentFrictionBonus * 5));
        }

        this.vx -= (1 + restitution) * dot * nx;
        this.vy -= (1 + restitution) * dot * ny;

        // Slalom Springs: +25% instantaneous speed burst on rack ricochet!
        if (this.hasSlalomSprings && Math.hypot(this.vx, this.vy) > 220) {
          this.vx *= 1.25;
          this.vy *= 1.25;
          if (particles) particles.spawnSparks(closestX, closestY, 8, '#00ff9d');
        }

        const impact = Math.abs(dot);
        if (impact > 80) {
          if (isCannonPuck) {
            if (sound) sound.playAirHockeyClack();
            if (particles) {
              particles.spawnSparks(closestX, closestY, 14, '#00f3ff');
            }
          } else if (impact > 110) {
            if (sound) sound.playBump();
            if (particles) {
              particles.spawnSparks(closestX, closestY, Math.min(6, Math.floor(impact / 40)), '#38bdf8');
            }
          }
        }
      }
    }
  }

  getSpeed() {
    return Math.hypot(this.vx, this.vy);
  }
}

// ============================================================================
// Server Rack Entity (Solid Hitbox, 30s Explosion Overheat, & Rebuild)
// ============================================================================
class ServerRack {
  constructor(id, x, y, width = CONFIG.RACKS.WIDTH, height = CONFIG.RACKS.HEIGHT) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.uptime = 100;
    this.isFailing = false;
    this.isDestroyed = false; // Exploded rack state
    this.failDuration = 0;    // Time in failure (explodes if >= 30s)
    this.error = null;
    this.isTargetDestination = false;
    this.alertTimer = 0;
    this.smokeTimer = 0;
    this.isShutdown = false;
    // Every server rack has its own persistent diagnostic PIN
    this.code = String(Math.floor(1000 + Math.random() * 9000));
  }

  triggerRunWireError(partnerRack) {
    if (this.isDestroyed || partnerRack.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.RUN_WIRE,
      partnerRack: partnerRack,
      partnerId: partnerRack.id,
      description: `RUN WIRE ➔ CONNECT TO ${partnerRack.id}`,
    };
    partnerRack.isFailing = true;
    partnerRack.failDuration = 0;
    partnerRack.error = {
      type: CONFIG.ERRORS.RUN_WIRE,
      partnerRack: this,
      partnerId: this.id,
      description: `RUN WIRE ➔ CONNECT TO ${this.id}`,
    };
  }

  // Alias for backward compatibility
  triggerCableError(targetRack) {
    this.triggerRunWireError(targetRack);
  }

  triggerAccessDeniedError() {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.ACCESS_DENIED,
      code: this.code,
      hasBeenInspected: false,
      description: 'ACCESS DENIED ➔ RETRIEVE PIN AT RACK & ENTER AT NOC DESK',
    };
  }

  // Alias for backward compatibility
  triggerAuthError() {
    this.triggerAccessDeniedError();
  }

  triggerRestartRequiredError() {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.RESTART_REQUIRED,
      isShutdown: false,
      rebootProgress: 0,
      description: 'RESTART REQUIRED ➔ SHUT DOWN AT TERMINAL, THEN TURN ON',
    };
  }

  // Alias for backward compatibility
  triggerHardRebootError() {
    this.triggerRestartRequiredError();
  }

  triggerChainWiresError(hopRacks) {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.CHAIN_WIRES,
      hops: hopRacks,
      description: `CHAIN WIRES ➔ CONNECT ${hopRacks.length} SERVERS (90s)`,
    };
    hopRacks.forEach(h => { h.isTargetDestination = true; });
  }

  // Alias for backward compatibility
  triggerMultiChainError(hopRacks) {
    this.triggerChainWiresError(hopRacks);
  }

  triggerServerBugError(originRack = null) {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.SERVER_BUG,
      originRack: originRack,
      isShutdown: false,
      bugTimer: CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0,
      shakeProgress: 0,
      description: 'BUG INFESTED ➔ SHUT DOWN AT TERMINAL & EXTRACT BUG (30s)',
    };
  }

  triggerServerOverheatError() {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.error = {
      type: CONFIG.ERRORS.SERVER_OVERHEAT,
      isShutdown: false,
      description: 'SERVER OVERHEAT ➔ SHUT DOWN AT TERMINAL BEFORE 45s FIRE CASCADE',
    };
  }

  triggerServerSmallVirusError() {
    if (this.isDestroyed) return;
    this.isFailing = true;
    this.failDuration = 0;
    this.isVirusInfected = true;
    this.error = {
      type: CONFIG.ERRORS.SERVER_SMALL_VIRUS,
      isShutdown: false,
      disinfectProgress: 0,
      virusTimer: CONFIG.ERRORS.SMALL_VIRUS_TIME ?? 60.0,
      description: 'VIRUS SLIME ➔ SHUT DOWN AT TERMINAL & DISINFECT (60s)',
    };
  }

  shutdownBreaker() {
    this.isShutdown = true;
    if (this.error) {
      this.error.isShutdown = true;
    }
  }

  resolveError() {
    this.isFailing = false;
    this.isShutdown = false;
    this.isVirusInfected = false;
    if (this.error?.partnerRack) {
      this.error.partnerRack.isTargetDestination = false;
      if (this.error.partnerRack.error?.type === CONFIG.ERRORS.RUN_WIRE) {
        this.error.partnerRack.isFailing = false;
        this.error.partnerRack.error = null;
        this.error.partnerRack.uptime = 100;
      }
    }
    if (this.error?.targetRack) {
      this.error.targetRack.isTargetDestination = false;
    }
    if (this.error?.hops) {
      this.error.hops.forEach(h => {
        h.isTargetDestination = false;
        if (h.id !== this.id && h.error?.type === CONFIG.ERRORS.CHAIN_WIRES) {
          h.isFailing = false;
          h.error = null;
          h.uptime = 100;
        }
      });
    }
    this.error = null;
    this.failDuration = 0;
  }

  rebuild() {
    this.isDestroyed = false;
    this.isFailing = false;
    this.isShutdown = false;
    this.isVirusInfected = false;
    this.error = null;
    this.uptime = 100;
    this.failDuration = 0;
    this.code = String(Math.floor(1000 + Math.random() * 9000));
  }

  update(dt, game) {
    if (this.isDestroyed) {
      this.uptime = 0;
      this.smokeTimer += dt;
      if (this.smokeTimer >= 0.22) {
        this.smokeTimer = 0;
        if (game && Math.random() < 0.6) {
          game.particles.particles.push({
            x: this.x + 8 + Math.random() * (this.width - 16),
            y: this.y + 8 + Math.random() * (this.height - 16),
            vx: (Math.random() - 0.5) * 20,
            vy: -15 - Math.random() * 25,
            life: 1.0,
            decay: 1.2,
            color: Math.random() < 0.35 ? '#ff4400' : '#475569',
            size: 2 + Math.random() * 2.5
          });
        }
      }
      return;
    }

    if (this.isFailing) {
      this.alertTimer += dt;

      // When shutdown remotely, critical explosion timers halt indefinitely!
      if (this.error?.isShutdown) {
        this.uptime = Math.max(10, this.uptime); // Offline safe state
        // Idle offline hum particles
        if (game && Math.random() < 0.1) {
          game.particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 1, '#ffb800');
        }
        return;
      }

      // Live countdown when NOT shutdown:
      this.failDuration += dt;

      // Special timer for SERVER_BUG (30s before rack explodes and bug flees to find a new server)
      if (this.error?.type === CONFIG.ERRORS.SERVER_BUG) {
        this.error.bugTimer -= dt;
        this.uptime = Math.max(0, 100 * (this.error.bugTimer / (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0)));
        if (this.error.bugTimer <= 0) {
          const existingBug = this.error?.bugEntity;
          this.explode(game);
          // Bug escapes the explosion and flees on the warehouse floor to find a new server!
          if (game) {
            const livingRacks = game.racks.filter(r => !r.isDestroyed && r.id !== this.id);
            const nextTarget = livingRacks.length > 0 ? livingRacks[Math.floor(Math.random() * livingRacks.length)] : null;
            const bug = existingBug || new SmallBug(this.x + this.width / 2, this.y + this.height / 2, this, nextTarget);
            bug.isInsideRack = false;
            bug.currentRack = null;
            bug.isAlive = true;
            bug.x = this.x + this.width / 2;
            bug.y = this.y + this.height / 2;
            bug.targetRack = nextTarget;
            if (!game.smallBugs.includes(bug)) {
              game.smallBugs.push(bug);
            }
            if (nextTarget) {
              game.showTemporaryToast(`💥 ${this.id} EXPLODED! BUG ESCAPED TO FIND ${nextTarget.id} ➔ SQUISH IT!`, '🐛');
            } else {
              game.showTemporaryToast(`💥 ${this.id} EXPLODED! BUG ESCAPED ONTO THE FLOOR ➔ SQUISH IT!`, '🐛');
            }
          }
          return;
        }
        return;
      }

      // Special timer for SERVER_SMALL_VIRUS (60s before turning into Major Virus)
      if (this.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS) {
        this.error.virusTimer -= dt;
        this.uptime = Math.max(0, 100 * (this.error.virusTimer / 60.0));
        if (game && Math.random() < 0.3) {
          game.particles.spawnSparks(this.x + Math.random() * this.width, this.y + this.height - 10, 2, '#10b981');
        }
        if (this.error.virusTimer <= 0) {
          // Turns into full Major Virus encounter!
          if (game && game.spawnMajorVirusFromRack) {
            game.spawnMajorVirusFromRack(this);
          }
          return;
        }
        return;
      }

      // Special timer for CHAIN_WIRES (90s) & SERVER_OVERHEAT (30s)
      let maxTime = (CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 45.0);
      if (this.error?.type === CONFIG.ERRORS.CHAIN_WIRES) {
        maxTime = (CONFIG.ERRORS.CHAIN_WIRES_TIME ?? 90.0);
      } else if (this.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT) {
        maxTime = 30.0;
      }
      const isGoldNetOps = Boolean(game?.activeSynergies?.netops >= 3);
      if (isGoldNetOps) maxTime += 15.0;

      this.uptime = Math.max(0, 100 * (1 - this.failDuration / maxTime));

      // Warning sparks when under 10 seconds remaining
      if (maxTime - this.failDuration <= 10 && game && Math.random() < 0.25) {
        game.particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 2, '#ffaa00');
      }

      // Overheat fire particles
      if (this.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT && game) {
        if (Math.random() < 0.4) {
          game.particles.spawnSparks(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 2, '#ff5500');
        }
      }

      // Explode if error is unresolved for > maxTime seconds!
      if (this.failDuration >= maxTime) {
        this.explode(game);
      }
    } else if (this.uptime < 100) {
      this.uptime = Math.min(100, this.uptime + 5.0 * dt);
    }
  }

  explode(game) {
    this.isDestroyed = true;
    this.isFailing = false;
    this.uptime = 0;
    this.failDuration = 0;
    this.isVirusInfected = false;

    const errorCopy = this.error;
    this.error = null;

    if (game) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      game.particles.spawnExplosion(centerX, centerY);
      game.sound.playExplosion();
      game.camera.shake(22, 0.75);

      if (game.activeCable) {
        if (game.activeCable instanceof MultiHopCable) {
          if (game.activeCable.hops.some(h => h.id === this.id)) {
            game.dropActiveCable();
          }
        } else if (game.activeCable.sourceRack?.id === this.id || game.activeCable.targetRack?.id === this.id) {
          game.dropActiveCable();
        }
      }

      if (game.rebootingRack?.id === this.id) {
        game.rebootingRack = null;
        game.rebootHoldTime = 0;
        game.sound.stopRebootCharge();
      }

      if (game.activeCodeMemo?.rackId === this.id) {
        game.activeCodeMemo = null;
        if (game.memoCodeVal) game.memoCodeVal.textContent = '--';
      }

      // 1. RUN_WIRE: Both racks explode!
      if (errorCopy?.type === CONFIG.ERRORS.RUN_WIRE && errorCopy.partnerRack && !errorCopy.partnerRack.isDestroyed) {
        errorCopy.partnerRack.explode(game);
      }

      // 2. CHAIN_WIRES: All racks in chain explode!
      if (errorCopy?.type === CONFIG.ERRORS.CHAIN_WIRES && Array.isArray(errorCopy.hops)) {
        errorCopy.hops.forEach(h => {
          if (h.id !== this.id && !h.isDestroyed) {
            h.explode(game);
          }
        });
      }

      // 3. SERVER_OVERHEAT: Starts a fire that spreads to nearby living servers!
      if (errorCopy?.type === CONFIG.ERRORS.SERVER_OVERHEAT) {
        const neighbors = game.racks.filter(r => !r.isDestroyed && !r.isFailing && r.id !== this.id);
        let ignitedCount = 0;
        neighbors.forEach(nr => {
          const dist = Math.hypot(nr.x - this.x, nr.y - this.y);
          if (dist < 420) {
            nr.triggerServerOverheatError();
            ignitedCount++;
            game.particles.spawnSparks(nr.x + nr.width / 2, nr.y + nr.height / 2, 40, '#ff5500');
          }
        });
        if (ignitedCount === 0 && neighbors.length > 0) {
          neighbors.sort((a, b) => {
            const dA = Math.hypot(a.x - this.x, a.y - this.y);
            const dB = Math.hypot(b.x - this.x, b.y - this.y);
            return dA - dB;
          });
          neighbors[0].triggerServerOverheatError();
          ignitedCount++;
          game.particles.spawnSparks(neighbors[0].x + neighbors[0].width / 2, neighbors[0].y + neighbors[0].height / 2, 40, '#ff5500');
        }
        game.showTemporaryToast(`🔥 ${this.id} EXPLODED! FIRE SPREAD TO ${ignitedCount} NEARBY SERVERS! SHUT DOWN AT TERMINAL (30s)!`, '🔥');
      } else {
        game.showTemporaryToast(`💥 CRITICAL EXPLOSION AT ${this.id}! PERMANENT UPTIME DAMAGE!`, '💥');
      }

      // Check Game Over condition: if all racks in warehouse exploded!
      if (game.racks.length > 0 && game.racks.every(r => r.isDestroyed)) {
        game.triggerGameOver();
      } else {
        game.updateObjectiveUI();
      }
    }
  }
}

class NOCTerminalStation {
  constructor(x, y, width = 240, height = 74) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render(ctx, cam) {
    const pos = cam.toScreen(this.x, this.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(pos.x + 6, pos.y + 6, this.width, this.height);

    ctx.fillStyle = '#0a101d';
    ctx.fillRect(pos.x, pos.y, this.width, this.height);
    ctx.strokeStyle = CONFIG.COLORS.CONSOLE_CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, this.width, this.height);

    const monitorWidth = (this.width - 24) / 3;
    for (let i = 0; i < 3; i++) {
      const mx = pos.x + 6 + i * (monitorWidth + 6);
      const my = pos.y + 8;
      ctx.fillStyle = '#04070d';
      ctx.fillRect(mx, my, monitorWidth, 34);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, monitorWidth, 34);

      ctx.fillStyle = i === 1 ? '#00ff9d' : '#38bdf8';
      for (let line = 0; line < 3; line++) {
        ctx.fillRect(mx + 6, my + 6 + line * 8, monitorWidth - 12 - (line * 8), 3);
      }
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pos.x + 20, pos.y + 48, this.width - 40, 16);
    ctx.fillStyle = '#00ff9d';
    ctx.fillRect(pos.x + 30, pos.y + 54, 8, 4);
    ctx.fillStyle = '#ffb800';
    ctx.fillRect(pos.x + 44, pos.y + 54, 8, 4);

    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.fillStyle = CONFIG.COLORS.CONSOLE_CYAN;
    ctx.textAlign = 'center';
    ctx.fillText('NOC MASTER OVERRIDE CONSOLE', pos.x + this.width / 2, pos.y - 8);
  }
}

// ============================================================================
// Portable Field NOC Terminal Station (Deployable Apex Reward)
// ============================================================================
class PortableTerminalStation {
  constructor(x, y, width = 110, height = 58) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.animTime = 0;
  }

  isNear(px, py, maxDist = 95) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return Math.hypot(px - cx, py - cy) <= maxDist;
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx, cam) {
    const pos = cam.toScreen(this.x, this.y);
    const pulse = Math.sin(this.animTime * 3) * 0.5 + 0.5;

    // Ground hologram emission ring
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 157, ${0.3 + pulse * 0.35})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(pos.x + this.width / 2, pos.y + this.height / 2, 70, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(pos.x + 4, pos.y + 4, this.width, this.height);

    // Main Chassis
    ctx.fillStyle = '#060b13';
    ctx.fillRect(pos.x, pos.y, this.width, this.height);
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, this.width, this.height);

    // Dual Miniature Holographic Monitors
    const monW = (this.width - 16) / 2;
    for (let i = 0; i < 2; i++) {
      const mx = pos.x + 6 + i * (monW + 4);
      const my = pos.y + 6;
      ctx.fillStyle = '#02050a';
      ctx.fillRect(mx, my, monW, 26);
      ctx.strokeStyle = i === 0 ? '#00f3ff' : '#00ff9d';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, monW, 26);

      ctx.fillStyle = i === 0 ? '#00f3ff' : '#00ff9d';
      for (let l = 0; l < 2; l++) {
        ctx.fillRect(mx + 4, my + 5 + l * 7, monW - 8 - (l * 6), 2);
      }
    }

    // Glowing Antenna Beacon
    const ax = pos.x + this.width / 2;
    const ay = pos.y;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, ay - 14);
    ctx.stroke();

    ctx.fillStyle = pulse > 0.5 ? '#00ff9d' : '#00f3ff';
    ctx.beginPath();
    ctx.arc(ax, ay - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Keypad Base Strip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pos.x + 10, pos.y + 36, this.width - 20, 14);
    ctx.fillStyle = '#00ff9d';
    ctx.fillRect(pos.x + 16, pos.y + 40, 6, 6);
    ctx.fillStyle = '#ffb800';
    ctx.fillRect(pos.x + 28, pos.y + 40, 6, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(pos.x + 40, pos.y + 40, 6, 6);

    // Label
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.fillStyle = '#00ff9d';
    ctx.textAlign = 'center';
    ctx.fillText('PORTABLE FIELD NOC', pos.x + this.width / 2, pos.y - 20);
  }
}

// ============================================================================
// IT Supply Depot / Hardware Shop Kiosk Entity (Bottom Right Station)
// ============================================================================
class ShopKioskStation {
  constructor(x, y, width = 180, height = 74) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render(ctx, cam) {
    const pos = cam.toScreen(this.x, this.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(pos.x + 6, pos.y + 6, this.width, this.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(pos.x, pos.y, this.width, this.height);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, this.width, this.height);

    ctx.fillStyle = '#04070d';
    ctx.fillRect(pos.x + 10, pos.y + 8, this.width - 20, 34);
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x + 10, pos.y + 8, this.width - 20, 34);

    const icons = ['🥤', '🧲', '🎯', '🏗️'];
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    icons.forEach((ic, i) => {
      ctx.fillText(ic, pos.x + 28 + i * 36, pos.y + 30);
    });

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(pos.x + 20, pos.y + 48, this.width - 40, 16);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(pos.x + 28, pos.y + 54, 8, 4);
    ctx.fillStyle = '#00ff9d';
    ctx.fillRect(pos.x + 42, pos.y + 54, 8, 4);

    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText('IT SUPPLY DEPOT // SHOP', pos.x + this.width / 2, pos.y - 8);
  }
}

// ============================================================================
// Facility Supplies Closet Entity (South Wall Utility & DEFCON Locker)
// ============================================================================
class SuppliesClosetStation {
  constructor(x, y, width = 180, height = 74) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx, cam) {
    const pos = cam.toScreen(this.x, this.y);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(pos.x + 6, pos.y + 6, this.width, this.height);

    // Outer steel cabinet frame
    ctx.fillStyle = '#0b111e';
    ctx.fillRect(pos.x, pos.y, this.width, this.height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x, pos.y, this.width, this.height);

    // Hazard warning diagonal stripes on top header
    ctx.save();
    ctx.beginPath();
    ctx.rect(pos.x + 4, pos.y + 4, this.width - 8, 12);
    ctx.clip();
    for (let hx = -20; hx < this.width + 40; hx += 16) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(pos.x + hx, pos.y + 4, 8, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(pos.x + hx + 8, pos.y + 4, 8, 12);
    }
    ctx.restore();

    // Steel double door panels
    const doorW = (this.width - 24) / 2;
    // Left door
    ctx.fillStyle = '#162032';
    ctx.fillRect(pos.x + 8, pos.y + 20, doorW, this.height - 28);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pos.x + 8, pos.y + 20, doorW, this.height - 28);

    // Right door
    ctx.fillStyle = '#162032';
    ctx.fillRect(pos.x + 16 + doorW, pos.y + 20, doorW, this.height - 28);
    ctx.strokeRect(pos.x + 16 + doorW, pos.y + 20, doorW, this.height - 28);

    // Visual equipment inside doors:
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(pos.x + 8 + doorW / 2, pos.y + 36, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪢', pos.x + 8 + doorW / 2, pos.y + 40);

    ctx.fillStyle = '#00f3ff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❄️', pos.x + 16 + doorW + 16, pos.y + 40);
    ctx.fillText('⚡', pos.x + 16 + doorW + 42, pos.y + 40);

    // Handles
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(pos.x + 8 + doorW - 5, pos.y + 36, 3, 14);
    ctx.fillRect(pos.x + 16 + doorW + 2, pos.y + 36, 3, 14);

    // Overhead status LED
    const pulse = Math.sin(this.animTime * 4) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.beginPath();
    ctx.arc(pos.x + this.width / 2, pos.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Holographic label
    ctx.font = 'bold 10px "Orbitron", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('FACILITY SUPPLIES CLOSET', pos.x + this.width / 2, pos.y - 8);
  }
}

// ============================================================================
// Quantum Teleporter Node Entity (Permanent Post-Boss Reward Pad)
// ============================================================================
class TeleporterNode {
  constructor(id, x, y, name, color, secondaryColor) {
    this.id = id; // 'alpha' or 'beta'
    this.x = x;
    this.y = y;
    const isAlpha = (id === 'alpha');
    this.name = name || (isAlpha ? 'NODE α' : 'NODE β');
    this.color = color || (isAlpha ? (CONFIG.COLORS?.TELEPORTER_ALPHA ?? '#00f3ff') : (CONFIG.COLORS?.TELEPORTER_BETA ?? '#e024c3'));
    this.secondaryColor = secondaryColor || (isAlpha ? '#00ff9d' : '#ff007f');
    this.radius = CONFIG.TELEPORTER?.NODE_RADIUS ?? 28;
    this.animTime = 0;
    this.ambientParticles = [];
  }

  update(dt) {
    this.animTime += dt;

    // Spawn ambient swirling quantum particle embers
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * (this.radius - 8);
      const isAlpha = this.id === 'alpha';
      const mainCol = this.color || (isAlpha ? '#00f3ff' : '#e024c3');
      const secCol = this.secondaryColor || (isAlpha ? '#00ff9d' : '#ff007f');
      this.ambientParticles.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vy: -16 - Math.random() * 22,
        vx: (Math.random() - 0.5) * 12,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? mainCol : secCol
      });
    }

    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.ambientParticles.splice(i, 1);
      }
    }
  }

  render(ctx, cam, isLinked = false, cooldownRatio = 0) {
    const isAlpha = this.id === 'alpha';
    const mainColor = this.color || (isAlpha ? (CONFIG.COLORS?.TELEPORTER_ALPHA ?? '#00f3ff') : (CONFIG.COLORS?.TELEPORTER_BETA ?? '#e024c3'));
    const secColor = this.secondaryColor || (isAlpha ? '#00ff9d' : '#ff007f');
    this.color = mainColor;
    this.secondaryColor = secColor;
    if (!this.name) this.name = isAlpha ? 'NODE α' : 'NODE β';

    const screenPos = cam.toScreen(this.x, this.y);
    const r = this.radius;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    // 1. Drop shadow & ambient ground glow
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.8);
    glowGrad.addColorStop(0, mainColor + (isLinked ? '55' : '33'));
    glowGrad.addColorStop(0.6, mainColor + '15');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Beveled Metallic Octagonal Base Chassis
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0a101d';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Outer glow rim
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = isLinked ? 14 : 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Etched Circuit Traces radiating outward
    ctx.strokeStyle = mainColor + '88';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 9), Math.sin(a) * (r - 9));
      ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
      ctx.stroke();
    }

    // 4. Rotating Concentric Rings
    ctx.save();
    ctx.rotate(-this.animTime * 1.2);
    ctx.strokeStyle = secColor + 'aa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.rotate(this.animTime * 1.6);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, Math.PI, Math.PI * 1.8);
    ctx.stroke();
    ctx.restore();

    // 5. Central Quantum Vortex Core
    const corePulse = 0.85 + Math.sin(this.animTime * 4) * 0.15;
    const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.35 * corePulse);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, mainColor);
    coreGrad.addColorStop(0.8, secColor + 'bb');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // 6. Cooldown Recharge Progress Sweep (if cooling down)
    if (cooldownRatio > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - cooldownRatio)));
      ctx.strokeStyle = '#ffb800';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();

    // 7. Ambient Rising Particles
    for (const p of this.ambientParticles) {
      const sp = cam.toScreen(p.x, p.y);
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 8. Floating Holographic Label Tag (bobbing sinewave above pad)
    const floatY = Math.sin(this.animTime * 2.5) * 3;
    const labelPos = cam.toScreen(this.x, this.y - r - 12 + floatY);

    ctx.save();
    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = mainColor;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 8;
    ctx.fillText(`[${this.name}]`, labelPos.x, labelPos.y);

    if (isLinked) {
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff9d';
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 4;
      ctx.fillText('ONLINE', labelPos.x, labelPos.y + 11);
    } else {
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 4;
      ctx.fillText('STANDBY', labelPos.x, labelPos.y + 11);
    }
    ctx.restore();
  }
}

// ============================================================================
// EMF Grounding Resonance Pylon (Deployed from Supplies Closet for Spectral Daemon)
// ============================================================================
class EMFGroundingPylon {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.radius = 16;
    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx, cam) {
    const pos = cam.toScreen(this.x, this.y);

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(pos.x + 3, pos.y + 3, 14, 0, Math.PI * 2);
    ctx.fill();

    // Heavy tripod magnetic base
    ctx.strokeStyle = '#c084fc';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tripod feet struts
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2 / 3) + this.animTime * 0.4;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(a) * 20, pos.y + Math.sin(a) * 20);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Foot anchor pad
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pos.x + Math.cos(a) * 20, pos.y + Math.sin(a) * 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing central resonance crystal
    const pulse = 0.8 + Math.sin(this.animTime * 6) * 0.2;
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vertical ion beam pillar
    const grad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y - 50);
    grad.addColorStop(0, 'rgba(192, 132, 252, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.35)');
    grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(pos.x - 3, pos.y - 50, 6, 50);

    // Overhead pylon identifier
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'center';
    ctx.fillText(`EMF PYLON #${this.id}`, pos.x, pos.y - 18);

    ctx.restore();
  }
}

function isPointInTriangle(px, py, p1, p2, p3) {
  const d1 = (px - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (py - p2.y);
  const d2 = (px - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (py - p3.y);
  const d3 = (px - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (py - p1.y);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// ============================================================================
// Corrupted Bug Boss Entity (Emerges after 10m; Restrain with Heavy Rope from Supplies Closet)
// ============================================================================
class BugBoss {
  constructor(x, y, hostRack, variantLevel = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.BOSS?.RADIUS ?? 46;
    this.hostRack = hostRack;
    this.isAlive = true;
    this.variantLevel = variantLevel;
    this.wave = 1 + variantLevel * 3;
    this.name = variantLevel === 0 ? 'MASSIVE BUG' : `MASSIVE BUG [V${variantLevel + 1}]`;
    this.title = 'DEFCON 1 ANOMALY // ' + (variantLevel === 0 ? 'MASSIVE GLITCH BUG' : 'MASSIVE BUG // OVERCLOCKED VARIANT');
    this.icon = '👾';
    this.restraintName = 'CONTAINMENT WIRE';
    this.cableColor = variantLevel === 0 ? '#00ff9d' : '#c084fc';
    this.glowColor = variantLevel === 0 ? 'rgba(0, 255, 157, 0.45)' : 'rgba(192, 132, 252, 0.45)';
    this.color = variantLevel === 0 ? '#ff2a55' : '#e024c3';
    this.maxWraps = Math.min(8, (CONFIG.BOSS?.MIN_WRAPS ?? 3) + variantLevel);
    this.speed = (CONFIG.BOSS?.SPEED ?? 175) + variantLevel * 25;
    
    // Wire/rope wrapping restraint parameters (randomized between 3 and 5 wraps)
    const minW = CONFIG.BOSS?.MIN_WRAPS ?? 3;
    const maxW = CONFIG.BOSS?.MAX_WRAPS ?? 5;
    this.maxWraps = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
    this.completedWraps = 0;
    this.currentWrapAngle = 0;
    this.wrapDirection = 0;
    this.lastPlayerAngle = null;
    this.flinchTimer = 0;
    this.coils = []; // Completed coil visual bands wrapped around bug

    // State machine: 'EMERGING' | 'STALK' | 'LUNGE_PREP' | 'LUNGE_DASH' | 'EMP_CHARGE'
    this.state = 'EMERGING';
    this.stateTimer = 1.6;
    this.animTime = 0;
    this.facingAngle = 0;

    // Combat timers
    this.lungeCooldown = 4.5 + Math.random() * 2;
    this.empCooldown = 7.0 + Math.random() * 2;
    this.projectiles = []; // Radial EMP sparks
  }

  update(player, activeCable, dt, game) {
    if (!this.isAlive) return;

    this.animTime += dt;

    // Update EMP Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Collision with player
      const pDist = Math.hypot(player.x - p.x, player.y - p.y);
      if (pDist < player.radius + p.radius) {
        const damage = CONFIG.BOSS?.EMP_DAMAGE ?? 15;
        if (player.takeDamage(damage, p.vx * 0.4, p.vy * 0.4, game.sound, game.particles)) {
          game.triggerDamageFlash();
          game.updatePlayerHealthUI();
          game.camera.shake(12, 0.3);
          game.showTemporaryToast('⚡ HIT BY STATIC EMP SPARK! [-15 HP]');
        }
        p.life = 0;
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // State Machine
    if (this.state === 'EMERGING') {
      this.stateTimer -= dt;
      if (Math.random() < 0.4) {
        game.particles.spawnSparks(this.x, this.y, 4, '#ff2a55');
      }
      if (this.stateTimer <= 0) {
        this.state = 'STALK';
        game.sound.playBossRoar();
        game.camera.shake(20, 0.6);
      }
      return;
    }

    const toPlayerAngle = Math.atan2(player.y - this.y, player.x - this.x);
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    if (this.state === 'STALK') {
      let diff = toPlayerAngle - this.facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(1.0, 5.0 * dt);

      // Physically slow down monster as more heavy high-voltage coils are cinched
      const wrapSpeedPenalty = Math.max(0.35, 1.0 - (this.completedWraps / this.maxWraps) * 0.65);
      const speed = (CONFIG.BOSS?.SPEED ?? 175) * wrapSpeedPenalty;
      this.vx = Math.cos(this.facingAngle) * speed;
      this.vy = Math.sin(this.facingAngle) * speed;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.x = Math.max(this.radius + 20, Math.min(CONFIG.WORLD.WIDTH - this.radius - 20, this.x));
      this.y = Math.max(this.radius + 20, Math.min(CONFIG.WORLD.HEIGHT - this.radius - 20, this.y));

      this.lungeCooldown -= dt;
      if (this.lungeCooldown <= 0 && distToPlayer < 750) {
        this.state = 'LUNGE_PREP';
        this.stateTimer = 0.8;
        this.vx = 0;
        this.vy = 0;
        return;
      }

      this.empCooldown -= dt;
      if (this.empCooldown <= 0) {
        this.state = 'EMP_CHARGE';
        this.stateTimer = 1.0;
        this.vx = 0;
        this.vy = 0;
        return;
      }
    } else if (this.state === 'LUNGE_PREP') {
      this.stateTimer -= dt;
      this.facingAngle = toPlayerAngle;

      if (Math.random() < 0.5) {
        game.particles.spawnSparks(this.x, this.y, 2, '#ff2a55');
      }

      if (this.stateTimer <= 0) {
        this.state = 'LUNGE_DASH';
        this.stateTimer = 0.65;
        const lungeSpeed = CONFIG.BOSS?.LUNGE_SPEED ?? 720;
        this.vx = Math.cos(this.facingAngle) * lungeSpeed;
        this.vy = Math.sin(this.facingAngle) * lungeSpeed;
        game.sound.playBossLunge();
        game.camera.shake(14, 0.35);
      }
    } else if (this.state === 'LUNGE_DASH') {
      this.stateTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.x = Math.max(this.radius, Math.min(CONFIG.WORLD.WIDTH - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(CONFIG.WORLD.HEIGHT - this.radius, this.y));

      if (distToPlayer < this.radius + player.radius + 10) {
        const damage = CONFIG.BOSS?.LUNGE_DAMAGE ?? 25;
        if (player.takeDamage(damage, this.vx * 0.5, this.vy * 0.5, game.sound, game.particles)) {
          game.triggerDamageFlash();
          game.updatePlayerHealthUI();
          game.camera.shake(22, 0.5);
          game.showTemporaryToast('💥 CORRUPTED BUG LUNGE ATTACK HIT! [-25 HP]');
        }
      }

      // Collide with server racks during high-speed lunge
      for (const rack of game.racks) {
        if (!rack.isDestroyed && !rack.isFailing && rack !== this.hostRack) {
          const clampX = Math.max(rack.x, Math.min(this.x, rack.x + rack.width));
          const clampY = Math.max(rack.y, Math.min(this.y, rack.y + rack.height));
          const dist = Math.hypot(this.x - clampX, this.y - clampY);
          if (dist < this.radius + 8) {
            game.triggerRackCrashFault(rack);
            game.camera.shake(12, 0.3);
            game.showTemporaryToast(`💥 BUG BOSS RAMMED INTO ${rack.id}! HARDWARE DAMAGE DETECTED!`, '💥');
          }
        }
      }

      if (this.stateTimer <= 0) {
        this.state = 'STALK';
        this.lungeCooldown = 4.5 + Math.random() * 2.5;
        this.vx = 0;
        this.vy = 0;
      }
    } else if (this.state === 'EMP_CHARGE') {
      this.stateTimer -= dt;
      if (Math.random() < 0.6) {
        game.particles.spawnSparks(this.x, this.y, 3, '#00f3ff');
      }

      if (this.stateTimer <= 0) {
        this.fireEMPBurst(game);
        this.state = 'STALK';
        this.empCooldown = 8.0 + Math.random() * 3.0;
      }
    }

    // Contact melee collision with player
    if (distToPlayer < this.radius + player.radius) {
      const damage = CONFIG.BOSS?.COLLISION_DAMAGE ?? 20;
      const pushX = Math.cos(toPlayerAngle) * 450;
      const pushY = Math.sin(toPlayerAngle) * 450;
      if (player.takeDamage(damage, pushX, pushY, game.sound, game.particles)) {
        game.triggerDamageFlash();
        game.updatePlayerHealthUI();
        game.camera.shake(15, 0.35);
        game.showTemporaryToast('⚠️ CORRUPTED CHASSIS CONTACT! [-20 HP]');
      }
    }

    if (this.flinchTimer > 0) {
      this.flinchTimer -= dt;
    }
  }

  fireEMPBurst(game) {
    game.sound.playExplosion();
    game.camera.shake(16, 0.4);
    const count = 8;
    const speed = 230;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      this.projectiles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        radius: 9,
        life: 3.6,
        maxLife: 3.6
      });
    }
    game.particles.spawnSparks(this.x, this.y, 35, '#00f3ff');
    game.showTemporaryToast('⚡ CORRUPTED STATIC EMP DISCHARGE! DODGE THE PACKETS!');
  }

  render(ctx, cam) {
    if (!this.isAlive) return;

    // 1. Render EMP Projectiles
    for (const p of this.projectiles) {
      const sPos = cam.toScreen(p.x, p.y);
      const pulse = 1.0 + 0.2 * Math.sin(this.animTime * 12);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, (p.radius + 4) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#00f3ff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, p.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    if (!cam.isBoundingBoxVisible(this.x - 120, this.y - 120, 240, 240)) {
      return;
    }

    const pos = cam.toScreen(this.x, this.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.facingAngle);

    if (this.state === 'LUNGE_PREP' || this.flinchTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 8;
      const shakeY = (Math.random() - 0.5) * 8;
      ctx.translate(shakeX, shakeY);
    }

    // 6 Articulated Mechanical Insect Legs
    const legCount = 3;
    const legSideSigns = [-1, 1];

    for (const side of legSideSigns) {
      for (let i = 0; i < legCount; i++) {
        const baseOffset = (i - 1) * 22;
        const phase = this.animTime * 11 + i * 1.8 + (side === 1 ? Math.PI : 0);
        const cycle = Math.sin(phase);

        const hipX = baseOffset;
        const hipY = side * 28;

        const kneeDist = 38 + cycle * 4;
        const kneeAngle = (side * Math.PI / 2) + (cycle * 0.25) - (i * 0.15 * side);
        const kneeX = hipX + Math.cos(kneeAngle) * kneeDist;
        const kneeY = hipY + Math.sin(kneeAngle) * kneeDist;

        const footDist = 32;
        const footAngle = kneeAngle + (side * 0.55);
        const footX = kneeX + Math.cos(footAngle) * footDist;
        const footY = kneeY + Math.sin(footAngle) * footDist;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        ctx.fillStyle = (this.state === 'LUNGE_PREP' || this.state === 'LUNGE_DASH') ? '#ff2a55' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff2a55';
        ctx.beginPath();
        ctx.arc(footX, footY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();

    // Abdomen
    ctx.beginPath();
    ctx.ellipse(-28, 0, 36, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let r = -48; r <= -14; r += 10) {
      ctx.beginPath();
      ctx.arc(r, 0, 16, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.strokeStyle = 'rgba(255, 42, 85, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Thorax
    ctx.beginPath();
    ctx.roundRect(-16, -24, 34, 48, 8);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const corePulse = 1.0 + 0.15 * Math.sin(this.animTime * 8);
    ctx.beginPath();
    ctx.arc(0, 0, 9 * corePulse, 0, Math.PI * 2);
    ctx.fillStyle = (this.state === 'LUNGE_PREP' || this.state === 'LUNGE_DASH') ? 'rgba(255, 42, 85, 0.75)' : 'rgba(0, 243, 255, 0.75)';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.moveTo(18, -16);
    ctx.lineTo(38, -8);
    ctx.lineTo(44, 0);
    ctx.lineTo(38, 8);
    ctx.lineTo(18, 16);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mandibles
    const pincerOpen = 0.25 + 0.18 * Math.sin(this.animTime * 14);
    ctx.save();
    ctx.translate(40, -6);
    ctx.rotate(-pincerOpen);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(14, -6, 22, -1);
    ctx.lineTo(16, 2);
    ctx.closePath();
    ctx.fillStyle = '#ff2a55';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(40, 6);
    ctx.rotate(pincerOpen);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(14, 6, 22, 1);
    ctx.lineTo(16, -2);
    ctx.closePath();
    ctx.fillStyle = '#ff2a55';
    ctx.fill();
    ctx.restore();

    // Eyes
    const eyeColor = (this.state === 'LUNGE_PREP' || this.state === 'LUNGE_DASH') ? '#ff003c' : '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(32, -9, 5, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(32, 9, 5, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = eyeColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Antennae
    const antTwitch = Math.sin(this.animTime * 16) * 0.15;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(34, -5);
    ctx.quadraticCurveTo(52, -18 + antTwitch * 12, 66, -14);
    ctx.stroke();
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(66, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(34, 5);
    ctx.quadraticCurveTo(52, 18 - antTwitch * 12, 66, 14);
    ctx.stroke();
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(66, 14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Physically render realistic coiled containment wire on top of monster carapace
    if (window.game?.activeCable instanceof ContainmentWire) {
      window.game.activeCable.renderCoilsOnBoss(ctx, cam);
    }

    // In-World Boss Overhead Readout (Sleek minimalist tag so view of monster & coils is clear)
    ctx.save();
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const text = `⚡ ${this.completedWraps}/${this.maxWraps} WRAPS`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(7, 10, 18, 0.75)';
    ctx.strokeStyle = this.completedWraps > 0 ? '#00ff9d' : '#ff2a55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pos.x - tw / 2 - 6, pos.y - this.radius - 20, tw + 12, 16, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.completedWraps > 0 ? '#00ff9d' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pos.x, pos.y - this.radius - 12);
    ctx.restore();
  }
}

// ============================================================================
// Rogue Small Cyber Bug Entity (Post-Boss Infestation / Dev Spawn)
// Crawls out of a server rack; scuttles across aisles to destroy target servers!
// If not crushed, it continuously travels to subsequent servers and destroys them!
// ============================================================================
class SmallBug {
  constructor(x, y, originRack, targetRack) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 15;
    this.speed = CONFIG.ERRORS?.SMALL_BUG_SPEED ?? 180;
    this.originRack = originRack;
    this.targetRack = targetRack;
    this.isAlive = true;
    this.isInsideRack = false;
    this.currentRack = null;
    this.animTime = Math.random() * 10;
    this.angle = 0;
    this.serversDestroyed = 0;
    this.trailTimer = 0;
    this.scuttlePhase = Math.random() * Math.PI * 2;
  }

  pickNextTarget(game) {
    if (!game || !game.racks) return;
    const candidates = game.racks.filter(r => !r.isDestroyed && (!this.currentRack || r.id !== this.currentRack.id));
    if (candidates.length > 0) {
      const uninfested = candidates.filter(r => !r.isFailing);
      const pool = uninfested.length > 0 ? uninfested : candidates;
      this.targetRack = pool[Math.floor(Math.random() * pool.length)];
    } else {
      this.targetRack = null;
    }
  }

  enterRack(hitRack, game) {
    if (!hitRack || hitRack.isDestroyed) {
      this.pickNextTarget(game);
      return;
    }
    this.isInsideRack = true;
    this.currentRack = hitRack;
    this.x = hitRack.x + hitRack.width / 2;
    this.y = hitRack.y + hitRack.height / 2;
    this.vx = 0;
    this.vy = 0;

    hitRack.triggerServerBugError(this.originRack || hitRack);
    if (hitRack.error) {
      hitRack.error.bugEntity = this;
      hitRack.error.bugTimer = CONFIG.ERRORS?.BUG_RACK_EXPLODE_TIME ?? 30.0;
    }

    if (game) {
      game.sound.playError();
      game.camera.shake(10, 0.3);
      game.particles.spawnSparks(this.x, this.y, 35, '#ff0055');
      game.particles.spawnSparks(this.x, this.y, 25, '#ffaa00');

      if (hitRack.isShutdown) {
        game.showTemporaryToast(
          `🛑 BUG ENTERED OFFLINE SERVER ${hitRack.id} AND IS TRAPPED! GO TO RACK & HOLD [E] TO TAKE IT OUT!`,
          '🛑'
        );
      } else {
        game.showTemporaryToast(
          `🐛 BUG WENT INTO SERVER ${hitRack.id}! [30s BEFORE EXPLOSION] ➔ TYPE PIN [${hitRack.code}] AT NOC DESK TO SHUT DOWN!`,
          '⚠️'
        );
      }
      game.updateObjectiveUI();
    }
  }

  update(player, dt, game) {
    if (!this.isAlive) return;

    // If inside a server, monitor the server
    if (this.isInsideRack) {
      if (!this.currentRack || this.currentRack.isDestroyed) {
        // Exploded: bug escapes to find a new server
        this.isInsideRack = false;
        if (this.currentRack) {
          this.x = this.currentRack.x + this.currentRack.width / 2;
          this.y = this.currentRack.y + this.currentRack.height / 2;
        }
        this.currentRack = null;
        this.pickNextTarget(game);
      }
      return;
    }

    this.animTime += dt;
    this.scuttlePhase += dt * 18;

    // If target rack is destroyed or missing, acquire the next available server
    if (!this.targetRack || this.targetRack.isDestroyed) {
      this.pickNextTarget(game);
    }

    let targetX = this.x;
    let targetY = this.y;

    if (this.targetRack) {
      targetX = this.targetRack.x + this.targetRack.width / 2;
      targetY = this.targetRack.y + this.targetRack.height / 2;
    } else {
      // Wander across center if no living servers remain
      targetX = CONFIG.WORLD.WIDTH / 2 + Math.cos(this.animTime * 0.5) * 800;
      targetY = CONFIG.WORLD.HEIGHT / 2 + Math.sin(this.animTime * 0.7) * 600;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;

    // Insects scuttle with natural lateral wiggle
    const baseAngle = Math.atan2(dy, dx);
    const wiggle = Math.sin(this.animTime * 14) * 0.35;
    this.angle = baseAngle + wiggle;

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep clamped within warehouse boundaries
    this.x = Math.max(30, Math.min(CONFIG.WORLD.WIDTH - 30, this.x));
    this.y = Math.max(30, Math.min(CONFIG.WORLD.HEIGHT - 30, this.y));

    // Toxic glitch spark trail behind scuttling bug
    this.trailTimer += dt;
    if (this.trailTimer >= 0.08) {
      this.trailTimer = 0;
      if (game && Math.random() < 0.6) {
        game.particles.spawnSparks(this.x, this.y, 1, Math.random() < 0.5 ? '#ff0055' : '#00ff9d');
      }
    }

    // 1. Check collision with Player: Player CRUSHES / SQUISHES the rogue bug!
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const crushMulti = player.hasSpikedBumper ? 1.8 : 1.0;
    const crushDistance = (player.radius + this.radius + 6) * crushMulti; // Generous squash hitbox

    if (distToPlayer <= crushDistance) {
      this.crush(player, game);
      return;
    }

    // 2. Check collision with Target Server Rack: Crawl inside and infest it!
    if (this.targetRack && !this.targetRack.isDestroyed) {
      const rackCenterX = this.targetRack.x + this.targetRack.width / 2;
      const rackCenterY = this.targetRack.y + this.targetRack.height / 2;
      const distToRack = Math.hypot(this.x - rackCenterX, this.y - rackCenterY);

      if (distToRack < 38 || 
          (this.x >= this.targetRack.x && this.x <= this.targetRack.x + this.targetRack.width &&
           this.y >= this.targetRack.y && this.y <= this.targetRack.y + this.targetRack.height)) {
        this.enterRack(this.targetRack, game);
      }
    }
  }

  crush(player, game) {
    this.isAlive = false;

    // Gold Combat synergy: crushing bug heals 15 HP!
    if (game.activeSynergies?.combat >= 3 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 15);
      game.updatePlayerHealthUI();
      game.particles.spawnSparks(player.x, player.y, 20, '#00ff9d');
    }

    // Crunch & squish audio
    if (game.sound?.playBugSquish) {
      game.sound.playBugSquish();
    } else {
      game.sound.playPlugSuccess();
    }

    // Heavy neon-cyber splat particles
    game.particles.spawnExplosion(this.x, this.y);
    game.particles.spawnSparks(this.x, this.y, 45, '#00ff9d');
    game.particles.spawnSparks(this.x, this.y, 35, '#ff0055');
    game.particles.spawnSparks(this.x, this.y, 25, '#ffe600');
    game.camera.shake(14, 0.35);

    // Reward Data Credits
    const reward = 85;
    game.addCredits(reward, `+${reward} ⚡ ROGUE CYBER BUG SQUISHED!`);

    game.showTemporaryToast(
      `💥 SQUISHED! Rogue Bug eliminated! Data center saved from further destruction! (+${reward} ⚡)`,
      '🥾'
    );
  }

  render(ctx, cam) {
    if (!this.isAlive || this.isInsideRack) return;

    const pos = cam.toScreen(this.x, this.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.angle);

    // Animated scuttling cyber legs (3 pairs)
    const legCount = 3;
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let i = 0; i < legCount; i++) {
      const offset = (i - 1) * 7;
      const legWave = Math.sin(this.scuttlePhase + i * 1.6) * 0.45;

      // Left leg
      ctx.beginPath();
      ctx.moveTo(offset, -6);
      const leftJointX = offset - 4;
      const leftJointY = -12 + legWave * 6;
      const leftTipX = offset - 10;
      const leftTipY = -18 + legWave * 8;
      ctx.quadraticCurveTo(leftJointX, leftJointY, leftTipX, leftTipY);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(offset, 6);
      const rightJointX = offset - 4;
      const rightJointY = 12 - legWave * 6;
      const rightTipX = offset - 10;
      const rightTipY = 18 - legWave * 8;
      ctx.quadraticCurveTo(rightJointX, rightJointY, rightTipX, rightTipY);
      ctx.stroke();
    }

    // Segmented Bug Body (Abdomen & Thorax)
    // Abdomen (rear)
    ctx.beginPath();
    ctx.ellipse(-7, 0, 11, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e081c';
    ctx.fill();
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Abdomen glowing hazard stripes
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.2;
    for (let s = -12; s <= -3; s += 4) {
      ctx.beginPath();
      ctx.moveTo(s, -5);
      ctx.lineTo(s, 5);
      ctx.stroke();
    }

    // Thorax (middle)
    ctx.beginPath();
    ctx.ellipse(3, 0, 8, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2b0c26';
    ctx.fill();
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Glowing core reactor
    const pulse = 0.8 + 0.25 * Math.sin(this.animTime * 12);
    ctx.beginPath();
    ctx.arc(3, 0, 3.5 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff9d';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.moveTo(8, -5);
    ctx.lineTo(15, -3);
    ctx.lineTo(17, 0);
    ctx.lineTo(15, 3);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fillStyle = '#160413';
    ctx.fill();
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing Red Eyes
    ctx.fillStyle = '#ff003c';
    ctx.beginPath();
    ctx.arc(13, -3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Twitching Antennae
    const antWave = Math.sin(this.animTime * 20) * 0.2;
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.quadraticCurveTo(20, -8 + antWave * 5, 25, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.quadraticCurveTo(20, 8 - antWave * 5, 25, 6);
    ctx.stroke();

    ctx.restore();

    // Overhead Alert Banner Tag in world space so player can immediately spot the scuttling bug!
    ctx.save();
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    const targetTag = this.targetRack ? `➔ TARGET: ${this.targetRack.id}` : 'STALKING';
    const tagText = `⚠️ ROGUE BUG (${targetTag})`;
    const tw = ctx.measureText(tagText).width;

    ctx.fillStyle = 'rgba(15, 3, 15, 0.88)';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pos.x - tw / 2 - 5, pos.y - this.radius - 22, tw + 10, 15, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff2a55';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, pos.x, pos.y - this.radius - 14);
    ctx.restore();
  }
}

// ============================================================================
// Thermal Golem Boss (Wave 2 - 20:00; Freeze Core with Cryo Canister, then Shatter!)
// ============================================================================
class ThermalGolemBoss {
  constructor(x, y, hostRack, variantLevel = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 52;
    this.hostRack = hostRack;
    this.isAlive = true;
    this.variantLevel = variantLevel;
    this.wave = 2 + variantLevel * 3;
    this.name = variantLevel === 0 ? 'OVERHEAT DAEMON' : `OVERHEAT DAEMON [V${variantLevel + 1}]`;
    this.title = 'DEFCON 1 OVERHEAT // ' + (variantLevel === 0 ? 'OVERHEAT DAEMON' : 'OVERHEAT DAEMON // INFERNAL PRIME');
    this.icon = '🔥';
    this.restraintName = 'CRYO CANISTER';
    this.color = variantLevel === 0 ? '#ff5500' : '#38bdf8';
    this.cableColor = '#00f3ff';
    this.glowColor = 'rgba(0, 243, 255, 0.45)';

    this.temperature = 1000 + variantLevel * 350;
    this.maxTemperature = this.temperature;
    this.isFrozen = false;
    this.flinchTimer = 0;

    this.state = 'EMERGING';
    this.stateTimer = 1.8;
    this.animTime = 0;
    this.facingAngle = 0;

    this.slamCooldown = 5.0 + Math.random() * 2;
    this.flameCooldown = 4.0 + Math.random() * 2;
    this.projectiles = []; // Flame jet embers
    this.shockwaves = [];  // Expanding molten slam rings
  }

  update(player, activeCable, dt, game) {
    if (!this.isAlive) return;
    this.animTime += dt;

    // 1. Frozen Solid State: Vulnerable to high-speed cart ramming or Kinetic Cannon shatter!
    if (this.isFrozen) {
      this.vx = 0;
      this.vy = 0;
      this.state = 'FROZEN_SOLID';

      // Ambient sub-zero mist
      if (Math.random() < 0.4) {
        game.particles.spawnSparks(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40, 1, '#00f3ff');
      }

      // Check collision with player cart
      const pDist = Math.hypot(player.x - this.x, player.y - this.y);
      if (pDist < this.radius + player.radius) {
        const pSpeed = Math.hypot(player.vx, player.vy);
        if (pSpeed > 260 || player.isCannonPuck) {
          // SHATTER THE FROZEN TITAN!
          game.camera.shake(38, 1.2);
          game.sound.playIceShatter();
          game.particles.spawnExplosion(this.x, this.y);
          game.particles.spawnSparks(this.x, this.y, 80, '#00f3ff');
          game.particles.spawnSparks(this.x, this.y, 80, '#ffffff');
          game.particles.spawnSparks(this.x, this.y, 60, '#38bdf8');
          game.showTemporaryToast('💥 CRITICAL THERMAL SHOCK! FROZEN GOLEM SHATTERED TO ICY RUBBLE!');
          game.defeatBoss(this);
          return;
        } else {
          // Low-speed nudge deflection
          const ang = Math.atan2(player.y - this.y, player.x - this.x);
          player.x = this.x + Math.cos(ang) * (this.radius + player.radius + 3);
          player.y = this.y + Math.sin(ang) * (this.radius + player.radius + 3);
          player.vx *= -0.5;
          player.vy *= -0.5;
          game.showTemporaryToast('❄️ GOLEM IS FROZEN SOLID! SLIDE AT HIGH SPEED TO SHATTER IT!', '❄️');
        }
      }
      return;
    }

    // 2. Active Cryo Spray Injection Check
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (game.hasCryoCanister && distToPlayer < 195 && (game.keys['KeyE'] || game.keys['Space'])) {
      this.temperature = Math.max(0, this.temperature - 260 * dt);
      this.flinchTimer = 0.25;

      if (Math.random() < 0.35) {
        game.sound.playCryoSpray();
        game.camera.shake(4, 0.1);
      }

      // Spray frost foam stream from player to golem
      const toGolem = Math.atan2(this.y - player.y, this.x - player.x);
      const sprayX = player.x + Math.cos(toGolem) * 20;
      const sprayY = player.y + Math.sin(toGolem) * 20;
      game.particles.spawnSparks(sprayX, sprayY, 3, '#00f3ff');
      game.particles.spawnSparks(this.x + (Math.random() - 0.5) * 45, this.y + (Math.random() - 0.5) * 45, 2, '#ffffff');
      game.updateBossHUD();

      if (this.temperature <= 0 && !this.isFrozen) {
        this.isFrozen = true;
        this.state = 'FROZEN_SOLID';
        this.vx = 0;
        this.vy = 0;
        game.sound.playIceShatter();
        game.camera.shake(24, 0.6);
        game.showTemporaryToast('❄️ THERMAL GOLEM FROZEN SOLID AT 0°C! RAM CART AT SPEED TO SHATTER!', '❄️');
        game.updateBossHUD();
        return;
      }
    }

    // Update Flame Jet Embers
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      const pDist = Math.hypot(player.x - p.x, player.y - p.y);
      if (pDist < player.radius + p.radius) {
        if (player.takeDamage(18, p.vx * 0.35, p.vy * 0.35, game.sound, game.particles)) {
          game.triggerDamageFlash();
          game.updatePlayerHealthUI();
          game.camera.shake(12, 0.3);
          game.showTemporaryToast('🔥 HIT BY MOLTEN FLAME JET! [-18 HP]');
        }
        p.life = 0;
      }
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }

    // Update Expanding Molten Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += sw.speed * dt;
      sw.life -= dt;

      const pDist = Math.hypot(player.x - sw.x, player.y - sw.y);
      if (!sw.hasHitPlayer && Math.abs(pDist - sw.r) < 26) {
        if (player.takeDamage(26, Math.cos(this.facingAngle) * 400, Math.sin(this.facingAngle) * 400, game.sound, game.particles)) {
          game.triggerDamageFlash();
          game.updatePlayerHealthUI();
          game.camera.shake(18, 0.45);
          game.showTemporaryToast('💥 HIT BY MOLTEN SLAM SHOCKWAVE! [-26 HP]');
        }
        sw.hasHitPlayer = true;
      }
      if (sw.life <= 0 || sw.r >= sw.maxR) this.shockwaves.splice(i, 1);
    }

    if (this.state === 'EMERGING') {
      this.stateTimer -= dt;
      if (Math.random() < 0.5) game.particles.spawnSparks(this.x, this.y, 4, '#ff5500');
      if (this.stateTimer <= 0) {
        this.state = 'STALK';
        game.sound.playBossRoar();
        game.camera.shake(22, 0.7);
      }
      return;
    }

    const toPlayerAngle = Math.atan2(player.y - this.y, player.x - this.x);

    if (this.state === 'STALK') {
      let diff = toPlayerAngle - this.facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(1.0, 4.0 * dt);

      // Slower as temperature drops
      const frostPenalty = Math.max(0.35, this.temperature / 1000);
      const speed = 165 * frostPenalty;
      this.vx = Math.cos(this.facingAngle) * speed;
      this.vy = Math.sin(this.facingAngle) * speed;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.x = Math.max(this.radius + 20, Math.min(CONFIG.WORLD.WIDTH - this.radius - 20, this.x));
      this.y = Math.max(this.radius + 20, Math.min(CONFIG.WORLD.HEIGHT - this.radius - 20, this.y));

      this.slamCooldown -= dt;
      if (this.slamCooldown <= 0 && distToPlayer < 450) {
        this.state = 'SLAM_PREP';
        this.stateTimer = 0.9;
        this.vx = 0;
        this.vy = 0;
        return;
      }

      this.flameCooldown -= dt;
      if (this.flameCooldown <= 0 && distToPlayer < 650) {
        this.state = 'FLAME_JET';
        this.stateTimer = 1.0;
        this.vx = 0;
        this.vy = 0;
        this.fireFlameJet(game);
        return;
      }
    } else if (this.state === 'SLAM_PREP') {
      this.stateTimer -= dt;
      if (Math.random() < 0.6) game.particles.spawnSparks(this.x, this.y, 4, '#ffaa00');
      if (this.stateTimer <= 0) {
        this.executeMoltenSlam(game);
        this.state = 'STALK';
        this.slamCooldown = 6.0 + Math.random() * 2.5;
      }
    } else if (this.state === 'FLAME_JET') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'STALK';
        this.flameCooldown = 5.0 + Math.random() * 2.5;
      }
    }

    // Contact melee collision while molten
    if (distToPlayer < this.radius + player.radius) {
      const pushX = Math.cos(toPlayerAngle) * 450;
      const pushY = Math.sin(toPlayerAngle) * 450;
      if (player.takeDamage(22, pushX, pushY, game.sound, game.particles)) {
        game.triggerDamageFlash();
        game.updatePlayerHealthUI();
        game.camera.shake(16, 0.4);
        game.showTemporaryToast('🔥 MAGMA CHASSIS CONTACT! [-22 HP]');
      }
    }

    if (this.flinchTimer > 0) this.flinchTimer -= dt;
  }

  executeMoltenSlam(game) {
    game.sound.playExplosion();
    game.camera.shake(24, 0.6);
    this.shockwaves.push({
      x: this.x,
      y: this.y,
      r: 20,
      maxR: 260,
      speed: 340,
      life: 0.8,
      hasHitPlayer: false,
    });
    game.particles.spawnSparks(this.x, this.y, 45, '#ff4500');
    game.particles.spawnSparks(this.x, this.y, 30, '#ffaa00');
    game.showTemporaryToast('💥 THERMAL GOLEM EXECUTED MOLTEN SLAM! DODGE THE SHOCKWAVE!');
  }

  fireFlameJet(game) {
    game.sound.playNitrousBurn();
    const count = 10;
    const baseAngle = this.facingAngle;
    for (let i = 0; i < count; i++) {
      const spread = (i - count / 2) * 0.1;
      const ang = baseAngle + spread;
      const spd = 260 + Math.random() * 80;
      this.projectiles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 8,
        life: 2.2,
      });
    }
  }

  render(ctx, cam) {
    if (!this.isAlive) return;

    // Render Shockwaves
    for (const sw of this.shockwaves) {
      const sPos = cam.toScreen(sw.x, sw.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.7)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, sw.r * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // Render Flame Embers
    for (const p of this.projectiles) {
      const sPos = cam.toScreen(p.x, p.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, p.radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaa00';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sPos.x, sPos.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    if (!cam.isBoundingBoxVisible(this.x - 130, this.y - 130, 260, 260)) return;
    const pos = cam.toScreen(this.x, this.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.facingAngle);

    if (this.state === 'SLAM_PREP' || this.flinchTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    const frostPct = 1.0 - (this.temperature / 1000);

    // Molten Basalt Armor Plates shifting to Frosted Glacial Shell
    const pulse = 1.0 + 0.08 * Math.sin(this.animTime * 8);
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.radius);

    if (this.isFrozen) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#00f3ff');
      grad.addColorStop(0.8, '#0284c7');
      grad.addColorStop(1, '#0c4a6e');
    } else {
      const r = Math.round(255 * (1 - frostPct * 0.6));
      const g = Math.round(170 * (1 - frostPct * 0.8) + 243 * (frostPct * 0.6));
      const b = Math.round(255 * frostPct);
      grad.addColorStop(0, frostPct > 0.6 ? '#ffffff' : '#ffedd5');
      grad.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(0.7, frostPct > 0.5 ? '#0369a1' : '#ff4500');
      grad.addColorStop(1, '#1c1917');
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Jagged Basalt Shell
    ctx.strokeStyle = this.isFrozen ? '#0284c7' : '#1c1917';
    ctx.lineWidth = 9;
    ctx.stroke();

    // Floating Rock Shoulders
    const shoulderOff = 34;
    ctx.fillStyle = this.isFrozen ? '#0369a1' : '#1c1917';
    ctx.beginPath();
    ctx.arc(-10, -shoulderOff, 18, 0, Math.PI * 2);
    ctx.arc(-10, shoulderOff, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.isFrozen ? '#00f3ff' : '#ff4500';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = this.isFrozen ? '#00f3ff' : '#ff4500';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(24, -12, 5, 0, Math.PI * 2);
    ctx.arc(24, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Creeping Cryo Frost Crystals
    if (frostPct > 0.05) {
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4 + frostPct * 6;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.9, -Math.PI * frostPct, Math.PI * frostPct);
      ctx.stroke();

      ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * frostPct, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // In-World Overhead Readout
    ctx.save();
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const tagText = this.isFrozen ? '❄️ FROZEN SOLID [RAM TO SHATTER!]' : `🔥 ${Math.round(this.temperature)}°C / 1000°C`;
    const tw = ctx.measureText(tagText).width;
    ctx.fillStyle = 'rgba(7, 10, 18, 0.85)';
    ctx.strokeStyle = this.isFrozen ? '#00f3ff' : '#ff4500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pos.x - tw / 2 - 8, pos.y - this.radius - 22, tw + 16, 16, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.isFrozen ? '#00f3ff' : '#ffedd5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, pos.x, pos.y - this.radius - 14);
    ctx.restore();
  }
}

// ============================================================================
// Major Virus Boss Entity (Wave 3 - 30:00; Overtakes Computers; Quarantine Containment Zone)
// ============================================================================
class MajorVirusBoss {
  constructor(x, y, hostRack, variantLevel = 0) {
    this.x = x;
    this.y = y;
    this.hostRack = hostRack;
    this.variantLevel = variantLevel;
    this.isAlive = true;
    this.radius = 50;
    this.speed = 120 + variantLevel * 20;
    this.color = variantLevel === 0 ? '#10b981' : (variantLevel === 1 ? '#a855f7' : '#e11d48');
    this.name = variantLevel === 0 ? 'MAJOR VIRUS' : `MAJOR VIRUS [V${variantLevel + 1}]`;
    this.title = 'DEFCON 1 BIOLOGICAL // ' + (variantLevel === 0 ? 'MAJOR VIRUS' : 'MAJOR VIRUS // APEX MUTANT STRAIN');
    this.icon = '🦠';
    this.restraintName = 'QUARANTINE CONTAINMENT BARRIER';

    this.infectedRacks = [hostRack];
    hostRack.isVirusInfected = true;
    this.infectionInterval = Math.max(8.0, 14.0 - variantLevel * 2.5);
    this.infectionTimer = this.infectionInterval;

    this.pulseAnim = 0;
    this.tentacles = [];
    for (let i = 0; i < 10; i++) {
      this.tentacles.push({ angle: (i / 10) * Math.PI * 2, length: 32 + Math.random() * 28, phase: Math.random() * Math.PI * 2 });
    }
    this.isQuarantined = false;
    this.quarantineProgress = 0;
    this.attackCooldown = 2.5;
    this.quarantineTrail = [];
  }

  update(player, activeCable, dt, game) {
    if (!this.isAlive) return;
    this.pulseAnim += dt * 3.5;

    this.tentacles.forEach(t => {
      t.phase += dt * 4.0;
    });

    // Slowly drift around infected cluster center
    let avgX = 0, avgY = 0;
    this.infectedRacks.forEach(r => {
      avgX += r.x + r.width / 2;
      avgY += r.y + r.height / 2;
    });
    avgX /= this.infectedRacks.length;
    avgY /= this.infectedRacks.length;

    const dx = avgX - this.x;
    const dy = avgY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 15) {
      this.x += (dx / dist) * this.speed * 0.45 * dt;
      this.y += (dy / dist) * this.speed * 0.45 * dt;
    }

    // Spawn toxic slime droplets
    if (game && Math.random() < 0.4) {
      game.particles.particles.push({
        x: this.x + (Math.random() - 0.5) * this.radius * 1.5,
        y: this.y + (Math.random() - 0.5) * this.radius * 1.5,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.8,
        decay: 1.2,
        color: Math.random() < 0.5 ? this.color : '#a855f7',
        size: 3 + Math.random() * 3
      });
    }

    // Spread infection to adjacent living uninfected computers
    this.infectionTimer -= dt;
    if (this.infectionTimer <= 0) {
      this.infectionTimer = this.infectionInterval;
      this.spreadInfection(game);
    }

    // Damage player on direct contact
    if (game && game.player) {
      const pDist = Math.hypot(this.x - game.player.x, this.y - game.player.y);
      if (pDist < this.radius + 20) {
        game.damagePlayer(15, 'VIRUS SLIME CONTACT');
      }
    }

    // If player is holding quarantine barrier line, record trail points
    if (game && game.hasQuarantineBarrier && game.player) {
      const trail = this.quarantineTrail;
      const p = { x: game.player.x, y: game.player.y };
      if (trail.length === 0 || Math.hypot(p.x - trail[trail.length - 1].x, p.y - trail[trail.length - 1].y) > 25) {
        trail.push(p);
        if (trail.length > 200) trail.shift();
      }

      // Check if loop has encircled the infected racks
      this.checkQuarantineLoop(game);
    }
  }

  spreadInfection(game) {
    if (!game) return;
    const uninfected = game.racks.filter(r => !r.isDestroyed && !this.infectedRacks.some(ir => ir.id === r.id));
    if (uninfected.length === 0) return;

    let closest = null;
    let minDist = Infinity;
    for (const r of uninfected) {
      for (const ir of this.infectedRacks) {
        const d = Math.hypot(r.x - ir.x, r.y - ir.y);
        if (d < minDist) {
          minDist = d;
          closest = r;
        }
      }
    }

    if (closest && minDist < 650) {
      this.infectedRacks.push(closest);
      closest.isVirusInfected = true;
      if (game.sound) game.sound.playError();
      if (game.particles) {
        game.particles.spawnSparks(closest.x + closest.width / 2, closest.y + closest.height / 2, 30, this.color);
      }
      game.showTemporaryToast(`🦠 VIRUS OVERTOOK RACK ${closest.id}! (${this.infectedRacks.length} INFECTED NODES)`, '🦠');
      game.updateBossHUD();
    }
  }

  checkQuarantineLoop(game) {
    if (!this.isAlive || this.isQuarantined || !this.quarantineTrail || this.quarantineTrail.length < 15) return false;

    // Check if the quarantine trail bounds all infected racks
    const trail = this.quarantineTrail;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    trail.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    // Check if loop closure is near
    const first = trail[0];
    const last = trail[trail.length - 1];
    const loopClosed = Math.hypot(last.x - first.x, last.y - first.y) < 120 && trail.length > 20;

    // Verify all infected racks lie within the boundary
    const allEnclosed = this.infectedRacks.every(rack => {
      const rx = rack.x + rack.width / 2;
      const ry = rack.y + rack.height / 2;
      return rx >= minX - 40 && rx <= maxX + 40 && ry >= minY - 40 && ry <= maxY + 40;
    });

    if (loopClosed && allEnclosed) {
      this.sealQuarantine(game);
      return true;
    }
    return false;
  }

  sealQuarantine(game) {
    this.isQuarantined = true;
    this.isAlive = false;
    if (game.sound && game.sound.playQuarantineSeal) game.sound.playQuarantineSeal();
    if (game.sound) game.sound.playPlugSuccess();

    if (game.camera) game.camera.shake(28, 0.9);

    // Cleanse all infected racks
    this.infectedRacks.forEach(r => {
      r.isVirusInfected = false;
      r.uptime = 100;
      if (game.particles) {
        game.particles.spawnSparks(r.x + r.width / 2, r.y + r.height / 2, 45, '#00ff9d');
        game.particles.spawnSparks(r.x + r.width / 2, r.y + r.height / 2, 25, '#00f3ff');
      }
    });

    if (game.particles) {
      game.particles.spawnExplosion(this.x, this.y);
      game.particles.spawnSparks(this.x, this.y, 90, this.color);
    }

    game.hasQuarantineBarrier = false;
    this.quarantineTrail = [];
    game.defeatBoss();
    game.showTemporaryToast('🛡️ QUARANTINE ZONE SEALED! MAJOR VIRUS PURGED & ALL NODES DISINFECTED!', '🦠');
  }

  render(ctx, cam) {
    if (!this.isAlive) return;
    const pos = cam.toScreen(this.x, this.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Pulsing virus aura
    const pulse = 1.0 + Math.sin(this.pulseAnim) * 0.12;
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, this.radius * pulse * 1.4);
    grad.addColorStop(0, this.color);
    grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Wiggling slime tentacles
    this.tentacles.forEach(t => {
      const len = t.length * pulse;
      const angle = t.angle + Math.sin(t.phase) * 0.35;
      const tx = Math.cos(angle) * len;
      const ty = Math.sin(angle) * len;
      const cpx = Math.cos(angle + 0.3) * (len * 0.6);
      const cpy = Math.sin(angle + 0.3) * (len * 0.6);

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      ctx.stroke();

      // Droplet at tentacle tip
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Core bio-cyber nucleus
    ctx.fillStyle = '#062817';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.75 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing biohazard eyes / nodes
    const eyeAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    eyeAngles.forEach(ea => {
      const ex = Math.cos(ea) * (this.radius * 0.4);
      const ey = Math.sin(ea) * (this.radius * 0.4);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();

    // Render quarantine trail if player is drawing it
    if (this.quarantineTrail && this.quarantineTrail.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      const firstPt = cam.toScreen(this.quarantineTrail[0].x, this.quarantineTrail[0].y);
      ctx.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < this.quarantineTrail.length; i++) {
        const pt = cam.toScreen(this.quarantineTrail[i].x, this.quarantineTrail[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Canonical 3 Boss Entities: BugBoss, ThermalGolemBoss (Overheat Daemon), MajorVirusBoss

// ============================================================================
class PatchDroneEntity {
  constructor(player) {
    this.player = player;
    this.x = player.x;
    this.y = player.y - 45;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.animTime = 0;
  }

  update(dt, game) {
    this.animTime += dt;

    // Follow player with gentle float offset
    const targetX = this.player.x + Math.cos(this.animTime * 2) * 36;
    const targetY = this.player.y - 40 + Math.sin(this.animTime * 3) * 16;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.vx = dx * 6.0;
    this.vy = dy * 6.0;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Assist with rebooting rack if nearby
    if (game.rebootingRack && Math.hypot(this.x - game.rebootingRack.x, this.y - game.rebootingRack.y) < 220) {
      game.rebootHoldTime += dt * 0.35; // Drone speeds up reboot hold!
      if (Math.random() < 0.25) {
        game.particles.spawnSparks(game.rebootingRack.x + 29, game.rebootingRack.y + 46, 2, '#00f3ff');
      }
    }
  }

  render(ctx, cam) {
    const sPos = cam.toScreen(this.x, this.y);
    ctx.save();
    ctx.translate(sPos.x, sPos.y);

    // Thruster glow
    ctx.beginPath();
    ctx.arc(0, 10, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.45)';
    ctx.fill();

    // Chassis body
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sensor Eye
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff9d';
    ctx.fill();

    // Spinning Micro-Antenna
    const spin = this.animTime * 15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(spin) * 14, -8);
    ctx.lineTo(-Math.cos(spin) * 14, -8);
    ctx.stroke();

    ctx.restore();
  }
}

// ============================================================================
// Game Controller
// ============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.alertContainer = document.getElementById('alert-indicators-container');

    // HUD Elements
    this.speedReadout = document.getElementById('speed-readout');
    this.alertCountReadout = document.getElementById('alert-count');
    this.uptimeFill = document.getElementById('uptime-fill');
    this.uptimeVal = document.getElementById('uptime-val');
    this.memoCodeVal = document.getElementById('memo-code-val');
    this.creditsVal = document.getElementById('credits-val');
    this.activeBuffsContainer = document.getElementById('active-buffs-container');
    this.threatBadge = document.getElementById('threat-level-badge');

    // Player Health & Boss Encounter Elements
    this.hpFill = document.getElementById('hp-fill');
    this.hpVal = document.getElementById('hp-val');
    this.bossHudBanner = document.getElementById('boss-hud-banner');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossStatusText = document.getElementById('boss-status-text');
    this.bossCoilsTrack = document.getElementById('boss-coils-track');
    this.bossCoilsCount = document.getElementById('boss-coils-count');
    this.damageVignette = document.getElementById('damage-vignette');

    // Telemetry Stats Modal Elements
    this.statsModal = document.getElementById('stats-modal');
    this.statsHpVal = document.getElementById('stats-hp-val');
    this.statsHpFill = document.getElementById('stats-hp-fill');
    this.statsUptimeVal = document.getElementById('stats-uptime-val');
    this.statsUptimeFill = document.getElementById('stats-uptime-fill');
    this.statsCreditsVal = document.getElementById('stats-credits-val');
    this.statsFpsVal = document.getElementById('stats-fps-val');
    this.statsSpeedVal = document.getElementById('stats-speed-val');
    this.statsFaultsVal = document.getElementById('stats-faults-val');
    this.isStatsOpen = false;
    this.lowHealthWarned = false;

    // Boss State & Progressive Waves
    this.activeBoss = null;
    this.bugBoss = null;
    this.bossSpawned = false;
    this.bossHostRack = null;
    this.bossDefeatedOnce = false;
    this.currentBossWave = 0;
    this.smallBugs = [];
    this.patchDrone = null;

    // Bottom In-Game Notification Toast (Between Drop Cable & Shop)
    this.notificationToast = document.getElementById('notification-toast');
    this.notificationToastText = document.getElementById('notification-toast-text');
    this.notificationToastIcon = document.getElementById('notification-toast-icon');
    this._toastTimeout = null;

    // Terminal Modal Elements
    this.terminalModal = document.getElementById('terminal-modal');
    this.terminalSelect = document.getElementById('terminal-rack-select');
    this.terminalCountdownVal = document.getElementById('terminal-countdown-val');
    this.terminalCountdownFill = document.getElementById('terminal-countdown-fill');
    this.terminalDigits = document.getElementById('terminal-input-display');
    this.terminalFeedback = document.getElementById('terminal-feedback');
    this.terminalInputBuffer = '';
    this.terminalShutdownPanel = document.getElementById('terminal-shutdown-panel');
    this.btnTerminalShutdown = document.getElementById('btn-terminal-shutdown');
    this.terminalKeypad = document.getElementById('terminal-keypad');

    // Shop Modal Elements
    this.shopModal = document.getElementById('shop-modal');
    this.shopCreditsDisplay = document.getElementById('shop-credits-display');

    // Main Menu, Pause & Operations Manual Elements
    this.hudOverlay = document.getElementById('hud-overlay');
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.isTutorialOpen = false;
    this.currentTutorialStep = 0;
    this.totalTutorialSteps = 8;
    this.gameState = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'COUNTDOWN' | 'GAME_OVER'

    // Run Save & Load System Elements
    this.saveFileInput = document.getElementById('save-file-input');
    this.runPreviewModal = document.getElementById('run-preview-modal');
    this.previewShiftTime = document.getElementById('preview-shift-time');
    this.previewRacksHealth = document.getElementById('preview-racks-health');
    this.previewActiveFaults = document.getElementById('preview-active-faults');
    this.previewCredits = document.getElementById('preview-credits');
    this.previewBossWave = document.getElementById('preview-boss-wave');
    this.previewSaveDate = document.getElementById('preview-save-date');
    this.previewPowerupsList = document.getElementById('preview-powerups-list');
    this.btnConfirmLoadRun = document.getElementById('btn-confirm-load-run');
    this.btnCancelLoadRun = document.getElementById('btn-cancel-load-run');
    this.btnClosePreview = document.getElementById('btn-close-preview');
    this.pendingLoadedRunData = null;

    // 3-Second Resume Countdown Overlay
    this.resumeCountdownOverlay = document.getElementById('resume-countdown-overlay');
    this.countdownNumber = document.getElementById('countdown-number');
    this.isResumingFromSave = false;
    this.resumeCountdownTimer = 0;

    // Game Over & Leaderboard Elements
    this.gameOverModal = document.getElementById('game-over-modal');
    this.goDuration = document.getElementById('go-duration');
    this.goBosses = document.getElementById('go-bosses');
    this.goCredits = document.getElementById('go-credits');
    this.goRecord = document.getElementById('go-record');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.leaderboardTbody = document.getElementById('leaderboard-tbody');
    this.isGameOver = false;

    // Post-boss errors state
    this.activeServerBug = null; // Currently creeping rogue server bug
    this.shakingRack = null;
    this.shakeHoldTime = 0;
    this.disinfectingRack = null;
    this.disinfectHoldTime = 0;

    // Unique Quantum Teleporter Item (Boss Defeat Reward)
    this.hasTeleporterItem = false;
    this.teleporterNodes = []; // Array of TeleporterNode (Max 2: Alpha & Beta)
    this.teleportCooldown = 0;

    this.sound = new SoundFX();
    this.particles = new ParticleSystem();

    // System Settings & Performance Configuration
    this.settingsModal = document.getElementById('settings-modal');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnPauseSettings = document.getElementById('btn-pause-settings');
    this.btnMenuSettings = document.getElementById('btn-menu-settings');
    this.settingTogglePerf = document.getElementById('setting-toggle-perf');
    this.settingToggleFps = document.getElementById('setting-toggle-fps');
    this.settingToggleCrt = document.getElementById('setting-toggle-crt');
    this.settingToggleDev = document.getElementById('setting-toggle-dev');
    this.perfStatusDot = document.getElementById('perf-status-dot');
    this.perfStatusText = document.getElementById('perf-status-text');
    this.fpsCard = document.getElementById('fps-card');
    this.fpsVal = document.getElementById('fps-val');
    this.crtOverlay = document.querySelector('.crt-overlay');

    this.isSettingsOpen = false;
    this.isOptimizedMode = localStorage.getItem('cabled_in_perf_mode') === 'true';
    this.showFpsMeter = localStorage.getItem('cabled_in_show_fps') !== 'false';
    this.crtFilterEnabled = localStorage.getItem('cabled_in_crt_filter') !== 'false';
    this.isDevMode = localStorage.getItem('cabled_in_dev_mode') === 'true';

    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    this.currentFps = 60;
    this.lowFpsStreak = 0;
    this.hasWarnedLowFps = false;
    this.floorPattern = null;

    this.isPaused = false;
    this.isTerminalOpen = false;
    this.isShopOpen = false;
    this.lastTime = performance.now();
    this.gameTime = 0; // Elapsed gameplay time for dynamic difficulty
    this.keys = {};

    this.player = new Player(CONFIG.WORLD.WIDTH / 2, CONFIG.WORLD.HEIGHT / 2);
    this.camera = new Camera2D(window.innerWidth, window.innerHeight);

    // Kinetic Cannon Slingshot & Air Hockey Puck State
    this.cannonCharges = 1; // 1 Free starter charge for testing/delight!
    this.isCannonAiming = false;
    this.aimAngle = 0;
    this.aimAnimOffset = 0;
    this.cannonPuckTimer = 0;
    this.mouseScreenX = window.innerWidth / 2;
    this.mouseScreenY = window.innerHeight / 2;

    // Bottom Stations: Master NOC Console, IT Supply Kiosk, and Facility Supplies Closet
    this.nocDesk = new NOCTerminalStation(
      CONFIG.WORLD.WIDTH / 2 - 120,
      CONFIG.WORLD.HEIGHT - 170,
      240,
      74
    );

    this.shopKiosk = new ShopKioskStation(
      CONFIG.WORLD.WIDTH / 2 + 420,
      CONFIG.WORLD.HEIGHT - 170,
      180,
      74
    );

    this.suppliesCloset = new SuppliesClosetStation(
      CONFIG.WORLD.WIDTH / 2 - 600,
      CONFIG.WORLD.HEIGHT - 170,
      180,
      74
    );

    // Facility Supplies Closet & Boss Emergency Gear State
    this.suppliesModal = document.getElementById('supplies-modal');
    this.isSuppliesModalOpen = false;
    this.hasCryoCanister = false;
    this.isCryoSpraying = false;
    this.emfPylonsRemaining = 0;
    this.deployedPylons = []; // Array of EMFGroundingPylon
    this.scramLimpetsRemaining = 0;
    this.adrenalineTimer = 0;

    this.racks = [];
    this.connectedCables = [];
    this.activeCable = null;
    this.incidentTimer = 0;
    this.dividendTimer = 0;
    this.activeCodeMemo = null;
    this.unlockedErrors = new Set();

    // Hard reboot hold state
    this.rebootingRack = null;
    this.rebootHoldTime = 0.0;

    // Currency, Powerup Purchases & Permanent Upgrades
    this.credits = 100; // Starting credit balance
    this.energyDrinkPurchases = 0;
    this.magnetPurchases = 0;
    this.powerupMaxLimitBonus = 0;
    this.shopClearanceLevel = 0;
    this.hasPortableTerminal = false;
    this.portableTerminal = null;
    this.isBossRewardOpen = false;
    this.bossRewardModal = document.getElementById('boss-reward-modal');
    this.activeBuffs = {
      nitro: 0,
      grip: 0,
    };

    // Build Synergies & Shop State
    this.activeSynergies = {
      drift: 0,
      combat: 0,
      netops: 0,
    };
    this.hasYieldBonds = false;
    this.shopCategory = 'all';
    this.shopSynergyText = document.getElementById('shop-synergy-text');

    this.initWarehouseMap();
    this.initEventListeners();
    this.initTerminalMinigame();
    this.initShopModal();
    this.initSuppliesModal();
    this.initBossRewardModal();
    this.initMenuAndTutorial();
    this.checkLocalQuickSave();
    this.applySettings(false);
    this.resizeCanvas();
    this.updateCreditsUI();
    this.updateBuffDisplay();

    // Initially hide HUD overlay while on Main Menu
    if (this.hudOverlay) this.hudOverlay.classList.add('hidden');

    requestAnimationFrame(this.loop.bind(this));
  }

  initWarehouseMap() {
    const { ROW_SPACING_X, RACK_SPACING_Y, AISLE_BREAK_EVERY, WIDTH, HEIGHT } = CONFIG.RACKS;
    let idCounter = 1;

    for (let x = 320; x < CONFIG.WORLD.WIDTH - 320; x += ROW_SPACING_X) {
      let rowIndex = 0;
      for (let y = 260; y < CONFIG.WORLD.HEIGHT - 320; y += RACK_SPACING_Y) {
        rowIndex++;
        if (rowIndex % AISLE_BREAK_EVERY === 0) {
          continue;
        }

        const rack = new ServerRack(
          `RACK-${String(idCounter++).padStart(2, '0')}`,
          x,
          y,
          WIDTH,
          HEIGHT
        );
        this.racks.push(rack);
      }
    }

    this.triggerCableError();
    this.triggerAuthLockoutError();
  }

  // ==========================================================================
  // Health & Combat System
  // ==========================================================================
  updatePlayerHealthUI() {
    if (this.hpVal) {
      this.hpVal.textContent = `${Math.max(0, Math.ceil(this.player.hp))} HP`;
    }
    if (this.hpFill) {
      const pct = Math.max(0, Math.min(100, this.player.hp));
      this.hpFill.style.width = `${pct}%`;
      this.hpFill.classList.remove('warning', 'danger');
      if (pct <= 30) {
        this.hpFill.classList.add('danger');
      } else if (pct <= 60) {
        this.hpFill.classList.add('warning');
      }
    }
    if (this.statsHpVal) {
      this.statsHpVal.textContent = `${Math.max(0, Math.ceil(this.player.hp))} / 100 HP`;
    }
    if (this.statsHpFill) {
      const pct = Math.max(0, Math.min(100, this.player.hp));
      this.statsHpFill.style.width = `${pct}%`;
      this.statsHpFill.classList.remove('warning', 'danger');
      if (pct <= 30) {
        this.statsHpFill.classList.add('danger');
      } else if (pct <= 60) {
        this.statsHpFill.classList.add('warning');
      }
    }

    // Low Health Warning (<= 25 HP): 3-second notification
    if (this.player.hp <= 25 && this.player.hp > 0) {
      if (!this.lowHealthWarned) {
        this.lowHealthWarned = true;
        this.showTemporaryToast('⚠️ CRITICAL HEALTH INTEGRITY: LOW HP WARNING!', 3000);
      }
    } else if (this.player.hp > 25) {
      this.lowHealthWarned = false;
    }
  }

  triggerDamageFlash() {
    if (!this.damageVignette) return;
    this.damageVignette.classList.add('flash');
    setTimeout(() => {
      this.damageVignette?.classList.remove('flash');
    }, 120);
  }

  respawnPlayerAtNOC() {
    this.player.hp = 75; // Emergency battery restore
    this.player.invulnerableTimer = 3.2; // 3.2s invulnerability buffer
    this.player.x = this.nocDesk.x + this.nocDesk.width / 2;
    this.player.y = this.nocDesk.y - 35;
    this.player.vx = 0;
    this.player.vy = 0;
    this.dropActiveCable();
    this.sound.playTerminalFail();
    this.camera.shake(20, 0.5);
    this.triggerDamageFlash();
    this.updatePlayerHealthUI();
    this.showTemporaryToast('⚠️ SYSTEM FAILURE // AUTOMATED DEFIBRILLATOR REBOOTED CART AT SOUTH NOC DESK!');
  }

  // ==========================================================================
  // Corrupted Bug Boss Encounter System
  // ==========================================================================
  spawnBoss(waveNumber = 1, isDevShortcut = false) {
    if (this.activeBoss && this.activeBoss.isAlive) {
      this.showTemporaryToast(`⚠️ ${this.activeBoss.name} ALREADY ACTIVE ON WAREHOUSE FLOOR!`);
      return;
    }

    // Pick a non-destroyed server rack near the center
    const availableRacks = this.racks.filter(r => !r.isDestroyed);
    if (availableRacks.length === 0) return;

    availableRacks.sort((a, b) => {
      const distA = Math.hypot(a.x - CONFIG.WORLD.WIDTH / 2, a.y - CONFIG.WORLD.HEIGHT / 2);
      const distB = Math.hypot(b.x - CONFIG.WORLD.WIDTH / 2, b.y - CONFIG.WORLD.HEIGHT / 2);
      return distA - distB;
    });

    const hostRack = availableRacks[0];
    this.bossHostRack = hostRack;
    hostRack.isBossHost = true;

    // Spawn boss
    const spawnX = hostRack.x + hostRack.width / 2;
    const spawnY = hostRack.y + hostRack.height + 70;

    this.currentBossWave = waveNumber;
    const coreIndex = (waveNumber - 1) % 3;
    const variantLevel = Math.floor((waveNumber - 1) / 3);
    let boss;
    if (coreIndex === 0) {
      boss = new BugBoss(spawnX, spawnY, hostRack, variantLevel);
    } else if (coreIndex === 1) {
      boss = new ThermalGolemBoss(spawnX, spawnY, hostRack, variantLevel);
    } else {
      boss = new MajorVirusBoss(spawnX, spawnY, hostRack, variantLevel);
    }

    this.activeBoss = boss;
    this.bugBoss = boss; // Backward compatibility
    this.bossSpawned = true;

    // Dramatic spawn audio & visual feedback
    this.sound.playBossAlarm();
    this.camera.shake(32, 1.0);
    this.particles.spawnExplosion(spawnX, spawnY);
    this.particles.spawnSparks(hostRack.x + hostRack.width / 2, hostRack.y + hostRack.height / 2, 60, boss.color || '#ff2a55');

    // Initialize Boss HUD Banner
    if (this.bossHudBanner) {
      this.bossHudBanner.classList.remove('hidden');
      const iconEl = this.bossHudBanner.querySelector('.boss-banner-icon');
      if (iconEl) iconEl.textContent = boss.icon || '👾';
      const titleEl = this.bossHudBanner.querySelector('.boss-banner-title');
      if (titleEl) titleEl.textContent = boss.title || 'DEFCON 1 ANOMALY';
      const rLabel = this.bossHudBanner.querySelector('.boss-hud-meters .boss-meter-wrapper:nth-child(2) .boss-meter-label');
      if (rLabel) {
        if (boss instanceof BugBoss) rLabel.textContent = 'HEAVY ROPE WRAPS';
        else if (boss instanceof ThermalGolemBoss) rLabel.textContent = 'CORE TEMPERATURE';
        else if (boss instanceof MajorVirusBoss) rLabel.textContent = 'INFECTED NODES';
        else rLabel.textContent = boss.restraintName || 'RESTRAINT COILS';
      }

      if (this.bossCoilsTrack) {
        this.bossCoilsTrack.innerHTML = '';
        const dotCount = (boss instanceof ThermalGolemBoss || boss instanceof MajorVirusBoss) ? 0 : boss.maxWraps;
        for (let i = 0; i < dotCount; i++) {
          const dot = document.createElement('div');
          dot.className = 'boss-coil-dot';
          dot.dataset.index = i;
          this.bossCoilsTrack.appendChild(dot);
        }
      }
      this.updateBossHUD();
    }

    const devTag = isDevShortcut ? `🛠️ [DEV SHORTCUT W${waveNumber}] ` : '🚨 DEFCON 1 BREACH // ';
    let objectiveHint = '';
    if (boss instanceof BugBoss) objectiveHint = 'RETRIEVE HEAVY ROPE FROM SUPPLIES CLOSET!';
    else if (boss instanceof ThermalGolemBoss) objectiveHint = 'RETRIEVE CRYO CANISTER FROM SUPPLIES CLOSET TO FREEZE & SHATTER!';
    else if (boss instanceof MajorVirusBoss) objectiveHint = 'RETRIEVE QUARANTINE BARRIER FROM SUPPLIES CLOSET TO ENCLOSE ALL INFECTED NODES!';
    else objectiveHint = `RETRIEVE ${boss.restraintName} FROM SUPPLIES CLOSET!`;

    this.showTemporaryToast(`${devTag}${boss.title} ACTIVE! ${objectiveHint}`, boss.icon);
  }

  spawnBugBoss(isDevShortcut = false) {
    this.spawnBoss(1, isDevShortcut);
  }

  spawnMajorVirusFromRack(hostRack) {
    if (this.activeBoss && this.activeBoss.isAlive) return;
    this.spawnBoss(3);
  }

  updateBossHUD() {
    const boss = this.activeBoss || this.bugBoss;
    if (!boss || !boss.isAlive) return;

    if (boss instanceof ThermalGolemBoss) {
      const tempPct = Math.max(0, Math.min(100, (boss.temperature / boss.maxTemperature) * 100));
      if (this.bossHpFill) {
        this.bossHpFill.style.width = `${tempPct.toFixed(1)}%`;
      }
      if (this.bossCoilsCount) {
        this.bossCoilsCount.textContent = `${Math.round(boss.temperature)}°C / ${boss.maxTemperature}°C`;
      }
      if (this.bossStatusText) {
        if (boss.isFrozen) {
          this.bossStatusText.textContent = '❄️ CORE FROZEN SOLID (0°C)! SLIDE/RAM CART AT HIGH SPEED TO SHATTER!';
        } else if (this.hasCryoCanister) {
          this.bossStatusText.textContent = '❄️ CRYO CANISTER READY! HOLD [E] NEAR TITAN TO INJECT SUB-ZERO SPRAY!';
        } else {
          this.bossStatusText.textContent = '❄️ RETRIEVE CRYO CANISTER FROM SOUTH SUPPLIES CLOSET!';
        }
      }
      return;
    }

    if (boss instanceof MajorVirusBoss) {
      const infCount = boss.infectedRacks ? boss.infectedRacks.length : 1;
      if (this.bossHpFill) {
        this.bossHpFill.style.width = `${Math.min(100, infCount * 10)}%`;
        this.bossHpFill.style.backgroundColor = boss.color || '#10b981';
      }
      if (this.bossCoilsCount) {
        this.bossCoilsCount.textContent = `${infCount} INFECTED`;
      }
      if (this.bossStatusText) {
        if (!this.hasQuarantineBarrier) {
          this.bossStatusText.textContent = '🦠 RETRIEVE QUARANTINE BARRIER FROM SOUTH SUPPLIES CLOSET!';
        } else {
          this.bossStatusText.textContent = '🛡️ BARRIER READY! DRIVE IN A COMPLETE LOOP ENCLOSING ALL INFECTED COMPUTERS!';
        }
      }
      return;
    }


    const currentFraction = Math.min(0.95, (boss.currentWrapAngle || 0) / (Math.PI * 2));
    const totalProgress = (boss.completedWraps + currentFraction) / boss.maxWraps;
    const remainingPct = Math.max(0, Math.min(100, (1.0 - totalProgress) * 100));

    if (this.bossHpFill) {
      this.bossHpFill.style.width = `${remainingPct.toFixed(1)}%`;
    }

    if (this.bossCoilsCount) {
      this.bossCoilsCount.textContent = `${boss.completedWraps} / ${boss.maxWraps} WRAPS`;
    }

    if (this.bossStatusText) {
      const remaining = Math.max(0, boss.maxWraps - boss.completedWraps);
      const isRope = this.activeCable instanceof RestraintRope;
      if (!isRope) {
        this.bossStatusText.textContent = '🪢 RETRIEVE HEAVY ROPE FROM SOUTH SUPPLIES CLOSET!';
      } else if (boss.completedWraps === 0) {
        if ((boss.currentWrapAngle || 0) > 0.1) {
          const dir = boss.wrapDirection > 0 ? 'CLOCKWISE' : 'COUNTER-CLOCKWISE';
          this.bossStatusText.textContent = `COILING ROPE 1 (${dir})... KEEP CIRCLING!`;
        } else {
          this.bossStatusText.textContent = 'CIRCLE AROUND BUG BOSS TO COIL HEAVY ROPE (CW OR CCW)!';
        }
      } else if (remaining === 1) {
        this.bossStatusText.textContent = `⚠️ 1 WRAP REMAINING! CONSTRICTION CRITICAL!`;
      } else {
        this.bossStatusText.textContent = `CHASSIS CONSTRICTING // ${remaining} WRAPS NEEDED`;
      }
    }

    if (this.bossCoilsTrack) {
      const dots = this.bossCoilsTrack.querySelectorAll('.boss-coil-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx < boss.completedWraps);
      });
    }
  }

  triggerRackCrashFault(sourceRack) {
    if (!sourceRack || sourceRack.isDestroyed || sourceRack.isFailing || sourceRack === this.bossHostRack) return;
    const candidates = this.racks.filter(r => {
      if (r.id === sourceRack.id || r.isFailing || r.isDestroyed || r.isTargetDestination || r === this.bossHostRack) return false;
      const d = Math.hypot(r.x - sourceRack.x, r.y - sourceRack.y);
      return d >= (CONFIG.ERRORS.MIN_LINK_DISTANCE ?? 200) && d <= (CONFIG.ERRORS.MAX_LINK_DISTANCE ?? 1400);
    });
    if (candidates.length === 0) return;
    const targetRack = candidates[Math.floor(Math.random() * candidates.length)];
    sourceRack.triggerCableError(targetRack);
    sourceRack.uptime = 90;
    this.particles.spawnExplosion(sourceRack.x + sourceRack.width / 2, sourceRack.y + sourceRack.height / 2);
    this.particles.spawnSparks(sourceRack.x + sourceRack.width / 2, sourceRack.y + sourceRack.height / 2, 40, '#ff2a55');
    if (this.sound?.playAlarm) {
      this.sound.playAlarm();
    } else if (this.sound?.playBossAlarm) {
      this.sound.playBossAlarm();
    }
  }

  defeatBoss(boss = null) {
    const targetBoss = boss || this.activeBoss || this.bugBoss;
    if (!targetBoss) return;
    targetBoss.isAlive = false;

    // Immediately drop active restraint cable safely so player hands are freed
    this.dropActiveCable(true);
    this.activeCable = null;

    // Reset temporary boss gear
    this.hasCryoCanister = false;
    this.isCryoSpraying = false;
    this.emfPylonsRemaining = 0;
    this.deployedPylons = [];
    this.scramLimpetsRemaining = 0;

    // Massive defeat explosion & sound effects
    this.camera.shake(38, 1.2);
    this.particles.spawnExplosion(targetBoss.x, targetBoss.y);
    this.particles.spawnSparks(targetBoss.x, targetBoss.y, 80, targetBoss.color || '#ff2a55');
    this.particles.spawnSparks(targetBoss.x, targetBoss.y, 80, targetBoss.cableColor || '#00ff9d');
    this.particles.spawnSparks(targetBoss.x, targetBoss.y, 60, '#ffffff');
    if (this.sound?.playBossDefeat) this.sound.playBossDefeat();

    // Post-Boss Crash Overload: The violent kinetic collapse of the boss violently overloads 2-3 nearby racks!
    try {
      const nearbyHealthy = [...this.racks]
        .filter(r => !r.isFailing && !r.isDestroyed && r !== this.bossHostRack)
        .sort((a, b) => {
          const da = Math.hypot(a.x - targetBoss.x, a.y - targetBoss.y);
          const db = Math.hypot(b.x - targetBoss.x, b.y - targetBoss.y);
          return da - db;
        });
      const racksToOverload = nearbyHealthy.slice(0, 3);
      for (const r of racksToOverload) {
        this.triggerRackCrashFault(r);
      }
      const finalDamaged = this.racks.filter(r => r.isFailing && !r.isDestroyed);
      if (this.sound?.playBossAlarm) this.sound.playBossAlarm();
      this.showTemporaryToast(
        `🚨 DEFCON NEUTRALIZED! HOWEVER, ${finalDamaged.length} CRASH-DAMAGED SERVERS ARE OVERHEATING! RUSH TO RESTORE THEM BEFORE THEY EXPLODE!`,
        '⚠️'
      );
    } catch (err) {
      console.warn('Crash overload fault warning:', err);
    }

    if (this.bossHostRack) {
      this.bossHostRack.isBossHost = false;
      this.bossHostRack = null;
    }

    // Safety clear active cable once more
    this.dropActiveCable(true);
    this.activeCable = null;

    // Hide Boss Banner
    this.bossHudBanner?.classList.add('hidden');

    const wave = targetBoss.wave || 1;
    const rewardCredits = 500 * Math.max(1, wave);

    // Register unlocked errors for incident catalog progression
    if (targetBoss.unlockedError) {
      this.unlockedErrors.add(targetBoss.unlockedError);
    } else {
      if (wave === 1) this.unlockedErrors.add(CONFIG.ERRORS.SERVER_BUG);
      if (wave === 2) this.unlockedErrors.add(CONFIG.ERRORS.SERVER_OVERHEAT);
      if (wave >= 3) this.unlockedErrors.add(CONFIG.ERRORS.SERVER_SMALL_VIRUS);
    }

    this.bossDefeatedOnce = true;
    this.addCredits(rewardCredits, `+${rewardCredits} ⚡ ${targetBoss.name} PURGED!`);
    this.updateBuffDisplay();
    this.showTemporaryToast(`🏆 ${targetBoss.name} PURGED! (+${rewardCredits} ⚡) — REQUISITION PROTOCOL READY!`, targetBoss.icon || '🏆');

    // Trigger Interactive Apex Boss Reward Choice Modal
    this.openBossRewardModal(targetBoss);

    this.activeBoss = null;
    this.bugBoss = null;
  }

  defeatBugBoss() {
    this.defeatBoss(this.activeBoss || this.bugBoss);
  }

  // ==========================================================================
  // Apex Boss Reward Requisition System (Teleporter / Field Terminal / Shop Clearance)
  // ==========================================================================
  initBossRewardModal() {
    document.getElementById('btn-select-teleporter')?.addEventListener('click', () => {
      this.grantTeleporterReward();
    });
    document.getElementById('btn-select-portable-terminal')?.addEventListener('click', () => {
      this.grantPortableTerminalReward();
    });
    document.getElementById('btn-select-shop-expansion')?.addEventListener('click', () => {
      this.grantShopClearanceReward();
    });
  }

  openBossRewardModal(targetBoss) {
    if (this.isTerminalOpen) this.closeTerminal();
    if (this.isShopOpen) this.closeShop();
    this.isBossRewardOpen = true;
    this.keys = {};

    // Dynamic state on cards
    const statusTele = document.getElementById('reward-teleporter-status');
    const btnTele = document.getElementById('btn-select-teleporter');
    if (statusTele && btnTele) {
      if (!this.hasTeleporterItem) {
        statusTele.textContent = 'PROTOCOL: READY (NEW ITEM)';
        statusTele.style.color = '#00f3ff';
        btnTele.textContent = 'CLAIM TELEPORTER KIT';
      } else {
        statusTele.textContent = 'OWNED: OVERCLOCK RECHARGE FREQUENCY';
        statusTele.style.color = '#00ff9d';
        btnTele.textContent = 'OVERCLOCK TELEPORTER (0.2s COOLDOWN)';
      }
    }

    const statusTerm = document.getElementById('reward-terminal-status');
    const btnTerm = document.getElementById('btn-select-portable-terminal');
    if (statusTerm && btnTerm) {
      if (!this.hasPortableTerminal) {
        statusTerm.textContent = 'PROTOCOL: READY (NEW DEPLOYABLE)';
        statusTerm.style.color = '#00ff9d';
        btnTerm.textContent = 'CLAIM FIELD TERMINAL';
      } else {
        statusTerm.textContent = 'OWNED: FIELD TRANSMITTER AMPLIFIED';
        statusTerm.style.color = '#38bdf8';
        btnTerm.textContent = 'AMPLIFY FIELD TERMINAL';
      }
    }

    const statusShop = document.getElementById('reward-shop-status');
    const btnShop = document.getElementById('btn-select-shop-expansion');
    if (statusShop && btnShop) {
      statusShop.textContent = `CLEARANCE LVL ${this.shopClearanceLevel + 1} (+3 POWERUP PURCHASE CAPS)`;
      statusShop.style.color = '#c084fc';
      btnShop.textContent = `EXPAND SHOP & CAPS (+3 TO ALL)`;
    }

    this.bossRewardModal?.classList.remove('hidden');
    if (this.sound?.playLevelUp) this.sound.playLevelUp();
  }

  closeBossRewardModal() {
    this.isBossRewardOpen = false;
    this.bossRewardModal?.classList.add('hidden');
    this.keys = {};
  }

  grantTeleporterReward() {
    if (!this.hasTeleporterItem) {
      this.hasTeleporterItem = true;
      if (this.sound?.playTeleportDeploy) this.sound.playTeleportDeploy(0);
      this.particles.spawnSparks(this.player.x, this.player.y, 40, '#00f3ff');
      this.showTemporaryToast('🌀 QUANTUM TELEPORTER KIT UNLOCKED! Press [T] to place Node Alpha!', '✨');
    } else {
      CONFIG.TELEPORTER.COOLDOWN = 0.2;
      this.teleportCooldown = 0;
      if (this.sound?.playTeleportWarp) this.sound.playTeleportWarp();
      this.particles.spawnSparks(this.player.x, this.player.y, 50, '#00f3ff');
      this.showTemporaryToast('⚡ QUANTUM TELEPORTER OVERCLOCKED! WARP COOLDOWN REDUCED TO 0.2s!', '⚡');
    }
    this.closeBossRewardModal();
    this.updateBuffDisplay();
  }

  grantPortableTerminalReward() {
    this.hasPortableTerminal = true;
    if (this.sound?.playCabinetOpen) this.sound.playCabinetOpen();
    this.particles.spawnSparks(this.player.x, this.player.y, 45, '#00ff9d');
    this.showTemporaryToast('💻 PORTABLE FIELD TERMINAL ACQUIRED! Press [P] anywhere on the map to deploy/relocate!', '💻');
    this.closeBossRewardModal();
    this.updateBuffDisplay();
    this.calculateSynergies();
  }

  grantShopClearanceReward() {
    this.shopClearanceLevel += 1;
    this.powerupMaxLimitBonus += 3;
    if (this.sound?.playBuy) this.sound.playBuy();
    if (this.sound?.playPowerup) this.sound.playPowerup();
    this.particles.spawnSparks(this.player.x, this.player.y, 55, '#c084fc');
    this.showTemporaryToast(`🔓 SHOP CLEARANCE LEVEL ${this.shopClearanceLevel} GRANTED! ALL POWERUP CAPS EXPANDED +3!`, '🔓');
    this.closeBossRewardModal();
    this.updateShopButtons();
    this.calculateSynergies();
  }

  // ==========================================================================
  // Economy & Powerups System
  // ==========================================================================
  addCredits(amount, reason = '') {
    this.credits = Math.max(0, this.credits + amount);
    this.updateCreditsUI();
    if (reason && amount > 0) {
      this.showTemporaryToast(reason);
    }
    this.updateShopButtons();
  }

  updateCreditsUI() {
    if (this.creditsVal) this.creditsVal.textContent = `${this.credits} ⚡`;
    if (this.statsCreditsVal) this.statsCreditsVal.textContent = `${this.credits} ⚡`;
    if (this.shopCreditsDisplay) this.shopCreditsDisplay.textContent = this.credits;
  }

  initShopModal() {
    document.querySelectorAll('.btn-buy[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemType = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost, 10);
        this.buyItem(itemType, cost);
      });
    });

    // Category Tabs Filtering
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.shopCategory = tab.dataset.tab;
        this.filterShopCards(this.shopCategory);
      });
    });

    document.getElementById('btn-close-shop')?.addEventListener('click', () => this.closeShop());
    document.getElementById('btn-open-shop')?.addEventListener('click', () => this.openShop());
  }

  filterShopCards(category) {
    document.querySelectorAll('.shop-card').forEach(card => {
      if (category === 'all' || card.dataset.category === category) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  openShop() {
    if (this.isTerminalOpen) this.closeTerminal();
    this.isShopOpen = true;
    this.calculateSynergies();
    this.updateCreditsUI();
    this.updateShopButtons();
    this.shopModal?.classList.remove('hidden');
  }

  closeShop() {
    this.isShopOpen = false;
    this.shopModal?.classList.add('hidden');
    this.keys = {};
  }

  // ==========================================================================
  // Facility Supplies Closet System (Defcon Boss Gear & Maintenance Locker)
  // ==========================================================================
  initSuppliesModal() {
    document.getElementById('btn-close-supplies')?.addEventListener('click', () => this.closeSuppliesModal());

    document.getElementById('btn-supplies-first_aid')?.addEventListener('click', () => {
      const cost = 90;
      if (this.credits < cost) {
        this.sound.playTerminalFail();
        this.showTemporaryToast(`❌ INSUFFICIENT FUNDS (NEED ${cost} ⚡)`);
        return;
      }
      if (this.player.hp >= this.player.maxHp) {
        this.showTemporaryToast('⚠️ CART INTEGRITY ALREADY AT MAXIMUM (100 HP)!');
        return;
      }
      this.credits -= cost;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
      this.updateCreditsUI();
      this.updatePlayerHealthUI();
      this.sound.playPlugSuccess();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00ff9d');
      this.showTemporaryToast('🩹 FIRST AID DEPLOYED: +50 SYSTEM INTEGRITY (HP) RESTORED!', '🩹');
      this.updateSuppliesModalUI();
    });

    document.getElementById('btn-supplies-zip_ties')?.addEventListener('click', () => {
      const cost = 80;
      if (this.credits < cost) {
        this.sound.playTerminalFail();
        this.showTemporaryToast(`❌ INSUFFICIENT FUNDS (NEED ${cost} ⚡)`);
        return;
      }
      const failingRacks = this.racks.filter(r => r.isFailing && !r.isDestroyed);
      if (failingRacks.length === 0) {
        this.showTemporaryToast('⚠️ NO FAILING SERVERS REQUIRE IMMEDIATE ZIP-TIES!');
        return;
      }
      this.credits -= cost;
      const target = failingRacks[Math.floor(Math.random() * failingRacks.length)];
      target.resolveError();
      target.uptime = 100;
      this.updateCreditsUI();
      this.sound.playPlugSuccess();
      this.particles.spawnSparks(target.x + target.width / 2, target.y + target.height / 2, 45, '#38bdf8');
      this.showTemporaryToast(`⚡ ZIP-TIES DEPLOYED! ${target.id} QUICK-PATCHED TO 100% UPTIME!`, '⚡');
      this.updateSuppliesModalUI();
    });

    document.getElementById('btn-supplies-adrenaline')?.addEventListener('click', () => {
      const cost = 85;
      if (this.credits < cost) {
        this.sound.playTerminalFail();
        this.showTemporaryToast(`❌ INSUFFICIENT FUNDS (NEED ${cost} ⚡)`);
        return;
      }
      this.credits -= cost;
      this.adrenalineTimer = 25.0;
      this.updateCreditsUI();
      this.sound.playGrab();
      this.particles.spawnSparks(this.player.x, this.player.y, 45, '#f59e0b');
      this.showTemporaryToast('🔋 ADRENALINE SURGE INJECTED! +40 SPEED & HYPER-TRACTION FOR 25s!', '🔋');
      this.updateSuppliesModalUI();
    });
  }

  openSuppliesModal() {
    if (this.isTerminalOpen) this.closeTerminal();
    if (this.isShopOpen) this.closeShop();
    this.isSuppliesModalOpen = true;
    this.sound.playCabinetOpen();
    this.updateCreditsUI();
    this.updateSuppliesModalUI();
    this.suppliesModal?.classList.remove('hidden');
  }

  closeSuppliesModal() {
    this.isSuppliesModalOpen = false;
    this.suppliesModal?.classList.add('hidden');
    this.keys = {};
  }

  updateSuppliesModalUI() {
    const disp = document.getElementById('supplies-credits-display');
    if (disp) disp.textContent = this.credits;

    // First Aid button state
    const btnAid = document.getElementById('btn-supplies-first_aid');
    if (btnAid) btnAid.disabled = this.credits < 90 || this.player.hp >= this.player.maxHp;

    // Zip ties button state
    const btnZip = document.getElementById('btn-supplies-zip_ties');
    if (btnZip) btnZip.disabled = this.credits < 80;

    // Adrenaline button state
    const btnAdren = document.getElementById('btn-supplies-adrenaline');
    if (btnAdren) btnAdren.disabled = this.credits < 85;

    // Active Mission Boss Gear Grid
    const gearGrid = document.getElementById('supplies-boss-gear-grid');
    if (!gearGrid) return;
    gearGrid.innerHTML = '';

    const boss = this.activeBoss || this.bugBoss;
    if (!boss || !boss.isAlive) {
      gearGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: rgba(15, 23, 42, 0.6); border-radius: 6px; border: 1px dashed rgba(100, 116, 139, 0.3);">
          ⚡ NO ACTIVE DEFCON BREACH // WAREHOUSE SYSTEMS IN STANDARD OPERATION STATUS
        </div>`;
      return;
    }

    if (boss instanceof BugBoss) {
      const isEquipped = this.activeCable instanceof RestraintRope;
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="card-icon">🪢</div>
        <div class="card-info">
          <div class="card-name">Braided High-Tensile Restraint Rope <span style="font-size: 0.68rem; color: #f59e0b;">[DEFCON 1 RESTRAINT]</span></div>
          <div class="card-desc">Heavy reinforced nylon tether. Take out of the closet and loop around Bug Boss ${boss.maxWraps} times (CW or CCW) to crush its chassis.</div>
        </div>
        <button type="button" class="btn-buy" id="btn-retrieve-rope" style="background: ${isEquipped ? '#334155' : 'linear-gradient(135deg, #d97706, #f59e0b)'}; color: #00ff9d; font-weight: 700;">
          ${isEquipped ? '✓ IN HAND (RE-EQUIP)' : 'FREE RETRIEVE'}
        </button>`;
      gearGrid.appendChild(card);
      card.querySelector('#btn-retrieve-rope')?.addEventListener('click', () => {
        if (this.activeCable) {
          this.dropActiveCable();
        }
        this.activeCable = new RestraintRope(this.suppliesCloset, boss);
        this.sound.playCabinetOpen();
        this.sound.playGrab();
        this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 45, '#f59e0b');
        this.showTemporaryToast('🪢 HEAVY RESTRAINT ROPE RETRIEVED FROM SUPPLIES CLOSET! CIRCLE BUG BOSS TO WRAP IT!', '🪢');
        this.updateObjectiveUI();
        this.updateBossHUD();
        this.closeSuppliesModal();
      });
    } else if (boss instanceof ThermalGolemBoss) {
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="card-icon">❄️</div>
        <div class="card-info">
          <div class="card-name">Cryo Coolant Injection Canister <span style="font-size: 0.68rem; color: #00f3ff;">[DEFCON 1 CRYO]</span></div>
          <div class="card-desc">Pressurized liquid nitrogen (-196°C). Hold [E] near Thermal Golem to freeze core to 0°C, then ram at speed to shatter!</div>
        </div>
        <button type="button" class="btn-buy" id="btn-retrieve-cryo" style="background: ${this.hasCryoCanister ? '#334155' : 'linear-gradient(135deg, #0284c7, #00f3ff)'}; color: #000; font-weight: 700;">
          ${this.hasCryoCanister ? '✓ EQUIPPED' : 'FREE RETRIEVE'}
        </button>`;
      gearGrid.appendChild(card);
      card.querySelector('#btn-retrieve-cryo')?.addEventListener('click', () => {
        this.hasCryoCanister = true;
        this.sound.playCabinetOpen();
        this.showTemporaryToast('❄️ CRYO COOLANT CANISTER EQUIPPED! HOLD [E] NEAR TITAN TO FREEZE ITS CORE!', '❄️');
        this.closeSuppliesModal();
      });
    } else if (boss instanceof MajorVirusBoss) {
      const isEquipped = Boolean(this.hasQuarantineBarrier && this.activeCable instanceof ContainmentWire);
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="card-icon">🟡</div>
        <div class="card-info">
          <div class="card-name">Quarantine Containment Barrier <span style="font-size: 0.68rem; color: #10b981;">[DEFCON 1 QUARANTINE]</span></div>
          <div class="card-desc">Deploy a closed perimeter around all virus-infected computers to sterilize and isolate the Major Virus!</div>
        </div>
        <button type="button" class="btn-buy" id="btn-retrieve-barrier" style="background: ${isEquipped ? '#334155' : 'linear-gradient(135deg, #059669, #10b981)'}; color: #000; font-weight: 700;">
          ${isEquipped ? '✓ IN HAND' : 'FREE RETRIEVE'}
        </button>`;
      gearGrid.appendChild(card);
      card.querySelector('#btn-retrieve-barrier')?.addEventListener('click', () => {
        this.hasQuarantineBarrier = true;
        if (this.activeCable && !(this.activeCable instanceof ContainmentWire)) {
          this.dropActiveCable();
        }
        this.activeCable = new ContainmentWire(this.suppliesCloset, boss);
        this.sound.playCabinetOpen();
        this.sound.playGrab();
        this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 45, '#10b981');
        this.showTemporaryToast('🟡 QUARANTINE CONTAINMENT BARRIER RETRIEVED! DRIVE IN A COMPLETE CLOSED LOOP ENCLOSING ALL INFECTED COMPUTERS!', '🟡');
        this.updateObjectiveUI();
        this.updateBossHUD();
        this.closeSuppliesModal();
      });
    } else {
      // Wave 4+ Endless Bosses
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="card-icon">👑</div>
        <div class="card-info">
          <div class="card-name">${boss.restraintName} <span style="font-size: 0.68rem; color: #00ff9d;">[APEX TETHER]</span></div>
          <div class="card-desc">Reinforced restraint tool for higher-tier boss variants.</div>
        </div>
        <button type="button" class="btn-buy" style="background: linear-gradient(135deg, #0284c7, #00f3ff); color: #000; font-weight: 700;">
          EQUIPPED
        </button>`;
      gearGrid.appendChild(card);
    }
  }

  calculateSynergies() {
    const driftCount = (this.energyDrinkPurchases > 0 ? 1 : 0) + 
      (this.magnetPurchases > 0 ? 1 : 0) + 
      (this.player.hasNitrous ? 1 : 0) + 
      (this.player.hasSlalomSprings ? 1 : 0) + 
      (this.player.hasTeflonSkids ? 1 : 0) +
      (this.player.hasPhaseDash ? 1 : 0);

    const combatCount = (this.cannonCharges > 1 ? 1 : 0) + 
      (this.player.hasSpikedBumper ? 1 : 0) + 
      (this.player.hasEmpShockwave ? 1 : 0) + 
      (this.player.defibrillatorCharges > 0 ? 1 : 0) +
      (this.player.hasCryoShield ? 1 : 0);

    const netopsCount = (this.player.hasSuperReel ? 1 : 0) + 
      (this.player.hasHexDecoder ? 1 : 0) + 
      (this.player.hasPatchDrone ? 1 : 0) + 
      (this.hasYieldBonds ? 1 : 0) +
      (this.hasPortableTerminal ? 1 : 0);

    this.activeSynergies.drift = driftCount >= 4 ? 3 : (driftCount >= 3 ? 2 : (driftCount >= 2 ? 1 : 0));
    this.activeSynergies.combat = combatCount >= 4 ? 3 : (combatCount >= 3 ? 2 : (combatCount >= 2 ? 1 : 0));
    this.activeSynergies.netops = netopsCount >= 4 ? 3 : (netopsCount >= 3 ? 2 : (netopsCount >= 2 ? 1 : 0));

    const parts = [];
    if (this.activeSynergies.drift > 0) {
      const tier = this.activeSynergies.drift === 3 ? 'GOLD (Sonic Velocity)' : (this.activeSynergies.drift === 2 ? 'SILVER (Drift King)' : 'BRONZE (Aisle Runner)');
      parts.push(`🏎️ DRIFT: ${tier}`);
    }
    if (this.activeSynergies.combat > 0) {
      const tier = this.activeSynergies.combat === 3 ? 'GOLD (Juggernaut)' : (this.activeSynergies.combat === 2 ? 'SILVER (Enforcer)' : 'BRONZE (Riot Guard)');
      parts.push(`🛡️ COMBAT: ${tier}`);
    }
    if (this.activeSynergies.netops > 0) {
      const tier = this.activeSynergies.netops === 3 ? 'GOLD (CIO Master)' : (this.activeSynergies.netops === 2 ? 'SILVER (Senior NetOps)' : 'BRONZE (Certified Admin)');
      parts.push(`⚡ NETOPS: ${tier}`);
    }

    if (this.shopSynergyText) {
      this.shopSynergyText.innerHTML = parts.length > 0 
        ? parts.join(' &nbsp;|&nbsp; ') 
        : 'Equip 2+ items of the same hardware category to activate powerful build bonuses!';
    }
  }

  updateShopButtons() {
    const maxEnergy = 3 + (this.powerupMaxLimitBonus || 0);
    const maxCannon = 3 + (this.powerupMaxLimitBonus || 0);
    const maxDefib = 2 + (this.powerupMaxLimitBonus || 0);

    const energyCost = 150 + (this.energyDrinkPurchases || 0) * 50;
    const magnetCost = 150 + (this.magnetPurchases || 0) * 50;
    const cannonCost = CONFIG.CANNON.COST ?? 150;
    const replacementCost = CONFIG.ERRORS.REPLACEMENT_COST ?? 1000;

    const btnEnergy = document.getElementById('btn-buy-energy_drink');
    if (btnEnergy) {
      btnEnergy.dataset.cost = energyCost;
      if ((this.energyDrinkPurchases || 0) >= maxEnergy) {
        btnEnergy.textContent = `MAXED OUT (${this.energyDrinkPurchases}/${maxEnergy})`;
        btnEnergy.disabled = true;
      } else {
        btnEnergy.textContent = `${energyCost} ⚡ BUY (${this.energyDrinkPurchases || 0}/${maxEnergy})`;
        btnEnergy.disabled = this.credits < energyCost;
      }
    }
    const descEnergy = document.getElementById('shop-desc-energy_drink');
    if (descEnergy) {
      const topSpeed = (CONFIG.SPEED ?? 650) + (this.player.permanentSpeedBonus || 0);
      descEnergy.textContent = `Permanently boosts top sliding speed by +35 px/s (Purchased: ${this.energyDrinkPurchases || 0}/${maxEnergy} | Top Speed: ${topSpeed} px/s)`;
    }

    const btnCannon = document.getElementById('btn-buy-cannon');
    if (btnCannon) {
      btnCannon.dataset.cost = cannonCost;
      if ((this.cannonCharges || 0) >= maxCannon) {
        btnCannon.textContent = `MAXED OUT (${this.cannonCharges}/${maxCannon})`;
        btnCannon.disabled = true;
      } else {
        btnCannon.textContent = `${cannonCost} ⚡ BUY (${this.cannonCharges}/${maxCannon} ARMED)`;
        btnCannon.disabled = this.credits < cannonCost;
      }
    }

    const btnReplacement = document.getElementById('btn-buy-replacement_chassis');
    if (btnReplacement) {
      btnReplacement.dataset.cost = replacementCost;
      btnReplacement.textContent = `${replacementCost} ⚡ BUY`;
      btnReplacement.disabled = this.credits < replacementCost;
    }

    // Dynamic state for all other hardware items
    document.querySelectorAll('.btn-buy[data-item]').forEach(btn => {
      const item = btn.dataset.item;
      const cost = parseInt(btn.dataset.cost, 10);
      if (item === 'energy_drink' || item === 'magnet' || item === 'cannon' || item === 'replacement_chassis') return;

      const card = btn.closest('.shop-card');

      // Prototype items clearance lock check
      if (item === 'cryo_shield' || item === 'phase_dash') {
        if (this.shopClearanceLevel === 0) {
          if (card) card.classList.add('is-prototype-locked');
          btn.textContent = '🔒 CLEARANCE REQ';
          btn.disabled = true;
          return;
        } else {
          if (card) card.classList.remove('is-prototype-locked');
        }
      }

      const isOwned = (item === 'nitrous' && this.player.hasNitrous) ||
        (item === 'slalom_springs' && this.player.hasSlalomSprings) ||
        (item === 'teflon_skids' && this.player.hasTeflonSkids) ||
        (item === 'spiked_bumper' && this.player.hasSpikedBumper) ||
        (item === 'emp_shockwave' && this.player.hasEmpShockwave) ||
        (item === 'super_reel' && this.player.hasSuperReel) ||
        (item === 'hex_decoder' && this.player.hasHexDecoder) ||
        (item === 'patch_drone' && this.player.hasPatchDrone) ||
        (item === 'yield_bonds' && this.hasYieldBonds) ||
        (item === 'cryo_shield' && this.player.hasCryoShield) ||
        (item === 'phase_dash' && this.player.hasPhaseDash);

      if (isOwned) {
        btn.textContent = '✓ INSTALLED';
        btn.disabled = true;
      } else if (item === 'defibrillator') {
        const curDefib = this.player.defibrillatorCharges || 0;
        if (curDefib >= maxDefib) {
          btn.textContent = `MAXED OUT (${curDefib}/${maxDefib})`;
          btn.disabled = true;
        } else {
          btn.textContent = `${cost} ⚡ BUY (${curDefib}/${maxDefib} CHARGES)`;
          btn.disabled = this.credits < cost;
        }
      } else {
        btn.textContent = `${cost} ⚡ BUY`;
        btn.disabled = this.credits < cost;
      }
    });
  }

  buyItem(itemType, cost) {
    if (this.credits < cost) {
      this.sound.playTerminalFail();
      this.showTemporaryToast(`❌ INSUFFICIENT FUNDS (NEED ${cost} ⚡, CURRENT: ${this.credits} ⚡)`);
      return;
    }

    if (itemType === 'replacement_chassis') {
      const destroyedRack = this.racks.find(r => r.isDestroyed);
      if (!destroyedRack) {
        this.showTemporaryToast('⚠️ NO EXPLODED RACKS CURRENTLY NEED REPLACEMENT (FUNDS SAVED)');
        return;
      }
      this.addCredits(-cost);
      this.sound.playPlugSuccess();
      destroyedRack.rebuild();
      this.particles.spawnSparks(destroyedRack.x + destroyedRack.width / 2, destroyedRack.y + destroyedRack.height / 2, 45, '#00ff9d');
      this.showTemporaryToast(`🏗️ HOT-SWAP CHASSIS DEPLOYED TO ${destroyedRack.id}! UPTIME RESTORED!`);
      this.updateShopButtons();
      this.updateObjectiveUI();
      return;
    }

    if (itemType === 'energy_drink') {
      const maxEnergy = 3 + (this.powerupMaxLimitBonus || 0);
      if ((this.energyDrinkPurchases || 0) >= maxEnergy) {
        this.sound.playTerminalFail?.();
        this.showTemporaryToast(`⚠️ ENERGY DRINKS AT MAX CAPACITY (${maxEnergy}/${maxEnergy}) — EXPAND CAP VIA BOSS APEX REWARD!`);
        return;
      }
      this.addCredits(-cost);
      this.energyDrinkPurchases = (this.energyDrinkPurchases || 0) + 1;
      this.player.permanentSpeedBonus = (this.player.permanentSpeedBonus || 0) + 35;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#ffaa00');
      const topSpeed = (CONFIG.SPEED ?? 650) + this.player.permanentSpeedBonus;
      const nextCost = 150 + this.energyDrinkPurchases * 50;
      this.showTemporaryToast(`🥤 ENERGY DRINK CONSUMED! (${this.energyDrinkPurchases}/${maxEnergy}) TOP SPEED: ${topSpeed} px/s`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'cannon') {
      const maxCannon = 3 + (this.powerupMaxLimitBonus || 0);
      if ((this.cannonCharges || 0) >= maxCannon) {
        this.sound.playTerminalFail?.();
        this.showTemporaryToast(`⚠️ KINETIC CANNON AT MAX CAPACITY (${maxCannon}/${maxCannon}) — EXPAND CAP VIA BOSS APEX REWARD!`);
        return;
      }
      this.addCredits(-cost);
      this.cannonCharges = (this.cannonCharges || 0) + 1;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#00f3ff');
      this.showTemporaryToast(`🎯 KINETIC CANNON CHARGE ACQUIRED! (${this.cannonCharges}/${maxCannon}) // PRESS [F] TO ARM`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'cryo_shield') {
      if (this.shopClearanceLevel === 0) {
        this.sound.playTerminalFail?.();
        this.showTemporaryToast(`🔒 CRYO DEFLECTOR SHIELD IS LOCKED — DEFEAT A MAIN BOSS & SELECT SHOP CLEARANCE!`);
        return;
      }
      if (this.player.hasCryoShield) {
        this.showTemporaryToast(`✓ CRYO DEFLECTOR SHIELD IS ALREADY INSTALLED!`);
        return;
      }
      this.addCredits(-cost);
      this.player.hasCryoShield = true;
      this.player.cryoShieldCooldown = 0;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00f3ff');
      this.showTemporaryToast(`🛡️ CRYO DEFLECTOR SHIELD INSTALLED! ABSORBS 1 FATAL DAMAGE HIT EVERY 45s!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'phase_dash') {
      if (this.shopClearanceLevel === 0) {
        this.sound.playTerminalFail?.();
        this.showTemporaryToast(`🔒 PHASE DASH MODULE IS LOCKED — DEFEAT A MAIN BOSS & SELECT SHOP CLEARANCE!`);
        return;
      }
      if (this.player.hasPhaseDash) {
        this.showTemporaryToast(`✓ PHASE DASH MODULE IS ALREADY INSTALLED!`);
        return;
      }
      this.addCredits(-cost);
      this.player.hasPhaseDash = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#a855f7');
      this.showTemporaryToast(`⚡ PHASE DASH MODULE INSTALLED! PRESS [SHIFT] TO PHASE DASH THROUGH OBSTACLES!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    // New Build Items:
    if (itemType === 'nitrous') {
      this.addCredits(-cost);
      this.player.hasNitrous = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#00f3ff');
      this.showTemporaryToast(`🚀 NITROUS AFTERBURNERS INSTALLED! PRESS [SHIFT] FOR A 3.0s ROCKET BOOST!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'slalom_springs') {
      this.addCredits(-cost);
      this.player.hasSlalomSprings = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#00ff9d');
      this.showTemporaryToast(`🌀 SLALOM SPRINGS INSTALLED! BOUNCING OFF RACKS NOW ACCELERATES VELOCITY (+25%)!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'teflon_skids') {
      this.addCredits(-cost);
      this.player.hasTeflonSkids = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#a855f7');
      this.showTemporaryToast(`⛸️ TEFLON SKIDS INSTALLED! FRICTIONLESS LATERAL SLIDES UNLOCKED!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'spiked_bumper') {
      this.addCredits(-cost);
      this.player.hasSpikedBumper = true;
      this.player.maxHp += 50;
      this.player.hp += 50;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#ff2a55');
      this.updatePlayerHealthUI();
      this.showTemporaryToast(`🛡️ SPIKED BUMPER INSTALLED! SQUASH RADIUS +80% & MAX HP +50!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'emp_shockwave') {
      this.addCredits(-cost);
      this.player.hasEmpShockwave = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00f3ff');
      this.showTemporaryToast(`⚡ EMP PULSE CAPACITOR INSTALLED! PRESS [V] TO UNLEASH 400px ELECTRO-PULSE!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'defibrillator') {
      this.addCredits(-cost);
      this.player.defibrillatorCharges = (this.player.defibrillatorCharges || 0) + 1;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#ff2a55');
      this.showTemporaryToast(`💉 DEFIBRILLATOR CHARGE ARMED (TOTAL: ${this.player.defibrillatorCharges})! AUTO-REVIVES TO 100 HP!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'super_reel') {
      this.addCredits(-cost);
      this.player.hasSuperReel = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#00ff9d');
      this.showTemporaryToast(`🎣 SUPER REEL INSTALLED! ZERO CABLE DRAG & +120px MAGNETIC PORT SNAPPING!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'hex_decoder') {
      this.addCredits(-cost);
      this.player.hasHexDecoder = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 30, '#ffaa00');
      this.showTemporaryToast(`📶 HEX DECODER ONLINE! 180px PIN SCAN RADIUS & GREEN NOC KEYPAD HIGHLIGHTS!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'patch_drone') {
      this.addCredits(-cost);
      this.player.hasPatchDrone = true;
      this.patchDrone = new PatchDroneEntity(this.player);
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00f3ff');
      this.showTemporaryToast(`🛸 SENTRY PATCH DRONE DEPLOYED! ORBITS CART & ACCELERATES BREAKER REBOOTS!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }

    if (itemType === 'yield_bonds') {
      this.addCredits(-cost);
      this.hasYieldBonds = true;
      this.sound.playBuy();
      this.sound.playPowerup();
      this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00ff9d');
      this.showTemporaryToast(`📈 HIGH-YIELD BONDS ACTIVE! +35 ⚡ DIVIDENDS PAID EVERY 30s WHEN UPTIME > 80%!`);
      this.calculateSynergies();
      this.updateShopButtons();
      this.updateCreditsUI();
      this.updateBuffDisplay();
      return;
    }
  }

  updateBuffDisplay() {
    if (!this.activeBuffsContainer) return;
    this.activeBuffsContainer.innerHTML = '';

    // Active Synergies Badges
    if (this.activeSynergies.drift > 0) {
      const dBadge = document.createElement('div');
      dBadge.className = 'buff-badge buff-synergy-drift';
      dBadge.innerHTML = `🏎️ DRIFT ${['BRONZE', 'SILVER', 'GOLD'][this.activeSynergies.drift - 1]}`;
      this.activeBuffsContainer.appendChild(dBadge);
    }
    if (this.activeSynergies.combat > 0) {
      const cBadge = document.createElement('div');
      cBadge.className = 'buff-badge buff-synergy-combat';
      cBadge.innerHTML = `🛡️ COMBAT ${['BRONZE', 'SILVER', 'GOLD'][this.activeSynergies.combat - 1]}`;
      this.activeBuffsContainer.appendChild(cBadge);
    }
    if (this.activeSynergies.netops > 0) {
      const nBadge = document.createElement('div');
      nBadge.className = 'buff-badge buff-synergy-netops';
      nBadge.innerHTML = `⚡ NETOPS ${['BRONZE', 'SILVER', 'GOLD'][this.activeSynergies.netops - 1]}`;
      this.activeBuffsContainer.appendChild(nBadge);
    }

    // Nitrous Afterburner Status
    if (this.player.hasNitrous) {
      const nBadge = document.createElement('div');
      nBadge.className = 'buff-badge buff-nitrous';
      if (this.player.nitrousTimer > 0) {
        nBadge.innerHTML = `🚀 NITROUS: ${this.player.nitrousTimer.toFixed(1)}s`;
      } else if (this.player.nitrousCooldown > 0) {
        nBadge.innerHTML = `🚀 NITROUS: ${this.player.nitrousCooldown.toFixed(1)}s`;
      } else {
        nBadge.innerHTML = `🚀 NITROUS READY [SHIFT]`;
      }
      this.activeBuffsContainer.appendChild(nBadge);
    }

    // Phase Dash Status
    if (this.player.hasPhaseDash) {
      const dBadge = document.createElement('div');
      dBadge.className = 'buff-badge buff-dash';
      if (this.player.dashCooldown > 0) {
        dBadge.innerHTML = `⚡ PHASE DASH: ${this.player.dashCooldown.toFixed(1)}s`;
      } else {
        dBadge.innerHTML = `⚡ PHASE DASH READY [SHIFT]`;
      }
      this.activeBuffsContainer.appendChild(dBadge);
    }

    // Cryo Deflector Shield Status
    if (this.player.hasCryoShield) {
      const sBadge = document.createElement('div');
      sBadge.className = 'buff-badge buff-shield';
      if (this.player.cryoShieldCooldown > 0) {
        sBadge.innerHTML = `🛡️ CRYO SHIELD: ${this.player.cryoShieldCooldown.toFixed(0)}s`;
      } else {
        sBadge.innerHTML = `🛡️ CRYO SHIELD ONLINE`;
      }
      this.activeBuffsContainer.appendChild(sBadge);
    }

    // EMP Shockwave Status
    if (this.player.hasEmpShockwave) {
      const eBadge = document.createElement('div');
      eBadge.className = 'buff-badge';
      eBadge.style.color = '#00f3ff';
      eBadge.style.borderColor = 'rgba(0, 243, 255, 0.4)';
      if (this.player.empCooldown > 0) {
        eBadge.innerHTML = `⚡ EMP PULSE: ${this.player.empCooldown.toFixed(0)}s`;
      } else {
        eBadge.innerHTML = `⚡ EMP PULSE READY [V]`;
      }
      this.activeBuffsContainer.appendChild(eBadge);
    }

    // Air hockey puck active glide timer
    if (this.cannonPuckTimer > 0) {
      const puckBadge = document.createElement('div');
      puckBadge.className = 'buff-badge buff-puck';
      puckBadge.innerHTML = `🏒 AIR HOCKEY PUCK: ${this.cannonPuckTimer.toFixed(1)}s`;
      this.activeBuffsContainer.appendChild(puckBadge);
    }

    // Unique Quantum Teleporter Item Badge
    if (this.hasTeleporterItem) {
      const teleBadge = document.createElement('div');
      if (this.teleporterNodes.length === 0) {
        teleBadge.className = 'buff-badge buff-teleporter';
        teleBadge.innerHTML = `🌀 TELEPORTER: READY [PRESS T FOR NODE α]`;
      } else if (this.teleporterNodes.length === 1) {
        teleBadge.className = 'buff-badge buff-teleporter';
        teleBadge.innerHTML = `🌀 TELEPORTER: NODE α SET [PRESS T FOR NODE β]`;
      } else {
        teleBadge.className = 'buff-badge buff-teleporter linked';
        if (this.teleportCooldown > 0) {
          teleBadge.innerHTML = `🌀 TELEPORT LINK RECHARGING: ${this.teleportCooldown.toFixed(1)}s`;
        } else {
          teleBadge.innerHTML = `🌀 TELEPORT LINK ONLINE [STEP ON PAD / [T]]`;
        }
      }
      this.activeBuffsContainer.appendChild(teleBadge);
    }

    // Portable Field NOC Terminal Badge
    if (this.hasPortableTerminal) {
      const termBadge = document.createElement('div');
      termBadge.className = 'buff-badge buff-portable-terminal';
      termBadge.innerHTML = this.portableTerminal
        ? `💻 FIELD TERMINAL: DEPLOYED [E: OPEN | P: RELOCATE]`
        : `💻 FIELD TERMINAL: READY [PRESS P TO DEPLOY]`;
      this.activeBuffsContainer.appendChild(termBadge);
    }
  }

  // ==========================================================================
  // Main Menu, Pause & Interactive Tutorial System
  // ==========================================================================
  initMenuAndTutorial() {
    // Menu buttons
    document.getElementById('btn-menu-new-game')?.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    document.getElementById('btn-menu-play')?.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    document.getElementById('btn-menu-continue')?.addEventListener('click', () => {
      this.sound.init();
      this.loadQuickSaveFromBrowser();
    });

    document.getElementById('btn-menu-tutorial')?.addEventListener('click', () => {
      this.sound.init();
      this.openTutorial(0);
    });

    // In-game HUD manual button
    document.getElementById('btn-open-tutorial')?.addEventListener('click', () => {
      this.sound.init();
      this.openTutorial(0);
    });

    // Tutorial modal controls
    document.getElementById('btn-close-tutorial')?.addEventListener('click', () => {
      this.closeTutorial();
    });

    document.getElementById('btn-tut-prev')?.addEventListener('click', () => {
      this.prevTutorialStep();
    });

    document.getElementById('btn-tut-next')?.addEventListener('click', () => {
      this.nextTutorialStep();
    });

    document.getElementById('btn-tut-start')?.addEventListener('click', () => {
      this.sound.init();
      this.startGame();
    });

    // Pause modal buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btn-pause-new-game')?.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    document.getElementById('btn-pause-quicksave')?.addEventListener('click', () => {
      this.sound.init();
      this.quickSaveToBrowser();
    });

    document.getElementById('btn-pause-tutorial')?.addEventListener('click', () => {
      this.openTutorial(0);
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.returnToMainMenu();
    });

    // Stats modal buttons & triggers
    document.getElementById('btn-open-stats')?.addEventListener('click', () => {
      this.sound.init();
      this.openStats();
    });
    document.getElementById('btn-open-stats-top')?.addEventListener('click', () => {
      this.sound.init();
      this.openStats();
    });
    document.getElementById('btn-pause-stats')?.addEventListener('click', () => {
      this.sound.init();
      this.openStats();
    });
    document.getElementById('btn-close-stats')?.addEventListener('click', () => {
      this.closeStats();
    });

    // Settings modal buttons & triggers
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.sound.init();
      this.openSettings();
    });
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.openSettings();
    });
    document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
      this.sound.init();
      this.openSettings();
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.closeSettings();
    });
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.closeSettings();
    });
    this.settingTogglePerf?.addEventListener('click', () => {
      this.toggleOptimizedMode();
    });
    this.settingToggleFps?.addEventListener('click', () => {
      this.toggleFpsMeter();
    });
    this.settingToggleCrt?.addEventListener('click', () => {
      this.toggleCrtFilter();
    });
    this.settingToggleDev?.addEventListener('click', () => {
      this.toggleDevMode();
    });

    // Save & Load File Handling Listeners
    document.getElementById('btn-pause-save')?.addEventListener('click', () => {
      this.sound.init();
      this.downloadSaveFile();
    });
    document.getElementById('btn-pause-load')?.addEventListener('click', () => {
      this.sound.init();
      this.openSaveFilePicker();
    });
    document.getElementById('btn-menu-load')?.addEventListener('click', () => {
      this.sound.init();
      this.openSaveFilePicker();
    });
    document.getElementById('btn-go-load')?.addEventListener('click', () => {
      this.sound.init();
      this.openSaveFilePicker();
    });
    this.saveFileInput?.addEventListener('change', (e) => {
      this.handleSaveFileSelected(e);
    });
    this.btnConfirmLoadRun?.addEventListener('click', () => {
      if (this.pendingLoadedRunData) {
        this.applyLoadedSave(this.pendingLoadedRunData);
      }
    });
    this.btnCancelLoadRun?.addEventListener('click', () => {
      this.closeRunPreviewModal();
    });
    this.btnClosePreview?.addEventListener('click', () => {
      this.closeRunPreviewModal();
    });

    // Leaderboard Listeners
    document.getElementById('btn-pause-leaderboard')?.addEventListener('click', () => {
      this.sound.init();
      this.openLeaderboard();
    });
    document.getElementById('btn-menu-leaderboard')?.addEventListener('click', () => {
      this.sound.init();
      this.openLeaderboard();
    });
    document.getElementById('btn-go-leaderboard')?.addEventListener('click', () => {
      this.sound.init();
      this.openLeaderboard();
    });
    document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => {
      this.closeLeaderboard();
    });
    document.getElementById('btn-clear-leaderboard')?.addEventListener('click', () => {
      this.clearLeaderboard();
    });

    // Game Over Retry and Return Buttons
    document.getElementById('btn-go-retry')?.addEventListener('click', () => {
      this.sound.init();
      this.gameOverModal?.classList.add('hidden');
      this.isGameOver = false;
      this.startGame();
    });
    document.getElementById('btn-go-menu')?.addEventListener('click', () => {
      this.sound.init();
      this.gameOverModal?.classList.add('hidden');
      this.isGameOver = false;
      this.returnToMainMenu();
    });

    // Terminal Remote Shutdown Button
    this.btnTerminalShutdown?.addEventListener('click', () => {
      this.sound.init();
      this.submitTerminalCode();
    });

    // Tab buttons
    document.querySelectorAll('.tut-tab[data-step]').forEach(tab => {
      tab.addEventListener('click', () => {
        const step = parseInt(tab.dataset.step, 10);
        this.setTutorialStep(step);
      });
    });

    // Initialize progress dots
    const dotsContainer = document.getElementById('tut-progress-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < this.totalTutorialSteps; i++) {
        const dot = document.createElement('div');
        dot.className = `tut-dot ${i === 0 ? 'active' : ''}`;
        dot.dataset.step = i;
        dot.addEventListener('click', () => this.setTutorialStep(i));
        dotsContainer.appendChild(dot);
      }
    }
  }

  setTutorialStep(step) {
    this.currentTutorialStep = Math.max(0, Math.min(this.totalTutorialSteps - 1, step));
    this.sound.playKey();

    // Update tabs
    document.querySelectorAll('.tut-tab').forEach(tab => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.toggle('active', tabStep === this.currentTutorialStep);
    });

    // Update slides
    document.querySelectorAll('.tut-slide').forEach(slide => {
      const slideStep = parseInt(slide.dataset.step, 10);
      slide.classList.toggle('active', slideStep === this.currentTutorialStep);
    });

    // Update dots
    document.querySelectorAll('.tut-dot').forEach(dot => {
      const dotStep = parseInt(dot.dataset.step, 10);
      dot.classList.toggle('active', dotStep === this.currentTutorialStep);
    });

    // Update nav buttons
    const btnPrev = document.getElementById('btn-tut-prev');
    const btnNext = document.getElementById('btn-tut-next');
    const btnStart = document.getElementById('btn-tut-start');

    if (btnPrev) btnPrev.disabled = this.currentTutorialStep === 0;

    const isLastStep = this.currentTutorialStep === this.totalTutorialSteps - 1;
    if (btnNext) {
      btnNext.style.display = isLastStep ? 'none' : 'inline-flex';
    }
    if (btnStart) {
      btnStart.classList.toggle('visible', isLastStep);
    }
  }

  prevTutorialStep() {
    if (this.currentTutorialStep > 0) {
      this.setTutorialStep(this.currentTutorialStep - 1);
    }
  }

  nextTutorialStep() {
    if (this.currentTutorialStep < this.totalTutorialSteps - 1) {
      this.setTutorialStep(this.currentTutorialStep + 1);
    }
  }

  openTutorial(step = 0) {
    this.isTutorialOpen = true;
    this.setTutorialStep(step);
    this.tutorialModal?.classList.remove('hidden');
    this.sound.init();
  }

  closeTutorial() {
    this.isTutorialOpen = false;
    this.tutorialModal?.classList.add('hidden');
  }

  // ==========================================================================
  // Telemetry Stats Modal Controller
  // ==========================================================================
  openStats() {
    this.isStatsOpen = true;
    this.statsModal?.classList.remove('hidden');
    this.updateStatsUI();
  }

  closeStats() {
    this.isStatsOpen = false;
    this.statsModal?.classList.add('hidden');
  }

  toggleStats() {
    if (this.isStatsOpen) {
      this.closeStats();
    } else {
      this.openStats();
    }
  }

  updateStatsUI() {
    if (this.statsHpVal) {
      this.statsHpVal.textContent = `${Math.max(0, Math.ceil(this.player.hp))} / 100 HP`;
    }
    if (this.statsHpFill) {
      const pct = Math.max(0, Math.min(100, this.player.hp));
      this.statsHpFill.style.width = `${pct}%`;
      this.statsHpFill.classList.remove('warning', 'danger');
      if (pct <= 30) this.statsHpFill.classList.add('danger');
      else if (pct <= 60) this.statsHpFill.classList.add('warning');
    }
    const totalUptime = this.racks.reduce((acc, r) => acc + r.uptime, 0);
    const avgUptime = (totalUptime / this.racks.length).toFixed(1);
    if (this.statsUptimeVal) this.statsUptimeVal.textContent = `${avgUptime}%`;
    if (this.statsUptimeFill) this.statsUptimeFill.style.width = `${avgUptime}%`;
    if (this.statsCreditsVal) this.statsCreditsVal.textContent = `${this.credits} ⚡`;
    if (this.statsFpsVal) {
      this.statsFpsVal.textContent = `${this.currentFps} FPS`;
      if (this.currentFps >= 50) this.statsFpsVal.style.color = '#00ff9d';
      else if (this.currentFps >= 30) this.statsFpsVal.style.color = '#ffb800';
      else this.statsFpsVal.style.color = '#ff2a55';
    }
    if (this.statsSpeedVal) {
      const speed = (this.player.getSpeed() / 30).toFixed(1);
      this.statsSpeedVal.textContent = `${speed} m/s`;
    }
    if (this.statsFaultsVal) {
      const failingCount = this.racks.filter(r => r.isFailing && !r.isDestroyed).length;
      this.statsFaultsVal.textContent = failingCount === 1 ? '1 FAULT' : `${failingCount} FAULTS`;
      this.statsFaultsVal.style.color = failingCount > 0 ? '#ffb800' : '#00ff9d';
    }

    // Character Attributes & Powerups Readout
    const charSpeed = document.getElementById('char-stat-speed');
    const charFriction = document.getElementById('char-stat-friction');
    const charCannon = document.getElementById('char-stat-cannon');
    const charTeleport = document.getElementById('char-stat-teleport');
    const charUpgradesSummary = document.getElementById('char-upgrades-summary');

    if (charSpeed) {
      const topSpeed = (CONFIG.SPEED ?? 650) + this.player.permanentSpeedBonus;
      charSpeed.textContent = `${topSpeed} px/s (+${this.player.permanentSpeedBonus})`;
    }
    if (charFriction) {
      const baseFriction = this.player.hasTeflonSkids ? 0.988 : (CONFIG.FRICTION ?? 0.982);
      const curFriction = Math.max(0.920, baseFriction - this.player.permanentFrictionBonus).toFixed(3);
      charFriction.textContent = `${curFriction} (Traction: +${this.player.permanentFrictionBonus.toFixed(3)})`;
    }
    if (charCannon) {
      charCannon.textContent = `${this.cannonCharges} Charge${this.cannonCharges === 1 ? '' : 's'}`;
    }
    if (charTeleport) {
      if (!this.hasTeleporterItem) {
        charTeleport.textContent = 'LOCKED (DEFEAT BUG BOSS)';
        charTeleport.style.color = '#94a3b8';
      } else if (this.teleporterNodes.length < 2) {
        charTeleport.textContent = `READY (${this.teleporterNodes.length}/2 NODES SET)`;
        charTeleport.style.color = '#00f3ff';
      } else {
        charTeleport.textContent = 'SUPSPACE LINK ONLINE';
        charTeleport.style.color = '#00ff9d';
      }
    }
    if (charUpgradesSummary) {
      const items = [];
      if (this.energyDrinkPurchases > 0) items.push(`Energy Drinks (x${this.energyDrinkPurchases})`);
      if (this.magnetPurchases > 0) items.push(`Floor Magnets (x${this.magnetPurchases})`);
      if (this.player.hasNitrous) items.push('Nitrous Afterburners');
      if (this.player.hasSlalomSprings) items.push('Slalom Springs');
      if (this.player.hasTeflonSkids) items.push('Teflon Skids');
      if (this.player.hasSpikedBumper) items.push('Spiked Bumper');
      if (this.player.hasEmpShockwave) items.push('EMP Shockwave');
      if (this.player.hasHexDecoder) items.push('Hex Keypad Decoder');
      if (this.player.hasSuperReel) items.push('Super Magnetic Reel');
      if (this.player.hasPhaseDash) items.push('Phase Dash Coil');
      if (this.hasYieldBonds) items.push('High-Yield Bonds');
      if (this.player.defibrillatorCharges > 0) items.push(`Defibrillator (x${this.player.defibrillatorCharges})`);
      charUpgradesSummary.textContent = items.length > 0 
        ? `Purchased Powerups: ${items.join(', ')}` 
        : 'Purchased Powerups: None (Visit IT Supply Depot [K])';
    }
  }

  // ==========================================================================
  // System Settings & Performance Configuration
  // ==========================================================================
  openSettings() {
    this.isSettingsOpen = true;
    this.settingsModal?.classList.remove('hidden');
    this.updateSettingsUI();
  }

  closeSettings() {
    this.isSettingsOpen = false;
    this.settingsModal?.classList.add('hidden');
  }

  toggleOptimizedMode() {
    this.isOptimizedMode = !this.isOptimizedMode;
    localStorage.setItem('cabled_in_perf_mode', this.isOptimizedMode ? 'true' : 'false');
    this.applySettings(true);
  }

  toggleFpsMeter() {
    this.showFpsMeter = !this.showFpsMeter;
    localStorage.setItem('cabled_in_show_fps', this.showFpsMeter ? 'true' : 'false');
    this.applySettings(false);
  }

  toggleCrtFilter() {
    this.crtFilterEnabled = !this.crtFilterEnabled;
    localStorage.setItem('cabled_in_crt_filter', this.crtFilterEnabled ? 'true' : 'false');
    this.applySettings(false);
  }

  toggleDevMode() {
    this.isDevMode = !this.isDevMode;
    localStorage.setItem('cabled_in_dev_mode', this.isDevMode ? 'true' : 'false');
    this.sound.playUpgrade();
    this.updateSettingsUI();
    this.showTemporaryToast(
      this.isDevMode
        ? '🛠️ DEV MODE ENABLED // Debug keys unlocked [B: Boss, N: Bug, 1-3: Errors, 8: Fire, 9: Virus]'
        : '🔒 DEV MODE DISABLED // Debug keys locked',
      this.isDevMode ? '🛠️' : '🔒'
    );
  }

  applySettings(showToast = false) {
    if (this.isOptimizedMode) {
      document.body.classList.add('perf-optimized');
    } else {
      document.body.classList.remove('perf-optimized');
    }

    if (this.fpsCard) {
      this.fpsCard.style.display = this.showFpsMeter ? 'flex' : 'none';
    }

    if (this.crtOverlay) {
      if (this.isOptimizedMode || !this.crtFilterEnabled) {
        this.crtOverlay.style.display = 'none';
      } else {
        this.crtOverlay.style.display = 'block';
      }
    }

    this.updateSettingsUI();
    this.resizeCanvas();

    if (showToast) {
      if (this.isOptimizedMode) {
        this.showTemporaryToast('⚡ TURBO SMOOTH MODE ACTIVE: 60 FPS profile applied!', '🚀');
      } else {
        this.showTemporaryToast('💎 ULTRA GRAPHICS PROFILE RESTORED', '✨');
      }
    }
  }

  updateSettingsUI() {
    if (this.settingTogglePerf) {
      this.settingTogglePerf.classList.toggle('active', this.isOptimizedMode);
      const lbl = this.settingTogglePerf.querySelector('.switch-label');
      if (lbl) lbl.textContent = this.isOptimizedMode ? 'ON' : 'OFF';
    }

    if (this.settingToggleFps) {
      this.settingToggleFps.classList.toggle('active', this.showFpsMeter);
      const lbl = this.settingToggleFps.querySelector('.switch-label');
      if (lbl) lbl.textContent = this.showFpsMeter ? 'ON' : 'OFF';
    }

    if (this.settingToggleCrt) {
      const active = this.crtFilterEnabled && !this.isOptimizedMode;
      this.settingToggleCrt.classList.toggle('active', active);
      const lbl = this.settingToggleCrt.querySelector('.switch-label');
      if (lbl) lbl.textContent = active ? 'ON' : (this.isOptimizedMode ? 'BYPASS' : 'OFF');
    }

    if (this.settingToggleDev) {
      this.settingToggleDev.classList.toggle('active', this.isDevMode);
      const lbl = this.settingToggleDev.querySelector('.switch-label');
      if (lbl) lbl.textContent = this.isDevMode ? 'ON' : 'OFF';
    }

    if (this.perfStatusDot) {
      this.perfStatusDot.classList.toggle('active-perf', this.isOptimizedMode);
    }
    if (this.perfStatusText) {
      this.perfStatusText.textContent = this.isOptimizedMode
        ? 'ACTIVE PROFILE: ⚡ TURBO SMOOTH (60 FPS / Low GPU Load)'
        : 'ACTIVE PROFILE: 💎 ULTRA FIDELITY (High Resolution)';
      this.perfStatusText.style.color = this.isOptimizedMode ? '#00ff9d' : '#00f3ff';
    }
  }

  createFloorPattern() {
    try {
      const tileSize = CONFIG.WORLD.TILE_SIZE; // 64
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = tileSize * 2;
      patternCanvas.height = tileSize * 2;
      const pCtx = patternCanvas.getContext('2d');
      if (!pCtx) return null;

      // 2x2 grid pattern (alternating light / dark tiles)
      pCtx.fillStyle = CONFIG.COLORS.BG_TILE_LIGHT;
      pCtx.fillRect(0, 0, tileSize, tileSize);
      pCtx.fillRect(tileSize, tileSize, tileSize, tileSize);

      pCtx.fillStyle = CONFIG.COLORS.BG_TILE_DARK;
      pCtx.fillRect(tileSize, 0, tileSize, tileSize);
      pCtx.fillRect(0, tileSize, tileSize, tileSize);

      // Clean grid lines
      pCtx.strokeStyle = CONFIG.COLORS.GRID_LINE;
      pCtx.lineWidth = 1;
      pCtx.strokeRect(0.5, 0.5, tileSize * 2 - 1, tileSize * 2 - 1);
      pCtx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);
      pCtx.strokeRect(tileSize + 0.5, tileSize + 0.5, tileSize - 1, tileSize - 1);

      return this.ctx.createPattern(patternCanvas, 'repeat');
    } catch (e) {
      console.warn('Could not create floor pattern:', e);
      return null;
    }
  }

  startGame() {
    this.gameState = 'PLAYING';
    this.isPaused = false;
    this.isTutorialOpen = false;
    this.tutorialModal?.classList.add('hidden');
    this.pauseModal?.classList.add('hidden');
    this.mainMenuOverlay?.classList.add('hidden');
    this.hudOverlay?.classList.remove('hidden');

    // Place player at warehouse center
    this.player.x = CONFIG.WORLD.WIDTH / 2;
    this.player.y = CONFIG.WORLD.HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.targetX = this.player.x;
    this.camera.targetY = this.player.y;

    // Reset player health and boss state
    this.player.hp = 100;
    this.player.invulnerableTimer = 0;
    this.updatePlayerHealthUI();
    this.bugBoss = null;
    this.bossSpawned = false;
    this.smallBugs = [];
    this.isGameOver = false;
    this.gameTime = 0;
    this.currentBossWave = 0;
    if (this.bossHostRack) {
      this.bossHostRack.isBossHost = false;
      this.bossHostRack = null;
    }
    this.bossHudBanner?.classList.add('hidden');
    this.hasTeleporterItem = false;
    this.teleporterNodes = [];
    this.teleportCooldown = 0;
    this.unlockedErrors = new Set();
    this.updateBuffDisplay();

    // Reset all racks to fully operational
    for (const rack of this.racks) {
      rack.isDestroyed = false;
      rack.isFailing = false;
      rack.uptime = 100;
      rack.failDuration = 0;
      rack.isShutdown = false;
      rack.isVirusInfected = false;
      rack.isTargetDestination = false;
      rack.error = null;
    }

    this.sound.init();
    this.sound.playUpgrade();
    this.showTemporaryToast('🚀 SHIFT STARTED // MONITOR WAREHOUSE NODES', '⚡');
    this.keys = {};
  }

  startNewGame() {
    this.startGame();
  }

  checkLocalQuickSave() {
    const btnContinue = document.getElementById('btn-menu-continue');
    if (!btnContinue) return;
    try {
      const qs = localStorage.getItem('cabled_in_quicksave');
      if (qs) {
        btnContinue.classList.remove('hidden');
      } else {
        btnContinue.classList.add('hidden');
      }
    } catch (e) {
      btnContinue.classList.add('hidden');
    }
  }

  quickSaveToBrowser() {
    // Prevent saving during active boss encounter
    if (this.activeBoss && this.activeBoss.isAlive) {
      this.sound.playTerminalFail();
      this.showTemporaryToast('⚠️ EMERGENCY PROTOCOL: CANNOT SAVE RUN DURING ACTIVE BOSS ENCOUNTER!', '⚠️');
      return;
    }

    try {
      const saveData = this.serializeSaveData();
      localStorage.setItem('cabled_in_quicksave', JSON.stringify(saveData));
      this.checkLocalQuickSave();
      this.sound.playUpgrade();
      this.showTemporaryToast('💾 RUN QUICK-SAVED TO BROWSER STORAGE!', '✅');
    } catch (err) {
      console.error('Quick-save failed:', err);
      this.sound.playTerminalFail();
      this.showTemporaryToast('❌ ERROR SAVING TO BROWSER STORAGE!');
    }
  }

  loadQuickSaveFromBrowser() {
    try {
      const qs = localStorage.getItem('cabled_in_quicksave');
      if (!qs) {
        this.showTemporaryToast('⚠️ NO SAVED RUN FOUND IN BROWSER STORAGE!');
        return;
      }
      const data = JSON.parse(qs);
      this.pendingLoadedRunData = data;
      this.showRunPreviewModal(data);
    } catch (err) {
      console.error('Failed to load quick-save:', err);
      this.showTemporaryToast('❌ INVALID BROWSER SAVE DATA!');
    }
  }

  returnToMainMenu() {
    this.gameState = 'MENU';
    this.isPaused = false;
    this.isGameOver = false;
    this.isTutorialOpen = false;
    this.isShopOpen = false;
    this.isTerminalOpen = false;
    this.gameOverModal?.classList.add('hidden');
    this.runPreviewModal?.classList.add('hidden');
    this.leaderboardModal?.classList.add('hidden');
    this.resumeCountdownOverlay?.classList.add('hidden');
    if (this.isCannonAiming) this.cancelCannonAim();
    if (this.rebootingRack) {
      this.sound.stopRebootCharge();
      this.rebootingRack = null;
      this.rebootHoldTime = 0;
    }
    this.bugBoss = null;
    this.bossSpawned = false;
    this.smallBugs = [];
    if (this.bossHostRack) {
      this.bossHostRack.isBossHost = false;
      this.bossHostRack = null;
    }
    this.bossHudBanner?.classList.add('hidden');
    this.player.hp = 100;
    this.updatePlayerHealthUI();

    this.tutorialModal?.classList.add('hidden');
    this.shopModal?.classList.add('hidden');
    this.terminalModal?.classList.add('hidden');
    this.pauseModal?.classList.add('hidden');
    this.hudOverlay?.classList.add('hidden');
    this.mainMenuOverlay?.classList.remove('hidden');
    this.checkLocalQuickSave();
    this.keys = {};
  }

  // ==========================================================================
  // Save & Load Run State Management System (.json file export/import)
  // ==========================================================================
  serializeSaveData() {
    const rackStates = this.racks.map(r => {
      let errData = null;
      if (r.isFailing && r.error) {
        errData = {
          type: r.error.type,
          partnerId: r.error.partnerId || r.error.partnerRack?.id || null,
          targetId: r.error.targetRack?.id || null,
          hopIds: r.error.hops ? r.error.hops.map(h => h.id) : null,
          code: r.error.code || null,
          hasBeenInspected: Boolean(r.error.hasBeenInspected),
          description: r.error.description || ''
        };
      }
      return {
        id: r.id,
        x: r.x,
        y: r.y,
        uptime: r.uptime,
        isFailing: r.isFailing,
        isDestroyed: r.isDestroyed,
        failDuration: r.failDuration,
        isShutdown: Boolean(r.isShutdown),
        isVirusInfected: Boolean(r.isVirusInfected),
        code: r.code,
        error: errData
      };
    });

    const activeCableData = this.activeCable ? {
      type: this.activeCable instanceof MultiHopCable ? 'MultiHopCable' :
            (this.activeCable instanceof RestraintRope ? 'RestraintRope' :
            (this.activeCable instanceof ContainmentWire ? 'ContainmentWire' : 'PatchCable')),
      sourceId: this.activeCable.sourceRack?.id || null,
      targetId: this.activeCable.targetRack?.id || null,
      hopIds: this.activeCable.hops ? this.activeCable.hops.map(h => h.id) : null,
      currentHopIndex: this.activeCable.currentHopIndex || 0
    } : null;

    const connectedCablesData = this.connectedCables.map(c => ({
      sourceId: c.sourceRack?.id || null,
      targetId: c.targetRack?.id || null,
      hopIds: c.hops ? c.hops.map(h => h.id) : null
    }));

    return {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      gameTime: this.gameTime,
      credits: this.credits,
      currentBossWave: this.currentBossWave || 0,
      player: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        permanentSpeedBonus: this.player.permanentSpeedBonus,
        permanentFrictionBonus: this.player.permanentFrictionBonus,
        hasNitrous: Boolean(this.player.hasNitrous),
        hasSlalomSprings: Boolean(this.player.hasSlalomSprings),
        hasTeflonSkids: Boolean(this.player.hasTeflonSkids),
        hasSpikedBumper: Boolean(this.player.hasSpikedBumper),
        hasEmpShockwave: Boolean(this.player.hasEmpShockwave),
        hasHexDecoder: Boolean(this.player.hasHexDecoder),
        hasSuperReel: Boolean(this.player.hasSuperReel),
        hasPhaseDash: Boolean(this.player.hasPhaseDash),
        hasCryoShield: Boolean(this.player.hasCryoShield),
        defibrillatorCharges: this.player.defibrillatorCharges || 0
      },
      upgrades: {
        energyDrinkPurchases: this.energyDrinkPurchases || 0,
        magnetPurchases: this.magnetPurchases || 0,
        cannonCharges: this.cannonCharges || 0,
        hasPortableTerminal: Boolean(this.hasPortableTerminal),
        portableTerminal: this.portableTerminal ? { x: this.portableTerminal.x, y: this.portableTerminal.y } : null,
        shopClearanceLevel: this.shopClearanceLevel || 0,
        powerupMaxLimitBonus: this.powerupMaxLimitBonus || 0,
        hasTeleporterItem: Boolean(this.hasTeleporterItem),
        teleporterNodes: this.teleporterNodes.map(n => ({
          id: n.id,
          name: n.name,
          x: n.x,
          y: n.y,
          color: n.color,
          secondaryColor: n.secondaryColor
        })),
        hasYieldBonds: Boolean(this.hasYieldBonds),
        activeSynergies: { ...this.activeSynergies }
      },
      racks: rackStates,
      activeCable: activeCableData,
      connectedCables: connectedCablesData
    };
  }

  downloadSaveFile() {
    // Prevent saving during active boss encounter
    if (this.activeBoss && this.activeBoss.isAlive) {
      this.sound.playTerminalFail();
      this.showTemporaryToast('⚠️ EMERGENCY PROTOCOL: CANNOT SAVE RUN DURING ACTIVE BOSS ENCOUNTER!', '⚠️');
      return;
    }

    try {
      const saveData = this.serializeSaveData();
      const jsonStr = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timeTag = Math.floor(this.gameTime);
      a.href = url;
      a.download = `cabled_in_save_t${timeTag}s_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.sound.playUpgrade();
      this.showTemporaryToast('💾 RUN STATE SAVED & DOWNLOADED AS JSON!', '✅');
    } catch (err) {
      console.error('Save file generation failed:', err);
      this.sound.playTerminalFail();
      this.showTemporaryToast('❌ ERROR GENERATING SAVE FILE!');
    }
  }

  openSaveFilePicker() {
    if (this.saveFileInput) {
      this.saveFileInput.value = '';
      this.saveFileInput.click();
    }
  }

  handleSaveFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || !data.player || !Array.isArray(data.racks)) {
          throw new Error('Invalid or corrupted Cabled In save file schema.');
        }
        this.pendingLoadedRunData = data;
        this.showRunPreviewModal(data);
      } catch (err) {
        console.error('Failed to parse save file:', err);
        this.sound.playTerminalFail();
        alert('Could not read save file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  showRunPreviewModal(data) {
    if (this.previewShiftTime) {
      const totalSec = Math.floor(data.gameTime || 0);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      this.previewShiftTime.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
    }

    if (this.previewRacksHealth) {
      const totalRacks = data.racks.length;
      const destroyed = data.racks.filter(r => r.isDestroyed).length;
      const operational = totalRacks - destroyed;
      const pct = Math.round((operational / totalRacks) * 100);
      this.previewRacksHealth.textContent = `${pct}% Online (${operational}/${totalRacks})`;
    }

    if (this.previewActiveFaults) {
      const faults = data.racks.filter(r => r.isFailing && !r.isDestroyed).length;
      this.previewActiveFaults.textContent = faults === 1 ? '1 Fault Active' : `${faults} Faults Active`;
    }

    if (this.previewCredits) {
      this.previewCredits.textContent = `${data.credits ?? 0} ⚡`;
    }

    if (this.previewBossWave) {
      this.previewBossWave.textContent = `Wave ${data.currentBossWave || 1}`;
    }

    if (this.previewSaveDate) {
      this.previewSaveDate.textContent = data.formattedDate || data.timestamp || 'Unknown';
    }

    if (this.previewPowerupsList) {
      const p = data.player || {};
      const u = data.upgrades || {};
      const items = [];
      if (u.energyDrinkPurchases) items.push(`🥤 Energy Drinks x${u.energyDrinkPurchases}`);
      if (p.hasNitrous) items.push('🚀 Nitrous Boost');
      if (p.hasSlalomSprings) items.push('🌀 Slalom Springs');
      if (p.hasTeflonSkids) items.push('⛸️ Teflon Skids');
      if (p.hasSpikedBumper) items.push('🛡️ Spiked Bumper');
      if (p.hasEmpShockwave) items.push('⚡ EMP Shockwave');
      if (p.hasHexDecoder) items.push('🔢 Hex Decoder');
      if (p.hasCryoShield) items.push('🛡️ Cryo Deflector Shield');
      if (p.hasPhaseDash) items.push('⚡ Phase Dash Module');
      if (u.hasTeleporterItem) items.push('🌌 Quantum Teleporter');
      if (u.hasPortableTerminal) items.push('💻 Field NOC Terminal');
      if (u.shopClearanceLevel) items.push(`🔓 Clearance Lv.${u.shopClearanceLevel}`);
      if (u.hasYieldBonds) items.push('📈 High-Yield Bonds');

      this.previewPowerupsList.innerHTML = items.length > 0
        ? items.map(it => `<span class="preview-chip">${it}</span>`).join(' ')
        : '<span style="color: #64748b;">No upgrades installed</span>';
    }

    this.runPreviewModal?.classList.remove('hidden');
    this.sound.playPowerup();
  }

  closeRunPreviewModal() {
    this.runPreviewModal?.classList.add('hidden');
    this.pendingLoadedRunData = null;
  }

  applyLoadedSave(data) {
    this.closeRunPreviewModal();

    this.gameState = 'PLAYING';
    this.isPaused = false;
    this.isGameOver = false;
    this.isTerminalOpen = false;
    this.terminalModal?.classList.add('hidden');
    this.isShopOpen = false;
    this.shopModal?.classList.add('hidden');
    this.isTutorialOpen = false;
    this.tutorialModal?.classList.add('hidden');
    this.pauseModal?.classList.add('hidden');
    this.mainMenuOverlay?.classList.add('hidden');
    this.gameOverModal?.classList.add('hidden');
    this.hudOverlay?.classList.remove('hidden');

    // Restore Clocks and Progression
    this.gameTime = data.gameTime || 0;
    this.credits = data.credits || 0;
    this.currentBossWave = data.currentBossWave || 0;
    this.activeBoss = null;
    this.bugBoss = null;
    this.bossSpawned = false;
    this.smallBugs = [];

    // Restore Player Coordinates & Powerups
    const pData = data.player || {};
    this.player.x = pData.x ?? CONFIG.WORLD.WIDTH / 2;
    this.player.y = pData.y ?? CONFIG.WORLD.HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = pData.hp ?? 100;
    this.player.maxHp = pData.maxHp ?? 100;
    this.player.permanentSpeedBonus = pData.permanentSpeedBonus ?? 0;
    this.player.permanentFrictionBonus = pData.permanentFrictionBonus ?? 0;
    this.player.hasNitrous = Boolean(pData.hasNitrous);
    this.player.hasSlalomSprings = Boolean(pData.hasSlalomSprings);
    this.player.hasTeflonSkids = Boolean(pData.hasTeflonSkids);
    this.player.hasSpikedBumper = Boolean(pData.hasSpikedBumper);
    this.player.hasEmpShockwave = Boolean(pData.hasEmpShockwave);
    this.player.hasHexDecoder = Boolean(pData.hasHexDecoder);
    this.player.hasSuperReel = Boolean(pData.hasSuperReel);
    this.player.hasPhaseDash = Boolean(pData.hasPhaseDash);
    this.player.hasCryoShield = Boolean(pData.hasCryoShield);
    this.player.defibrillatorCharges = pData.defibrillatorCharges ?? 0;

    // Restore Upgrades & Synergies
    const uData = data.upgrades || {};
    this.energyDrinkPurchases = uData.energyDrinkPurchases ?? 0;
    this.magnetPurchases = 0; // Magnet powerup deprecated & removed
    this.cannonCharges = uData.cannonCharges ?? 1;
    this.hasTeleporterItem = Boolean(uData.hasTeleporterItem);
    this.hasYieldBonds = Boolean(uData.hasYieldBonds);
    this.hasPortableTerminal = Boolean(uData.hasPortableTerminal);
    this.shopClearanceLevel = uData.shopClearanceLevel ?? 0;
    this.powerupMaxLimitBonus = uData.powerupMaxLimitBonus ?? 0;
    if (uData.portableTerminal && typeof uData.portableTerminal.x === 'number') {
      this.portableTerminal = new PortableTerminalStation(uData.portableTerminal.x, uData.portableTerminal.y);
    } else {
      this.portableTerminal = null;
    }
    if (uData.activeSynergies) {
      this.activeSynergies = { ...uData.activeSynergies };
    }

    // Restore Quantum Teleporters
    this.teleporterNodes = [];
    if (Array.isArray(uData.teleporterNodes)) {
      uData.teleporterNodes.forEach(n => {
        const isAlpha = (n.id === 'alpha');
        const defaultColor = isAlpha ? (CONFIG.COLORS?.TELEPORTER_ALPHA ?? '#00f3ff') : (CONFIG.COLORS?.TELEPORTER_BETA ?? '#e024c3');
        const defaultSecColor = isAlpha ? '#00ff9d' : '#ff007f';
        const tNode = new TeleporterNode(
          n.id,
          n.x,
          n.y,
          n.name || (isAlpha ? 'NODE α' : 'NODE β'),
          n.color || defaultColor,
          n.secondaryColor || defaultSecColor
        );
        this.teleporterNodes.push(tNode);
      });
    }

    // Center camera on player's saved position
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.targetX = this.player.x;
    this.camera.targetY = this.player.y;

    // Restore Server Racks
    if (Array.isArray(data.racks)) {
      const rackMap = new Map();
      data.racks.forEach(rState => {
        let rack = this.racks.find(r => r.id === rState.id);
        if (rack) {
          rack.uptime = rState.uptime ?? 100;
          rack.isFailing = Boolean(rState.isFailing);
          rack.isDestroyed = Boolean(rState.isDestroyed);
          rack.failDuration = rState.failDuration ?? 0;
          rack.isShutdown = Boolean(rState.isShutdown);
          rack.isVirusInfected = Boolean(rState.isVirusInfected);
          rack.code = rState.code || rack.code;
          rack.error = null;
          rackMap.set(rack.id, { rack, state: rState });
        }
      });

      // Restore rack error references (partners, hops, descriptions)
      rackMap.forEach(({ rack, state }) => {
        if (state.isFailing && state.error) {
          const e = state.error;
          rack.error = {
            type: e.type,
            code: e.code || rack.code,
            hasBeenInspected: Boolean(e.hasBeenInspected),
            description: e.description || ''
          };
          if (e.partnerId) {
            const partner = this.racks.find(r => r.id === e.partnerId);
            if (partner) {
              rack.error.partnerRack = partner;
              rack.error.partnerId = partner.id;
            }
          }
          if (e.targetId) {
            const tgt = this.racks.find(r => r.id === e.targetId);
            if (tgt) rack.error.targetRack = tgt;
          }
          if (Array.isArray(e.hopIds)) {
            rack.error.hops = e.hopIds.map(hid => this.racks.find(r => r.id === hid)).filter(Boolean);
          }
        }
      });
    }

    // Restore active cables
    this.activeCable = null;
    this.connectedCables = [];
    if (data.activeCable && data.activeCable.sourceId) {
      const src = this.racks.find(r => r.id === data.activeCable.sourceId);
      const tgt = this.racks.find(r => r.id === data.activeCable.targetId);
      if (src && tgt && data.activeCable.type === 'PatchCable') {
        this.activeCable = new PatchCable(src, tgt);
      }
    }

    this.updatePlayerHealthUI();
    this.updateCreditsUI();
    this.updateBuffDisplay();
    this.updateShopButtons();

    // Start 3-Second Countdown before operator movement resumes
    this.startResumeCountdown();
  }

  startResumeCountdown() {
    this.isResumingFromSave = true;
    this.gameState = 'COUNTDOWN';
    this.resumeCountdownTimer = 3.0;
    if (this.countdownNumber) this.countdownNumber.textContent = '3';
    this.resumeCountdownOverlay?.classList.remove('hidden');
    this.sound.playKey();
  }

  // ==========================================================================
  // Endless Leaderboard Records & Game Over Handling
  // ==========================================================================
  triggerGameOver() {
    this.isGameOver = true;
    this.gameState = 'GAME_OVER';
    if (this.isCannonAiming) this.cancelCannonAim();
    this.sound.playExplosion();

    // Calculate run statistics
    const totalSec = Math.floor(this.gameTime || 0);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const durStr = `${m}m ${String(s).padStart(2, '0')}s`;

    if (this.goDuration) this.goDuration.textContent = durStr;
    if (this.goBosses) this.goBosses.textContent = `${this.currentBossWave || 0}`;
    if (this.goCredits) this.goCredits.textContent = `${this.credits} ⚡`;

    const isNewRecord = this.recordLeaderboardEntry({
      durationSec: totalSec,
      durationStr: durStr,
      bossesCleared: this.currentBossWave || 0,
      credits: this.credits,
      dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    if (this.goRecord) {
      this.goRecord.textContent = isNewRecord ? '⭐ NEW RECORD SAVED!' : 'SHIFT LOGGED';
      this.goRecord.style.color = isNewRecord ? '#ffb800' : '#a855f7';
    }

    this.gameOverModal?.classList.remove('hidden');
    this.sound.playAlarm();
  }

  getLeaderboardRecords() {
    try {
      const raw = localStorage.getItem('cabled_in_leaderboard');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to parse leaderboard:', e);
      return [];
    }
  }

  recordLeaderboardEntry(entry) {
    const records = this.getLeaderboardRecords();
    records.push(entry);
    records.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
    const trimmed = records.slice(0, 10);
    try {
      localStorage.setItem('cabled_in_leaderboard', JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to store leaderboard:', e);
    }
    return trimmed[0]?.durationSec === entry.durationSec;
  }

  openLeaderboard() {
    this.renderLeaderboardTable();
    this.leaderboardModal?.classList.remove('hidden');
    this.sound.playKey();
  }

  closeLeaderboard() {
    this.leaderboardModal?.classList.add('hidden');
  }

  renderLeaderboardTable() {
    if (!this.leaderboardTbody) return;
    const records = this.getLeaderboardRecords();
    this.leaderboardTbody.innerHTML = '';

    if (records.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" style="text-align: center; color: #64748b; padding: 22px;">NO RECORDED RUNS YET. START A SHIFT TO RECORD YOUR SURVIVAL TIME!</td>';
      this.leaderboardTbody.appendChild(row);
      return;
    }

    records.forEach((rec, idx) => {
      const row = document.createElement('tr');
      const rankBadge = idx === 0 ? '🥇 1ST' : (idx === 1 ? '🥈 2ND' : (idx === 2 ? '🥉 3RD' : `#${idx + 1}`));
      row.innerHTML = `
        <td style="font-weight: 700; color: ${idx === 0 ? '#ffb800' : (idx === 1 ? '#00f3ff' : '#94a3b8')};">${rankBadge}</td>
        <td style="color: #00ff9d; font-weight: 700;">${rec.durationStr || '0m 00s'}</td>
        <td style="color: #ffaa00;">${rec.bossesCleared ?? 0} Waves</td>
        <td style="color: #00f3ff;">${rec.credits ?? 0} ⚡</td>
        <td style="color: #64748b;">${rec.dateStr || '--'}</td>
      `;
      this.leaderboardTbody.appendChild(row);
    });
  }

  clearLeaderboard() {
    if (confirm('Are you sure you want to reset your local data center uptime records?')) {
      localStorage.removeItem('cabled_in_leaderboard');
      this.renderLeaderboardTable();
      this.sound.playKey();
    }
  }

  // ==========================================================================
  // Kinetic Cannon Slingshot & Air Hockey Puck System
  // ==========================================================================
  armCannon() {
    if (this.cannonCharges <= 0) {
      this.sound.playError();
      this.showTemporaryToast('❌ NO CANNON CHARGES // PURCHASE AT IT SUPPLY DEPOT [K]');
      return;
    }
    if (this.isShopOpen) this.closeShop();
    if (this.isTerminalOpen) this.closeTerminal();
    this.isCannonAiming = true;
    this.sound.playTimeFreeze();
    this.showTemporaryToast('🎯 CANNON ARMED // AIM WITH MOUSE // CLICK OR [SPACE] TO LAUNCH // [ESC] CANCEL');
    this.updateBuffDisplay();
  }

  cancelCannonAim() {
    if (!this.isCannonAiming) return;
    this.isCannonAiming = false;
    this.sound.playKey();
    this.showTemporaryToast('🎯 CANNON AIM CANCELLED (CHARGE PRESERVED)');
    this.updateBuffDisplay();
  }

  fireCannon() {
    if (!this.isCannonAiming || this.cannonCharges <= 0) return;

    this.isCannonAiming = false;
    this.cannonCharges--;
    this.sound.playCannonLaunch();
    this.camera.shake(26, 0.5);

    const launchSpeed = CONFIG.CANNON.LAUNCH_SPEED ?? 2150;
    this.player.vx = Math.cos(this.aimAngle) * launchSpeed;
    this.player.vy = Math.sin(this.aimAngle) * launchSpeed;
    this.player.angle = this.aimAngle;
    this.cannonPuckTimer = CONFIG.CANNON.PUCK_GLIDE_TIME ?? 2.8;

    // Launch propulsion shockwave sparks behind player
    const backAngle = this.aimAngle + Math.PI;
    for (let i = 0; i < 35; i++) {
      const spread = (Math.random() - 0.5) * 1.4;
      const speed = 120 + Math.random() * 320;
      this.particles.particles.push({
        x: this.player.x - Math.cos(this.aimAngle) * this.player.radius,
        y: this.player.y - Math.sin(this.aimAngle) * this.player.radius,
        vx: Math.cos(backAngle + spread) * speed,
        vy: Math.sin(backAngle + spread) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() < 0.6 ? '#00f3ff' : '#ffffff',
        life: 1.0,
        decay: 1.6 + Math.random() * 1.8
      });
    }

    this.showTemporaryToast('💥 KINETIC CANNON FIRED! AIR HOCKEY PUCK GLIDE ENGAGED!');
    this.updateBuffDisplay();
    this.updateObjectiveUI();
  }

  calculateCannonTrajectory(maxDist = (CONFIG.CANNON.TRAJECTORY_MAX_DIST ?? 440)) {
    const startX = this.player.x;
    const startY = this.player.y;
    const dirX = Math.cos(this.aimAngle);
    const dirY = Math.sin(this.aimAngle);

    let closestT = maxDist;
    let hitNormal = null;
    let hitPoint = null;

    // Check server racks near the player
    for (const rack of this.racks) {
      if (Math.abs(rack.x + rack.width / 2 - startX) > maxDist + 100 ||
          Math.abs(rack.y + rack.height / 2 - startY) > maxDist + 100) {
        continue;
      }
      const minX = rack.x - this.player.radius;
      const maxX = rack.x + rack.width + this.player.radius;
      const minY = rack.y - this.player.radius;
      const maxY = rack.y + rack.height + this.player.radius;

      let tNear = -Infinity;
      let tFar = Infinity;
      let normalX = 0, normalY = 0;

      if (Math.abs(dirX) > 0.0001) {
        let t1 = (minX - startX) / dirX;
        let t2 = (maxX - startX) / dirX;
        let n1 = -1, n2 = 1;
        if (t1 > t2) { [t1, t2] = [t2, t1]; n1 = 1; n2 = -1; }
        if (t1 > tNear) { tNear = t1; normalX = n1; normalY = 0; }
        if (t2 < tFar) { tFar = t2; }
      } else {
        if (startX < minX || startX > maxX) continue;
      }

      if (Math.abs(dirY) > 0.0001) {
        let t1 = (minY - startY) / dirY;
        let t2 = (maxY - startY) / dirY;
        let n1 = -1, n2 = 1;
        if (t1 > t2) { [t1, t2] = [t2, t1]; n1 = 1; n2 = -1; }
        if (t1 > tNear) { tNear = t1; normalX = 0; normalY = n1; }
        if (t2 < tFar) { tFar = t2; }
      } else {
        if (startY < minY || startY > maxY) continue;
      }

      if (tNear <= tFar && tNear > 6 && tNear < closestT) {
        closestT = tNear;
        hitNormal = { x: normalX, y: normalY };
        hitPoint = { x: startX + dirX * closestT, y: startY + dirY * closestT };
      }
    }

    // Check world borders
    const bounds = [
      { nx: 1, ny: 0, dist: (this.player.radius - startX) / dirX },
      { nx: -1, ny: 0, dist: (CONFIG.WORLD.WIDTH - this.player.radius - startX) / dirX },
      { nx: 0, ny: 1, dist: (this.player.radius - startY) / dirY },
      { nx: 0, ny: -1, dist: (CONFIG.WORLD.HEIGHT - this.player.radius - startY) / dirY }
    ];

    for (const b of bounds) {
      if (b.dist > 6 && b.dist < closestT) {
        closestT = b.dist;
        hitNormal = { x: b.nx, y: b.ny };
        hitPoint = { x: startX + dirX * closestT, y: startY + dirY * closestT };
      }
    }

    const segments = [];
    const seg1End = hitPoint || { x: startX + dirX * maxDist, y: startY + dirY * maxDist };
    segments.push({
      startX, startY,
      endX: seg1End.x, endY: seg1End.y,
      dirX, dirY,
      len: closestT
    });

    // If an obstacle is struck and distance remains, predict the bounce bank shot!
    if (hitPoint && hitNormal && closestT < maxDist) {
      const remDist = maxDist - closestT;
      const dot = dirX * hitNormal.x + dirY * hitNormal.y;
      const refX = dirX - 2 * dot * hitNormal.x;
      const refY = dirY - 2 * dot * hitNormal.y;
      segments.push({
        startX: hitPoint.x, startY: hitPoint.y,
        endX: hitPoint.x + refX * remDist, endY: hitPoint.y + refY * remDist,
        dirX: refX, dirY: refY,
        len: remDist
      });
    }

    return { segments, hitPoint, hitNormal };
  }

  renderCannonAimingUI(ctx, cam) {
    // 1. Bullet-Time Freeze Vignette
    const vignette = ctx.createRadialGradient(
      this.viewportWidth / 2, this.viewportHeight / 2, this.viewportWidth * 0.15,
      this.viewportWidth / 2, this.viewportHeight / 2, this.viewportWidth * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 243, 255, 0.05)');
    vignette.addColorStop(0.7, 'rgba(3, 8, 22, 0.65)');
    vignette.addColorStop(1, 'rgba(1, 4, 12, 0.88)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // 2. Trajectory Calculation (Angry Birds Dotted Line)
    const trajectory = this.calculateCannonTrajectory();
    const spacing = CONFIG.CANNON.DOT_SPACING ?? 20;
    const maxD = CONFIG.CANNON.TRAJECTORY_MAX_DIST ?? 440;
    let accumulatedDist = 0;

    for (let s = 0; s < trajectory.segments.length; s++) {
      const seg = trajectory.segments[s];
      let d = (spacing - (this.aimAnimOffset % spacing)) % spacing;

      while (d < seg.len) {
        const prog = d / seg.len;
        const wx = seg.startX + (seg.endX - seg.startX) * prog;
        const wy = seg.startY + (seg.endY - seg.startY) * prog;
        const sPos = cam.toScreen(wx, wy);

        const totalD = accumulatedDist + d;
        const taper = Math.max(0.35, 1.0 - (totalD / maxD) * 0.55);
        const dotR = 5.0 * taper;

        // Glow halo
        ctx.beginPath();
        ctx.arc(sPos.x, sPos.y, dotR + 3, 0, Math.PI * 2);
        ctx.fillStyle = s === 0 ? 'rgba(0, 243, 255, 0.35)' : 'rgba(255, 170, 0, 0.35)';
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(sPos.x, sPos.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = s === 0 ? '#ffffff' : '#ffea79';
        ctx.fill();

        d += spacing;
      }
      accumulatedDist += seg.len;
    }

    // 3. Bank-Shot Bounce Ring (if obstacle is hit)
    if (trajectory.hitPoint) {
      const hitScreen = cam.toScreen(trajectory.hitPoint.x, trajectory.hitPoint.y);
      const pulse = 1.0 + 0.2 * Math.sin(performance.now() * 0.01);
      ctx.save();
      ctx.beginPath();
      ctx.arc(hitScreen.x, hitScreen.y, 14 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hitScreen.x, hitScreen.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // 4. Trajectory End Air-Hockey Puck Reticle
    const lastSeg = trajectory.segments[trajectory.segments.length - 1];
    const endPos = cam.toScreen(lastSeg.endX, lastSeg.endY);
    const endAngle = Math.atan2(lastSeg.dirY, lastSeg.dirX);

    ctx.save();
    ctx.translate(endPos.x, endPos.y);
    ctx.rotate(endAngle);

    // Aim chevron / puck icon
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -7);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Player Aim Reticle Aura
    const pPos = cam.toScreen(this.player.x, this.player.y);
    ctx.save();
    ctx.translate(pPos.x, pPos.y);
    const pulseRing = 1.0 + 0.15 * Math.sin(performance.now() * 0.012);
    ctx.beginPath();
    ctx.arc(0, 0, (this.player.radius + 14) * pulseRing, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. Centered Screen Freeze HUD Prompt
    ctx.save();
    const promptY = this.viewportHeight - 95;
    const promptText = '🎯 CANNON ARMED // [LEFT CLICK / SPACE] FIRE SLINGSHOT  |  [ESC] CANCEL';
    ctx.font = 'bold 13px "Orbitron", sans-serif';
    const textW = ctx.measureText(promptText).width;
    const pad = 16;

    ctx.fillStyle = 'rgba(6, 12, 26, 0.94)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.viewportWidth / 2 - textW / 2 - pad, promptY - 16, textW + pad * 2, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'center';
    ctx.fillText(promptText, this.viewportWidth / 2, promptY + 5);
    ctx.restore();
  }

  showTemporaryToast(message, duration = 3500) {
    if (!this.notificationToast || !this.notificationToastText) return;

    // Determine icon and color scheme based on notification type
    let icon = '⚡';
    let borderColor = 'var(--accent-cyan)';
    let glowColor = 'rgba(0, 243, 255, 0.4)';

    if (message.includes('❌') || message.includes('DENIED') || message.includes('INSUFFICIENT')) {
      icon = '❌';
      borderColor = 'var(--accent-crimson)';
      glowColor = 'rgba(255, 42, 85, 0.45)';
    } else if (message.includes('⚠️') || message.includes('WAIT') || message.includes('HOLD')) {
      icon = '⚠️';
      borderColor = 'var(--accent-amber)';
      glowColor = 'rgba(255, 184, 0, 0.45)';
    } else if (message.includes('🎯') || message.includes('CANNON')) {
      icon = '🎯';
      borderColor = '#00f3ff';
      glowColor = 'rgba(0, 243, 255, 0.55)';
    } else if (message.includes('🥤') || message.includes('ENERGY DRINK')) {
      icon = '🥤';
      borderColor = '#ffaa00';
      glowColor = 'rgba(255, 170, 0, 0.5)';
    } else if (message.includes('🧲') || message.includes('MAGNET') || message.includes('GRIP')) {
      icon = '🧲';
      borderColor = '#00ff9d';
      glowColor = 'rgba(0, 255, 157, 0.5)';
    } else if (message.includes('🏗️') || message.includes('CHASSIS') || message.includes('RESTORED') || message.includes('+')) {
      icon = '⚡';
      borderColor = 'var(--accent-emerald)';
      glowColor = 'rgba(0, 255, 157, 0.5)';
    }

    if (this.notificationToastIcon) {
      this.notificationToastIcon.textContent = icon;
    }

    // Strip redundant leading icon if already displayed
    const cleanMessage = message.replace(/^[⚡❌⚠️🎯🚀🧲🤖❄️🏗️✅💥🔌🥤]\s*/, '');
    this.notificationToastText.textContent = cleanMessage;

    this.notificationToast.style.borderColor = borderColor;
    this.notificationToast.style.boxShadow = `0 0 18px ${glowColor}`;

    // Pop-in animation reset
    this.notificationToast.classList.remove('hidden');
    this.notificationToast.style.animation = 'none';
    void this.notificationToast.offsetWidth; // Force CSS reflow to retrigger animation
    this.notificationToast.style.animation = '';

    if (this.notificationToastTimeout) {
      clearTimeout(this.notificationToastTimeout);
    }
    this.notificationToastTimeout = setTimeout(() => {
      this.notificationToast?.classList.add('hidden');
    }, duration);
  }

  executePhaseDash() {
    this.player.dashCooldown = 3.5;
    this.sound.playGlitchStatic();
    this.camera.shake(14, 0.3);

    const dashDist = 220;
    const dirX = Math.cos(this.player.angle);
    const dirY = Math.sin(this.player.angle);

    this.player.x = Math.max(this.player.radius, Math.min(CONFIG.WORLD.WIDTH - this.player.radius, this.player.x + dirX * dashDist));
    this.player.y = Math.max(this.player.radius, Math.min(CONFIG.WORLD.HEIGHT - this.player.radius, this.player.y + dirY * dashDist));
    this.player.invulnerableTimer = 0.8;

    this.particles.spawnSparks(this.player.x, this.player.y, 40, '#a855f7');
    this.showTemporaryToast('⚡ PHASE DASH EXECUTED! BLINKED THROUGH OBSTACLES!', '👻');
    this.updateBuffDisplay();
  }

  executeNitrousBoost() {
    this.player.nitrousTimer = 3.0;
    this.player.nitrousCooldown = 12.0;
    this.sound.playNitrousBurn();
    this.camera.shake(14, 0.3);
    this.particles.spawnSparks(this.player.x, this.player.y, 35, '#00f3ff');
    this.showTemporaryToast('🚀 NITROUS AFTERBURNER ENGAGED (+400 px/s BURST)!', '🔥');
    this.updateBuffDisplay();
  }

  executeEmpShockwave() {
    const cd = (this.activeSynergies.combat >= 2) ? 16.0 : 25.0;
    this.player.empCooldown = cd;
    this.sound.playEmpShockwave();
    this.camera.shake(22, 0.5);

    let bugsStunned = 0;
    for (const bug of this.smallBugs) {
      const d = Math.hypot(this.player.x - bug.x, this.player.y - bug.y);
      if (d < 400) {
        bug.animTime = 0;
        bug.vx = 0;
        bug.vy = 0;
        bugsStunned++;
      }
    }

    const curBoss = this.activeBoss || this.bugBoss;
    if (curBoss && curBoss.isAlive) {
      const bDist = Math.hypot(this.player.x - curBoss.x, this.player.y - curBoss.y);
      if (bDist < 420) {
        curBoss.flinchTimer = 3.5;
        curBoss.vx = 0;
        curBoss.vy = 0;
      }
    }

    this.particles.spawnSparks(this.player.x, this.player.y, 60, '#00f3ff');
    this.showTemporaryToast(`⚡ EMP SHOCKWAVE DETONATED! (${bugsStunned} BUGS & HAZARDS STUNNED FOR 3.5s)`, '⚡');
    this.updateBuffDisplay();
  }

  triggerCoolantLeakError(isDevShortcut = false) {
    const available = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (available.length === 0) return;
    const rack = available[Math.floor(Math.random() * available.length)];
    rack.triggerCoolantLeakError();
    rack.uptime = 85;
    this.sound.playIceShatter();
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 35, '#00f3ff');
    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '⚠️ ';
    this.showTemporaryToast(`${prefix}CRYO PIPE LEAK AT ${rack.id}! FLOOR ICED OVER ➔ HOLD [E] TO SEAL VALVE (3.5s)`, '❄️');
  }

  triggerPhantomGlitchError(isDevShortcut = false) {
    const available = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (available.length < 3) return;
    const rack = available[Math.floor(Math.random() * available.length)];
    const otherCandidates = available.filter(r => r.id !== rack.id);
    const decoys = [otherCandidates[0], otherCandidates[1]];
    decoys.forEach(d => { d.isDecoy = true; });

    rack.triggerPhantomGlitchError(decoys);
    rack.uptime = 90;
    this.sound.playGlitchStatic();
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 35, '#a855f7');
    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '⚠️ ';
    this.showTemporaryToast(`${prefix}HOLO-PHANTOM GLITCH AT ${rack.id}! GHOST COPIES SPAWNED ➔ SCAN REAL SERVER PIN [${rack.code}]`, '👻');
  }

  triggerNetworkWormError(isDevShortcut = false) {
    const available = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (available.length === 0) return;
    const rack = available[Math.floor(Math.random() * available.length)];
    rack.triggerNetworkWormError();
    rack.uptime = 90;
    this.sound.playBossAlarm();
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 40, '#ff0055');
    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '⚠️ ';
    this.showTemporaryToast(`${prefix}NETWORK WORM INFECTED ${rack.id}! WILL SPREAD IN 12s ➔ HOLD [E] TO PURGE`, '🐛');
  }

  spreadNetworkWorm(sourceRack) {
    const candidates = this.racks.filter(r => !r.isFailing && !r.isDestroyed && r.id !== sourceRack.id);
    if (candidates.length === 0) return;
    candidates.sort((a, b) => {
      const distA = Math.hypot(a.x - sourceRack.x, a.y - sourceRack.y);
      const distB = Math.hypot(b.x - sourceRack.x, b.y - sourceRack.y);
      return distA - distB;
    });
    const target = candidates[0];
    target.triggerNetworkWormError();
    this.sound.playBossAlarm();
    this.particles.spawnSparks(target.x + target.width / 2, target.y + target.height / 2, 35, '#ff0055');
    this.showTemporaryToast(`⚠️ NETWORK WORM SPREAD FROM ${sourceRack.id} TO ${target.id}! PURGE IMMEDIATELY!`, '🐛');
  }

  // ==========================================================================
  // Incident Generator
  // ==========================================================================
  triggerRandomIncident() {
    if (!this.unlockedErrors) {
      this.unlockedErrors = new Set();
    }
    // Check unlocked boss incident errors from design brief:
    if (this.unlockedErrors.has(CONFIG.ERRORS.SERVER_BUG) && Math.random() < 0.25) {
      this.triggerServerBugIncident();
      return;
    }
    if (this.unlockedErrors.has(CONFIG.ERRORS.SERVER_OVERHEAT) && Math.random() < 0.25) {
      this.triggerServerOverheatIncident();
      return;
    }
    if (this.unlockedErrors.has(CONFIG.ERRORS.SERVER_SMALL_VIRUS) && Math.random() < 0.25) {
      this.triggerServerSmallVirusIncident();
      return;
    }

    const errorRoll = Math.random();
    if (errorRoll < 0.28) {
      this.triggerCableError();
    } else if (errorRoll < 0.56) {
      this.triggerAuthLockoutError();
    } else if (errorRoll < 0.78) {
      this.triggerMultiChainError();
    } else {
      this.triggerHardRebootError();
    }
  }

  triggerServerBugIncident(isDevShortcut = false) {
    const availableRacks = this.racks.filter(r => !r.isDestroyed);
    if (availableRacks.length < 2) return;

    const originRack = availableRacks[Math.floor(Math.random() * availableRacks.length)];
    const candidateTargets = availableRacks.filter(r => r.id !== originRack.id && !r.isDestroyed && !r.isFailing);
    if (candidateTargets.length === 0) return;
    const targetRack = candidateTargets[Math.floor(Math.random() * candidateTargets.length)];

    targetRack.triggerServerBugError(originRack);
    this.sound.playBossAlarm();
    this.camera.shake(16, 0.4);
    this.particles.spawnSparks(originRack.x + originRack.width / 2, originRack.y + originRack.height / 2, 35, '#ff0055');
    this.particles.spawnSparks(targetRack.x + targetRack.width / 2, targetRack.y + targetRack.height / 2, 35, '#00ff9d');

    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '🐛 ';
    this.showTemporaryToast(
      `${prefix}ROGUE BUG ENTERED ${targetRack.id}! SHUT DOWN AT NOC TERMINAL TO TRAP & SQUISH IT!`,
      '🐛'
    );
  }

  triggerServerOverheatIncident(isDevShortcut = false) {
    const availableRacks = this.racks.filter(r => !r.isFailing && !r.isDestroyed);
    if (availableRacks.length === 0) return;
    const rack = availableRacks[Math.floor(Math.random() * availableRacks.length)];

    rack.triggerServerOverheatError();
    this.sound.playBossAlarm();
    this.camera.shake(16, 0.4);
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 45, '#ff5500');

    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '🔥 ';
    this.showTemporaryToast(
      `${prefix}SERVER OVERHEAT AT ${rack.id}! SHUT DOWN AT NOC TERMINAL BEFORE FIRE SPREAD (30s)!`,
      '🔥'
    );
  }

  triggerServerSmallVirusIncident(isDevShortcut = false) {
    const availableRacks = this.racks.filter(r => !r.isFailing && !r.isDestroyed);
    if (availableRacks.length === 0) return;
    const rack = availableRacks[Math.floor(Math.random() * availableRacks.length)];

    rack.triggerServerSmallVirusError();
    this.sound.playBossAlarm();
    this.camera.shake(16, 0.4);
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 45, '#a855f7');

    const prefix = isDevShortcut ? '🛠️ [DEV] ' : '☣️ ';
    this.showTemporaryToast(
      `${prefix}VIRUS SLIME ERUPTED AT ${rack.id}! SHUT DOWN & DISINFECT BEFORE MAJOR VIRUS ERUPTS (60s)!`,
      '☣️'
    );
  }

  triggerSmallBugError(isDevShortcut = false) {
    this.triggerServerBugIncident(isDevShortcut);
  }

  triggerCableError() {
    const availableSources = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (availableSources.length < 2) return;

    const sourceRack = availableSources[Math.floor(Math.random() * availableSources.length)];

    const candidateTargets = this.racks.filter(r => {
      if (r.id === sourceRack.id || r.isFailing || r.isDestroyed || r.isTargetDestination) return false;
      const dist = Math.hypot(r.x - sourceRack.x, r.y - sourceRack.y);
      return dist >= CONFIG.ERRORS.MIN_LINK_DISTANCE && dist <= CONFIG.ERRORS.MAX_LINK_DISTANCE;
    });

    if (candidateTargets.length === 0) return;
    const targetRack = candidateTargets[Math.floor(Math.random() * candidateTargets.length)];

    sourceRack.triggerCableError(targetRack);
    sourceRack.uptime = 90;
    this.sound.playError();
    this.showTemporaryToast(`⚠️ FAULT AT ${sourceRack.id}! [45s UNTIL EXPLOSION] ➔ RUN CABLE TO ${targetRack.id}`);
  }

  triggerMultiChainError() {
    const availableSources = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (availableSources.length < 8) return;

    // Pick a random chain length between 3 and 8 servers (inclusive)
    const targetChainLength = Math.floor(Math.random() * 6) + 3; // 3, 4, 5, 6, 7, or 8

    const sourceRack = availableSources[Math.floor(Math.random() * availableSources.length)];
    const hops = [sourceRack];
    const usedRackIds = new Set([sourceRack.id]);

    for (let i = 1; i < targetChainLength; i++) {
      const prevHop = hops[hops.length - 1];

      // Find candidates that are available and not already part of this chain
      const candidates = this.racks.filter(r => {
        if (usedRackIds.has(r.id) || r.isFailing || r.isDestroyed || r.isTargetDestination) return false;
        const d = Math.hypot(r.x - prevHop.x, r.y - prevHop.y);
        return d >= 260 && d <= 1250;
      });

      if (candidates.length > 0) {
        const nextHop = candidates[Math.floor(Math.random() * candidates.length)];
        hops.push(nextHop);
        usedRackIds.add(nextHop.id);
      } else {
        const fallbackCandidates = this.racks.filter(r => 
          !usedRackIds.has(r.id) && !r.isFailing && !r.isDestroyed && !r.isTargetDestination
        );
        if (fallbackCandidates.length === 0) break;
        fallbackCandidates.sort((a, b) => {
          const distA = Math.hypot(a.x - prevHop.x, a.y - prevHop.y);
          const distB = Math.hypot(b.x - prevHop.x, b.y - prevHop.y);
          return distA - distB;
        });
        const nextHop = fallbackCandidates[0];
        hops.push(nextHop);
        usedRackIds.add(nextHop.id);
      }
    }

    if (hops.length < 3) return;

    // Mark hops in incident tracking so other faults don't double-book them
    hops.slice(1).forEach(h => { h.isTargetDestination = true; });

    sourceRack.triggerMultiChainError(hops);
    sourceRack.uptime = 90;
    this.sound.playError();
    this.showTemporaryToast(`⚠️ FAULT AT ${sourceRack.id}! [90s UNTIL EXPLOSION] ➔ CHAIN ${hops.length} SERVERS`);
  }

  triggerHardRebootError() {
    const available = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (available.length === 0) return;

    const rack = available[Math.floor(Math.random() * available.length)];
    rack.triggerHardRebootError();
    rack.uptime = 90;
    this.sound.playError();
    this.showTemporaryToast(`⚠️ FAULT AT ${rack.id}! [45s UNTIL EXPLOSION] ➔ HOLD POWER BREAKER (5s)`);
  }

  triggerAuthLockoutError() {
    const available = this.racks.filter(r => !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
    if (available.length === 0) return;

    const rack = available[Math.floor(Math.random() * available.length)];
    rack.triggerAuthError();
    rack.uptime = 90;
    this.sound.playError();
    this.showTemporaryToast(`⚠️ FAULT AT ${rack.id}! [45s UNTIL EXPLOSION] ➔ SCAN PIN FOR NOC DESK`);
  }

  // ==========================================================================
  // Event Listeners & Terminal Minigame UI
  // ==========================================================================
  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('mousemove', (e) => {
      this.mouseScreenX = e.clientX;
      this.mouseScreenY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.sound.init();
      if (e.button === 0 && this.isCannonAiming) {
        this.fireCannon();
        e.preventDefault();
      }
    });

    window.addEventListener('keydown', (e) => {
      this.sound.init();

      if (this.isStatsOpen) {
        if (e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyC') {
          e.preventDefault();
          this.closeStats();
          return;
        }
      }

      // Stats Modal Toggle [TAB] or [C]
      if (e.code === 'Tab' || e.code === 'KeyC') {
        e.preventDefault();
        if (this.isCannonAiming) this.cancelCannonAim();
        if (this.gameState === 'PLAYING') {
          this.openStats();
          return;
        }
      }

      if (this.isSettingsOpen) {
        if (e.code === 'Escape') {
          this.closeSettings();
        }
        return;
      }

      if (this.leaderboardModal && !this.leaderboardModal.classList.contains('hidden')) {
        if (e.code === 'Escape') {
          this.closeLeaderboard();
          return;
        }
      }

      if (this.runPreviewModal && !this.runPreviewModal.classList.contains('hidden')) {
        if (e.code === 'Escape') {
          this.closeRunPreviewModal();
          return;
        }
      }

      // Tutorial navigation & toggle
      if (e.code === 'KeyH') {
        if (this.isTutorialOpen) this.closeTutorial();
        else this.openTutorial(0);
        return;
      }

      if (this.isTutorialOpen) {
        if (e.code === 'ArrowLeft') {
          this.prevTutorialStep();
          return;
        } else if (e.code === 'ArrowRight') {
          this.nextTutorialStep();
          return;
        } else if (e.code === 'Escape') {
          this.closeTutorial();
          return;
        }
      }

      // Terminal Modal Input Handling (HIGHEST PRIORITY! Ensures 0-9, Backspace, Enter, Esc are never intercepted)
      if (this.isTerminalOpen) {
        if (e.key >= '0' && e.key <= '9') {
          this.handleKeypadDigit(e.key);
        } else if (e.key === 'Backspace') {
          this.handleKeypadBackspace();
        } else if (e.key === 'Enter') {
          this.submitTerminalCode();
        } else if (e.code === 'Escape') {
          this.closeTerminal();
        }
        return;
      }

      // Boss Reward Selection Modal
      if (this.isBossRewardOpen) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          this.claimBossReward('teleporter');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          this.claimBossReward('portable_terminal');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          this.claimBossReward('shop_clearance');
        }
        return;
      }

      // Hardware Shop Modal Handling
      if (this.isShopOpen) {
        if (e.code === 'Escape' || e.code === 'KeyK') this.closeShop();
        return;
      }

      // Hardware Shop Modal Toggle [K]
      if (e.code === 'KeyK') {
        if (this.isCannonAiming) this.cancelCannonAim();
        if (this.gameState === 'PLAYING') this.openShop();
        return;
      }

      // Developer Cheats Mode (ONLY active if isDevMode is enabled in Settings!)
      if (this.isDevMode && this.gameState === 'PLAYING') {
        // Dev Tool: Press [B] to skip to next Boss Wave / cycle active boss immediately
        if (e.code === 'KeyB') {
          if (this.activeBoss && this.activeBoss.isAlive) {
            this.defeatBoss(this.activeBoss);
          } else {
            const nextWave = (this.currentBossWave || 0) + 1;
            this.gameTime = Math.max(this.gameTime, nextWave * 600);
            this.spawnBoss(nextWave, true);
          }
          return;
        }

        // Dev Tool: Press [N] to spawn a Server Bug incident immediately
        if (e.code === 'KeyN') {
          this.triggerServerBugIncident(true);
          return;
        }

        // Dev Tool: Press [1] to spawn Coolant Leak error immediately
        if (e.code === 'Digit1') {
          this.triggerCoolantLeakError(true);
          return;
        }

        // Dev Tool: Press [2] to spawn Phantom Glitch error immediately
        if (e.code === 'Digit2') {
          this.triggerPhantomGlitchError(true);
          return;
        }

        // Dev Tool: Press [3] to spawn Network Worm error immediately
        if (e.code === 'Digit3') {
          this.triggerNetworkWormError(true);
          return;
        }

        // Dev Tool: Press [8] to spawn a Server Overheat fire incident immediately
        if (e.code === 'Digit8') {
          this.triggerServerOverheatIncident(true);
          return;
        }

        // Dev Tool: Press [9] to spawn a Server Small Virus incident immediately
        if (e.code === 'Digit9') {
          this.triggerServerSmallVirusIncident(true);
          return;
        }
      }

      // Kinetic Cannon Slingshot Keybind [F]
      if (e.code === 'KeyF') {
        if (this.isCannonAiming) {
          this.fireCannon();
        } else if (!this.isShopOpen && !this.isTerminalOpen && this.gameState === 'PLAYING') {
          this.armCannon();
        }
        return;
      }

      // Quantum Teleporter Item Keybind [T]
      if (e.code === 'KeyT') {
        if (this.isCannonAiming) this.cancelCannonAim();
        if (this.gameState === 'PLAYING' && !this.isShopOpen && !this.isTerminalOpen) {
          if (e.shiftKey) {
            if (!this.isDevMode) return;
            // Dev shortcut: unlock immediately if dev mode enabled
            this.hasTeleporterItem = true;
            this.sound.playTeleportDeploy(0);
            this.showTemporaryToast('🌀 DEV: QUANTUM TELEPORTER KIT UNLOCKED! Press [T] to place Node Alpha.', '✨');
            this.updateBuffDisplay();
            return;
          }
          this.handleTeleporterKey();
        }
        return;
      }

      // Portable Field NOC Terminal Keybind [P]
      if (e.code === 'KeyP') {
        if (this.isCannonAiming) this.cancelCannonAim();
        if (this.gameState === 'PLAYING' && !this.isShopOpen && !this.isTerminalOpen && !this.isBossRewardOpen) {
          this.handlePortableTerminalKey();
        }
        return;
      }

      // Phase Dash / Nitrous Boost Keybind [SHIFT]
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.gameState === 'PLAYING' && !this.isShopOpen && !this.isTerminalOpen) {
          if (this.player.hasPhaseDash && this.player.dashCooldown <= 0) {
            this.executePhaseDash();
            return;
          }
          if (this.player.hasNitrous && this.player.nitrousCooldown <= 0 && this.player.nitrousTimer <= 0) {
            this.executeNitrousBoost();
            return;
          }
        }
      }

      // EMP Shockwave Keybind [V]
      if (e.code === 'KeyV') {
        if (this.gameState === 'PLAYING' && !this.isShopOpen && !this.isTerminalOpen) {
          if (this.player.hasEmpShockwave) {
            if (this.player.empCooldown <= 0) {
              this.executeEmpShockwave();
            } else {
              this.showTemporaryToast(`⏳ EMP SHOCKWAVE RECHARGING: ${this.player.empCooldown.toFixed(0)}s`);
            }
          }
        }
        return;
      }

      // While in bullet-time Cannon Aiming mode
      if (this.isCannonAiming) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.fireCannon();
          e.preventDefault();
          return;
        }
        if (e.code === 'Escape') {
          this.cancelCannonAim();
          return;
        }
      }

      if (e.code === 'Escape') {
        if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
          this.togglePause();
        }
        return;
      }

      if (this.gameState !== 'PLAYING') return;

      if (e.repeat) return; // Prevent OS key-repeat events while holding [E] from constantly zeroing hold progress

      this.keys[e.code] = true;

      if (e.code === 'KeyE') {
        const nearRack = this.getNearestRack(105);
        if (nearRack && nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.RESTART_REQUIRED) {
          if (nearRack.isShutdown) {
            if (this.rebootingRack !== nearRack) {
              this.rebootingRack = nearRack;
              this.rebootHoldTime = 0;
            }
          } else {
            nearRack.error.hasBeenInspected = true;
            this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
            if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
            if (this.terminalSelect) {
              this.terminalSelect.value = nearRack.id;
              this.updateTerminalSelectionFeedback();
            }
            this.showTemporaryToast(`🛑 ${nearRack.id} PIN: [${nearRack.code}] SCANNED! TYPE AT MASTER TERMINAL TO SHUT DOWN FIRST!`, '🛑');
            this.sound.playKey();
          }
        } else if (nearRack && nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.SERVER_BUG) {
          if (nearRack.isShutdown) {
            if (this.shakingRack !== nearRack) {
              this.shakingRack = nearRack;
              this.shakeHoldTime = 0;
            }
          } else {
            nearRack.error.hasBeenInspected = true;
            this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
            if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
            if (this.terminalSelect) {
              this.terminalSelect.value = nearRack.id;
              this.updateTerminalSelectionFeedback();
            }
            this.showTemporaryToast(`🐛 ${nearRack.id} PIN: [${nearRack.code}] SCANNED! TYPE AT MASTER TERMINAL TO SHUT DOWN & TRAP BUG!`, '🐛');
            this.sound.playKey();
          }
        } else if (nearRack && nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS) {
          if (nearRack.isShutdown) {
            if (this.disinfectingRack !== nearRack) {
              this.disinfectingRack = nearRack;
              this.disinfectHoldTime = 0;
            }
          } else {
            nearRack.error.hasBeenInspected = true;
            this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
            if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
            if (this.terminalSelect) {
              this.terminalSelect.value = nearRack.id;
              this.updateTerminalSelectionFeedback();
            }
            this.showTemporaryToast(`🦠 ${nearRack.id} PIN: [${nearRack.code}] SCANNED! TYPE AT MASTER TERMINAL TO SHUT DOWN FIRST!`, '🦠');
            this.sound.playKey();
          }
        } else if (nearRack && nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.HARD_REBOOT) {
          if (this.rebootingRack !== nearRack) {
            this.rebootingRack = nearRack;
            this.rebootHoldTime = 0;
          }
        } else {
          this.handleInteractKey();
        }
      } else if (e.code === 'KeyQ') {
        this.dropActiveCable();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyE') {
        if (this.rebootingRack) {
          if (this.rebootHoldTime > 0.3) this.sound.playRebootCancel();
          this.sound.stopRebootCharge();
          this.rebootHoldTime = 0;
          this.rebootingRack = null;
          this.updateObjectiveUI();
        }
        if (this.shakingRack) {
          this.shakingRack = null;
          this.shakeHoldTime = 0;
        }
        if (this.disinfectingRack) {
          this.disinfectingRack = null;
          this.disinfectHoldTime = 0;
        }
        if (this.coolingRack) {
          this.coolingRack = null;
          this.coolantHoldTime = 0;
        }
        if (this.wormRack) {
          this.wormRack = null;
          this.wormHoldTime = 0;
        }
      }
    });

    document.getElementById('btn-toggle-pause')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-close-terminal')?.addEventListener('click', () => this.closeTerminal());
  }

  initTerminalMinigame() {
    document.querySelectorAll('.numpad-btn[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playKey();
        this.handleKeypadDigit(btn.dataset.key);
      });
    });

    document.getElementById('numpad-clear')?.addEventListener('click', () => {
      this.sound.playKey();
      this.terminalInputBuffer = '';
      this.updateTerminalDisplay();
    });

    document.getElementById('numpad-enter')?.addEventListener('click', () => {
      this.submitTerminalCode();
    });

    this.terminalSelect?.addEventListener('change', () => {
      this.terminalInputBuffer = '';
      this.updateTerminalDisplay();
      this.updateTerminalSelectionFeedback();
      this.updateTerminalLiveCountdowns();
    });
  }

  handleKeypadDigit(digit) {
    if (this.terminalInputBuffer.length < 4) {
      this.terminalInputBuffer += digit;
      this.sound.playKey();
      this.updateTerminalDisplay();
    }
  }

  handleKeypadBackspace() {
    if (this.terminalInputBuffer.length > 0) {
      this.terminalInputBuffer = this.terminalInputBuffer.slice(0, -1);
      this.sound.playKey();
      this.updateTerminalDisplay();
    }
  }

  updateTerminalDisplay() {
    if (!this.terminalDigits) return;
    const buf = this.terminalInputBuffer;
    let formatted = '';
    for (let i = 0; i < 4; i++) {
      formatted += (i < buf.length ? buf[i] : '_') + (i < 3 ? ' ' : '');
    }
    this.terminalDigits.textContent = formatted;
    this.updateKeypadHexHighlight();
  }

  updateKeypadHexHighlight() {
    document.querySelectorAll('.numpad-btn[data-key]').forEach(btn => {
      btn.style.boxShadow = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    });

    if (!this.player?.hasHexDecoder || !this.isTerminalOpen) return;
    const selectedRackId = this.terminalSelect?.value;
    const rack = this.racks.find(r => r.id === selectedRackId);
    if (!rack || !rack.code) return;

    const nextDigit = rack.code[this.terminalInputBuffer.length];
    if (nextDigit !== undefined) {
      const targetBtn = document.querySelector(`.numpad-btn[data-key="${nextDigit}"]`);
      if (targetBtn) {
        targetBtn.style.borderColor = '#00ff9d';
        targetBtn.style.boxShadow = '0 0 16px rgba(0, 255, 157, 0.85), inset 0 0 8px rgba(0, 255, 157, 0.4)';
        targetBtn.style.color = '#00ff9d';
      }
    }
  }

  updateTerminalSelectionFeedback() {
    if (!this.terminalFeedback) return;
    const selectedRackId = this.terminalSelect?.value;
    const rack = this.racks.find(r => r.id === selectedRackId);

    // Keypad is always available for entering the 4-digit PIN!
    if (this.terminalKeypad) this.terminalKeypad.classList.remove('hidden');
    if (this.terminalShutdownPanel) this.terminalShutdownPanel.classList.add('hidden');

    const promptElem = document.querySelector('.terminal-prompt');

    if (!rack || !rack.isFailing) {
      this.terminalFeedback.textContent = 'AWAITING NODE SELECTION';
      this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_AMBER;
      if (promptElem) promptElem.textContent = '> ENTER PIN:';
      return;
    }

    const errType = rack.error?.type;
    const isShutdownType = (
      errType === CONFIG.ERRORS.RESTART_REQUIRED ||
      errType === CONFIG.ERRORS.SERVER_BUG ||
      errType === CONFIG.ERRORS.SERVER_OVERHEAT ||
      errType === CONFIG.ERRORS.SERVER_SMALL_VIRUS
    );

    if (isShutdownType) {
      if (rack.isShutdown) {
        if (promptElem) promptElem.textContent = '> NODE BREAKER IS OFF [ISOLATED]:';
        this.terminalFeedback.textContent = `BREAKER POWER OFF: ${rack.id} SHUT DOWN // COMPLETE ON-FOOT ACTION`;
        this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_CYAN;
      } else if (errType === CONFIG.ERRORS.SERVER_OVERHEAT) {
        if (promptElem) promptElem.textContent = '> OVERHEAT BREAKER SHUTDOWN PIN:';
        if (this.player?.hasHexDecoder) {
          this.terminalFeedback.textContent = `🔥 SENSORS OVERHEATED (NO ON-FOOT SCAN) // USE HEX DECODER GREEN HIGHLIGHTS TO ENTER PIN & SHUT DOWN`;
          this.terminalFeedback.style.color = '#00ff9d';
        } else {
          this.terminalFeedback.textContent = `🔥 SENSORS OVERHEATED (NO ON-FOOT SCAN) // PURCHASE HEX DECODER AT SHOP TO DECODE PIN`;
          this.terminalFeedback.style.color = '#ff5500';
        }
      } else {
        if (promptElem) promptElem.textContent = '> ENTER RACK PIN TO SHUT DOWN BREAKER:';
        if (!rack.error?.hasBeenInspected) {
          this.terminalFeedback.textContent = `PIN UNKNOWN ➔ VISIT ${rack.id} TO SCAN PIN FOR SHUTDOWN (OR USE HEX DECODER)`;
          this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_AMBER;
        } else {
          this.terminalFeedback.textContent = `SAVED PIN: [${rack.code}] ➔ TYPE 4-DIGIT PIN & PRESS [ENTER] TO SHUT DOWN`;
          this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_CYAN;
        }
      }
    } else {
      // Keypad PIN entry types (Auth lockout, phantom glitch)
      if (promptElem) promptElem.textContent = '> ENTER AUTH OVERRIDE PIN:';
      if (!rack.error?.hasBeenInspected) {
        this.terminalFeedback.textContent = `PIN UNKNOWN ➔ VISIT ${rack.id} TO RETRIEVE OVERRIDE CODE`;
        this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_AMBER;
      } else {
        const isGlitch = errType === CONFIG.ERRORS.PHANTOM_GLITCH;
        this.terminalFeedback.textContent = isGlitch 
          ? `AUTHENTIC PIN: [${rack.code}] ➔ ENTER PIN TO DISPEL PHANTOM GLITCH`
          : `SAVED PIN: [${rack.code}] ➔ ENTER PIN TO RESTORE NODE`;
        this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_CYAN;
      }
    }
    this.updateKeypadHexHighlight();
  }

  openTerminal() {
    if (this.isShopOpen) this.closeShop();
    this.isTerminalOpen = true;
    this.terminalInputBuffer = '';
    this.updateTerminalDisplay();

    if (this.terminalSelect) {
      this.terminalSelect.innerHTML = '';
      const actionableRacks = this.racks.filter(r => r.isFailing && (
        r.error?.type === CONFIG.ERRORS.ACCESS_DENIED ||
        r.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT ||
        r.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH ||
        r.error?.type === CONFIG.ERRORS.RESTART_REQUIRED ||
        r.error?.type === CONFIG.ERRORS.SERVER_BUG ||
        r.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT ||
        r.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS
      ));

      if (actionableRacks.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'NO ACTIVE TERMINAL FAULTS';
        opt.disabled = true;
        this.terminalSelect.appendChild(opt);
        if (this.terminalFeedback) this.terminalFeedback.textContent = 'ALL SERVER NODES OPERATING NORMALLY';
        if (this.terminalKeypad) this.terminalKeypad.classList.remove('hidden');
        if (this.terminalShutdownPanel) this.terminalShutdownPanel.classList.add('hidden');
      } else {
        actionableRacks.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.id;
          const t = r.error?.type;
          let tag = 'SEC-AUTH';
          if (t === CONFIG.ERRORS.RESTART_REQUIRED) tag = r.isShutdown ? 'OFFLINE // READY FOR REBOOT' : 'REQ-SHUTDOWN';
          else if (t === CONFIG.ERRORS.SERVER_BUG) tag = r.isShutdown ? 'OFFLINE // SHAKE BUG OUT' : 'BUG INFESTATION';
          else if (t === CONFIG.ERRORS.SERVER_OVERHEAT) tag = r.isShutdown ? 'OFFLINE // COOLING' : 'FIRE OVERHEAT';
          else if (t === CONFIG.ERRORS.SERVER_SMALL_VIRUS) tag = r.isShutdown ? 'OFFLINE // DISINFECT' : 'VIRUS SLIME';
          else if (t === CONFIG.ERRORS.PHANTOM_GLITCH) tag = 'HOLO-GLITCH';

          if (!r.isShutdown) {
            if (t === CONFIG.ERRORS.SERVER_OVERHEAT) {
              opt.textContent = `${r.id} // ${tag} [ON FIRE - CANNOT SCAN ON-FOOT]`;
            } else {
              opt.textContent = r.error?.hasBeenInspected
                ? `${r.id} // ${tag} [PIN: ${r.code}]`
                : `${r.id} // ${tag} [PIN UNKNOWN - SCAN RACK]`;
            }
          } else {
            opt.textContent = `${r.id} // ${tag}`;
          }
          this.terminalSelect.appendChild(opt);
        });

        if (this.activeCodeMemo) {
          const matching = actionableRacks.find(r => r.id === this.activeCodeMemo.rackId);
          if (matching) this.terminalSelect.value = matching.id;
        }

        this.updateTerminalSelectionFeedback();
      }
    }

    this.terminalModal?.classList.remove('hidden');
    this.updateTerminalLiveCountdowns();
    this.updateKeypadHexHighlight();
  }

  shutdownServerNode(rackId, bypassPin = false) {
    const rack = this.racks.find(r => r.id === rackId);
    if (!rack || !rack.isFailing) {
      this.sound.playTerminalFail();
      return;
    }

    if (rack.isShutdown) {
      this.showTemporaryToast(`⚠️ ${rack.id} IS ALREADY POWERED OFF! COMPLETE ON-FOOT REPAIR.`);
      return;
    }

    if (!bypassPin && this.terminalInputBuffer !== rack.code) {
      this.sound.playTerminalFail();
      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = 'TYPE CORRECT 4-DIGIT RACK PIN FIRST TO SHUT DOWN!';
        this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_RED;
      }
      return;
    }

    rack.shutdownBreaker();
    this.sound.playShutdown?.() || this.sound.playPowerup();
    this.particles.spawnSparks(this.nocDesk.x + this.nocDesk.width / 2, this.nocDesk.y, 40, '#ff2a55');
    this.particles.spawnSparks(rack.x + rack.width / 2, rack.y + rack.height / 2, 45, '#00f3ff');

    const errType = rack.error?.type;
    let toastMsg = `🛑 ${rack.id} POWER BREAKER SHUT DOWN! `;
    if (errType === CONFIG.ERRORS.RESTART_REQUIRED) {
      toastMsg += `COUNTDOWN FROZEN! VISIT RACK & HOLD [E] FOR 5s TO TURN ON.`;
    } else if (errType === CONFIG.ERRORS.SERVER_BUG) {
      toastMsg += `NODE ISOLATED & BUG TRAPPED! VISIT RACK, HOLD [E] TO TAKE IT OUT & SQUISH IT!`;
    } else if (errType === CONFIG.ERRORS.SERVER_OVERHEAT) {
      toastMsg += `FIRE RISK ISOLATED! RACK RESTORING COOLANT RESERVES.`;
      setTimeout(() => {
        if (rack.isFailing && rack.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT) {
          rack.resolveError();
          this.addCredits(80, `+80 ⚡ ${rack.id} OVERHEAT RESOLVED`);
        }
      }, 4000);
    } else if (errType === CONFIG.ERRORS.SERVER_SMALL_VIRUS) {
      toastMsg += `VIRUS CONFINED! VISIT RACK & HOLD [E] TO DISINFECT BEFORE 60s!`;
    }
    this.showTemporaryToast(toastMsg, '🛑');

    this.updateTerminalSelectionFeedback();
    this.updateTerminalLiveCountdowns();
    this.updateObjectiveUI();
  }

  closeTerminal() {
    this.isTerminalOpen = false;
    this.terminalModal?.classList.add('hidden');
    this.keys = {};
    document.querySelectorAll('.numpad-btn[data-key]').forEach(btn => {
      btn.style.boxShadow = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    });
  }

  submitTerminalCode() {
    let selectedRackId = this.terminalSelect?.value;
    let targetRack = this.racks.find(r => r.id === selectedRackId);

    // If entered PIN does not match the currently selected target rack, or no rack was selected:
    // Auto-search if ANY active failing rack matches the entered PIN!
    if (!targetRack || !targetRack.isFailing || this.terminalInputBuffer !== targetRack.code) {
      const anyMatchingRack = this.racks.find(r =>
        r.isFailing &&
        !r.isDestroyed &&
        !r.isShutdown &&
        r.code === this.terminalInputBuffer
      );
      if (anyMatchingRack) {
        targetRack = anyMatchingRack;
        selectedRackId = anyMatchingRack.id;
        if (this.terminalSelect) {
          this.terminalSelect.value = anyMatchingRack.id;
        }
        this.updateTerminalSelectionFeedback();
      }
    }

    if (!targetRack || !targetRack.isFailing) {
      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = 'SELECT AN ACTIVE FAULT FIRST';
        this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_RED;
      }
      this.sound.playTerminalFail();
      return;
    }

    const isShutdownType = (
      targetRack.error?.type === CONFIG.ERRORS.RESTART_REQUIRED ||
      targetRack.error?.type === CONFIG.ERRORS.SERVER_BUG ||
      targetRack.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT ||
      targetRack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS
    );

    const isAuthType = (
      targetRack.error?.type === CONFIG.ERRORS.ACCESS_DENIED ||
      targetRack.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT ||
      targetRack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH
    );

    if (!isShutdownType && !isAuthType) {
      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = 'THIS FAULT REQUIRES PHYSICAL ON-FOOT REPAIR';
        this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_RED;
      }
      this.sound.playTerminalFail();
      return;
    }

    if (isShutdownType && targetRack.isShutdown) {
      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = `${targetRack.id} IS ALREADY SHUT DOWN // COMPLETE ON-FOOT ACTION`;
        this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_CYAN;
      }
      this.sound.playTerminalFail();
      return;
    }

    if (this.terminalInputBuffer === targetRack.code) {
      if (isShutdownType) {
        this.sound.playTerminalSuccess();
        this.shutdownServerNode(targetRack.id, true);
        if (this.terminalFeedback) {
          this.terminalFeedback.textContent = `AUTH ACCEPTED: ${targetRack.id} POWER BREAKER SHUT DOWN // TIMER FROZEN`;
          this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_GREEN;
        }
        this.terminalInputBuffer = '';
        this.updateTerminalDisplay();
        this.updateTerminalSelectionFeedback();
        this.updateObjectiveUI();
        return;
      }

      // isAuthType:
      const isGlitch = targetRack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH;
      targetRack.resolveError();
      this.sound.playTerminalSuccess();
      this.particles.spawnSparks(this.nocDesk.x + this.nocDesk.width / 2, this.nocDesk.y, 35, '#00ff9d');
      const bonus = (this.activeSynergies.netops >= 1) ? 30 : 0;
      const amount = (isGlitch ? 90 : 75) + bonus;
      this.addCredits(amount, `+${amount} ⚡ ${isGlitch ? 'HOLO-PHANTOM GLITCH DISPELLED' : 'OVERRIDE AUTHENTICATED'}`);

      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = isGlitch
          ? `HOLO-PHANTOM DISPELLED: ${targetRack.id} RESTORED`
          : `AUTH OVERRIDE ACCEPTED: ${targetRack.id} RESTORED`;
        this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_GREEN;
      }

      if (this.activeCodeMemo?.rackId === targetRack.id) {
        this.activeCodeMemo = null;
        if (this.memoCodeVal) this.memoCodeVal.textContent = '--';
      }

      setTimeout(() => {
        this.closeTerminal();
        this.updateObjectiveUI();
      }, 900);
    } else {
      this.sound.playTerminalFail();
      if (this.terminalFeedback) {
        this.terminalFeedback.textContent = isShutdownType
          ? 'INVALID PIN // SHUTDOWN AUTHORIZATION REJECTED'
          : 'INVALID OVERRIDE PIN // ACCESS DENIED';
        this.terminalFeedback.style.color = CONFIG.COLORS.RACK_LED_RED;
      }
      this.terminalInputBuffer = '';
      this.updateTerminalDisplay();
    }
  }

  resizeCanvas() {
    const dpr = this.isOptimizedMode ? 1.0 : Math.min(window.devicePixelRatio || 1, 2.0);
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.canvas.width = Math.floor(this.viewportWidth * dpr);
    this.canvas.height = Math.floor(this.viewportHeight * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.camera.resize(this.viewportWidth, this.viewportHeight);
    this.floorPattern = this.createFloorPattern();
  }

  togglePause() {
    if (this.gameState === 'MENU' || this.isTerminalOpen || this.isShopOpen || this.isTutorialOpen || this.isSettingsOpen || this.isBossRewardOpen) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.gameState = 'PAUSED';
      this.pauseModal?.classList.remove('hidden');
    } else {
      this.gameState = 'PLAYING';
      this.pauseModal?.classList.add('hidden');
    }
    const btn = document.getElementById('btn-toggle-pause');
    if (btn) btn.textContent = this.isPaused ? 'RESUME [ESC]' : 'PAUSE [ESC]';
  }

  getDistanceToRack(rack) {
    if (!rack) return Infinity;
    const clampX = Math.max(rack.x, Math.min(this.player.x, rack.x + rack.width));
    const clampY = Math.max(rack.y, Math.min(this.player.y, rack.y + rack.height));
    return Math.hypot(this.player.x - clampX, this.player.y - clampY);
  }

  getNearestRack(maxDist = 95) {
    // If player has Hex Decoder, extend interaction / scan range to 180px
    const effectiveMaxDist = this.player?.hasHexDecoder ? Math.max(maxDist, 180) : maxDist;

    // If boss is active and player is near bossHostRack, prioritize bossHostRack above all others
    const activeBoss = this.activeBoss || this.bugBoss;
    if (this.bossHostRack && activeBoss && activeBoss.isAlive) {
      if (this.getDistanceToRack(this.bossHostRack) <= 120) {
        return this.bossHostRack;
      }
    }

    let closestFailing = null;
    let closestFailingDist = effectiveMaxDist;
    let closest = null;
    let closestDist = effectiveMaxDist;

    for (const rack of this.racks) {
      const d = this.getDistanceToRack(rack);
      if (d < closestDist) {
        closest = rack;
        closestDist = d;
      }
      if (rack.isFailing && d < closestFailingDist) {
        closestFailing = rack;
        closestFailingDist = d;
      }
    }
    // If player is directly adjacent to a rack (within 65px), prioritize that immediate rack
    if (closest && closestDist < 65) {
      return closest;
    }
    return closestFailing || closest;
  }

  getDistanceToNOCDesk() {
    if (!this.nocDesk) return Infinity;
    const clampX = Math.max(this.nocDesk.x, Math.min(this.player.x, this.nocDesk.x + this.nocDesk.width));
    const clampY = Math.max(this.nocDesk.y, Math.min(this.player.y, this.nocDesk.y + this.nocDesk.height));
    return Math.hypot(this.player.x - clampX, this.player.y - clampY);
  }

  getDistanceToShopKiosk() {
    if (!this.shopKiosk) return Infinity;
    const clampX = Math.max(this.shopKiosk.x, Math.min(this.player.x, this.shopKiosk.x + this.shopKiosk.width));
    const clampY = Math.max(this.shopKiosk.y, Math.min(this.player.y, this.shopKiosk.y + this.shopKiosk.height));
    return Math.hypot(this.player.x - clampX, this.player.y - clampY);
  }

  getDistanceToSuppliesCloset() {
    if (!this.suppliesCloset) return Infinity;
    const clampX = Math.max(this.suppliesCloset.x, Math.min(this.player.x, this.suppliesCloset.x + this.suppliesCloset.width));
    const clampY = Math.max(this.suppliesCloset.y, Math.min(this.player.y, this.suppliesCloset.y + this.suppliesCloset.height));
    return Math.hypot(this.player.x - clampX, this.player.y - clampY);
  }

  isNearNOCDesk(maxDist = 110) {
    return this.getDistanceToNOCDesk() <= maxDist;
  }

  isNearShopKiosk(maxDist = 100) {
    return this.getDistanceToShopKiosk() <= maxDist;
  }

  isNearSuppliesCloset(maxDist = 100) {
    return this.getDistanceToSuppliesCloset() <= maxDist;
  }

  getNearTeleporterNode(maxDist = (CONFIG.TELEPORTER?.INTERACT_RADIUS ?? 52)) {
    for (const node of this.teleporterNodes) {
      const dist = Math.hypot(this.player.x - node.x, this.player.y - node.y);
      if (dist <= maxDist) return node;
    }
    return null;
  }

  // ==========================================================================
  // Interactions: Grab Cable, Plug In, Read PIN, Replace Server, or Open Kiosks
  // ==========================================================================
  handleInteractKey() {
    // 0. Quantum Teleporter Node Proximity Warp ([E])
    if (this.teleporterNodes.length === 2) {
      const nearNode = this.getNearTeleporterNode();
      if (nearNode) {
        const otherNode = this.teleporterNodes[0] === nearNode ? this.teleporterNodes[1] : this.teleporterNodes[0];
        this.teleportPlayer(nearNode, otherNode);
        return;
      }
    }

    const nearRack = this.getNearestRack();
    const distToRack = nearRack ? this.getDistanceToRack(nearRack) : Infinity;

    // 0.5. Portable Field NOC Terminal Proximity ([E])
    // Only open terminal if player isn't right on top of a server rack (< 65px)
    if (this.portableTerminal && this.portableTerminal.isNear(this.player.x, this.player.y)) {
      const distToPortable = Math.hypot(
        this.player.x - (this.portableTerminal.x + this.portableTerminal.width / 2),
        this.player.y - (this.portableTerminal.y + this.portableTerminal.height / 2)
      );
      if (distToPortable < distToRack || distToRack >= 65) {
        this.openTerminal();
        return;
      }
    }

    // 1. South Stations: Master NOC Desk, Supplies Closet, and IT Supply Kiosk (Resolved by closest proximity)
    const dNOC = this.isNearNOCDesk() ? this.getDistanceToNOCDesk() : Infinity;
    const dCloset = this.isNearSuppliesCloset() ? this.getDistanceToSuppliesCloset() : Infinity;
    const dShop = this.isNearShopKiosk() ? this.getDistanceToShopKiosk() : Infinity;
    const minSouthDist = Math.min(dNOC, dCloset, dShop);

    if (minSouthDist < Infinity && (minSouthDist < distToRack || distToRack >= 65)) {
      if (minSouthDist === dNOC) {
        this.openTerminal();
        return;
      }
      if (minSouthDist === dShop) {
        this.openShop();
        return;
      }
      if (minSouthDist === dCloset) {
        const boss = this.activeBoss || this.bugBoss;
        if (boss && boss.isAlive) {
          if (boss instanceof BugBoss) {
            if (!(this.activeCable instanceof RestraintRope)) {
              if (this.activeCable && !(this.activeCable instanceof RestraintRope)) {
                this.dropActiveCable();
              }
              this.activeCable = new RestraintRope(this.suppliesCloset, boss);
              this.sound.playCabinetOpen();
              this.sound.playGrab();
              this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 45, '#f59e0b');
              this.showTemporaryToast('🪢 HEAVY RESTRAINT ROPE RETRIEVED FROM SUPPLIES CLOSET! CIRCLE BUG BOSS TO WRAP IT!', '🪢');
              this.updateObjectiveUI();
              this.updateBossHUD();
              return;
            }
          } else if (boss instanceof ThermalGolemBoss) {
            if (!this.hasCryoCanister) {
              this.hasCryoCanister = true;
              this.sound.playCabinetOpen();
              this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 35, '#00f3ff');
              this.showTemporaryToast('❄️ CRYO COOLANT CANISTER EQUIPPED! HOLD [E] NEAR TITAN TO FREEZE ITS CORE!', '❄️');
              this.updateBossHUD();
              return;
            }
          } else if (boss instanceof MajorVirusBoss) {
            this.hasQuarantineBarrier = true;
            if (!(this.activeCable instanceof ContainmentWire)) {
              if (this.activeCable && !(this.activeCable instanceof ContainmentWire)) {
                this.dropActiveCable();
              }
              this.activeCable = new ContainmentWire(this.suppliesCloset, boss);
              this.sound.playCabinetOpen();
              this.sound.playGrab();
              this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 45, '#10b981');
              this.showTemporaryToast('🟡 QUARANTINE CONTAINMENT BARRIER RETRIEVED! RUN A FULL CLOSED LOOP AROUND ALL INFECTED COMPUTERS TO SEAL VIRUS!', '🟡');
              this.updateObjectiveUI();
              this.updateBossHUD();
              return;
            }
          } else {
            // Extensible Catalog Boss
            if (!(this.activeCable instanceof ContainmentWire)) {
              if (this.activeCable && !(this.activeCable instanceof ContainmentWire)) {
                this.dropActiveCable();
              }
              this.activeCable = new ContainmentWire(this.suppliesCloset, boss);
              this.sound.playCabinetOpen();
              this.sound.playGrab();
              this.particles.spawnSparks(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y + this.suppliesCloset.height / 2, 45, '#00ff9d');
              this.showTemporaryToast(`👑 ${boss.restraintName} RETRIEVED FROM SUPPLIES CLOSET!`, '👑');
              this.updateObjectiveUI();
              this.updateBossHUD();
              return;
            }
          }
        }
        this.openSuppliesModal();
        return;
      }
    }

    // 2e. Boss Host Rack Guidance (Anomaly Ground Zero)
    const activeBoss = this.activeBoss || this.bugBoss;
    if (this.bossHostRack && activeBoss && activeBoss.isAlive) {
      const distToHost = this.getDistanceToRack(this.bossHostRack);
      if (distToHost <= 120) {
        if (activeBoss instanceof BugBoss) {
          this.showTemporaryToast('⚠️ ANOMALY EPICENTER! RETRIEVE HEAVY RESTRAINT ROPE AT THE SOUTH SUPPLIES CLOSET!', '🪢');
          return;
        } else if (activeBoss instanceof ThermalGolemBoss) {
          this.showTemporaryToast('⚠️ BOSS EMERGENCE POINT! RETRIEVE CRYO CANISTER FROM THE SOUTH SUPPLIES CLOSET!', '❄️');
          return;
        } else if (activeBoss instanceof MajorVirusBoss) {
          this.showTemporaryToast('⚠️ VIRUS EPICENTER! RETRIEVE QUARANTINE BARRIER AT THE SOUTH SUPPLIES CLOSET!', '🟡');
          return;
        } else {
          this.showTemporaryToast(`⚠️ ANOMALY EPICENTER! RETRIEVE ${activeBoss.restraintName?.toUpperCase() || 'CONTAINMENT WIRE'} AT THE SUPPLIES CLOSET!`, '👑');
          return;
        }
      }
    }

    if (!nearRack) return;

    // Boss Host Rack Guidance
    if (nearRack.isBossHost || nearRack === this.bossHostRack) {
      const boss = this.activeBoss || this.bugBoss;
      if (boss && boss.isAlive) {
        if (boss instanceof BugBoss) {
          this.showTemporaryToast('⚠️ ANOMALY EPICENTER! RETRIEVE HEAVY RESTRAINT ROPE AT THE SOUTH SUPPLIES CLOSET!', '🪢');
          return;
        } else if (boss instanceof ThermalGolemBoss) {
          this.showTemporaryToast('⚠️ BOSS EMERGENCE POINT! RETRIEVE CRYO CANISTER FROM THE SOUTH SUPPLIES CLOSET!', '❄️');
          return;
        } else if (boss instanceof MajorVirusBoss) {
          this.showTemporaryToast('⚠️ VIRUS EPICENTER! RETRIEVE QUARANTINE BARRIER AT THE SOUTH SUPPLIES CLOSET!', '🟡');
          return;
        } else {
          this.showTemporaryToast(`⚠️ ANOMALY EPICENTER! RETRIEVE ${boss.restraintName?.toUpperCase() || 'CONTAINMENT WIRE'} AT THE SUPPLIES CLOSET!`, '👑');
          return;
        }
      }
    }

    // 3. Exploded / Destroyed Rack: Replace with new chassis (Expensive: 1000 ⚡)
    if (nearRack.isDestroyed) {
      const cost = CONFIG.ERRORS.REPLACEMENT_COST ?? 1000;
      if (this.credits >= cost) {
        this.addCredits(-cost);
        nearRack.rebuild();
        this.sound.playPlugSuccess();
        this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 45, '#00ff9d');
        this.showTemporaryToast(`🏗️ REPLACEMENT NODE DEPLOYED! ${nearRack.id} RESTORED TO 100% UPTIME`);
        this.updateObjectiveUI();
      } else {
        this.sound.playTerminalFail();
        this.showTemporaryToast(`❌ INSUFFICIENT FUNDS (NEED ${cost} ⚡, CURRENT: ${this.credits} ⚡)`);
      }
      return;
    }

    // 4. Patch Cable Snapping & Connection:
    if (this.activeCable) {
      if (this.activeCable instanceof MultiHopCable) {
        const target = this.activeCable.getCurrentTargetRack();
        if (target && nearRack.id === target.id) {
          const isDone = this.activeCable.advanceHop(nearRack);
          if (!isDone) {
            this.sound.playBusHop();
            this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 22, '#00ff9d');
            const nextTarget = this.activeCable.getCurrentTargetRack();
            this.showTemporaryToast(`🔌 HOP LINKED (${this.activeCable.currentHopIndex}/${this.activeCable.hops.length - 1}) ➔ NEXT: ${nextTarget?.id}`);
            this.updateObjectiveUI();
          } else {
            this.connectedCables.push(this.activeCable);
            this.activeCable.sourceRack.resolveError();
            this.sound.playPlugSuccess();
            this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 45, '#00ff9d');
            const totalNodes = this.activeCable.hops.length;
            const reward = 30 + (totalNodes * 20); // 3 nodes: 90⚡, 8 nodes: 190⚡
            this.addCredits(reward, `+${reward} ⚡ MULTI-NODE BUS RESTORED (${totalNodes} NODES)`);
            this.activeCable = null;
            this.updateObjectiveUI();
          }
        } else if (nearRack.id === this.activeCable.sourceRack.id) {
          this.dropActiveCable();
        }
        return;
      } else if (this.activeCable instanceof ContainmentWire) {
        const boss = this.activeBoss || this.bugBoss;
        if (!boss || !boss.isAlive) {
          // Boss is defeated - auto reel in the obsolete tether and proceed to interact with nearRack!
          this.dropActiveCable(true);
          this.activeCable = null;
        } else {
          this.showTemporaryToast('⚠️ RESTRAINT TETHER CANNOT BE PLUGGED INTO SERVERS!');
          return;
        }
      } else if (this.activeCable instanceof PatchCable) {
        if (nearRack.id === this.activeCable.targetRack.id) {
          this.activeCable.connect(nearRack);
          this.connectedCables.push(this.activeCable);
          this.activeCable.sourceRack.resolveError();
          nearRack.isTargetDestination = false;

          this.sound.playPlugSuccess();
          this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 28, '#00ff9d');
          this.addCredits(60, '+60 ⚡ RUN WIRE LINK RESTORED');

          this.activeCable = null;
          this.updateObjectiveUI();
        } else if (nearRack.id === this.activeCable.sourceRack.id) {
          this.dropActiveCable();
        }
        return;
      }
    }

    // 5. Grab Cable from failing rack (Run Wire / Single Cable):
    if (nearRack.isFailing && (nearRack.error?.type === CONFIG.ERRORS.RUN_WIRE || nearRack.error?.type === CONFIG.ERRORS.CABLE_DISCONNECT)) {
      const partner = nearRack.error.partnerRack || nearRack.error.targetRack;
      this.activeCable = new PatchCable(nearRack, partner);
      this.sound.playGrab();
      this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 12, '#ffaa00');
      this.showTemporaryToast(`🔌 WIRE GRABBED FROM ${nearRack.id} ➔ RUN TO ${partner?.id || 'PARTNER NODE'}!`, '🔌');
      this.updateObjectiveUI();
      return;
    }

    // 6. Grab Multi-Drop Cable from failing bus rack (Chain Wires: 3 to 5 servers):
    if (nearRack.isFailing && (nearRack.error?.type === CONFIG.ERRORS.CHAIN_WIRES || nearRack.error?.type === CONFIG.ERRORS.MULTI_CABLE_CHAIN)) {
      this.activeCable = new MultiHopCable(nearRack, nearRack.error.hops);
      this.sound.playGrab();
      this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 16, '#00ff9d');
      const target = this.activeCable.getCurrentTargetRack();
      this.showTemporaryToast(`🔌 CHAIN WIRE GRABBED (1/${nearRack.error.hops.length - 1}) ➔ RUN TO ${target?.id}!`, '⛓️');
      this.updateObjectiveUI();
      return;
    }

    // 7. Hold interaction tap notifications:
    if (nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.RESTART_REQUIRED) {
      if (nearRack.isShutdown) {
        this.showTemporaryToast('⚙️ HOLD [E] FOR 5 SECONDS TO MANUALLY TURN ON SERVER', '⚡');
      } else {
        nearRack.error.hasBeenInspected = true;
        this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
        if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
        if (this.terminalSelect) {
          this.terminalSelect.value = nearRack.id;
          this.updateTerminalSelectionFeedback();
        }
        this.showTemporaryToast(`🛑 RESTART REQUIRED: PIN [${nearRack.code}] SCANNED ➔ TYPE AT TERMINAL TO SHUT DOWN!`, '🛑');
      }
      this.sound.playKey();
      return;
    }
    if (nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.SERVER_BUG) {
      if (nearRack.isShutdown) {
        this.showTemporaryToast('🐛 HOLD [E] FOR 1.5s TO TAKE BUG OUT, THEN SQUISH IT!', '🐛');
      } else {
        nearRack.error.hasBeenInspected = true;
        this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
        if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
        if (this.terminalSelect) {
          this.terminalSelect.value = nearRack.id;
          this.updateTerminalSelectionFeedback();
        }
        this.showTemporaryToast(`🛑 SERVER BUG: PIN [${nearRack.code}] SCANNED ➔ TYPE AT TERMINAL TO SHUT DOWN & TRAP BUG!`, '🛑');
      }
      this.sound.playKey();
      return;
    }
    if (nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS) {
      if (nearRack.isShutdown) {
        this.showTemporaryToast('🧪 HOLD [E] FOR 2.5s TO DISINFECT VIRUS SLIME', '🦠');
      } else {
        nearRack.error.hasBeenInspected = true;
        this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
        if (this.memoCodeVal) this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
        if (this.terminalSelect) {
          this.terminalSelect.value = nearRack.id;
          this.updateTerminalSelectionFeedback();
        }
        this.showTemporaryToast(`🛑 VIRUS SLIME: PIN [${nearRack.code}] SCANNED ➔ TYPE AT TERMINAL TO SHUT DOWN FIRST!`, '🛑');
      }
      this.sound.playKey();
      return;
    }
    if (nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT) {
      if (nearRack.isShutdown) {
        this.showTemporaryToast(`❄️ ${nearRack.id} POWER ISOLATED // COOLANT RESERVES RESTORING AUTOMATICALLY...`, '❄️');
      } else {
        this.sound.playTerminalFail();
        this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 25, '#ff5500');
        this.showTemporaryToast(`🔥 ${nearRack.id} IS ENGULFED IN FLAMES! SCANNER OFFLINE DUE TO EXTREME HEAT — USE TERMINAL HEX DECODER!`, '🔥');
      }
      return;
    }
    if (nearRack.isFailing && nearRack.error?.type === CONFIG.ERRORS.HARD_REBOOT) {
      this.showTemporaryToast('⚠️ HOLD [E] CONTINUOUSLY TO HARD REBOOT POWER BREAKER');
      this.sound.playKey();
      return;
    }

    // 8. Holographic Decoy Rejection:
    if (nearRack.isDecoy) {
      this.sound.playGlitchStatic();
      this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 22, '#c084fc');
      this.showTemporaryToast('⚠️ HOLOGRAM DECOY DETECTED! CORRUPT PIN REJECTED — SCAN REAL SERVER!', '👻');
      return;
    }

    // 9. ALL SERVERS: Selecting any server rack scans and copies its PIN!
    if (nearRack.error?.type === CONFIG.ERRORS.ACCESS_DENIED || nearRack.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT || nearRack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH) {
      nearRack.error.hasBeenInspected = true;
    }

    this.activeCodeMemo = { rackId: nearRack.id, code: nearRack.code };
    if (this.memoCodeVal) {
      this.memoCodeVal.textContent = `${nearRack.id}: ${nearRack.code}`;
    }
    if (this.terminalSelect) {
      this.terminalSelect.value = nearRack.id;
      this.updateTerminalSelectionFeedback();
    }
    this.sound.playKey();
    this.particles.spawnSparks(nearRack.x + nearRack.width / 2, nearRack.y + nearRack.height / 2, 14, '#00ff9d');

    if (nearRack.isFailing && (nearRack.error?.type === CONFIG.ERRORS.ACCESS_DENIED || nearRack.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT || nearRack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH)) {
      this.showTemporaryToast(`SCANNED AUTHENTIC ${nearRack.id} // PIN: [${nearRack.code}] ➔ ENTER AT NOC DESK!`, '🔐');
      this.updateObjectiveUI();
    } else {
      this.showTemporaryToast(`SCANNED ${nearRack.id} // PIN: [${nearRack.code}] SAVED TO COMS LOG`);
    }
  }

  dropActiveCable(silent = false) {
    if (this.activeCable) {
      if (this.activeCable instanceof ContainmentWire) {
        const targetBoss = this.activeBoss || this.bugBoss;
        if (targetBoss && targetBoss.isAlive) {
          targetBoss.completedWraps = 0;
          targetBoss.currentWrapAngle = 0;
          targetBoss.wrapDirection = 0;
          targetBoss.lastPlayerAngle = null;
          this.updateBossHUD();
        }
      } else if (this.activeCable instanceof MultiHopCable) {
        this.activeCable.hops.forEach(h => {
          if (h.id !== this.activeCable.sourceRack.id) {
            h.isTargetDestination = false;
          }
        });
        if (this.activeCable.sourceRack?.error) {
          this.activeCable.hops[1].isTargetDestination = true;
        }
      }
      this.activeCable = null;
      if (!silent) {
        this.showTemporaryToast('🔌 CABLE DROPPED / REELED IN');
      }
    }
  }

  updateObjectiveUI() {
    // Legacy objective banner removed; all alerts dispatched as bottom toasts
  }

  // ==========================================================================
  // Portable Field NOC Terminal System (Deployable Apex Reward)
  // ==========================================================================
  handlePortableTerminalKey() {
    if (!this.hasPortableTerminal) {
      this.sound.playTerminalFail?.();
      this.showTemporaryToast('🔒 PORTABLE FIELD TERMINAL LOCKED — Defeat a main boss to acquire this item! (Press [B] for boss)', '💻');
      return;
    }

    if (!this.portableTerminal) {
      this.portableTerminal = new PortableTerminalStation(this.player.x - 55, this.player.y - 29);
      if (this.sound?.playCabinetOpen) this.sound.playCabinetOpen();
      this.particles.spawnSparks(this.player.x, this.player.y, 40, '#00ff9d');
      this.camera.shake(6, 0.2);
      this.showTemporaryToast('💻 PORTABLE FIELD TERMINAL DEPLOYED! PRESS [E] TO ACCESS MASTER TERMINAL, [P] TO RELOCATE.', '💻');
    } else {
      this.portableTerminal.x = this.player.x - 55;
      this.portableTerminal.y = this.player.y - 29;
      if (this.sound?.playCabinetOpen) this.sound.playCabinetOpen();
      this.particles.spawnSparks(this.player.x, this.player.y, 40, '#00ff9d');
      this.showTemporaryToast('💻 PORTABLE FIELD TERMINAL RELOCATED TO CURRENT POSITION! [E: OPEN | P: RELOCATE]', '💻');
    }
    this.updateBuffDisplay();
  }

  // ==========================================================================
  // Unique Quantum Teleporter System (Post-Boss Prototype Reward)
  // ==========================================================================
  handleTeleporterKey() {
    if (!this.hasTeleporterItem) {
      this.sound.playTerminalFail();
      this.showTemporaryToast('🔒 QUANTUM TELEPORTER LOCKED — Defeat the Corrupted Bug Boss to acquire this item! (Press [B] for boss)', '🌀');
      return;
    }

    // Phase 1: Deploy Node Alpha
    if (this.teleporterNodes.length === 0) {
      const nodeA = new TeleporterNode(
        'alpha',
        this.player.x,
        this.player.y,
        'NODE α',
        CONFIG.COLORS.TELEPORTER_ALPHA ?? '#00f3ff',
        '#00ff9d'
      );
      this.teleporterNodes.push(nodeA);
      this.sound.playTeleportDeploy(0);
      this.particles.spawnSparks(nodeA.x, nodeA.y, 45, '#00f3ff');
      this.particles.spawnSparks(nodeA.x, nodeA.y, 25, '#00ff9d');
      this.camera.shake(8, 0.25);
      this.showTemporaryToast('🌀 TELEPORTER NODE ALPHA [α] ANCHORED! Move across aisles and press [T] to anchor Node Beta [β].', '🌀');
      this.updateBuffDisplay();
      return;
    }

    // Phase 2: Deploy Node Beta (Completing the Permanent Pair)
    if (this.teleporterNodes.length === 1) {
      const nodeA = this.teleporterNodes[0];
      const dist = Math.hypot(this.player.x - nodeA.x, this.player.y - nodeA.y);
      const minDist = CONFIG.TELEPORTER?.MIN_DISTANCE ?? 120;
      if (dist < minDist) {
        this.sound.playTerminalFail();
        this.showTemporaryToast(`⚠️ TOO CLOSE TO NODE ALPHA! Move at least ${minDist}px away to establish subspace quantum link.`, '⚠️');
        return;
      }

      const nodeB = new TeleporterNode(
        'beta',
        this.player.x,
        this.player.y,
        'NODE β',
        CONFIG.COLORS.TELEPORTER_BETA ?? '#e024c3',
        '#ff007f'
      );
      this.teleporterNodes.push(nodeB);
      this.sound.playTeleportDeploy(1);
      this.particles.spawnSparks(nodeB.x, nodeB.y, 60, '#e024c3');
      this.particles.spawnSparks(nodeB.x, nodeB.y, 30, '#ff007f');
      this.particles.spawnSparks(nodeA.x, nodeA.y, 40, '#00f3ff');
      this.camera.shake(14, 0.35);
      this.showTemporaryToast('⚡ QUANTUM TELEPORT LINK ESTABLISHED! Step onto either node pad or press [T]/[E] to teleport!', '🌀');
      this.updateBuffDisplay();
      return;
    }

    // Phase 3: Both nodes already permanently placed!
    if (this.teleporterNodes.length === 2) {
      const nearNode = this.getNearTeleporterNode();
      if (nearNode) {
        const otherNode = this.teleporterNodes[0] === nearNode ? this.teleporterNodes[1] : this.teleporterNodes[0];
        this.teleportPlayer(nearNode, otherNode);
      } else {
        this.showTemporaryToast('🌀 QUANTUM LINK PERMANENTLY ANCHORED! Step on Node α or Node β to warp across the warehouse.', '🌀');
      }
    }
  }

  teleportPlayer(fromNode, toNode) {
    if (this.teleportCooldown > 0) {
      this.sound.playTerminalFail();
      this.showTemporaryToast(`⏳ TELEPORTER RECHARGING (${this.teleportCooldown.toFixed(1)}s)`, '🌀');
      return;
    }

    // Quantum implosion at source
    this.particles.spawnSparks(fromNode.x, fromNode.y, 40, fromNode.color);
    this.particles.spawnSparks(fromNode.x, fromNode.y, 25, '#ffffff');

    // Teleport player
    this.player.x = toNode.x;
    this.player.y = toNode.y;

    // Snap camera immediately to destination
    this.camera.x = toNode.x;
    this.camera.y = toNode.y;
    this.camera.targetX = toNode.x;
    this.camera.targetY = toNode.y;
    this.camera.shake(16, 0.4);

    // Audio warp sound
    this.sound.playTeleportWarp();

    // Trigger screen damage/warp vignette flash
    this.triggerWarpVignette();

    // Quantum explosion & shockwave at destination
    this.particles.spawnSparks(toNode.x, toNode.y, 55, toNode.color);
    this.particles.spawnSparks(toNode.x, toNode.y, 35, '#00f3ff');
    this.particles.spawnSparks(toNode.x, toNode.y, 25, '#ffffff');

    // Smoothly re-anchor any trailing active patch cable so it doesn't snap
    if (this.activeCable && Array.isArray(this.activeCable.nodes)) {
      for (let i = 1; i < this.activeCable.nodes.length; i++) {
        this.activeCable.nodes[i].x = this.player.x;
        this.activeCable.nodes[i].y = this.player.y;
      }
    }

    // Set cooldown
    this.teleportCooldown = CONFIG.TELEPORTER?.COOLDOWN ?? 1.2;
    this.updateBuffDisplay();
    this.showTemporaryToast(`⚡ QUANTUM WARP ➔ ${toNode.name}!`, '🌀');
  }

  triggerWarpVignette() {
    if (!this.damageVignette) return;
    this.damageVignette.classList.remove('warp-flash');
    void this.damageVignette.offsetWidth;
    this.damageVignette.classList.add('warp-flash');
    setTimeout(() => {
      this.damageVignette?.classList.remove('warp-flash');
    }, 450);
  }

  renderTeleporterLink(ctx, cam) {
    if (this.teleporterNodes.length < 2) return;
    const nodeA = this.teleporterNodes[0];
    const nodeB = this.teleporterNodes[1];

    const posA = cam.toScreen(nodeA.x, nodeA.y);
    const posB = cam.toScreen(nodeB.x, nodeB.y);

    ctx.save();
    // Glowing dashed quantum conduit
    ctx.beginPath();
    ctx.moveTo(posA.x, posA.y);
    ctx.lineTo(posB.x, posB.y);
    ctx.strokeStyle = CONFIG.COLORS.TELEPORTER_LINK ?? 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 16]);
    ctx.lineDashOffset = -this.gameTime * 45;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Inner bright beam
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([6, 22]);
    ctx.lineDashOffset = -this.gameTime * 45;
    ctx.stroke();
    ctx.restore();
  }

  renderTeleporterPrompt(ctx, cam, node) {
    const pos = cam.toScreen(node.x, node.y - node.radius - 36);
    const boxW = 220;
    const boxH = 34;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 14, 26, 0.94)';
    ctx.fillRect(pos.x - boxW / 2, pos.y - boxH / 2, boxW, boxH);
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pos.x - boxW / 2, pos.y - boxH / 2, boxW, boxH);

    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.teleporterNodes.length === 2) {
      if (this.teleportCooldown > 0) {
        ctx.fillStyle = '#ffb800';
        ctx.fillText(`⏳ RECHARGING: ${this.teleportCooldown.toFixed(1)}s`, pos.x, pos.y);
      } else {
        const otherNode = this.teleporterNodes[0] === node ? this.teleporterNodes[1] : this.teleporterNodes[0];
        ctx.fillStyle = '#00ff9d';
        ctx.fillText(`[E] / [T] WARP ➔ ${otherNode.name}`, pos.x, pos.y);
      }
    } else {
      ctx.fillStyle = '#00f3ff';
      ctx.fillText('[T] DEPLOY NODE β ELSEWHERE', pos.x, pos.y);
    }
    ctx.restore();
  }


  // ==========================================================================
  // Main Update Loop
  // ==========================================================================
  update(dt) {
    if (this.gameState === 'MENU') {
      const time = performance.now() * 0.0003;
      this.camera.targetX = CONFIG.WORLD.WIDTH / 2 + Math.cos(time) * 450;
      this.camera.targetY = CONFIG.WORLD.HEIGHT / 2 + Math.sin(time * 0.7) * 300;
      this.camera.update(dt, 0, 0);
      this.particles.update(dt);
      return;
    }

    if (this.isGameOver || this.gameState === 'GAME_OVER') return;

    if (this.isResumingFromSave || this.gameState === 'COUNTDOWN') {
      this.resumeCountdownTimer -= dt;
      const displayNum = Math.max(1, Math.ceil(this.resumeCountdownTimer));
      if (this.countdownNumber) {
        this.countdownNumber.textContent = displayNum;
      }
      if (this.resumeCountdownTimer <= 0) {
        this.isResumingFromSave = false;
        this.gameState = 'PLAYING';
        this.resumeCountdownOverlay?.classList.add('hidden');
        this.sound.playUpgrade();
        this.showTemporaryToast('🟢 3... 2... 1... GO! RUN RESUMED!', '⚡');
      }
      return; // Hold player movement and error countdowns during countdown
    }

    if (this.isPaused || this.isShopOpen || this.isTutorialOpen || this.isBossRewardOpen) return;

    // While in bullet-time Cannon Aiming mode, EVERYTHING FREEZES!
    if (this.isCannonAiming) {
      this.aimAnimOffset = (this.aimAnimOffset + 35 * dt) % (CONFIG.CANNON.DOT_SPACING ?? 20);
      const wm = this.camera.toWorld(this.mouseScreenX, this.mouseScreenY);
      this.aimAngle = Math.atan2(wm.y - this.player.y, wm.x - this.player.x);
      return; // Racks, timers, movements completely frozen!
    }

    // Tick puck glide timer
    if (this.cannonPuckTimer > 0) {
      this.cannonPuckTimer = Math.max(0, this.cannonPuckTimer - dt);
    }
    const isCannonPuck = this.cannonPuckTimer > 0;

    // Progressive Difficulty Escalation
    this.gameTime += dt;
    const diffCfg = CONFIG.DIFFICULTY;
    const ramp = Math.min(1.0, this.gameTime / diffCfg.RAMP_DURATION);
    const currentSpawnInterval = diffCfg.INITIAL_SPAWN_INTERVAL - (diffCfg.INITIAL_SPAWN_INTERVAL - diffCfg.MIN_SPAWN_INTERVAL) * ramp;
    const maxActiveErrors = Math.floor(diffCfg.INITIAL_MAX_ERRORS + (diffCfg.PEAK_MAX_ERRORS - diffCfg.INITIAL_MAX_ERRORS) * ramp);

    // 10-Minute Progressive Boss Encounter Trigger (Every 10 minutes: 10:00, 20:00, 30:00, 40:00, 50:00...)
    const expectedWave = Math.floor(this.gameTime / 600);
    if (expectedWave > (this.currentBossWave || 0) && (!this.activeBoss || !this.activeBoss.isAlive) && this.gameState === 'PLAYING') {
      this.spawnBoss(expectedWave);
    }

    // Update Threat Level Badge in HUD
    if (this.threatBadge) {
      if (this.activeBoss && this.activeBoss.isAlive) {
        this.threatBadge.className = 'hud-badge threat-badge threat-defcon-1';
        this.threatBadge.textContent = this.activeBoss.title || 'DEFCON 1 // BOSS ANOMALY';
      } else {
        let tierClass = 'threat-defcon-5';
        let tierText = 'DEFCON 5 // STABLE';
        if (ramp >= 0.85) {
          tierClass = 'threat-defcon-1';
          tierText = 'DEFCON 1 // CASCADE CRITICAL';
        } else if (ramp >= 0.65) {
          tierClass = 'threat-defcon-2';
          tierText = 'DEFCON 2 // SEVERE';
        } else if (ramp >= 0.4) {
          tierClass = 'threat-defcon-3';
          tierText = 'DEFCON 3 // HIGH';
        } else if (ramp >= 0.18) {
          tierClass = 'threat-defcon-4';
          tierText = 'DEFCON 4 // ELEVATED';
        }
        this.threatBadge.className = `hud-badge threat-badge ${tierClass}`;
        this.threatBadge.textContent = tierText;
      }
    }

    // Tick active buffs
    if (this.activeBuffs.nitro > 0) {
      this.activeBuffs.nitro = Math.max(0, this.activeBuffs.nitro - dt);
    }
    if (this.activeBuffs.grip > 0) {
      this.activeBuffs.grip = Math.max(0, this.activeBuffs.grip - dt);
    }
    this.updateBuffDisplay();

    // Player Movement Physics (Disabled while docked at NOC keypad terminal)
    if (!this.isTerminalOpen) {
      this.player.update(this.keys, dt, this.activeBuffs, isCannonPuck, this.sound, this.particles);

      // Super Reel: Magnetic port snap from +120px away!
      if (this.player.hasSuperReel && this.activeCable && !this.activeCable.isConnected) {
        const targetRack = this.activeCable instanceof MultiHopCable 
          ? this.activeCable.getCurrentTargetRack() 
          : this.activeCable.targetRack;
        if (targetRack) {
          const tDist = Math.hypot(this.player.x - (targetRack.x + targetRack.width / 2), this.player.y - (targetRack.y + targetRack.height / 2));
          if (tDist <= 140) {
            this.handleInteractKey();
          }
        }
      }

      // Hitbox Collisions against Server Racks
      for (const rack of this.racks) {
        if (Math.abs(this.player.x - (rack.x + rack.width / 2)) < 110 &&
            Math.abs(this.player.y - (rack.y + rack.height / 2)) < 110) {
          this.player.resolveAABBCollision(
            rack.x, rack.y, rack.width, rack.height,
            this.sound, this.particles, this.activeBuffs, isCannonPuck
          );
        }
      }

      // Hitbox Collisions against Stations
      this.player.resolveAABBCollision(
        this.nocDesk.x, this.nocDesk.y, this.nocDesk.width, this.nocDesk.height,
        this.sound, this.particles, this.activeBuffs, isCannonPuck
      );
      this.player.resolveAABBCollision(
        this.shopKiosk.x, this.shopKiosk.y, this.shopKiosk.width, this.shopKiosk.height,
        this.sound, this.particles, this.activeBuffs, isCannonPuck
      );
      if (this.suppliesCloset) {
        this.player.resolveAABBCollision(
          this.suppliesCloset.x, this.suppliesCloset.y, this.suppliesCloset.width, this.suppliesCloset.height,
          this.sound, this.particles, this.activeBuffs, isCannonPuck
        );
      }
      if (this.portableTerminal) {
        this.portableTerminal.update(dt);
        this.player.resolveAABBCollision(
          this.portableTerminal.x, this.portableTerminal.y, this.portableTerminal.width, this.portableTerminal.height,
          this.sound, this.particles, this.activeBuffs, isCannonPuck
        );
      }

      // Hold-to-Reboot / Shake / Disinfect Processing
      if (this.keys['KeyE']) {
        if (!this.rebootingRack && !this.shakingRack && !this.disinfectingRack && !this.coolingRack && !this.wormRack) {
          const near = this.getNearestRack(105);
          if (near && near.isFailing) {
            if (near.error?.type === CONFIG.ERRORS.RESTART_REQUIRED && near.isShutdown) {
              this.rebootingRack = near;
              this.rebootHoldTime = 0;
            } else if (near.error?.type === CONFIG.ERRORS.SERVER_BUG && near.isShutdown) {
              this.shakingRack = near;
              this.shakeHoldTime = 0;
            } else if (near.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS && near.isShutdown) {
              this.disinfectingRack = near;
              this.disinfectHoldTime = 0;
            } else if (near.error?.type === CONFIG.ERRORS.HARD_REBOOT) {
              this.rebootingRack = near;
              this.rebootHoldTime = 0;
            } else if (near.error?.type === CONFIG.ERRORS.COOLANT_LEAK) {
              this.coolingRack = near;
              this.coolantHoldTime = 0;
            } else if (near.error?.type === CONFIG.ERRORS.NETWORK_WORM) {
              this.wormRack = near;
              this.wormHoldTime = 0;
            }
          }
        }

        // Reboot / Turn-On Processing (5.0s hold)
        if (this.rebootingRack) {
          const rackCenter = {
            x: this.rebootingRack.x + this.rebootingRack.width / 2,
            y: this.rebootingRack.y + this.rebootingRack.height / 2,
          };
          const dist = this.getDistanceToRack(this.rebootingRack);

          if (dist <= 115 && !this.rebootingRack.isDestroyed && this.rebootingRack.isFailing) {
            this.rebootHoldTime += dt;
            const reqTime = (this.activeSynergies.netops >= 2) ? 3.0 : (CONFIG.ERRORS.REBOOT_HOLD_TIME ?? 5.0);
            const progress = Math.min(1.0, this.rebootHoldTime / reqTime);
            this.sound.playRebootCharge(progress);

            if (Math.random() < 0.45) {
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 2, '#00f3ff');
            }

            if (this.rebootHoldTime >= reqTime) {
              this.sound.stopRebootCharge();
              this.sound.playPlugSuccess();
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 40, '#00ff9d');
              const isRestartReq = this.rebootingRack.error?.type === CONFIG.ERRORS.RESTART_REQUIRED;
              this.rebootingRack.resolveError();
              const bonus = (this.activeSynergies.netops >= 1) ? 30 : 0;
              const reward = isRestartReq ? 75 : 70;
              this.addCredits(reward + bonus, `+${reward + bonus} ⚡ ${isRestartReq ? 'SERVER MANUALLY TURNED ON' : 'HARD REBOOT COMPLETED'}`);
              this.rebootHoldTime = 0;
              this.rebootingRack = null;
              this.updateObjectiveUI();
            }
          } else {
            if (this.rebootHoldTime > 0.3) this.sound.playRebootCancel();
            this.sound.stopRebootCharge();
            this.rebootHoldTime = 0;
            this.rebootingRack = null;
            this.updateObjectiveUI();
          }
        }

        // Proximity inspection at non-shutdown bug server: scans PIN for Master Terminal
        if (this.keys['KeyE']) {
          const near = this.getNearestRack(105);
          if (near && near.isFailing && near.error?.type === CONFIG.ERRORS.SERVER_BUG && !near.isShutdown) {
            const dist = this.getDistanceToRack(near);
            if (dist <= 105) {
              near.error.hasBeenInspected = true;
              this.activeCodeMemo = { rackId: near.id, code: near.code };
              if (this.memoCodeVal) {
                this.memoCodeVal.textContent = `${near.id}: ${near.code}`;
              }
            }
          }
        }

        // Server Bug Extraction (1.5s hold to take out bug)
        if (this.shakingRack) {
          const rackCenter = { x: this.shakingRack.x + this.shakingRack.width / 2, y: this.shakingRack.y + this.shakingRack.height / 2 };
          const dist = this.getDistanceToRack(this.shakingRack);
          if (dist <= 120 && !this.shakingRack.isDestroyed && this.shakingRack.isFailing) {
            this.shakeHoldTime = (this.shakeHoldTime || 0) + dt;
            this.camera.shake(4, 0.1);
            if (Math.random() < 0.4) this.particles.spawnSparks(rackCenter.x, rackCenter.y, 2, '#f59e0b');
            if (this.shakeHoldTime >= 1.5) {
              this.sound.playShake?.() || this.sound.playIceShatter();
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 35, '#ffaa00');
              const shakenRack = this.shakingRack;
              const existingBug = shakenRack.error?.bugEntity;
              shakenRack.resolveError();
              shakenRack.uptime = 100;
              this.shakingRack = null;
              this.shakeHoldTime = 0;

              // Expel the small bug right beside the rack for squishing
              const bug = existingBug || new SmallBug(rackCenter.x + 35, rackCenter.y + 35, shakenRack);
              bug.isInsideRack = false;
              bug.currentRack = null;
              bug.isAlive = true;
              bug.x = rackCenter.x + (Math.random() < 0.5 ? 40 : -40);
              bug.y = rackCenter.y + (Math.random() < 0.5 ? 40 : -40);
              bug.pickNextTarget(this);
              if (!this.smallBugs.includes(bug)) {
                this.smallBugs.push(bug);
              }
              const targetStr = bug.targetRack ? `➔ TARGET: ${bug.targetRack.id}` : '';
              this.showTemporaryToast(`🐛 BUG TAKEN OUT OF ${shakenRack.id}! RUN OVER IT TO SQUISH IT BEFORE IT ENTERS ANOTHER SERVER! ${targetStr}`, '🥾');
              this.updateObjectiveUI();
            }
          } else {
            this.shakingRack = null;
            this.shakeHoldTime = 0;
          }
        }

        // Server Small Virus Disinfect (2.5s hold)
        if (this.disinfectingRack) {
          const rackCenter = { x: this.disinfectingRack.x + this.disinfectingRack.width / 2, y: this.disinfectingRack.y + this.disinfectingRack.height / 2 };
          const dist = this.getDistanceToRack(this.disinfectingRack);
          if (dist <= 120 && !this.disinfectingRack.isDestroyed && this.disinfectingRack.isFailing) {
            this.disinfectHoldTime = (this.disinfectHoldTime || 0) + dt;
            if (Math.random() < 0.4) this.particles.spawnSparks(rackCenter.x, rackCenter.y, 3, '#10b981');
            if (this.disinfectHoldTime >= 2.5) {
              this.sound.playDisinfect?.() || this.sound.playIceShatter();
              this.sound.playPlugSuccess();
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 40, '#00ff9d');
              this.disinfectingRack.resolveError();
              const bonus = (this.activeSynergies.netops >= 1) ? 30 : 0;
              this.addCredits(85 + bonus, `+${85 + bonus} ⚡ VIRUS CLEANSED & DISINFECTED`);
              this.disinfectingRack = null;
              this.disinfectHoldTime = 0;
              this.updateObjectiveUI();
            }
          } else {
            this.disinfectingRack = null;
            this.disinfectHoldTime = 0;
          }
        }

        // Coolant Leak Valve Sealing
        if (this.coolingRack) {
          const rackCenter = { x: this.coolingRack.x + this.coolingRack.width / 2, y: this.coolingRack.y + this.coolingRack.height / 2 };
          const dist = this.getDistanceToRack(this.coolingRack);
          if (dist <= 120 && !this.coolingRack.isDestroyed && this.coolingRack.isFailing) {
            this.coolantHoldTime = (this.coolantHoldTime || 0) + dt;
            if (Math.random() < 0.35) this.particles.spawnSparks(rackCenter.x, rackCenter.y, 2, '#00f3ff');
            if (this.coolantHoldTime >= 3.5) {
              this.sound.playIceShatter();
              this.sound.playPlugSuccess();
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 40, '#00ff9d');
              this.coolingRack.resolveError();
              const bonus = (this.activeSynergies.netops >= 1) ? 30 : 0;
              this.addCredits(80 + bonus, `+${80 + bonus} ⚡ CRYO VALVE SEALED`);
              this.coolingRack = null;
              this.coolantHoldTime = 0;
              this.updateObjectiveUI();
            }
          } else {
            this.coolingRack = null;
            this.coolantHoldTime = 0;
          }
        }

        // Network Worm Purge Hold
        if (this.wormRack) {
          const rackCenter = { x: this.wormRack.x + this.wormRack.width / 2, y: this.wormRack.y + this.wormRack.height / 2 };
          const dist = this.getDistanceToRack(this.wormRack);
          if (dist <= 120 && !this.wormRack.isDestroyed && this.wormRack.isFailing) {
            this.wormHoldTime = (this.wormHoldTime || 0) + dt;
            if (Math.random() < 0.35) this.particles.spawnSparks(rackCenter.x, rackCenter.y, 2, '#ff0055');
            if (this.wormHoldTime >= 2.5) {
              this.sound.playGlitchStatic();
              this.sound.playPlugSuccess();
              this.particles.spawnSparks(rackCenter.x, rackCenter.y, 45, '#00ff9d');
              this.wormRack.resolveError();
              const bonus = (this.activeSynergies.netops >= 1) ? 30 : 0;
              this.addCredits(85 + bonus, `+${85 + bonus} ⚡ NETWORK WORM PURGED`);
              this.wormRack = null;
              this.wormHoldTime = 0;
              this.updateObjectiveUI();
            }
          } else {
            this.wormRack = null;
            this.wormHoldTime = 0;
          }
        }
      } else {
        if (this.rebootingRack) {
          if (this.rebootHoldTime > 0.3) this.sound.playRebootCancel();
          this.sound.stopRebootCharge();
          this.rebootHoldTime = 0;
          this.rebootingRack = null;
          this.updateObjectiveUI();
        }
        if (this.shakingRack) {
          this.shakingRack = null;
          this.shakeHoldTime = 0;
        }
        if (this.disinfectingRack) {
          this.disinfectingRack = null;
          this.disinfectHoldTime = 0;
        }
        if (this.coolingRack) {
          this.coolingRack = null;
          this.coolantHoldTime = 0;
        }
        if (this.wormRack) {
          this.wormRack = null;
          this.wormHoldTime = 0;
        }
      }

      // Automatic Step-on Quantum Teleportation Check
      if (this.teleporterNodes.length === 2 && this.teleportCooldown <= 0) {
        const nodeA = this.teleporterNodes[0];
        const nodeB = this.teleporterNodes[1];
        const actRadius = CONFIG.TELEPORTER?.ACTIVATION_RADIUS ?? 30;
        const distA = Math.hypot(this.player.x - nodeA.x, this.player.y - nodeA.y);
        const distB = Math.hypot(this.player.x - nodeB.x, this.player.y - nodeB.y);

        if (distA <= actRadius) {
          this.teleportPlayer(nodeA, nodeB);
        } else if (distB <= actRadius) {
          this.teleportPlayer(nodeB, nodeA);
        }
      }
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    // Update Patch Drone companion
    if (this.patchDrone) {
      this.patchDrone.update(dt, this);
    }

    // High-Yield Infrastructure Dividends: +35⚡ every 30s when uptime > 80%
    if (this.hasYieldBonds && this.gameState === 'PLAYING') {
      this.yieldDividendTimer = (this.yieldDividendTimer || 0) + dt;
      if (this.yieldDividendTimer >= 30.0) {
        this.yieldDividendTimer = 0;
        const totalUptime = this.racks.reduce((acc, r) => acc + r.uptime, 0);
        const avg = totalUptime / this.racks.length;
        if (avg >= 80) {
          const divBonus = (this.activeSynergies.netops >= 3) ? 70 : 35;
          this.addCredits(divBonus, `📈 +${divBonus} ⚡ INFRASTRUCTURE DIVIDENDS (UPTIME: ${avg.toFixed(1)}%)`);
        }
      }
    }

    // Update Quantum Teleporter Nodes & Cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown = Math.max(0, this.teleportCooldown - dt);
      if (this.teleportCooldown === 0) {
        this.updateBuffDisplay();
      }
    }
    for (const node of this.teleporterNodes) {
      node.update(dt);
    }

    this.camera.update(this.player, dt);
    this.particles.update(dt);

    // Update Supplies Closet Station
    if (this.suppliesCloset) {
      this.suppliesCloset.update(dt);
    }

    // Update Active Boss & Boss-to-Server-Rack Collisions
    const curBoss = this.activeBoss || this.bugBoss;
    if (curBoss && curBoss.isAlive) {
      curBoss.update(this.player, this.activeCable, dt, this);
      this.checkBossRackCollisions(curBoss, dt);
    }

    // Update Small Rogue Bugs
    for (let i = this.smallBugs.length - 1; i >= 0; i--) {
      const bug = this.smallBugs[i];
      bug.update(this.player, dt, this);
      if (!bug.isAlive) {
        this.smallBugs.splice(i, 1);
      }
    }

    // Check Player Health Defeat & Defibrillator Auto-Revive
    if (this.player.hp <= 0) {
      if (this.player.defibrillatorCharges > 0) {
        this.player.defibrillatorCharges--;
        this.player.hp = 100;
        this.player.invulnerableTimer = 3.0;
        this.sound.playPowerup();
        this.camera.shake(22, 0.5);
        this.particles.spawnSparks(this.player.x, this.player.y, 60, '#00ff9d');
        this.showTemporaryToast('💉 DEFIBRILLATOR AUTO-REVIVED CART TO 100 HP! [3s INVULNERABLE]', '⚡');
        this.updatePlayerHealthUI();
        this.updateBuffDisplay();
      } else {
        this.respawnPlayerAtNOC();
      }
    }

    // Active Cables
    if (this.activeCable) {
      this.activeCable.update(this.player, dt, this);
      this.updateObjectiveUI();
      if (this.activeCable instanceof ContainmentWire && this.bugBoss?.isAlive) {
        this.updateBossHUD();
      }
    }

    for (const cable of this.connectedCables) {
      cable.update(this.player, dt);
    }

    // Incident Timer with Dynamic Escalation (Halted during Boss Battle)
    if (!this.bugBoss || !this.bugBoss.isAlive) {
      this.incidentTimer += dt;
      if (this.incidentTimer >= currentSpawnInterval) {
        this.incidentTimer = 0;
        const currentFailing = this.racks.filter(r => r.isFailing && !r.isDestroyed).length;
        if (currentFailing < maxActiveErrors) {
          this.triggerRandomIncident();
        }
      }
    }

    // High Uptime Dividend (every 12s if uptime > 90%)
    this.dividendTimer += dt;
    if (this.dividendTimer >= 12.0) {
      this.dividendTimer = 0;
      const totalUptime = this.racks.reduce((acc, r) => acc + r.uptime, 0);
      const avg = totalUptime / this.racks.length;
      if (avg >= 90) {
        this.addCredits(10, '+10 ⚡ HIGH UPTIME DIVIDEND');
      }
    }

    // Update Server Racks & Check 30s Overheat Timers
    let failingCount = 0;
    let destroyedCount = 0;
    let totalUptime = 0;

    for (const rack of this.racks) {
      rack.update(dt, this);
      if (rack.isDestroyed) destroyedCount++;
      else if (rack.isFailing) failingCount++;
      totalUptime += rack.uptime;
    }

    // Loss condition: All server racks exploded
    if (this.racks.length > 0 && destroyedCount >= this.racks.length && !this.isGameOver && this.gameState === 'PLAYING') {
      this.triggerGameOver();
      return;
    }

    // Global Warehouse Uptime Integrity (destroyed racks permanently drag down uptime to 0%!)
    const avgUptime = (totalUptime / this.racks.length).toFixed(1);
    if (this.uptimeVal) this.uptimeVal.textContent = `${avgUptime}%`;
    if (this.uptimeFill) this.uptimeFill.style.width = `${avgUptime}%`;
    if (this.statsUptimeVal) this.statsUptimeVal.textContent = `${avgUptime}%`;
    if (this.statsUptimeFill) this.statsUptimeFill.style.width = `${avgUptime}%`;

    const speed = (this.player.getSpeed() / 30).toFixed(1);
    if (this.speedReadout) this.speedReadout.textContent = `${speed} m/s`;
    if (this.statsSpeedVal) this.statsSpeedVal.textContent = `${speed} m/s`;

    if (this.alertCountReadout) {
      const faultLabel = failingCount === 1 ? '1 FAULT' : `${failingCount} FAULTS`;
      this.alertCountReadout.textContent = faultLabel;
      this.alertCountReadout.style.color = failingCount > 0 ? CONFIG.COLORS.RACK_LED_RED : CONFIG.COLORS.RACK_LED_GREEN;
    }
    if (this.statsFaultsVal) {
      this.statsFaultsVal.textContent = failingCount === 1 ? '1 FAULT' : `${failingCount} FAULTS`;
      this.statsFaultsVal.style.color = failingCount > 0 ? '#ffb800' : '#00ff9d';
    }

    if (this.isStatsOpen) {
      this.updateStatsUI();
    }

    // Live terminal keypad countdowns
    if (this.isTerminalOpen) {
      this.updateTerminalLiveCountdowns();
    }
  }

  updateTerminalLiveCountdowns() {
    if (!this.isTerminalOpen) return;

    const selectedRackId = this.terminalSelect?.value;
    const targetRack = this.racks.find(r => r.id === selectedRackId);

    // Sync options if active errors changed (e.g. rack exploded or new incident spawned)
    const actionableRacks = this.racks.filter(r => r.isFailing && (
      r.error?.type === CONFIG.ERRORS.ACCESS_DENIED ||
      r.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT ||
      r.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH ||
      r.error?.type === CONFIG.ERRORS.RESTART_REQUIRED ||
      r.error?.type === CONFIG.ERRORS.SERVER_BUG ||
      r.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT ||
      r.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS
    ));
    const currentOptionValues = Array.from(this.terminalSelect?.options || []).map(o => o.value);
    const activeIds = actionableRacks.map(r => r.id);
    const optionsNeedSync = activeIds.length !== currentOptionValues.filter(v => v && v !== 'NO ACTIVE TERMINAL FAULTS').length ||
                            !activeIds.every(id => currentOptionValues.includes(id));

    if (optionsNeedSync && this.terminalSelect) {
      const prevVal = this.terminalSelect.value;
      this.terminalSelect.innerHTML = '';
      if (actionableRacks.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'NO ACTIVE TERMINAL FAULTS';
        opt.disabled = true;
        this.terminalSelect.appendChild(opt);
        if (this.terminalFeedback && !this.terminalFeedback.textContent.includes('ACCEPTED')) {
          this.terminalFeedback.textContent = 'ALL SERVER NODES OPERATING NORMALLY';
          this.terminalFeedback.style.color = CONFIG.COLORS.CONSOLE_CYAN;
        }
        if (this.terminalKeypad) this.terminalKeypad.classList.remove('hidden');
        if (this.terminalShutdownPanel) this.terminalShutdownPanel.classList.add('hidden');
      } else {
        actionableRacks.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.id;
          const t = r.error?.type;
          let tag = 'SEC-AUTH';
          if (t === CONFIG.ERRORS.RESTART_REQUIRED) tag = r.isShutdown ? 'OFFLINE // READY FOR REBOOT' : 'REQ-SHUTDOWN';
          else if (t === CONFIG.ERRORS.SERVER_BUG) tag = r.isShutdown ? 'OFFLINE // SHAKE BUG OUT' : 'BUG INFESTATION';
          else if (t === CONFIG.ERRORS.SERVER_OVERHEAT) tag = r.isShutdown ? 'OFFLINE // COOLING' : 'FIRE OVERHEAT';
          else if (t === CONFIG.ERRORS.SERVER_SMALL_VIRUS) tag = r.isShutdown ? 'OFFLINE // DISINFECT' : 'VIRUS SLIME';
          else if (t === CONFIG.ERRORS.PHANTOM_GLITCH) tag = 'HOLO-GLITCH';

          if (!r.isShutdown) {
            if (t === CONFIG.ERRORS.SERVER_OVERHEAT) {
              opt.textContent = `${r.id} // ${tag} [ON FIRE - CANNOT SCAN ON-FOOT]`;
            } else {
              opt.textContent = r.error?.hasBeenInspected ? `${r.id} // ${tag} [PIN: ${r.code}]` : `${r.id} // ${tag} [PIN UNKNOWN - SCAN RACK]`;
            }
          } else {
            opt.textContent = `${r.id} // ${tag}`;
          }
          this.terminalSelect.appendChild(opt);
        });
        if (activeIds.includes(prevVal)) {
          this.terminalSelect.value = prevVal;
        } else {
          this.updateTerminalSelectionFeedback();
        }
      }
    }

    // Live Countdown Readout for Target Node
    if (targetRack && targetRack.isDestroyed) {
      if (this.terminalCountdownVal) {
        this.terminalCountdownVal.textContent = '💥 EXPLODED [0.0s] - NODE LOST';
        this.terminalCountdownVal.style.color = '#ff2a55';
      }
      if (this.terminalCountdownFill) {
        this.terminalCountdownFill.style.width = '0%';
        this.terminalCountdownFill.style.backgroundColor = '#ff2a55';
      }
      if (this.terminalFeedback && !this.terminalFeedback.textContent.includes('EXPLODED')) {
        this.terminalFeedback.textContent = `CRITICAL OVERHEAT: ${targetRack.id} EXPLODED! NODE COMPROMISED`;
        this.terminalFeedback.style.color = '#ff2a55';
      }
    } else if (targetRack && targetRack.isFailing) {
      if (targetRack.isShutdown) {
        if (this.terminalCountdownVal) {
          this.terminalCountdownVal.textContent = '🛑 BREAKER OFF [TIMER PAUSED]';
          this.terminalCountdownVal.style.color = '#00f3ff';
        }
        if (this.terminalCountdownFill) {
          this.terminalCountdownFill.style.width = '100%';
          this.terminalCountdownFill.style.backgroundColor = '#00f3ff';
        }
      } else {
        const maxTime = (targetRack.error?.type === CONFIG.ERRORS.CHAIN_WIRES) ? (CONFIG.ERRORS.CHAIN_WIRES_TIME ?? 90.0) :
                        (targetRack.error?.type === CONFIG.ERRORS.SERVER_BUG) ? (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0) :
                        (targetRack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS ? 60.0 : (CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 45.0));
        const timeLeft = (targetRack.error?.type === CONFIG.ERRORS.SERVER_BUG && typeof targetRack.error?.bugTimer === 'number') ?
                         Math.max(0, targetRack.error.bugTimer) :
                         Math.max(0, maxTime - targetRack.failDuration);
        const pct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

        if (this.terminalCountdownVal) {
          let statusTag = 'OVERHEATING';
          let color = '#00f3ff';
          if (timeLeft <= 8.0) {
            statusTag = 'CASCADE IMMINENT!';
            color = '#ff2a55';
          } else if (timeLeft <= 16.0) {
            statusTag = 'WARNING';
            color = '#ffaa00';
          }
          this.terminalCountdownVal.textContent = `${timeLeft.toFixed(1)}s [${statusTag}]`;
          this.terminalCountdownVal.style.color = color;
        }

        if (this.terminalCountdownFill) {
          this.terminalCountdownFill.style.width = `${pct}%`;
          this.terminalCountdownFill.style.backgroundColor = (timeLeft <= 8.0) ? '#ff2a55' : (timeLeft <= 16.0 ? '#ffaa00' : '#00f3ff');
        }
      }
    } else {
      if (this.terminalCountdownVal) {
        this.terminalCountdownVal.textContent = 'NO ACTIVE LOCKOUT';
        this.terminalCountdownVal.style.color = '#00ff9d';
      }
      if (this.terminalCountdownFill) {
        this.terminalCountdownFill.style.width = '100%';
        this.terminalCountdownFill.style.backgroundColor = '#00ff9d';
      }
    }
  }

  // ==========================================================================
  // Render Pipeline
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    const cam = this.camera;

    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // 1. Raised Floor Grid
    this.renderFloorGrid(ctx, cam);

    // 2. Connected Patch Cables
    for (const cable of this.connectedCables) {
      cable.render(ctx, cam);
    }

    // 2.5 Quantum Teleporter Connecting Link & Floor Pads
    this.renderTeleporterLink(ctx, cam);
    const isLinked = this.teleporterNodes.length === 2;
    const cooldownRatio = this.teleportCooldown / (CONFIG.TELEPORTER?.COOLDOWN ?? 1.2);
    for (const node of this.teleporterNodes) {
      if (cam.isBoundingBoxVisible(node.x - 50, node.y - 50, 100, 100)) {
        node.render(ctx, cam, isLinked, cooldownRatio);
      }
    }

    // 2.6 Defcon Mission Floor Conduits & Navigational Beacons
    this.renderDefconMissionGuides(ctx, cam);

    // 3. Active Dragged Cable
    if (this.activeCable) {
      this.activeCable.render(ctx, cam);
    }

    // 4. Server Racks (Frustum Culled)
    const offscreenAlerts = [];
    const nearRack = this.getNearestRack();

    for (const rack of this.racks) {
      const isVisible = cam.isBoundingBoxVisible(rack.x, rack.y, rack.width, rack.height);

      if (isVisible) {
        this.renderRack(ctx, cam, rack, rack === nearRack);
      } else if (rack.isFailing && !rack.isDestroyed) {
        offscreenAlerts.push(rack);
      }
    }

    // 5. Bottom Stations
    if (cam.isBoundingBoxVisible(this.nocDesk.x, this.nocDesk.y, this.nocDesk.width, this.nocDesk.height)) {
      this.nocDesk.render(ctx, cam);
    }
    if (cam.isBoundingBoxVisible(this.shopKiosk.x, this.shopKiosk.y, this.shopKiosk.width, this.shopKiosk.height)) {
      this.shopKiosk.render(ctx, cam);
    }
    if (this.suppliesCloset && cam.isBoundingBoxVisible(this.suppliesCloset.x, this.suppliesCloset.y, this.suppliesCloset.width, this.suppliesCloset.height)) {
      this.suppliesCloset.render(ctx, cam);
    }
    if (this.portableTerminal && cam.isBoundingBoxVisible(this.portableTerminal.x, this.portableTerminal.y, this.portableTerminal.width, this.portableTerminal.height)) {
      this.portableTerminal.render(ctx, cam);
    }

    // 6. Particle Sparks & Explosions
    this.particles.render(ctx, cam, this.isOptimizedMode);

    // Active Boss (Corrupted Bug, Thermal Golem, Spectral Daemon, Titan Colossus, or Procedural Apex)
    const activeBoss = this.activeBoss || this.bugBoss;
    if (activeBoss && activeBoss.isAlive) {
      activeBoss.render(ctx, cam);
    }

    // Small Rogue Bugs
    for (const bug of this.smallBugs) {
      if (cam.isBoundingBoxVisible(bug.x - 30, bug.y - 30, 60, 60)) {
        bug.render(ctx, cam);
      }
    }

    // Autonomous Patch Drone
    if (this.patchDrone) {
      this.patchDrone.render(ctx, cam);
    }

    if (this.gameState === 'MENU') {
      this.renderWorldBounds(ctx, cam);
      return;
    }

    // 7. Player & Motion Trail
    this.renderPlayer(ctx, cam);

    // 8. World Perimeter Walls
    this.renderWorldBounds(ctx, cam);

    // 9. Directional Alerts (Alarms, Cable Target Beacon, South NOC Desk Beacon, Destroyed Beacons)
    this.renderOffscreenAlerts(ctx, cam, offscreenAlerts);

    // 10. In-World Interactive Prompts
    const nearTeleNode = this.getNearTeleporterNode();
    const isNearHost = this.bossHostRack && activeBoss && activeBoss.isAlive && this.getDistanceToRack(this.bossHostRack) <= 120;
    const isNearPortableTerminal = this.portableTerminal && this.portableTerminal.isNear(this.player.x, this.player.y);
    const dNOCPrompt = this.isNearNOCDesk() ? this.getDistanceToNOCDesk() : Infinity;
    const dClosetPrompt = this.isNearSuppliesCloset() ? this.getDistanceToSuppliesCloset() : Infinity;
    const dShopPrompt = this.isNearShopKiosk() ? this.getDistanceToShopKiosk() : Infinity;
    const minSouthPromptDist = Math.min(dNOCPrompt, dClosetPrompt, dShopPrompt);

    if (isNearPortableTerminal) {
      this.renderPortableTerminalPrompt(ctx, cam);
    } else if (isNearHost) {
      this.renderRackInteractionPrompt(ctx, cam, this.bossHostRack);
    } else if (nearRack) {
      this.renderRackInteractionPrompt(ctx, cam, nearRack);
    } else if (minSouthPromptDist < Infinity) {
      if (minSouthPromptDist === dNOCPrompt) {
        this.renderNOCDeskPrompt(ctx, cam);
      } else if (minSouthPromptDist === dShopPrompt) {
        this.renderShopKioskPrompt(ctx, cam);
      } else {
        this.renderSuppliesClosetPrompt(ctx, cam);
      }
    } else if (nearTeleNode) {
      this.renderTeleporterPrompt(ctx, cam, nearTeleNode);
    }

    // 10.5 Defcon HUD Waypoint Compass Ribbon
    this.renderDefconHUDNavigator(ctx, cam);

    // 11. Kinetic Cannon Slingshot Aiming Overlay (Bullet-Time Freeze)
    if (this.isCannonAiming) {
      this.renderCannonAimingUI(ctx, cam);
    }
  }

  renderDefconMissionGuides(ctx, cam) {
    const activeBoss = this.activeBoss || this.bugBoss;
    if (!activeBoss || !activeBoss.isAlive) return;

    const time = performance.now() * 0.001;
    const playerScreen = cam.toScreen(this.player.x, this.player.y);

    // 1. If player has the Restraint Rope in hand, draw animated guide line to Bug Boss!
    if (this.activeCable instanceof RestraintRope) {
      const bossScreen = cam.toScreen(activeBoss.x, activeBoss.y);
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -time * 50;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(playerScreen.x, playerScreen.y);
      ctx.lineTo(bossScreen.x, bossScreen.y);
      ctx.stroke();

      // Pulsing floor halo around boss
      const haloRadius = activeBoss.radius + 20 + Math.sin(time * 5) * 8;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.arc(bossScreen.x, bossScreen.y, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillText(`👾 CIRCLE BUG BOSS TO COIL ROPE [${activeBoss.completedWraps}/${activeBoss.maxWraps}]`, bossScreen.x, bossScreen.y - haloRadius - 6);
      ctx.restore();
    }

    // 2. Mission Guide Line & Pulsing Floor Pad to South Supplies Closet (Only source for rope & gear!)
    if (this.suppliesCloset) {
      const closetCenterX = this.suppliesCloset.x + this.suppliesCloset.width / 2;
      const closetCenterY = this.suppliesCloset.y + this.suppliesCloset.height / 2;
      const closetScreen = cam.toScreen(closetCenterX, closetCenterY);

      let needsGear = false;
      let gearName = 'DEFCON SUPPLIES';
      let gearColor = '#38bdf8';
      if (activeBoss instanceof BugBoss && !(this.activeCable instanceof RestraintRope)) {
        needsGear = true;
        gearName = 'HEAVY ROPE';
        gearColor = '#f59e0b';
      } else if (activeBoss instanceof ThermalGolemBoss && !this.hasCryoCanister) {
        needsGear = true;
        gearName = 'CRYO CANISTER';
        gearColor = '#00f3ff';
      } else if (!(this.activeCable instanceof ContainmentWire)) {
        needsGear = true;
        gearName = activeBoss.restraintName || 'GEAR';
        gearColor = activeBoss.restraintColor || '#00ff9d';
      }

      if (needsGear) {
        ctx.save();
        // Cyan/Amber neon conduit line to Supplies Closet
        ctx.strokeStyle = gearColor;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([16, 10]);
        ctx.lineDashOffset = -time * 55;
        ctx.shadowColor = gearColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(playerScreen.x, playerScreen.y);
        ctx.lineTo(closetScreen.x, closetScreen.y);
        ctx.stroke();

        // Pulsing floor pad halo around Supplies Closet
        const haloR = 90 + Math.sin(time * 4) * 10;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.beginPath();
        ctx.arc(closetScreen.x, closetScreen.y, haloR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gearColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();

        // Vertical sky-beam marker
        const grad = ctx.createLinearGradient(closetScreen.x, closetScreen.y - 140, closetScreen.x, closetScreen.y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(closetScreen.x - 35, closetScreen.y - 140, 70, 140);

        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = gearColor;
        ctx.shadowBlur = 8;
        ctx.fillText(`📦 SOUTH SUPPLIES CLOSET [${gearName}]`, closetScreen.x, closetScreen.y - 148);
        ctx.restore();
      }
    }
  }

  renderDefconHUDNavigator(ctx, cam) {
    const activeBoss = this.activeBoss || this.bugBoss;
    if (!activeBoss || !activeBoss.isAlive) return;

    // Show persistent HUD navigation tracker at bottom-center of screen
    const items = [];
    if (this.activeCable instanceof RestraintRope) {
      const d = Math.hypot(this.player.x - activeBoss.x, this.player.y - activeBoss.y);
      const dy = activeBoss.y - this.player.y;
      const dx = activeBoss.x - this.player.x;
      const arrow = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? '▼' : '▲') : (dx > 0 ? '▶' : '◀');
      items.push({ text: `👾 BUG BOSS [${arrow} ${Math.round(d / 32)}m] (WRAP COILS)`, color: '#f59e0b' });
    } else if (this.suppliesCloset) {
      let needsGear = (activeBoss instanceof BugBoss && !(this.activeCable instanceof RestraintRope)) ||
                      (activeBoss instanceof ThermalGolemBoss && !this.hasCryoCanister) ||
                      (!(this.activeCable instanceof ContainmentWire));
      if (needsGear) {
        const closetCenterX = this.suppliesCloset.x + this.suppliesCloset.width / 2;
        const closetCenterY = this.suppliesCloset.y + this.suppliesCloset.height / 2;
        const d = Math.hypot(this.player.x - closetCenterX, this.player.y - closetCenterY);
        const dy = closetCenterY - this.player.y;
        const dx = closetCenterX - this.player.x;
        const arrow = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? '▼' : '▲') : (dx > 0 ? '▶' : '◀');
        items.push({ text: `📦 SOUTH SUPPLIES CLOSET [${arrow} ${Math.round(d / 32)}m] (HEAVY ROPE)`, color: '#38bdf8' });
      }
    }

    if (items.length === 0) return;

    ctx.save();
    const hudY = this.viewportHeight - 50;
    const centerX = this.viewportWidth / 2;
    const bannerText = items.map(i => i.text).join('   |   ');

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(bannerText).width;
    const boxW = textWidth + 36;
    const boxH = 26;

    ctx.fillStyle = 'rgba(6, 8, 14, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, hudY - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(bannerText, centerX, hudY);
    ctx.restore();
  }

  renderFloorGrid(ctx, cam) {
    if (!this.floorPattern) {
      this.floorPattern = this.createFloorPattern();
    }

    if (this.floorPattern) {
      const patternSize = CONFIG.WORLD.TILE_SIZE * 2; // 128
      const left = cam.x - cam.viewportWidth / 2;
      const top = cam.y - cam.viewportHeight / 2;
      const offsetX = -((left % patternSize) + patternSize) % patternSize;
      const offsetY = -((top % patternSize) + patternSize) % patternSize;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = this.floorPattern;
      ctx.fillRect(-patternSize, -patternSize, this.viewportWidth + patternSize * 2, this.viewportHeight + patternSize * 2);
      ctx.restore();
    } else {
      const tileSize = CONFIG.WORLD.TILE_SIZE;
      const startCol = Math.max(0, Math.floor((cam.x - cam.viewportWidth / 2) / tileSize));
      const endCol = Math.min(CONFIG.WORLD.WIDTH / tileSize, Math.ceil((cam.x + cam.viewportWidth / 2) / tileSize));
      const startRow = Math.max(0, Math.floor((cam.y - cam.viewportHeight / 2) / tileSize));
      const endRow = Math.min(CONFIG.WORLD.HEIGHT / tileSize, Math.ceil((cam.y + cam.viewportHeight / 2) / tileSize));

      for (let c = startCol; c < endCol; c++) {
        for (let r = startRow; r < endRow; r++) {
          const worldX = c * tileSize;
          const worldY = r * tileSize;
          const screenPos = cam.toScreen(worldX, worldY);

          ctx.fillStyle = (c + r) % 2 === 0 ? CONFIG.COLORS.BG_TILE_LIGHT : CONFIG.COLORS.BG_TILE_DARK;
          ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);

          ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
          ctx.lineWidth = 1;
          ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);
        }
      }
    }
  }

  renderRack(ctx, cam, rack, isNearest) {
    const pos = cam.toScreen(rack.x, rack.y);
    let isTarget = false;
    if (this.activeCable) {
      if (this.activeCable instanceof MultiHopCable) {
        isTarget = this.activeCable.getCurrentTargetRack()?.id === rack.id;
      } else {
        isTarget = this.activeCable.targetRack?.id === rack.id;
      }
    }

    const isAuthError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT;
    const isChainError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.MULTI_CABLE_CHAIN;
    const isRebootError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.HARD_REBOOT;
    const isCoolantError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.COOLANT_LEAK;
    const isGlitchError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH;
    const isWormError = rack.isFailing && rack.error?.type === CONFIG.ERRORS.NETWORK_WORM;
    const isDecoy = Boolean(rack.isDecoy);

    // Exploded / Destroyed Server Rack Visuals
    if (rack.isDestroyed) {
      // Scorched Shadow & Charred Body
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(pos.x + 4, pos.y + 4, rack.width, rack.height);

      ctx.fillStyle = '#160808';
      ctx.fillRect(pos.x, pos.y, rack.width, rack.height);
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, rack.width, rack.height);

      // Cracked charred interior units
      const unitHeight = 14;
      for (let uY = pos.y + 6; uY < pos.y + rack.height - 6; uY += unitHeight) {
        ctx.fillStyle = '#0a0303';
        ctx.fillRect(pos.x + 4, uY, rack.width - 8, unitHeight - 2);

        // Dead red socket
        ctx.fillStyle = '#260404';
        ctx.fillRect(pos.x + 8, uY + 4, 4, 4);
      }

      // Crossed hazard indicator
      ctx.strokeStyle = '#ff2a55';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pos.x + 8, pos.y + 8);
      ctx.lineTo(pos.x + rack.width - 8, pos.y + rack.height - 8);
      ctx.moveTo(pos.x + rack.width - 8, pos.y + 8);
      ctx.lineTo(pos.x + 8, pos.y + rack.height - 8);
      ctx.stroke();

      // Label
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff2a55';
      ctx.textAlign = 'center';
      ctx.fillText(`${rack.id} 💥`, pos.x + rack.width / 2, pos.y - 4);
      return;
    }

    // Normal or Failing Server Rack Visuals (Targets only glow green when holding active cable)
    const activeBoss = this.activeBoss || this.bugBoss;
    const isBossHost = (rack.isBossHost || rack === this.bossHostRack) && activeBoss?.isAlive;
    if (isBossHost) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x + rack.width / 2, pos.y + rack.height / 2, rack.height * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = activeBoss.restraintColor || 'rgba(0, 255, 157, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    } else if (isTarget) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x + rack.width / 2, pos.y + rack.height / 2, rack.height * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // Ice Slick Puddle under Coolant Leak Racks
    if (isCoolantError) {
      ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
      ctx.fillRect(pos.x - 6, pos.y + rack.height - 4, rack.width + 12, 14);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(pos.x + 4, pos.y + 4, rack.width, rack.height);

    ctx.fillStyle = isDecoy ? '#180e29' : CONFIG.COLORS.RACK_OK;
    ctx.fillRect(pos.x, pos.y, rack.width, rack.height);

    if (isBossHost) {
      ctx.strokeStyle = activeBoss.restraintColor || '#00ff9d';
      ctx.lineWidth = 2.5;
    } else if (isTarget) {
      ctx.strokeStyle = CONFIG.COLORS.TARGET_BEACON;
      ctx.lineWidth = 2.5;
    } else if (isAuthError) {
      ctx.strokeStyle = CONFIG.COLORS.CONSOLE_AMBER;
      ctx.lineWidth = 2;
    } else if (isChainError) {
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
    } else if (isRebootError || isCoolantError) {
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
    } else if (isGlitchError || isDecoy) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
    } else if (isWormError) {
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;
    } else if (rack.isFailing) {
      ctx.strokeStyle = CONFIG.COLORS.RACK_LED_RED;
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = isNearest ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.RACK_OK_BORDER;
      ctx.lineWidth = 1;
    }
    ctx.strokeRect(pos.x, pos.y, rack.width, rack.height);

    const unitHeight = 14;
    for (let uY = pos.y + 6; uY < pos.y + rack.height - 6; uY += unitHeight) {
      ctx.fillStyle = isDecoy ? '#261238' : '#0f172a';
      ctx.fillRect(pos.x + 4, uY, rack.width - 8, unitHeight - 2);

      let ledColor = CONFIG.COLORS.RACK_LED_GREEN;
      if (rack.isFailing) {
        if (isAuthError) {
          ledColor = (Math.floor(rack.alertTimer * 5) % 2 === 0) ? CONFIG.COLORS.CONSOLE_AMBER : '#523803';
        } else if (isChainError) {
          ledColor = (Math.floor(rack.alertTimer * 5) % 2 === 0) ? '#e879f9' : '#4a044e';
        } else if (isRebootError || isCoolantError) {
          ledColor = (Math.floor(rack.alertTimer * 6) % 2 === 0) ? '#00f3ff' : '#083344';
        } else if (isGlitchError) {
          ledColor = (Math.floor(rack.alertTimer * 6) % 2 === 0) ? '#c084fc' : '#3b0764';
        } else if (isWormError) {
          ledColor = (Math.floor(rack.alertTimer * 6) % 2 === 0) ? '#ff0055' : '#4a044e';
        } else {
          ledColor = (Math.floor(rack.alertTimer * 6) % 2 === 0) ? CONFIG.COLORS.RACK_LED_RED : '#550e1d';
        }
      } else if (isDecoy) {
        ledColor = (Math.floor(this.incidentTimer * 5) % 2 === 0) ? '#c084fc' : '#2e1065';
      } else if (isTarget) {
        ledColor = (Math.floor(this.incidentTimer * 6) % 2 === 0) ? '#00ff9d' : '#044e2e';
      }

      ctx.fillStyle = ledColor;
      ctx.fillRect(pos.x + 8, uY + 4, 4, 4);

      ctx.fillStyle = isTarget ? '#00ff9d' : (isDecoy ? '#c084fc' : '#38bdf8');
      ctx.fillRect(pos.x + rack.width - 16, uY + 4, 3, 3);
      ctx.fillRect(pos.x + rack.width - 10, uY + 4, 3, 3);
    }

    // 45s (or 60s Gold NetOps / 90s Chain / 30s Bug) Overheat Countdown Bar (if failing)
    if (rack.isFailing) {
      const isGoldNetOps = Boolean(this.activeSynergies?.netops >= 3);
      let maxTime = (CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 45.0) + (isGoldNetOps ? 15.0 : 0);
      if (rack.error?.type === CONFIG.ERRORS.CHAIN_WIRES) {
        maxTime = (CONFIG.ERRORS.CHAIN_WIRES_TIME ?? 90.0) + (isGoldNetOps ? 15.0 : 0);
      } else if (rack.error?.type === CONFIG.ERRORS.SERVER_BUG) {
        maxTime = (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0);
      }
      const progress = (rack.error?.type === CONFIG.ERRORS.SERVER_BUG && typeof rack.error?.bugTimer === 'number')
        ? Math.min(1.0, Math.max(0, 1 - rack.error.bugTimer / maxTime))
        : Math.min(1.0, rack.failDuration / maxTime);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(pos.x + 4, pos.y + rack.height - 8, rack.width - 8, 4);
      let barColor = '#ffaa00';
      if (progress > 0.7) barColor = '#ff2a55';
      else if (isChainError) barColor = '#e879f9';
      else if (isRebootError || isCoolantError) barColor = '#00f3ff';
      else if (isGlitchError) barColor = '#c084fc';
      else if (isWormError) barColor = '#ff0055';
      ctx.fillStyle = barColor;
      ctx.fillRect(pos.x + 4, pos.y + rack.height - 8, (rack.width - 8) * (1 - progress), 4);
    }

    // Hold-to-Reboot Live Recharge Meter
    if (this.rebootingRack === rack && this.rebootHoldTime > 0) {
      const req = (this.activeSynergies?.netops >= 2) ? 3.0 : (CONFIG.ERRORS.REBOOT_HOLD_TIME ?? 5.0);
      const p = Math.min(1.0, this.rebootHoldTime / req);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(pos.x - 4, pos.y - 18, (rack.width + 8) * p, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
    }

    // Coolant Valve Sealing Live Meter
    if (this.coolingRack === rack && (this.coolantHoldTime || 0) > 0) {
      const p = Math.min(1.0, this.coolantHoldTime / 3.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(pos.x - 4, pos.y - 18, (rack.width + 8) * p, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
    }

    // Network Worm Purging Live Meter
    if (this.wormRack === rack && (this.wormHoldTime || 0) > 0) {
      const p = Math.min(1.0, this.wormHoldTime / 2.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(pos.x - 4, pos.y - 18, (rack.width + 8) * p, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
    }

    // Bug Shake Out Live Meter
    if (this.shakingRack === rack && (this.shakeHoldTime || 0) > 0) {
      const p = Math.min(1.0, this.shakeHoldTime / 1.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(pos.x - 4, pos.y - 18, (rack.width + 8) * p, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
    }

    // Virus Disinfect Live Meter
    if (this.disinfectingRack === rack && (this.disinfectHoldTime || 0) > 0) {
      const p = Math.min(1.0, this.disinfectHoldTime / 2.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(pos.x - 4, pos.y - 18, (rack.width + 8) * p, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 4, pos.y - 18, rack.width + 8, 8);
    }

    // Rack ID & Countdown Timer label
    ctx.font = '600 9px "JetBrains Mono", monospace';
    if (rack.isFailing) {
      if (rack.isShutdown) {
        ctx.fillStyle = '#00f3ff';
        ctx.textAlign = 'center';
        let actTag = 'OFFLINE';
        if (rack.error?.type === CONFIG.ERRORS.RESTART_REQUIRED) actTag = 'REBOOT [E]';
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_BUG) actTag = 'SHAKE [E]';
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT) actTag = 'COOLING';
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS) actTag = 'DISINFECT [E]';
        ctx.fillText(`${rack.id} [${actTag}]`, pos.x + rack.width / 2, pos.y - 4);
      } else {
        const isGoldNetOps = Boolean(this.activeSynergies?.netops >= 3);
        const maxFailTime = (rack.error?.type === CONFIG.ERRORS.CHAIN_WIRES ? (CONFIG.ERRORS.CHAIN_WIRES_TIME ?? 90.0) :
                            (rack.error?.type === CONFIG.ERRORS.SERVER_BUG ? (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0) :
                            (rack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS ? (CONFIG.ERRORS.SMALL_VIRUS_TIME ?? 60.0) :
                            ((CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 45.0) + (isGoldNetOps ? 15 : 0)))));
        const timeLeft = (rack.error?.type === CONFIG.ERRORS.SERVER_BUG && typeof rack.error?.bugTimer === 'number')
          ? Math.max(0, Math.ceil(rack.error.bugTimer))
          : Math.max(0, Math.ceil(maxFailTime - rack.failDuration));
        let lblColor = '#ff2a55';
        let tag = '';
        if (isChainError) { lblColor = '#e879f9'; tag = ' BUS'; }
        else if (isRebootError) { lblColor = '#00f3ff'; tag = ' REBOOT'; }
        else if (isCoolantError) { lblColor = '#00f3ff'; tag = ' CRYO'; }
        else if (isGlitchError) { lblColor = '#c084fc'; tag = ' GLITCH'; }
        else if (isWormError) { lblColor = '#ff0055'; tag = ' WORM'; }
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_BUG) { lblColor = '#ffaa00'; tag = ' BUG'; }
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_OVERHEAT) { lblColor = '#ff5500'; tag = ' FIRE'; }
        else if (rack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS) { lblColor = '#10b981'; tag = ' VIRUS'; }
        ctx.fillStyle = lblColor;
        ctx.textAlign = 'center';
        ctx.fillText(`${rack.id} [${timeLeft}s!${tag}]`, pos.x + rack.width / 2, pos.y - 4);
      }
    } else if (isDecoy) {
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText(`${rack.id} [DECOY]`, pos.x + rack.width / 2, pos.y - 4);
    } else {
      ctx.fillStyle = isTarget ? '#00ff9d' : '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(rack.id, pos.x + rack.width / 2, pos.y - 4);
    }
  }

  renderRackInteractionPrompt(ctx, cam, rack) {
    let label = null;
    let badgeColor = CONFIG.COLORS.PLAYER;

    // Boss host rack containment wire prompt
    const activeBoss = this.activeBoss || this.bugBoss;
    if (activeBoss && activeBoss.isAlive && (rack.isBossHost || rack === this.bossHostRack) && !this.activeCable) {
      if (activeBoss instanceof BugBoss) {
        label = `⚠️ EMERGENCE POINT ➔ GET ROPE AT SUPPLIES CLOSET`;
        badgeColor = '#f59e0b';
      } else if (activeBoss instanceof ThermalGolemBoss) {
        label = `⚠️ EMERGENCE POINT ➔ GET CRYO AT SUPPLIES CLOSET`;
        badgeColor = '#00f3ff';
      } else {
        label = `[E] GRAB ${activeBoss.restraintName?.toUpperCase() || 'CONTAINMENT WIRE'}`;
        badgeColor = activeBoss.restraintColor || '#00ff9d';
      }
    } else if (rack.isDestroyed) {
      const cost = CONFIG.ERRORS.REPLACEMENT_COST ?? 1000;
      if (this.credits >= cost) {
        label = `[E] INSTALL REPLACEMENT CHASSIS (${cost} ⚡)`;
        badgeColor = '#00ff9d';
      } else {
        label = `💥 DESTROYED (NEED ${cost} ⚡ TO REPLACE)`;
        badgeColor = '#ff2a55';
      }
    } else if (this.activeCable) {
      if (this.activeCable instanceof MultiHopCable) {
        const target = this.activeCable.getCurrentTargetRack();
        if (target && target.id === rack.id) {
          label = `[E] PLUG IN HOP (${this.activeCable.currentHopIndex}/${this.activeCable.hops.length - 1})`;
          badgeColor = '#00ff9d';
        } else if (rack.id === this.activeCable.sourceRack.id) {
          label = `[E] CANCEL BUS CHAIN`;
          badgeColor = '#8899ac';
        }
      } else {
        const isContainmentWire = activeBoss?.isAlive && (this.activeCable instanceof ContainmentWire);
        if (isContainmentWire) {
          if (rack.id === this.activeCable.sourceRack?.id) {
            label = `[E] DROP / REEL IN ${activeBoss.restraintName?.toUpperCase() || 'ROPE'}`;
            badgeColor = '#8899ac';
          } else {
            label = `WRAP ${activeBoss.restraintName?.toUpperCase() || 'ROPE'} AROUND ${activeBoss.name?.toUpperCase() || 'BOSS'}!`;
            badgeColor = activeBoss.restraintColor || '#f59e0b';
          }
        } else {
          const isTarget = this.activeCable.targetRack?.id === rack.id;
          if (isTarget) {
            label = `[E] PLUG IN CABLE`;
            badgeColor = '#00ff9d';
          } else if (rack.id === this.activeCable.sourceRack.id) {
            label = `[E] CANCEL / REEL IN`;
            badgeColor = '#8899ac';
          }
        }
      }
    } else if (rack.isFailing) {
      const isGoldNetOps = Boolean(this.activeSynergies?.netops >= 3);
      const maxFailTime = (rack.error?.type === CONFIG.ERRORS.CHAIN_WIRES ? (CONFIG.ERRORS.CHAIN_WIRES_TIME ?? 90.0) :
                          (rack.error?.type === CONFIG.ERRORS.SERVER_BUG ? (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0) :
                          (rack.error?.type === CONFIG.ERRORS.SERVER_SMALL_VIRUS ? (CONFIG.ERRORS.SMALL_VIRUS_TIME ?? 60.0) :
                          ((CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 45.0) + (isGoldNetOps ? 15 : 0)))));
      const timeLeft = (rack.error?.type === CONFIG.ERRORS.SERVER_BUG && typeof rack.error?.bugTimer === 'number')
        ? Math.max(0, Math.ceil(rack.error.bugTimer))
        : Math.max(0, Math.ceil(maxFailTime - rack.failDuration));
      const errType = rack.error?.type;

      if (errType === CONFIG.ERRORS.RUN_WIRE || errType === CONFIG.ERRORS.CABLE_DISCONNECT) {
        const partner = rack.error?.partnerRack || rack.error?.targetRack;
        label = `[E] GRAB CABLE [${timeLeft}s!] ➔ ${partner?.id || 'PARTNER NODE'}`;
        badgeColor = '#ff8800';
      } else if (errType === CONFIG.ERRORS.CHAIN_WIRES || errType === CONFIG.ERRORS.MULTI_CABLE_CHAIN) {
        const chainCount = rack.error?.hops ? rack.error.hops.length : 3;
        label = `[E] GRAB CHAIN CABLE [${timeLeft}s!] ➔ ${chainCount} SERVERS`;
        badgeColor = '#e879f9';
      } else if (errType === CONFIG.ERRORS.RESTART_REQUIRED || errType === CONFIG.ERRORS.HARD_REBOOT) {
        const req = (this.activeSynergies?.netops >= 2) ? 3.0 : (CONFIG.ERRORS.REBOOT_HOLD_TIME ?? 5.0);
        if (rack.isShutdown) {
          if (this.rebootingRack === rack && this.rebootHoldTime > 0) {
            const prog = Math.min(req, this.rebootHoldTime).toFixed(1);
            label = `⚡ REBOOTING: ${prog}s / ${req.toFixed(1)}s (HOLD [E])`;
            badgeColor = '#00f3ff';
          } else {
            label = `⚡ HOLD [E] TO TURN ON (${req.toFixed(1)}s)`;
            badgeColor = '#00f3ff';
          }
        } else {
          if (!rack.error?.hasBeenInspected) {
            label = `[E] SCAN PIN [${rack.code}] ➔ TYPE AT TERMINAL [${timeLeft}s!]`;
            badgeColor = '#ff2a55';
          } else {
            label = `PIN: ${rack.code} ➔ TYPE AT TERMINAL TO SHUT DOWN [${timeLeft}s!]`;
            badgeColor = '#00f3ff';
          }
        }
      } else if (errType === CONFIG.ERRORS.SERVER_BUG) {
        if (rack.isShutdown) {
          if (this.shakingRack === rack && (this.shakeHoldTime || 0) > 0) {
            const prog = Math.min(1.5, this.shakeHoldTime).toFixed(1);
            label = `🐛 EXTRACTING BUG: ${prog}s / 1.5s (HOLD [E])`;
            badgeColor = '#ffaa00';
          } else {
            label = `🐛 HOLD [E] TO TAKE BUG OUT (1.5s)`;
            badgeColor = '#ffaa00';
          }
        } else {
          const bugSecs = Math.max(0, Math.ceil(rack.error?.bugTimer ?? (CONFIG.ERRORS.BUG_RACK_EXPLODE_TIME ?? 30.0)));
          if (!rack.error?.hasBeenInspected) {
            label = `[E] SCAN PIN [${rack.code}] ➔ TYPE AT TERMINAL [${bugSecs}s!]`;
            badgeColor = '#ff2a55';
          } else {
            label = `PIN: ${rack.code} ➔ TYPE AT TERMINAL TO TRAP BUG [${bugSecs}s!]`;
            badgeColor = '#ffaa00';
          }
        }
      } else if (errType === CONFIG.ERRORS.SERVER_OVERHEAT) {
        if (rack.isShutdown) {
          label = `❄️ OFFLINE // RESTORING COOLANT RESERVES...`;
          badgeColor = '#00f3ff';
        } else {
          label = `🔥 ${rack.id} ON FIRE // SENSORS OVERHEATED [CANNOT SCAN] (${timeLeft}s!)`;
          badgeColor = '#ff3b30';
        }
      } else if (errType === CONFIG.ERRORS.SERVER_SMALL_VIRUS) {
        if (rack.isShutdown) {
          if (this.disinfectingRack === rack && (this.disinfectHoldTime || 0) > 0) {
            const prog = Math.min(2.5, this.disinfectHoldTime).toFixed(1);
            label = `🧪 DISINFECTING: ${prog}s / 2.5s (HOLD [E])`;
            badgeColor = '#10b981';
          } else {
            label = `🧪 HOLD [E] TO DISINFECT NODE (2.5s)`;
            badgeColor = '#10b981';
          }
        } else {
          if (!rack.error?.hasBeenInspected) {
            label = `[E] SCAN PIN [${rack.code}] ➔ TYPE AT TERMINAL [${timeLeft}s!]`;
            badgeColor = '#ff2a55';
          } else {
            label = `PIN: ${rack.code} ➔ TYPE AT TERMINAL TO SHUT DOWN [${timeLeft}s!]`;
            badgeColor = '#10b981';
          }
        }
      } else if (errType === CONFIG.ERRORS.ACCESS_DENIED || errType === CONFIG.ERRORS.AUTH_LOCKOUT || errType === CONFIG.ERRORS.PHANTOM_GLITCH) {
        if (!rack.error?.hasBeenInspected) {
          label = `[E] SCAN PIN [${rack.code}] (${timeLeft}s!)`;
          badgeColor = '#ffb800';
        } else {
          label = `PIN: ${rack.code} ➔ ENTER AT NOC DESK (${timeLeft}s!)`;
          badgeColor = '#00ff9d';
        }
      }
    } else if (rack.isDecoy) {
      label = `⚠️ HOLOGRAM DECOY [${rack.decoyCode || 'ERR'}]`;
      badgeColor = '#c084fc';
    } else {
      label = `[E] SCAN PIN [${rack.code}]`;
      badgeColor = '#00f3ff';
    }

    if (!label) return;

    const pos = cam.toScreen(rack.x + rack.width / 2, rack.y - 14);

    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pad = 8;

    ctx.fillStyle = 'rgba(7, 10, 18, 0.92)';
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pos.x - textWidth / 2 - pad, pos.y - 14, textWidth + pad * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y);
    ctx.restore();
  }

  renderNOCDeskPrompt(ctx, cam) {
    const pos = cam.toScreen(this.nocDesk.x + this.nocDesk.width / 2, this.nocDesk.y - 14);
    const label = `[E] ACCESS NOC OVERRIDE TERMINAL`;

    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pad = 8;

    ctx.fillStyle = 'rgba(7, 10, 18, 0.9)';
    ctx.strokeStyle = CONFIG.COLORS.CONSOLE_CYAN;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pos.x - textWidth / 2 - pad, pos.y - 14, textWidth + pad * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CONFIG.COLORS.CONSOLE_CYAN;
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y);
    ctx.restore();
  }

  renderPortableTerminalPrompt(ctx, cam) {
    if (!this.portableTerminal) return;
    const pos = cam.toScreen(this.portableTerminal.x + this.portableTerminal.width / 2, this.portableTerminal.y - 14);
    const label = `[E] ACCESS FIELD NOC TERMINAL  |  [P] RELOCATE`;

    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pad = 8;

    ctx.fillStyle = 'rgba(6, 11, 19, 0.92)';
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 255, 157, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(pos.x - textWidth / 2 - pad, pos.y - 14, textWidth + pad * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00ff9d';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y);
    ctx.restore();
  }

  renderShopKioskPrompt(ctx, cam) {
    const pos = cam.toScreen(this.shopKiosk.x + this.shopKiosk.width / 2, this.shopKiosk.y - 14);
    const label = `[E] OPEN HARDWARE SHOP`;

    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pad = 8;

    ctx.fillStyle = 'rgba(7, 10, 18, 0.9)';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pos.x - textWidth / 2 - pad, pos.y - 14, textWidth + pad * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y);
    ctx.restore();
  }

  renderSuppliesClosetPrompt(ctx, cam) {
    if (!this.suppliesCloset) return;
    const pos = cam.toScreen(this.suppliesCloset.x + this.suppliesCloset.width / 2, this.suppliesCloset.y - 14);
    const boss = this.activeBoss || this.bugBoss;
    let label = '[E] OPEN SUPPLIES CLOSET';
    let badgeColor = '#38bdf8';

    if (boss && boss.isAlive) {
      if (boss instanceof BugBoss) {
        if (this.activeCable instanceof RestraintRope) {
          label = '[E] OPEN SUPPLIES CLOSET (ROPE EQUIPPED)';
          badgeColor = '#f59e0b';
        } else {
          label = '[E] RETRIEVE HEAVY ROPE';
          badgeColor = '#f59e0b';
        }
      } else if (boss instanceof ThermalGolemBoss) {
        label = this.hasCryoCanister ? '[E] OPEN SUPPLIES CLOSET' : '[E] RETRIEVE CRYO CANISTER';
        badgeColor = '#00f3ff';
      } else {
        label = `[E] RETRIEVE ${boss.restraintName?.toUpperCase() || 'DEFCON GEAR'}`;
        badgeColor = '#00ff9d';
      }
    }

    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pad = 8;

    ctx.fillStyle = 'rgba(7, 10, 18, 0.9)';
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pos.x - textWidth / 2 - pad, pos.y - 14, textWidth + pad * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y);
    ctx.restore();
  }

  renderPlayer(ctx, cam) {
    const p = this.player;
    const isPuck = this.cannonPuckTimer > 0;
    const isLowHealth = p.hp <= 25 && p.hp > 0;
    const pulseWarn = 0.65 + 0.35 * Math.sin(performance.now() * 0.016);

    for (let i = 0; i < p.trail.length; i++) {
      const pt = p.trail[i];
      const alpha = (i + 1) / p.trail.length;
      const screenPt = cam.toScreen(pt.x, pt.y);

      ctx.beginPath();
      ctx.arc(screenPt.x, screenPt.y, p.radius * (0.4 + alpha * (pt.isPuck ? 0.7 : 0.5)), 0, Math.PI * 2);
      let trailColor = isLowHealth
        ? `rgba(255, 42, 85, ${alpha * 0.45})`
        : `rgba(0, 243, 255, ${alpha * (pt.isPuck ? 0.65 : 0.25)})`;
      ctx.fillStyle = trailColor;
      ctx.fill();
    }

    const pos = cam.toScreen(p.x, p.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Invulnerability flashing effect when damaged
    if (p.invulnerableTimer > 0) {
      if (Math.floor(performance.now() / 90) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }
    }

    let playerAccent;
    let ringColor;

    if (isLowHealth) {
      playerAccent = `rgb(255, ${Math.floor(40 * pulseWarn)}, ${Math.floor(80 * pulseWarn)})`;
      ringColor = `rgba(255, 42, 85, ${pulseWarn * 0.95})`;
    } else if (isPuck) {
      playerAccent = '#ffffff';
      ringColor = '#00f3ff';
    } else if (this.activeCable) {
      playerAccent = '#ff8800';
      ringColor = '#ff8800';
    } else {
      playerAccent = CONFIG.COLORS.PLAYER;
      ringColor = 'rgba(0, 243, 255, 0.4)';
    }

    // Air-hockey puck cushion rings when in cannon puck mode
    if (isPuck) {
      const puckPulse = 1.0 + 0.12 * Math.sin(performance.now() * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, (p.radius + 10) * puckPulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = isLowHealth ? 2.8 : 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = isLowHealth ? `rgba(65, 8, 18, ${0.85 + 0.15 * pulseWarn})` : (isPuck ? '#08172c' : '#0f172a');
    ctx.fill();
    ctx.strokeStyle = playerAccent;
    ctx.lineWidth = isLowHealth ? 3.5 : 2.5;
    ctx.stroke();

    ctx.rotate(p.angle);
    ctx.fillStyle = playerAccent;
    ctx.beginPath();
    ctx.moveTo(p.radius - 2, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderWorldBounds(ctx, cam) {
    const topLeft = cam.toScreen(0, 0);
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 4;
    ctx.strokeRect(topLeft.x, topLeft.y, CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT);
  }

  renderOffscreenAlerts(ctx, cam, alertRacks) {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    const margin = 50;

    const drawIndicator = (targetX, targetY, color, labelText) => {
      const dx = targetX - cam.x;
      const dy = targetY - cam.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const minX = margin;
      const maxX = this.viewportWidth - margin;
      const minY = margin + 60;
      const maxY = this.viewportHeight - margin - 40;

      let edgeX = centerX;
      let edgeY = centerY;
      const slope = dy / (dx || 0.0001);

      if (dx > 0) {
        edgeX = maxX;
        edgeY = centerY + (maxX - centerX) * slope;
      } else {
        edgeX = minX;
        edgeY = centerY + (minX - centerX) * slope;
      }

      if (edgeY > maxY) {
        edgeY = maxY;
        edgeX = centerX + (maxY - centerY) / slope;
      } else if (edgeY < minY) {
        edgeY = minY;
        edgeX = centerX + (minY - centerY) / slope;
      }

      ctx.save();
      ctx.translate(edgeX, edgeY);

      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(`${labelText} (${Math.round(distance / 10)}m)`, edgeX, edgeY + 28);
    };

    // 1. Active Failing Racks (Destroyed racks are omitted to eliminate HUD radar clutter)
    for (const rack of alertRacks) {
      if (rack.isFailing && !rack.isDestroyed) {
        const isGoldNetOps = Boolean(this.activeSynergies?.netops >= 3);
        const maxFailTime = (CONFIG.ERRORS.CRITICAL_FAIL_TIME ?? 30) + (isGoldNetOps ? 15 : 0);
        const timeLeft = Math.max(0, Math.ceil(maxFailTime - rack.failDuration));
        let indicatorColor = CONFIG.COLORS.RACK_LED_RED;
        let suffix = 'CABLE';
        if (rack.error?.type === CONFIG.ERRORS.AUTH_LOCKOUT) {
          indicatorColor = CONFIG.COLORS.CONSOLE_AMBER;
          suffix = 'PIN';
        } else if (rack.error?.type === CONFIG.ERRORS.MULTI_CABLE_CHAIN) {
          indicatorColor = '#e879f9';
          suffix = 'CHAIN';
        } else if (rack.error?.type === CONFIG.ERRORS.HARD_REBOOT) {
          indicatorColor = '#00f3ff';
          suffix = 'REBOOT';
        } else if (rack.error?.type === CONFIG.ERRORS.COOLANT_LEAK) {
          indicatorColor = '#00f3ff';
          suffix = 'CRYO';
        } else if (rack.error?.type === CONFIG.ERRORS.PHANTOM_GLITCH) {
          indicatorColor = '#c084fc';
          suffix = 'GLITCH';
        } else if (rack.error?.type === CONFIG.ERRORS.NETWORK_WORM) {
          indicatorColor = '#ff0055';
          suffix = 'WORM';
        }

        drawIndicator(
          rack.x + rack.width / 2,
          rack.y + rack.height / 2,
          indicatorColor,
          `${rack.id} [${timeLeft}s!] ${suffix}`
        );
      }
    }

    // 2. Active Cable Destination Beacon
    if (this.activeCable) {
      let target = null;
      let beaconColor = CONFIG.COLORS.TARGET_BEACON;
      let label = 'TARGET';

      const activeBoss = this.activeBoss || this.bugBoss;
      const isContainmentWire = activeBoss?.isAlive && (this.activeCable instanceof ContainmentWire);

      if (isContainmentWire) {
        // Active containment wire is meant for the boss; section 4 points directly to the active boss!
        target = null;
      } else if (this.activeCable instanceof MultiHopCable) {
        target = this.activeCable.getCurrentTargetRack();
        beaconColor = CONFIG.COLORS.TARGET_BEACON; // Emerald green beacon!
        label = `CHAIN HOP (${this.activeCable.currentHopIndex}/${this.activeCable.hops.length - 1}): ${target?.id}`;
      } else {
        target = this.activeCable.targetRack;
        label = `TARGET: ${target?.id}`;
      }

      if (target && !cam.isBoundingBoxVisible(target.x, target.y, target.width, target.height)) {
        drawIndicator(
          target.x + target.width / 2,
          target.y + target.height / 2,
          beaconColor,
          label
        );
      }
    }

    // 3. South NOC Desk Beacon (shows once the player has acquired a PIN!)
    if (this.activeCodeMemo && !cam.isBoundingBoxVisible(this.nocDesk.x, this.nocDesk.y, this.nocDesk.width, this.nocDesk.height)) {
      drawIndicator(
        this.nocDesk.x + this.nocDesk.width / 2,
        this.nocDesk.y + this.nocDesk.height / 2,
        CONFIG.COLORS.CONSOLE_CYAN,
        'NOC DESK'
      );
    }

    // 4. Offscreen Active Boss Radar Beacon
    const activeBoss = this.activeBoss || this.bugBoss;
    if (activeBoss && activeBoss.isAlive && !cam.isBoundingBoxVisible(activeBoss.x - 60, activeBoss.y - 60, 120, 120)) {
      drawIndicator(
        activeBoss.x,
        activeBoss.y,
        activeBoss.restraintColor || '#ff003c',
        `👾 ${activeBoss.name || 'BOSS'} [${activeBoss.completedWraps}/${activeBoss.maxWraps}]`
      );
    }



    // 5b. Offscreen Supplies Closet Beacon (when boss is alive and gear is needed)
    if (this.suppliesCloset && activeBoss?.isAlive && !cam.isBoundingBoxVisible(this.suppliesCloset.x, this.suppliesCloset.y, this.suppliesCloset.width, this.suppliesCloset.height)) {
      let needsGear = false;
      let closetLabel = 'SUPPLIES CLOSET';
      if (activeBoss instanceof BugBoss && !(this.activeCable instanceof RestraintRope)) {
        needsGear = true;
        closetLabel = '🪢 SUPPLIES CLOSET (ROPE)';
      } else if (activeBoss instanceof ThermalGolemBoss && !this.hasCryoCanister) {
        needsGear = true;
        closetLabel = '❄️ SUPPLIES CLOSET (CRYO)';
      } else if (!(this.activeCable instanceof ContainmentWire)) {
        needsGear = true;
        closetLabel = `👑 SUPPLIES CLOSET (${activeBoss.restraintName?.toUpperCase() || 'GEAR'})`;
      }

      if (needsGear) {
        drawIndicator(
          this.suppliesCloset.x + this.suppliesCloset.width / 2,
          this.suppliesCloset.y + this.suppliesCloset.height / 2,
          '#f59e0b',
          closetLabel
        );
      }
    }

    // 6. Offscreen Rogue Small Bugs Radar Beacon
    for (const bug of this.smallBugs) {
      if (bug.isAlive && !cam.isBoundingBoxVisible(bug.x - 30, bug.y - 30, 60, 60)) {
        const targetLabel = bug.targetRack ? ` ➔ ${bug.targetRack.id}` : '';
        drawIndicator(
          bug.x,
          bug.y,
          '#ff0055',
          `🐛 SQUISH BUG${targetLabel}`
        );
      }
    }

    // End of offscreen alerts
  }

  // ==========================================================================
  // Boss Collision with Server Racks: Deflect, Spark, and Trigger System Errors
  // ==========================================================================
  checkBossRackCollisions(boss, dt) {
    if (!boss || !boss.isAlive || !this.racks) return;

    // Tick down collision cooldowns on all racks
    for (const r of this.racks) {
      if (r.bossCrashCooldown > 0) {
        r.bossCrashCooldown -= dt;
      }
    }

    const bossRadius = boss.radius || 52;

    for (const rack of this.racks) {
      // Circle vs AABB collision detection
      const cx = Math.max(rack.x, Math.min(boss.x, rack.x + rack.width));
      const cy = Math.max(rack.y, Math.min(boss.y, rack.y + rack.height));
      const dx = boss.x - cx;
      const dy = boss.y - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq < bossRadius * bossRadius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = bossRadius - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push boss outside rack perimeter
        boss.x += nx * overlap;
        boss.y += ny * overlap;

        // Bounce / deflect velocity
        if (boss.vx !== undefined && boss.vy !== undefined) {
          const dot = boss.vx * nx + boss.vy * ny;
          if (dot < 0) {
            boss.vx -= 1.5 * dot * nx;
            boss.vy -= 1.5 * dot * ny;
          }
        }

        // Trigger rack crash error if not on cooldown and not already failing/destroyed
        if (!rack.bossCrashCooldown || rack.bossCrashCooldown <= 0) {
          rack.bossCrashCooldown = 1.6; // Per-rack cooldown so consecutive hits aren't spammy

          // Impact visual & sound feedback
          this.camera.shake(16, 0.4);
          this.sound.playExplosion();
          this.particles.spawnSparks(cx, cy, 35, '#ff2a55');
          this.particles.spawnSparks(cx, cy, 25, '#f59e0b');
          this.particles.spawnSparks(boss.x, boss.y, 20, '#ffffff');

          if (!rack.isFailing && !rack.isDestroyed) {
            // Pick incident based on boss archetype
            if (boss instanceof ThermalGolemBoss) {
              rack.triggerServerOverheatError();
            } else if (boss instanceof MajorVirusBoss) {
              rack.triggerServerSmallVirusError();
            } else {
              // BugBoss
              const roll = Math.random();
              if (roll < 0.5) {
                const candidateTargets = this.racks.filter(r => r.id !== rack.id && !r.isFailing && !r.isDestroyed && !r.isTargetDestination);
                if (candidateTargets.length > 0) {
                  const target = candidateTargets[Math.floor(Math.random() * candidateTargets.length)];
                  rack.triggerCableError(target);
                } else {
                  rack.triggerHardRebootError();
                }
              } else if (roll < 0.8) {
                rack.triggerHardRebootError();
              } else {
                rack.triggerAuthError();
              }
            }
            rack.uptime = 80;
            this.showTemporaryToast(`💥 ${boss.name?.toUpperCase() || 'BOSS'} RAMMED ${rack.id}! HARDWARE FAULT TRIGGERED!`, '💥');
          }
        }
      }
    }
  }

  // ==========================================================================
  // Main Animation Loop
  // ==========================================================================
  loop(currentTime) {
    this.fpsFrames++;
    if (currentTime - this.fpsLastTime >= 500) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (currentTime - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = currentTime;
      if (this.fpsVal) {
        this.fpsVal.textContent = `${this.currentFps} FPS`;
        if (this.currentFps >= 50) this.fpsVal.style.color = '#00ff9d';
        else if (this.currentFps >= 30) this.fpsVal.style.color = '#ffb800';
        else this.fpsVal.style.color = '#ff2a55';
      }
      if (this.statsFpsVal) {
        this.statsFpsVal.textContent = `${this.currentFps} FPS`;
        if (this.currentFps >= 50) this.statsFpsVal.style.color = '#00ff9d';
        else if (this.currentFps >= 30) this.statsFpsVal.style.color = '#ffb800';
        else this.statsFpsVal.style.color = '#ff2a55';
      }

      // Auto-suggest Turbo Smooth Mode in Settings if persistent low FPS detected
      if (!this.isOptimizedMode && !this.hasWarnedLowFps && this.currentFps < 35 && this.gameState === 'PLAYING') {
        this.lowFpsStreak++;
        if (this.lowFpsStreak >= 4) {
          this.hasWarnedLowFps = true;
          this.showTemporaryToast('⚡ Low FPS detected! Enable Turbo Smooth Mode in Settings ⚙️ for 60 FPS.', '💡');
        }
      } else if (this.currentFps >= 45) {
        this.lowFpsStreak = 0;
      }
    }

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    try {
      // Fixed sub-stepping: split larger frame delays to avoid collision tunnels or drift jerkiness
      const maxSubStep = 1 / 60;
      let remaining = dt;
      while (remaining > 0) {
        const step = Math.min(remaining, maxSubStep);
        this.update(step);
        remaining -= step;
      }
      this.render();
    } catch (err) {
      console.error('Game loop error:', err);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

// Start game instance on load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
