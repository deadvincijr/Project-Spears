/**
 * Firebase Realtime Sync - Pure Cloud Mode (agent-franks)
 * Stores and synchronizes all operational data exclusively via Firebase Realtime Database.
 * Local device caches and old localStorage pins/data are completely wiped.
 */

class TacticalSync {
  constructor() {
    this.firebaseApp = null;
    this.rtdb = null;
    this.db = null;
    this.isFirebaseReady = false;
    this.syncStatus = 'connecting'; // 'connecting', 'connected', 'disconnected', 'permission_denied'

    this.pinsListeners = [];
    this.playersListeners = [];
    this.matchStateListeners = [];
    this.boundaryListeners = [];
    this.landmarksListeners = [];
    this.messagesListeners = [];
    this.statusListeners = [];
    this.lockoutListeners = [];

    // Pure in-memory state - populated exclusively by Firebase
    this.pins = [];
    this.players = {};
    this.lockouts = {};
    this.boundary = null;
    this.landmarks = [];
    this.messages = [];
    this.matchState = {
      startTime: null,
      durationMinutes: 60,
      status: 'active'
    };

    // Wipe any stale local device storage immediately
    this.clearAllLegacyData();
  }

  /**
   * Completely wipes all legacy local device caches for Agent Franks
   */
  clearAllLegacyData() {
    try {
      const keysToWipe = [
        'agentFranks_pins',
        'agentFranks_match',
        'agentFranks_custom_boundary',
        'agentFranks_landmarks',
        'agentFranks_chat_messages',
        'agentFranks_aliases',
        'agentFranks_custom_cosmetics'
      ];
      keysToWipe.forEach(key => localStorage.removeItem(key));
      console.log('TacticalSync: All local device data wiped. Strictly using Firebase Realtime Database.');
    } catch (e) {
      console.warn('TacticalSync: Error clearing localStorage data:', e);
    }
  }

  // No-op to prevent saving operational data to local device storage
  saveToLocalStorage() {
    // Disabled: All data is stored exclusively in Firebase Realtime Database
  }

  loadFromLocalStorage() {
    // Disabled: All data is loaded exclusively from Firebase Realtime Database
  }

  getFirebaseConfig() {
    try {
      const cfg = localStorage.getItem('agentFranks_firebase_config');
      if (cfg) {
        return JSON.parse(cfg);
      }
    } catch (e) {
      console.warn('Error reading agentFranks_firebase_config:', e);
    }
    // Default configuration for agent-franks Realtime Database
    return {
      projectId: 'agent-franks',
      databaseURL: 'https://agent-franks-default-rtdb.firebaseio.com'
    };
  }

  setFirebaseConfig(config) {
    try {
      if (!config) {
        localStorage.removeItem('agentFranks_firebase_config');
      } else {
        localStorage.setItem('agentFranks_firebase_config', JSON.stringify(config));
      }
      this.initFirebase();
      return true;
    } catch (e) {
      console.error('Failed to set firebase config:', e);
      return false;
    }
  }

  onSyncStatusChanged(cb) {
    this.statusListeners.push(cb);
    cb(this.syncStatus);
  }

  notifyStatus(status, details = '') {
    this.syncStatus = status;
    this.statusListeners.forEach(cb => cb(status, details));
  }

  async initFirebase() {
    const config = this.getFirebaseConfig();
    if (!config || !window.firebase) {
      console.warn('TacticalSync: Firebase SDK not loaded on window.');
      this.isFirebaseReady = false;
      this.notifyStatus('disconnected');
      return false;
    }

    try {
      const appConfig = {
        projectId: config.projectId || 'agent-franks',
        databaseURL: config.databaseURL || 'https://agent-franks-default-rtdb.firebaseio.com',
        ...config
      };

      if (!firebase.apps || !firebase.apps.length) {
        this.firebaseApp = firebase.initializeApp(appConfig);
      } else {
        this.firebaseApp = firebase.app();
      }

      if (firebase.database) {
        this.rtdb = firebase.database();
        this.isFirebaseReady = true;
        this.listenRTDB();
        console.log('TacticalSync: Connected to Firebase Realtime Database at', appConfig.databaseURL);
      } else if (firebase.firestore) {
        this.db = firebase.firestore();
        this.isFirebaseReady = true;
        this.listenFirestore();
      }

      return true;
    } catch (err) {
      console.error('TacticalSync: Firebase initialization error:', err);
      this.isFirebaseReady = false;
      this.notifyStatus('disconnected', err.message);
      return false;
    }
  }

