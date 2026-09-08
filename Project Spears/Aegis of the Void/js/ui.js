/**
 * Aegis of the Void - HUD, Minimap, Modals & User Interface Manager
 */

class UIManager {
  constructor() {
    // HUD Elements
    this.hpFill = document.getElementById('hpFill');
    this.hpText = document.getElementById('hpText');
    this.barrierFill = document.getElementById('barrierFill');
    this.barrierText = document.getElementById('barrierText');
    this.xpFill = document.getElementById('xpFill');
    this.xpText = document.getElementById('xpText');
    this.dashFill = document.getElementById('dashFill');
    this.zoneName = document.getElementById('zoneName');
    this.zoneDistance = document.getElementById('zoneDistance');
    this.threatRating = document.getElementById('threatRating');
    this.compassArrow = document.getElementById('compassArrow');
    this.compassDistance = document.getElementById('compassDistance');
    this.synergyBadges = document.getElementById('synergyBadges');
    this.relicsStrip = document.getElementById('relicsStrip');
    this.interactionPrompt = document.getElementById('interactionPrompt');
    this.keyBadge = document.getElementById('keyBadge');

    // Minimap
    this.minimapCanvas = document.getElementById('minimapCanvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.minimapCanvas.width = 170;
      this.minimapCanvas.height = 170;
    }

    // Modals
    this.upgradeModal = document.getElementById('upgradeModal');
    this.upgradeTitle = document.getElementById('upgradeTitle');
    this.upgradeCardsGrid = document.getElementById('upgradeCardsGrid');

    this.codexModal = document.getElementById('codexModal');
    this.codexContainer = document.getElementById('codexContainer');

    this.gameOverModal = document.getElementById('gameOverModal');
    this.statDistance = document.getElementById('statDistance');
    this.statEnemies = document.getElementById('statEnemies');
    this.statSynergies = document.getElementById('statSynergies');
    this.statTime = document.getElementById('statTime');

    // Main Menu & Pause Modals
    this.mainMenuModal = document.getElementById('mainMenuModal');
    this.worldSeedInput = document.getElementById('worldSeedInput');
    this.randomSeedBtn = document.getElementById('randomSeedBtn');
    this.startBtn = document.getElementById('startBtn');
    this.menuCodexBtn = document.getElementById('menuCodexBtn');
    this.menuControlsBtn = document.getElementById('menuControlsBtn');

    this.pauseModal = document.getElementById('pauseModal');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.pauseRestartBtn = document.getElementById('pauseRestartBtn');
    this.pauseMainMenuBtn = document.getElementById('pauseMainMenuBtn');
    this.gameOverMainMenuBtn = document.getElementById('gameOverMainMenuBtn');

    this.controlsModal = document.getElementById('controlsModal');
    this.closeControlsBtn = document.getElementById('closeControlsBtn');
    this.closeControlsXBtn = document.getElementById('closeControlsXBtn');
    this.closeCodexBtn = document.getElementById('closeCodexBtn');
    this.closeCodexXBtn = document.getElementById('closeCodexXBtn');

    this.tabSynergies = document.getElementById('tabSynergies');
    this.tabRelics = document.getElementById('tabRelics');
    this.currentCodexTab = 'synergies';

    this.pauseCodexBtn = document.getElementById('pauseCodexBtn');
    this.pauseControlsBtn = document.getElementById('pauseControlsBtn');

    // Tutorial Elements
    this.tutorialBanner = document.getElementById('tutorialBanner');
    this.tutorialStepBadge = document.getElementById('tutorialStepBadge');
    this.tutorialStepTitle = document.getElementById('tutorialStepTitle');
    this.tutorialDesc = document.getElementById('tutorialDesc');
    this.tutorialProgressFill = document.getElementById('tutorialProgressFill');
    this.exitTutorialBtn = document.getElementById('exitTutorialBtn');
    this.menuTutorialBtn = document.getElementById('menuTutorialBtn');
    this.pauseTutorialBtn = document.getElementById('pauseTutorialBtn');
    this.controlsTutorialBtn = document.getElementById('controlsTutorialBtn');
    this.tutorialVictoryModal = document.getElementById('tutorialVictoryModal');
    this.tutVictoryDescentBtn = document.getElementById('tutVictoryDescentBtn');
    this.tutVictoryMenuBtn = document.getElementById('tutVictoryMenuBtn');

    // Boss Health Bar & Victory Elements
    this.bossHealthContainer = document.getElementById('bossHealthContainer');
    this.bossHealthName = document.getElementById('bossHealthName');
    this.bossHealthTitle = document.getElementById('bossHealthTitle');
    this.bossHealthValue = document.getElementById('bossHealthValue');
    this.bossHealthFill = document.getElementById('bossHealthFill');
    this.bossVictoryModal = document.getElementById('bossVictoryModal');
    this.bossVictoryTitle = document.getElementById('bossVictoryTitle');
    this.bossVictorySubtitle = document.getElementById('bossVictorySubtitle');
    this.bossVictoryRewardCard = document.getElementById('bossVictoryRewardCard');
    this.bossVictoryClaimBtn = document.getElementById('bossVictoryClaimBtn');
    this.onBossClaimCallback = null;

    this.isModalOpen = false;
    this.onUpgradeSelectedCallback = null;

    this.initMenuEvents();
  }

