/**
 * Seeker Cosmetics, Pins, Breadcrumbs, and Pin Details Manager
 */

class SeekerManager {
  constructor() {
    this.cosmetics = [
      {
        id: 'cruiser',
        name: 'Patrol Cruiser',
        callsign: 'Cruiser 1',
        color: '#00e5ff',
        pulseColor: 'rgba(0, 229, 255, 0.6)',
        type: 'cruiser',
        icon: 'police-car',
        description: 'Rapid seeker vehicle with dual flashing beacons.'
      },
      {
        id: 'suv',
        name: 'Stealth SUV',
        callsign: 'Ghost Unit',
        color: '#ffb300',
        pulseColor: 'rgba(255, 179, 0, 0.6)',
        type: 'suv',
        icon: 'car-side',
        description: 'Matte black SUV patrolling perimeter avenues.'
      },
      {
        id: 'sports',
        name: 'Pursuit Interceptor',
        callsign: 'Redline',
        color: '#ff1744',
        pulseColor: 'rgba(255, 23, 68, 0.6)',
        type: 'sports',
        icon: 'tachometer-alt',
        description: 'High-speed interceptor closing down escape routes.'
      },
      {
        id: 'van',
        name: 'Covert Van',
        callsign: 'Blackout Van',
        color: '#00e676',
        pulseColor: 'rgba(0, 230, 118, 0.6)',
        type: 'van',
        icon: 'shuttle-van',
        description: 'Surveillance van deployed at major bottlenecks.'
      },
      {
        id: 'truck',
        name: 'Shadow 4x4 Truck',
        callsign: 'Titan 4x4',
        color: '#ff9100',
        pulseColor: 'rgba(255, 145, 0, 0.6)',
        type: 'truck',
        icon: 'truck-pickup',
        description: 'Heavy duty pickup monitoring unpaved trail heads.'
      },
      {
        id: 'motorcycle',
        name: 'Night Stalker Bike',
        callsign: 'Phantom-1',
        color: '#d500f9',
        pulseColor: 'rgba(213, 0, 249, 0.6)',
        type: 'motorcycle',
        icon: 'motorcycle',
        description: 'Agile scout maneuvering through narrow access ways.'
      },
      {
        id: 'human-gold',
        name: 'Seeker on Foot (Gold)',
        callsign: 'Foot Scout 1',
        color: '#ffea00',
        pulseColor: 'rgba(255, 234, 0, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Gold sector).'
      },
      {
        id: 'human-lime',
        name: 'Seeker on Foot (Lime)',
        callsign: 'Foot Scout 2',
        color: '#00e676',
        pulseColor: 'rgba(0, 230, 118, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Lime sector).'
      },
      {
        id: 'human-coral',
        name: 'Seeker on Foot (Coral)',
        callsign: 'Foot Scout 3',
        color: '#ff3d00',
        pulseColor: 'rgba(255, 61, 0, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Coral sector).'
      }
    ];

    this.aliases = {};
    this.loadAliases();
    this.loadCustomCosmetics();

    // Map layer references
    this.markersLayer = null;
    this.trailsLayer = null;
  }