  listenRTDB() {
    if (!this.rtdb) return;

    // Monitor Firebase RTDB connection state
    this.rtdb.ref('.info/connected').on('value', (snap) => {
      const connected = !!snap.val();
      this.notifyStatus(connected ? 'connected' : 'disconnected');
    });

    const handleRTDBError = (err) => {
      console.error('RTDB Sync Error:', err);
      if (err && (err.code === 'PERMISSION_DENIED' || (err.message && err.message.toLowerCase().includes('permission_denied')))) {
        this.notifyStatus('permission_denied', err.message);
      }
    };

    // 1. Sighting / Seeker Pins
    this.rtdb.ref('agent_franks/pins').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.pins = Object.keys(val).map(key => ({ id: key, ...val[key] }));
      } else {
        this.pins = [];
      }
      this.notifyPins();
    }, handleRTDBError);

    // 2. Active Players & Live GPS
    this.rtdb.ref('agent_franks/players').on('value', (snapshot) => {
      this.players = snapshot.val() || {};
      this.notifyPlayers();
    }, handleRTDBError);

    // 3. Operational Play Boundary
    this.rtdb.ref('agent_franks/boundary').on('value', (snapshot) => {
      const val = snapshot.val();
      this.boundary = (val && val.coords) ? val.coords : null;
      this.notifyBoundary();
    }, handleRTDBError);

    // 4. Tactical Landmarks / Safehouses
    this.rtdb.ref('agent_franks/landmarks').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.landmarks = Array.isArray(val) ? val : Object.values(val);
      } else {
        this.landmarks = [];
      }
      this.notifyLandmarks();
    }, handleRTDBError);

    // 5. Squad Comms Chat Messages
    this.rtdb.ref('agent_franks/chat').limitToLast(150).on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.messages = Object.keys(val)
          .map(key => ({ id: key, ...val[key] }))
          .sort((a, b) => a.timestamp - b.timestamp);
      } else {
        this.messages = [];
      }
      this.notifyMessages();
    }, handleRTDBError);

    // 6. Match State & Clock
    this.rtdb.ref('agent_franks/meta/match_state').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.matchState = val;
        this.notifyMatchState();
      }
    }, handleRTDBError);

    // 7. Captured Fugitive Lockouts
    this.rtdb.ref('agent_franks/lockouts').on('value', (snapshot) => {
      this.lockouts = snapshot.val() || {};
      this.notifyLockout();
    }, handleRTDBError);
  }

  listenFirestore() {
    if (!this.db) return;

    this.db.collection('agent_franks_pins').onSnapshot((snapshot) => {
      const remotePins = [];
      snapshot.forEach(doc => remotePins.push({ id: doc.id, ...doc.data() }));
      this.pins = remotePins;
      this.notifyPins();
    });

    this.db.collection('agent_franks_players').onSnapshot((snapshot) => {
      const remotePlayers = {};
      snapshot.forEach(doc => { remotePlayers[doc.id] = doc.data(); });
      this.players = remotePlayers;
      this.notifyPlayers();
    });
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Exclusively targets Firebase Realtime Database)
  // --------------------------------------------------------------------------

  async savePin(pinData) {
    const pin = {
      id: pinData.id || 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      seekerId: pinData.seekerId || 'seeker_1',
      cosmeticId: pinData.cosmeticId || 'cruiser',
      seekerName: pinData.seekerName || 'Patrol Cruiser',
      lat: Number(pinData.lat),
      lng: Number(pinData.lng),
      timestamp: pinData.timestamp || Date.now(),
      reportedByCodename: pinData.reportedByCodename || 'Agent',
      notes: pinData.notes || '',
      heading: pinData.heading !== undefined ? pinData.heading : null
    };

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins/' + pin.id).set(pin);
      } catch (err) {
        console.error('RTDB savePin error:', err);
        throw err;
      }
    } else {
      console.warn('TacticalSync: Cannot save pin - Firebase Realtime Database is not connected.');
    }

    return pin;
  }

  async deletePin(pinId) {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins/' + pinId).remove();
      } catch (err) {
        console.error('RTDB deletePin error:', err);
      }
    }
  }

  async resetAllPins() {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins').remove();
      } catch (err) {
        console.error('RTDB resetAllPins error:', err);
      }
    }
  }

  async updatePlayerGPS(playerData) {
    if (!playerData || !playerData.id) return;
    const player = {
      ...playerData,
      lastSeen: Date.now()
    };

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/players/' + playerData.id).set(player);
      } catch (e) {
        // Silent fail for transient GPS updates
      }
    }
  }

  async removePlayer(playerId) {
    if (!playerId) return;
    delete this.players[playerId];
    if (this.lockouts && this.lockouts[playerId]) {
      delete this.lockouts[playerId];
    }
    this.notifyPlayers();
    this.notifyLockout();

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/players/' + playerId).remove();
        await this.rtdb.ref('agent_franks/lockouts/' + playerId).remove();
        console.log(`TacticalSync: Purged player data for ${playerId}`);
      } catch (err) {
        console.error('RTDB removePlayer error:', err);
      }
    }
  }

  async clearAllPlayers() {
    this.players = {};
    this.notifyPlayers();

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/players').remove();
        console.log('TacticalSync: Cleared all players from database.');
      } catch (err) {
        console.error('RTDB clearAllPlayers error:', err);
      }
    }
  }

  async updateMatchState(newState) {
    this.matchState = { ...this.matchState, ...newState };
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/meta/match_state').set(this.matchState);
      } catch (e) {
        console.error('RTDB matchState update error:', e);
      }
    }
  }

  async updateBoundary(coords) {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/boundary').set({ coords: coords, updatedAt: Date.now() });
      } catch (e) {
        console.error('RTDB boundary update error:', e);
      }
    }
  }

  async resetBoundary() {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/boundary').remove();
      } catch (e) {
        console.error('RTDB boundary reset error:', e);
      }
    }
  }

  async addLandmark(landmark) {
    if (!landmark.id) {
      landmark.id = 'lm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    landmark.createdAt = Date.now();

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/landmarks/' + landmark.id).set(landmark);
      } catch (e) {
        console.error('RTDB addLandmark error:', e);
      }
    }
    return landmark;
  }

  async deleteLandmark(id) {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/landmarks/' + id).remove();
      } catch (e) {
        console.error('RTDB deleteLandmark error:', e);
      }
    }
  }

  async sendChatMessage(msgData) {
    const message = {
      id: msgData.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      text: (msgData.text || '').trim(),
      senderCodename: msgData.senderCodename || 'Fugitive',
      senderRealName: msgData.senderRealName || '',
      role: msgData.role || 'Fugitive',
      timestamp: msgData.timestamp || Date.now()
    };
    if (!message.text) return null;

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/chat/' + message.id).set(message);
      } catch (e) {
        console.warn('RTDB chat send error:', e);
      }
    }
    return message;
  }

  async clearChatMessages() {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/chat').remove();
      } catch (e) {
        console.warn('RTDB clearChat error:', e);
      }
    }
  }

  // --------------------------------------------------------------------------
  // CAPTURED FUGITIVE LOCKOUT METHODS
  // --------------------------------------------------------------------------

  async setPlayerLockout(playerId, locked, codename = '') {
    if (!playerId) return;
    if (this.isFirebaseReady && this.rtdb) {
      try {
        if (locked) {
          await this.rtdb.ref('agent_franks/lockouts/' + playerId).set({
            locked: true,
            codename: codename || 'Agent',
            updatedAt: Date.now()
          });
        } else {
          await this.rtdb.ref('agent_franks/lockouts/' + playerId).remove();
        }
      } catch (err) {
        console.error('RTDB setPlayerLockout error:', err);
      }
    }
  }

  async setGlobalLockout(locked) {
    if (this.isFirebaseReady && this.rtdb) {
      try {
        if (locked) {
          await this.rtdb.ref('agent_franks/lockouts/global').set({
            locked: true,
            updatedAt: Date.now()
          });
        } else {
          await this.rtdb.ref('agent_franks/lockouts/global').remove();
        }
      } catch (err) {
        console.error('RTDB setGlobalLockout error:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTION LISTENERS
  // --------------------------------------------------------------------------

  onPinsChanged(cb) {
    this.pinsListeners.push(cb);
    cb(this.pins);
  }

  onPlayersChanged(cb) {
    this.playersListeners.push(cb);
    cb(this.players);
  }

  onMatchStateChanged(cb) {
    this.matchStateListeners.push(cb);
    cb(this.matchState);
  }

  onBoundaryChanged(cb) {
    this.boundaryListeners.push(cb);
    if (this.boundary) cb(this.boundary);
  }

  onLandmarksChanged(cb) {
    this.landmarksListeners.push(cb);
    cb(this.landmarks);
  }

  onMessagesChanged(cb) {
    this.messagesListeners.push(cb);
    cb(this.messages);
  }

  notifyPins() {
    this.pinsListeners.forEach(cb => cb(this.pins));
  }

  notifyPlayers() {
    this.playersListeners.forEach(cb => cb(this.players));
  }

  notifyMatchState() {
    this.matchStateListeners.forEach(cb => cb(this.matchState));
  }

  notifyBoundary() {
    this.boundaryListeners.forEach(cb => cb(this.boundary));
  }

  notifyLandmarks() {
    this.landmarksListeners.forEach(cb => cb(this.landmarks));
  }

  notifyMessages(newMsg = null) {
    this.messagesListeners.forEach(cb => cb(this.messages, newMsg));
  }

  onLockoutChanged(cb) {
    this.lockoutListeners.push(cb);
    cb(this.lockouts);
  }

  notifyLockout() {
    this.lockoutListeners.forEach(cb => cb(this.lockouts));
  }
}

window.tacticalSync = new TacticalSync();