  initMenuEvents() {
    if (this.randomSeedBtn) {
      this.randomSeedBtn.addEventListener('click', () => {
        this.randomizeSeed();
      });
    }

    // Boss Victory Claim Button
    if (this.bossVictoryClaimBtn) {
      this.bossVictoryClaimBtn.addEventListener('click', () => {
        this.hideBossVictory();
        if (this.onBossClaimCallback) {
          this.onBossClaimCallback();
          this.onBossClaimCallback = null;
        }
      });
    }

    // Tutorial Launch Buttons
    if (this.menuTutorialBtn) {
      this.menuTutorialBtn.addEventListener('click', () => {
        if (window.gameEngine) window.gameEngine.startTutorial();
      });
    }
    if (this.pauseTutorialBtn) {
      this.pauseTutorialBtn.addEventListener('click', () => {
        this.hidePauseModal();
        if (window.gameEngine) window.gameEngine.startTutorial();
      });
    }
    if (this.controlsTutorialBtn) {
      this.controlsTutorialBtn.addEventListener('click', () => {
        this.hideControlsModal();
        if (window.gameEngine) window.gameEngine.startTutorial();
      });
    }
    if (this.exitTutorialBtn) {
      this.exitTutorialBtn.addEventListener('click', () => {
        if (window.gameEngine) window.gameEngine.exitTutorial();
      });
    }
    if (this.tutVictoryDescentBtn) {
      this.tutVictoryDescentBtn.addEventListener('click', () => {
        this.hideTutorialVictory();
        if (window.gameEngine) window.gameEngine.startDescent();
      });
    }
    if (this.tutVictoryMenuBtn) {
      this.tutVictoryMenuBtn.addEventListener('click', () => {
        this.hideTutorialVictory();
        if (window.gameEngine) window.gameEngine.goToMainMenu();
      });
    }

    // Main Menu -> Codex
    if (this.menuCodexBtn) {
      this.menuCodexBtn.addEventListener('click', () => {
        if (window.gameEngine) {
          window.gameEngine.previousState = window.gameEngine.state;
          window.gameEngine.state = 'CODEX';
        }
        this.openCodex(window.inventory);
      });
    }

    // Main Menu -> How to Play
    if (this.menuControlsBtn) {
      this.menuControlsBtn.addEventListener('click', () => {
        if (window.gameEngine) {
          window.gameEngine.previousState = window.gameEngine.state;
        }
        this.showControlsModal();
      });
    }

    // Pause Menu -> Codex & Controls
    if (this.pauseCodexBtn) {
      this.pauseCodexBtn.addEventListener('click', () => {
        this.hidePauseModal();
        if (window.gameEngine) {
          window.gameEngine.previousState = 'PAUSED';
          window.gameEngine.state = 'CODEX';
        }
        this.openCodex(window.inventory);
      });
    }
    if (this.pauseControlsBtn) {
      this.pauseControlsBtn.addEventListener('click', () => {
        this.hidePauseModal();
        if (window.gameEngine) {
          window.gameEngine.previousState = 'PAUSED';
        }
        this.showControlsModal();
      });
    }

    // Close Controls buttons
    if (this.closeControlsBtn) {
      this.closeControlsBtn.addEventListener('click', () => {
        this.hideControlsModal();
      });
    }
    if (this.closeControlsXBtn) {
      this.closeControlsXBtn.addEventListener('click', () => {
        this.hideControlsModal();
      });
    }

    // Close Codex buttons
    if (this.closeCodexBtn) {
      this.closeCodexBtn.addEventListener('click', () => {
        this.closeCodex();
      });
    }
    if (this.closeCodexXBtn) {
      this.closeCodexXBtn.addEventListener('click', () => {
        this.closeCodex();
      });
    }

    // Codex Tabs
    if (this.tabSynergies) {
      this.tabSynergies.addEventListener('click', () => {
        this.openCodex(window.inventory, 'synergies');
      });
    }
    if (this.tabRelics) {
      this.tabRelics.addEventListener('click', () => {
        this.openCodex(window.inventory, 'relics');
      });
    }

    // Backdrop click-to-close for modals
    if (this.codexModal) {
      this.codexModal.addEventListener('click', (e) => {
        if (e.target === this.codexModal) {
          this.closeCodex();
        }
      });
    }
    if (this.controlsModal) {
      this.controlsModal.addEventListener('click', (e) => {
        if (e.target === this.controlsModal) {
          this.hideControlsModal();
        }
      });
    }
  }

