/**
 * Main Application Orchestrator for Fugitive Tactical Radar (Agent Franks)
 */

class FugitiveApp {
  constructor() {
    this.map = null;
    this.selectedPin = null;
    this.timerInterval = null;
    this.relativeTimeInterval = null;
    this.pendingClickLatLng = null;
    this.unreadChatCount = 0;
  }

  async init() {
    console.log('FugitiveApp: Initializing tactical systems...');

    // 1. Initialize Audio
    document.addEventListener('click', () => {
      if (window.tacticalAudio) window.tacticalAudio.init();
    }, { once: true });

    // 2. Initialize Map
    this.map = window.mapEngine.initMap('tactical-map', (latlng) => {
      this.handleMapClick(latlng);
    });

    // 3. Setup Codename / Auth
    this.initUserProfile();

    // 4. Initialize Firebase & Sync
    await window.tacticalSync.initFirebase();

    // 5. Subscribe to Sync Events
    window.tacticalSync.onPinsChanged((pins) => this.handlePinsUpdated(pins));
    window.tacticalSync.onPlayersChanged((players) => this.handlePlayersUpdated(players));
    window.tacticalSync.onMatchStateChanged((state) => this.handleMatchStateUpdated(state));
    window.tacticalSync.onBoundaryChanged((boundary) => this.handleBoundaryUpdated(boundary));
    window.tacticalSync.onLandmarksChanged((landmarks) => this.handleLandmarksUpdated(landmarks));
    window.tacticalSync.onMessagesChanged((messages, newMsg) => this.handleMessagesUpdated(messages, newMsg));

    // 6. Setup UI Event Listeners
    this.setupUIEvents();

    // 7. Start Heartbeat Timers
    this.startHeartbeatTimers();

    // 9. Auto-request GPS & start sharing with team
    if (navigator.geolocation) {
      window.gpsTracker.setSharing(true);
      window.gpsTracker.startTracking(this.map, (pos) => {
        console.log('FugitiveApp: GPS acquired and sharing with team.');
      });
      const gpsShareBtn = document.getElementById('fab-gps-share');
      if (gpsShareBtn) gpsShareBtn.classList.add('gps-sharing');
      const gpsBtn = document.getElementById('fab-gps');
      if (gpsBtn) gpsBtn.classList.add('active');
    }

    // Check URL parameters for direct view/admin/draw
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || urlParams.get('admin') === 'boundary') {
      if (window.adminEngine) window.adminEngine.isAdminUnlocked = true;
      this.openModal('admin-modal');
      this.renderAdminCosmeticsList();
      if (urlParams.get('admin') === 'boundary') {
        setTimeout(() => {
          const body = document.querySelector('#admin-modal .modal-body');
          if (body) body.scrollTop = body.scrollHeight;
        }, 300);
      }
    } else if (urlParams.get('draw') === 'true') {
      const drawToolbar = document.getElementById('boundary-draw-toolbar');
      if (drawToolbar) drawToolbar.classList.add('is-active');
      const ptCountEl = document.getElementById('boundary-point-count');
      if (window.mapEngine) {
        window.mapEngine.startBoundaryDrawing(
          (pointCount) => {
            if (ptCountEl) ptCountEl.textContent = pointCount;
          },
          async (finalCoords) => {
            if (drawToolbar) drawToolbar.classList.remove('is-active');
            await window.tacticalSync.updateBoundary(finalCoords);
            this.handleBoundaryUpdated(finalCoords);
          }
        );
        setTimeout(() => {
          window.mapEngine.handleBoundaryDrawClick({ lat: 41.0360, lng: -111.9610 });
          window.mapEngine.handleBoundaryDrawClick({ lat: 41.0340, lng: -111.9400 });
          window.mapEngine.handleBoundaryDrawClick({ lat: 41.0250, lng: -111.9450 });
          window.mapEngine.handleBoundaryDrawClick({ lat: 41.0224, lng: -111.9588 });
        }, 500);
      }
    } else if (urlParams.get('target') === 'true') {
      // Direct testing hook: drop destination pin and show control dock
      setTimeout(() => {
        const testPt = { lat: 41.0310, lng: -111.9520 };
        this.handleMapClick(testPt);
      }, 300);
    } else if (urlParams.get('report') === 'true' || urlParams.get('report') === 'human' || urlParams.get('report') === 'scrolled') {
      // Direct testing hook: open report modal with joystick and directional rod preview
      setTimeout(() => {
        const testPt = { lat: 41.0310, lng: -111.9520 };
        this.openReportModal(testPt);
        setTimeout(() => {
          this.setJoystickAngle(55); // North-East heading preview
          if (urlParams.get('report') === 'human') {
            const cards = document.querySelectorAll('.cosmetic-card');
            cards.forEach(card => {
              if (card.textContent.includes('Foot') || card.textContent.includes('Seeker on Foot')) {
                card.click();
              }
            });
          } else if (urlParams.get('report') === 'scrolled') {
            const body = document.querySelector('#report-sighting-modal .modal-body');
            if (body) body.scrollTop = body.scrollHeight;
          }
        }, 200);
      }, 300);
    } else if (urlParams.get('rotate')) {
      const rot = Number(urlParams.get('rotate')) || 45;
      if (window.mapEngine) {
        window.mapEngine.rotateMap(rot);
      }
      setTimeout(() => {
        if (window.mapEngine && window.mapEngine.rotationBearing === 0) {
          window.mapEngine.rotateMap(rot);
        }
      }, 400);
    } else if (urlParams.get('preview') === 'true' || urlParams.get('preview') === 'human') {
      setTimeout(() => {
        const testPt = { lat: 41.0310, lng: -111.9520 };
        const cosmeticKey = urlParams.get('preview') === 'human' ? 'human' : 'cruiser';
        const cosmetic = window.seekerManager ? window.seekerManager.getCosmetic(cosmeticKey) : null;
        if (window.mapEngine) {
          window.mapEngine.updateLivePreviewPin(testPt, cosmetic, 45);
        }
      }, 300);
    } else if (urlParams.get('inspect') === 'true') {
      setTimeout(() => {
        const dummyPin = {
          id: 'pin_inspect_test',
          seekerId: 'cruiser',
          cosmeticId: 'cruiser',
          seekerName: 'Patrol Cruiser',
          lat: 41.0310,
          lng: -111.9520,
          timestamp: Date.now() - 60000,
          reportedByCodename: 'Ghost-1',
          notes: 'Spotted heading east towards Flint St'
        };
        const cosmetic = window.seekerManager ? window.seekerManager.getCosmetic('cruiser') : null;
        this.openPinInspector(dummyPin, cosmetic, true, 1, 1);
      }, 400);
    } else if (urlParams.get('rightdrag') === 'true') {
      setTimeout(() => {
        if (window.mapEngine) {
          window.mapEngine.isRightClickDragging = true;
          window.mapEngine.dragStartX = 300;
          window.mapEngine.dragStartY = 300;
          window.mapEngine.dragStartBearing = 0;
          document.body.classList.add('map-rotating-active');
          window.mapEngine.showOrientationHUD();
          window.mapEngine.setRotation(62, false);
        }
      }, 300);
    } else if (urlParams.get('reorient') === 'true') {
      setTimeout(() => {
        if (window.mapEngine) {
          window.mapEngine.setRotation(55, false);
          setTimeout(() => {
            const compassBtn = document.getElementById('fab-compass');
            if (compassBtn) compassBtn.click();
          }, 300);
        }
      }, 300);
    } else if (urlParams.get('demo') === 'foot') {
      setTimeout(() => {
        const now = Date.now();
        const demoPins = [
          // Foot Scout 1 (Gold) - Older sighting (should NOT pulse, no line)
          {
            id: 'pin_foot_gold_1',
            seekerId: 'human-gold',
            cosmeticId: 'human-gold',
            lat: 41.0330,
            lng: -111.9540,
            heading: 90,
            timestamp: now - 300000,
            reportedByCodename: 'Watcher-1'
          },
          // Foot Scout 1 (Gold) - Most recent sighting (MUST pulse, no line)
          {
            id: 'pin_foot_gold_2',
            seekerId: 'human-gold',
            cosmeticId: 'human-gold',
            lat: 41.0325,
            lng: -111.9500,
            heading: 45,
            timestamp: now - 60000,
            reportedByCodename: 'Watcher-1'
          },
          // Foot Scout 2 (Lime) - Older sighting (should NOT pulse, no line)
          {
            id: 'pin_foot_lime_1',
            seekerId: 'human-lime',
            cosmeticId: 'human-lime',
            lat: 41.0280,
            lng: -111.9560,
            heading: 180,
            timestamp: now - 200000,
            reportedByCodename: 'Alpha-2'
          },
          // Foot Scout 2 (Lime) - Most recent sighting (MUST pulse, no line)
          {
            id: 'pin_foot_lime_2',
            seekerId: 'human-lime',
            cosmeticId: 'human-lime',
            lat: 41.0260,
            lng: -111.9520,
            heading: 135,
            timestamp: now - 30000,
            reportedByCodename: 'Alpha-2'
          },
          // Foot Scout 3 (Coral) - Single sighting (MUST pulse as it is most recent, no line)
          {
            id: 'pin_foot_coral_1',
            seekerId: 'human-coral',
            cosmeticId: 'human-coral',
            lat: 41.0300,
            lng: -111.9470,
            heading: 270,
            timestamp: now - 15000,
            reportedByCodename: 'Bravo-3'
          }
        ];
        this.handlePinsUpdated(demoPins);
      }, 400);
    } else if (urlParams.get('chat') === 'true' || urlParams.get('chat') === 'open' || urlParams.get('chat') === 'demo') {
      setTimeout(() => {
        if (urlParams.get('chat') === 'demo') {
          const now = Date.now();
          const sampleMessages = [
            {
              id: 'demo_msg_1',
              text: 'All units, Cruiser 1 spotted near 200 North heading east.',
              senderCodename: 'Ghost-86',
              senderRealName: 'Dean',
              role: 'Fugitive',
              timestamp: now - 180000
            },
            {
              id: 'demo_msg_2',
              text: 'Copy that. I am holding position in the tree line behind the church.',
              senderCodename: 'Viper-2',
              senderRealName: 'Sarah',
              role: 'Fugitive',
              timestamp: now - 120000
            },
            {
              id: 'demo_msg_3',
              text: 'Seeker on Foot (Lime) is walking down Flint St sidewalk.',
              senderCodename: 'Fox-7',
              senderRealName: 'Marcus',
              role: 'Fugitive',
              timestamp: now - 45000
            },
            {
              id: 'demo_msg_4',
              text: '🚨 Seeker spotted nearby!',
              senderCodename: 'Ghost-86',
              senderRealName: 'Dean',
              role: 'Fugitive',
              timestamp: now - 15000
            }
          ];
          if (window.tacticalSync) {
            window.tacticalSync.messages = sampleMessages;
            window.tacticalSync.saveToLocalStorage();
          }
        }
        this.openChatModal();
      }, 400);
    } else if (urlParams.get('chat') === 'unread') {
      setTimeout(() => {
        this.unreadChatCount = 3;
        this.updateChatBadges();
      }, 300);
    }

