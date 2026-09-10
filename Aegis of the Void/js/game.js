/**
 * Aegis of the Void - Core Game Loop, State Machine, Camera & Controller
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = 'MAIN_MENU'; // 'MAIN_MENU', 'PLAYING', 'UPGRADE_MODAL', 'CODEX', 'PAUSED', 'GAME_OVER'
    this.previousState = 'PLAYING';
    this.menuAngle = 0;
    this.lastTime = performance.now();

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      shakeIntensity: 0,
      shakeDuration: 0
    };

    // Input state
    this.input = {
      keys: {},
      mouseScreenX: 0,
      mouseScreenY: 0,
      mouseWorldX: 0,
      mouseWorldY: 0,
      isAttacking: false,
      dashPressed: false
    };

    // Active entities
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.monsters = [];
    this.pickups = [];

    // Spawning controls
    this.spawnTimer = 0;
    this.maxMonsters = 60;
    this.activeTrialShrine = null;
    this.trialMonstersRemaining = 0;

    // Phalanx timer
    this.phalanxTimer = 0;

    // Tutorial state
    this.tutorialStep = 1;
    this.totalTutorialSteps = 8;
    this.tutorialObjectives = [
      {
        step: 1,
        title: 'MOVEMENT & NAVIGATION',
        desc: 'Use <span class="cd-key">W</span> <span class="cd-key">A</span> <span class="cd-key">S</span> <span class="cd-key">D</span> or <span class="cd-key">Arrow Keys</span> to navigate down the training corridor to the target dais.',
        targetX: 380,
        targetY: 400
      },
      {
        step: 2,
        title: 'AIM & ARCANE SPEARS',
        desc: 'Aim with your <span class="cd-key">Mouse</span> and <span class="cd-key">Left Click</span> (holdable) to shatter all 3 training urns. Broken pots drop resonance shards and healing draughts.',
        targetX: 650,
        targetY: 400
      },
      {
        step: 3,
        title: 'VOID DASH & INVULNERABILITY',
        desc: 'Press <span class="cd-key">Spacebar</span> or <span class="cd-key">Right Click</span> to perform a Void Dash. Your invulnerability frames allow you to dash across bottomless chasms and hazards safely!',
        targetX: 1120,
        targetY: 400
      },
      {
        step: 4,
        title: 'DEMOLITION & SECRET PASSAGES',
        desc: 'Encounter a stone wall with amber fissures. Attack the cracked masonry with your arcane spears to demolish it and forge a path forward!',
        targetX: 1425,
        targetY: 400
      },
      {
        step: 5,
        title: 'HAZARD TRAPS & TACTICAL KITING',
        desc: 'Floor plates with amber warning runes (<span style="color:#fbbf24; font-weight:bold;">⚠</span>) are about to trigger deadly spikes! Defeat the training dummy or lure it across the active trap spikes for massive damage.',
        targetX: 1880,
        targetY: 400
      },
      {
        step: 6,
        title: 'ANCIENT RUNE RIDDLES',
        desc: 'Inspect the Riddle Tablet (<span class="cd-key">E</span>) and step upon the 3 colored floor glyphs in sequence: <span style="color:#38bdf8; font-weight:bold;">Moon (🌙) ➔ Star (⭐) ➔ Sun (☀️)</span> to solve the ancient enigma!',
        targetX: 2180,
        targetY: 400
      },
      {
        step: 7,
        title: 'RELICS & FORGED SYNERGIES',
        desc: 'Press <span class="cd-key">E</span> to open the Training Relic Chest and select your empowerment. Discover how pairing complementary relics forges devastating Synergies!',
        targetX: 2575,
        targetY: 400
      },
      {
        step: 8,
        title: 'RUNIC VAULTS & THE ABYSS',
        desc: 'Collect the golden Rune Key (<span style="color:#fbbf24; font-weight:bold;">🗝️</span>), unlock the glowing Runic Gate (<span class="cd-key">E</span>), and step into the Abyss Descent Portal to begin your journey!',
        targetX: 3075,
        targetY: 400
      }
    ];

    this.initCanvas();
    this.initEvents();
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      window.soundEngine.ensureContext();
      this.input.keys[e.code] = true;

      // Dash via Spacebar
      if (e.code === 'Space') {
        this.input.dashPressed = true;
      }

      // Interaction via E
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }

      // Toggle Codex via Tab or I
      if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        window.uiManager.toggleCodex(window.inventory);
      }

      // Pause / Close modal via Escape or P
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (window.uiManager.controlsModal && window.uiManager.controlsModal.classList.contains('active')) {
          window.uiManager.hideControlsModal();
        } else if (window.uiManager.codexModal && window.uiManager.codexModal.classList.contains('active')) {
          window.uiManager.closeCodex();
        } else if (this.state === 'PLAYING') {
          this.state = 'PAUSED';
          window.uiManager.showPauseModal();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }

      // Quick-pick cards with 1, 2, 3
      if (this.state === 'UPGRADE_MODAL') {
        const keyMap = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2 };
        if (keyMap[e.code] !== undefined) {
          const cards = window.uiManager.upgradeCardsGrid.children;
          if (cards && cards[keyMap[e.code]]) {
            cards[keyMap[e.code]].click();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
      if (e.code === 'Space') {
        this.input.dashPressed = false;
      }
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.input.mouseScreenX = e.clientX;
      this.input.mouseScreenY = e.clientY;
      this.updateMouseWorld();
    });

    // Mouse click / hold to attack
    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'PLAYING' && this.state !== 'TUTORIAL') return;
      window.soundEngine.ensureContext();
      if (e.button === 0) { // Left click
        this.input.isAttacking = true;
      } else if (e.button === 2) { // Right click = Dash
        this.input.dashPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.isAttacking = false;
      } else if (e.button === 2) {
        this.input.dashPressed = false;
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Main Menu Start Button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startDescent();
      });
    }

    // Restart button on Game Over modal
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.restartRun();
      });
    }

    // Title Screen button on Game Over modal
    const gameOverMainMenuBtn = document.getElementById('gameOverMainMenuBtn');
    if (gameOverMainMenuBtn) {
      gameOverMainMenuBtn.addEventListener('click', () => {
        this.goToMainMenu();
      });
    }

    // Pause Modal Buttons
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.resumeGame();
      });
    }

    const pauseRestartBtn = document.getElementById('pauseRestartBtn');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        window.uiManager.hidePauseModal();
        this.restartRun();
      });
    }

    const pauseMainMenuBtn = document.getElementById('pauseMainMenuBtn');
    if (pauseMainMenuBtn) {
      pauseMainMenuBtn.addEventListener('click', () => {
        this.goToMainMenu();
      });
    }

    // Close codex button
    const closeCodexBtn = document.getElementById('closeCodexBtn');
    if (closeCodexBtn) {
      closeCodexBtn.addEventListener('click', () => {
        window.uiManager.closeCodex();
      });
    }
  }

  updateMouseWorld() {
    this.input.mouseWorldX = this.input.mouseScreenX + this.camera.x;
    this.input.mouseWorldY = this.input.mouseScreenY + this.camera.y;
  }

  triggerScreenShake(intensity = 8, duration = 0.2) {
    this.camera.shakeIntensity = intensity;
    this.camera.shakeDuration = duration;
  }

  // Handle player interactions with POIs (Chests, Shrines, Wells, Riddle Tablets)
  handleInteraction() {
    if (this.state !== 'PLAYING' && this.state !== 'TUTORIAL') return;

    const nearbyPOIs = window.worldManager.getNearbyPOIs(
      this.camera.x, this.camera.y, this.canvas.width, this.canvas.height
    );

    for (const poi of nearbyPOIs) {
      const dist = Vec2.dist(window.player.x, window.player.y, poi.x, poi.y);
      if (dist < poi.radius + window.player.radius + 35) {
        if (poi.type === 'chest' && !poi.isOpened) {
          // Open chest
          window.worldManager.openChest(poi.id);
          window.soundEngine.playChest();
          this.openUpgradeModal(`${poi.chestType.toUpperCase()} RELIC DISCOVERED`);
          return;
        } else if (poi.type === 'shrine_combat' && !poi.isCleared && !poi.isActive) {
          // Trigger combat wave
          poi.isActive = true;
          this.activeTrialShrine = poi;
          this.spawnShrineGuardians(poi);
          window.soundEngine.playExplosion(false);
          window.particleSystem.emitShockwave(poi.x, poi.y, 180, '#ef4444', 6);
          return;
        } else if (poi.type === 'shrine_blood' && !poi.isUsed) {
          // Blood sacrifice
          const hpCost = Math.round(window.player.maxHp * 0.25);
          if (window.player.hp > hpCost + 5) {
            window.player.hp -= hpCost;
            window.worldManager.clearShrine(poi.id);
            window.soundEngine.playHurt();
            window.particleSystem.emitBlood(window.player.x, window.player.y, '#dc2626', 20);
            this.openUpgradeModal('FORBIDDEN BLOOD BOON');
          } else {
            window.particleSystem.addFloatingText(window.player.x, window.player.y, 'NOT ENOUGH LIFE!', '#ef4444');
          }
          return;
        } else if (poi.type.startsWith('shrine_boss_') && !poi.isCleared && !poi.isActive) {
          // Boss Altar interaction
          poi.isActive = true;
          this.spawnBossForAltar(poi);
          if (window.soundEngine && typeof window.soundEngine.playBossRoar === 'function') {
            window.soundEngine.playBossRoar();
          }
          return;
        } else if (poi.type === 'well_healing' && !poi.isUsed) {
          // Sanctuary Well
          window.worldManager.useWell(poi.id);
          window.player.heal(Math.round(window.player.maxHp * 0.6));
          window.player.barrier = window.player.maxBarrier;
          if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
          }
          window.particleSystem.emitShockwave(poi.x, poi.y, 100, '#2dd4bf', 4);
          return;
        }
      }
    }

    // Check Ancient Riddle Tablets
    const nearbyChunks = window.worldManager.getNearbyChunks(window.player.x, window.player.y);
    for (const chunk of nearbyChunks) {
      if (chunk.riddles) {
        for (const riddle of chunk.riddles) {
          const tab = riddle.tablet;
          if (Vec2.dist(window.player.x, window.player.y, tab.x, tab.y) < tab.radius + window.player.radius + 35) {
            window.soundEngine.playPuzzleStep(0);
            window.particleSystem.addFloatingText(tab.x, tab.y, tab.text, '#38bdf8', true);
            return;
          }
        }
      }
    }
  }

  // Spawn trial guardians around an altar
  spawnShrineGuardians(poi) {
    const biome = window.worldManager.getBiomeAt(poi.x, poi.y);
    const count = 7;
    this.trialMonstersRemaining = count;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnX = poi.x + Math.cos(angle) * 160;
      const spawnY = poi.y + Math.sin(angle) * 160;

      let archetype = 'skitterer';
      if (i === 0) archetype = 'juggernaut';
      else if (i % 2 === 0) archetype = 'spitter';

      const monster = new Monster(spawnX, spawnY, archetype, 1.3);
      this.monsters.push(monster);
      window.particleSystem.emitSparks(spawnX, spawnY, '#c084fc', 8);
    }
  }
// Spawn the unique boss for a shrine altar
  spawnBossForAltar(poi) {
    // Map boss archetype to relic reward IDs
    const relicMap = {
      'boss_void': 'boss_void_crown',
      'boss_fire': 'boss_infernal_core',
      'boss_storm': 'boss_tempest_eye'
    };

    // Create the boss monster
    const monster = new Monster(poi.x, poi.y, poi.bossArchetype, 1.5);
    monster.isUniqueBoss = true;
    monster.bossName = poi.bossName;
    monster.bossArchetype = poi.bossArchetype;
    monster.bossRelicReward = relicMap[poi.bossArchetype] || null;
    monster.altarId = poi.id;

    this.monsters.push(monster);
    // Show boss health HUD
    if (window.uiManager && typeof window.uiManager.showBossHealth === 'function') {
      window.uiManager.showBossHealth(monster);
    }
  }

  // Called when a unique boss is defeated
  onBossDefeated(boss) {
    // Mark altar as cleared
    if (boss.altarId) {
      window.worldManager.clearedShrines.add(boss.altarId);
    }
    // Hide boss health HUD
    if (window.uiManager && typeof window.uiManager.hideBossHealth === 'function') {
      window.uiManager.hideBossHealth();
    }
    // Award relic reward if defined
    const relicId = boss.bossRelicReward;
    if (relicId) {
      window.inventory.addItem(relicId);
      window.player.applyItemStats(window.inventory);
      if (window.uiManager && typeof window.uiManager.refreshInventoryDisplays === 'function') {
        window.uiManager.refreshInventoryDisplays(window.inventory);
      }
    }
    // Show victory modal
    if (window.uiManager && typeof window.uiManager.showBossVictory === 'function') {
      window.uiManager.showBossVictory(boss, relicId, () => {});
    }
  }


  // Open upgrade selection modal
  openUpgradeModal(title) {
    const returnState = this.state === 'TUTORIAL' ? 'TUTORIAL' : 'PLAYING';
    this.state = 'UPGRADE_MODAL';
    const choices = window.inventory.getRandomUpgradeOptions(3);

    window.uiManager.showUpgradeModal(title, choices, (chosenItem) => {
      const newlyForgedSynergies = window.inventory.addItem(chosenItem.id);

      // In tutorial mode: guarantee immediate synergy discovery by auto-gifting companion recipe relic!
      if (returnState === 'TUTORIAL' && typeof SYNERGIES !== 'undefined') {
        const syn = Object.values(SYNERGIES).find(s => s.requires && s.requires.includes(chosenItem.id));
        if (syn) {
          const companionId = syn.requires.find(id => id !== chosenItem.id);
          if (companionId && !window.inventory.hasItem(companionId)) {
            const extraSynergies = window.inventory.addItem(companionId);
            newlyForgedSynergies.push(...extraSynergies);
          }
        }
      }

      window.player.applyItemStats(window.inventory);

      // Check if synergy was forged
      if (newlyForgedSynergies.length > 0) {
        window.soundEngine.playSynergyUnlocked();
        window.particleSystem.emitShockwave(window.player.x, window.player.y, 200, '#ec4899', 8);
      }

      window.uiManager.refreshInventoryDisplays(window.inventory);
      this.state = returnState;

      if (this.state === 'TUTORIAL' && this.tutorialStep === 7) {
        window.worldManager.openTutorialDoor(7);
        this.advanceTutorialStep(8);
      }
    });
  }

  // Spawning logic: monsters spawn in fog just off screen
  handleSpawning(dt) {
    this.spawnTimer += dt;
    if (this.monsters.length >= this.maxMonsters) return;

    const spawnInterval = Math.max(0.6, 2.2 - (Math.hypot(window.player.x - 400, window.player.y - 400) / 5000));
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      // Calculate distance and threat level
      const pDist = Math.hypot(window.player.x - 400, window.player.y - 400);
      const threatMult = 1.0 + (pDist / 2000) * 0.45;

      // Spawn angle outside screen view
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(this.canvas.width, this.canvas.height) * 0.55 + Math.random() * 150;
      const spawnX = window.player.x + Math.cos(angle) * spawnDist;
      const spawnY = window.player.y + Math.sin(angle) * spawnDist;

      // Don't spawn inside safe sanctuary temple or solid stone walls
      if (Math.hypot(spawnX - 400, spawnY - 400) < 400) return;
      if (window.worldManager.isSolidTile(spawnX, spawnY)) return;

      // Choose archetype based on zone distance
      let archetype = 'skitterer';
      const roll = Math.random();

      if (pDist > 6000) { // Singularity Zone
        if (roll < 0.15) archetype = 'boss';
        else if (roll < 0.45) archetype = 'stalker';
        else if (roll < 0.70) archetype = 'juggernaut';
        else archetype = 'spitter';
      } else if (pDist > 3200) { // Catacombs Zone
        if (roll < 0.35) archetype = 'stalker';
        else if (roll < 0.65) archetype = 'juggernaut';
        else archetype = 'spitter';
      } else if (pDist > 1400) { // Barrens Zone
        if (roll < 0.35) archetype = 'juggernaut';
        else if (roll < 0.65) archetype = 'spitter';
        else archetype = 'skitterer';
      } else { // Outskirts
        if (roll < 0.30) archetype = 'spitter';
        else archetype = 'skitterer';
      }

      this.monsters.push(new Monster(spawnX, spawnY, archetype, threatMult));
    }
  }

  // Check POI proximity and update prompt text
  checkPOIProximity() {
    const nearbyPOIs = window.worldManager.getNearbyPOIs(
      this.camera.x, this.camera.y, this.canvas.width, this.canvas.height
    );

    let promptText = '';
    for (const poi of nearbyPOIs) {
      const dist = Vec2.dist(window.player.x, window.player.y, poi.x, poi.y);
      if (dist < poi.radius + window.player.radius + 35) {
        if (poi.type === 'chest' && !poi.isOpened) {
          promptText = `Open ${poi.name}`;
        } else if (poi.type === 'shrine_combat' && !poi.isCleared && !poi.isActive) {
          promptText = 'Challenge Altar of Valor';
        } else if (poi.type === 'shrine_blood' && !poi.isUsed) {
          promptText = 'Sacrifice Life for Blood Artifact';
        } else if (poi.type === 'well_healing' && !poi.isUsed) {
          promptText = 'Drink from Well of Recovery';
        }
        break;
      }
    }

    // Check Ancient Riddle Inscription Tablets
    if (!promptText) {
      const nearbyChunks = window.worldManager.getNearbyChunks(window.player.x, window.player.y);
      for (const chunk of nearbyChunks) {
        if (chunk.riddles) {
          for (const riddle of chunk.riddles) {
            const tab = riddle.tablet;
            if (Vec2.dist(window.player.x, window.player.y, tab.x, tab.y) < tab.radius + window.player.radius + 35) {
              promptText = `Read Inscription (${riddle.solved ? 'Solved' : 'Enigma'})`;
              break;
            }
          }
        }
        if (promptText) break;
      }
    }

    window.uiManager.setInteractionPrompt(promptText !== '', promptText);
  }

  // Update game simulation
  update(dt) {
    if (this.state === 'MAIN_MENU') {
      // Dynamic camera drift around sanctuary temple
      this.menuAngle += dt * 0.12;
      this.camera.x = 400 + Math.cos(this.menuAngle) * 140 - this.canvas.width / 2;
      this.camera.y = 400 + Math.sin(this.menuAngle) * 140 - this.canvas.height / 2;
      window.worldManager.updateExploration(400, 400, 850);
      window.particleSystem.update(dt, window.player, this.monsters);
      return;
    }

    if (this.state !== 'PLAYING' && this.state !== 'TUTORIAL') return;

    const player = window.player;
    const world = window.worldManager;

    // 1. Camera target & Screen shake
    const targetCamX = player.x - this.canvas.width / 2;
    const targetCamY = player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    if (this.camera.shakeDuration > 0) {
      this.camera.shakeDuration -= dt;
      const sX = (Math.random() - 0.5) * this.camera.shakeIntensity;
      const sY = (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.camera.x += sX;
      this.camera.y += sY;
    }

    this.updateMouseWorld();

    // 2. Exploration and lazy chunks
    world.updateExploration(player.x, player.y, 850);

    // 3. Update Floor Spike Traps & Ancient Rune Riddles
    world.updateTraps(dt, player, this.monsters);
    world.updateRiddles(dt, player);

    // 4. Update Player
    player.update(dt, this.input, this.projectiles, this.enemyProjectiles);

    // Synergy: Phalanx of the Abyss (radial spear ring)
    if (window.inventory.hasSynergy('phalanx_abyss')) {
      this.phalanxTimer += dt;
      if (this.phalanxTimer >= 3.0) {
        this.phalanxTimer = 0;
        const count = 12;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          this.projectiles.push(new Projectile({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 700,
            vy: Math.sin(angle) * 700,
            radius: 6,
            color: '#ec4899',
            damage: player.baseDamage * 1.2,
            pierce: 3,
            element: 'arcane'
          }));
        }
        window.soundEngine.playShoot();
      }
    }

    // 5. Update Player Projectiles & Collision with monsters
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);

      if (proj.isDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check monster hits
      for (const monster of this.monsters) {
        if (!monster.isDead && !proj.hitEntities.has(monster)) {
          if (Vec2.dist(proj.x, proj.y, monster.x, monster.y) < proj.radius + monster.radius) {
            proj.hitEntities.add(monster);
            monster.takeDamage(proj.damage, proj.isCrit, proj.element);

            // Item: Explosive Tip
            if (window.inventory.hasItem('explosive_tip') && !proj.hasExploded) {
              proj.hasExploded = true;
              window.particleSystem.emitShockwave(proj.x, proj.y, 75, '#f59e0b', 4);
              window.soundEngine.playExplosion(false);

              // AoE damage to surrounding monsters
              for (const other of this.monsters) {
                if (other !== monster && !other.isDead) {
                  if (Vec2.dist(proj.x, proj.y, other.x, other.y) < 80) {
                    other.takeDamage(proj.damage * 0.65, false, 'explosive');
                  }
                }
              }
            }

            // Item: Lightning Spire & Plasma Arcs
            if (window.inventory.hasItem('lightning_spire') && Math.random() < 0.35) {
              this.triggerChainLightning(monster, proj.damage * 0.75);
            }

            // Pierce logic
            if (proj.pierce > 0) {
              proj.pierce -= 1;
            } else {
              proj.isDead = true;
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    // 6. Update Enemy Projectiles & Collision with Player
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.update(dt);

      if (ep.isDead) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Hit player
      if (Vec2.dist(ep.x, ep.y, player.x, player.y) < ep.radius + player.radius) {
        player.takeDamage(ep.damage);
        ep.isDead = true;
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 7. Update Monsters
    let livingTrialMonsters = 0;
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      monster.update(dt, player, null, this.enemyProjectiles);

      if (this.activeTrialShrine && !monster.isDead) {
        livingTrialMonsters++;
      }

      if (monster.isDead) {
        this.monsters.splice(i, 1);
      }
    }

    // Check if active trial shrine cleared
    if (this.activeTrialShrine && livingTrialMonsters === 0) {
      window.worldManager.clearShrine(this.activeTrialShrine.id);
      this.activeTrialShrine = null;
      window.soundEngine.playSynergyUnlocked();
      this.openUpgradeModal('TRIAL OF VALOR CONQUERED');
    }

    // 8. Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.update(dt, player);
      if (pickup.isDead) {
        this.pickups.splice(i, 1);
      }
    }

    // 9. Spawning (only in normal survival mode)
    if (this.state === 'PLAYING') {
      this.handleSpawning(dt);
    }

    // 10. Tutorial Director (when practicing)
    if (this.state === 'TUTORIAL') {
      this.updateTutorial(dt);
    }

    // 11. Particles & Combat Text
    window.particleSystem.update(dt, player, this.monsters);

    // 12. POI Proximity
    this.checkPOIProximity();

    // 13. Update HUD
    window.uiManager.updateHUD(player, world);
  }

  // Trigger chain lightning arcs between monsters
  triggerChainLightning(sourceMonster, damage) {
    const isPlasma = window.inventory.hasSynergy('plasma_arcs');
    let current = sourceMonster;
    let hitCount = 0;
    const hitList = new Set([sourceMonster]);

    while (hitCount < 3) {
      let nearest = null;
      let minDist = 220;

      for (const other of this.monsters) {
        if (!other.isDead && !hitList.has(other)) {
          const d = Vec2.dist(current.x, current.y, other.x, other.y);
          if (d < minDist) {
            minDist = d;
            nearest = other;
          }
        }
      }

      if (nearest) {
        hitList.add(nearest);
        nearest.takeDamage(damage, false, isPlasma ? 'plasma' : 'electric');
        window.particleSystem.emitSparks(nearest.x, nearest.y, isPlasma ? '#38bdf8' : '#fbbf24', 6);

        // Synergy: Plasma Arcs leaves searing ground
        if (isPlasma) {
          window.particleSystem.addGroundEffect(nearest.x, nearest.y, 45, 2.5, 'plasma', 25);
        }

        current = nearest;
        hitCount++;
      } else {
        break;
      }
    }
  }

  // Render game scene
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const world = window.worldManager;
    const player = window.player;

    // 1. Terrain & Grid
    world.drawTerrain(this.ctx, this.camera, this.canvas.width, this.canvas.height);

    if (this.state === 'MAIN_MENU') {
      world.drawObjects(this.ctx, this.camera, this.canvas.width, this.canvas.height);
      world.drawFogOfWar(this.ctx, this.camera, this.canvas.width, this.canvas.height, 400, 400, 520);
      window.particleSystem.draw(this.ctx, this.camera);
      return;
    }

    // 2. Ground Hazards & Elemental Pools
    window.particleSystem.drawGroundEffects(this.ctx, this.camera);

    // 3. Obstacles & POIs
    world.drawObjects(this.ctx, this.camera, this.canvas.width, this.canvas.height);

    // 4. Pickups
    for (const pickup of this.pickups) {
      pickup.draw(this.ctx, this.camera);
    }

    // 5. Monsters
    for (const monster of this.monsters) {
      monster.draw(this.ctx, this.camera);
    }

    // 6. Player & Orbitals
    player.draw(this.ctx, this.camera, this.input);

    // 7. Projectiles
    for (const proj of this.projectiles) {
      proj.draw(this.ctx, this.camera);
    }
    for (const ep of this.enemyProjectiles) {
      ep.draw(this.ctx, this.camera);
    }

    // 8. Fog of War Darkness Overlay
    world.drawFogOfWar(this.ctx, this.camera, this.canvas.width, this.canvas.height, player.x, player.y);

    // 9. Particles & Floating Combat Text (drawn above darkness)
    window.particleSystem.draw(this.ctx, this.camera);

    // 10. Tutorial Waypoint Objective Indicator
    if (this.state === 'TUTORIAL') {
      this.drawTutorialObjective();
    }
  }

  // Draw in-world glowing objective beacon and orbiting directional chevron
  drawTutorialObjective() {
    const info = this.tutorialObjectives[this.tutorialStep - 1];
    if (!info) return;

    const tx = info.targetX;
    const ty = info.targetY;
    const px = window.player.x;
    const py = window.player.y;

    const dist = Vec2.dist(px, py, tx, ty);
    const screenTx = tx - this.camera.x;
    const screenTy = ty - this.camera.y;

    this.ctx.save();

    // 1. Draw pulsing beacon ring on ground at target position
    const pulse = Math.sin(Date.now() * 0.005) * 6;
    this.ctx.beginPath();
    this.ctx.arc(screenTx, screenTy, 28 + pulse, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 6]);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(screenTx, screenTy, 14, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    this.ctx.fill();

    // 2. If target is far from player (>120px), draw a floating directional chevron circling the player
    if (dist > 120) {
      const angle = Vec2.angle(px, py, tx, ty);
      const playerScreenX = px - this.camera.x;
      const playerScreenY = py - this.camera.y;
      const orbitRadius = 48 + Math.sin(Date.now() * 0.008) * 4;

      const arrowX = playerScreenX + Math.cos(angle) * orbitRadius;
      const arrowY = playerScreenY + Math.sin(angle) * orbitRadius;

      this.ctx.translate(arrowX, arrowY);
      this.ctx.rotate(angle);

      this.ctx.beginPath();
      this.ctx.moveTo(10, 0);
      this.ctx.lineTo(-6, -7);
      this.ctx.lineTo(-2, 0);
      this.ctx.lineTo(-6, 7);
      this.ctx.closePath();

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  onPlayerDeath() {
    if (this.state === 'TUTORIAL') {
      // In practice level: revive with full health & barrier so player can continue learning
      window.player.heal(window.player.maxHp);
      window.player.barrier = window.player.maxBarrier;
      window.particleSystem.addFloatingText(window.player.x, window.player.y, 'REVIVED!', '#38bdf8', true);
      return;
    }
    this.state = 'GAME_OVER';
    window.uiManager.showGameOver(window.player, window.inventory);
  }

  startDescent() {
    const seed = window.uiManager.getSeed();
    this.restartRunWithSeed(seed);
    window.uiManager.hideMainMenu();
    window.soundEngine.ensureContext();
    this.state = 'PLAYING';
  }

  resumeGame() {
    window.uiManager.hidePauseModal();
    this.state = 'PLAYING';
  }

  goToMainMenu() {
    window.uiManager.hidePauseModal();
    window.uiManager.closeGameOver();
    window.uiManager.closeCodex();
    window.uiManager.hideTutorialBanner();
    window.uiManager.hideTutorialVictory();
    window.uiManager.showMainMenu();
    this.state = 'MAIN_MENU';
  }

  restartRunWithSeed(seed) {
    window.uiManager.closeGameOver();
    window.uiManager.hidePauseModal();
    window.uiManager.hideTutorialBanner();
    window.uiManager.hideTutorialVictory();
    window.player.reset();
    window.inventory.reset();
    window.worldManager.reset(seed);
    window.particleSystem.reset();

    // Snap camera directly to player's sanctuary position
    this.camera.x = window.player.x - this.canvas.width / 2;
    this.camera.y = window.player.y - this.canvas.height / 2;
    this.camera.shakeIntensity = 0;
    this.camera.shakeDuration = 0;
    this.updateMouseWorld();

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.monsters = [];
    this.pickups = [];
    this.activeTrialShrine = null;

    window.uiManager.refreshInventoryDisplays(window.inventory);
    this.state = 'PLAYING';
  }

  restartRun() {
    const currentSeed = window.uiManager.getSeed();
    this.restartRunWithSeed(currentSeed);
  }

  // --- Interactive Practice Tutorial Director ---

  startTutorial() {
    this.state = 'TUTORIAL';
    this.tutorialStep = 1;
    window.uiManager.hideMainMenu();
    window.uiManager.hidePauseModal();
    window.uiManager.closeGameOver();
    window.uiManager.closeCodex();
    if (window.uiManager.controlsModal) window.uiManager.hideControlsModal();
    window.soundEngine.ensureContext();

    // Reset components for clean tutorial state
    window.player.reset();
    window.player.x = 200;
    window.player.y = 400;
    window.inventory.reset();
    window.particleSystem.reset();

    // Setup handcrafted tutorial dungeon
    window.worldManager.setupTutorial();

    // Setup camera centered on player
    this.camera.x = window.player.x - this.canvas.width / 2;
    this.camera.y = window.player.y - this.canvas.height / 2;
    this.camera.shakeIntensity = 0;
    this.camera.shakeDuration = 0;
    this.updateMouseWorld();

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.monsters = [];
    this.pickups = [];
    this.activeTrialShrine = null;

    // Show initial tutorial banner
    this.updateTutorialHUD();
  }

  updateTutorial(dt) {
    const player = window.player;
    const world = window.worldManager;

    switch (this.tutorialStep) {
      case 1: {
        // Step 1: Reach Dais (380, 400)
        if (Vec2.dist(player.x, player.y, 380, 400) < 65) {
          this.advanceTutorialStep(2);
        }
        break;
      }
      case 2: {
        // Step 2: Shatter all 3 urns in chunk (0, 0)
        const c0 = world.getChunk(0, 0);
        if (c0 && c0.urns && c0.urns.length > 0 && c0.urns.every(u => u.isBroken)) {
          world.openTutorialDoor(2);
          this.advanceTutorialStep(3);
        }
        break;
      }
      case 3: {
        // Step 3: Void Dash across chasm to ~1120
        if (player.x > 1080) {
          this.advanceTutorialStep(4);
        }
        break;
      }
      case 4: {
        // Step 4: Demolish cracked secret wall at x:12 in chunk 1 (worldX: 1425)
        if (player.x > 1470) {
          // Spawn training dummy in room 5 if not yet spawned
          if (this.monsters.length === 0) {
            this.monsters.push(new Monster(1880, 400, 'dummy', 1.0));
          }
          this.advanceTutorialStep(5);
        }
        break;
      }
      case 5: {
        // Step 5: Defeat dummy in room 5 (or lure across traps)
        if (this.monsters.length === 0) {
          world.openTutorialDoor(5);
          this.advanceTutorialStep(6);
        }
        break;
      }
      case 6: {
        // Step 6: Ancient Rune Riddle solved
        if (world.solvedRiddles.has('tut_riddle')) {
          world.openTutorialDoor(6);
          this.advanceTutorialStep(7);
        }
        break;
      }
      case 7: {
        // Step 7: Open Relic Chest & Forge Synergy
        const c3 = world.getChunk(3, 0);
        const tutChest = c3 ? c3.pois.find(p => p.id === 'tut_chest') : null;
        if (tutChest && tutChest.isOpened && window.inventory.activeSynergies.size > 0) {
          world.openTutorialDoor(7);
          this.advanceTutorialStep(8);
        }
        break;
      }
      case 8: {
        // Step 8: Step onto Descent Portal Dais (x: 3075, y: 400)
        if (world.tutorialPortal && Vec2.dist(player.x, player.y, world.tutorialPortal.x, world.tutorialPortal.y) < 45) {
          this.finishTutorial();
        }
        break;
      }
    }
  }

  advanceTutorialStep(stepNumber) {
    if (this.tutorialStep >= stepNumber) return;
    this.tutorialStep = stepNumber;
    window.soundEngine.playLevelUp();
    window.particleSystem.emitShockwave(window.player.x, window.player.y, 160, '#38bdf8', 6);
    this.updateTutorialHUD();
  }

  updateTutorialHUD() {
    const info = this.tutorialObjectives[this.tutorialStep - 1];
    if (info) {
      window.uiManager.showTutorialBanner(this.tutorialStep, this.totalTutorialSteps, info.title, info.desc);
    }
  }

  finishTutorial() {
    this.state = 'TUTORIAL_FINISHED';
    window.uiManager.hideTutorialBanner();
    window.soundEngine.playSynergyUnlocked();
    window.particleSystem.emitShockwave(window.player.x, window.player.y, 300, '#a855f7', 10);
    window.uiManager.showTutorialVictory();
  }

  exitTutorial() {
    window.uiManager.hideTutorialBanner();
    window.uiManager.hideTutorialVictory();
    this.goToMainMenu();
  }

  spawnResonanceShards(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;
      this.pickups.push(new Pickup(x + offsetX, y + offsetY, 'xp', 15));
    }
  }

  // Main game loop
  run(time) {
    const dt = Math.min(0.08, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.run(t));
  }
}

// Global game engine singleton
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
  requestAnimationFrame((t) => window.gameEngine.run(t));
});
