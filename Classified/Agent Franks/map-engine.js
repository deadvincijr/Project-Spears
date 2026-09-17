/**
 * Leaflet Map Engine for West Kaysville Fugitive Game
 * Implements bounded play zone, fade-to-black mask, multi-source tiles, and landmark HUD.
 */

// Dynamic landmarks inside the game zone - default empty so user places them manually
window.LANDMARKS = [];

// West Kaysville Playable Boundary Polygon:
// Strictly bounded by Jefferson Academy (S), Barnes Park (N), Davis Corridor / SR-177 (W), and I-15 (E)
const PLAY_ZONE_COORDS = [
  [41.0465, -111.9760], // NW corner (200 N & West Davis Corridor)
  [41.0465, -111.9550], // N boundary (200 N past Barnes Park)
  [41.0450, -111.9320], // NE corner (200 N & I-15 junction)
  [41.0370, -111.9340], // E edge along I-15
  [41.0335, -111.9355], // E edge near Boondocks
  [41.0250, -111.9400], // SE perimeter along I-15 corridor
  [41.0170, -111.9440], // SE boundary
  [41.0120, -111.9510], // S junction
  [41.0130, -111.9580], // S boundary below Jefferson Academy
  [41.0170, -111.9600], // SW corner (Angel St & SR-177)
  [41.0250, -111.9680], // W perimeter (Davis Corridor)
  [41.0360, -111.9750], // W perimeter (Davis Corridor)
  [41.0465, -111.9760]  // NW close
];

// World coordinates outer bounding box for the inverted mask - valid Mercator limits
const WORLD_MASK_COORDS = [
  [-85.0511, -179.9999],
  [-85.0511, 179.9999],
  [85.0511, 179.9999],
  [85.0511, -179.9999]
];

class MapEngine {
  constructor() {
    this.map = null;
    this.currentTileLayer = null;
    this.tileLayers = {};
    this.activeLayerKey = 'satellite';
    this.rotationBearing = 0;
    this.pinDropCallback = null;
    this.isPinDropMode = false;
    this.selectedCosmeticForDrop = null;
    this.boundaryLayer = null;
    this.maskLayer = null;
    this.activeBoundaryCoords = PLAY_ZONE_COORDS;

    // Destination target & live preview markers
    this.destinationMarker = null;
    this.previewMarkerLayer = null;

    // Right-click orientation drag state
    this.isRightClickDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartBearing = 0;

    // Custom Boundary Drawing state
    this.isDrawingBoundary = false;
    this.drawnPoints = [];
    this.drawnMarkers = [];
    this.drawnPolyline = null;
    this.drawingLayerGroup = null;
    this.onPointAddedCallback = null;
    this.onLoopClosedCallback = null;
  }

  initMap(containerId, onMapClick) {
    this.containerId = containerId;
    // Initial center: Snow Horse Elementary / West Kaysville center
    const center = [41.0300, -111.9550];

    // Max bounds with viscosity 1.0 so user cannot scroll far outside West Kaysville
    const bounds = L.latLngBounds(
      [41.0050, -111.9950], // SW
      [41.0550, -111.9150]  // NE
    );

    this.map = L.map(containerId, {
      center: center,
      zoom: 14.5,
      minZoom: 14.2,
      maxZoom: 19,
      zoomSnap: 0.25,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      renderer: L.svg({ padding: 3.0 }),
      zoomControl: false, // Custom styled zoom controls
      attributionControl: false
    });

    // Add scale indicator
    L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(this.map);

    this.initTileLayers();
    this.applyFadeToBlackMask();
    this.renderLandmarks();
    this.setupMapEvents(onMapClick);
    this.setupRightClickOrientationControl();

    // Keep rotation center aligned with window center on resize
    window.addEventListener('resize', () => {
      const container = document.querySelector('.leaflet-map-pane');
      if (container) {
        container.style.transformOrigin = `${window.innerWidth / 2}px ${window.innerHeight / 2}px`;
      }
    });

    // Initial fit to game zone
    const zoneBounds = L.latLngBounds(PLAY_ZONE_COORDS);
    this.map.fitBounds(zoneBounds, { padding: [20, 20] });

    return this.map;
  }

