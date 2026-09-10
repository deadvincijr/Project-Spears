/**
 * Aegis of the Void - High Performance Particle & Floating Combat Text Engine
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.groundEffects = [];
    this.maxParticles = 800;
  }

  reset() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.groundEffects = [];
  }

  // --- Emitters ---

  // Impact sparks (e.g. spear hit, ricochet)
  emitSparks(x, y, color = '#38bdf8', count = 10, speed = 180) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        decay: Math.random() * 2.5 + 2.0, // life = 1/decay
        drag: 0.92,
        blend: 'lighter'
      });
    }
  }

  // Blood / ichor splatters
  emitBlood(x, y, color = '#dc2626', count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 120 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 3.5 + 2,
        color,
        alpha: 0.9,
        decay: Math.random() * 1.5 + 1.2,
        drag: 0.88,
        blend: 'source-over'
      });
    }
  }

  // Dash ghosting / void trail
  emitTrail(x, y, color = '#818cf8', size = 8) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size,
      color,
      alpha: 0.7,
      decay: 3.5,
      drag: 0.95,
      blend: 'lighter'
    });
  }

  // Expanding shockwave ring
  emitShockwave(x, y, maxRadius = 80, color = '#38bdf8', lineWidth = 4) {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      lineWidth,
      alpha: 1,
      speed: (maxRadius - 10) * 4 // completes in ~0.25s
    });
  }

  // Ground hazard / lingering elemental pool
  addGroundEffect(x, y, radius = 45, duration = 3.0, type = 'plasma', damagePerSec = 15) {
    this.groundEffects.push({
      x,
      y,
      radius,
      duration,
      maxDuration: duration,
      type, // 'plasma', 'acid', 'frost'
      damagePerSec,
      pulseTick: 0
    });
  }

  // Floating Combat Text (damage numbers, healing, status)
  addFloatingText(x, y, text, color = '#ffffff', isCrit = false, prefix = '') {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      text: `${prefix}${text}`,
      color,
      isCrit,
      size: isCrit ? 20 : 13,
      alpha: 1,
      vy: isCrit ? -70 : -45,
      life: 0.85
    });
  }

  // --- Update & Render ---

  update(dt, player, enemies) {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Floating Combat Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 0.85);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 4. Update Ground Effects and tick damage
    for (let i = this.groundEffects.length - 1; i >= 0; i--) {
      const ge = this.groundEffects[i];
      ge.duration -= dt;
      ge.pulseTick += dt;

      if (ge.pulseTick >= 0.25) {
        ge.pulseTick = 0;
        const tickDmg = ge.damagePerSec * 0.25;

        // Apply damage to enemies inside
        if (enemies) {
          for (const enemy of enemies) {
            if (!enemy.isDead) {
              const dx = enemy.x - ge.x;
              const dy = enemy.y - ge.y;
              if (dx * dx + dy * dy <= (ge.radius + enemy.radius) * (ge.radius + enemy.radius)) {
                enemy.takeDamage(tickDmg, false, ge.type);
                if (ge.type === 'frost') {
                  enemy.applySlow(0.5, 1.0);
                } else if (ge.type === 'acid') {
                  enemy.applyBurn(tickDmg * 0.5, 2.0);
                }
              }
            }
          }
        }
      }

      if (ge.duration <= 0) {
        this.groundEffects.splice(i, 1);
      }
    }
  }

  // Render ground effects beneath entities
  drawGroundEffects(ctx, camera) {
    for (const ge of this.groundEffects) {
      const sx = ge.x - camera.x;
      const sy = ge.y - camera.y;
      const progress = ge.duration / ge.maxDuration;
      const alpha = Math.min(0.6, progress * 0.8);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, ge.radius, 0, Math.PI * 2);

      let grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, ge.radius);
      if (ge.type === 'plasma') {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.4)');
        grad.addColorStop(1, 'transparent');
      } else if (ge.type === 'acid') {
        grad.addColorStop(0, 'rgba(34, 197, 94, 0.7)');
        grad.addColorStop(0.7, 'rgba(16, 185, 129, 0.4)');
        grad.addColorStop(1, 'transparent');
      } else if (ge.type === 'frost') {
        grad.addColorStop(0, 'rgba(186, 230, 253, 0.8)');
        grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.3)');
        grad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  // Render particles and floating texts above entities
  draw(ctx, camera) {
    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      const sx = sw.x - camera.x;
      const sy = sw.y - camera.y;
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth;
      ctx.strokeStyle = sw.color;
      ctx.beginPath();
      ctx.arc(sx, sy, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Particles
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.globalCompositeOperation = p.blend;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Floating Combat Texts
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const ft of this.floatingTexts) {
      const sx = ft.x - camera.x;
      const sy = ft.y - camera.y;
      ctx.globalAlpha = ft.alpha;
      ctx.font = ft.isCrit 
        ? `900 ${ft.size}px "JetBrains Mono", monospace` 
        : `700 ${ft.size}px "JetBrains Mono", monospace`;

      // Shadow / Outline
      ctx.strokeStyle = '#04060d';
      ctx.lineWidth = ft.isCrit ? 4 : 3;
      ctx.strokeText(ft.text, sx, sy);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
    }
    ctx.restore();
  }
}

// Global particle engine singleton
window.particleSystem = new ParticleSystem();