  randomizeSeed() {
    const newSeed = Math.floor(Math.random() * 899999) + 100000;
    if (this.worldSeedInput) {
      this.worldSeedInput.value = newSeed;
    }
    window.soundEngine.playHit(false);
    return newSeed;
  }

  getSeed() {
    if (!this.worldSeedInput) return 133742;
    const val = parseInt(this.worldSeedInput.value.trim(), 10);
    return isNaN(val) ? 133742 : val;
  }

  // Update HUD every frame
  updateHUD(player, world) {
    // 1. HP & Barrier Bars
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.hpFill.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.round(player.hp)} / ${Math.round(player.maxHp)}`;

    const barPct = player.maxBarrier > 0 ? Math.max(0, Math.min(100, (player.barrier / player.maxBarrier) * 100)) : 0;
    this.barrierFill.style.width = `${barPct}%`;
    this.barrierText.textContent = `${Math.round(player.barrier)} / ${Math.round(player.maxBarrier)}`;

    // 2. XP Bar & Level
    const xpPct = Math.max(0, Math.min(100, (player.xp / player.xpNeeded) * 100));
    this.xpFill.style.width = `${xpPct}%`;
    this.xpText.textContent = `LVL ${player.level} (${Math.round(player.xp)}/${player.xpNeeded})`;

    // 3. Dash Cooldown
    const cdProgress = player.dashTimer <= 0 ? 1 : (1 - player.dashTimer / player.dashCooldown);
    this.dashFill.style.width = `${Math.max(0, Math.min(100, cdProgress * 100))}%`;

    // 4. Distance & Zone
    const dist = Math.hypot(player.x - 400, player.y - 400);
    const biome = world.getBiomeAt(player.x, player.y);
    this.zoneName.textContent = biome.name;
    this.zoneDistance.textContent = `DIST: ${Math.round(dist)}m`;
    this.threatRating.textContent = `DANGER: ${biome.threatLevel}`;
    this.threatRating.style.borderColor = biome.threatColor;
    this.threatRating.style.color = biome.threatColor;

    // 5. Compass
    const nearestPOI = world.getClosestUndiscoveredPOI(player.x, player.y);
    if (nearestPOI) {
      const angle = Vec2.angle(player.x, player.y, nearestPOI.x, nearestPOI.y);
      const deg = (angle * 180) / Math.PI;
      this.compassArrow.style.transform = `rotate(${deg}deg)`;
      this.compassDistance.textContent = `${Math.round(nearestPOI.distance)}m (${nearestPOI.name.split(' ')[0]})`;
    } else {
      this.compassDistance.textContent = 'EXPLORING...';
    }

    // 6. Rune Key indicator
    if (this.keyBadge) {
      this.keyBadge.style.display = world.playerHasRuneKey ? 'flex' : 'none';
    }

    // 7. Update Labyrinth Minimap
    this.drawMinimap(player, world);
  }

  // Draw circular radar minimap showing actual maze walls & corridors
  drawMinimap(player, world) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const mapScale = 0.055; // World units to minimap pixels
    const tileSizeMap = TILE_SIZE * mapScale; // ~2.75px per tile

    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, w, h);

    // Render explored maze chunks
    for (const key of world.exploredChunks) {
      const [cx, cy] = key.split(',').map(Number);
      const chunk = world.getChunk(cx, cy);
      const chunkWorldX = cx * CHUNK_SIZE;
      const chunkWorldY = cy * CHUNK_SIZE;

      const mx = centerX + (chunkWorldX - player.x) * mapScale;
      const my = centerY + (chunkWorldY - player.y) * mapScale;
      const mSize = CHUNK_SIZE * mapScale;

      if (mx + mSize < 0 || mx > w || my + mSize < 0 || my > h) continue;

      // Draw explored walkable floor background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(mx, my, mSize, mSize);

      // Draw individual maze walls
      for (let ty = 0; ty < TILES_PER_CHUNK; ty++) {
        for (let tx = 0; tx < TILES_PER_CHUNK; tx++) {
          const tile = chunk.grid[ty][tx];
          const tpx = mx + tx * tileSizeMap;
          const tpy = my + ty * tileSizeMap;

          if (tile === TILES.WALL) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(tpx, tpy, tileSizeMap + 0.5, tileSizeMap + 0.5);
          } else if (tile === TILES.CRACKED_WALL) {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(tpx, tpy, tileSizeMap + 0.5, tileSizeMap + 0.5);
          } else if (tile === TILES.RUNE_GATE) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(tpx, tpy, tileSizeMap + 0.5, tileSizeMap + 0.5);
          }
        }
      }

      // Draw Rune Keys
      for (const k of chunk.keys) {
        if (!k.isCollected) {
          const kx = centerX + (k.x - player.x) * mapScale;
          const ky = centerY + (k.y - player.y) * mapScale;
          if (kx > 0 && kx < w && ky > 0 && ky < h) {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(kx - 2, ky - 2, 4, 4);
          }
        }
      }

      // Draw POIs
      for (const poi of chunk.pois) {
        const isDone = poi.isOpened || poi.isCleared || poi.isUsed;
        const px = centerX + (poi.x - player.x) * mapScale;
        const py = centerY + (poi.y - player.y) * mapScale;

        if (px > 0 && px < w && py > 0 && py < h) {
          ctx.fillStyle = isDone ? '#64748b' : (poi.type === 'chest' ? '#f59e0b' : '#c084fc');
          ctx.beginPath();
          ctx.arc(px, py, isDone ? 2 : 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Spawn Sanctuary Beacon
    const sbx = centerX + (400 - player.x) * mapScale;
    const sby = centerY + (400 - player.y) * mapScale;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(sbx, sby, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Radar border ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, w / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Refresh active synergy badges and relic slots
  refreshInventoryDisplays(inventory) {
    // 1. Relics Strip
    this.relicsStrip.innerHTML = '';
    for (const [itemId, count] of inventory.items.entries()) {
      const item = BASE_ITEMS[itemId];
      if (!item) continue;
      const slot = document.createElement('div');
      slot.className = 'relic-slot';
      slot.title = `${item.name}: ${item.desc}`;
      slot.innerHTML = `
        ${item.icon}
        ${count > 1 ? `<span class="stack-badge">x${count}</span>` : ''}
      `;
      this.relicsStrip.appendChild(slot);
    }

    // 2. Synergy Badges
    this.synergyBadges.innerHTML = '';
    for (const synId of inventory.activeSynergies) {
      const syn = SYNERGIES[synId];
      if (!syn) continue;
      const chip = document.createElement('div');
      chip.className = 'synergy-chip';
      chip.innerHTML = `
        <span class="synergy-chip-icon">${syn.icon}</span>
        <div class="synergy-chip-info">
          <span class="synergy-chip-name">${syn.name}</span>
          <span class="synergy-chip-desc">${syn.desc.slice(0, 45)}...</span>
        </div>
      `;
      this.synergyBadges.appendChild(chip);
    }
  }

  // Show / Hide interaction prompt (e.g. "[E] Open Chest")
  setInteractionPrompt(visible, text = '') {
    if (visible) {
      this.interactionPrompt.innerHTML = `<span class="prompt-key">E</span> ${text}`;
      this.interactionPrompt.classList.add('visible');
    } else {
      this.interactionPrompt.classList.remove('visible');
    }
  }

  // Open Upgrade Selection Modal
  showUpgradeModal(title, options, onSelect) {
    this.isModalOpen = true;
    this.upgradeTitle.textContent = title;
    this.upgradeCardsGrid.innerHTML = '';
    this.onUpgradeSelectedCallback = onSelect;

    options.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `upgrade-card ${item.rarity}`;

      // Check synergy connection
      let synergyText = '';
      if (item.synergies && item.synergies.length > 0) {
        const synNames = item.synergies.map(sId => SYNERGIES[sId]?.name).filter(Boolean);
        if (synNames.length > 0) {
          synergyText = `<div class="card-synergy-hint">Synergy: ${synNames.join(', ')}</div>`;
        }
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-bottom: 10px;">
          <span class="card-rarity ${item.rarity}">${item.rarity}</span>
          <span class="cd-key">[${index + 1}]</span>
        </div>
        <div class="card-icon">${item.icon}</div>
        <div class="card-title">${item.name}</div>
        <div class="card-desc">${item.desc}</div>
        ${synergyText}
      `;

