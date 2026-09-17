/**
 * Admin Panel & Match Operations Controller
 */

class AdminEngine {
  constructor() {
    this.adminPin = localStorage.getItem('agentFranks_adminPin') || '1234';
    this.isAdminUnlocked = localStorage.getItem('agentFranks_isAdmin') === 'true';
    this.simInterval = null;
    this.isSimulating = false;

    // Pre-defined street patrol waypoints in West Kaysville for the test simulator
    this.simulatedSeekers = [
      {
        seekerId: 'sim_cruiser',
        cosmeticId: 'cruiser',
        seekerName: 'Patrol Cruiser',
        path: [
          { lat: 41.0410, lng: -111.9580, heading: 90, note: 'Patrolling 200 N near Barnes Park' },
          { lat: 41.0405, lng: -111.9515, heading: 140, note: 'Turning south onto Flint St' },
          { lat: 41.0345, lng: -111.9480, heading: 180, note: 'Cruising south past Boondocks junction' },
          { lat: 41.0280, lng: -111.9520, heading: 220, note: 'Approaching Smith Lane corridor' },
          { lat: 41.0240, lng: -111.9575, heading: 200, note: 'Patrolling Snow Horse Elementary bus loop' },
          { lat: 41.0195, lng: -111.9560, heading: 190, note: 'Cruising past Pioneer Park entrance' },
          { lat: 41.0168, lng: -111.9545, heading: 180, note: 'Circling Jefferson Academy perimeter' }
        ],
        step: 0
      },
      {
        seekerId: 'sim_suv',
        cosmeticId: 'suv',
        seekerName: 'Stealth SUV',
        path: [
          { lat: 41.0180, lng: -111.9440, heading: 320, note: 'Spotted near I-15 soundwall frontage' },
          { lat: 41.0210, lng: -111.9500, heading: 300, note: 'Moving northwest along Angel St' },
          { lat: 41.0238, lng: -111.9575, heading: 310, note: 'Idling at Snow Horse west parking lot' },
          { lat: 41.0320, lng: -111.9600, heading: 330, note: 'Headlights off scanning walking trail' },
          { lat: 41.0410, lng: -111.9605, heading: 0, note: 'Stationary at Barnes Park South Lot' }
        ],
        step: 0
      }
    ];
  }

  unlockAdmin(pin) {
    if (pin === this.adminPin || pin === 'agentfranks') {
      this.isAdminUnlocked = true;
      localStorage.setItem('agentFranks_isAdmin', 'true');
      return true;
    }
    return false;
  }

  lockAdmin() {
    this.isAdminUnlocked = false;
    localStorage.removeItem('agentFranks_isAdmin');
  }

  setAdminPin(newPin) {
    if (newPin && newPin.length >= 4) {
      this.adminPin = newPin;
      localStorage.setItem('agentFranks_adminPin', newPin);
      return true;
    }
    return false;
  }

  async resetAllPins() {
    if (window.tacticalSync) {
      await window.tacticalSync.resetAllPins();
      if (window.tacticalAudio) {
        window.tacticalAudio.playClick();
      }
    }
  }

  async clearOldPins(minutes = 20) {
    if (!window.tacticalSync) return;
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const pins = window.tacticalSync.pins || [];
    const pinsToDelete = pins.filter(p => p.timestamp < cutoff);
    
    for (const p of pinsToDelete) {
      await window.tacticalSync.deletePin(p.id);
    }
  }

  startMatchTimer(durationMinutes = 60) {
    if (window.tacticalSync) {
      window.tacticalSync.updateMatchState({
        startTime: Date.now(),
        durationMinutes: durationMinutes,
        status: 'active'
      });
    }
  }

  stopMatchTimer() {
    if (window.tacticalSync) {
      window.tacticalSync.updateMatchState({
        status: 'stopped'
      });
    }
  }

  resetMatchTimer() {
    if (window.tacticalSync) {
      window.tacticalSync.updateMatchState({
        startTime: null,
        status: 'pending'
      });
    }
  }

  /**
   * Autonomous Seeker Patrol Simulator
   * Simulates real-time seeker patrol movement through West Kaysville
   */
  toggleSimulation() {
    if (this.isSimulating) {
      this.stopSimulation();
      return false;
    } else {
      this.startSimulation();
      return true;
    }
  }

  startSimulation() {
    if (this.isSimulating) return;
    this.isSimulating = true;

    // Drop initial sightings
    this.simulatedSeekers.forEach(s => {
      this.dropSimulatedPing(s);
    });

    // Advance step every 20 seconds
    this.simInterval = setInterval(() => {
      this.simulatedSeekers.forEach(s => {
        s.step = (s.step + 1) % s.path.length;
        this.dropSimulatedPing(s);
      });
    }, 20000);
  }

  stopSimulation() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.isSimulating = false;
  }

  dropSimulatedPing(seeker) {
    const point = seeker.path[seeker.step];
    // Add minor jitter so repeats look natural
    const jitterLat = (Math.random() - 0.5) * 0.0003;
    const jitterLng = (Math.random() - 0.5) * 0.0003;

    if (window.tacticalSync) {
      window.tacticalSync.savePin({
        seekerId: seeker.seekerId,
        cosmeticId: seeker.cosmeticId,
        seekerName: seeker.seekerName,
        lat: point.lat + jitterLat,
        lng: point.lng + jitterLng,
        heading: point.heading,
        notes: `[PATROL SIMULATION] ${point.note}`,
        reportedByCodename: 'Overwatch_HQ'
      });

      if (window.tacticalAudio) {
        window.tacticalAudio.playSightingAlert();
      }
    }
  }

  exportMatchData() {
    const data = {
      pins: window.tacticalSync ? window.tacticalSync.pins : [],
      matchState: window.tacticalSync ? window.tacticalSync.matchState : {},
      exportedAt: new Date().toISOString(),
      mapZone: 'West Kaysville: Jefferson Academy to Barnes Park'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fugitive_match_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importMatchData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.pins)) {
        data.pins.forEach(pin => {
          window.tacticalSync.savePin(pin);
        });
      }
      if (data.matchState) {
        window.tacticalSync.updateMatchState(data.matchState);
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

window.adminEngine = new AdminEngine();