  initTileLayers() {
    // 1. Satellite Hybrid (Esri World Imagery + CartoDB Labels)
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, maxNativeZoom: 18, keepBuffer: 10 }
    );
    const labelsLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, keepBuffer: 10 }
    );
    this.tileLayers['satellite'] = L.layerGroup([esriSatellite, labelsLayer]);

    // 2. Dark Tactical (CartoDB Dark Matter)
    this.tileLayers['dark'] = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, keepBuffer: 10 }
    );

    // 3. Street Map (OpenStreetMap)
    this.tileLayers['streets'] = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, keepBuffer: 10 }
    );

    // Set default layer
    this.setLayer('satellite');
  }

  setLayer(layerKey) {
    if (!this.tileLayers[layerKey]) return;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = this.tileLayers[layerKey];
    this.map.addLayer(this.currentTileLayer);
    this.activeLayerKey = layerKey;

    // Ensure the mask stays on top of tiles
    if (this.maskLayer) {
      this.maskLayer.bringToFront();
    }
    if (this.boundaryLayer) {
      this.boundaryLayer.bringToFront();
    }
  }

  /**
   * Applies the "Fade to Black" inverted polygon mask
   * Shrouds everything outside the active game zone in black.
   */
  applyFadeToBlackMask(customCoords = null) {
    if (customCoords && Array.isArray(customCoords) && customCoords.length >= 3) {
      this.activeBoundaryCoords = customCoords;
    } else if (!this.activeBoundaryCoords) {
      this.activeBoundaryCoords = PLAY_ZONE_COORDS;
    }

    if (this.maskLayer) {
      this.map.removeLayer(this.maskLayer);
    }
    if (this.boundaryLayer) {
      this.map.removeLayer(this.boundaryLayer);
    }

    const invertedGeoJson = [WORLD_MASK_COORDS, this.activeBoundaryCoords];

    this.maskLayer = L.polygon(invertedGeoJson, {
      color: 'transparent',
      fillColor: '#05070e',
      fillOpacity: 1.0,
      interactive: false,
      renderer: L.svg({ padding: 3.0 }),
      pane: 'overlayPane'
    }).addTo(this.map);

    this.boundaryLayer = L.polygon(this.activeBoundaryCoords, {
      color: '#00e5ff',
      weight: 2.5,
      dashArray: '6, 8',
      fill: false,
      interactive: false,
      className: 'tactical-zone-boundary'
    }).addTo(this.map);
  }

  renderLandmarks(landmarks) {
    if (!this.landmarkLayerGroup) {
      this.landmarkLayerGroup = L.layerGroup().addTo(this.map);
    } else {
      this.landmarkLayerGroup.clearLayers();
    }

    const items = landmarks || (window.tacticalSync ? window.tacticalSync.landmarks : []);
    if (!items || !items.length) return;

    items.forEach(lm => {
      const isFinish = lm.type === 'objective';
      const isStart = lm.type === 'start';
      const isHazard = lm.type === 'hazard';
      const color = isFinish ? '#00e676' : (isStart ? '#ff9100' : (isHazard ? '#ff1744' : '#00e5ff'));

      const iconHtml = `
        <div class="landmark-tag-container" style="--lm-color: ${color};">
          <div class="landmark-radar-dot"></div>
          <div class="landmark-name-badge">
            <span class="lm-badge-type">${lm.badge || 'LANDMARK'}</span>
            <span class="lm-badge-name">${lm.name}</span>
          </div>
        </div>
      `;

      const lmIcon = L.divIcon({
        className: 'landmark-div-icon',
        html: iconHtml,
        iconSize: [130, 38],
        iconAnchor: [65, 19]
      });

      const marker = L.marker([lm.lat, lm.lng], {
        icon: lmIcon,
        interactive: true,
        zIndexOffset: 50
      });

      marker.bindPopup(`
        <div class="tactical-popup">
          <div class="popup-header" style="color: ${color};">${lm.badge || 'LOCATION'}: ${lm.name}</div>
          <div class="popup-body">${lm.description || 'Custom tactical location.'}</div>
          <div class="popup-subtext">Coordinates: ${lm.lat.toFixed(5)}, ${lm.lng.toFixed(5)}</div>
        </div>
      `, { className: 'tactical-leaflet-popup' });

      this.landmarkLayerGroup.addLayer(marker);
    });
  }

  setupMapEvents(onMapClick) {
    this.map.on('click', (e) => {
      if (this.isDrawingBoundary) {
        this.handleBoundaryDrawClick(e.latlng);
      } else if (this.isPlacingLandmark) {
        const lm = {
          ...this.pendingLandmarkData,
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5))
        };
        const cb = this.onLandmarkPlacedCallback;
        this.cancelLandmarkPlacement();
        if (cb) cb(lm);
      } else if (this.isPinDropMode) {
        if (this.pinDropCallback) {
          this.pinDropCallback(e.latlng, this.selectedCosmeticForDrop);
        }
        this.disablePinDropMode();
      } else if (onMapClick) {
        onMapClick(e.latlng);
      }
    });
  }

  startLandmarkPlacement(landmarkData, onPlaced) {
    this.isPlacingLandmark = true;
    this.pendingLandmarkData = landmarkData;
    this.onLandmarkPlacedCallback = onPlaced;
    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.add('boundary-draw-active');
  }

  cancelLandmarkPlacement() {
    this.isPlacingLandmark = false;
    this.pendingLandmarkData = null;
    this.onLandmarkPlacedCallback = null;
    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.remove('boundary-draw-active');
  }

  startBoundaryDrawing(onPointAdded, onLoopClosed) {
    this.isDrawingBoundary = true;
    this.drawnPoints = [];
    this.drawnMarkers = [];
    this.onPointAddedCallback = onPointAdded;
    this.onLoopClosedCallback = onLoopClosed;

    // Remove existing mask and boundary dashed lines while drawing so there is NO displayed boundary or black space
    if (this.maskLayer) {
      this.map.removeLayer(this.maskLayer);
      this.maskLayer = null;
    }
    if (this.boundaryLayer) {
      this.map.removeLayer(this.boundaryLayer);
      this.boundaryLayer = null;
    }

    // Temporarily unconstrain maxBounds so admin can pan freely everywhere
    this.map.setMaxBounds(null);

    if (this.drawingLayerGroup) {
      this.drawingLayerGroup.clearLayers();
    } else {
      this.drawingLayerGroup = L.layerGroup().addTo(this.map);
    }

    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.add('boundary-draw-active');
  }

  handleBoundaryDrawClick(latlng) {
    const pt = [Number(latlng.lat.toFixed(5)), Number(latlng.lng.toFixed(5))];
    
    // Check if clicking near the first point to close loop (if >= 3 points)
    if (this.drawnPoints.length >= 3) {
      const firstPt = this.drawnPoints[0];
      const dLat = (firstPt[0] - pt[0]) * 111320;
      const dLng = (firstPt[1] - pt[1]) * 84000;
      const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distMeters < 40) {
        this.finishBoundaryDrawing();
        return;
      }
    }

    this.drawnPoints.push(pt);

    // Marker for vertex
    const isFirst = this.drawnPoints.length === 1;
    const marker = L.circleMarker(pt, {
      radius: isFirst ? 9 : 6,
      color: isFirst ? '#00e676' : '#00e5ff',
      fillColor: isFirst ? '#00e676' : '#00e5ff',
      fillOpacity: 0.9,
      weight: isFirst ? 3 : 2
    });

    if (isFirst) {
      marker.bindTooltip('Start Point: Click here or tap Finish to close loop', { permanent: false, direction: 'top' });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (this.drawnPoints.length >= 3) {
          this.finishBoundaryDrawing();
        }
      });
    }

    this.drawingLayerGroup.addLayer(marker);
    this.drawnMarkers.push(marker);

    this.updateDrawingPolyline();

    if (this.onPointAddedCallback) {
      this.onPointAddedCallback(this.drawnPoints.length);
    }
  }

  updateDrawingPolyline() {
    if (this.drawnPolyline) {
      this.drawingLayerGroup.removeLayer(this.drawnPolyline);
    }
    if (this.drawnPoints.length >= 2) {
      this.drawnPolyline = L.polyline(this.drawnPoints, {
        color: '#00e5ff',
        weight: 3,
        dashArray: '5, 5',
        className: 'tactical-drawing-polyline'
      }).addTo(this.drawingLayerGroup);
    }
  }

  undoLastBoundaryPoint() {
    if (!this.drawnPoints.length) return 0;
    this.drawnPoints.pop();
    const m = this.drawnMarkers.pop();
    if (m && this.drawingLayerGroup) {
      this.drawingLayerGroup.removeLayer(m);
    }
    this.updateDrawingPolyline();
    if (this.onPointAddedCallback) {
      this.onPointAddedCallback(this.drawnPoints.length);
    }
    return this.drawnPoints.length;
  }

  finishBoundaryDrawing() {
    if (this.drawnPoints.length < 3) {
      alert('You need at least 3 points to form a closed boundary sector.');
      return null;
    }

    // Close the loop if not matching
    const first = this.drawnPoints[0];
    const last = this.drawnPoints[this.drawnPoints.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      this.drawnPoints.push([first[0], first[1]]);
    }

    const finalCoords = [...this.drawnPoints];
    this.cleanUpBoundaryDrawing();
    this.applyFadeToBlackMask(finalCoords);

    if (this.onLoopClosedCallback) {
      this.onLoopClosedCallback(finalCoords);
    }
    return finalCoords;
  }

  cancelBoundaryDrawing() {
    this.cleanUpBoundaryDrawing();
    this.applyFadeToBlackMask(); // Restore active boundary
  }

  cleanUpBoundaryDrawing() {
    this.isDrawingBoundary = false;
    if (this.drawingLayerGroup) {
      this.drawingLayerGroup.clearLayers();
    }
    this.drawnPoints = [];
    this.drawnMarkers = [];
    this.drawnPolyline = null;
    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.remove('boundary-draw-active');
  }

  enablePinDropMode(cosmetic, callback) {
    this.isPinDropMode = true;
    this.selectedCosmeticForDrop = cosmetic;
    this.pinDropCallback = callback;
    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.add('pin-drop-active');
  }

  disablePinDropMode() {
    this.isPinDropMode = false;
    this.selectedCosmeticForDrop = null;
    this.pinDropCallback = null;
    const mapEl = document.getElementById('tactical-map');
    if (mapEl) mapEl.classList.remove('pin-drop-active');
  }

  rotateMap(deg) {
    this.setRotation(this.rotationBearing + deg, true);
  }

  resetRotation() {
    const current = this.rotationBearing;
    let norm = ((current % 360) + 360) % 360;
    let target = 0;
    if (norm > 180) {
      // Shorter clockwise turn to 360
      target = current + (360 - norm);
    } else {
      // Shorter counter-clockwise turn to 0
      target = current - norm;
    }

    this.rotationBearing = 0;
    const container = document.querySelector('.leaflet-map-pane');
    if (container) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      container.style.transformOrigin = `${centerX}px ${centerY}px`;
      container.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      container.style.transform = `rotate(${target}deg)`;

      setTimeout(() => {
        if (this.rotationBearing === 0 && container) {
          container.style.transition = 'none';
          container.style.transform = 'rotate(0deg)';
        }
      }, 520);
    }

    const compassIcon = document.getElementById('compass-indicator');
    if (compassIcon) {
      compassIcon.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      compassIcon.style.transform = `rotate(${-target}deg)`;
      setTimeout(() => {
        if (this.rotationBearing === 0 && compassIcon) {
          compassIcon.style.transition = 'none';
          compassIcon.style.transform = 'rotate(0deg)';
        }
      }, 520);
    }

    this.updateOrientationHUD(0);
  }

  setRotation(bearing, smooth = false) {
    this.rotationBearing = bearing;
    const container = document.querySelector('.leaflet-map-pane');
    if (container) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      container.style.transformOrigin = `${centerX}px ${centerY}px`;
      container.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
      container.style.transform = `rotate(${this.rotationBearing}deg)`;
    }
    const compassIcon = document.getElementById('compass-indicator');
    if (compassIcon) {
      compassIcon.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
      compassIcon.style.transform = `rotate(${-this.rotationBearing}deg)`;
    }

    const normDeg = Math.round(((this.rotationBearing % 360) + 360) % 360);
    this.updateOrientationHUD(normDeg);
  }

  setupRightClickOrientationControl() {
    const mapEl = document.getElementById(this.containerId || 'tactical-map');
    if (!mapEl) return;

    // Suppress browser context menu on tactical map and while dragging
    mapEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    window.addEventListener('contextmenu', (e) => {
      if (this.isRightClickDragging) {
        e.preventDefault();
      }
    });

    // Right-click mousedown to start orientation control
    mapEl.addEventListener('mousedown', (e) => {
      // e.button === 2 is right click; also support Ctrl + Left Click (trackpad convention)
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();

        this.isRightClickDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartBearing = this.rotationBearing;

        if (this.map && this.map.dragging) {
          this.map.dragging.disable();
        }

        document.body.classList.add('map-rotating-active');
        this.showOrientationHUD();
      }
    });

    // Mousemove on window for smooth tracking across entire screen
    window.addEventListener('mousemove', (e) => {
      if (!this.isRightClickDragging) return;

      // Verify right button or Ctrl+left is still held down
      const isRightHeld = (e.buttons & 2) !== 0;
      const isCtrlLeftHeld = e.ctrlKey && ((e.buttons & 1) !== 0);
      if (!isRightHeld && !isCtrlLeftHeld) {
        this.stopRightClickDrag();
        return;
      }

      e.preventDefault();
      const deltaX = e.clientX - this.dragStartX;
      const sensitivity = 0.45; // ~800px drag equals 360 degrees
      const newBearing = this.dragStartBearing + (deltaX * sensitivity);
      this.setRotation(newBearing, false);
    });

    // Mouseup on window to release orientation control
    window.addEventListener('mouseup', (e) => {
      if (this.isRightClickDragging) {
        if (e.button === 2 || (e.button === 0 && !e.ctrlKey) || e.button === 0) {
          this.stopRightClickDrag();
        }
      }
    });

    window.addEventListener('blur', () => {
      if (this.isRightClickDragging) {
        this.stopRightClickDrag();
      }
    });
  }

  stopRightClickDrag() {
    if (!this.isRightClickDragging) return;
    this.isRightClickDragging = false;

    if (this.map && this.map.dragging) {
      this.map.dragging.enable();
    }

    document.body.classList.remove('map-rotating-active');
    this.hideOrientationHUD();

    // Normalize bearing to 0..360 range
    this.rotationBearing = ((this.rotationBearing % 360) + 360) % 360;
  }

  showOrientationHUD() {
    const hud = document.getElementById('orientation-hud');
    if (hud) {
      hud.classList.remove('hidden');
      const normDeg = Math.round(((this.rotationBearing % 360) + 360) % 360);
      this.updateOrientationHUD(normDeg);
    }
  }

  hideOrientationHUD() {
    const hud = document.getElementById('orientation-hud');
    if (hud) {
      hud.classList.add('hidden');
    }
  }

  updateOrientationHUD(deg) {
    const bearingEl = document.getElementById('hud-bearing-val');
    const cardinalEl = document.getElementById('hud-cardinal-val');
    const needleEl = document.getElementById('hud-compass-needle');
    if (bearingEl) {
      bearingEl.textContent = `${String(deg).padStart(3, '0')}°`;
    }
    if (cardinalEl) {
      cardinalEl.textContent = this.getCardinal(deg);
    }
    if (needleEl) {
      needleEl.style.transformOrigin = '12px 12px';
      needleEl.style.transform = `rotate(${-deg}deg)`;
    }
  }

  getCardinal(deg) {
    const d = ((deg % 360) + 360) % 360;
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(d / 22.5) % 16;
    return cardinals[index];
  }

  setDestinationTarget(latlng) {
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }

    const iconHtml = `
      <div class="destination-pin-container">
        <div class="dest-pulse-ring"></div>
        <div class="dest-reticle">
          <svg viewBox="0 0 36 36" width="36" height="36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="3, 3"/>
            <line x1="18" y1="2" x2="18" y2="10" stroke="#00e5ff" stroke-width="2"/>
            <line x1="18" y1="26" x2="18" y2="34" stroke="#00e5ff" stroke-width="2"/>
            <line x1="2" y1="18" x2="10" y2="18" stroke="#00e5ff" stroke-width="2"/>
            <line x1="26" y1="18" x2="34" y2="18" stroke="#00e5ff" stroke-width="2"/>
            <circle cx="18" cy="18" r="3.5" fill="#ff1744" stroke="#ffffff" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="dest-label">SIGHTING TARGET</div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'destination-div-icon',
      html: iconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.destinationMarker = L.marker(latlng, { icon: icon, zIndexOffset: 250 }).addTo(this.map);
    return this.destinationMarker;
  }

  clearDestinationTarget() {
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
      this.destinationMarker = null;
    }
  }

  updateLivePreviewPin(latlng, cosmetic, heading) {
    if (!this.previewMarkerLayer) {
      this.previewMarkerLayer = L.layerGroup().addTo(this.map);
    }
    this.previewMarkerLayer.clearLayers();

    if (!latlng || !cosmetic) return;

    const iconHtml = window.seekerManager.getCarSvg(cosmetic, true, heading);
    const customIcon = L.divIcon({
      className: 'tactical-div-icon preview-tactical-icon',
      html: iconHtml,
      iconSize: [54, 54],
      iconAnchor: [27, 27]
    });

    const marker = L.marker(latlng, { icon: customIcon, zIndexOffset: 300 });
    this.previewMarkerLayer.addLayer(marker);
  }

  clearLivePreviewPin() {
    if (this.previewMarkerLayer) {
      this.previewMarkerLayer.clearLayers();
    }
  }

  resetView() {
    const zoneBounds = L.latLngBounds(PLAY_ZONE_COORDS);
    this.map.fitBounds(zoneBounds, { padding: [20, 20], animate: true });
    this.resetRotation();
  }

  isInsidePlayZone(lat, lng) {
    // Ray-casting point-in-polygon algorithm
    let inside = false;
    for (let i = 0, j = PLAY_ZONE_COORDS.length - 1; i < PLAY_ZONE_COORDS.length; j = i++) {
      const xi = PLAY_ZONE_COORDS[i][0], yi = PLAY_ZONE_COORDS[i][1];
      const xj = PLAY_ZONE_COORDS[j][0], yj = PLAY_ZONE_COORDS[j][1];
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

window.mapEngine = new MapEngine();