      card.addEventListener('click', () => {
        this.closeUpgradeModal();
        if (this.onUpgradeSelectedCallback) {
          this.onUpgradeSelectedCallback(item);
        }
      });

      this.upgradeCardsGrid.appendChild(card);
    });

    this.upgradeModal.classList.add('active');
  }

  closeUpgradeModal() {
    this.isModalOpen = false;
    this.upgradeModal.classList.remove('active');
  }

  // Toggle Synergy Codex Modal
  toggleCodex(inventory = window.inventory) {
    if (this.codexModal && this.codexModal.classList.contains('active')) {
      this.closeCodex();
    } else {
      if (window.gameEngine && window.gameEngine.state !== 'CODEX') {
        window.gameEngine.previousState = window.gameEngine.state;
        window.gameEngine.state = 'CODEX';
      }
      this.openCodex(inventory);
    }
  }

  openCodex(inventory = window.inventory, activeTab = 'synergies') {
    this.isModalOpen = true;
    this.currentCodexTab = activeTab;
    const inv = inventory || window.inventory;

    // Highlight active tab
    const tabSyn = document.getElementById('tabSynergies');
    const tabRel = document.getElementById('tabRelics');
    if (tabSyn && tabRel) {
      tabSyn.classList.toggle('active', activeTab === 'synergies');
      tabRel.classList.toggle('active', activeTab === 'relics');
    }

    if (activeTab === 'synergies') {
      this.renderCodexSynergies(inv);
    } else {
      this.renderCodexRelics(inv);
    }

    this.codexModal.classList.add('active');
  }

  renderCodexSynergies(inv) {
    this.codexContainer.innerHTML = '';

    for (const [synId, syn] of Object.entries(SYNERGIES)) {
      const isActive = inv ? inv.hasSynergy(synId) : false;
      const card = document.createElement('div');
      card.className = `synergy-recipe-card ${isActive ? 'active' : ''}`;

      const ingredientsHtml = syn.requires.map(reqId => {
        const baseItem = BASE_ITEMS[reqId];
        const isOwned = inv ? inv.hasItem(reqId) : false;
        return `
          <div class="ingredient-badge ${isOwned ? 'owned' : ''}" title="${baseItem ? baseItem.desc : ''}">
            <span>${baseItem ? baseItem.icon : '❓'}</span>
            <span>${baseItem ? baseItem.name : reqId}</span>
          </div>
        `;
      }).join('<span style="color:#64748b;font-weight:bold;margin:0 4px;">+</span>');

      card.innerHTML = `
        <div class="synergy-recipe-info">
          <div class="synergy-recipe-name">
            <span>${syn.icon}</span>
            <span>${syn.name}</span>
            ${isActive ? '<span class="active-tag">FORGED</span>' : ''}
          </div>
          <div class="synergy-recipe-desc">${syn.desc}</div>
        </div>
        <div class="synergy-recipe-ingredients">
          ${ingredientsHtml}
        </div>
      `;

      this.codexContainer.appendChild(card);
    }
  }

  renderCodexRelics(inv) {
    this.codexContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'relics-grid';

    for (const [itemId, item] of Object.entries(BASE_ITEMS)) {
      const count = inv ? inv.getItemCount(itemId) : 0;
      const card = document.createElement('div');
      card.className = `relic-card ${count > 0 ? 'owned' : ''}`;

      let synergyHints = '';
      if (item.isBossRelic) {
        synergyHints = `<div class="relic-card-synergies" style="color:#fca5a5; border-top-color:rgba(239,68,68,0.3);">👑 Bestowed by ${item.bossSource}</div>`;
      } else if (item.synergies && item.synergies.length > 0) {
        const synNames = item.synergies.map(sId => SYNERGIES[sId]?.name).filter(Boolean);
        if (synNames.length > 0) {
          synergyHints = `<div class="relic-card-synergies">⚡ Forges: ${synNames.join(', ')}</div>`;
        }
      }

      card.innerHTML = `
        <div class="relic-card-header">
          <div class="relic-card-title">
            <span style="font-size:22px;">${item.icon}</span>
            <span>${item.name}</span>
          </div>
          <span class="card-rarity ${item.rarity}">${count > 0 ? `Owned x${count}` : item.rarity}</span>
        </div>
        <div class="relic-card-desc">${item.desc}</div>
        ${synergyHints}
      `;

      grid.appendChild(card);
    }

    this.codexContainer.appendChild(grid);
  }

  closeCodex() {
    this.isModalOpen = false;
    if (this.codexModal) {
      this.codexModal.classList.remove('active');
    }
    if (window.gameEngine && window.gameEngine.state === 'CODEX') {
      const prev = window.gameEngine.previousState || 'MAIN_MENU';
      window.gameEngine.state = prev;
      if (prev === 'PAUSED') {
        this.showPauseModal();
      }
    }
  }

  // Show Game Over Modal with run summary
  showGameOver(player, inventory) {
    this.isModalOpen = true;
    this.statDistance.textContent = `${Math.round(player.distanceMax)}m`;
    this.statEnemies.textContent = `${player.enemiesDefeated}`;
    this.statSynergies.textContent = `${inventory.activeSynergies.size}`;
    
    const minutes = Math.floor(player.timeSurvived / 60);
    const seconds = Math.floor(player.timeSurvived % 60);
    this.statTime.textContent = `${minutes}m ${seconds}s`;

    this.gameOverModal.classList.add('active');
  }

  closeGameOver() {
    this.isModalOpen = false;
    this.gameOverModal.classList.remove('active');
  }

  showMainMenu() {
    this.isModalOpen = true;
    if (this.mainMenuModal) {
      this.mainMenuModal.classList.add('active');
    }
  }

  hideMainMenu() {
    this.isModalOpen = false;
    if (this.mainMenuModal) {
      this.mainMenuModal.classList.remove('active');
    }
  }

  showPauseModal() {
    this.isModalOpen = true;
    if (this.pauseModal) {
      this.pauseModal.classList.add('active');
    }
  }

  hidePauseModal() {
    this.isModalOpen = false;
    if (this.pauseModal) {
      this.pauseModal.classList.remove('active');
    }
  }

  showControlsModal() {
    this.isModalOpen = true;
    if (this.controlsModal) {
      this.controlsModal.classList.add('active');
    }
  }

  hideControlsModal() {
    this.isModalOpen = false;
    if (this.controlsModal) {
      this.controlsModal.classList.remove('active');
    }
    if (window.gameEngine && window.gameEngine.previousState === 'PAUSED') {
      this.showPauseModal();
    }
  }

  showTutorialBanner(step, totalSteps, title, desc) {
    if (!this.tutorialBanner) return;
    this.tutorialBanner.style.display = 'block';
    if (this.tutorialStepBadge) this.tutorialStepBadge.textContent = `STEP ${step} OF ${totalSteps}`;
    if (this.tutorialStepTitle) this.tutorialStepTitle.textContent = title;
    if (this.tutorialDesc) this.tutorialDesc.innerHTML = desc;
    if (this.tutorialProgressFill) {
      const pct = (step / totalSteps) * 100;
      this.tutorialProgressFill.style.width = `${pct}%`;
    }
  }

  hideTutorialBanner() {
    if (this.tutorialBanner) this.tutorialBanner.style.display = 'none';
  }

  showTutorialVictory() {
    this.isModalOpen = true;
    if (this.tutorialVictoryModal) {
      this.tutorialVictoryModal.classList.add('active');
    }
  }

  hideTutorialVictory() {
    this.isModalOpen = false;
    if (this.tutorialVictoryModal) {
      this.tutorialVictoryModal.classList.remove('active');
    }
  }

  showBossHealth(boss) {
    if (!this.bossHealthContainer) return;
    this.bossHealthContainer.style.display = 'block';
    if (this.bossHealthName) this.bossHealthName.textContent = boss.bossName || 'APEX ENTITY';
    if (this.bossHealthTitle) this.bossHealthTitle.textContent = boss.bossTitle || 'CALAMITY BOSS';
    if (this.bossHealthFill) {
      this.bossHealthFill.style.background = `linear-gradient(90deg, #dc2626, ${boss.color || '#ef4444'}, #fbbf24)`;
    }
    this.updateBossHealth(boss);
  }

  updateBossHealth(boss) {
    if (!this.bossHealthContainer || !boss) return;
    const currentHp = Math.max(0, Math.round(boss.hp));
    const maxHp = Math.round(boss.maxHp);
    const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    if (this.bossHealthValue) {
      this.bossHealthValue.textContent = `${currentHp.toLocaleString()} / ${maxHp.toLocaleString()} (${Math.round(pct)}%)`;
    }
    if (this.bossHealthFill) {
      this.bossHealthFill.style.width = `${pct}%`;
    }
  }

  hideBossHealth() {
    if (this.bossHealthContainer) {
      this.bossHealthContainer.style.display = 'none';
    }
  }

  showBossVictory(boss, relic, onClaim) {
    this.isModalOpen = true;
    this.onBossClaimCallback = onClaim;
    this.hideBossHealth();

    if (this.bossVictoryTitle) {
      this.bossVictoryTitle.textContent = `${(boss.bossName || 'BOSS').toUpperCase()} SLAIN!`;
    }
    if (this.bossVictorySubtitle) {
      this.bossVictorySubtitle.textContent = `You have conquered ${boss.bossName || 'the titan'}. Its primordial power has condensed into a supreme relic.`;
    }
    if (this.bossVictoryRewardCard && relic) {
      this.bossVictoryRewardCard.innerHTML = `
        <div class="boss-reward-header">
          <span class="boss-reward-icon">${relic.icon}</span>
          <div>
            <div class="boss-reward-name">${relic.name}</div>
            <span class="boss-reward-rarity">👑 SUPREME BOSS POWER</span>
          </div>
        </div>
        <div class="boss-reward-desc">${relic.desc}</div>
        <div class="boss-reward-source">Bestowed by defeating ${boss.bossName}</div>
      `;
    }
    if (this.bossVictoryModal) {
      this.bossVictoryModal.classList.add('active');
    }
  }

  hideBossVictory() {
    this.isModalOpen = false;
    if (this.bossVictoryModal) {
      this.bossVictoryModal.classList.remove('active');
    }
  }
}

// Global UI manager singleton
window.uiManager = new UIManager();