  loadAliases() {
    try {
      const saved = localStorage.getItem('agentFranks_aliases');
      if (saved) {
        this.aliases = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading aliases:', e);
    }
  }

  saveAliases() {
    try {
      localStorage.setItem('agentFranks_aliases', JSON.stringify(this.aliases));
    } catch (e) {
      console.error('Error saving aliases:', e);
    }
  }

  setAlias(codename, realName) {
    if (!codename) return;
    const cleanCode = codename.trim().toLowerCase();
    if (!realName || !realName.trim()) {
      delete this.aliases[cleanCode];
    } else {
      this.aliases[cleanCode] = realName.trim();
    }
    this.saveAliases();
  }

  getRealName(codename) {
    if (!codename) return '';
    const cleanCode = codename.trim().toLowerCase();
    return this.aliases[cleanCode] || '';
  }

  getDisplayName(codename) {
    if (!codename) return 'Unknown Agent';
    const real = this.getRealName(codename);
    return real ? `${codename} (${real})` : codename;
  }

  loadCustomCosmetics() {
    try {
      const saved = localStorage.getItem('agentFranks_custom_cosmetics');
      if (saved) {
        const custom = JSON.parse(saved);
        if (Array.isArray(custom) && custom.length) {
          this.cosmetics = custom;
        }
      }
      // Migrate legacy single human to 3 foot seekers
      this.cosmetics = this.cosmetics.filter(c => c.id !== 'human');

      const footVariants = [
        {
          id: 'human-gold',
          name: 'Seeker on Foot (Gold)',
          callsign: 'Foot Scout 1',
          color: '#ffea00',
          pulseColor: 'rgba(255, 234, 0, 0.6)',
          type: 'human',
          icon: 'person',
          description: 'Ground seeker patrolling on foot (Gold sector).'
        },
        {
          id: 'human-lime',
          name: 'Seeker on Foot (Lime)',
          callsign: 'Foot Scout 2',
          color: '#00e676',
          pulseColor: 'rgba(0, 230, 118, 0.6)',
          type: 'human',
          icon: 'person',
          description: 'Ground seeker patrolling on foot (Lime sector).'
        },
        {
          id: 'human-coral',
          name: 'Seeker on Foot (Coral)',
          callsign: 'Foot Scout 3',
          color: '#ff3d00',
          pulseColor: 'rgba(255, 61, 0, 0.6)',
          type: 'human',
          icon: 'person',
          description: 'Ground seeker patrolling on foot (Coral sector).'
        }
      ];

      let changed = false;
      footVariants.forEach(variant => {
        if (!this.cosmetics.some(c => c.id === variant.id)) {
          this.cosmetics.push(variant);
          changed = true;
        }
      });

      if (changed) {
        this.saveCustomCosmetics();
      }
    } catch (e) {
      console.error('Error loading custom cosmetics:', e);
    }
  }

  saveCustomCosmetics() {
    try {
      localStorage.setItem('agentFranks_custom_cosmetics', JSON.stringify(this.cosmetics));
      if (window.tacticalSync) {
        window.tacticalSync.broadcast({ type: 'COSMETICS_UPDATED', cosmetics: this.cosmetics });
      }
    } catch (e) {
      console.error('Error saving custom cosmetics:', e);
    }
  }

  updateCosmetic(id, updatedFields) {
    const cosmetic = this.cosmetics.find(c => c.id === id);
    if (!cosmetic) return false;
    if (updatedFields.name) cosmetic.name = updatedFields.name;
    if (updatedFields.callsign) cosmetic.callsign = updatedFields.callsign;
    if (updatedFields.color) {
      cosmetic.color = updatedFields.color;
      cosmetic.pulseColor = updatedFields.color;
    }
    if (updatedFields.type) cosmetic.type = updatedFields.type;
    if (updatedFields.description !== undefined) cosmetic.description = updatedFields.description;
    this.saveCustomCosmetics();
    return true;
  }

  addCosmetic(newCosmetic) {
    const isHuman = newCosmetic.type === 'human' || newCosmetic.id === 'human';
    const id = newCosmetic.id || (isHuman ? 'human_' : 'custom_') + Date.now().toString(36);
    const item = {
      id: id,
      name: newCosmetic.name || (isHuman ? 'Human Seeker' : 'Custom Seeker'),
      callsign: newCosmetic.callsign || 'Unit ' + (this.cosmetics.length + 1),
      color: newCosmetic.color || (isHuman ? '#ffea00' : '#00e5ff'),
      pulseColor: newCosmetic.color || (isHuman ? '#ffea00' : '#00e5ff'),
      type: isHuman ? 'human' : (newCosmetic.type || 'cruiser'),
      icon: isHuman ? 'person' : (newCosmetic.icon || 'car-side'),
      description: newCosmetic.description || (isHuman ? 'Seeker on foot.' : 'Custom seeker vehicle.')
    };
    this.cosmetics.push(item);
    this.saveCustomCosmetics();
    return item;
  }

  deleteCosmetic(id) {
    if (this.cosmetics.length <= 1) return false;
    this.cosmetics = this.cosmetics.filter(c => c.id !== id);
    this.saveCustomCosmetics();
    return true;
  }

  resetCosmeticsToDefault() {
    localStorage.removeItem('agentFranks_custom_cosmetics');
    this.cosmetics = [
      {
        id: 'cruiser',
        name: 'Patrol Cruiser',
        callsign: 'Cruiser 1',
        color: '#00e5ff',
        pulseColor: 'rgba(0, 229, 255, 0.6)',
        type: 'cruiser',
        icon: 'police-car',
        description: 'Rapid seeker vehicle with dual flashing beacons.'
      },
      {
        id: 'suv',
        name: 'Stealth SUV',
        callsign: 'Ghost Unit',
        color: '#ffb300',
        pulseColor: 'rgba(255, 179, 0, 0.6)',
        type: 'suv',
        icon: 'car-side',
        description: 'Matte black SUV patrolling perimeter avenues.'
      },
      {
        id: 'sports',
        name: 'Pursuit Interceptor',
        callsign: 'Redline',
        color: '#ff1744',
        pulseColor: 'rgba(255, 23, 68, 0.6)',
        type: 'sports',
        icon: 'tachometer-alt',
        description: 'High-speed interceptor closing down escape routes.'
      },
      {
        id: 'van',
        name: 'Covert Van',
        callsign: 'Blackout Van',
        color: '#00e676',
        pulseColor: 'rgba(0, 230, 118, 0.6)',
        type: 'van',
        icon: 'shuttle-van',
        description: 'Surveillance van deployed at major bottlenecks.'
      },
      {
        id: 'truck',
        name: 'Shadow 4x4 Truck',
        callsign: 'Titan 4x4',
        color: '#ff9100',
        pulseColor: 'rgba(255, 145, 0, 0.6)',
        type: 'truck',
        icon: 'truck-pickup',
        description: 'Heavy duty pickup monitoring unpaved trail heads.'
      },
      {
        id: 'motorcycle',
        name: 'Night Stalker Bike',
        callsign: 'Phantom-1',
        color: '#d500f9',
        pulseColor: 'rgba(213, 0, 249, 0.6)',
        type: 'motorcycle',
        icon: 'motorcycle',
        description: 'Agile scout maneuvering through narrow access ways.'
      },
      {
        id: 'human-gold',
        name: 'Seeker on Foot (Gold)',
        callsign: 'Foot Scout 1',
        color: '#ffea00',
        pulseColor: 'rgba(255, 234, 0, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Gold sector).'
      },
      {
        id: 'human-lime',
        name: 'Seeker on Foot (Lime)',
        callsign: 'Foot Scout 2',
        color: '#00e676',
        pulseColor: 'rgba(0, 230, 118, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Lime sector).'
      },
      {
        id: 'human-coral',
        name: 'Seeker on Foot (Coral)',
        callsign: 'Foot Scout 3',
        color: '#ff3d00',
        pulseColor: 'rgba(255, 61, 0, 0.6)',
        type: 'human',
        icon: 'person',
        description: 'Ground seeker patrolling on foot (Coral sector).'
      }
    ];
    this.saveCustomCosmetics();
  }

  getCosmetic(id) {
    if (id === 'human') {
      return this.cosmetics.find(c => c.id === 'human-gold') || this.cosmetics.find(c => c.type === 'human') || this.cosmetics[0];
    }
    return this.cosmetics.find(c => c.id === id) || this.cosmetics[0];
  }

  getRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    if (diffHrs === 1) return '1 hr ago';
    return `${diffHrs} hrs ago`;
  }

