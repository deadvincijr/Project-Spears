/**
 * ============================================================================
 * TOWERS - 2D Side Scroller Tactical Strategy Game
 * ============================================================================
 * Features:
 * - 4200px side-scrolling battlefield with parallax sky, terrain, and towers
 * - Multi-floor Player Citadel with underground Treasury Basement
 * - Automated + Manual Direct Control Stick Figures (WASD + Space + Mouse)
 * - 10-Second recruitment timer with population limits
 * - Floor expansion system with unique tactical station benefits
 * - West AI (Crimson Vanguard) & East AI (Shadow Legion) Fortresses to conquer
 * - Fully articulated procedural stick figure animation (walk, climb, mine, attack)
 * - Native Web Audio synthesized sound effects (zero asset dependencies)
 */

(() => {
  'use strict';

  // ============================================================================
  // AUDIO SYNTHESIZER (Web Audio API)
  // ============================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return !this.muted;
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
      if (this.muted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Ignore audio errors
      }
    }

    playCoin() {
      if (this.muted || !this.ctx) return;
      this.playTone(987.77, 0.1, 'sine', 0.12);
      setTimeout(() => this.playTone(1318.51, 0.16, 'sine', 0.14), 60);
    }

    playMineHit() {
      if (this.muted || !this.ctx) return;
      this.playTone(180, 0.08, 'triangle', 0.2);
      this.playTone(1200, 0.05, 'sine', 0.08);
    }

    playSwordSlash() {
      if (this.muted || !this.ctx) return;
      try {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        filter.Q.setValueAtTime(3, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
      } catch (e) {}
    }

    playBowFire() {
      if (this.muted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch (e) {}
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      this.playTone(110, 0.1, 'square', 0.15);
    }

    playBuild() {
      if (this.muted || !this.ctx) return;
      this.playTone(160, 0.15, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(320, 0.25, 'triangle', 0.2), 100);
    }

    playSpawn() {
      if (this.muted || !this.ctx) return;
      this.playTone(440, 0.08, 'sine', 0.1);
      setTimeout(() => this.playTone(554.37, 0.08, 'sine', 0.1), 70);
      setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.15), 140);
    }

    playConquer() {
      if (this.muted || !this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((note, idx) => {
        setTimeout(() => this.playTone(note, 0.35, 'triangle', 0.25), idx * 120);
      });
    }

    playLaser() {
      if (this.muted || !this.ctx) return;
      this.playTone(880, 0.05, 'sawtooth', 0.09);
      setTimeout(() => this.playTone(440, 0.06, 'sine', 0.07), 15);
    }

    playAlert() {
      if (this.muted || !this.ctx) return;
      this.playTone(330, 0.12, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(440, 0.18, 'sawtooth', 0.25), 100);
      setTimeout(() => this.playTone(550, 0.25, 'sawtooth', 0.3), 220);
    }
  }

  const audio = new SoundManager();

  // ============================================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================================
  const GROUND_Y = 560;
  const BASEMENT_Y = 690;
  const FLOOR_HEIGHT = 110;
  const TOWER_WIDTH = 250;

  // Initial Tower Centers
  const WEST_TOWER_X = 600;
  const PLAYER_TOWER_X = 2200;
  const EAST_TOWER_X = 3800;

  // Roman numeral helper
  function toRoman(num) {
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (const key of Object.keys(roman)) {
      const q = Math.floor(num / roman[key]);
      num -= q * roman[key];
      str += key.repeat(q);
    }
    return str || 'I';
  }

  // Procedural Tower Names & Themes Generator
  const TOWER_NAME_PREFIXES = [
    'Crimson', 'Shadow', 'Iron', 'Obsidian', 'Dread', 'Storm', 'Abyssal', 'Titan',
    'Colossus', 'Infernal', 'Apex', 'Mythic', 'Doom', 'Vanguard', 'Ragnarok', 'Void',
    'Gilded', 'Frostbite', 'Chaos', 'Valkyrie', 'Nether', 'Celestial', 'Molten', 'Ebon'
  ];

  const TOWER_NAME_SUFFIXES = [
    'Vanguard', 'Legion', 'Citadel', 'Keep', 'Spire', 'Fortress', 'Bastion',
    'Stronghold', 'Monolith', 'Garrison', 'Sanctuary', 'Apex', 'Redoubt', 'Rampart'
  ];

  function getTierTheme(tier, direction) {
    const themes = [
      // Tier 1 (Red Vanguard / Purple Shadow Legion)
      direction === 'west'
        ? { wall: '#3f1d24', trim: '#b91c1c', flag: '#ef4444', banner: '#f87171', torch: '#f87171', core: '#ef4444', stone: '#2a1217', defaultName: 'Crimson Vanguard' }
        : { wall: '#2e1065', trim: '#6b21a8', flag: '#a855f7', banner: '#c084fc', torch: '#c084fc', core: '#a855f7', stone: '#1d0b3f', defaultName: 'Shadow Legion' },
      // Tier 2: Iron Bastion / Bronze Spire
      { wall: '#1e293b', trim: '#475569', flag: '#f59e0b', banner: '#fbbf24', torch: '#f59e0b', core: '#f59e0b', stone: '#0f172a' },
      // Tier 3: Emerald Necro / Jade Keep
      { wall: '#064e3b', trim: '#047857', flag: '#10b981', banner: '#34d399', torch: '#10b981', core: '#10b981', stone: '#022c22' },
      // Tier 4: Molten Brimstone / Infernal Monolith
      { wall: '#451a03', trim: '#9a3412', flag: '#ea580c', banner: '#fb923c', torch: '#f97316', core: '#ea580c', stone: '#291003' },
      // Tier 5: Glacial Frost / Azure Stronghold
      { wall: '#082f49', trim: '#0284c7', flag: '#06b6d4', banner: '#67e8f9', torch: '#38bdf8', core: '#06b6d4', stone: '#031c2d' },
      // Tier 6: Void Apex / Celestial Dread
      { wall: '#3b0764', trim: '#701a75', flag: '#d946ef', banner: '#f0abfc', torch: '#e879f9', core: '#d946ef', stone: '#24043d' }
    ];

    const idx = Math.min(themes.length - 1, tier - 1);
    const baseTheme = themes[idx];
    const prefix = TOWER_NAME_PREFIXES[(tier * 7 + (direction === 'west' ? 3 : 11)) % TOWER_NAME_PREFIXES.length];
    const suffix = TOWER_NAME_SUFFIXES[(tier * 5 + (direction === 'west' ? 2 : 8)) % TOWER_NAME_SUFFIXES.length];
    const name = (tier === 1 && baseTheme.defaultName) ? baseTheme.defaultName : `${prefix} ${suffix}`;

    return {
      ...baseTheme,
      name
    };
  }

  // Skyscraper Upgrade Costs
  const FLOOR_COSTS = {
    2: 150,
    3: 300,
    4: 600,
    5: 1200
  };

  function getFloorCost(floorNum) {
    if (floorNum in FLOOR_COSTS) return FLOOR_COSTS[floorNum];
    return 1200 + (floorNum - 5) * 600;
  }

  // Modern Skyscraper Floor Specialization Types
  const FLOOR_PURPOSES = {
    recruitment: {
      id: 'recruitment',
      name: 'Recruitment Center',
      icon: '🏢',
      desc: 'Secondary recruitment desk. +15 Squad capacity, additional operative spawn point.'
    },
    turrets: {
      id: 'turrets',
      name: 'Turret Platform',
      icon: '🎯',
      desc: 'Equips floor with dual heavy wall turret mountings (West & East). Sentry turrets can only be built here.'
    },
    archers: {
      id: 'archers',
      name: 'Sniper Balcony',
      icon: '🏹',
      desc: 'Long-range archer balcony perches for garrisoned sharpshooters.'
    },
    armory: {
      id: 'armory',
      name: 'Security Armory',
      icon: '🛡️',
      desc: '+25% Max HP and +30% attack damage for all stick figures in the squad.'
    }
  };

  // ============================================================================
  // WALL TURRET CLASS ($150 Heavy Skyscraper Sentry)
  // ============================================================================
  class WallTurret {
    constructor(x, y, facing, floorNum) {
      this.x = x;
      this.y = y;
      this.facing = facing; // -1 (West) or 1 (East)
      this.floorNum = floorNum;
      this.range = 580;
      this.damage = 22;
      this.cooldown = 0.7;
      this.timer = 0;
      this.target = null;
      this.barrelAngle = facing > 0 ? 0.15 : (Math.PI - 0.15);
      this.recoil = 0;
      this.mannedBy = null; // StickFigure instance manning this turret
    }

    getStationPos() {
      const floorY = (this.floorNum === 1) ? GROUND_Y : (GROUND_Y - (this.floorNum - 1) * FLOOR_HEIGHT);
      const stationX = this.facing < 0 ? (PLAYER_TOWER_X - TOWER_WIDTH / 2 + 28) : (PLAYER_TOWER_X + TOWER_WIDTH / 2 - 28);
      return { x: stationX, y: floorY };
    }

    update(dt, world) {
      this.timer = Math.max(0, this.timer - dt);
      if (this.recoil > 0) this.recoil -= dt * 6;

      // Clean up dead/despawned mannedBy unit
      if (this.mannedBy && (this.mannedBy.isDead || !world.units.includes(this.mannedBy))) {
        this.mannedBy.manningTurret = null;
        this.mannedBy = null;
      }

      // If manned, lock stick figure to the indoor turret station
      if (this.mannedBy) {
        const station = this.getStationPos();
        this.mannedBy.x = station.x;
        this.mannedBy.y = station.y;
        this.mannedBy.facing = this.facing;
        this.mannedBy.manningTurret = this;

        // DIRECT CONTROL: Player aims with mouse cursor in real-time
        if (this.mannedBy.isDirectControlled) {
          if (world.mouseWorldPos) {
            const dx = world.mouseWorldPos.x - this.x;
            const dy = world.mouseWorldPos.y - this.y;
            // Prevent shooting backward through Citadel
            if ((this.facing > 0 && dx > -15) || (this.facing < 0 && dx < 15)) {
              this.barrelAngle = Math.atan2(dy, dx);
            }
          }
          return; // Fired on demand by player click/space!
        }
      } else {
        // UNMANNED: Turret cannot fire without a stick figure operator!
        this.target = null;
        this.barrelAngle = this.facing > 0 ? 0.2 : (Math.PI - 0.2);
        return;
      }

      // AUTONOMOUS AI MANNING: Find nearest enemy on this turret's wall facing side
      this.target = null;
      let closestDist = this.range;

      for (const unit of world.units) {
        if (!unit.isDead && unit.faction !== 'player') {
          const dx = unit.x - this.x;
          const dy = (unit.y - 20) - this.y;
          // Must be on the turret's outward side
          if ((this.facing > 0 && dx > 0) || (this.facing < 0 && dx < 0)) {
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
              closestDist = dist;
              this.target = unit;
            }
          }
        }
      }

      if (this.target) {
        const dx = this.target.x - this.x;
        const dy = (this.target.y - 20) - this.y;
        this.barrelAngle = Math.atan2(dy, dx);

        if (this.timer <= 0) {
          this.fire(world, dx, dy);
          this.timer = this.cooldown;
        }
      } else {
        // Idle angle
        this.barrelAngle = this.facing > 0 ? 0.2 : (Math.PI - 0.2);
      }
    }

    tryDirectFire(world) {
      if (this.timer > 0) return;
      const dx = Math.cos(this.barrelAngle) * 350;
      const dy = Math.sin(this.barrelAngle) * 350;
      this.fire(world, dx, dy);
      this.timer = 0.32; // Responsive firing rate for direct control
    }

    fire(world, dx, dy) {
      this.recoil = 1.0;
      audio.playLaser();
      const dist = Math.hypot(dx, dy);
      const speed = 780;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;

      const muzzleX = this.x + Math.cos(this.barrelAngle) * 22;
      const muzzleY = this.y + Math.sin(this.barrelAngle) * 22;

      world.projectiles.push(new Projectile(muzzleX, muzzleY, vx, vy, this.damage, 'player', false));
      world.spawnSparks(muzzleX, muzzleY, '#38bdf8', 8);
    }

    draw(ctx, world) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Wall Mount Bracket anchored to Skyscraper frame
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(this.facing > 0 ? -6 : -8, -12, 14, 24);
      ctx.strokeRect(this.facing > 0 ? -6 : -8, -12, 14, 24);

      // Swivel Base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Targeting Guides
      if (this.mannedBy && this.mannedBy.isDirectControlled) {
        // Direct Control Laser Pointer
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.barrelAngle) * 450, Math.sin(this.barrelAngle) * 450);
        ctx.stroke();
        ctx.restore();
      } else if (this.target) {
        // AI Target Red Line
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.barrelAngle) * 380, Math.sin(this.barrelAngle) * 380);
        ctx.stroke();
        ctx.restore();
      }

      // Rotating Gun Assembly
      ctx.rotate(this.barrelAngle);
      const recoilOffset = -this.recoil * 5;

      // Dual High-Tech Cannon Barrels
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(5 + recoilOffset, -5, 18, 3.5);
      ctx.fillRect(5 + recoilOffset, 1.5, 18, 3.5);

      // Muzzle Flash
      if (this.recoil > 0.5) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(26 + recoilOffset, -1, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Turret Core Pod
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(recoilOffset, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing targeting lens
      ctx.fillStyle = this.target ? '#ef4444' : (this.mannedBy ? '#38bdf8' : '#64748b');
      ctx.beginPath();
      ctx.arc(3 + recoilOffset, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Status Tag above turret
      ctx.save();
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      if (!this.mannedBy) {
        const blink = Math.sin(Date.now() * 0.008) > 0;
        ctx.fillStyle = blink ? '#ef4444' : '#f59e0b';
        ctx.fillText('⚠️ UNMANNED', this.x, this.y - 18);
      } else if (this.mannedBy.isDirectControlled) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('DIRECT CONTROL', this.x, this.y - 18);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.fillText('MANNED [AI]', this.x, this.y - 18);
      }
      ctx.restore();
    }
  }

  // ============================================================================
  // PARTICLES & FLOATING TEXTS
  // ============================================================================
  class Particle {
    constructor(x, y, vx, vy, color, size, life, isGravity = true) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      this.isGravity = isGravity;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.isGravity) this.vy += 450 * dt;
      this.life -= dt;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color = '#fef08a', size = 16, vy = -40) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.vy = vy;
      this.life = 1.0;
    }

    update(dt) {
      this.y += this.vy * dt;
      this.life -= dt * 1.1;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.font = `bold ${this.size}px 'Outfit', sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  class Projectile {
    constructor(x, y, vx, vy, damage, faction, isBallista = false) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.damage = damage;
      this.faction = faction;
      this.isBallista = isBallista;
      this.active = true;
      this.trail = [];
    }

    update(dt, world) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 5) this.trail.shift();

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += (this.isBallista ? 180 : 320) * dt; // Gravity

      // Check ground collision
      if (this.y >= GROUND_Y) {
        this.active = false;
        world.spawnSparks(this.x, GROUND_Y, '#94a3b8', 4);
        return;
      }

      // Check hit with stick figures
      for (const unit of world.units) {
        if (!unit.isDead && unit.faction !== this.faction) {
          const dist = Math.hypot(unit.x - this.x, (unit.y - 20) - this.y);
          if (dist < (this.isBallista ? 24 : 16)) {
            unit.takeDamage(this.damage, world);
            world.spawnBlood(this.x, this.y, 6);
            audio.playHit();
            if (!this.isBallista) {
              this.active = false;
              return;
            }
          }
        }
      }

      // Check hit with enemy gates/cores
      const targets = world.getAllTowers ? world.getAllTowers() : [world.playerTower];
      for (const t of targets) {
        if (t.faction !== this.faction && !t.conquered) {
          // Gate
          if (t.gateHp > 0 && Math.abs(this.x - t.gateX) < 24 && this.y > GROUND_Y - 90 && this.y < GROUND_Y) {
            t.damageGate(this.damage, world);
            world.spawnSparks(this.x, this.y, '#f59e0b', 8);
            audio.playHit();
            this.active = false;
            return;
          }
          // Core
          if (t.gateHp <= 0 && Math.abs(this.x - t.x) < 35 && this.y > GROUND_Y - 70 && this.y < GROUND_Y) {
            t.damageCore(this.damage, world);
            world.spawnSparks(this.x, this.y, '#38bdf8', 10);
            audio.playHit();
            this.active = false;
            return;
          }
        }
      }
    }

    draw(ctx) {
      ctx.save();
      const angle = Math.atan2(this.vy, this.vx);
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);

      if (this.isBallista) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-18, -3, 36, 6);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(8, -6);
        ctx.lineTo(8, 6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(6, -3);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ============================================================================
  // STICK FIGURE CLASS
  // ============================================================================
  let unitIdCounter = 1;

  class StickFigure {
    constructor(x, y, faction = 'player', role = 'infantry') {
      this.id = unitIdCounter++;
      this.faction = faction; // 'player', 'red', 'purple'
      this.role = role; // 'worker', 'infantry', 'archer'
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.facing = faction === 'red' ? 1 : (faction === 'purple' ? -1 : 1);

      this.width = 24;
      this.height = 46;

      this.maxHp = faction === 'player' ? 100 : 80;
      this.hp = this.maxHp;
      this.damage = faction === 'player' ? 18 : 14;
      this.attackRange = role === 'archer' ? 380 : 38;
      this.attackCooldown = role === 'archer' ? 1.6 : 0.85;
      this.attackTimer = 0;

      this.isDirectControlled = false;
      this.order = 'idle'; // 'idle', 'work_basement', 'guard_tower', 'attack_west', 'attack_east', 'stand_ground'
      this.holdX = null;
      this.holdY = null;
      this.targetFloor = 1; // 0 = basement, 1 = ground, 2 = archer roost, etc.

      // Animations & state
      this.animTime = Math.random() * 10;
      this.swingTime = 0;
      this.workTime = 0;
      this.hitFlash = 0;
      this.isDead = false;
      this.onLadder = false;
      this.isMining = false;
      this.manningTurret = null; // WallTurret instance if currently manning one

      // Stats tracking
      this.goldMined = 0;
    }

    takeDamage(amount, world) {
      if (this.isDead) return;
      if (this.faction !== 'player' && world && world.truceTimer > 0) {
        world.breakTruceEarly('unit_attack');
      }
      this.hp -= amount;
      this.hitFlash = 0.2;
      world.floatingTexts.push(new FloatingText(`-${amount}`, this.x, this.y - 45, '#ef4444', 15));

      if (this.hp <= 0) {
        this.isDead = true;
        this.hp = 0;
        if (this.manningTurret) {
          this.manningTurret.mannedBy = null;
          this.manningTurret = null;
        }
        world.spawnBlood(this.x, this.y - 20, 16);
        if (this.faction === 'player') {
          world.onPlayerUnitDied(this);
        } else {
          world.enemiesSlain++;
          world.addMoney(12);
          world.floatingTexts.push(new FloatingText(`+$12`, this.x, this.y - 30, '#fef08a', 15));
        }
      }
    }

    update(dt, world, keys) {
      if (this.isDead) return;

      this.animTime += dt * 8;
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.swingTime > 0) this.swingTime -= dt * 4;

      // Upgrade buffs from Player Armory
      const armoryFloors = Object.keys(world.floorPurposes).filter(f => world.floorPurposes[f] === 'armory').length;
      if (this.faction === 'player' && armoryFloors > 0) {
        this.maxHp = 130;
        this.damage = 25;
      }

      if (this.isDirectControlled) {
        this.handleDirectControl(dt, world, keys);
      } else {
        this.handleAutonomousAI(dt, world);
      }
    }

    handleDirectControl(dt, world, keys) {
      // 1. IF MANNING A TURRET: Direct Turret Gunner Mode!
      if (this.manningTurret) {
        const station = this.manningTurret.getStationPos();
        this.x = station.x;
        this.y = station.y;
        this.facing = this.manningTurret.facing;
        this.vx = 0;
        this.vy = 0;

        // Firing with Space
        if (keys['Space']) {
          this.manningTurret.tryDirectFire(world);
          keys['Space'] = false;
        }

        // Dismount if player presses movement keys or E
        if (keys['KeyA'] || keys['KeyD'] || keys['KeyW'] || keys['KeyS'] || keys['KeyE']) {
          const turretRef = this.manningTurret;
          turretRef.mannedBy = null;
          this.manningTurret = null;
          this.x += (turretRef.facing < 0 ? 20 : -20);
          world.floatingTexts.push(new FloatingText("DISMOUNTED TURRET", this.x, this.y - 30, '#94a3b8', 14));
          keys['KeyA'] = false;
          keys['KeyD'] = false;
          keys['KeyW'] = false;
          keys['KeyS'] = false;
          keys['KeyE'] = false;
          world.updateDirectControlHUD();
        }
        return;
      }

      // 2. NORMAL DIRECT CONTROL (Walking & Ladders)
      const moveSpeed = 160;
      const climbSpeed = 130;

      // Mount nearby unmanned turret with [E]
      if (keys['KeyE']) {
        for (const turret of world.wallTurrets) {
          if (!turret.mannedBy) {
            const station = turret.getStationPos();
            if (Math.abs(this.x - station.x) < 40 && Math.abs(this.y - station.y) < 25) {
              turret.mannedBy = this;
              this.manningTurret = turret;
              this.x = station.x;
              this.y = station.y;
              this.facing = turret.facing;
              audio.playBuild();
              world.floatingTexts.push(new FloatingText("DIRECT TURRET CONTROL", this.x, this.y - 35, '#38bdf8', 18));
              keys['KeyE'] = false;
              world.updateDirectControlHUD();
              return;
            }
          }
        }
      }

      // Check ladder proximity
      const topFloorY = GROUND_Y - (world.playerFloors - 1) * FLOOR_HEIGHT;
      const nearLadder = Math.abs(this.x - PLAYER_TOWER_X) < 38 && this.y >= (topFloorY - 20) && this.y <= (BASEMENT_Y + 10);

      let isMovingX = false;
      if (keys['KeyA'] || keys['ArrowLeft']) {
        this.vx = -moveSpeed;
        this.facing = -1;
        isMovingX = true;
      } else if (keys['KeyD'] || keys['ArrowRight']) {
        this.vx = moveSpeed;
        this.facing = 1;
        isMovingX = true;
      } else {
        this.vx = 0;
      }

      // Vertical Ladder climbing / Jumping
      if (nearLadder && (keys['KeyW'] || keys['ArrowUp'])) {
        this.onLadder = true;
        this.vy = -climbSpeed;
      } else if (nearLadder && (keys['KeyS'] || keys['ArrowDown'])) {
        this.onLadder = true;
        this.vy = climbSpeed;
      } else if (this.onLadder) {
        this.vy = 0;
        if (Math.abs(this.x - PLAYER_TOWER_X) > 38) {
          this.onLadder = false;
        }
      } else {
        this.applyPlatformPhysics(dt, world);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.x = Math.max((world.worldLeft || 0) + 80, Math.min((world.worldRight || 4400) - 80, this.x));
      this.resolveFloorCollisions(world);

      if (keys['Space']) {
        this.performDirectAction(world);
        keys['Space'] = false;
      }
    }

    performDirectAction(world) {
      this.swingTime = 1.0;

      // Check if in basement near Gold Node
      const inBasement = this.y > GROUND_Y + 40;
      const nearVault = Math.abs(this.x - (PLAYER_TOWER_X - 60)) < 60;

      if (inBasement && nearVault) {
        const earn = (world.playerFloors >= 5) ? 10 : 5;
        world.addMoney(earn);
        world.goldMined += earn;
        audio.playMineHit();
        world.spawnSparks(this.x - 30 * this.facing, this.y - 15, '#f59e0b', 10);
        world.floatingTexts.push(new FloatingText(`+$${earn}`, this.x, this.y - 45, '#fef08a', 18));
        return;
      }

      // If archer, shoot arrow
      if (this.role === 'archer') {
        this.shootArrow(world);
        return;
      }

      // Melee attack nearby enemies or enemy gates/cores
      audio.playSwordSlash();
      let hitTarget = false;

      for (const unit of world.units) {
        if (!unit.isDead && unit.faction !== this.faction) {
          if (Math.abs(unit.x - this.x) < 48 && Math.abs(unit.y - this.y) < 30) {
            unit.takeDamage(this.damage, world);
            hitTarget = true;
          }
        }
      }

      // Attack gates & cores of all unconquered towers
      const targets = world.getAllTowers ? world.getAllTowers().filter(t => t.faction !== this.faction) : [world.westTower, world.eastTower];
      for (const t of targets) {
        if (!t.conquered) {
          if (t.gateHp > 0 && Math.abs(this.x - t.gateX) < 45 && Math.abs(this.y - GROUND_Y) < 40) {
            t.damageGate(this.damage, world);
            hitTarget = true;
          } else if (t.gateHp <= 0 && Math.abs(this.x - t.x) < 55 && Math.abs(this.y - GROUND_Y) < 40) {
            t.damageCore(this.damage, world);
            hitTarget = true;
          }
        }
      }

      if (hitTarget) {
        audio.playHit();
      }
    }

    handleAutonomousAI(dt, world) {
      if (this.faction === 'player') {
        this.handlePlayerSquadAI(dt, world);
      } else {
        this.handleEnemyAI(dt, world);
      }
    }

    handlePlayerSquadAI(dt, world) {
      const walkSpeed = 110;

      // 0. IF ALREADY MANNING TURRET: Keep station manned!
      if (this.manningTurret) {
        this.role = 'gunner';
        const station = this.manningTurret.getStationPos();
        this.x = station.x;
        this.y = station.y;
        this.facing = this.manningTurret.facing;
        this.vx = 0;
        this.vy = 0;
        return;
      }

      // 1. WORK IN BASEMENT ORDER
      if (this.order === 'work_basement') {
        this.role = 'worker';
        const targetX = PLAYER_TOWER_X - 60;
        const targetY = BASEMENT_Y;

        if (Math.abs(this.y - targetY) > 10) {
          this.navigateToFloor(0, dt, world);
        } else {
          if (Math.abs(this.x - targetX) > 15) {
            this.vx = (targetX > this.x ? 1 : -1) * walkSpeed;
            this.facing = this.vx > 0 ? 1 : -1;
            this.x += this.vx * dt;
          } else {
            this.vx = 0;
            this.isMining = true;
            this.workTime += dt;
            if (this.workTime >= 1.5) {
              this.workTime = 0;
              this.swingTime = 0.8;
              const earn = world.playerFloors >= 5 ? 4 : 2;
              world.addMoney(earn);
              world.goldMined += earn;
              world.spawnSparks(this.x - 20, this.y - 12, '#f59e0b', 5);
              world.floatingTexts.push(new FloatingText(`+$${earn}`, this.x, this.y - 45, '#fef08a', 14));
              audio.playMineHit();
            }
          }
        }
        return;
      }

      // 2. STAND GROUND / HOLD POSITION ORDER
      if (this.order === 'stand_ground') {
        this.isMining = false;

        // Initialize hold anchor coordinates if not yet set
        if (this.holdX === undefined || this.holdX === null) {
          this.holdX = this.x;
          this.holdY = this.y;
        }

        // Archers scan and fire at any enemy within range without moving from their post
        if (this.role === 'archer' || this.attackRange > 100) {
          this.vx = 0;
          this.scanAndAttackEnemies(world, dt);
          return;
        }

        // Melee units defend their post against approaching enemies on same floor level
        let nearEnemy = null;
        let minDist = 110;
        for (const u of world.units) {
          if (!u.isDead && u.faction !== this.faction) {
            const dx = Math.abs(u.x - this.x);
            const dy = Math.abs(u.y - this.y);
            if (dx < minDist && dy < 40) {
              minDist = dx;
              nearEnemy = u;
            }
          }
        }

        if (nearEnemy) {
          this.facing = nearEnemy.x > this.x ? 1 : -1;
          if (Math.abs(nearEnemy.x - this.x) < 40) {
            this.vx = 0;
            this.performMeleeAttack(nearEnemy, world);
          } else {
            // Step forward to engage if enemy is near, but never drift more than 65px from hold post
            const distFromHold = Math.abs(this.x - this.holdX);
            if (distFromHold < 65) {
              this.marchTowardsTarget(nearEnemy.x, dt, walkSpeed * 0.9);
            } else {
              this.vx = 0;
            }
          }
        } else {
          // Return to exact anchored position if displaced during combat
          if (Math.abs(this.x - this.holdX) > 6) {
            this.marchTowardsTarget(this.holdX, dt, walkSpeed * 0.7);
          } else {
            this.x = this.holdX;
            this.vx = 0;
          }
        }
        return;
      }

      // 3. DEFEND CITADEL / IDLE: Prioritize Manning Unmanned Turrets!
      if (this.order === 'guard_tower' || this.order === 'idle') {
        this.isMining = false;

        // Check if there is an unmanned turret on any turret floor
        const unmannedTurret = world.wallTurrets.find(t => !t.mannedBy);
        if (unmannedTurret) {
          this.role = 'gunner';
          const station = unmannedTurret.getStationPos();
          if (Math.abs(this.y - station.y) > 10) {
            this.navigateToFloor(unmannedTurret.floorNum, dt, world);
          } else {
            if (Math.abs(this.x - station.x) > 15) {
              this.vx = (station.x > this.x ? 1 : -1) * walkSpeed;
              this.facing = this.vx > 0 ? 1 : -1;
              this.x += this.vx * dt;
            } else {
              // Successfully manned!
              unmannedTurret.mannedBy = this;
              this.manningTurret = unmannedTurret;
              this.x = station.x;
              this.y = station.y;
              this.facing = unmannedTurret.facing;
              this.vx = 0;
              world.floatingTexts.push(new FloatingText("TURRET MANNED [AI]", this.x, this.y - 35, '#10b981', 14));
            }
          }
          return;
        }

        // If Archer Roost floor exists, garrison there
        const archerFloor = Object.keys(world.floorPurposes).find(f => world.floorPurposes[f] === 'archers');
        if (archerFloor && this.targetFloor === Number(archerFloor)) {
          this.role = 'archer';
          this.navigateToFloor(Number(archerFloor), dt, world);
          this.scanAndAttackEnemies(world, dt);
          return;
        }

        // Patrol ground floor of Citadel
        this.role = 'infantry';
        if (this.y > GROUND_Y + 5) {
          this.navigateToFloor(1, dt, world);
        } else {
          const nearEnemy = world.findNearestEnemy(this);
          if (nearEnemy && Math.abs(nearEnemy.x - PLAYER_TOWER_X) < 450) {
            this.marchTowardsTarget(nearEnemy.x, dt, walkSpeed);
            if (Math.abs(nearEnemy.x - this.x) < 40) {
              this.performMeleeAttack(nearEnemy, world);
            }
          } else {
            const homeX = PLAYER_TOWER_X;
            if (Math.abs(this.x - homeX) > 120) {
              this.marchTowardsTarget(homeX, dt, walkSpeed * 0.6);
            } else {
              this.vx = 0;
            }
          }
        }
        return;
      }

      // 3. ASSAULT WEST AI (Red Vanguard)
      if (this.order === 'attack_west') {
        this.isMining = false;
        this.role = 'infantry';
        // Ensure on ground
        if (this.y > GROUND_Y + 5 || this.y < GROUND_Y - 5) {
          this.navigateToFloor(1, dt, world);
          return;
        }

        const enemy = world.findNearestEnemy(this, 120);
        if (enemy) {
          this.marchTowardsTarget(enemy.x, dt, walkSpeed);
          if (Math.abs(enemy.x - this.x) < 40) {
            this.performMeleeAttack(enemy, world);
          }
          return;
        }

        // Attack Active West Frontier Fortress
        const west = world.getActiveWestTower ? world.getActiveWestTower() : world.westTower;
        if (west && !west.conquered) {
          if (west.gateHp > 0) {
            this.marchTowardsTarget(west.gateX + 25, dt, walkSpeed);
            if (Math.abs(this.x - (west.gateX + 25)) < 30) {
              this.performGateAttack(west, world);
            }
          } else {
            // Assault West Core
            this.marchTowardsTarget(west.x, dt, walkSpeed);
            if (Math.abs(this.x - west.x) < 35) {
              this.performCoreAttack(west, world);
            }
          }
        }
        return;
      }

      // 4. ASSAULT EAST AI (Shadow Legion / Frontier Fortress)
      if (this.order === 'attack_east') {
        this.isMining = false;
        this.role = 'infantry';
        if (this.y > GROUND_Y + 5 || this.y < GROUND_Y - 5) {
          this.navigateToFloor(1, dt, world);
          return;
        }

        const enemy = world.findNearestEnemy(this, 120);
        if (enemy) {
          this.marchTowardsTarget(enemy.x, dt, walkSpeed);
          if (Math.abs(enemy.x - this.x) < 40) {
            this.performMeleeAttack(enemy, world);
          }
          return;
        }

        // Attack Active East Frontier Fortress
        const east = world.getActiveEastTower ? world.getActiveEastTower() : world.eastTower;
        if (east && !east.conquered) {
          if (east.gateHp > 0) {
            this.marchTowardsTarget(east.gateX - 25, dt, walkSpeed);
            if (Math.abs(this.x - (east.gateX - 25)) < 30) {
              this.performGateAttack(east, world);
            }
          } else {
            // Assault East Core
            this.marchTowardsTarget(east.x, dt, walkSpeed);
            if (Math.abs(this.x - east.x) < 35) {
              this.performCoreAttack(east, world);
            }
          }
        }
        return;
      }
    }

    handleEnemyAI(dt, world) {
      const walkSpeed = 95;

      // During Truce: Enemy units hold positions and patrol near their home fortress
      if (world.truceTimer && world.truceTimer > 0) {
        // If a player unit gets very close (< 100px), defend home
        const playerUnit = world.findNearestPlayerUnit(this, 100);
        if (playerUnit) {
          this.marchTowardsTarget(playerUnit.x, dt, walkSpeed);
          if (Math.abs(playerUnit.x - this.x) < 38) {
            this.performMeleeAttack(playerUnit, world);
          }
          return;
        }

        // Otherwise hold position and patrol near home fortress
        const homeX = this.faction === 'red' ? WEST_TOWER_X : EAST_TOWER_X;
        const distFromHome = this.x - homeX;
        if (Math.abs(distFromHome) > 75) {
          this.marchTowardsTarget(homeX, dt, walkSpeed * 0.6);
        } else {
          this.idleTimer = (this.idleTimer || 0) - dt;
          if (this.idleTimer <= 0) {
            this.idleTimer = 3 + Math.random() * 3;
            this.idleDir = Math.random() < 0.5 ? -1 : 1;
          }
          this.vx = this.idleDir * 25;
          this.facing = this.idleDir;
          this.x += this.vx * dt;
        }
        return;
      }

      // Post-truce: Enemy marches towards Player Citadel
      const playerUnit = world.findNearestPlayerUnit(this, 100);
      if (playerUnit) {
        this.marchTowardsTarget(playerUnit.x, dt, walkSpeed);
        if (Math.abs(playerUnit.x - this.x) < 38) {
          this.performMeleeAttack(playerUnit, world);
        }
        return;
      }

      // March towards player citadel gate
      const playerGateX = this.faction === 'red' ? (PLAYER_TOWER_X - TOWER_WIDTH / 2) : (PLAYER_TOWER_X + TOWER_WIDTH / 2);
      if (world.playerTower.gateHp > 0) {
        this.marchTowardsTarget(playerGateX, dt, walkSpeed);
        if (Math.abs(this.x - playerGateX) < 40) {
          this.performGateAttack(world.playerTower, world);
        }
      } else {
        // Attack Citadel Core
        this.marchTowardsTarget(PLAYER_TOWER_X, dt, walkSpeed);
        if (Math.abs(this.x - PLAYER_TOWER_X) < 40) {
          this.performCoreAttack(world.playerTower, world);
        }
      }
    }

    marchTowardsTarget(targetX, dt, speed) {
      if (Math.abs(this.x - targetX) > 10) {
        this.vx = (targetX > this.x ? 1 : -1) * speed;
        this.facing = this.vx > 0 ? 1 : -1;
        this.x += this.vx * dt;
      } else {
        this.vx = 0;
      }
    }

    navigateToFloor(floorIndex, dt, world) {
      const climbSpeed = 110;
      const ladderX = PLAYER_TOWER_X;
      let targetY = GROUND_Y;
      if (floorIndex === 0) targetY = BASEMENT_Y;
      else if (floorIndex > 1) targetY = GROUND_Y - (floorIndex - 1) * FLOOR_HEIGHT;

      // 1. Move horizontally to ladder
      if (Math.abs(this.x - ladderX) > 8 && Math.abs(this.y - targetY) > 5) {
        this.vx = (ladderX > this.x ? 1 : -1) * 100;
        this.facing = this.vx > 0 ? 1 : -1;
        this.x += this.vx * dt;
        return;
      }

      // 2. Climb up or down ladder
      this.x = ladderX;
      if (Math.abs(this.y - targetY) > 4) {
        this.onLadder = true;
        this.vy = (targetY > this.y ? 1 : -1) * climbSpeed;
        this.y += this.vy * dt;
      } else {
        this.y = targetY;
        this.vy = 0;
        this.onLadder = false;
      }
    }

    scanAndAttackEnemies(world, dt) {
      // Find enemies within firing range
      for (const unit of world.units) {
        if (!unit.isDead && unit.faction !== this.faction) {
          const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
          if (dist < this.attackRange) {
            this.facing = unit.x > this.x ? 1 : -1;
            if (this.attackTimer <= 0) {
              this.shootArrow(world, unit);
              this.attackTimer = this.attackCooldown;
            }
            return;
          }
        }
      }
    }

    shootArrow(world, target = null) {
      audio.playBowFire();
      this.swingTime = 0.8;
      const spawnX = this.x + 16 * this.facing;
      const spawnY = this.y - 25;

      let vx = 320 * this.facing;
      let vy = -90;

      if (target) {
        const dx = target.x - spawnX;
        const dy = target.y - spawnY;
        const dist = Math.hypot(dx, dy);
        vx = (dx / dist) * 360;
        vy = (dy / dist) * 360 - 60; // slight arc
      }

      world.projectiles.push(new Projectile(spawnX, spawnY, vx, vy, 22, this.faction));
    }

    performMeleeAttack(target, world) {
      this.facing = target.x > this.x ? 1 : -1;
      if (this.attackTimer <= 0) {
        this.swingTime = 0.8;
        this.attackTimer = this.attackCooldown;
        target.takeDamage(this.damage, world);
        audio.playSwordSlash();
      }
    }

    performGateAttack(tower, world) {
      if (this.attackTimer <= 0) {
        this.swingTime = 0.8;
        this.attackTimer = this.attackCooldown;
        tower.damageGate(this.damage, world);
        audio.playSwordSlash();
        audio.playHit();
      }
    }

    performCoreAttack(tower, world) {
      if (this.attackTimer <= 0) {
        this.swingTime = 0.8;
        this.attackTimer = this.attackCooldown;
        tower.damageCore(this.damage, world);
        audio.playSwordSlash();
        audio.playHit();
      }
    }

    applyPlatformPhysics(dt, world) {
      // Apply gravity unless on ladder
      this.vy += 650 * dt;
    }

    resolveFloorCollisions(world) {
      // In Citadel tower bounds
      const inTower = Math.abs(this.x - PLAYER_TOWER_X) < (TOWER_WIDTH / 2);
      if (inTower && this.faction === 'player') {
        // 1. Basement floor check
        if (this.y >= BASEMENT_Y) {
          this.y = BASEMENT_Y;
          this.vy = 0;
          this.onLadder = false;
          return;
        }

        // If currently on ladder climbing, don't snap to floor
        if (this.onLadder) return;

        // 2. Check each active Citadel floor (from top floor down to ground)
        for (let f = world.playerFloors; f >= 1; f--) {
          const floorY = (f === 1) ? GROUND_Y : (GROUND_Y - (f - 1) * FLOOR_HEIGHT);
          // If feet are falling onto or standing on this floor level
          if (this.vy >= 0 && this.y >= floorY - 6 && this.y <= floorY + 16) {
            this.y = floorY;
            this.vy = 0;
            return;
          }
        }
      } else {
        // Outside tower: Ground is floor
        if (this.y >= GROUND_Y) {
          this.y = GROUND_Y;
          this.vy = 0;
          this.onLadder = false;
        }
      }
    }

    draw(ctx) {
      if (this.isDead) return;

      ctx.save();
      ctx.translate(this.x, this.y);

      // Hit flash white effect
      if (this.hitFlash > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
      }

      // Colors by Faction
      let primaryColor = '#38bdf8'; // Blue
      let accentColor = '#0284c7';
      if (this.faction === 'red') {
        primaryColor = '#ef4444';
        accentColor = '#b91c1c';
      } else if (this.faction === 'purple') {
        primaryColor = '#c084fc';
        accentColor = '#7e22ce';
      }

      // Reticle for Direct Controlled
      if (this.isDirectControlled) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, -22, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Little Crown on Head
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-7, -46);
        ctx.lineTo(-4, -42);
        ctx.lineTo(0, -48);
        ctx.lineTo(4, -42);
        ctx.lineTo(7, -46);
        ctx.lineTo(5, -39);
        ctx.lineTo(-5, -39);
        ctx.closePath();
        ctx.fill();
      }

      const isWalking = Math.abs(this.vx) > 5;
      const legAngle = isWalking ? Math.sin(this.animTime) * 0.55 : 0;
      const armAngle = isWalking ? -Math.sin(this.animTime) * 0.45 : 0;
      const swingOffset = this.swingTime > 0 ? (1 - this.swingTime) * Math.PI : 0;

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Guard Marker for Units Ordered to Stand Ground
      if (this.order === 'stand_ground') {
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Small shield badge above head if not direct controlled
        if (!this.isDirectControlled) {
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🛡️', 0, -43);
        }
        ctx.restore();
      }

      ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : primaryColor;

      // 1. LEGS (Thigh + Shin)
      // Left leg
      ctx.beginPath();
      ctx.moveTo(0, -16);
      const lKneeX = Math.sin(legAngle) * 10;
      const lKneeY = -8 + Math.cos(legAngle) * 4;
      ctx.lineTo(lKneeX, lKneeY);
      ctx.lineTo(lKneeX + Math.sin(legAngle) * 8, 0);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(0, -16);
      const rKneeX = Math.sin(-legAngle) * 10;
      const rKneeY = -8 + Math.cos(-legAngle) * 4;
      ctx.lineTo(rKneeX, rKneeY);
      ctx.lineTo(rKneeX + Math.sin(-legAngle) * 8, 0);
      ctx.stroke();

      // 2. TORSO
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, -32);
      ctx.stroke();

      // 3. HEAD & HEADBAND/HELMET
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, -38, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Headband / Cap
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(0, -39, 7, Math.PI, 0);
      ctx.fill();

      // Eyes facing
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(3 * this.facing, -38, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 4. ARMS & WEAPONS
      const shoulderY = -30;

      // Off-hand / Shield (Infantry)
      if (this.role === 'infantry' && !this.onLadder && !this.isMining) {
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(-6 * this.facing, shoulderY + 8);
        ctx.stroke();

        // Buckler Shield
        ctx.fillStyle = accentColor;
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-8 * this.facing, shoulderY + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Main Hand (Weapon arm)
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : primaryColor;

      let handX = 8 * this.facing;
      let handY = shoulderY + 8;

      if (this.onLadder) {
        // Climbing alternating arms
        handX = Math.sin(this.animTime) * 6;
        handY = shoulderY - 8;
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.stroke();
      } else if (this.manningTurret) {
        // Turret gunner grips console
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(10 * this.facing, shoulderY + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(12 * this.facing, shoulderY - 2);
        ctx.stroke();
      } else if (this.isMining || (this.swingTime > 0 && this.y > GROUND_Y + 40)) {
        // Mining overhead swing
        const mineAngle = -Math.PI / 3 + (this.swingTime > 0 ? (1 - this.swingTime) * 1.8 : Math.sin(this.animTime * 0.8) * 0.5);
        handX = Math.cos(mineAngle) * 14 * this.facing;
        handY = shoulderY + Math.sin(mineAngle) * 14;

        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Draw Pickaxe
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(mineAngle * this.facing);
        ctx.strokeStyle = '#92400e'; // Wood handle
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, -18);
        ctx.stroke();

        // Pick head
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -16, 12, -0.6, 0.6);
        ctx.stroke();
        ctx.restore();

      } else if (this.role === 'archer') {
        // Bow arm extended
        handX = 14 * this.facing;
        handY = shoulderY + 2;
        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Bow Stave
        ctx.save();
        ctx.translate(handX, handY);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();
        // Bow string
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(-4 * this.facing, 0);
        ctx.lineTo(0, 11);
        ctx.stroke();
        ctx.restore();

      } else {
        // Sword arm with slash animation
        const attackRot = this.swingTime > 0 ? Math.sin((1 - this.swingTime) * Math.PI) * 1.8 : armAngle;
        handX = Math.cos(attackRot) * 12 * this.facing;
        handY = shoulderY + 8 + Math.sin(attackRot) * 8;

        ctx.beginPath();
        ctx.moveTo(0, shoulderY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Draw Sword
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate((attackRot + 0.3) * this.facing);
        // Blade
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(16 * this.facing, -14);
        ctx.stroke();
        // Guard
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3 * this.facing, 0);
        ctx.lineTo(3 * this.facing, 4);
        ctx.stroke();
        ctx.restore();
      }

      // Small overhead HP Bar
      const hpPct = Math.max(0, this.hp / this.maxHp);
      const barW = 26;
      const barH = 3;
      const barY = -52;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = hpPct > 0.4 ? '#10b981' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);

      ctx.restore();
    }
  }

  // ============================================================================
  // TOWER CLASS
  // ============================================================================
  class Tower {
    constructor(x, faction = 'player', name = 'Citadel', tier = 1, direction = 'center', theme = null) {
      this.x = x;
      this.faction = faction;
      this.name = name;
      this.tier = tier;
      this.direction = direction; // 'west', 'east', 'center'
      this.theme = theme || getTierTheme(tier, direction);
      this.width = faction === 'player' ? TOWER_WIDTH : Math.min(340, TOWER_WIDTH + (tier - 1) * 15);
      this.floorsCount = faction === 'player' ? 1 : Math.min(12, 2 + tier);

      const gateScale = Math.pow(1.5, tier - 1);
      const coreScale = Math.pow(1.6, tier - 1);

      this.maxGateHp = faction === 'player' ? 1200 : Math.round(600 * gateScale);
      this.gateHp = this.maxGateHp;
      this.gateX = (direction === 'west' || faction === 'red')
        ? (x + this.width / 2)
        : (x - this.width / 2);

      this.maxCoreHp = faction === 'player' ? 2000 : Math.round(800 * coreScale);
      this.coreHp = this.maxCoreHp;

      this.bounty = Math.round(500 * Math.pow(1.5, tier - 1));
      this.conquered = false;
      this.spawnTimer = Math.max(5, 12 - tier * 0.7);
      this.raidTimer = Math.max(14, 26 - tier * 1.2);

      // Automated defenses (Ballista on Player Citadel or high-tier enemy fortresses)
      this.ballistaCooldown = Math.max(2.0, 3.5 - tier * 0.2);
      this.ballistaTimer = 0;
    }

    damageGate(amount, world) {
      if (this.gateHp <= 0) return;
      if (this.faction !== 'player' && world && world.truceTimer > 0) {
        world.breakTruceEarly('gate_attack');
      }
      this.gateHp = Math.max(0, this.gateHp - amount);
      world.floatingTexts.push(new FloatingText(`-${amount}`, this.gateX, GROUND_Y - 50, '#f97316', 15));
      if (this.gateHp === 0) {
        world.floatingTexts.push(new FloatingText(`GATE BREACHED!`, this.gateX, GROUND_Y - 80, '#ef4444', 20));
        world.spawnSparks(this.gateX, GROUND_Y - 40, '#f97316', 25);
      }
    }

    damageCore(amount, world) {
      if (this.conquered) return;
      if (this.faction !== 'player' && world && world.truceTimer > 0) {
        world.breakTruceEarly('core_attack');
      }
      this.coreHp = Math.max(0, this.coreHp - amount);
      world.floatingTexts.push(new FloatingText(`-${amount}`, this.x, GROUND_Y - 70, '#ef4444', 18));

      if (this.coreHp === 0) {
        this.conquered = true;
        this.coreHp = 0;
        audio.playConquer();
        world.floatingTexts.push(new FloatingText(`CONQUERED!`, this.x, GROUND_Y - 120, '#fef08a', 26));
        world.spawnSparks(this.x, GROUND_Y - 60, '#f59e0b', 50);

        if (this.faction !== 'player') {
          world.addMoney(this.bounty);
          world.floatingTexts.push(new FloatingText(`+$${this.bounty} TIER ${toRoman(this.tier)} BOUNTY!`, this.x, GROUND_Y - 150, '#fef08a', 24));
          if (world.onTowerConquered) {
            world.onTowerConquered(this);
          }
        }
      }
    }

    update(dt, world) {
      if (this.conquered) return;

      // Enemy AI Tower behavior
      if (this.faction !== 'player') {
        const isActiveFrontier = (this.direction === 'west' && (!world.getActiveWestTower || world.getActiveWestTower() === this)) ||
                                 (this.direction === 'east' && (!world.getActiveEastTower || world.getActiveEastTower() === this));

        const isTruceActive = (world.truceTimer && world.truceTimer > 0);

        if (isActiveFrontier && !isTruceActive) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            this.spawnTimer = Math.max(6, 12 - this.tier * 0.7);
            const role = (this.tier >= 2 && Math.random() < 0.35) ? 'archer' : 'infantry';
            world.spawnUnit(this.x, GROUND_Y, this.faction, role);
          }

          this.raidTimer -= dt;
          if (this.raidTimer <= 0) {
            this.raidTimer = Math.max(14, 25 - this.tier);
            const raidCount = Math.min(5, 1 + this.tier);
            for (let i = 0; i < raidCount; i++) {
              setTimeout(() => {
                if (!this.conquered) {
                  const role = (this.tier >= 2 && i % 2 === 1) ? 'archer' : 'infantry';
                  world.spawnUnit(this.x, GROUND_Y, this.faction, role);
                }
              }, i * 1400);
            }
          }

          // Enemy High-Tier Fortress Defenses: Roof Ballista (Tier 3+)
          if (this.tier >= 3) {
            this.ballistaTimer = Math.max(0, this.ballistaTimer - dt);
            if (this.ballistaTimer <= 0) {
              const targetUnit = world.findNearestPlayerUnit(this, 580);
              if (targetUnit) {
                this.ballistaTimer = this.ballistaCooldown;
                const roofY = GROUND_Y - this.floorsCount * FLOOR_HEIGHT - 20;
                const dx = targetUnit.x - this.x;
                const dy = targetUnit.y - roofY;
                const dist = Math.hypot(dx, dy);
                const vx = (dx / dist) * 440;
                const vy = (dy / dist) * 440 - 30;
                world.projectiles.push(new Projectile(this.x, roofY, vx, vy, 28 + this.tier * 4, this.faction, true));
                audio.playBowFire();
              }
            }
          }
        }
      } else {
        // Player Citadel Ballista Defense (Floor 4+)
        if (world.playerFloors >= 4) {
          this.ballistaTimer = Math.max(0, this.ballistaTimer - dt);
          if (this.ballistaTimer <= 0) {
            const enemy = world.findNearestEnemy({ x: this.x, y: GROUND_Y, faction: 'player' }, 650);
            if (enemy) {
              this.ballistaTimer = this.ballistaCooldown;
              const roofY = GROUND_Y - world.playerFloors * FLOOR_HEIGHT - 20;
              const dx = enemy.x - this.x;
              const dy = enemy.y - roofY;
              const dist = Math.hypot(dx, dy);
              const speed = 450 + Math.min(300, world.playerFloors * 15);
              const vx = (dx / dist) * speed;
              const vy = (dy / dist) * speed - 40;
              world.projectiles.push(new Projectile(this.x, roofY, vx, vy, 45, 'player', true));
              audio.playBowFire();
            }
          }
        }
      }
    }

    draw(ctx, world) {
      const halfW = this.width / 2;
      const left = this.x - halfW;
      const right = this.x + halfW;

      ctx.save();

      if (this.faction === 'player') {
        // ====================================================================
        // MODERN SKYSCRAPER OFFICE ARCHITECTURE (Player Citadel)
        // ====================================================================
        const floorsCount = world.playerFloors;

        // Draw each Skyscraper Office Floor
        for (let f = 1; f <= floorsCount; f++) {
          const floorBottom = GROUND_Y - (f - 1) * FLOOR_HEIGHT;
          const floorTop = floorBottom - FLOOR_HEIGHT;

          // 1. High-Tech Glass Curtain Wall (Deep reflective gradient)
          const glassGrad = ctx.createLinearGradient(left, floorTop, right, floorBottom);
          glassGrad.addColorStop(0, '#0c1b30');
          glassGrad.addColorStop(0.4, '#132c4d');
          glassGrad.addColorStop(0.7, '#1b3b64');
          glassGrad.addColorStop(1, '#0e2038');
          ctx.fillStyle = glassGrad;
          ctx.fillRect(left, floorTop, this.width, FLOOR_HEIGHT);

          // 2. Concrete & Steel Floor Slabs with illuminated spandrel
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(left - 4, floorBottom - 8, this.width + 8, 8);
          ctx.fillStyle = '#475569';
          ctx.fillRect(left - 4, floorBottom - 2, this.width + 8, 2);

          // LED Floor Edge Accent
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fillRect(left - 4, floorBottom - 8, this.width + 8, 1.5);

          // 3. Vertical Steel Mullions / Window Columns
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = 2;
          for (let mx = left + 24; mx < right; mx += 38) {
            ctx.beginPath();
            ctx.moveTo(mx, floorTop);
            ctx.lineTo(mx, floorBottom - 8);
            ctx.stroke();
          }

          // 4. Overhead Recessed Office Ceiling Lights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          for (let lx = left + 30; lx < right - 20; lx += 45) {
            ctx.fillRect(lx, floorTop + 2, 22, 3);
          }

          // 5. Interior Details according to Chosen Floor Purpose
          if (f === 1) {
            // FLOOR 1: Grand Recruitment Headquarters ($75 standard recruits)
            // Reception & Recruiter Desk
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(this.x - 70, floorBottom - 26, 48, 18);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(this.x - 70, floorBottom - 26, 48, 3);
            // Computer Monitor glowing cyan
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(this.x - 56, floorBottom - 38, 16, 11);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(this.x - 50, floorBottom - 27, 4, 3);
            // Potted Corporate Plant
            ctx.fillStyle = '#b45309';
            ctx.fillRect(left + 15, floorBottom - 20, 12, 12);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(left + 21, floorBottom - 24, 9, 0, Math.PI * 2);
            ctx.fill();
            // Recruitment Sign
            ctx.font = 'bold 8px "Outfit", sans-serif';
            ctx.fillStyle = '#7dd3fc';
            ctx.textAlign = 'center';
            ctx.fillText('RECRUITMENT HQ ($75)', this.x - 46, floorTop + 22);

            // Floor Badge
            ctx.font = 'bold 8px "Outfit", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText(`L1: RECRUITMENT`, this.x - 75, floorTop + 14);

          } else {
            const purpose = (world.floorPurposes && world.floorPurposes[f]) ? world.floorPurposes[f] : 'turrets';

            if (purpose === 'turrets') {
              // TURRET DEFENSE PLATFORM
              // Caution hazard stripes on floor plates
              ctx.save();
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(left + 4, floorBottom - 10, this.width - 8, 4);
              ctx.fillStyle = '#f59e0b';
              for (let hx = left + 10; hx < right - 10; hx += 16) {
                ctx.fillRect(hx, floorBottom - 10, 8, 4);
              }
              ctx.restore();

              // Left Gunner Station & Control Console (for West Turret)
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(left + 10, floorBottom - 26, 32, 18);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(left + 16, floorBottom - 38, 16, 11); // Targeting screen
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.beginPath(); // Cable to left wall turret
              ctx.moveTo(left + 10, floorBottom - 18);
              ctx.lineTo(left, floorBottom - 45);
              ctx.stroke();

              // Right Gunner Station & Control Console (for East Turret)
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(right - 42, floorBottom - 26, 32, 18);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(right - 34, floorBottom - 38, 16, 11); // Targeting screen
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.beginPath(); // Cable to right wall turret
              ctx.moveTo(right - 10, floorBottom - 18);
              ctx.lineTo(right, floorBottom - 45);
              ctx.stroke();

              // Center Ammo Battery Rack
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(this.x - 30, floorBottom - 24, 20, 16);
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(this.x - 28, floorBottom - 22, 16, 5);
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(this.x - 28, floorBottom - 15, 16, 5);

              // Platform Sign
              ctx.font = 'bold 8px "Outfit", sans-serif';
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'center';
              ctx.fillText('TURRET DEFENSE PLATFORM', this.x, floorTop + 22);

              // Floor Badge
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.fillText(`L${f}: TURRET PLATFORM`, this.x - 65, floorTop + 14);

            } else if (purpose === 'recruitment') {
              // SECONDARY RECRUITMENT CENTER
              // Dual Recruitment Desks
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(left + 25, floorBottom - 22, 38, 14);
              ctx.fillRect(right - 65, floorBottom - 22, 38, 14);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(left + 32, floorBottom - 34, 14, 11);
              ctx.fillStyle = '#10b981';
              ctx.fillRect(right - 56, floorBottom - 34, 14, 11);

              // Recruit Lockers
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(this.x - 45, floorBottom - 32, 22, 24);
              ctx.strokeStyle = '#475569';
              ctx.strokeRect(this.x - 45, floorBottom - 32, 22, 24);

              // Center Sign
              ctx.font = 'bold 8px "Outfit", sans-serif';
              ctx.fillStyle = '#10b981';
              ctx.textAlign = 'center';
              ctx.fillText('RECRUITMENT WING (+POP)', this.x, floorTop + 22);

              // Floor Badge
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.fillText(`L${f}: RECRUITMENT`, this.x - 70, floorTop + 14);

            } else if (purpose === 'archers') {
              // SNIPER BALCONY
              ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
              ctx.fillRect(left + 6, floorBottom - 24, 28, 16);
              ctx.fillRect(right - 34, floorBottom - 24, 28, 16);
              // Compound Bow Racks
              ctx.strokeStyle = '#b45309';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(this.x - 30, floorBottom - 18, 10, -1, 1);
              ctx.stroke();
              // Sign
              ctx.font = 'bold 8px "Outfit", sans-serif';
              ctx.fillStyle = '#f59e0b';
              ctx.textAlign = 'center';
              ctx.fillText('SNIPER BALCONY', this.x, floorTop + 22);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.fillText(`L${f}: SNIPER`, this.x - 75, floorTop + 14);

            } else if (purpose === 'armory') {
              // SECURITY ARMORY
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(left + 20, floorBottom - 26, 45, 18);
              ctx.fillStyle = '#475569';
              ctx.fillRect(right - 65, floorBottom - 30, 30, 22); // Armor locker
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(left + 25, floorTop + 18, 40, 14); // Weapons rack
              // Sign
              ctx.font = 'bold 8px "Outfit", sans-serif';
              ctx.fillStyle = '#ef4444';
              ctx.textAlign = 'center';
              ctx.fillText('SECURITY ARMORY (+BUFF)', this.x, floorTop + 22);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.fillText(`L${f}: ARMORY`, this.x - 75, floorTop + 14);
            }
          }
        }

        // 6. MODERN HIGH-TECH BASEMENT (Server Data Center & Bullion Vault)
        const baseTop = GROUND_Y;
        const baseBottom = BASEMENT_Y;
        const baseH = baseBottom - baseTop;

        // Subterranean high-security concrete & dark acoustic panels
        ctx.fillStyle = '#040711';
        ctx.fillRect(left, baseTop, this.width, baseH + 10);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, baseTop, this.width, baseH);

        // Server Racks with Blinking Status LEDs
        const serverX1 = left + 14;
        const serverX2 = this.x + 40;
        const drawServerRack = (rx) => {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(rx, baseTop + 14, 28, baseH - 22);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, baseTop + 14, 28, baseH - 22);

          // Blinking LEDs
          const now = Date.now();
          for (let sy = baseTop + 20; sy < baseBottom - 12; sy += 10) {
            const ledColor1 = Math.sin(now * 0.007 + sy) > 0 ? '#10b981' : '#065f46';
            const ledColor2 = Math.cos(now * 0.005 + sy) > 0 ? '#38bdf8' : '#0369a1';
            ctx.fillStyle = ledColor1;
            ctx.fillRect(rx + 4, sy, 3, 3);
            ctx.fillStyle = ledColor2;
            ctx.fillRect(rx + 10, sy, 3, 3);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(rx + 18, sy, 5, 2);
          }
        };
        drawServerRack(serverX1);
        drawServerRack(serverX2);

        // High-Security Vault Safe / Gold Node Terminal
        const vaultX = this.x - 45;
        const vaultY = baseBottom - 6;

        // Titanium Reinforced Vault Door Frame
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(vaultX - 25, vaultY - 46, 50, 46);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(vaultX - 25, vaultY - 46, 50, 46);

        // Vault Digital Keypad / Hologram
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(vaultX + 16, vaultY - 30, 6, 8);

        // Gold Bullion Stacks Node
        const pulse = Math.sin(Date.now() * 0.006) * 3;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12 + pulse;
        for (let bx = -14; bx <= 6; bx += 8) {
          ctx.fillRect(vaultX + bx, vaultY - 14, 12, 6);
          ctx.fillRect(vaultX + bx + 3, vaultY - 22, 12, 6);
        }
        ctx.shadowBlur = 0;

        // Vault Sign
        ctx.font = 'bold 8px "Outfit", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText('FINANCIAL VAULT', vaultX, vaultY - 52);
        ctx.font = '7px "Outfit", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('[Crypto & Gold Mining]', vaultX, vaultY - 42);

        // 7. CENTRAL ELEVATOR SHAFT & STEEL LADDER
        const ladderX = this.x;
        const ladderTop = GROUND_Y - (world.playerFloors - 1) * FLOOR_HEIGHT - 6;
        const ladderBottom = BASEMENT_Y;

        // Steel Guide Cables
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ladderX - 16, ladderTop);
        ctx.lineTo(ladderX - 16, ladderBottom);
        ctx.moveTo(ladderX + 16, ladderTop);
        ctx.lineTo(ladderX + 16, ladderBottom);
        ctx.stroke();

        // Modern Steel Service Ladder Rails
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ladderX - 9, ladderTop);
        ctx.lineTo(ladderX - 9, ladderBottom);
        ctx.moveTo(ladderX + 9, ladderTop);
        ctx.lineTo(ladderX + 9, ladderBottom);
        ctx.stroke();

        // Ladder rungs
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        for (let ly = ladderTop + 8; ly < ladderBottom; ly += 14) {
          ctx.beginPath();
          ctx.moveTo(ladderX - 9, ly);
          ctx.lineTo(ladderX + 9, ly);
          ctx.stroke();
        }

        // 8. ROOF HELIPAD & COMMUNICATIONS SPIRE
        const roofY = GROUND_Y - floorsCount * FLOOR_HEIGHT;

        // Modern Roof Parapet
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(left - 8, roofY - 8, this.width + 16, 8);
        ctx.fillStyle = '#475569';
        ctx.fillRect(left - 8, roofY - 10, this.width + 16, 2);

        // ROOFTOP HELIPAD
        const heliX = this.x;
        const heliY = roofY - 2;
        // Helipad Base Pad
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(heliX - 32, heliY - 26, 64, 24);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(heliX - 32, heliY - 26, 64, 24);

        // Helipad Yellow Circle
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(heliX, heliY - 14, 18, 0, Math.PI * 2);
        ctx.stroke();

        // White 'H' Letter in Helipad
        ctx.font = 'bold 15px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', heliX, heliY - 14);
        ctx.textBaseline = 'alphabetic';

        // Communications Spire Mast (Left side)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(left + 22, roofY - 8);
        ctx.lineTo(left + 22, roofY - 58);
        ctx.stroke();

        // Blinking Red Aviation Beacon
        const beaconOn = Math.sin(Date.now() * 0.007) > 0.2;
        if (beaconOn) {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(left + 22, roofY - 60, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Satellite Communications Dish (Right side)
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(right - 30, roofY - 24, 14, -1.2, 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(right - 30, roofY - 24);
        ctx.lineTo(right - 30, roofY - 8);
        ctx.stroke();

        // Roof Ballista / Heavy Defense Turret (Floor 4+)
        if (world.playerFloors >= 4) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(this.x + 36, roofY - 20, 24, 12);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(this.x + 48, roofY - 22, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // High-Tech Quantum Corporate Core
        const coreX = this.x;
        const coreY = GROUND_Y - 25;
        const corePulse = Math.sin(Date.now() * 0.006) * 4;

        ctx.fillStyle = '#0284c7';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15 + corePulse;
        ctx.beginPath();
        ctx.moveTo(coreX, coreY - 24);
        ctx.lineTo(coreX + 14, coreY);
        ctx.lineTo(coreX, coreY + 14);
        ctx.lineTo(coreX - 14, coreY);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core HP Bar
        const coreHpPct = Math.max(0, this.coreHp / this.maxCoreHp);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(coreX - 30, coreY - 38, 60, 5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(coreX - 30, coreY - 38, 60 * coreHpPct, 5);

        // Modern Motorized Security Gate
        if (this.gateHp > 0) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(this.gateX - 8, GROUND_Y - 82, 16, 82);
          // Neon security laser barrier
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          for (let gy = GROUND_Y - 70; gy < GROUND_Y; gy += 14) {
            ctx.beginPath();
            ctx.moveTo(this.gateX - 6, gy);
            ctx.lineTo(this.gateX + 6, gy);
            ctx.stroke();
          }

          // Gate HP Bar
          const gatePct = Math.max(0, this.gateHp / this.maxGateHp);
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(this.gateX - 25, GROUND_Y - 96, 50, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(this.gateX - 25, GROUND_Y - 96, 50 * gatePct, 5);
        }

        // Skyscraper Brand Banner
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText('CITADEL TOWER HQ', this.x, roofY - 32);

      } else {
        // ====================================================================
        // RIVAL ENEMY AI FORTRESSES (Procedural Infinite Expanding Towers)
        // ====================================================================
        const floorsCount = this.floorsCount || Math.min(12, 2 + this.tier);
        const theme = this.theme || getTierTheme(this.tier, this.direction);

        for (let f = 1; f <= floorsCount; f++) {
          const floorBottom = GROUND_Y - (f - 1) * FLOOR_HEIGHT;
          const floorTop = floorBottom - FLOOR_HEIGHT;

          // Wall background
          ctx.fillStyle = this.conquered ? '#0f2847' : theme.wall;
          ctx.fillRect(left, floorTop, this.width, FLOOR_HEIGHT);

          // Stone Brick Lines
          ctx.strokeStyle = this.conquered ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let y = floorTop; y < floorBottom; y += 22) {
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();
          }

          // Floor beam
          ctx.fillStyle = this.conquered ? '#1e293b' : theme.trim;
          ctx.fillRect(left - 6, floorBottom - 6, this.width + 12, 8);
          if (this.conquered) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.fillRect(left - 6, floorBottom - 6, this.width + 12, 2);
          }

          // Windows & Archways
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(left + 35, floorTop + 30, 20, 36);
          ctx.fillRect(right - 55, floorTop + 30, 20, 36);

          // Torch / Allied LED flicker
          const flicker = Math.sin(Date.now() * 0.008 + f) * 2;
          const torchColor = this.conquered ? '#38bdf8' : theme.torch;
          ctx.fillStyle = torchColor;
          ctx.beginPath();
          ctx.arc(left + 25, floorTop + 45 + flicker, 4, 0, Math.PI * 2);
          ctx.fill();

          // Floor tier Roman numeral inscription on middle floor
          if (f === Math.ceil(floorsCount / 2)) {
            ctx.font = 'bold 9px "Cinzel", serif';
            ctx.fillStyle = this.conquered ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)';
            ctx.textAlign = 'center';
            ctx.fillText(`TIER ${toRoman(this.tier)}`, this.x, floorTop + 24);
          }
        }

        // ROOF BATTLEMENTS & CREST
        const roofY = GROUND_Y - floorsCount * FLOOR_HEIGHT;
        ctx.fillStyle = this.conquered ? '#1e293b' : theme.trim;
        ctx.fillRect(left - 10, roofY, this.width + 20, 14);

        for (let bx = left - 10; bx < right + 10; bx += 24) {
          ctx.fillRect(bx, roofY - 14, 14, 14);
        }

        // Tower Flag
        const flagColor = this.conquered ? '#0284c7' : theme.flag;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(this.x - 2, roofY - 50, 4, 50);
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 2, roofY - 48);
        ctx.lineTo(this.x + 36, roofY - 38);
        ctx.lineTo(this.x + 2, roofY - 28);
        ctx.closePath();
        ctx.fill();

        // Roof Ballista (Tier 3+ Fortresses)
        if (this.tier >= 3 && !this.conquered) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(this.x - 16, roofY - 24, 32, 12);
          ctx.fillStyle = theme.flag;
          ctx.beginPath();
          ctx.arc(this.x, roofY - 24, 7, 0, Math.PI * 2);
          ctx.fill();
        }

        // INNER CORE
        const coreX = this.x;
        const coreY = GROUND_Y - 25;
        const corePulse = Math.sin(Date.now() * 0.006) * 4;

        ctx.fillStyle = this.conquered ? '#0284c7' : theme.core;
        ctx.shadowColor = this.conquered ? '#38bdf8' : theme.core;
        ctx.shadowBlur = 12 + corePulse;
        ctx.beginPath();
        ctx.moveTo(coreX, coreY - 24);
        ctx.lineTo(coreX + 14, coreY);
        ctx.lineTo(coreX, coreY + 14);
        ctx.lineTo(coreX - 14, coreY);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core HP Bar
        if (!this.conquered) {
          const coreHpPct = Math.max(0, this.coreHp / this.maxCoreHp);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(coreX - 30, coreY - 38, 60, 5);
          ctx.fillStyle = theme.flag;
          ctx.fillRect(coreX - 30, coreY - 38, 60 * coreHpPct, 5);
        } else {
          // Allied outpost indicator
          ctx.font = 'bold 8px "Outfit", sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText('OUTPOST TRIBUTE: +$1.5/s', coreX, coreY - 36);
        }

        // TOWER GATE
        if (this.gateHp > 0) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(this.gateX - 8, GROUND_Y - 80, 16, 80);
          ctx.fillStyle = '#94a3b8';
          for (let gy = GROUND_Y - 70; gy < GROUND_Y; gy += 16) {
            ctx.fillRect(this.gateX - 5, gy, 10, 3);
          }

          const gatePct = Math.max(0, this.gateHp / this.maxGateHp);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(this.gateX - 25, GROUND_Y - 95, 50, 5);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(this.gateX - 25, GROUND_Y - 95, 50 * gatePct, 5);
        } else if (this.conquered) {
          // Conquered open security arch
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(this.gateX - 8, GROUND_Y - 80, 16, 80);
        }

        // Title & Tier Banner
        ctx.font = 'bold 12px "Cinzel", serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(this.name.toUpperCase(), this.x, roofY - 58);

        ctx.font = 'bold 9px "Outfit", sans-serif';
        ctx.fillStyle = this.conquered ? '#38bdf8' : '#fef08a';
        const statusText = this.conquered 
          ? `★ ALLIED OUTPOST [TIER ${toRoman(this.tier)}] ★` 
          : `TIER ${toRoman(this.tier)} FORTRESS (${floorsCount} FLOORS)`;
        ctx.fillText(statusText, this.x, roofY - 44);
      }

      ctx.restore();
    }
  }

  // ============================================================================
  // MAIN GAME ENGINE & WORLD
  // ============================================================================
  class GameEngine {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.minimapCanvas = document.getElementById('minimapCanvas');
      this.minimapCtx = this.minimapCanvas.getContext('2d');

      // World state & Treasury
      this.money = 25;
      this.goldMined = 0;
      this.enemiesSlain = 0;
      this.unitsRecruited = 0;
      this.truceTimer = 300; // 5-minute truce (300 seconds)

      // Floor specialization mapping: 0=basement, 1=recruitment, 2+=chosen purpose
      this.playerFloors = 1; // 1 = Ground + Basement
      this.floorPurposes = {
        0: 'treasury',
        1: 'recruitment'
      };
      this.selectedPurposeForNextFloor = 'recruitment';
      this.isShopOpen = false;

      // Entities
      this.units = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];

      // Dynamic World Bounds (Initially 0..4400, expands outward infinitely as towers are conquered)
      this.worldLeft = 0;
      this.worldRight = 4400;

      // Towers: Player Citadel at center, procedural tower lists extending outward
      this.playerTower = new Tower(PLAYER_TOWER_X, 'player', 'Citadel of Light', 1, 'center');
      this.westTowers = [
        new Tower(WEST_TOWER_X, 'red', 'Crimson Vanguard', 1, 'west', getTierTheme(1, 'west'))
      ];
      this.eastTowers = [
        new Tower(EAST_TOWER_X, 'purple', 'Shadow Legion', 1, 'east', getTierTheme(1, 'east'))
      ];

      // Camera & Cursor tracking
      this.camX = PLAYER_TOWER_X - window.innerWidth / 2;
      this.camY = 0;
      this.targetCamX = this.camX;
      this.targetCamY = 0;
      this.isDraggingCam = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.camStartX = 0;
      this.camStartY = 0;
      this.mouseWorldPos = { x: PLAYER_TOWER_X, y: GROUND_Y };

      // Selection & Turrets
      this.controlledUnit = null;
      this.keys = {};
      this.isPaused = false;
      this.wallTurrets = [];

      // DOM Elements Cache
      this.dom = {
        goldValue: document.getElementById('gold-value'),
        incomeRate: document.getElementById('income-rate'),
        popValue: document.getElementById('pop-value'),
        trucePill: document.getElementById('truce-pill'),
        truceTimer: document.getElementById('truce-timer'),
        truceIcon: document.getElementById('truce-icon'),
        btnOpenShop: document.getElementById('btn-open-shop'),
        shopModal: document.getElementById('shop-modal'),
        btnCloseShop: document.getElementById('btn-close-shop'),
        btnDismissShop: document.getElementById('btn-dismiss-shop'),
        btnShopRecruit: document.getElementById('btn-shop-recruit'),
        shopRecruitLocation: document.getElementById('shop-recruit-location'),
        shopPopCounter: document.getElementById('shop-pop-counter'),
        shopFloorCard: document.getElementById('shop-floor-card'),
        shopNextFloorNum: document.getElementById('shop-next-floor-num'),
        shopFloorCostTag: document.getElementById('shop-floor-cost-tag'),
        purposeFloorLabel: document.getElementById('purpose-floor-label'),
        purposeOptions: document.getElementById('purpose-options'),
        builtFloorsManager: document.getElementById('built-floors-manager'),
        builtFloorsList: document.getElementById('built-floors-list'),
        btnShopBuyFloor: document.getElementById('btn-shop-buy-floor'),
        shopTurretCard: document.getElementById('shop-turret-card'),
        shopTurretCount: document.getElementById('shop-turret-count'),
        shopMaxTurrets: document.getElementById('shop-max-turrets'),
        turretRestrictionNote: document.getElementById('turret-restriction-note'),
        btnShopBuyTurret: document.getElementById('btn-shop-buy-turret'),
        shopTreasuryVal: document.getElementById('shop-treasury-val'),
        btnPause: document.getElementById('btn-pause'),
        pauseModal: document.getElementById('pause-modal'),
        btnResume: document.getElementById('btn-resume'),
        btnAudio: document.getElementById('btn-audio'),
        btnCamCitadel: document.getElementById('btn-cam-citadel'),
        btnHelp: document.getElementById('btn-help'),
        directControlHud: document.getElementById('direct-control-hud'),
        portraitCanvas: document.getElementById('portraitCanvas'),
        controlBadge: document.getElementById('control-badge'),
        controlHints: document.getElementById('control-hints'),
        unitName: document.getElementById('unit-name'),
        unitRoleTag: document.getElementById('unit-role-tag'),
        unitHpFill: document.getElementById('unit-hp-fill'),
        unitHpText: document.getElementById('unit-hp-text'),
        btnStandGround: document.getElementById('btn-stand-ground'),
        btnReleaseControl: document.getElementById('btn-release-control'),
        helpModal: document.getElementById('help-modal'),
        btnCloseHelp: document.getElementById('btn-close-help'),
        btnDismissHelp: document.getElementById('btn-dismiss-help'),
        victoryModal: document.getElementById('victory-modal'),
        vstatFloors: document.getElementById('vstat-floors'),
        vstatGold: document.getElementById('vstat-gold'),
        vstatUnits: document.getElementById('vstat-units'),
        vstatKills: document.getElementById('vstat-kills'),
        btnRestart: document.getElementById('btn-restart')
      };

      this.lastTime = performance.now();
      this.setupCanvas();
      this.setupEvents();
      this.initGame();

      requestAnimationFrame(this.loop.bind(this));
    }

    setupCanvas() {
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.viewportW = window.innerWidth;
        this.viewportH = window.innerHeight;
      };
      window.addEventListener('resize', resize);
      resize();
    }

    initGame() {
      // Spawn 5 starting stick figures for the player:
      // 1. Commander under immediate direct control
      const commander = this.spawnUnit(PLAYER_TOWER_X - 15, GROUND_Y, 'player', 'infantry');
      this.setDirectControl(commander);

      // 2, 3, 4. Three Citadel Defense Operatives stationed around the ground level
      const guard1 = this.spawnUnit(PLAYER_TOWER_X - 60, GROUND_Y, 'player', 'infantry');
      guard1.order = 'guard_tower';
      const guard2 = this.spawnUnit(PLAYER_TOWER_X + 25, GROUND_Y, 'player', 'infantry');
      guard2.order = 'guard_tower';
      const guard3 = this.spawnUnit(PLAYER_TOWER_X + 70, GROUND_Y, 'player', 'infantry');
      guard3.order = 'guard_tower';

      // 5. One Worker stationed in the Treasury Basement vault actively mining gold
      const miner = this.spawnUnit(PLAYER_TOWER_X - 50, BASEMENT_Y, 'player', 'worker');
      miner.order = 'work_basement';
      miner.targetFloor = 0;

      this.unitsRecruited = 5;

      // Spawn starting enemy stick figures at their respective fortresses
      this.spawnUnit(WEST_TOWER_X, GROUND_Y, 'red', 'infantry');
      this.spawnUnit(EAST_TOWER_X, GROUND_Y, 'purple', 'infantry');

      this.updateHUD();
    }

    breakTruceEarly(reason = 'player_attack') {
      if (this.truceTimer <= 0) return;
      this.truceTimer = 0;
      audio.playAlert();
      const msg = reason === 'gate_attack'
        ? "⚔️ ENEMY GATE ATTACKED! TRUCE BROKEN EARLY!"
        : (reason === 'core_attack'
          ? "⚔️ ENEMY CORE ATTACKED! TRUCE BROKEN EARLY!"
          : (reason === 'unit_attack'
            ? "⚔️ ENEMY DEFENDER STRUCK! TRUCE BROKEN EARLY!"
            : "⚔️ TRUCE BROKEN EARLY! ENEMY FORCES MOBILIZING!"));
      this.floatingTexts.push(new FloatingText(msg, PLAYER_TOWER_X, GROUND_Y - 150, '#ef4444', 24));
      this.updateHUD();
    }

    get westTower() {
      return this.getActiveWestTower() || this.westTowers[this.westTowers.length - 1];
    }

    get eastTower() {
      return this.getActiveEastTower() || this.eastTowers[this.eastTowers.length - 1];
    }

    getActiveWestTower() {
      for (const t of this.westTowers) {
        if (!t.conquered) return t;
      }
      return this.westTowers[this.westTowers.length - 1];
    }

    getActiveEastTower() {
      for (const t of this.eastTowers) {
        if (!t.conquered) return t;
      }
      return this.eastTowers[this.eastTowers.length - 1];
    }

    getAllTowers() {
      return [this.playerTower, ...this.westTowers, ...this.eastTowers];
    }

    getConqueredOutpostsCount() {
      return this.westTowers.filter(t => t.conquered).length + this.eastTowers.filter(t => t.conquered).length;
    }

    onTowerConquered(conqueredTower) {
      audio.playConquer();
      const nextTier = conqueredTower.tier + 1;
      const theme = getTierTheme(nextTier, conqueredTower.direction);

      if (conqueredTower.direction === 'west') {
        const nextX = conqueredTower.x - 1600;
        this.worldLeft = Math.min(this.worldLeft, nextX - 800);
        const newTower = new Tower(nextX, 'red', theme.name, nextTier, 'west', theme);
        this.westTowers.push(newTower);

        this.floatingTexts.push(new FloatingText(
          `🏆 TIER ${toRoman(conqueredTower.tier)} CONQUERED! FRONTIER ADVANCED!`,
          conqueredTower.x, GROUND_Y - 220, '#fef08a', 26
        ));
        this.floatingTexts.push(new FloatingText(
          `NEW DISCOVERY: TIER ${toRoman(nextTier)} ${newTower.name}! (${newTower.floorsCount} FLOORS)`,
          nextX + 320, GROUND_Y - 180, '#38bdf8', 22
        ));

        // Spawn a defender at the newly revealed fortress
        this.spawnUnit(nextX, GROUND_Y, 'red', 'infantry');

      } else if (conqueredTower.direction === 'east') {
        const nextX = conqueredTower.x + 1600;
        this.worldRight = Math.max(this.worldRight, nextX + 800);
        const newTower = new Tower(nextX, 'purple', theme.name, nextTier, 'east', theme);
        this.eastTowers.push(newTower);

        this.floatingTexts.push(new FloatingText(
          `🏆 TIER ${toRoman(conqueredTower.tier)} CONQUERED! FRONTIER ADVANCED!`,
          conqueredTower.x, GROUND_Y - 220, '#fef08a', 26
        ));
        this.floatingTexts.push(new FloatingText(
          `NEW DISCOVERY: TIER ${toRoman(nextTier)} ${newTower.name}! (${newTower.floorsCount} FLOORS)`,
          nextX - 320, GROUND_Y - 180, '#c084fc', 22
        ));

        this.spawnUnit(nextX, GROUND_Y, 'purple', 'infantry');
      }

      this.updateHUD();
    }

    setupEvents() {
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Keyboard input
      window.addEventListener('keydown', (e) => {
        audio.init();
        this.keys[e.code] = true;

        if (e.code === 'KeyQ') {
          this.toggleShop();
        } else if (e.code === 'Escape') {
          if (this.isShopOpen) {
            this.toggleShop(false);
          } else {
            this.releaseDirectControl();
          }
        } else if (e.code === 'KeyC') {
          this.centerCameraOn(PLAYER_TOWER_X);
        } else if (e.code === 'KeyH') {
          this.dom.helpModal.classList.toggle('hidden');
        } else if (e.code === 'KeyP') {
          this.togglePause();
        } else if (e.code === 'KeyG') {
          if (this.controlledUnit) {
            this.orderControlledUnitStandGround();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      // Unified Canvas Click & Order System
      const handleCanvasAction = (clientX, clientY, isRightClick = false) => {
        if (this.isShopOpen) return false;
        audio.init();
        const worldPos = this.screenToWorld(clientX, clientY);

        // A. If currently controlling a stick figure manning a turret:
        if (this.controlledUnit && this.controlledUnit.manningTurret) {
          this.controlledUnit.manningTurret.tryDirectFire(this);
          return true;
        }

        // B. Check click on Wall Turrets or manned turret stations
        for (const turret of this.wallTurrets) {
          const station = turret.getStationPos();
          const distToTurret = Math.hypot(turret.x - worldPos.x, turret.y - worldPos.y);
          const distToStation = Math.hypot(station.x - worldPos.x, station.y - worldPos.y);

          if (distToTurret < 38 || distToStation < 32) {
            if (turret.mannedBy) {
              // Direct control the stick figure on the turret!
              this.setDirectControl(turret.mannedBy);
              this.floatingTexts.push(new FloatingText("DIRECT TURRET CONTROL", turret.x, turret.y - 30, '#38bdf8', 18));
              return true;
            } else {
              // Turret is unmanned: order controlled unit or nearest unit to man it
              if (this.controlledUnit) {
                if (Math.abs(this.controlledUnit.x - station.x) < 45 && Math.abs(this.controlledUnit.y - station.y) < 25) {
                  turret.mannedBy = this.controlledUnit;
                  this.controlledUnit.manningTurret = turret;
                  this.controlledUnit.x = station.x;
                  this.controlledUnit.y = station.y;
                  this.controlledUnit.facing = turret.facing;
                  this.updateDirectControlHUD();
                  audio.playBuild();
                  this.floatingTexts.push(new FloatingText("MANNED TURRET [DIRECT CONTROL]", station.x, station.y - 35, '#38bdf8', 18));
                } else {
                  this.controlledUnit.order = 'guard_tower';
                  this.controlledUnit.targetFloor = turret.floorNum;
                  this.floatingTexts.push(new FloatingText("ORDER: Walk to Man Turret", station.x, station.y - 25, '#38bdf8', 16));
                  this.releaseDirectControl(false);
                }
              } else {
                this.dispatchStickFigureToTurret(turret);
              }
              return true;
            }
          }
        }

        // C. Check click on any stick figure
        let clickedUnit = null;
        for (const unit of this.units) {
          if (!unit.isDead && Math.hypot(unit.x - worldPos.x, (unit.y - 20) - worldPos.y) < 28) {
            clickedUnit = unit;
            break;
          }
        }

        if (clickedUnit) {
          if (clickedUnit.faction === 'player') {
            this.setDirectControl(clickedUnit);
            return true;
          } else {
            if (this.controlledUnit) {
              this.controlledUnit.marchTowardsTarget(clickedUnit.x, 0.1, 150);
              return true;
            }
          }
        }

        // D. If a unit is controlled, clicking elsewhere orders it to work/assault there
        if (this.controlledUnit) {
          const inBasement = worldPos.y > (GROUND_Y + 15) && Math.abs(worldPos.x - PLAYER_TOWER_X) < (TOWER_WIDTH / 2);
          const inCitadel = Math.abs(worldPos.x - PLAYER_TOWER_X) < (TOWER_WIDTH / 2) && worldPos.y <= (GROUND_Y + 15);

          if (inBasement) {
            this.controlledUnit.order = 'work_basement';
            this.floatingTexts.push(new FloatingText("ORDER: Work in Basement ($)", worldPos.x, worldPos.y - 20, '#fef08a', 18));
            audio.playMineHit();
            this.releaseDirectControl(false);
            return true;
          }

          if (inCitadel) {
            const floorClicked = Math.min(this.playerFloors, Math.max(1, Math.floor((GROUND_Y - worldPos.y) / FLOOR_HEIGHT) + 1));
            this.controlledUnit.targetFloor = floorClicked;
            this.controlledUnit.order = 'guard_tower';
            if (this.floorPurposes[floorClicked] === 'archers') {
              this.controlledUnit.role = 'archer';
            }
            this.floatingTexts.push(new FloatingText(`ORDER: Guard Floor ${floorClicked}`, worldPos.x, worldPos.y - 20, '#38bdf8', 18));
            audio.playBowFire();
            this.releaseDirectControl(false);
            return true;
          }

          // Assault battlefield orders
          if (worldPos.x < PLAYER_TOWER_X - 350) {
            this.controlledUnit.order = 'attack_west';
            const targetWest = this.getActiveWestTower();
            const targetName = targetWest ? `Tier ${toRoman(targetWest.tier)}: ${targetWest.name}` : 'West Frontier';
            this.floatingTexts.push(new FloatingText(`ORDER: Assault ${targetName}!`, worldPos.x, worldPos.y - 20, '#ef4444', 18));
            audio.playSwordSlash();
            this.releaseDirectControl(false);
            return true;
          } else if (worldPos.x > PLAYER_TOWER_X + 350) {
            this.controlledUnit.order = 'attack_east';
            const targetEast = this.getActiveEastTower();
            const targetName = targetEast ? `Tier ${toRoman(targetEast.tier)}: ${targetEast.name}` : 'East Frontier';
            this.floatingTexts.push(new FloatingText(`ORDER: Assault ${targetName}!`, worldPos.x, worldPos.y - 20, '#c084fc', 18));
            audio.playSwordSlash();
            this.releaseDirectControl(false);
            return true;
          }
        }
        
        // E. Clicking Player Citadel when not controlling an operative opens Citadel Headquarters Shop
        const inCitadelBounds = Math.abs(worldPos.x - PLAYER_TOWER_X) < (TOWER_WIDTH / 2) &&
          worldPos.y <= (GROUND_Y + 15) &&
          worldPos.y >= (GROUND_Y - this.playerFloors * FLOOR_HEIGHT - 30);
        if (!this.controlledUnit && inCitadelBounds) {
          this.toggleShop(true);
          return true;
        }

        return false;
      };

      // Mouse down
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
          handleCanvasAction(e.clientX, e.clientY, true);
          return;
        }

        const handled = handleCanvasAction(e.clientX, e.clientY, false);
        if (!handled && !this.isShopOpen) {
          this.isDraggingCam = true;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          this.camStartX = this.camX;
          this.camStartY = this.camY;
        }
      });

      window.addEventListener('mousemove', (e) => {
        this.mouseWorldPos = this.screenToWorld(e.clientX, e.clientY);
        if (this.isDraggingCam) {
          const dx = e.clientX - this.dragStartX;
          const dy = e.clientY - this.dragStartY;
          this.targetCamX = this.camStartX - dx;
          this.targetCamY = this.camStartY - dy;
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDraggingCam = false;
      });

      // Mouse wheel vertical scrolling to smoothly view tall towers
      this.canvas.addEventListener('wheel', (e) => {
        if (!this.isShopOpen) {
          e.preventDefault();
          this.targetCamY += e.deltaY * 0.7;
        }
      }, { passive: false });

      // Minimap Click
      this.minimapCanvas.addEventListener('click', (e) => {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;
        const worldSpan = Math.max(1000, this.worldRight - this.worldLeft);
        const targetWorldX = this.worldLeft + clickRatio * worldSpan;
        this.centerCameraOn(targetWorldX);
      });

      // Shop UI Event Listeners
      if (this.dom.btnOpenShop) {
        this.dom.btnOpenShop.addEventListener('click', () => this.toggleShop(true));
      }
      if (this.dom.btnCloseShop) {
        this.dom.btnCloseShop.addEventListener('click', () => this.toggleShop(false));
      }
      if (this.dom.btnDismissShop) {
        this.dom.btnDismissShop.addEventListener('click', () => this.toggleShop(false));
      }
      if (this.dom.btnShopRecruit) {
        this.dom.btnShopRecruit.addEventListener('click', () => {
          audio.init();
          this.tryRecruitStickFigure();
        });
      }
      if (this.dom.btnShopBuyFloor) {
        this.dom.btnShopBuyFloor.addEventListener('click', () => {
          audio.init();
          this.tryBuyFloor(this.selectedPurposeForNextFloor);
        });
      }
      if (this.dom.btnShopBuyTurret) {
        this.dom.btnShopBuyTurret.addEventListener('click', () => {
          audio.init();
          this.tryBuyTurret();
        });
      }

      // Utility Listeners
      if (this.dom.btnStandGround) {
        this.dom.btnStandGround.addEventListener('click', () => this.orderControlledUnitStandGround());
      }
      if (this.dom.btnReleaseControl) {
        this.dom.btnReleaseControl.addEventListener('click', () => this.releaseDirectControl());
      }
      if (this.dom.btnAudio) {
        this.dom.btnAudio.addEventListener('click', () => {
          const active = audio.toggleMute();
          this.dom.btnAudio.textContent = active ? '🔊' : '🔇';
        });
      }
      if (this.dom.btnCamCitadel) {
        this.dom.btnCamCitadel.addEventListener('click', () => this.centerCameraOn(PLAYER_TOWER_X));
      }
      if (this.dom.btnHelp) {
        this.dom.btnHelp.addEventListener('click', () => this.dom.helpModal.classList.remove('hidden'));
      }
      if (this.dom.btnCloseHelp) {
        this.dom.btnCloseHelp.addEventListener('click', () => this.dom.helpModal.classList.add('hidden'));
      }
      if (this.dom.btnDismissHelp) {
        this.dom.btnDismissHelp.addEventListener('click', () => this.dom.helpModal.classList.add('hidden'));
      }
      if (this.dom.btnRestart) {
        this.dom.btnRestart.addEventListener('click', () => window.location.reload());
      }
      if (this.dom.btnPause) {
        this.dom.btnPause.addEventListener('click', () => this.togglePause());
      }
      if (this.dom.btnResume) {
        this.dom.btnResume.addEventListener('click', () => this.togglePause());
      }

      // Squad Commands Dock
      document.querySelectorAll('.cmd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          audio.init();
          const order = btn.dataset.order;
          this.issueSquadOrder(order);
        });
      });
    }

    toggleShop(force) {
      this.isShopOpen = (force !== undefined) ? force : !this.isShopOpen;
      if (this.dom.shopModal) {
        this.dom.shopModal.classList.toggle('hidden', !this.isShopOpen);
      }
      if (this.isShopOpen) {
        audio.playCoin();
        this.renderFloorPurposeSelector(true);
      }
      this.updateHUD();
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.dom.pauseModal) {
        this.dom.pauseModal.classList.toggle('hidden', !this.isPaused);
      }
      if (this.dom.btnPause) {
        this.dom.btnPause.textContent = this.isPaused ? '▶️' : '⏸️';
      }
      if (this.isPaused) {
        audio.playMineHit();
      } else {
        audio.playSpawn();
      }
    }

    getMaxPopulation() {
      let maxPop = 20; // Base Citadel capacity
      for (let f = 2; f <= this.playerFloors; f++) {
        if (this.floorPurposes[f] === 'recruitment') {
          maxPop += 15; // Recruitment Centers grant +15
        } else {
          maxPop += 5;  // Other floors grant +5
        }
      }
      return maxPop;
    }

    tryRecruitStickFigure() {
      const recruitCost = 75;
      const maxUnits = this.getMaxPopulation();
      const playerUnitsCount = this.units.filter(u => !u.isDead && u.faction === 'player').length;

      if (playerUnitsCount >= maxUnits) {
        this.floatingTexts.push(new FloatingText("CITADEL CAPACITY FULL!", PLAYER_TOWER_X, GROUND_Y - 100, '#ef4444', 20));
        audio.playTone(200, 0.1, 'sawtooth');
        return;
      }

      if (this.money < recruitCost) {
        this.floatingTexts.push(new FloatingText(`NEED $${recruitCost - this.money} MORE! ($75 RECRUIT)`, PLAYER_TOWER_X, GROUND_Y - 100, '#ef4444', 18));
        audio.playTone(180, 0.12, 'sawtooth');
        return;
      }

      this.money -= recruitCost;
      this.unitsRecruited++;

      // Determine spawn floor: alternate between recruitment centers
      const recruitFloors = [1];
      for (let f = 2; f <= this.playerFloors; f++) {
        if (this.floorPurposes[f] === 'recruitment') {
          recruitFloors.push(f);
        }
      }
      const spawnFloor = recruitFloors[Math.floor(Math.random() * recruitFloors.length)];
      const spawnY = (spawnFloor === 1) ? GROUND_Y : (GROUND_Y - (spawnFloor - 1) * FLOOR_HEIGHT);
      const spawnX = PLAYER_TOWER_X - 20 + (Math.random() * 40 - 20);

      const unit = this.spawnUnit(spawnX, spawnY, 'player', 'infantry');
      unit.targetFloor = spawnFloor;

      audio.playSpawn();
      this.spawnSparks(spawnX, spawnY - 20, '#38bdf8', 16);
      this.floatingTexts.push(new FloatingText("-$75 OPERATIVE RECRUITED!", spawnX, spawnY - 45, '#38bdf8', 20));

      // Auto-assign to man unmanned turrets if any exist
      const unmannedTurret = this.wallTurrets.find(t => !t.mannedBy);
      if (unmannedTurret) {
        unit.order = 'guard_tower';
      }

      this.updateHUD();
    }

    tryBuyFloor(purpose) {
      const nextFloor = this.playerFloors + 1;
      const floorCost = getFloorCost(nextFloor);
      const chosenPurpose = purpose || this.selectedPurposeForNextFloor || 'turrets';

      if (this.money >= floorCost) {
        this.money -= floorCost;
        this.playerFloors++;
        this.floorPurposes[nextFloor] = chosenPurpose;

        this.playerTower.maxGateHp += 300;
        this.playerTower.gateHp += 300;
        this.playerTower.maxCoreHp += 500;
        this.playerTower.coreHp += 500;

        audio.playBuild();
        const floorY = GROUND_Y - (this.playerFloors - 1) * FLOOR_HEIGHT;
        this.spawnSparks(PLAYER_TOWER_X, floorY, '#f59e0b', 35);
        const purposeName = FLOOR_PURPOSES[chosenPurpose] ? FLOOR_PURPOSES[chosenPurpose].name : 'Office';
        this.floatingTexts.push(new FloatingText(`FLOOR ${this.playerFloors} BUILT: ${purposeName.toUpperCase()}!`, PLAYER_TOWER_X, floorY - 30, '#fef08a', 22));

        this.renderFloorPurposeSelector(true);
        this.updateHUD();
      } else {
        this.floatingTexts.push(new FloatingText(`NEED $${floorCost - this.money} MORE TO BUILD FLOOR ${nextFloor}!`, PLAYER_TOWER_X, GROUND_Y - 100, '#ef4444', 18));
      }
    }

    tryBuyTurret() {
      const turretCost = 150;

      // Check turret-specialized floors
      const turretFloors = Object.keys(this.floorPurposes).filter(f => this.floorPurposes[f] === 'turrets').map(Number);

      if (turretFloors.length === 0) {
        this.floatingTexts.push(new FloatingText("LOCKED: BUILD A TURRET PLATFORM FLOOR FIRST!", PLAYER_TOWER_X, GROUND_Y - 120, '#ef4444', 18));
        audio.playTone(180, 0.15, 'sawtooth');
        return;
      }

      // Find first available slot among all Turret floors (Left: -1, Right: +1)
      let availableSlot = null;
      for (const f of turretFloors) {
        const westTaken = this.wallTurrets.some(t => t.floorNum === f && t.facing === -1);
        if (!westTaken) {
          availableSlot = { floorNum: f, facing: -1 };
          break;
        }
        const eastTaken = this.wallTurrets.some(t => t.floorNum === f && t.facing === 1);
        if (!eastTaken) {
          availableSlot = { floorNum: f, facing: 1 };
          break;
        }
      }

      if (!availableSlot) {
        this.floatingTexts.push(new FloatingText("ALL TURRET SLOTS OCCUPIED! BUILD ANOTHER TURRET PLATFORM!", PLAYER_TOWER_X, GROUND_Y - 120, '#ef4444', 18));
        audio.playTone(180, 0.15, 'sawtooth');
        return;
      }

      if (this.money >= turretCost) {
        this.money -= turretCost;
        const side = availableSlot.facing;
        const floorIndex = availableSlot.floorNum;
        const turretY = GROUND_Y - (floorIndex - 1) * FLOOR_HEIGHT - 55;
        const turretX = PLAYER_TOWER_X + side * (TOWER_WIDTH / 2);

        const turret = new WallTurret(turretX, turretY, side, floorIndex);
        this.wallTurrets.push(turret);

        audio.playBuild();
        this.spawnSparks(turretX, turretY, '#38bdf8', 25);
        this.floatingTexts.push(new FloatingText(`WALL TURRET INSTALLED ON FLOOR ${floorIndex}! ($150)`, turretX, turretY - 30, '#38bdf8', 18));

        // Dispatch an available stick figure to man it
        this.dispatchStickFigureToTurret(turret);

        this.updateHUD();
      } else {
        this.floatingTexts.push(new FloatingText(`NEED $${turretCost - this.money} MORE FOR TURRET!`, PLAYER_TOWER_X, GROUND_Y - 100, '#ef4444', 18));
      }
    }

    dispatchStickFigureToTurret(turret) {
      const idleUnit = this.units.find(u => !u.isDead && u.faction === 'player' && !u.manningTurret && !u.isDirectControlled);
      if (idleUnit) {
        idleUnit.order = 'guard_tower';
        idleUnit.targetFloor = turret.floorNum;
        this.floatingTexts.push(new FloatingText("ORDER: Man Wall Turret", idleUnit.x, idleUnit.y - 30, '#10b981', 14));
      }
    }

    drawPortrait(unit) {
      if (!this.dom.portraitCanvas || !unit) return;
      const pctx = this.dom.portraitCanvas.getContext('2d');
      const w = this.dom.portraitCanvas.width;
      const h = this.dom.portraitCanvas.height;
      pctx.clearRect(0, 0, w, h);

      pctx.save();
      pctx.translate(w / 2, h / 2 + 6);

      // Crown
      pctx.fillStyle = '#f59e0b';
      pctx.beginPath();
      pctx.moveTo(-10, -20);
      pctx.lineTo(-6, -14);
      pctx.lineTo(0, -22);
      pctx.lineTo(6, -14);
      pctx.lineTo(10, -20);
      pctx.lineTo(7, -10);
      pctx.lineTo(-7, -10);
      pctx.closePath();
      pctx.fill();

      // Head
      pctx.fillStyle = '#f8fafc';
      pctx.strokeStyle = '#38bdf8';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.arc(0, -4, 11, 0, Math.PI * 2);
      pctx.fill();
      pctx.stroke();

      // Bandana
      pctx.fillStyle = '#38bdf8';
      pctx.beginPath();
      pctx.arc(0, -5, 11, Math.PI, 0);
      pctx.fill();

      // Eyes
      pctx.fillStyle = '#0f172a';
      pctx.beginPath();
      pctx.arc(-3, -4, 2, 0, Math.PI * 2);
      pctx.arc(3, -4, 2, 0, Math.PI * 2);
      pctx.fill();

      pctx.restore();
    }

    setDirectControl(unit) {
      if (this.controlledUnit && this.controlledUnit !== unit) {
        this.releaseDirectControl(true);
      }
      this.controlledUnit = unit;
      unit.isDirectControlled = true;
      audio.playSpawn();

      this.dom.directControlHud.classList.remove('hidden');
      this.dom.unitName.textContent = `Stick Figure #${unit.id}`;
      this.updateDirectControlHUD();
      this.drawPortrait(unit);
    }

    updateDirectControlHUD() {
      if (!this.controlledUnit) return;
      if (this.controlledUnit.manningTurret) {
        this.dom.directControlHud.classList.add('turret-mode');
        this.dom.controlBadge.className = 'control-badge turret-badge';
        this.dom.controlBadge.textContent = 'TURRET ACTIVE';
        this.dom.unitRoleTag.textContent = 'TURRET GUNNER';
        this.dom.controlHints.innerHTML = '<span><b>[MOUSE]</b> Aim</span> <span><b>[L-CLICK / SPACE]</b> Fire</span> <span><b>[WASD/ESC]</b> Dismount</span>';
        if (this.dom.btnStandGround) this.dom.btnStandGround.style.display = 'none';
      } else {
        this.dom.directControlHud.classList.remove('turret-mode');
        this.dom.controlBadge.className = 'control-badge';
        this.dom.controlBadge.textContent = 'WASD ACTIVE';
        const isStandingGround = this.controlledUnit.order === 'stand_ground';
        this.dom.unitRoleTag.textContent = isStandingGround ? `${this.controlledUnit.role.toUpperCase()} [HOLDING]` : this.controlledUnit.role.toUpperCase();
        this.dom.controlHints.innerHTML = '<span><b>[A/D]</b> Walk</span> <span><b>[W/S]</b> Climb</span> <span><b>[Space/Click]</b> Action</span> <span><b>[G]</b> Stand Ground</span>';
        if (this.dom.btnStandGround) {
          this.dom.btnStandGround.style.display = 'inline-flex';
          this.dom.btnStandGround.innerHTML = isStandingGround ? '🛡️ STANDING GROUND' : '🛑 STAND GROUND';
          this.dom.btnStandGround.classList.toggle('active', isStandingGround);
        }
      }
    }

    orderControlledUnitStandGround() {
      if (!this.controlledUnit) return;
      const unit = this.controlledUnit;

      if (unit.manningTurret) {
        unit.manningTurret.mannedBy = null;
        unit.manningTurret = null;
      }

      this.releaseDirectControl(true);
    }

    releaseDirectControl(autoStandGround = true) {
      const unit = this.controlledUnit;
      if (unit) {
        unit.isDirectControlled = false;

        // If not manning a turret and letting go after moving, automatically stand ground at position
        if (autoStandGround && !unit.manningTurret) {
          const hasExplicitOtherOrder = unit.order === 'work_basement' || unit.order === 'attack_west' || unit.order === 'attack_east';
          if (!hasExplicitOtherOrder) {
            unit.order = 'stand_ground';
            unit.holdX = unit.x;
            unit.holdY = unit.y;
            unit.vx = 0;
            unit.vy = 0;

            // If unit was on a ladder, snap to nearest floor level
            const inTower = Math.abs(unit.x - PLAYER_TOWER_X) < (TOWER_WIDTH / 2);
            if (inTower && unit.onLadder) {
              unit.onLadder = false;
              let bestFloorY = GROUND_Y;
              let bestDiff = Math.abs(unit.y - GROUND_Y);
              if (Math.abs(unit.y - BASEMENT_Y) < bestDiff) {
                bestFloorY = BASEMENT_Y;
                bestDiff = Math.abs(unit.y - BASEMENT_Y);
              }
              for (let f = 2; f <= this.playerFloors; f++) {
                const fy = GROUND_Y - (f - 1) * FLOOR_HEIGHT;
                if (Math.abs(unit.y - fy) < bestDiff) {
                  bestFloorY = fy;
                  bestDiff = Math.abs(unit.y - fy);
                }
              }
              unit.y = bestFloorY;
              unit.holdY = bestFloorY;
            }

            audio.init();
            audio.playTone(480, 0.12, 'triangle');
            this.floatingTexts.push(new FloatingText("STAND GROUND 🛡️", unit.x, unit.y - 30, '#10b981', 18));
            this.spawnSparks(unit.x, unit.y - 12, '#10b981', 14);
          }
        }

        this.controlledUnit = null;
      }

      this.dom.directControlHud.classList.add('hidden');
      this.dom.directControlHud.classList.remove('turret-mode');
    }

    issueSquadOrder(order) {
      audio.playBowFire();
      for (const unit of this.units) {
        if (!unit.isDead && unit.faction === 'player' && !unit.isDirectControlled) {
          // Operatives holding ground stand fast unless explicitly re-commanded
          if (unit.order === 'stand_ground') continue;

          // If unit is manning a turret and ordered to assault or basement, dismount
          if (unit.manningTurret && order !== 'guard_tower') {
            unit.manningTurret.mannedBy = null;
            unit.manningTurret = null;
          }
          unit.order = order;
        }
      }

      const activeWest = this.getActiveWestTower();
      const activeEast = this.getActiveEastTower();

      const orderLabels = {
        'work_basement': 'Assigned Squad to Vault Mining ($)!',
        'guard_tower': 'Citadel Defense Garrison & Turret Manning Active!',
        'attack_west': `Army Marching to Assault West (Tier ${toRoman(activeWest.tier)}: ${activeWest.name})!`,
        'attack_east': `Army Marching to Assault East (Tier ${toRoman(activeEast.tier)}: ${activeEast.name})!`
      };

      this.floatingTexts.push(new FloatingText(orderLabels[order] || 'Order Issued!', this.controlledUnit ? this.controlledUnit.x : PLAYER_TOWER_X, GROUND_Y - 140, '#fef08a', 20));
    }

    spawnUnit(x, y, faction = 'player', role = 'infantry') {
      const unit = new StickFigure(x, y, faction, role);
      this.units.push(unit);
      this.spawnSparks(x, y - 20, faction === 'red' ? '#ef4444' : (faction === 'purple' ? '#c084fc' : '#38bdf8'), 12);
      if (faction === 'player') {
        audio.playSpawn();
      }
      return unit;
    }

    addMoney(amount) {
      this.money += amount;
      this.updateHUD();
    }

    onPlayerUnitDied(unit) {
      if (unit === this.controlledUnit) {
        this.releaseDirectControl(false);
      }
      this.updateHUD();
    }

    findNearestEnemy(sourceUnit, maxDist = Infinity) {
      let nearest = null;
      let minDist = maxDist;

      for (const unit of this.units) {
        if (!unit.isDead && unit.faction !== sourceUnit.faction) {
          const dist = Math.abs(unit.x - sourceUnit.x);
          if (dist < minDist) {
            minDist = dist;
            nearest = unit;
          }
        }
      }
      return nearest;
    }

    findNearestPlayerUnit(sourceUnit, maxDist = Infinity) {
      let nearest = null;
      let minDist = maxDist;

      for (const unit of this.units) {
        if (!unit.isDead && unit.faction === 'player') {
          const dist = Math.abs(unit.x - sourceUnit.x);
          if (dist < minDist) {
            minDist = dist;
            nearest = unit;
          }
        }
      }
      return nearest;
    }

    spawnSparks(x, y, color, count = 10) {
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() * 2 - 1) * 160;
        const vy = (Math.random() * -2 - 0.5) * 120;
        this.particles.push(new Particle(x, y, vx, vy, color, Math.random() * 3 + 1, Math.random() * 0.4 + 0.2));
      }
    }

    spawnBlood(x, y, count = 12) {
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() * 2 - 1) * 120;
        const vy = (Math.random() * -1.5 - 0.2) * 90;
        this.particles.push(new Particle(x, y, vx, vy, '#ef4444', Math.random() * 2.5 + 1.5, Math.random() * 0.5 + 0.3));
      }
    }

    centerCameraOn(worldX, worldY = null) {
      this.targetCamX = worldX - window.innerWidth / 2;
      this.targetCamY = worldY !== null ? Math.min(0, worldY - window.innerHeight * 0.5) : 0;
    }

    screenToWorld(screenX, screenY) {
      return {
        x: screenX + this.camX,
        y: screenY + this.camY
      };
    }

    checkVictoryCondition() {
      // In infinite procedural conquest, check milestone achievements
      const conqueredCount = this.getConqueredOutpostsCount();
      if (conqueredCount > 0 && conqueredCount % 2 === 0) {
        this.floatingTexts.push(new FloatingText(
          `⚔️ CAMPAIGN MILESTONE: ${conqueredCount} FRONTIERS CONQUERED! ⚔️`,
          this.controlledUnit ? this.controlledUnit.x : PLAYER_TOWER_X,
          GROUND_Y - 200, '#fef08a', 28
        ));
      }
    }

    repurposeFloor(floorNum, newPurpose) {
      // Repurposing floors is disabled for now per user request
      return;
    }

    renderFloorPurposeSelector(force = false) {
      const nextFloor = this.playerFloors + 1;
      const allPurposes = ['recruitment', 'turrets', 'archers', 'armory'];

      // 1. Purpose Options for Next Floor to Build (infinite floors supported)
      if (this.dom.purposeOptions) {
        if (!allPurposes.includes(this.selectedPurposeForNextFloor)) {
          this.selectedPurposeForNextFloor = allPurposes[0];
        }

        const needsRebuild = force ||
          this._renderedFloorForPurpose !== nextFloor ||
          this.dom.purposeOptions.children.length !== allPurposes.length;

        if (needsRebuild) {
          this._renderedFloorForPurpose = nextFloor;
          this.dom.purposeOptions.innerHTML = '';

          allPurposes.forEach(pid => {
            const pdata = FLOOR_PURPOSES[pid];
            if (!pdata) return;
            const optCard = document.createElement('div');
            optCard.className = `purpose-opt-card ${this.selectedPurposeForNextFloor === pid ? 'selected' : ''}`;
            optCard.dataset.pid = pid;
            optCard.innerHTML = `
              <div class="purpose-opt-name">${pdata.icon} ${pdata.name}</div>
              <div class="purpose-opt-desc">${pdata.desc}</div>
            `;

            const handleSelect = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (this.selectedPurposeForNextFloor === pid) return;
              this.selectedPurposeForNextFloor = pid;
              audio.init();
              audio.playMineHit();
              this.renderFloorPurposeSelector();
              this.updateHUD();
            };

            optCard.addEventListener('pointerdown', handleSelect);
            optCard.addEventListener('click', handleSelect);
            this.dom.purposeOptions.appendChild(optCard);
          });
        } else {
          // Update active .selected class without recreating DOM every frame
          const cards = this.dom.purposeOptions.querySelectorAll('.purpose-opt-card');
          cards.forEach(card => {
            const pid = card.dataset.pid;
            card.classList.toggle('selected', this.selectedPurposeForNextFloor === pid);
          });
        }
      }

      // 2. Repurpose Section for Already Built Citadel Floors
      // Disabled for now per user request
      if (this.dom.builtFloorsManager) {
        this.dom.builtFloorsManager.style.display = 'none';
      }
    }

    updateHUD() {
      if (this.dom.goldValue) this.dom.goldValue.textContent = `$${this.money}`;
      if (this.dom.shopTreasuryVal) this.dom.shopTreasuryVal.textContent = `$${this.money}`;

      // Truce Countdown Pill HUD Update
      if (this.dom.truceTimer && this.dom.trucePill) {
        if (this.truceTimer > 0) {
          const mins = Math.floor(this.truceTimer / 60);
          const secs = Math.floor(this.truceTimer % 60);
          this.dom.truceTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          if (this.truceTimer <= 60) {
            this.dom.trucePill.classList.add('warning');
            this.dom.trucePill.classList.remove('war-active');
            if (this.dom.truceIcon) this.dom.truceIcon.textContent = '⏳';
          } else {
            this.dom.trucePill.classList.remove('warning');
            this.dom.trucePill.classList.remove('war-active');
            if (this.dom.truceIcon) this.dom.truceIcon.textContent = '🕊️';
          }
        } else {
          this.dom.truceTimer.textContent = 'WAR ACTIVE';
          this.dom.trucePill.classList.remove('warning');
          this.dom.trucePill.classList.add('war-active');
          if (this.dom.truceIcon) this.dom.truceIcon.textContent = '⚔️';
        }
      }

      const maxUnits = this.getMaxPopulation();
      const playerUnitsCount = this.units.filter(u => !u.isDead && u.faction === 'player').length;
      if (this.dom.popValue) this.dom.popValue.textContent = `${playerUnitsCount} / ${maxUnits}`;
      if (this.dom.shopPopCounter) this.dom.shopPopCounter.textContent = `${playerUnitsCount} / ${maxUnits}`;

      // Passive income rate from basement workers + conquered outpost tribute
      const workers = this.units.filter(u => !u.isDead && u.faction === 'player' && u.order === 'work_basement').length;
      const earnPerWorker = this.playerFloors >= 5 ? 4 : 2;
      const workerRate = (workers * earnPerWorker) / 1.5;
      const outpostRate = this.getConqueredOutpostsCount() * 1.5;
      const totalRate = (workerRate + outpostRate).toFixed(1);
      if (this.dom.incomeRate) {
        this.dom.incomeRate.textContent = `+$${totalRate}/s`;
        this.dom.incomeRate.title = `Vault Mining: +$${workerRate.toFixed(1)}/s | Conquered Outposts: +$${outpostRate.toFixed(1)}/s`;
      }

      // 1. Update Shop: Recruitment card
      if (this.dom.btnShopRecruit) {
        const canRecruit = this.money >= 75 && playerUnitsCount < maxUnits;
        this.dom.btnShopRecruit.disabled = !canRecruit;
        if (playerUnitsCount >= maxUnits) {
          this.dom.btnShopRecruit.querySelector('.action-text').textContent = 'POPULATION FULL';
        } else {
          this.dom.btnShopRecruit.querySelector('.action-text').textContent = 'RECRUIT ($75)';
        }
      }

      // Check recruitment locations
      if (this.dom.shopRecruitLocation) {
        const recruitFloors = [1];
        for (let f = 2; f <= this.playerFloors; f++) {
          if (this.floorPurposes[f] === 'recruitment') recruitFloors.push(f);
        }
        this.dom.shopRecruitLocation.textContent = recruitFloors.length > 1
          ? `Floors ${recruitFloors.join(', ')} (Recruitment Centers)`
          : 'Floor 1 (Recruitment HQ)';
      }

      // 2. Update Shop: Skyscraper Floor Expansion card (infinite floors)
      const nextFloor = this.playerFloors + 1;
      const cost = getFloorCost(nextFloor);
      if (this.dom.shopNextFloorNum) this.dom.shopNextFloorNum.textContent = nextFloor;
      if (this.dom.shopFloorCostTag) this.dom.shopFloorCostTag.textContent = `$${cost}`;
      if (this.dom.purposeFloorLabel) this.dom.purposeFloorLabel.textContent = nextFloor;
      if (this.dom.btnShopBuyFloor) {
        this.dom.btnShopBuyFloor.disabled = this.money < cost;
      }

      this.renderFloorPurposeSelector();

      // 3. Update Shop: Wall Turrets card
      const turretFloors = Object.keys(this.floorPurposes).filter(f => this.floorPurposes[f] === 'turrets').map(Number);
      const maxTurrets = turretFloors.length * 2;
      const currentTurrets = this.wallTurrets.length;

      if (this.dom.shopTurretCount) this.dom.shopTurretCount.textContent = currentTurrets;
      if (this.dom.shopMaxTurrets) this.dom.shopMaxTurrets.textContent = maxTurrets;

      if (this.dom.turretRestrictionNote) {
        if (turretFloors.length === 0) {
          this.dom.turretRestrictionNote.className = 'turret-restriction-note';
          this.dom.turretRestrictionNote.innerHTML = '🔒 Locked: Specialize Floor 2 (or higher) as a <b>Turret Platform</b> to unlock turret mounts!';
        } else if (currentTurrets >= maxTurrets) {
          this.dom.turretRestrictionNote.className = 'turret-restriction-note';
          this.dom.turretRestrictionNote.innerHTML = '⚠️ All turret slots occupied! Build another <b>Turret Platform</b> floor for more slots.';
        } else {
          this.dom.turretRestrictionNote.className = 'turret-restriction-note unlocked';
          const openSlots = maxTurrets - currentTurrets;
          this.dom.turretRestrictionNote.innerHTML = `✅ <b>${openSlots}</b> Turret Slot(s) Available on Floors ${turretFloors.join(', ')}.`;
        }
      }

      if (this.dom.btnShopBuyTurret) {
        const canBuyTurret = turretFloors.length > 0 && currentTurrets < maxTurrets && this.money >= 150;
        this.dom.btnShopBuyTurret.disabled = !canBuyTurret;
      }

      // 4. Direct Control Card details
      if (this.controlledUnit && !this.controlledUnit.isDead) {
        const pct = Math.max(0, this.controlledUnit.hp / this.controlledUnit.maxHp) * 100;
        this.dom.unitHpFill.style.width = `${pct}%`;
        this.dom.unitHpText.textContent = `${this.controlledUnit.hp} / ${this.controlledUnit.maxHp} HP`;
      }

      // 5. Update assault command button labels with active frontier tiers
      const activeWest = this.getActiveWestTower();
      const activeEast = this.getActiveEastTower();
      const lblWest = document.getElementById('cmd-label-west');
      const lblEast = document.getElementById('cmd-label-east');
      if (lblWest && activeWest) {
        lblWest.textContent = `ASSAULT WEST [TIER ${toRoman(activeWest.tier)}]`;
      }
      if (lblEast && activeEast) {
        lblEast.textContent = `ASSAULT EAST [TIER ${toRoman(activeEast.tier)}]`;
      }
    }

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.draw();
      this.drawMinimap();

      if (this.isPaused) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        ctx.font = '900 28px "Outfit", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('⏸️ GAME PAUSED', window.innerWidth / 2, window.innerHeight / 2 - 20);
        ctx.font = '500 14px "Outfit", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press [P] or click Resume to continue', window.innerWidth / 2, window.innerHeight / 2 + 12);
        ctx.restore();
      }

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      // Truce Countdown Logic (5-Minute Peace Period)
      if (this.truceTimer > 0) {
        const prevTimer = this.truceTimer;
        this.truceTimer = Math.max(0, this.truceTimer - dt);

        // Warning at 1 minute remaining
        if (prevTimer > 60 && this.truceTimer <= 60) {
          audio.playAlert();
          this.floatingTexts.push(new FloatingText(
            "⏳ TRUCE ENDING IN 1 MINUTE! PREPARE YOUR DEFENSES!",
            PLAYER_TOWER_X, GROUND_Y - 140, '#f59e0b', 22
          ));
        }

        // Truce Expired
        if (prevTimer > 0 && this.truceTimer === 0) {
          audio.playAlert();
          this.floatingTexts.push(new FloatingText(
            "⚠️ 5-MINUTE TRUCE EXPIRED! ENEMY FORCES MOBILIZING! ⚠️",
            PLAYER_TOWER_X, GROUND_Y - 150, '#ef4444', 24
          ));
        }
      }

      // Outpost passive gold tribute (+$1.5/s per conquered outpost)
      const outposts = this.getConqueredOutpostsCount();
      if (outposts > 0) {
        this.outpostIncomeTimer = (this.outpostIncomeTimer || 0) + dt;
        if (this.outpostIncomeTimer >= 1.0) {
          this.outpostIncomeTimer = 0;
          const tribute = Math.round(outposts * 1.5);
          this.money += tribute;
        }
      }

      // Camera lerp tracking (horizontal & vertical)
      if (this.controlledUnit && !this.isDraggingCam) {
        this.targetCamX = this.controlledUnit.x - window.innerWidth / 2;
        if (this.controlledUnit.onLadder || Math.abs(this.controlledUnit.vy) > 10 || this.controlledUnit.y < window.innerHeight * 0.45) {
          const idealCamY = this.controlledUnit.y - window.innerHeight * 0.5;
          this.targetCamY = Math.min(0, idealCamY);
        }
      }
      this.targetCamX = Math.max(this.worldLeft, Math.min(this.worldRight - window.innerWidth, this.targetCamX));
      const minCamY = Math.min(0, GROUND_Y - (this.playerFloors + 1) * FLOOR_HEIGHT);
      const maxCamY = 60;
      this.targetCamY = Math.max(minCamY, Math.min(maxCamY, this.targetCamY));

      this.camX += (this.targetCamX - this.camX) * 10 * dt;
      this.camY += (this.targetCamY - this.camY) * 10 * dt;

      // Update all Towers
      for (const t of this.getAllTowers()) {
        t.update(dt, this);
      }

      // Update Wall Turrets
      for (const t of this.wallTurrets) {
        t.update(dt, this);
      }

      // Update Units
      for (const unit of this.units) {
        unit.update(dt, this, this.keys);
      }
      this.units = this.units.filter(u => !u.isDead);

      // Update Projectiles
      for (const p of this.projectiles) {
        p.update(dt, this);
      }
      this.projectiles = this.projectiles.filter(p => p.active);

      // Update Particles
      for (const pt of this.particles) {
        pt.update(dt);
      }
      this.particles = this.particles.filter(pt => pt.life > 0);

      // Update Floating Texts
      for (const ft of this.floatingTexts) {
        ft.update(dt);
      }
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

      this.updateHUD();
    }

    draw() {
      const ctx = this.ctx;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. SKY GRADIENT & ATMOSPHERE
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#050813');
      skyGrad.addColorStop(0.6, '#0b1329');
      skyGrad.addColorStop(1, '#1b2344');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Celestial Moon
      ctx.save();
      const moonX = ((1800 - this.camX * 0.1) % w + w) % w;
      const moonY = 110 - this.camY * 0.05;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#e2e8f0';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Parallax Mountains (Distant)
      ctx.save();
      ctx.fillStyle = '#10162b';
      ctx.beginPath();
      const mtnBaseY = GROUND_Y - this.camY * 0.25;
      ctx.moveTo(0, mtnBaseY);
      for (let x = 0; x <= w; x += 120) {
        const worldX = x + this.camX * 0.2;
        const my = mtnBaseY - 140 - Math.sin(worldX * 0.003) * 80 - Math.cos(worldX * 0.007) * 40;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(w, h + 200);
      ctx.lineTo(0, h + 200);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Parallax Hills (Closer)
      ctx.save();
      ctx.fillStyle = '#151e38';
      ctx.beginPath();
      const hillBaseY = GROUND_Y - this.camY * 0.45;
      ctx.moveTo(0, hillBaseY);
      for (let x = 0; x <= w; x += 80) {
        const worldX = x + this.camX * 0.4;
        const my = hillBaseY - 60 - Math.sin(worldX * 0.005) * 40;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(w, h + 200);
      ctx.lineTo(0, h + 200);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. WORLD SPACE TRANSFORM
      ctx.save();
      ctx.translate(-this.camX, -this.camY);

      // Battlefield Ground Layer spanning entire discovered world
      const worldSpan = Math.max(1000, this.worldRight - this.worldLeft);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.worldLeft, GROUND_Y, worldSpan, Math.max(1000, h + Math.abs(this.camY) + 800));

      // Grassy Surface Trim
      ctx.fillStyle = '#166534';
      ctx.fillRect(this.worldLeft, GROUND_Y - 4, worldSpan, 8);

      // Cobblestone Pathway across battlefield
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      const startPx = Math.floor(this.worldLeft / 35) * 35;
      for (let px = startPx; px < this.worldRight; px += 35) {
        ctx.strokeRect(px, GROUND_Y, 32, 8);
      }

      // Draw all Towers (Player Citadel + all West and East procedural towers)
      for (const tower of this.getAllTowers()) {
        tower.draw(ctx, this);
      }

      // Draw Wall Turrets
      for (const t of this.wallTurrets) {
        t.draw(ctx, this);
      }

      // Draw Stick Figures
      for (const unit of this.units) {
        unit.draw(ctx);
      }

      // Draw Projectiles
      for (const p of this.projectiles) {
        p.draw(ctx);
      }

      // Draw Particles
      for (const pt of this.particles) {
        pt.draw(ctx);
      }

      // Draw Floating Texts
      for (const ft of this.floatingTexts) {
        ft.draw(ctx);
      }

      ctx.restore();
    }

    drawMinimap() {
      const mctx = this.minimapCtx;
      const mw = this.minimapCanvas.width;
      const mh = this.minimapCanvas.height;

      mctx.clearRect(0, 0, mw, mh);

      // Background terrain
      mctx.fillStyle = '#030712';
      mctx.fillRect(0, 0, mw, mh);

      const worldSpan = Math.max(1000, this.worldRight - this.worldLeft);
      const toMapX = (worldX) => ((worldX - this.worldLeft) / worldSpan) * mw;

      // Draw Ground
      mctx.fillStyle = '#14532d';
      mctx.fillRect(0, mh - 8, mw, 2);

      // Towers on Minimap
      for (const t of this.getAllTowers()) {
        const tx = toMapX(t.x);
        if (t.faction === 'player') {
          mctx.fillStyle = '#0ea5e9';
          const pth = Math.min(mh - 4, 12 + this.playerFloors * 2.5);
          mctx.fillRect(tx - 5, mh - 8 - pth, 10, pth);
        } else if (t.conquered) {
          // Conquered outpost blip (cyan outpost)
          mctx.fillStyle = '#0284c7';
          mctx.fillRect(tx - 3, mh - 22, 6, 14);
        } else {
          // Active enemy tower blip
          mctx.fillStyle = t.direction === 'west' ? '#ef4444' : '#a855f7';
          const th = Math.min(30, 14 + t.tier * 2);
          mctx.fillRect(tx - 4, mh - 8 - th, 8, th);
        }
      }

      // Stick figures blips
      for (const unit of this.units) {
        if (unit.isDead) continue;
        mctx.fillStyle = unit.faction === 'red' ? '#ef4444' : (unit.faction === 'purple' ? '#c084fc' : '#38bdf8');
        mctx.fillRect(toMapX(unit.x) - 1, mh - 12, 2, 4);
      }

      // Camera Viewport Rectangle
      const camLeft = toMapX(this.camX);
      const camWidth = (window.innerWidth / worldSpan) * mw;
      mctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      mctx.lineWidth = 1;
      mctx.strokeRect(camLeft, 2, camWidth, mh - 4);
    }
  }

  // Launch the game once DOM is fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
  });

})();