    console.log('FugitiveApp: Ready for tactical ops.');
  }

  initUserProfile() {
    let codename = localStorage.getItem('agentFranks_codename');
    let realName = localStorage.getItem('agentFranks_realName');
    let playerId = localStorage.getItem('agentFranks_playerId');

    if (!playerId) {
      playerId = 'agent_' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('agentFranks_playerId', playerId);
    }

    if (!codename) {
      codename = 'Ghost-' + Math.floor(10 + Math.random() * 90);
      localStorage.setItem('agentFranks_codename', codename);
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('draw') && !urlParams.get('admin') && !urlParams.get('target') && !urlParams.get('report') && !urlParams.get('rotate') && !urlParams.get('preview') && !urlParams.get('inspect') && !urlParams.get('clean') && !urlParams.get('rightdrag') && !urlParams.get('reorient') && !urlParams.get('demo') && !urlParams.get('chat')) {
        this.openModal('user-profile-modal');
      }
    }

    if (realName && window.seekerManager) {
      window.seekerManager.setAlias(codename, realName);
    }

    this.updateUserHudBadge();
  }

  updateUserHudBadge() {
    const codename = localStorage.getItem('agentFranks_codename') || 'Agent';
    const realName = window.seekerManager ? window.seekerManager.getRealName(codename) : '';
    const badgeEl = document.getElementById('user-codename-badge');
    if (badgeEl) {
      badgeEl.textContent = realName ? `${codename} (${realName})` : codename;
    }
  }

  seedInitialPinsIfEmpty() {
    // Default pins removed - users place pins manually
  }

  setupUIEvents() {
    // Top HUD controls
    const muteBtn = document.getElementById('hud-mute-btn');
    if (muteBtn) {
      const updateMuteIcon = () => {
        const isMuted = window.tacticalAudio.isMuted();
        muteBtn.innerHTML = isMuted 
          ? '<i class="fas fa-volume-mute"></i>' 
          : '<i class="fas fa-volume-up"></i>';
      };
      updateMuteIcon();
      muteBtn.addEventListener('click', () => {
        window.tacticalAudio.toggleMute();
        updateMuteIcon();
      });
    }

    // Quick Action Bar
    const quickPingBtn = document.getElementById('quick-ping-fab');
    if (quickPingBtn) {
      quickPingBtn.addEventListener('click', () => {
        if (window.tacticalAudio) window.tacticalAudio.playClick();
        // Use map center as default coordinates
        const center = this.map.getCenter();
        this.openReportModal(center);
      });
    }

    const resetViewBtn = document.getElementById('hud-reset-view-btn');
    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', () => {
        window.mapEngine.resetView();
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    // Floating Action Buttons (Right column)
    const gpsBtn = document.getElementById('fab-gps');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        if (!window.gpsTracker.isTracking) {
          window.gpsTracker.startTracking(this.map, (pos) => {
            this.showToast('GPS lock acquired.', 'satellite');
          });
          gpsBtn.classList.add('active');
        } else {
          const centered = window.gpsTracker.centerOnUser(this.map);
          if (!centered) {
            this.showToast('Searching for GPS signal...', 'satellite');
          }
        }
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    const gpsShareBtn = document.getElementById('fab-gps-share');
    if (gpsShareBtn) {
      gpsShareBtn.addEventListener('click', () => {
        const newState = !window.gpsTracker.isSharingWithTeam;
        window.gpsTracker.setSharing(newState);
        gpsShareBtn.classList.toggle('gps-sharing', newState);
        this.showToast(newState ? 'GPS Broadcasting to Team: ON' : 'GPS Broadcasting: OFF', 'broadcast-tower');
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    const layerBtn = document.getElementById('fab-layers');
    if (layerBtn) {
      layerBtn.addEventListener('click', () => {
        const next = window.mapEngine.activeLayerKey === 'satellite' ? 'dark' : 
                     (window.mapEngine.activeLayerKey === 'dark' ? 'streets' : 'satellite');
        window.mapEngine.setLayer(next);
        this.showToast(`Map Layer: ${next.toUpperCase()}`, 'layer-group');
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    const compassBtn = document.getElementById('fab-compass');
    if (compassBtn) {
      compassBtn.addEventListener('click', () => {
        window.mapEngine.resetRotation();
        this.showToast('REORIENTED TO NORTH (0°)', 'compass');
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    // Modal Triggers
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-open-modal');
        this.openModal(target);
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    });

    document.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // Destination Pin On-Map Control Dock
    const destDockCancelBtn = document.getElementById('dest-dock-cancel-btn');
    if (destDockCancelBtn) {
      destDockCancelBtn.addEventListener('click', () => {
        if (window.mapEngine) {
          window.mapEngine.clearDestinationTarget();
          window.mapEngine.clearLivePreviewPin();
        }
        const dock = document.getElementById('destination-control-dock');
        if (dock) dock.classList.remove('is-active');
        this.pendingClickLatLng = null;
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    const destDockPinBtn = document.getElementById('dest-dock-pin-btn');
    if (destDockPinBtn) {
      destDockPinBtn.addEventListener('click', () => {
        const dock = document.getElementById('destination-control-dock');
        if (dock) dock.classList.remove('is-active');
        if (this.pendingClickLatLng) {
          this.openReportModal(this.pendingClickLatLng);
        }
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }

    // Initialize Interactive Seeker Direction Joystick
    this.initJoystick();

    // Form Submissions
    this.setupForms();
  }

  setupForms() {
    // 1. Report Sighting Form
    const reportForm = document.getElementById('report-sighting-form');
    if (reportForm) {
      reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cosmeticId = document.getElementById('report-cosmetic-select').value;
        const cosmetic = window.seekerManager.getCosmetic(cosmeticId);
        const headingInput = document.getElementById('report-heading-val');
        const headingVal = headingInput && headingInput.value !== '' ? Number(headingInput.value) : null;
        const notes = document.getElementById('report-notes-input').value.trim();
        const codename = localStorage.getItem('agentFranks_codename') || 'Agent';

        let lat = this.pendingClickLatLng ? this.pendingClickLatLng.lat : this.map.getCenter().lat;
        let lng = this.pendingClickLatLng ? this.pendingClickLatLng.lng : this.map.getCenter().lng;

        await window.tacticalSync.savePin({
          cosmeticId: cosmetic.id,
          seekerId: cosmetic.id,
          seekerName: cosmetic.name,
          lat: lat,
          lng: lng,
          heading: headingVal,
          notes: notes,
          reportedByCodename: codename
        });

        if (window.tacticalAudio) {
          window.tacticalAudio.playSightingAlert();
        }

        // Clear destination marker and live preview pin
        if (window.mapEngine) {
          window.mapEngine.clearDestinationTarget();
          window.mapEngine.clearLivePreviewPin();
        }
        const dock = document.getElementById('destination-control-dock');
        if (dock) dock.classList.remove('is-active');
        this.pendingClickLatLng = null;

        this.showToast(`SIGHTING REPORTED: ${cosmetic.name}`, 'car');
        this.closeAllModals();
        reportForm.reset();
        this.resetJoystick();
      });
    }

    // Fugitive Secure Comms & Chat UI
    const openCommsBtn = document.getElementById('open-comms-btn');
    if (openCommsBtn) {
      openCommsBtn.addEventListener('click', () => this.openChatModal());
    }

    const hudCommsBtn = document.getElementById('hud-comms-btn');
    if (hudCommsBtn) {
      hudCommsBtn.addEventListener('click', () => this.openChatModal());
    }

    const chatForm = document.getElementById('fugitive-chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitChatMessage();
      });
    }

    const presetChips = document.querySelectorAll('.chat-preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-preset');
        if (text) {
          this.sendChatText(text);
        }
      });
    });

    const clearChatBtn = document.getElementById('chat-clear-btn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', async () => {
        if (confirm('Clear tactical comms transmission history?')) {
          await window.tacticalSync.clearChatMessages();
          this.showToast('COMMS HISTORY CLEARED', 'trash');
        }
      });
    }

    // 2. User Profile Form
    const profileForm = document.getElementById('user-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codename = document.getElementById('profile-codename-input').value.trim();
        const realName = document.getElementById('profile-realname-input').value.trim();
        const role = document.getElementById('profile-role-select').value;

        if (codename) {
          localStorage.setItem('agentFranks_codename', codename);
          localStorage.setItem('agentFranks_realName', realName);
          localStorage.setItem('agentFranks_role', role);

          if (window.seekerManager && realName) {
            window.seekerManager.setAlias(codename, realName);
          }

          this.updateUserHudBadge();
          this.closeAllModals();
          this.showToast(`IDENT CONFIGURED: ${codename}`, 'user-shield');
        }
      });
    }

    // 3. Codename Alias Directory Form
    const aliasForm = document.getElementById('alias-add-form');
    if (aliasForm) {
      aliasForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codename = document.getElementById('alias-codename-input').value.trim();
        const realName = document.getElementById('alias-realname-input').value.trim();
        if (codename && realName) {
          window.seekerManager.setAlias(codename, realName);
          this.renderAliasList();
          aliasForm.reset();
          // Re-render pins so newly mapped names appear immediately
          this.handlePinsUpdated(window.tacticalSync.pins);
          this.showToast(`Alias mapped: ${codename} -> ${realName}`, 'address-book');
        }
      });
    }

    // 4. Admin Panel Actions
    const adminUnlockForm = document.getElementById('admin-unlock-form');
    if (adminUnlockForm) {
      adminUnlockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('admin-pin-input').value.trim();
        if (window.adminEngine.unlockAdmin(pin)) {
          this.renderAdminControls();
          this.showToast('COMMAND ACCESS GRANTED', 'unlock');
        } else {
          alert('Invalid Command Clearance PIN.');
        }
      });
    }

    const resetPinsBtn = document.getElementById('admin-reset-pins-btn');
    if (resetPinsBtn) {
      resetPinsBtn.addEventListener('click', async () => {
        if (confirm('ARE YOU SURE? This will wipe all seeker pins and breadcrumb trails from the map.')) {
          await window.adminEngine.resetAllPins();
          this.showToast('ALL PINS WIPED', 'trash-alt');
        }
      });
    }

    const simBtn = document.getElementById('admin-toggle-sim-btn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        const isSim = window.adminEngine.toggleSimulation();
        simBtn.textContent = isSim ? 'STOP SIMULATION' : 'START SIMULATED PATROL';
        simBtn.classList.toggle('btn-danger', isSim);
        this.showToast(isSim ? 'SEEKER PATROL SIMULATION ACTIVE' : 'SIMULATION HALTED', 'gamepad');
      });
    }

    const timerStartBtn = document.getElementById('admin-start-timer-btn');
    if (timerStartBtn) {
      timerStartBtn.addEventListener('click', () => {
        const mins = Number(document.getElementById('admin-timer-input').value) || 60;
        window.adminEngine.startMatchTimer(mins);
        this.showToast(`MATCH TIMER STARTED: ${mins}m`, 'stopwatch');
      });
    }

    const timerResetBtn = document.getElementById('admin-reset-timer-btn');
    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', () => {
        window.adminEngine.resetMatchTimer();
        this.showToast('MATCH TIMER RESET', 'redo');
      });
    }

    const exportBtn = document.getElementById('admin-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => window.adminEngine.exportMatchData());
    }

    // Admin Save PIN Button
    const savePinBtn = document.getElementById('admin-save-pin-btn');
    if (savePinBtn) {
      savePinBtn.addEventListener('click', () => {
        const newPin = document.getElementById('admin-change-pin-input').value.trim();
        if (window.adminEngine.setAdminPin(newPin)) {
          this.showToast('ADMIN UNLOCK PIN UPDATED', 'key');
          document.getElementById('admin-change-pin-input').value = '';
        } else {
          alert('New PIN must be at least 4 characters.');
        }
      });
    }

    // Admin Add Custom Vehicle Button
    const addVehicleBtn = document.getElementById('admin-add-vehicle-btn');
    if (addVehicleBtn) {
      addVehicleBtn.addEventListener('click', () => {
        const name = document.getElementById('admin-new-vehicle-name').value.trim();
        const callsign = document.getElementById('admin-new-vehicle-callsign').value.trim();
        const color = document.getElementById('admin-new-vehicle-color').value;
        const desc = document.getElementById('admin-new-vehicle-desc').value.trim();
        const typeSelect = document.getElementById('admin-new-vehicle-type');
        const type = typeSelect ? typeSelect.value : 'cruiser';

        if (!name) {
          alert('Please enter a seeker name.');
          return;
        }

        window.seekerManager.addCosmetic({ name, callsign, color, description: desc, type });
        this.renderAdminCosmeticsList();
        this.renderCosmeticsSelector();
        this.showToast(`ADDED: ${name}`, 'plus-circle');

        document.getElementById('admin-new-vehicle-name').value = '';
        document.getElementById('admin-new-vehicle-callsign').value = '';
        document.getElementById('admin-new-vehicle-desc').value = '';
      });
    }

    // Admin Reset Cosmetics to Defaults
    const resetCosmeticsBtn = document.getElementById('admin-reset-cosmetics-btn');
    if (resetCosmeticsBtn) {
      resetCosmeticsBtn.addEventListener('click', () => {
        if (confirm('Reset all vehicle descriptions and colors to factory defaults?')) {
          window.seekerManager.resetCosmeticsToDefault();
          this.renderAdminCosmeticsList();
          this.renderCosmeticsSelector();
          this.handlePinsUpdated(window.tacticalSync.pins);
          this.showToast('VEHICLES RESET TO DEFAULTS', 'redo');
        }
      });
    }

    // Admin Boundary Drawing Controls
    const startDrawBtn = document.getElementById('admin-start-draw-boundary-btn');
    const drawToolbar = document.getElementById('boundary-draw-toolbar');
    const ptCountEl = document.getElementById('boundary-point-count');

    if (startDrawBtn) {
      startDrawBtn.addEventListener('click', () => {
        this.closeAllModals();
        if (drawToolbar) drawToolbar.classList.add('is-active');
        if (ptCountEl) ptCountEl.textContent = '0';

        window.mapEngine.startBoundaryDrawing(
          (pointCount) => {
            if (ptCountEl) ptCountEl.textContent = pointCount;
            if (window.tacticalAudio) window.tacticalAudio.playClick();
          },
          async (finalCoords) => {
            if (drawToolbar) drawToolbar.classList.remove('is-active');
            await window.tacticalSync.updateBoundary(finalCoords);
            this.handleBoundaryUpdated(finalCoords);
            if (window.tacticalAudio) window.tacticalAudio.playSightingAlert();
            this.showToast('TACTICAL BOUNDARY APPLIED & SYNCED', 'draw-polygon');
          }
        );

        this.showToast('Tap map to place perimeter vertices. Click start point to close loop.', 'pencil-alt');
      });
    }

    const undoPtBtn = document.getElementById('boundary-undo-point-btn');
    if (undoPtBtn) {
      undoPtBtn.addEventListener('click', () => {
        const remaining = window.mapEngine.undoLastBoundaryPoint();
        if (ptCountEl) ptCountEl.textContent = remaining;
      });
    }

    const finishDrawBtn = document.getElementById('boundary-finish-btn');
    if (finishDrawBtn) {
      finishDrawBtn.addEventListener('click', async () => {
        const finalCoords = window.mapEngine.finishBoundaryDrawing();
        if (finalCoords) {
          if (drawToolbar) drawToolbar.classList.remove('is-active');
          await window.tacticalSync.updateBoundary(finalCoords);
          this.handleBoundaryUpdated(finalCoords);
          if (window.tacticalAudio) window.tacticalAudio.playSightingAlert();
          this.showToast('TACTICAL BOUNDARY APPLIED & SYNCED', 'check-circle');
        }
      });
    }

    const cancelDrawBtn = document.getElementById('boundary-cancel-btn');
    if (cancelDrawBtn) {
      cancelDrawBtn.addEventListener('click', () => {
        window.mapEngine.cancelBoundaryDrawing();
        if (drawToolbar) drawToolbar.classList.remove('is-active');
        this.showToast('Boundary drawing cancelled.', 'times-circle');
      });
    }

    const resetBoundaryBtn = document.getElementById('admin-reset-boundary-btn');
    if (resetBoundaryBtn) {
      resetBoundaryBtn.addEventListener('click', async () => {
        if (confirm('Reset sector boundary to the default West Kaysville perimeter?')) {
          await window.tacticalSync.resetBoundary();
          this.handleBoundaryUpdated(null);
          this.showToast('BOUNDARY RESET TO DEFAULT', 'undo');
        }
      });
    }

    // 4b. Landmark & Custom Location Pin Placement
    const placeLmBtn = document.getElementById('admin-place-landmark-btn');
    if (placeLmBtn) {
      placeLmBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('admin-landmark-name');
        const typeInput = document.getElementById('admin-landmark-type');
        const descInput = document.getElementById('admin-landmark-desc');

        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          alert('Please enter a location name before pinning.');
          return;
        }

        const type = typeInput ? typeInput.value : 'poi';
        const description = descInput ? descInput.value.trim() : '';
        const badgeMap = {
          objective: 'OBJECTIVE',
          start: 'START SECTOR',
          school: 'SCHOOL',
          park: 'PARK GROUNDS',
          poi: 'LANDMARK',
          hazard: 'HAZARD ZONE'
        };
        const badge = badgeMap[type] || 'LANDMARK';

        // Close admin modal so map is fully visible
        this.closeAllModals();

        window.mapEngine.startLandmarkPlacement({ name, type, badge, description }, async (placedLm) => {
          await window.tacticalSync.addLandmark(placedLm);
          this.handleLandmarksUpdated(window.tacticalSync.landmarks);
          if (window.tacticalAudio) window.tacticalAudio.playSightingAlert();
          this.showToast(`PIN DROPPED: ${placedLm.name.toUpperCase()}`, 'map-marker-alt');
          if (nameInput) nameInput.value = '';
          if (descInput) descInput.value = '';
        });

        this.showToast(`CLICK MAP TO PLACE: ${name.toUpperCase()}`, 'crosshairs');
      });
    }

    // 5. Firebase Settings Form
    const fbForm = document.getElementById('firebase-settings-form');
    if (fbForm) {
      fbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawJson = document.getElementById('firebase-config-json').value.trim();
        try {
          const cfg = JSON.parse(rawJson);
          window.tacticalSync.setFirebaseConfig(cfg);
          this.showToast('FIREBASE CONFIG APPLIED', 'check-circle');
          this.closeAllModals();
        } catch (err) {
          alert('Invalid JSON format. Please paste valid Firebase config object.');
        }
      });
    }

    // 6. Pin Inspector Bottom Sheet actions
    const sheetCloseBtn = document.getElementById('sheet-close-btn');
    if (sheetCloseBtn) {
      sheetCloseBtn.addEventListener('click', () => this.closePinInspector());
    }

    const sheetDeleteBtn = document.getElementById('sheet-delete-pin-btn');
    if (sheetDeleteBtn) {
      sheetDeleteBtn.addEventListener('click', async () => {
        // Enforce Admin clearance requirement
        if (!window.adminEngine || !window.adminEngine.isAdminUnlocked) {
          const pin = prompt('COMMAND CLEARANCE REQUIRED:\nOnly Administrators can remove seeker sighting pins.\nEnter Admin PIN:');
          if (!pin) return;
          if (!window.adminEngine.unlockAdmin(pin.trim())) {
            this.showToast('ACCESS DENIED: INVALID ADMIN PIN', 'lock');
            alert('Invalid Command Clearance PIN. Pin removal denied.');
            return;
          }
          this.showToast('COMMAND ACCESS GRANTED', 'unlock');
          this.renderAdminControls();
          if (sheetDeleteBtn) {
            sheetDeleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> REMOVE SIGHTING (ADMIN)';
            sheetDeleteBtn.classList.remove('is-admin-locked');
          }
        }

        if (this.selectedPin && confirm('ADMIN CONFIRMATION: Remove this sighting pin from the tactical grid?')) {
          await window.tacticalSync.deletePin(this.selectedPin.id);
          this.closePinInspector();
          this.showToast('SEEKER PIN REMOVED', 'trash');
        }
      });
    }
  }

  handleMapClick(latlng) {
    this.pendingClickLatLng = latlng;
    
    // Drop destination pin on map
    if (window.mapEngine) {
      window.mapEngine.setDestinationTarget(latlng);
    }

    // Update destination control dock
    const dock = document.getElementById('destination-control-dock');
    const coordsEl = document.getElementById('dest-dock-coords');
    if (coordsEl && latlng) {
      const landmark = window.seekerManager ? window.seekerManager.getNearestLandmark(latlng.lat, latlng.lng) : null;
      const lmText = landmark ? ` • ~${landmark.distMeters}m from ${landmark.name}` : '';
      coordsEl.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}${lmText}`;
    }
    if (dock) {
      dock.classList.add('is-active');
    }

    if (window.tacticalAudio) {
      window.tacticalAudio.playClick();
    }
  }

  openReportModal(latlng) {
    this.pendingClickLatLng = latlng;
    const coordDisplay = document.getElementById('report-coords-text');
    if (coordDisplay && latlng) {
      const landmark = window.seekerManager.getNearestLandmark(latlng.lat, latlng.lng);
      const lmText = landmark ? `(~${landmark.distMeters}m from ${landmark.name})` : '';
      coordDisplay.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)} ${lmText}`;
    }

    this.renderCosmeticsSelector();
    this.resetJoystick();
    this.openModal('report-sighting-modal');

    // Show live preview pin with initial vehicle and no direction rod (until joystick moved)
    if (window.mapEngine && latlng) {
      const cosmeticId = document.getElementById('report-cosmetic-select') ? document.getElementById('report-cosmetic-select').value : 'shadow-van';
      const cosmetic = window.seekerManager ? window.seekerManager.getCosmetic(cosmeticId) : null;
      window.mapEngine.updateLivePreviewPin(latlng, cosmetic, null);
    }
  }

  renderCosmeticsSelector() {
    const container = document.getElementById('cosmetics-selector-grid');
    if (!container || !window.seekerManager) return;

    container.innerHTML = '';
    const cosmetics = window.seekerManager.cosmetics;

    cosmetics.forEach((cosmetic, idx) => {
      const card = document.createElement('div');
      card.className = `cosmetic-card ${idx === 0 ? 'is-selected' : ''}`;
      card.style.setProperty('--card-color', cosmetic.color);
      card.innerHTML = `
        <div class="cosmetic-card-icon">
          ${window.seekerManager.getCosmeticIconSvg(cosmetic, 22)}
        </div>
        <div class="cosmetic-card-info">
          <span class="cosmetic-card-title">${cosmetic.name}</span>
          <span class="cosmetic-card-sub">${cosmetic.callsign}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.cosmetic-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        document.getElementById('report-cosmetic-select').value = cosmetic.id;

        // Update live preview pin vehicle cosmetic on map
        if (this.pendingClickLatLng && window.mapEngine) {
          const headingInput = document.getElementById('report-heading-val');
          const heading = headingInput && headingInput.value !== '' ? Number(headingInput.value) : null;
          window.mapEngine.updateLivePreviewPin(this.pendingClickLatLng, cosmetic, heading);
        }
      });

      container.appendChild(card);
    });

    if (cosmetics.length > 0) {
      document.getElementById('report-cosmetic-select').value = cosmetics[0].id;
    }
  }

  handlePinsUpdated(pins) {
    if (!this.map || !window.seekerManager) return;

    // Render markers & trails
    window.seekerManager.renderPinsOnMap(this.map, pins, (pin, cosmetic, isLatest, step, total) => {
      this.openPinInspector(pin, cosmetic, isLatest, step, total);
    });

    // Update active seeker counter
    const activeSeekers = new Set(pins.map(p => p.seekerId || p.cosmeticId)).size;
    const counterEl = document.getElementById('hud-seeker-count');
    if (counterEl) {
      counterEl.textContent = `${activeSeekers} ACTIVE`;
    }
  }

  handlePlayersUpdated(players) {
    if (window.gpsTracker) {
      window.gpsTracker.renderTeammates(this.map, players);
    }
  }

  handleMatchStateUpdated(state) {
    this.updateMatchTimerDisplay(state);
  }

  handleBoundaryUpdated(boundary) {
    if (window.mapEngine) {
      window.mapEngine.applyFadeToBlackMask(boundary);
    }
    const badge = document.getElementById('admin-boundary-status-badge');
    if (badge) {
      badge.textContent = boundary && boundary.length 
        ? `Custom Sector (${boundary.length} pts)` 
        : 'Default Kaysville';
      badge.style.color = boundary && boundary.length ? 'var(--accent-green)' : 'var(--accent-cyan)';
    }
  }

  handleLandmarksUpdated(landmarks) {
    if (window.mapEngine) {
      window.mapEngine.renderLandmarks(landmarks);
    }
    const badge = document.getElementById('admin-landmark-count-badge');
    if (badge) {
      badge.textContent = `${landmarks ? landmarks.length : 0} Placed`;
    }
    this.renderAdminLandmarksList();
  }

  startHeartbeatTimers() {
    // 1. Match clock tick
    this.timerInterval = setInterval(() => {
      if (window.tacticalSync) {
        this.updateMatchTimerDisplay(window.tacticalSync.matchState);
      }
    }, 1000);

    // 2. Relative time recalculation for open sheet
    this.relativeTimeInterval = setInterval(() => {
      if (this.selectedPin) {
        this.refreshSheetTime();
      }
    }, 5000);
  }

  updateMatchTimerDisplay(state) {
    const clockEl = document.getElementById('hud-match-clock');
    if (!clockEl) return;

    if (!state || !state.startTime || state.status !== 'active') {
      clockEl.textContent = '00:00:00';
      return;
    }

    const elapsedMs = Date.now() - state.startTime;
    const totalMs = (state.durationMinutes || 60) * 60 * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);

    const hrs = Math.floor(remainingMs / 3600000);
    const mins = Math.floor((remainingMs % 3600000) / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    clockEl.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  openPinInspector(pin, cosmetic, isLatest, step, total) {
    this.selectedPin = pin;
    if (window.tacticalAudio) window.tacticalAudio.playClick();

    const sheet = document.getElementById('pin-inspector-sheet');
    if (!sheet) return;

    // Fill sheet contents
    const status = window.seekerManager.getTimeStatus(pin.timestamp);
    const badgeEl = document.getElementById('sheet-status-badge');
    badgeEl.className = `sheet-badge ${status.class}`;
    badgeEl.innerHTML = isLatest 
      ? `<i class="fas fa-satellite-dish"></i> ACTIVE PULSE: ${status.label}`
      : `<i class="fas fa-history"></i> BREADCRUMB #${step} of ${total}`;

    document.getElementById('sheet-seeker-name').textContent = cosmetic.name;
    document.getElementById('sheet-relative-time').textContent = window.seekerManager.getRelativeTime(pin.timestamp);
    document.getElementById('sheet-exact-time').textContent = new Date(pin.timestamp).toLocaleTimeString();

    const reporterText = window.seekerManager.getDisplayName(pin.reportedByCodename);
    document.getElementById('sheet-reporter').textContent = reporterText;

    const lm = window.seekerManager.getNearestLandmark(pin.lat, pin.lng);
    document.getElementById('sheet-location').textContent = lm 
      ? `${lm.distMeters}m from ${lm.name}` 
      : `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;

    const notesBox = document.getElementById('sheet-notes');
    if (pin.notes) {
      notesBox.textContent = `Intel: "${pin.notes}"`;
      notesBox.style.display = 'block';
    } else {
      notesBox.style.display = 'none';
    }

    // Dynamic Admin Removal Authorization indicator
    const deleteBtn = document.getElementById('sheet-delete-pin-btn');
    const isAdmin = window.adminEngine && window.adminEngine.isAdminUnlocked;
    if (deleteBtn) {
      if (isAdmin) {
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> REMOVE SIGHTING (ADMIN)';
        deleteBtn.classList.remove('is-admin-locked');
      } else {
        deleteBtn.innerHTML = '<i class="fas fa-lock"></i> REMOVE SIGHTING (ADMIN ONLY)';
        deleteBtn.classList.add('is-admin-locked');
      }
    }

    sheet.classList.add('is-open');
  }

  refreshSheetTime() {
    if (!this.selectedPin) return;
    const relEl = document.getElementById('sheet-relative-time');
    if (relEl) {
      relEl.textContent = window.seekerManager.getRelativeTime(this.selectedPin.timestamp);
    }
  }

  closePinInspector() {
    this.selectedPin = null;
    const sheet = document.getElementById('pin-inspector-sheet');
    if (sheet) sheet.classList.remove('is-open');
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('is-open');
      if (modalId === 'alias-directory-modal') {
        this.renderAliasList();
      } else if (modalId === 'admin-modal') {
        this.renderAdminControls();
      }
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('is-open'));
    if (window.mapEngine) {
      window.mapEngine.clearLivePreviewPin();
    }
  }

  /* ----------------------------------------------------
   * Seeker Direction Joystick Controller
   * ---------------------------------------------------- */
  initJoystick() {
    const track = document.getElementById('seeker-joystick-track');
    const knob = document.getElementById('seeker-joystick-knob');
    const centerBtn = document.getElementById('joystick-center-btn');
    if (!track || !knob) return;

    let isDragging = false;

    const handlePointerMove = (clientX, clientY) => {
      const rect = track.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxR = (rect.width / 2) - 14;

      // Deadzone: within 12px of center counts as stationary (no direction rod)
      if (dist < 12) {
        this.resetJoystick();
        return;
      }

      const clampedDist = Math.min(dist, maxR);
      const rad = Math.atan2(dy, dx);
      const knobX = Math.cos(rad) * clampedDist;
      const knobY = Math.sin(rad) * clampedDist;

      // Compass heading: 0° is North (-Y), 90° is East (+X), 180° is South (+Y), 270° is West (-X)
      const deg = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 90 + 360) % 360);

      this.applyJoystickHeading(deg, knobX, knobY);
    };

    track.addEventListener('mousedown', (e) => {
      isDragging = true;
      track.classList.add('is-dragging');
      handlePointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handlePointerMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        track.classList.remove('is-dragging');
      }
    });

    // Touch support for mobile devices
    track.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        track.classList.add('is-dragging');
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        track.classList.remove('is-dragging');
      }
    });

    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        this.resetJoystick();
        if (window.tacticalAudio) window.tacticalAudio.playClick();
      });
    }
  }

  applyJoystickHeading(deg, knobX, knobY) {
    const knob = document.getElementById('seeker-joystick-knob');
    const headingValEl = document.getElementById('joystick-heading-val');
    const headingHintEl = document.getElementById('joystick-heading-hint');
    const headingInput = document.getElementById('report-heading-val');

    if (knob) {
      knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }
    if (headingInput) {
      headingInput.value = deg !== null ? deg : '';
    }
    if (headingValEl) {
      headingValEl.textContent = deg !== null ? `${this.getCompassCardinal(deg)} (${deg}°)` : 'CENTERED (STATIONARY)';
      headingValEl.style.color = deg !== null ? 'var(--accent-cyan)' : 'var(--text-muted)';
    }
    if (headingHintEl) {
      headingHintEl.textContent = deg !== null ? `Rod points heading ${deg}°` : 'No directional rod';
    }

    // Live visual preview on map
    if (this.pendingClickLatLng && window.mapEngine) {
      const cosmeticId = document.getElementById('report-cosmetic-select') ? document.getElementById('report-cosmetic-select').value : 'shadow-van';
      const cosmetic = window.seekerManager ? window.seekerManager.getCosmetic(cosmeticId) : null;
      window.mapEngine.updateLivePreviewPin(this.pendingClickLatLng, cosmetic, deg);
    }
  }

  setJoystickAngle(deg) {
    const track = document.getElementById('seeker-joystick-track');
    const maxR = track ? (track.getBoundingClientRect().width / 2) - 16 : 40;
    const rad = ((deg - 90) * Math.PI) / 180;
    const knobX = Math.cos(rad) * maxR;
    const knobY = Math.sin(rad) * maxR;
    this.applyJoystickHeading(deg, knobX, knobY);
  }

  resetJoystick() {
    const knob = document.getElementById('seeker-joystick-knob');
    const headingValEl = document.getElementById('joystick-heading-val');
    const headingHintEl = document.getElementById('joystick-heading-hint');
    const headingInput = document.getElementById('report-heading-val');

    if (knob) {
      knob.style.transform = 'translate(0px, 0px)';
    }
    if (headingInput) {
      headingInput.value = '';
    }
    if (headingValEl) {
      headingValEl.textContent = 'CENTERED (STATIONARY)';
      headingValEl.style.color = 'var(--text-muted)';
    }
    if (headingHintEl) {
      headingHintEl.textContent = 'No directional rod';
    }

    // Update live preview pin to have no rod (stationary)
    if (this.pendingClickLatLng && window.mapEngine) {
      const cosmeticId = document.getElementById('report-cosmetic-select') ? document.getElementById('report-cosmetic-select').value : 'shadow-van';
      const cosmetic = window.seekerManager ? window.seekerManager.getCosmetic(cosmeticId) : null;
      window.mapEngine.updateLivePreviewPin(this.pendingClickLatLng, cosmetic, null);
    }
  }

  getCompassCardinal(deg) {
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return cardinals[idx];
  }

  renderAliasList() {
    const list = document.getElementById('alias-list-container');
    if (!list || !window.seekerManager) return;
    list.innerHTML = '';

    const aliases = window.seekerManager.aliases;
    const keys = Object.keys(aliases);

    if (keys.length === 0) {
      list.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem;">No custom real-name mappings set yet. Add one below!</div>';
      return;
    }

    keys.forEach(code => {
      const row = document.createElement('div');
      row.style = 'display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.85rem;';
      row.innerHTML = `
        <span><strong style="color: var(--accent-cyan);">${code}</strong> &rarr; <span style="color: #fff;">${aliases[code]}</span></span>
        <button class="hud-btn" style="padding: 2px 8px; font-size: 0.7rem; color: #ff5252;" data-remove-alias="${code}">Remove</button>
      `;

      row.querySelector('[data-remove-alias]').addEventListener('click', () => {
        window.seekerManager.setAlias(code, null);
        this.renderAliasList();
        this.handlePinsUpdated(window.tacticalSync.pins);
      });

      list.appendChild(row);
    });
  }

  renderAdminControls() {
    const lockView = document.getElementById('admin-lock-view');
    const panelView = document.getElementById('admin-panel-view');
    if (window.adminEngine.isAdminUnlocked) {
      if (lockView) lockView.style.display = 'none';
      if (panelView) panelView.style.display = 'flex';
      this.renderAdminCosmeticsList();
      this.renderAdminLandmarksList();
    } else {
      if (lockView) lockView.style.display = 'flex';
      if (panelView) panelView.style.display = 'none';
    }
  }

  renderAdminCosmeticsList() {
    const container = document.getElementById('admin-cosmetics-list');
    if (!container || !window.seekerManager) return;
    container.innerHTML = '';

    const cosmetics = window.seekerManager.cosmetics;
    cosmetics.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'admin-cosmetic-row';
      row.innerHTML = `
        <div class="admin-cosmetic-header" style="display: flex; align-items: center; gap: 8px;">
          <div class="admin-cosmetic-icon-preview" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; flex-shrink: 0;" title="${c.type === 'human' ? 'Human Seeker' : 'Vehicle Seeker'}">
            ${window.seekerManager.getCosmeticIconSvg(c, 20)}
          </div>
          <input type="color" class="admin-color-picker" id="cosmetic-color-${c.id}" value="${c.color}" title="Change Radar Color">
          <div style="flex: 1; display: flex; gap: 6px;">
            <input type="text" class="form-input" id="cosmetic-name-${c.id}" value="${c.name}" placeholder="Name" style="flex: 1.2; font-size: 0.8rem; padding: 6px 8px;">
            <input type="text" class="form-input" id="cosmetic-callsign-${c.id}" value="${c.callsign || ''}" placeholder="Callsign" style="flex: 0.8; font-size: 0.8rem; padding: 6px 8px;">
          </div>
        </div>
        <input type="text" class="form-input" id="cosmetic-desc-${c.id}" value="${c.description || ''}" placeholder="Description / details about this vehicle" style="font-size: 0.78rem; padding: 6px 8px; width: 100%;">
        <div class="admin-cosmetic-actions">
          <button type="button" class="hud-btn" style="color: #ff5252; font-size: 0.72rem; padding: 4px 8px;" data-delete-cosmetic="${c.id}">
            <i class="fas fa-trash-alt"></i> Remove
          </button>
          <button type="button" class="btn-tactical" style="font-size: 0.72rem; padding: 4px 12px;" data-save-cosmetic="${c.id}">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      `;

      row.querySelector(`[data-save-cosmetic="${c.id}"]`).addEventListener('click', () => {
        const name = document.getElementById(`cosmetic-name-${c.id}`).value.trim();
        const callsign = document.getElementById(`cosmetic-callsign-${c.id}`).value.trim();
        const color = document.getElementById(`cosmetic-color-${c.id}`).value;
        const description = document.getElementById(`cosmetic-desc-${c.id}`).value.trim();

        window.seekerManager.updateCosmetic(c.id, { name, callsign, color, description });
        this.renderCosmeticsSelector();
        this.handlePinsUpdated(window.tacticalSync.pins);
        this.showToast(`UPDATED: ${name}`, 'check');
      });

      row.querySelector(`[data-delete-cosmetic="${c.id}"]`).addEventListener('click', () => {
        if (confirm(`Remove vehicle "${c.name}" from radar selection?`)) {
          if (window.seekerManager.deleteCosmetic(c.id)) {
            this.renderAdminCosmeticsList();
            this.renderCosmeticsSelector();
            this.handlePinsUpdated(window.tacticalSync.pins);
            this.showToast(`Vehicle removed`, 'trash-alt');
          } else {
            alert('Cannot remove the only remaining vehicle.');
          }
        }
      });

      container.appendChild(row);
    });
  }

  renderAdminLandmarksList() {
    const container = document.getElementById('admin-landmarks-list');
    if (!container || !window.tacticalSync) return;
    container.innerHTML = '';

    const landmarks = window.tacticalSync.landmarks || [];
    if (!landmarks.length) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.72rem; padding: 4px;">No custom location pins placed yet. Use form below to pin your landmarks!</div>';
      return;
    }

    landmarks.forEach(lm => {
      const row = document.createElement('div');
      row.style = 'display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.78rem;';
      const color = lm.type === 'objective' ? '#00e676' : (lm.type === 'start' ? '#ff9100' : (lm.type === 'hazard' ? '#ff1744' : '#00e5ff'));
      row.innerHTML = `
        <div style="flex: 1; min-width: 0; padding-right: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 700; color: ${color};">${lm.name}</span>
            <span style="font-size: 0.62rem; padding: 1px 5px; border-radius: 3px; background: rgba(255,255,255,0.1); color: ${color};">${lm.badge || lm.type}</span>
          </div>
          <div style="font-size: 0.68rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${lm.description ? lm.description + ' • ' : ''}${lm.lat.toFixed(4)}, ${lm.lng.toFixed(4)}
          </div>
        </div>
        <button type="button" class="hud-btn" style="color: #ff5252; font-size: 0.68rem; padding: 2px 6px;" data-delete-landmark="${lm.id}">
          <i class="fas fa-trash"></i>
        </button>
      `;

      row.querySelector('[data-delete-landmark]').addEventListener('click', async () => {
        if (confirm(`Remove location pin "${lm.name}"?`)) {
          await window.tacticalSync.deleteLandmark(lm.id);
          this.handleLandmarksUpdated(window.tacticalSync.landmarks);
          this.showToast(`REMOVED: ${lm.name}`, 'trash');
        }
      });

      container.appendChild(row);
    });
  }

  // =========================================================================
  // FUGITIVE SECURE COMMS & CHAT METHODS
  // =========================================================================

  openChatModal() {
    this.unreadChatCount = 0;
    this.updateChatBadges();
    this.openModal('fugitive-chat-modal');
    this.renderChatMessages(window.tacticalSync ? window.tacticalSync.messages : []);
    setTimeout(() => {
      const input = document.getElementById('chat-message-input');
      if (input) input.focus();
      this.scrollChatToBottom();
    }, 100);
  }

  updateChatBadges() {
    const bottomBadge = document.getElementById('chat-unread-badge');
    const hudBadge = document.getElementById('hud-chat-unread-badge');
    if (this.unreadChatCount > 0) {
      if (bottomBadge) {
        bottomBadge.textContent = this.unreadChatCount > 99 ? '99+' : this.unreadChatCount;
        bottomBadge.classList.remove('hidden');
      }
      if (hudBadge) {
        hudBadge.classList.remove('hidden');
      }
    } else {
      if (bottomBadge) bottomBadge.classList.add('hidden');
      if (hudBadge) hudBadge.classList.add('hidden');
    }
  }

  scrollChatToBottom() {
    const container = document.getElementById('chat-messages-stream');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async submitChatMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await this.sendChatText(text);
  }

  async sendChatText(text) {
    if (!text || !window.tacticalSync) return;
    const codename = localStorage.getItem('agentFranks_codename') || 'Fugitive-1';
    const realName = window.seekerManager ? window.seekerManager.getRealName(codename) : '';
    const role = localStorage.getItem('agentFranks_role') || 'Fugitive';

    await window.tacticalSync.sendChatMessage({
      text,
      senderCodename: codename,
      senderRealName: realName,
      role
    });

    if (window.tacticalAudio) {
      window.tacticalAudio.playClick();
    }
    this.scrollChatToBottom();
  }

  handleMessagesUpdated(messages, newMsg) {
    const chatModal = document.getElementById('fugitive-chat-modal');
    const isModalOpen = chatModal && chatModal.classList.contains('active');
    const currentCodename = localStorage.getItem('agentFranks_codename') || '';

    this.renderChatMessages(messages);

    if (newMsg && newMsg.senderCodename !== currentCodename) {
      // Incoming transmission from a teammate!
      if (window.tacticalAudio) {
        window.tacticalAudio.playCommsChirp();
      }

      if (!isModalOpen) {
        this.unreadChatCount++;
        this.updateChatBadges();
        this.showToast(`COMMS [${newMsg.senderCodename}]: ${newMsg.text}`, 'comments');
      }
    }

    if (isModalOpen) {
      this.scrollChatToBottom();
    }
  }

  renderChatMessages(messages) {
    const container = document.getElementById('chat-messages-stream');
    if (!container) return;

    if (!messages || !messages.length) {
      container.innerHTML = `
        <div class="chat-empty-hint" id="chat-empty-state">
          <i class="fas fa-satellite-dish"></i>
          <span>No transmissions yet. Broadcast intel to fugitive squad.</span>
        </div>
      `;
      return;
    }

    const currentCodename = localStorage.getItem('agentFranks_codename') || '';

    container.innerHTML = '';
    messages.forEach(msg => {
      const isOutgoing = msg.senderCodename === currentCodename;
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const realNameStr = msg.senderRealName ? ` (${msg.senderRealName})` : '';

      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${isOutgoing ? 'is-outgoing' : 'is-incoming'}`;
      bubble.innerHTML = `
        <div class="bubble-meta">
          <span class="bubble-sender">${isOutgoing ? 'YOU' : this.escapeHtml(msg.senderCodename)}${this.escapeHtml(realNameStr)}</span>
          <span class="bubble-time">${timeStr}</span>
        </div>
        <div class="bubble-content">${this.escapeHtml(msg.text)}</div>
      `;
      container.appendChild(bubble);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message, icon = 'info-circle') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'tactical-toast';
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas fa-${icon}" style="color: var(--accent-cyan);"></i></div>
      <div class="toast-msg">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.fugitiveApp = new FugitiveApp();
  window.fugitiveApp.init();
});
