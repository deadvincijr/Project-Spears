/**
 * Live GPS Location Tracker & Team Sharing
 */

class GPSTracker {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.isTracking = false;
    this.isSharingWithTeam = true; // Auto-share with team by default
    this.userMarker = null;
    this.accuracyCircle = null;
    this.teammateMarkers = {};

    this.onPositionUpdateCallbacks = [];
  }

  startTracking(map, onUpdate) {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return false;
    }

    if (onUpdate) {
      this.onPositionUpdateCallbacks.push(onUpdate);
    }

    this.isTracking = true;

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 3000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleSuccess(pos, map),
      (err) => this.handleError(err),
      options
    );

    return true;
  }

  stopTracking(map) {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    if (this.userMarker && map) {
      map.removeLayer(this.userMarker);
      this.userMarker = null;
    }
    if (this.accuracyCircle && map) {
      map.removeLayer(this.accuracyCircle);
      this.accuracyCircle = null;
    }
  }

  setSharing(enable) {
    this.isSharingWithTeam = enable;
    if (enable && this.currentPosition) {
      this.broadcastLocation();
    }
  }

  handleSuccess(pos, map) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;
    const heading = pos.coords.heading;
    const speed = pos.coords.speed;

    this.currentPosition = { lat, lng, accuracy, heading, speed, timestamp: Date.now() };

    this.updateUserMarker(map, lat, lng, accuracy, heading);

    if (this.isSharingWithTeam) {
      this.broadcastLocation();
    }

    this.onPositionUpdateCallbacks.forEach(cb => cb(this.currentPosition));
  }

  handleError(err) {
    console.warn('GPS tracking error:', err.message);
  }

  broadcastLocation() {
    if (!this.currentPosition || !window.tacticalSync) return;

    const codename = localStorage.getItem('agentFranks_codename') || 'Agent';
    const role = localStorage.getItem('agentFranks_role') || 'fugitive';
    const playerId = localStorage.getItem('agentFranks_playerId') || 'p_' + Math.random().toString(36).substr(2, 6);

    window.tacticalSync.updatePlayerGPS({
      id: playerId,
      codename: codename,
      role: role,
      lat: this.currentPosition.lat,
      lng: this.currentPosition.lng,
      heading: this.currentPosition.heading,
      speed: this.currentPosition.speed,
      timestamp: Date.now()
    });
  }

  updateUserMarker(map, lat, lng, accuracy, heading) {
    if (!map) return;

    const rotStyle = heading !== null && heading !== undefined ? `transform: rotate(${heading}deg);` : '';

    const iconHtml = `
      <div class="user-gps-beacon">
        <div class="gps-pulse"></div>
        <div class="gps-center-dot" style="${rotStyle}">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <polygon points="12,2 20,20 12,16 4,20" fill="#00e5ff" stroke="#060c18" stroke-width="1.5" />
          </svg>
        </div>
        <div class="gps-tag">YOU (${localStorage.getItem('agentFranks_codename') || 'Agent'})</div>
      </div>
    `;

    const gpsIcon = L.divIcon({
      className: 'user-gps-icon',
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!this.userMarker) {
      this.userMarker = L.marker([lat, lng], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      this.userMarker.setLatLng([lat, lng]);
      this.userMarker.setIcon(gpsIcon);
    }

    // Accuracy circle
    if (!this.accuracyCircle) {
      this.accuracyCircle = L.circle([lat, lng], {
        radius: accuracy || 15,
        color: '#00e5ff',
        weight: 1,
        fillColor: '#00e5ff',
        fillOpacity: 0.12,
        interactive: false
      }).addTo(map);
    } else {
      this.accuracyCircle.setLatLng([lat, lng]);
      this.accuracyCircle.setRadius(accuracy || 15);
    }
  }

  /**
   * Renders other teammates' GPS beacons on the map
   */
  renderTeammates(map, players) {
    if (!map || !players) return;
    const currentMyId = localStorage.getItem('agentFranks_playerId');

    // Remove stale or deleted markers
    Object.keys(this.teammateMarkers).forEach(pId => {
      if (!players[pId] || pId === currentMyId || (Date.now() - players[pId].timestamp > 120000)) {
        map.removeLayer(this.teammateMarkers[pId]);
        delete this.teammateMarkers[pId];
      }
    });

    // Render active teammates
    Object.keys(players).forEach(pId => {
      if (pId === currentMyId) return;
      const player = players[pId];
      // Skip if older than 2 minutes
      if (Date.now() - player.timestamp > 120000) return;

      const isSeeker = player.role === 'seeker';
      const color = isSeeker ? '#ff1744' : '#00e676';
      const resolvedName = window.seekerManager ? window.seekerManager.getDisplayName(player.codename) : player.codename;

      const iconHtml = `
        <div class="teammate-gps-beacon" style="--team-color: ${color};">
          <div class="teammate-dot"></div>
          <div class="teammate-label">${resolvedName} [${player.role ? player.role.toUpperCase() : 'AGENT'}]</div>
        </div>
      `;

      const teammateIcon = L.divIcon({
        className: 'teammate-div-icon',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      if (!this.teammateMarkers[pId]) {
        this.teammateMarkers[pId] = L.marker([player.lat, player.lng], { icon: teammateIcon }).addTo(map);
      } else {
        this.teammateMarkers[pId].setLatLng([player.lat, player.lng]);
        this.teammateMarkers[pId].setIcon(teammateIcon);
      }
    });
  }

  centerOnUser(map) {
    if (this.currentPosition && map) {
      map.setView([this.currentPosition.lat, this.currentPosition.lng], 16, { animate: true });
      return true;
    }
    return false;
  }
}

window.gpsTracker = new GPSTracker();
