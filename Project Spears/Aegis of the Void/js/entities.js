/**
 * Aegis of the Void - Entities, Player Controller & Monster AI
 */

// Simple 2D Vector helpers
class Vec2 {
  static dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }
  static angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }
  static hasLineOfSight(x1, y1, x2, y2, steps = 8) {
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      if (window.worldManager && window.worldManager.isSolidTile(px, py)) {
        return false;
      }
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// Projectile Class
// ---------------------------------------------------------------------------
class Projectile {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx;
    this.vy = options.vy;
    this.radius = options.radius || 5;
    this.color = options.color || '#38bdf8';
    this.damage = options.damage || 20;
    this.isCrit = options.isCrit || false;
    this.pierce = options.pierce || 0;
    this.hitEntities = new Set();
    this.isEnemy = options.isEnemy || false;
    this.life = options.life || 2.5;
    this.element = options.element || 'physical';
    this.isDead = false;
    this.hasExploded = false;
    this.canDeflect = options.canDeflect !== false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check solid dungeon wall collision
    if (window.worldManager.isSolidTile(this.x, this.y)) {
      window.worldManager.damageCrackedWall(this.x, this.y, this.damage);
      this.isDead = true;
      window.particleSystem.emitSparks(this.x, this.y, this.color, 5, 120);
      return;
    }

    // Check destructible urn collision
    const nearbyChunks = window.worldManager.getNearbyChunks(this.x, this.y);
    for (const chunk of nearbyChunks) {
      for (const urn of chunk.urns) {
        if (!urn.isBroken && Vec2.dist(this.x, this.y, urn.x, urn.y) < this.radius + urn.radius) {
          window.worldManager.smashUrn(urn);
          this.isDead = true;
          return;
        }
      }
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// XP & Health Pickups
// ---------------------------------------------------------------------------
class Pickup {
  constructor(x, y, type = 'xp', value = 10) {
    this.x = x;
    this.y = y;
    this.type = type; // 'xp' or 'health'
    this.value = value;
    this.radius = type === 'xp' ? 6 : 9;
    this.color = type === 'xp' ? '#fbbf24' : '#ef4444';
    this.isDead = false;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, player) {
    const d = Vec2.dist(this.x, this.y, player.x, player.y);
    const magnetDist = player.pickupRadius;

    if (d < magnetDist) {
      // Accelerate towards player
      const angle = Vec2.angle(this.x, this.y, player.x, player.y);
      const pullSpeed = (1 - d / magnetDist) * 550 + 200;
      this.vx = Math.cos(angle) * pullSpeed;
      this.vy = Math.sin(angle) * pullSpeed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (d < player.radius + this.radius) {
      this.isDead = true;
      if (this.type === 'xp') {
        player.gainXP(this.value);
        window.soundEngine.playHit(false);
      } else if (this.type === 'health') {
        player.heal(this.value);
      }
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Player Entity
// ---------------------------------------------------------------------------
class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 400;
    this.y = 400;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.speed = 240; // Pixels per sec
    
    // Core Health & Defense
    this.maxHp = 100;
    this.hp = 100;
    this.maxBarrier = 50;
    this.barrier = 50;
    this.barrierRechargeTimer = 0;

    // Movement & Dash
    this.dashCooldown = 2.4;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashDuration = 0.22;
    this.dashTimeLeft = 0;
    this.isInvulnerable = false;
    this.invulnTimer = 0;

    // Combat & Spear
    this.baseDamage = 35;
    this.attackRate = 0.38; // seconds between attacks
    this.attackTimer = 0;
    this.projectileSpeed = 750;
    this.critChance = 0.15;
    this.critMultiplier = 2.0;
    this.pickupRadius = 140;

    // Progression & Energy
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 50;
    this.kineticCharge = 0; // 0 to 100
    this.orbitAngle = 0;

    // Stats tracking
    this.enemiesDefeated = 0;
    this.damageDealt = 0;
    this.distanceMax = 0;
    this.timeSurvived = 0;

    this.isDead = false;
  }

  applyItemStats(inv) {
    // Recompute stats from items
    let maxHp = 100;
    let maxBarrier = 25;
    let speed = 240;
    let dashCd = 2.4;
    let critChance = 0.15;
    let critMult = 2.0;
    let pickupRad = 140;

    if (inv.hasItem('titan_heart')) {
      const stacks = inv.getItemCount('titan_heart');
      maxHp += 60 * stacks;
      maxBarrier += 30 * stacks;
    }
    if (inv.hasItem('hermes_wings')) {
      const stacks = inv.getItemCount('hermes_wings');
      speed *= (1 + 0.28 * stacks);
      dashCd *= Math.pow(0.70, stacks);
    }
    if (inv.hasItem('overcharge_coil')) {
      const stacks = inv.getItemCount('overcharge_coil');
      critChance += 0.25 * stacks;
      critMult += 0.60 * stacks;
    }
    if (inv.hasItem('magnet_relic')) {
      const stacks = inv.getItemCount('magnet_relic');
      pickupRad *= (1 + 1.3 * stacks);
    }
    if (inv.hasItem('boss_void_crown')) {
      dashCd *= 0.65; // -35% Dash Cooldown
    }

    this.maxHp = maxHp;
    this.maxBarrier = maxBarrier;
    this.speed = speed;
    this.dashCooldown = dashCd;
    this.critChance = Math.min(0.95, critChance);
    this.critMultiplier = critMult;
    this.pickupRadius = pickupRad;
  }

  update(dt, input, playerProjectiles, enemyProjectiles) {
    if (this.isDead) return;

    this.timeSurvived += dt;
    const currentDist = Math.hypot(this.x - 400, this.y - 400);
    if (currentDist > this.distanceMax) this.distanceMax = currentDist;

    // 1. Dash handling
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) this.isInvulnerable = false;
    }

    if (this.isDashing) {
      this.dashTimeLeft -= dt;
      window.particleSystem.emitTrail(this.x, this.y, '#818cf8', 12);

      if (this.dashTimeLeft <= 0) {
        this.isDashing = false;
        // Synergy: Supernova Rift on dash exit
        if (window.inventory.hasSynergy('supernova_rift')) {
          window.particleSystem.emitShockwave(this.x, this.y, 140, '#f97316', 6);
          window.particleSystem.addGroundEffect(this.x, this.y, 110, 2.5, 'plasma', 45);
          window.soundEngine.playExplosion(true);
        }
      }
    } else {
      // Regular 8-directional movement
      let moveX = 0;
      let moveY = 0;
      if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      let effectiveMoveSpeed = this.speed;
      // Boss Power: Molten Core of Ignis hellfire movespeed bonus while burning foes are near
      if (window.inventory && window.inventory.hasItem('boss_infernal_core') && window.gameEngine && window.gameEngine.monsters) {
        const hasBurningNear = window.gameEngine.monsters.some(m => !m.isDead && m.burnDuration > 0 && Vec2.dist(this.x, this.y, m.x, m.y) < 450);
        if (hasBurningNear) effectiveMoveSpeed *= 1.25;
      }

      this.vx = moveX * effectiveMoveSpeed;
      this.vy = moveY * effectiveMoveSpeed;

      // Boss Power: Molten Core of Ignis automated sky meteor strikes
      if (window.inventory && window.inventory.hasItem('boss_infernal_core')) {
        this.infernalMeteorTimer = (this.infernalMeteorTimer || 0) - dt;
        if (this.infernalMeteorTimer <= 0) {
          this.infernalMeteorTimer = 3.5;
          let targetMonster = null;
          let minDist = 500;
          if (window.gameEngine && window.gameEngine.monsters) {
            for (const m of window.gameEngine.monsters) {
              if (!m.isDead) {
                const d = Vec2.dist(this.x, this.y, m.x, m.y);
                if (d < minDist) {
                  minDist = d;
                  targetMonster = m;
                }
              }
            }
          }
          if (targetMonster) {
            window.soundEngine.playMeteorWarning();
            window.particleSystem.addFloatingText(targetMonster.x, targetMonster.y, '☄️ METEOR STRIKE!', '#ea580c', true);
            window.particleSystem.emitShockwave(targetMonster.x, targetMonster.y, 140, '#ea580c', 8);
            window.particleSystem.addGroundEffect(targetMonster.x, targetMonster.y, 100, 3.0, 'plasma', 35);
            targetMonster.takeDamage(200, true, 'fire');
            window.soundEngine.playExplosion(true);
          }
        }
      }

      // Accumulate kinetic battery charge
      if (moveX !== 0 || moveY !== 0) {
        if (window.inventory.hasItem('kinetic_battery')) {
          this.kineticCharge = Math.min(100, this.kineticCharge + dt * 45);
        }
      }

      // Trigger Dash
      if (input.dashPressed && this.dashTimer <= 0) {
        this.performDash(input);
      }
    }

    // Move player and resolve collisions with maze walls
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    window.worldManager.resolveEntityCollisions(this);

    // Check Rune Key pickups
    const nearbyChunks = window.worldManager.getNearbyChunks(this.x, this.y);
    for (const chunk of nearbyChunks) {
      for (const key of chunk.keys) {
        if (!key.isCollected && Vec2.dist(this.x, this.y, key.x, key.y) < this.radius + key.radius) {
          window.worldManager.collectKey(key);
        }
      }
      // Check Runic Gates
      for (const gate of chunk.gates) {
        if (!gate.isUnlocked && Vec2.dist(this.x, this.y, gate.x, gate.y) < this.radius + 35) {
          const hasSkeletonKey = window.inventory && window.inventory.hasItem('skeleton_key');
          if (window.worldManager.playerHasRuneKey || hasSkeletonKey) {
            window.worldManager.unlockGate(gate);
          } else {
            window.uiManager.setInteractionPrompt(true, 'Rune Key Required to Unlock Gate');
          }
        }
      }
    }

    // 2. Barrier recharge
    this.barrierRechargeTimer += dt;
    if (this.barrierRechargeTimer >= 4.0 && this.barrier < this.maxBarrier) {
      this.barrier = Math.min(this.maxBarrier, this.barrier + dt * 15);
    }

    // 3. Orbital Glaives rotation & deflection
    this.orbitAngle += dt * 3.2;
    if (window.inventory.hasItem('orbital_glaives') && enemyProjectiles) {
      const orbitDist = 65;
      const blade1X = this.x + Math.cos(this.orbitAngle) * orbitDist;
      const blade1Y = this.y + Math.sin(this.orbitAngle) * orbitDist;
      const blade2X = this.x + Math.cos(this.orbitAngle + Math.PI) * orbitDist;
      const blade2Y = this.y + Math.sin(this.orbitAngle + Math.PI) * orbitDist;

      // Deflect incoming enemy projectiles
      for (const proj of enemyProjectiles) {
        if (proj.isEnemy && !proj.isDead && proj.canDeflect) {
          if (Vec2.dist(proj.x, proj.y, blade1X, blade1Y) < 22 || Vec2.dist(proj.x, proj.y, blade2X, blade2Y) < 22) {
            proj.isDead = true;
            window.particleSystem.emitSparks(proj.x, proj.y, '#38bdf8', 6);
            window.soundEngine.playHit(false);

            // Synergy: Crimson Aegis recharges barrier on hit
            if (window.inventory.hasSynergy('crimson_aegis')) {
              this.barrier = Math.min(this.maxBarrier, this.barrier + 5);
            }
          }
        }
      }
    }

    // 4. Attack Handling
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (input.isAttacking && this.attackTimer <= 0) {
      const targetList = playerProjectiles || (window.gameEngine && window.gameEngine.projectiles);
      if (targetList) {
        this.performAttack(input, targetList);
      }
    }
  }

  performDash(input) {
    input.dashPressed = false;
    this.isDashing = true;
    this.dashTimer = this.dashCooldown;
    this.dashTimeLeft = this.dashDuration;
    this.isInvulnerable = true;
    this.invulnTimer = this.dashDuration + 0.08;

    // Dash direction
    let dirX = this.vx;
    let dirY = this.vy;
    if (dirX === 0 && dirY === 0) {
      const angle = Vec2.angle(this.x, this.y, input.mouseWorldX, input.mouseWorldY);
      dirX = Math.cos(angle);
      dirY = Math.sin(angle);
    } else {
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
    }

    const dashSpeed = 750;
    this.vx = dirX * dashSpeed;
    this.vy = dirY * dashSpeed;

    window.soundEngine.playDash();

    // Synergy: Void Rift Dash
    if (window.inventory.hasItem('void_rift_dash')) {
      const isSingularity = window.inventory.hasSynergy('void_singularity');
      window.particleSystem.addGroundEffect(
        this.x, 
        this.y, 
        isSingularity ? 140 : 70, 
        3.0, 
        'plasma', 
        isSingularity ? 40 : 20
      );
      window.particleSystem.emitShockwave(this.x, this.y, isSingularity ? 120 : 60, '#a855f7', 4);
    }

    // Boss Power: Crown of the Void Sovereign rift
    if (window.inventory && window.inventory.hasItem('boss_void_crown')) {
      window.particleSystem.addGroundEffect(this.x, this.y, 110, 3.0, 'plasma', 35);
      window.particleSystem.emitShockwave(this.x, this.y, 90, '#a855f7', 6);
    }
  }

  performAttack(input, projectiles) {
    this.attackTimer = this.attackRate;
    const baseAngle = Vec2.angle(this.x, this.y, input.mouseWorldX, input.mouseWorldY);

    // Damage calculations (including Berserker scaling)
    let dmg = this.baseDamage;
    if (window.inventory.hasItem('berserker_crest')) {
      const missingHpPct = 1 - (this.hp / this.maxHp);
      dmg *= (1 + missingHpPct * 1.2);
    }

    const isCrit = Math.random() < this.critChance;
    if (isCrit) dmg *= this.critMultiplier;

    // Pierce calculation
    let pierce = window.inventory.hasItem('piercing_core') ? 2 : 0;
    const isTempest = window.inventory.hasSynergy('tempest_spear') && this.kineticCharge >= 90;

    // Projectile counts (Triple spear)
    const count = window.inventory.hasItem('triple_spear') ? 3 : 1;
    const spreadAngle = 0.22; // ~12 degrees

    for (let i = 0; i < count; i++) {
      let angle = baseAngle;
      if (count === 3) {
        angle = baseAngle + (i - 1) * spreadAngle;
      }

      const pSpeed = this.projectileSpeed * (isTempest ? 1.4 : 1.0);
      const proj = new Projectile({
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * pSpeed,
        vy: Math.sin(angle) * pSpeed,
        radius: isTempest ? 8 : 6,
        color: isTempest ? '#fbbf24' : (isCrit ? '#ec4899' : '#38bdf8'),
        damage: dmg * (isTempest ? 1.5 : 1.0),
        isCrit,
        pierce,
        element: isTempest ? 'electric' : 'physical'
      });
      projectiles.push(proj);
    }

    if (isTempest) {
      this.kineticCharge = 0;
      window.particleSystem.emitShockwave(this.x, this.y, 80, '#fbbf24', 4);
    }

    window.soundEngine.playShoot();
  }

  takeDamage(amount) {
    if (this.isDead || this.isInvulnerable) return;

    this.barrierRechargeTimer = 0;
    let remaining = amount;

    // Barrier absorbs first
    if (this.barrier > 0) {
      if (this.barrier >= remaining) {
        this.barrier -= remaining;
        remaining = 0;
        window.particleSystem.addFloatingText(this.x, this.y, `-${Math.round(amount)}`, '#06b6d4');
      } else {
        remaining -= this.barrier;
        this.barrier = 0;
      }
    }

    if (remaining > 0) {
      this.hp -= remaining;
      window.particleSystem.addFloatingText(this.x, this.y, `-${Math.round(remaining)}`, '#ef4444');
      window.particleSystem.emitBlood(this.x, this.y, '#ef4444', 8);
      window.soundEngine.playHurt();

      // Trigger screen shake
      window.gameEngine.triggerScreenShake(10, 0.25);
    }

    // Check death
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      window.soundEngine.playExplosion(true);
      window.gameEngine.onPlayerDeath();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    window.particleSystem.addFloatingText(this.x, this.y, `+${Math.round(amount)}`, '#22c55e', false, '+');
  }

  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level += 1;
      this.xpNeeded = Math.floor(this.xpNeeded * 1.35 + 25);
      if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
        window.soundEngine.playLevelUp();
      }
      if (window.gameEngine && typeof window.gameEngine.openUpgradeModal === 'function') {
        window.gameEngine.openUpgradeModal('LEVEL UP!');
      }
    }
  }

  resolveObstacleCollisions(obstacles) {
    for (const obs of obstacles) {
      const d = Vec2.dist(this.x, this.y, obs.x, obs.y);
      const minDist = this.radius + obs.radius;
      if (d < minDist && d > 0) {
        const overlap = minDist - d;
        const angle = Vec2.angle(obs.x, obs.y, this.x, this.y);
        this.x += Math.cos(angle) * overlap;
        this.y += Math.sin(angle) * overlap;
      }
    }
  }

  draw(ctx, camera, input) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    // 1. Draw Orbital Glaives
    if (window.inventory.hasItem('orbital_glaives')) {
      const orbitDist = 65;
      [0, Math.PI].forEach(offset => {
        const gx = sx + Math.cos(this.orbitAngle + offset) * orbitDist;
        const gy = sy + Math.sin(this.orbitAngle + offset) * orbitDist;

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(gx, gy, 8, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, orbitDist, this.orbitAngle + offset - 0.4, this.orbitAngle + offset);
        ctx.stroke();
      });
    }

    // 2. Aiming Reticle Line
    const aimAngle = Vec2.angle(this.x, this.y, input.mouseWorldX, input.mouseWorldY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(aimAngle) * 90, sy + Math.sin(aimAngle) * 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Player Body (Arcane Vanguard)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = this.isInvulnerable ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = this.isInvulnerable ? '#fbbf24' : '#38bdf8';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Directional Spear indicator
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(sx + Math.cos(aimAngle) * 14, sy + Math.sin(aimAngle) * 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Shield aura ring if barrier active
    if (this.barrier > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Monster Base & Archetypes
// ---------------------------------------------------------------------------
class Monster {
  constructor(x, y, archetype = 'skitterer', threatMultiplier = 1.0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.archetype = archetype;
    this.threatMultiplier = threatMultiplier;
    this.isDead = false;

    // Status effects
    this.burnDuration = 0;
    this.burnDamage = 0;
    this.slowDuration = 0;
    this.slowMultiplier = 1.0;
    this.chillStacks = 0;
    this.freezeDuration = 0;

    // Archetype Setup
    this.setupArchetype();
  }

  setupArchetype() {
    switch (this.archetype) {
      case 'skitterer': // Fast Swarmer
        this.radius = 14;
        this.maxHp = 45 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 210 * Math.min(1.4, 0.9 + this.threatMultiplier * 0.1);
        this.color = '#ef4444';
        this.contactDamage = 14 * this.threatMultiplier;
        this.flankOffset = (Math.random() - 0.5) * 1.2;
        break;

      case 'spitter': // Ranged Kiter
        this.radius = 18;
        this.maxHp = 70 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 150;
        this.color = '#22c55e';
        this.contactDamage = 10;
        this.shootTimer = Math.random() * 2.0;
        this.preferredRange = 320;
        break;

      case 'juggernaut': // Heavy Tank & Charger
        this.radius = 28;
        this.maxHp = 260 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 95;
        this.color = '#a855f7';
        this.contactDamage = 30 * this.threatMultiplier;
        this.isCharging = false;
        this.chargeTimer = 3.0;
        this.chargeWarning = 0;
        break;

      case 'stalker': // Shadow Assassin
        this.radius = 16;
        this.maxHp = 80 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 260;
        this.color = '#64748b';
        this.contactDamage = 28 * this.threatMultiplier;
        this.stealthAlpha = 0.25;
        break;

      case 'boss': // Apex Entity
        this.radius = 48;
        this.maxHp = 1200 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 100;
        this.color = '#ec4899';
        this.contactDamage = 45 * this.threatMultiplier;
        this.attackPhaseTimer = 2.0;
        this.phase = 1;
        break;

      case 'boss_void': // Malakor, Void Monarch
        this.bossName = 'Malakor, Void Monarch';
        this.bossTitle = 'Apex Entity • Cosmic Abomination';
        this.radius = 48;
        this.maxHp = 1800 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 95;
        this.color = '#a855f7';
        this.contactDamage = 45 * this.threatMultiplier;
        this.isUniqueBoss = true;
        this.bossRelicReward = 'boss_void_crown';
        this.attackPhaseTimer = 2.5;
        this.phase = 1;
        this.teleportCooldown = 6.0;
        break;

      case 'boss_fire': // Ignis, Infernal Titan
        this.bossName = 'Ignis, Infernal Titan';
        this.bossTitle = 'Calamity Elemental • Magma Sovereign';
        this.radius = 52;
        this.maxHp = 2400 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 80;
        this.color = '#ea580c';
        this.contactDamage = 55 * this.threatMultiplier;
        this.isUniqueBoss = true;
        this.bossRelicReward = 'boss_infernal_core';
        this.meteorTimer = 4.0;
        this.chargeTimer = 5.0;
        this.chargeWarning = 0;
        this.isCharging = false;
        this.chargeTimeLeft = 0;
        break;

      case 'boss_storm': // Zephyrus, Tempest Wyrm
        this.bossName = 'Zephyrus, Tempest Wyrm';
        this.bossTitle = 'Primordial Serpent • Storm Avatar';
        this.radius = 42;
        this.maxHp = 1500 * this.threatMultiplier;
        this.hp = this.maxHp;
        this.speed = 135;
        this.color = '#06b6d4';
        this.contactDamage = 38 * this.threatMultiplier;
        this.isUniqueBoss = true;
        this.bossRelicReward = 'boss_tempest_eye';
        this.ballLightningTimer = 3.2;
        this.strikeTimer = 4.5;
        break;

      case 'dummy': // Training Practice Dummy
        this.radius = 16;
        this.maxHp = 60;
        this.hp = this.maxHp;
        this.speed = 90;
        this.color = '#fbbf24';
        this.contactDamage = 4;
        this.isTrainingDummy = true;
        break;
    }
  }

  update(dt, player, obstacles, enemyProjectiles) {
    if (this.isDead) return;

    // 1. Status effects
    if (this.freezeDuration > 0) {
      this.freezeDuration -= dt;
      return; // Immobilized while frozen!
    }

    if (this.burnDuration > 0) {
      this.burnDuration -= dt;
      this.hp -= this.burnDamage * dt;
      if (this.hp <= 0) {
        this.die(player);
        return;
      }
    }

    let effectiveSpeed = this.speed;
    if (this.slowDuration > 0) {
      this.slowDuration -= dt;
      effectiveSpeed *= this.slowMultiplier;
    }

    const distToPlayer = Vec2.dist(this.x, this.y, player.x, player.y);
    const angleToPlayer = Vec2.angle(this.x, this.y, player.x, player.y);

    // 2. Archetype Behaviors
    if (this.archetype === 'skitterer') {
      // Swarm in with flanking arc
      const flankAngle = angleToPlayer + this.flankOffset;
      this.vx = Math.cos(flankAngle) * effectiveSpeed;
      this.vy = Math.sin(flankAngle) * effectiveSpeed;
    } 
    else if (this.archetype === 'spitter') {
      // Kiting logic: maintain preferred standoff distance
      if (distToPlayer < this.preferredRange - 40) {
        // Back away!
        this.vx = -Math.cos(angleToPlayer) * effectiveSpeed;
        this.vy = -Math.sin(angleToPlayer) * effectiveSpeed;
      } else if (distToPlayer > this.preferredRange + 60) {
        // Move closer
        this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
        this.vy = Math.sin(angleToPlayer) * effectiveSpeed;
      } else {
        // Strafe
        this.vx = Math.cos(angleToPlayer + Math.PI / 2) * (effectiveSpeed * 0.6);
        this.vy = Math.sin(angleToPlayer + Math.PI / 2) * (effectiveSpeed * 0.6);
      }

      // Shoot acid projectile if line of sight is clear through corridors
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && distToPlayer < 650 && Vec2.hasLineOfSight(this.x, this.y, player.x, player.y)) {
        this.shootTimer = 2.2;
        // Lead shot slightly
        const pSpeed = 380;
        enemyProjectiles.push(new Projectile({
          x: this.x,
          y: this.y,
          vx: Math.cos(angleToPlayer) * pSpeed,
          vy: Math.sin(angleToPlayer) * pSpeed,
          radius: 7,
          color: '#22c55e',
          damage: 16 * this.threatMultiplier,
          isEnemy: true,
          element: 'acid'
        }));
      }
    }
    else if (this.archetype === 'juggernaut') {
      // Charge mechanic
      this.chargeTimer -= dt;
      if (this.chargeWarning > 0) {
        this.chargeWarning -= dt;
        this.vx = 0;
        this.vy = 0;
        if (this.chargeWarning <= 0) {
          // Unleash charge!
          this.isCharging = true;
          this.chargeTargetAngle = angleToPlayer;
          window.soundEngine.playExplosion(false);
        }
      } else if (this.isCharging) {
        const chargeSpeed = 480;
        this.vx = Math.cos(this.chargeTargetAngle) * chargeSpeed;
        this.vy = Math.sin(this.chargeTargetAngle) * chargeSpeed;
        this.chargeTimer -= dt * 2.5;

        // Smash cracked walls during charge
        window.worldManager.damageCrackedWall(
          this.x + Math.cos(this.chargeTargetAngle) * 30,
          this.y + Math.sin(this.chargeTargetAngle) * 30,
          80
        );

        if (this.chargeTimer <= -1.2) {
          this.isCharging = false;
          this.chargeTimer = 3.5;
          window.particleSystem.emitShockwave(this.x, this.y, 80, '#a855f7', 4);
        }
      } else {
        // Slowly advance
        this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
        this.vy = Math.sin(angleToPlayer) * effectiveSpeed;

        if (this.chargeTimer <= 0 && distToPlayer < 500 && Vec2.hasLineOfSight(this.x, this.y, player.x, player.y)) {
          this.chargeWarning = 0.6; // 0.6s telegraph
        }
      }
    }
    else if (this.archetype === 'stalker') {
      // High speed pounce
      this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
      this.vy = Math.sin(angleToPlayer) * effectiveSpeed;
      this.stealthAlpha = distToPlayer < 180 ? 0.95 : 0.25;
    }
    else if (this.archetype === 'boss') {
      // Multi-phase boss pattern
      this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
      this.vy = Math.sin(angleToPlayer) * effectiveSpeed;

      this.attackPhaseTimer -= dt;
      if (this.attackPhaseTimer <= 0) {
        this.attackPhaseTimer = 3.0;
        // Radial 12-way bullet burst
        const bullets = 12;
        for (let b = 0; b < bullets; b++) {
          const bAngle = (b / bullets) * Math.PI * 2 + (this.phase * 0.3);
          enemyProjectiles.push(new Projectile({
            x: this.x,
            y: this.y,
            vx: Math.cos(bAngle) * 320,
            vy: Math.sin(bAngle) * 320,
            radius: 8,
            color: '#ec4899',
            damage: 22 * this.threatMultiplier,
            isEnemy: true,
            element: 'void'
          }));
        }
        window.soundEngine.playShoot();
      }
    }
    else if (this.archetype === 'boss_void') {
      // Malakor, Void Monarch: moves in, fires spiral void volleys, and blinks with singularity pull
      this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
      this.vy = Math.sin(angleToPlayer) * effectiveSpeed;

      this.attackPhaseTimer -= dt;
      this.teleportCooldown -= dt;

      // Teleport blink
      if (this.teleportCooldown <= 0 && distToPlayer > 220 && Vec2.hasLineOfSight(this.x, this.y, player.x, player.y)) {
        this.teleportCooldown = 6.5;
        window.particleSystem.emitShockwave(this.x, this.y, 90, '#a855f7', 4);
        const blinkAngle = angleToPlayer + (Math.random() - 0.5) * 0.8;
        this.x = player.x - Math.cos(blinkAngle) * 160;
        this.y = player.y - Math.sin(blinkAngle) * 160;
        window.soundEngine.playDash();
        window.particleSystem.emitShockwave(this.x, this.y, 110, '#a855f7', 6);
        window.particleSystem.addGroundEffect(this.x, this.y, 110, 2.5, 'plasma', 35);
      }

      // Spiral void barrage
      if (this.attackPhaseTimer <= 0) {
        this.attackPhaseTimer = this.hp < this.maxHp * 0.5 ? 2.0 : 3.0;
        const count = this.hp < this.maxHp * 0.5 ? 14 : 8;
        for (let b = 0; b < count; b++) {
          const bAngle = (b / count) * Math.PI * 2 + (Date.now() * 0.002);
          enemyProjectiles.push(new Projectile({
            x: this.x,
            y: this.y,
            vx: Math.cos(bAngle) * 310,
            vy: Math.sin(bAngle) * 310,
            radius: 8,
            color: '#a855f7',
            damage: 24 * this.threatMultiplier,
            isEnemy: true,
            element: 'void'
          }));
        }
        window.soundEngine.playShoot();
      }
    }
    else if (this.archetype === 'boss_fire') {
      // Ignis, Infernal Titan: magma charges, meteor strikes, and fiery projectile volleys
      this.meteorTimer -= dt;
      this.chargeTimer -= dt;

      // Meteor Strike
      if (this.meteorTimer <= 0) {
        this.meteorTimer = 4.2;
        window.soundEngine.playMeteorWarning();
        const mx = player.x + (Math.random() - 0.5) * 60;
        const my = player.y + (Math.random() - 0.5) * 60;
        window.particleSystem.addFloatingText(mx, my, '⚠️ METEOR!', '#ea580c', true);
        setTimeout(() => {
          if (!this.isDead) {
            window.particleSystem.emitShockwave(mx, my, 130, '#ea580c', 8);
            window.particleSystem.addGroundEffect(mx, my, 100, 3.0, 'plasma', 45);
            window.soundEngine.playExplosion(true);
            if (Vec2.dist(player.x, player.y, mx, my) < 90) {
              player.takeDamage(40 * this.threatMultiplier);
            }
          }
        }, 750);
      }

      // Magma charge
      if (this.isCharging) {
        this.chargeTimeLeft -= dt;
        window.particleSystem.emitTrail(this.x, this.y, '#ea580c', 16);
        window.particleSystem.addGroundEffect(this.x, this.y, 45, 2.0, 'plasma', 25);
        if (this.chargeTimeLeft <= 0) {
          this.isCharging = false;
        }
      } else {
        if (this.chargeWarning > 0) {
          this.chargeWarning -= dt;
          this.vx = 0;
          this.vy = 0;
          if (this.chargeWarning <= 0) {
            this.isCharging = true;
            this.chargeTimeLeft = 0.8;
            const chargeAngle = Vec2.angle(this.x, this.y, player.x, player.y);
            this.vx = Math.cos(chargeAngle) * 520;
            this.vy = Math.sin(chargeAngle) * 520;
            window.soundEngine.playExplosion(false);
          }
        } else {
          this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
          this.vy = Math.sin(angleToPlayer) * effectiveSpeed;
          if (this.chargeTimer <= 0 && distToPlayer < 450 && Vec2.hasLineOfSight(this.x, this.y, player.x, player.y)) {
            this.chargeTimer = 5.5;
            this.chargeWarning = 0.7; // Telegraph
          }
        }
      }
    }
    else if (this.archetype === 'boss_storm') {
      // Zephyrus, Tempest Wyrm: fast strafing, drifting ball lightning, and sky thunderbolts
      const strafeAngle = angleToPlayer + Math.PI * 0.45;
      this.vx = (Math.cos(angleToPlayer) * 0.6 + Math.cos(strafeAngle) * 0.7) * effectiveSpeed;
      this.vy = (Math.sin(angleToPlayer) * 0.6 + Math.sin(strafeAngle) * 0.7) * effectiveSpeed;

      this.ballLightningTimer -= dt;
      this.strikeTimer -= dt;

      // Ball lightning
      if (this.ballLightningTimer <= 0) {
        this.ballLightningTimer = 3.5;
        const count = 4;
        for (let i = 0; i < count; i++) {
          const bAngle = angleToPlayer + (i - 1.5) * 0.35;
          enemyProjectiles.push(new Projectile({
            x: this.x,
            y: this.y,
            vx: Math.cos(bAngle) * 230,
            vy: Math.sin(bAngle) * 230,
            radius: 11,
            color: '#06b6d4',
            damage: 22 * this.threatMultiplier,
            isEnemy: true,
            element: 'electric'
          }));
        }
        window.soundEngine.playShoot();
      }

      // Sky Thunderbolts
      if (this.strikeTimer <= 0) {
        this.strikeTimer = 5.0;
        const tx = player.x + (Math.random() - 0.5) * 70;
        const ty = player.y + (Math.random() - 0.5) * 70;
        window.particleSystem.addFloatingText(tx, ty, '⚡ THUNDERBOLT!', '#06b6d4', true);
        setTimeout(() => {
          if (!this.isDead) {
            window.particleSystem.emitSparks(tx, ty, '#06b6d4', 24, 250);
            window.particleSystem.emitShockwave(tx, ty, 90, '#06b6d4', 6);
            window.soundEngine.playCrit();
            if (Vec2.dist(player.x, player.y, tx, ty) < 65) {
              player.takeDamage(32 * this.threatMultiplier);
            }
          }
        }, 550);
      }
    }
    else if (this.archetype === 'dummy') {
      // Training dummy: slowly advances toward player when in range, enabling tactical trap luring!
      if (distToPlayer < 450) {
        this.vx = Math.cos(angleToPlayer) * effectiveSpeed;
        this.vy = Math.sin(angleToPlayer) * effectiveSpeed;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    }

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Resolve tile collisions with maze walls
    window.worldManager.resolveEntityCollisions(this);

    // Contact damage with player
    if (!player.isInvulnerable && distToPlayer < this.radius + player.radius) {
      // Unique Boss Power: Eye of the Tempest Wyrm electrostatic barrier shock!
      if (window.inventory && window.inventory.hasItem('boss_tempest_eye') && player.barrier > 0) {
        this.takeDamage(75, true, 'electric');
        window.particleSystem.emitSparks(this.x, this.y, '#06b6d4', 16, 200);
        window.particleSystem.addFloatingText(this.x, this.y, 'STATIC ZAP! -75', '#06b6d4', true);
        window.soundEngine.playCrit();
        this.x -= Math.cos(angleToPlayer) * 120;
        this.y -= Math.sin(angleToPlayer) * 120;
      }

      player.takeDamage(this.contactDamage);
      // Knock player back slightly
      const kb = 180;
      player.x += Math.cos(angleToPlayer) * kb * dt;
      player.y += Math.sin(angleToPlayer) * kb * dt;
    }
  }

  takeDamage(amount, isCrit = false, element = 'physical') {
    if (this.isDead) return;

    this.hp -= amount;
    window.particleSystem.addFloatingText(this.x, this.y, Math.round(amount), isCrit ? '#fbbf24' : '#f1f5f9', isCrit);
    window.particleSystem.emitBlood(this.x, this.y, this.color, 6);

    if (isCrit) {
      window.soundEngine.playCrit();
      // Vampiric Fang on crit
      if (window.inventory.hasItem('vampiric_fang')) {
        window.player.heal(6);
      }
    } else {
      window.soundEngine.playHit(this.archetype === 'juggernaut' || this.archetype === 'boss');
    }

    // Elemental effects
    if (window.inventory.hasItem('flame_infusion')) {
      this.applyBurn(amount * 0.4, 3.0);
    }
    if (window.inventory.hasItem('frostbite_needle')) {
      this.applySlow(0.6, 2.0);
      this.chillStacks += 1;
      if (this.chillStacks >= 3) {
        this.freezeDuration = 1.5;
        this.chillStacks = 0;
      }
    }

    // Synergy: Absolute Shatter detonation
    if (window.inventory.hasSynergy('absolute_shatter') && this.freezeDuration > 0) {
      this.hp -= amount * 1.5; // Massive shatter bonus
      window.particleSystem.emitShockwave(this.x, this.y, 90, '#93c5fd', 4);
      window.particleSystem.addGroundEffect(this.x, this.y, 60, 2.0, 'frost', 30);
      window.soundEngine.playExplosion(false);
    }

    if (this.isUniqueBoss && window.uiManager) {
      window.uiManager.updateBossHealth(this);
    }

    if (this.hp <= 0) {
      this.die(window.player);
    }
  }

  applyBurn(dps, duration) {
    this.burnDamage = Math.max(this.burnDamage, dps);
    this.burnDuration = Math.max(this.burnDuration, duration);
  }

  applySlow(multiplier, duration) {
    this.slowMultiplier = multiplier;
    this.slowDuration = duration;
  }

  die(player) {
    if (this.isDead) return;
    this.isDead = true;
    player.enemiesDefeated += 1;

    // Drop XP / Health pickups
    const xpVal = this.archetype === 'boss' ? 120 : (this.archetype === 'juggernaut' ? 35 : 12);
    window.gameEngine.pickups.push(new Pickup(this.x, this.y, 'xp', xpVal * this.threatMultiplier));

    if (Math.random() < 0.18 || this.archetype === 'boss') {
      window.gameEngine.pickups.push(new Pickup(this.x + 10, this.y + 10, 'health', 25));
    }

    // Unique Boss Slain
    if (this.isUniqueBoss) {
      if (window.gameEngine && typeof window.gameEngine.spawnResonanceShards === 'function') {
        window.gameEngine.spawnResonanceShards(this.x, this.y, 25);
      }
      window.gameEngine.pickups.push(new Pickup(this.x + 15, this.y + 15, 'health', 50));
      window.gameEngine.pickups.push(new Pickup(this.x - 15, this.y - 15, 'health', 50));
      window.soundEngine.playBossDeath();
      if (window.gameEngine) {
        window.gameEngine.triggerScreenShake(24, 0.9);
        window.gameEngine.onBossDefeated(this);
      }
    }

    // Synergy: Toxic Cataclysm (Caustic Spores)
    if (window.inventory.hasItem('acid_spores')) {
      const isCataclysm = window.inventory.hasSynergy('toxic_cataclysm');
      window.particleSystem.addGroundEffect(this.x, this.y, isCataclysm ? 100 : 50, 3.5, 'acid', isCataclysm ? 35 : 15);
    }

    // Vampiric Fang on kill
    if (window.inventory.hasItem('vampiric_fang')) {
      player.heal(2);
    }

    window.particleSystem.emitSparks(this.x, this.y, this.color, 12, 220);
    window.soundEngine.playHit(true);
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.globalAlpha = this.stealthAlpha !== undefined ? this.stealthAlpha : 1.0;

    // Charge telegraph warning line
    if (this.chargeWarning > 0) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const toP = Vec2.angle(this.x, this.y, window.player.x, window.player.y);
      ctx.lineTo(sx + Math.cos(toP) * 350, sy + Math.sin(toP) * 350);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Freeze ice coating
    if (this.freezeDuration > 0) {
      ctx.fillStyle = '#bae6fd';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
    }

    if (this.isUniqueBoss) {
      // 1. Glowing outer elemental aura ring with rotating runes
      const time = Date.now() * 0.003;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 12 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Rotating orbital energy motes
      const motes = 4;
      for (let m = 0; m < motes; m++) {
        const mAngle = time + (m / motes) * Math.PI * 2;
        const mx = sx + Math.cos(mAngle) * (this.radius + 16);
        const my = sy + Math.sin(mAngle) * (this.radius + 16);
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      // 3. Inner pulsing core
      const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.radius);
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.4, this.color);
      innerGrad.addColorStop(1, '#05050a');
      ctx.fillStyle = innerGrad;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Overhead Boss Name & Skull
      ctx.fillStyle = this.color;
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`👑 ${this.bossName}`, sx, sy - this.radius - 16);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar above monster
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2;
      const barH = 4;
      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - barW / 2, sy - this.radius - 8, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx - barW / 2, sy - this.radius - 8, barW * hpPct, barH);
    }
    if (this.isTrainingDummy) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️ TARGET', sx, sy - this.radius - (this.hp < this.maxHp ? 14 : 8));
    }
    ctx.restore();
  }
}

// Global player singleton
window.player = new Player();
