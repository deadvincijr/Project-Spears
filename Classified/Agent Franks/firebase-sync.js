/**
 * Firebase Realtime Sync + LocalStorage / BroadcastChannel Fallback
 * Works out-of-the-box offline/locally, and syncs over Firebase cloud when configured.
 */

class TacticalSync {
  constructor() {
    this.firebaseApp = null;
    this.db = null;
    this.isFirebaseReady = false;
    this.broadcastChannel = null;
    
    this.pinsListeners = [];
    this.playersListeners = [];
    this.matchStateListeners = [];
    this.cosmeticsListeners = [];
    this.boundaryListeners = [];
    this.landmarksListeners = [];
    this.messagesListeners = [];

    // Local in-memory caches
    this.pins = [];
    this.players = {};
    this.boundary = null;
    this.landmarks = [];
    this.messages = [];
    this.matchState = {
      startTime: null,
      durationMinutes: 60,
      status: 'active'
    };

    if (window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('agent_franks_radar_channel');
        this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event.data);
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked:', e);
      }
    }

    this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    try {
      const savedPins = localStorage.getItem('agentFranks_pins');
      if (savedPins) {
        const parsed = JSON.parse(savedPins);
        // Remove any old seed pins
        this.pins = Array.isArray(parsed) ? parsed.filter(p => p.reporter !== 'HQ Dispatch') : [];
      }
      const savedMatch = localStorage.getItem('agentFranks_match');
      if (savedMatch) {
        this.matchState = JSON.parse(savedMatch);
      }
      const savedBoundary = localStorage.getItem('agentFranks_custom_boundary');
      if (savedBoundary) {
        this.boundary = JSON.parse(savedBoundary);
      }
      const savedLandmarks = localStorage.getItem('agentFranks_landmarks');
      if (savedLandmarks) {
        this.landmarks = JSON.parse(savedLandmarks);
      }
      const savedMessages = localStorage.getItem('agentFranks_chat_messages');
      if (savedMessages) {
        this.messages = JSON.parse(savedMessages) || [];
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('agentFranks_pins', JSON.stringify(this.pins));
      localStorage.setItem('agentFranks_match', JSON.stringify(this.matchState));
      localStorage.setItem('agentFranks_landmarks', JSON.stringify(this.landmarks));
      localStorage.setItem('agentFranks_chat_messages', JSON.stringify(this.messages));
      if (this.boundary) {
        localStorage.setItem('agentFranks_custom_boundary', JSON.stringify(this.boundary));
      } else {
        localStorage.removeItem('agentFranks_custom_boundary');
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  getFirebaseConfig() {
    try {
      const cfg = localStorage.getItem('agentFranks_firebase_config');
      return cfg ? JSON.parse(cfg) : null;
    } catch (e) {
      return null;
    }
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

  async initFirebase() {
    const config = this.getFirebaseConfig();
    if (!config || !config.apiKey || !window.firebase) {
      this.isFirebaseReady = false;
      this.notifyPins();
      return false;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) {
        this.firebaseApp = firebase.initializeApp(config);
      } else {
        this.firebaseApp = firebase.app();
      }

      // Firestore or Realtime DB
      if (firebase.firestore) {
        this.db = firebase.firestore();
        this.isFirebaseReady = true;
        this.listenFirestore();
      } else if (firebase.database) {
        this.rtdb = firebase.database();
        this.isFirebaseReady = true;
        this.listenRTDB();
      }
      console.log('TacticalSync: Firebase initialized successfully');
      return true;
    } catch (err) {
      console.warn('TacticalSync: Firebase initialization error, falling back to local/broadcast:', err);
      this.isFirebaseReady = false;
      return false;
    }
  }

  listenFirestore() {
    if (!this.db) return;

    // Listen to pins collection
    this.db.collection('agent_franks_pins')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        const remotePins = [];
        snapshot.forEach((doc) => {
          remotePins.push({ id: doc.id, ...doc.data() });
        });
        this.pins = remotePins;
        this.saveToLocalStorage();
        this.notifyPins();
      }, (err) => {
        console.warn('Firestore pins subscription error:', err);
      });

    // Listen to match state
    this.db.collection('agent_franks_meta').doc('match_state')
      .onSnapshot((doc) => {
        if (doc.exists) {
          this.matchState = doc.data();
          this.saveToLocalStorage();
          this.notifyMatchState();
        }
      }, (err) => {
        console.warn('Firestore match_state error:', err);
      });

    // Listen to boundary definition
    this.db.collection('agent_franks_meta').doc('boundary')
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data && data.coords) {
            this.boundary = data.coords;
            this.saveToLocalStorage();
            this.notifyBoundary();
          }
        }
      }, (err) => {
        console.warn('Firestore boundary error:', err);
      });

    // Listen to custom location / landmark pins
    this.db.collection('agent_franks_meta').doc('landmarks')
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data && data.list) {
            this.landmarks = data.list;
            this.saveToLocalStorage();
            this.notifyLandmarks();
          }
        }
      }, (err) => {
        console.warn('Firestore landmarks error:', err);
      });

    // Listen to live player locations
    this.db.collection('agent_franks_players')
      .onSnapshot((snapshot) => {
        const remotePlayers = {};
        snapshot.forEach((doc) => {
          remotePlayers[doc.id] = doc.data();
        });
        this.players = remotePlayers;
        this.notifyPlayers();
      }, (err) => {
        console.warn('Firestore players error:', err);
      });

    // Listen to fugitive comms chat messages
    this.db.collection('agent_franks_chat')
      .orderBy('timestamp', 'asc')
      .limitToLast(150)
      .onSnapshot((snapshot) => {
        const remoteMessages = [];
        snapshot.forEach((doc) => {
          remoteMessages.push({ id: doc.id, ...doc.data() });
        });
        this.messages = remoteMessages;
        this.saveToLocalStorage();
        this.notifyMessages();
      }, (err) => {
        console.warn('Firestore chat error:', err);
      });
  }

  listenRTDB() {
    if (!this.rtdb) return;

    this.rtdb.ref('agent_franks/pins').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.pins = Object.keys(val).map(key => ({ id: key, ...val[key] }));
      } else {
        this.pins = [];
      }
      this.saveToLocalStorage();
      this.notifyPins();
    });

    this.rtdb.ref('agent_franks/players').on('value', (snapshot) => {
      this.players = snapshot.val() || {};
      this.notifyPlayers();
    });

    this.rtdb.ref('agent_franks/boundary').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val && val.coords) {
        this.boundary = val.coords;
        this.saveToLocalStorage();
        this.notifyBoundary();
      }
    });

    this.rtdb.ref('agent_franks/landmarks').on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.landmarks = Array.isArray(val) ? val : Object.values(val);
        this.saveToLocalStorage();
        this.notifyLandmarks();
      }
    });

    this.rtdb.ref('agent_franks/chat').limitToLast(150).on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        this.messages = Object.keys(val).map(key => ({ id: key, ...val[key] })).sort((a, b) => a.timestamp - b.timestamp);
      } else {
        this.messages = [];
      }
      this.saveToLocalStorage();
      this.notifyMessages();
    });
  }

  handleBroadcastMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'NEW_CHAT_MESSAGE':
        if (!this.messages.some(m => m.id === msg.message.id)) {
          this.messages.push(msg.message);
          this.saveToLocalStorage();
          this.notifyMessages(msg.message);
        }
        break;
      case 'CLEAR_CHAT_MESSAGES':
        this.messages = [];
        this.saveToLocalStorage();
        this.notifyMessages();
        break;
      case 'LANDMARKS_UPDATE':
        this.landmarks = msg.landmarks || [];
        this.saveToLocalStorage();
        this.notifyLandmarks();
        break;
      case 'BOUNDARY_UPDATE':
        this.boundary = msg.boundary;
        this.saveToLocalStorage();
        this.notifyBoundary();
        break;
      case 'NEW_PIN':
        if (!this.pins.some(p => p.id === msg.pin.id)) {
          this.pins.push(msg.pin);
          this.saveToLocalStorage();
          this.notifyPins();
        }
        break;
      case 'DELETE_PIN':
        this.pins = this.pins.filter(p => p.id !== msg.pinId);
        this.saveToLocalStorage();
        this.notifyPins();
        break;
      case 'RESET_PINS':
        this.pins = [];
        this.saveToLocalStorage();
        this.notifyPins();
        break;
      case 'GPS_UPDATE':
        this.players[msg.player.id] = msg.player;
        this.notifyPlayers();
        break;
      case 'MATCH_UPDATE':
        this.matchState = msg.matchState;
        this.saveToLocalStorage();
        this.notifyMatchState();
        break;
    }
  }

  broadcast(msg) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('Broadcast send error:', e);
      }
    }
  }

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

    // Add locally first
    this.pins.push(pin);
    this.saveToLocalStorage();
    this.notifyPins();
    this.broadcast({ type: 'NEW_PIN', pin });

    // Sync to Firestore if ready
    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_pins').doc(pin.id).set(pin);
      } catch (err) {
        console.error('Firebase savePin failed:', err);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins/' + pin.id).set(pin);
      } catch (err) {
        console.error('RTDB savePin failed:', err);
      }
    }

    return pin;
  }

  async deletePin(pinId) {
    this.pins = this.pins.filter(p => p.id !== pinId);
    this.saveToLocalStorage();
    this.notifyPins();
    this.broadcast({ type: 'DELETE_PIN', pinId });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_pins').doc(pinId).delete();
      } catch (err) {
        console.error('Firebase deletePin failed:', err);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins/' + pinId).remove();
      } catch (err) {
        console.error('RTDB deletePin failed:', err);
      }
    }
  }

  async resetAllPins() {
    this.pins = [];
    this.saveToLocalStorage();
    this.notifyPins();
    this.broadcast({ type: 'RESET_PINS' });

    if (this.isFirebaseReady && this.db) {
      try {
        const batch = this.db.batch();
        const snap = await this.db.collection('agent_franks_pins').get();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.error('Firebase resetAllPins failed:', err);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/pins').remove();
      } catch (err) {
        console.error('RTDB resetAllPins failed:', err);
      }
    }
  }

  async updatePlayerGPS(playerData) {
    if (!playerData || !playerData.id) return;
    this.players[playerData.id] = {
      ...playerData,
      lastSeen: Date.now()
    };
    this.notifyPlayers();
    this.broadcast({ type: 'GPS_UPDATE', player: this.players[playerData.id] });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_players').doc(playerData.id).set(this.players[playerData.id]);
      } catch (e) {
        // silent fail for transient GPS updates
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/players/' + playerData.id).set(this.players[playerData.id]);
      } catch (e) {
        // silent fail
      }
    }
  }

  async updateMatchState(newState) {
    this.matchState = { ...this.matchState, ...newState };
    this.saveToLocalStorage();
    this.notifyMatchState();
    this.broadcast({ type: 'MATCH_UPDATE', matchState: this.matchState });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_meta').doc('match_state').set(this.matchState);
      } catch (e) {
        console.error('Firebase matchState update failed:', e);
      }
    }
  }

  async updateBoundary(coords) {
    this.boundary = coords;
    this.saveToLocalStorage();
    this.notifyBoundary();
    this.broadcast({ type: 'BOUNDARY_UPDATE', boundary: coords });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_meta').doc('boundary').set({ coords: coords, updatedAt: Date.now() });
      } catch (e) {
        console.error('Firebase boundary update failed:', e);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/boundary').set({ coords: coords, updatedAt: Date.now() });
      } catch (e) {
        console.error('RTDB boundary update failed:', e);
      }
    }
  }

  async resetBoundary() {
    this.boundary = null;
    this.saveToLocalStorage();
    this.notifyBoundary();
    this.broadcast({ type: 'BOUNDARY_UPDATE', boundary: null });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_meta').doc('boundary').delete();
      } catch (e) {
        console.error('Firebase boundary reset failed:', e);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/boundary').remove();
      } catch (e) {
        console.error('RTDB boundary reset failed:', e);
      }
    }
  }

  async addLandmark(landmark) {
    if (!landmark.id) {
      landmark.id = 'lm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    landmark.createdAt = Date.now();
    this.landmarks.push(landmark);
    this.saveToLocalStorage();
    this.notifyLandmarks();
    this.broadcast({ type: 'LANDMARKS_UPDATE', landmarks: this.landmarks });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_meta').doc('landmarks').set({
          list: this.landmarks,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.error('Failed to sync landmark to Firestore:', e);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/landmarks').set(this.landmarks);
      } catch (e) {
        console.error('Failed to sync landmark to RTDB:', e);
      }
    }

    return landmark;
  }

  async deleteLandmark(id) {
    this.landmarks = this.landmarks.filter(l => l.id !== id);
    this.saveToLocalStorage();
    this.notifyLandmarks();
    this.broadcast({ type: 'LANDMARKS_UPDATE', landmarks: this.landmarks });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_meta').doc('landmarks').set({
          list: this.landmarks,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.error('Failed to sync deleted landmark to Firestore:', e);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/landmarks').set(this.landmarks);
      } catch (e) {
        console.error('Failed to sync deleted landmark to RTDB:', e);
      }
    }
  }

  onLandmarksChanged(cb) {
    this.landmarksListeners.push(cb);
    cb(this.landmarks);
  }

  notifyLandmarks() {
    this.landmarksListeners.forEach(cb => cb(this.landmarks));
  }

  onBoundaryChanged(cb) {
    this.boundaryListeners.push(cb);
    if (this.boundary) cb(this.boundary);
  }

  notifyBoundary() {
    this.boundaryListeners.forEach(cb => cb(this.boundary));
  }

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

  notifyPins() {
    this.pinsListeners.forEach(cb => cb(this.pins));
  }

  notifyPlayers() {
    this.playersListeners.forEach(cb => cb(this.players));
  }

  notifyMatchState() {
    this.matchStateListeners.forEach(cb => cb(this.matchState));
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

    // Add locally
    if (!this.messages.some(m => m.id === message.id)) {
      this.messages.push(message);
    }
    this.saveToLocalStorage();
    this.notifyMessages(message);
    this.broadcast({ type: 'NEW_CHAT_MESSAGE', message });

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('agent_franks_chat').doc(message.id).set(message);
      } catch (e) {
        console.warn('Firestore chat send error:', e);
      }
    } else if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/chat/' + message.id).set(message);
      } catch (e) {
        console.warn('RTDB chat send error:', e);
      }
    }

    return message;
  }

  async clearChatMessages() {
    this.messages = [];
    this.saveToLocalStorage();
    this.notifyMessages();
    this.broadcast({ type: 'CLEAR_CHAT_MESSAGES' });

    if (this.isFirebaseReady && this.rtdb) {
      try {
        await this.rtdb.ref('agent_franks/chat').remove();
      } catch (e) {
        console.warn('RTDB clear chat error:', e);
      }
    }
  }

  onMessagesChanged(cb) {
    this.messagesListeners.push(cb);
    cb(this.messages);
  }

  notifyMessages(newMessage = null) {
    this.messagesListeners.forEach(cb => cb(this.messages, newMessage));
  }
}

window.tacticalSync = new TacticalSync();