  getTimeStatus(timestamp) {
    const diffMin = (Date.now() - timestamp) / 60000;
    if (diffMin <= 3) return { label: 'CRITICAL HOT', class: 'status-hot' };
    if (diffMin <= 8) return { label: 'RECENT', class: 'status-warm' };
    if (diffMin <= 20) return { label: 'COOLING', class: 'status-cooling' };
    return { label: 'COLD SIGHTING', class: 'status-cold' };
  }

  getNearestLandmark(lat, lng) {
    const list = (window.tacticalSync && window.tacticalSync.landmarks && window.tacticalSync.landmarks.length)
      ? window.tacticalSync.landmarks
      : (window.LANDMARKS || []);
    if (!list || !list.length) return null;
    let closest = null;
    let minDist = Infinity;

    list.forEach(lm => {
      // Euclidean approximation for small area
      const dLat = (lm.lat - lat) * 111320;
      const dLng = (lm.lng - lng) * 84000; // rough cos(41 deg)
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        closest = { name: lm.name, distMeters: Math.round(dist) };
      }
    });

    return closest;
  }

  /**
   * Generates custom SVG icon for selectors, admin previews, and card tags
   */
  getCosmeticIconSvg(cosmetic, size = 20) {
    const color = cosmetic.color || '#00e5ff';
    const isHuman = cosmetic.type === 'human' || (cosmetic.id && cosmetic.id.startsWith('human')) || cosmetic.icon === 'person';

    if (isHuman) {
      return `
        <svg viewBox="0 0 24 24" width="${size}" height="${size}">
          <circle cx="12" cy="5" r="3" fill="${color}"/>
          <path d="M15 9h-6c-1.1 0-2 .9-2 2v5c0 .55.45 1 1 1s1-.45 1-1v-4.5h1V21c0 .55.45 1 1 1s1-.45 1-1v-5.5h0v5.5c0 .55.45 1 1 1s1-.45 1-1v-7.5h1V16c0 .55.45 1 1 1s1-.45 1-1v-5c0-1.1-.9-2-2-2z" fill="${color}"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M5 11 L7 6 C7.5 5 8.5 4.5 9.5 4.5 L14.5 4.5 C15.5 4.5 16.5 5 17 6 L19 11 Z" fill="${color}"/>
        <circle cx="7" cy="14" r="2.2" fill="#fff"/>
        <circle cx="17" cy="14" r="2.2" fill="#fff"/>
      </svg>
    `;
  }

  /**
   * Generates custom SVG for map pin (supports both vehicles and humans)
   */
  getCarSvg(cosmetic, isPulsing = false, heading = null) {
    const color = cosmetic.color || '#00e5ff';
    const hasHeading = heading !== null && heading !== undefined && heading !== '';
    const isHuman = cosmetic.type === 'human' || (cosmetic.id && cosmetic.id.startsWith('human')) || cosmetic.icon === 'person';

    return `
      <div class="tactical-marker-container ${isPulsing ? 'is-pulsing' : 'is-breadcrumb'} ${isHuman ? 'marker-human' : 'marker-vehicle'}" style="--marker-color: ${color};">
        ${isPulsing ? `
          <div class="radar-pulse-ring ring-1"></div>
          <div class="radar-pulse-ring ring-2"></div>
          <div class="radar-pulse-ring ring-3"></div>
        ` : ''}
        <div class="car-badge-icon">
          <svg viewBox="0 0 48 48" class="car-svg" style="overflow: visible;">
            <!-- Directional Pointer Rod (always upright base; only this rod projects outward in heading direction) -->
            ${hasHeading ? `
              <g transform="rotate(${heading} 24 24)">
                <!-- Laser beam / rod line sticking out -->
                <line x1="24" y1="18" x2="24" y2="-12" stroke="${color}" stroke-width="3.5" stroke-linecap="round" />
                <!-- Direction Arrow Pointer -->
                <polygon points="24,-18 19,-10 29,-10" fill="${color}" />
                <circle cx="24" cy="-11" r="2" fill="#ffffff" />
              </g>
            ` : ''}

            <!-- Target Reticle (Always Upright) -->
            <circle cx="24" cy="24" r="20" fill="rgba(10, 14, 22, 0.9)" stroke="${color}" stroke-width="2.5" />
            
            ${isHuman ? `
              <!-- Human Operative Silhouette (Always Upright) -->
              <circle cx="24" cy="14" r="4.5" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
              <path d="M28.5 20.5 h-9 c-1.65 0-3 1.35-3 3 v7.5 c0 .83 .67 1.5 1.5 1.5 s1.5-.67 1.5-1.5 v-6.5 h1.5 V35 c0 .83 .67 1.5 1.5 1.5 s1.5-.67 1.5-1.5 v-8.5 h1.5 V35 c0 .83 .67 1.5 1.5 1.5 s1.5-.67 1.5-1.5 v-10.5 h1.5 v6.5 c0 .83 .67 1.5 1.5 1.5 s1.5-.67 1.5-1.5 v-7.5 c0-1.65-1.35-3-3-3 z" fill="${color}" />
              <!-- Tactical Visor Glow -->
              <rect x="22" y="13.2" width="4" height="1.6" rx="0.8" fill="#ffffff" />
            ` : `
              <!-- Vehicle Silhouette (Always Upright) -->
              <path d="M15 28 L17 19 C17.5 17 19 16 21 16 L27 16 C29 16 30.5 17 31 19 L33 28 C34 29 35 30 35 32 L35 35 C35 36 34 37 33 37 L31 37 C30 37 29 36 29 35 L29 34 L19 34 L19 35 C19 36 18 37 17 37 L15 37 C14 37 13 36 13 35 L13 32 C13 30 14 29 15 28 Z" fill="${color}" />
              <!-- Windshield -->
              <polygon points="19,20 29,20 27.5,24 20.5,24" fill="#080c14" />
              <!-- Headlights -->
              <circle cx="16" cy="30" r="1.8" fill="#ffffff" />
              <circle cx="32" cy="30" r="1.8" fill="#ffffff" />
            `}
          </svg>
        </div>
        ${isPulsing ? `
          <div class="marker-label-tag">
            <span class="pulse-dot"></span>
            ${cosmetic.callsign || cosmetic.name}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generates breadcrumb marker HTML
   */
  getBreadcrumbHtml(cosmetic, index, total) {
    const color = cosmetic.color || '#00e5ff';
    return `
      <div class="breadcrumb-marker" style="--marker-color: ${color};">
        <div class="breadcrumb-dot">
          <span class="breadcrumb-num">${index}</span>
        </div>
      </div>
    `;
  }

  /**
   * Re-renders all pins and trails onto the Leaflet map
   */
  renderPinsOnMap(map, pins, onPinClick) {
    if (!this.markersLayer) {
      this.markersLayer = L.layerGroup().addTo(map);
    } else {
      this.markersLayer.clearLayers();
    }

    if (!this.trailsLayer) {
      this.trailsLayer = L.layerGroup().addTo(map);
    } else {
      this.trailsLayer.clearLayers();
    }

    if (!pins || !pins.length) return;

    // Group pins by seeker/cosmetic identity to track historical movement
    const seekerGroups = {};
    pins.forEach(pin => {
      const key = pin.cosmeticId || pin.seekerId || 'default';
      if (!seekerGroups[key]) seekerGroups[key] = [];
      seekerGroups[key].push(pin);
    });

    // For each seeker group, sort chronologically
    Object.keys(seekerGroups).forEach(groupKey => {
      const groupPins = seekerGroups[groupKey];
      groupPins.sort((a, b) => a.timestamp - b.timestamp);

      const cosmetic = this.getCosmetic(groupKey);
      const isHuman = cosmetic.type === 'human' || (cosmetic.id && cosmetic.id.startsWith('human')) || cosmetic.icon === 'person';
      const totalSightings = groupPins.length;

      // Draw breadcrumb trail line connecting sightings (only for vehicles, suppressed for foot seekers)
      if (totalSightings > 1 && !isHuman) {
        const latLngs = groupPins.map(p => [p.lat, p.lng]);
        const polyline = L.polyline(latLngs, {
          color: cosmetic.color || '#00e5ff',
          weight: 3,
          opacity: 0.7,
          dashArray: '6, 8',
          lineCap: 'round',
          className: 'tactical-breadcrumb-trail'
        });
        this.trailsLayer.addLayer(polyline);
      }

      // Render each sighting pin
      groupPins.forEach((pin, index) => {
        const isLatest = (index === totalSightings - 1);

        let iconHtml;
        let iconSize;
        let iconAnchor;

        if (isHuman) {
          // Foot seekers:
          // "all 3 of them they dont have lines going between them. They only pulse if theyre the most recently pinged of that color"
          if (isLatest) {
            // Most recent ping of this color: pulses
            iconHtml = this.getCarSvg(cosmetic, true, pin.heading);
            iconSize = [54, 54];
            iconAnchor = [27, 27];
          } else {
            // Historical ping of this color: static upright silhouette, NO pulse
            iconHtml = this.getCarSvg(cosmetic, false, pin.heading);
            iconSize = [44, 44];
            iconAnchor = [22, 22];
          }
        } else {
          // Vehicle seekers:
          if (isLatest) {
            iconHtml = this.getCarSvg(cosmetic, true, pin.heading);
            iconSize = [54, 54];
            iconAnchor = [27, 27];
          } else {
            iconHtml = this.getBreadcrumbHtml(cosmetic, index + 1, totalSightings);
            iconSize = [24, 24];
            iconAnchor = [12, 12];
          }
        }

        const customIcon = L.divIcon({
          className: 'tactical-div-icon',
          html: iconHtml,
          iconSize: iconSize,
          iconAnchor: iconAnchor
        });

        const marker = L.marker([pin.lat, pin.lng], { icon: customIcon });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onPinClick) {
            onPinClick(pin, cosmetic, isLatest, index + 1, totalSightings);
          }
        });

        this.markersLayer.addLayer(marker);
      });
    });
  }
}

window.seekerManager = new SeekerManager();
