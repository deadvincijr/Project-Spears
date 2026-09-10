/**
 * Aegis of the Void - Infinite Procedural Dungeon Labyrinth Generator
 * Generates an infinite, deterministic tile-based maze with chambers, chokepoints,
 * destructible urns, secret cracked walls, spike traps, and locked rune vaults.
 */

// Mulberry32 PRNG
function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 2D Spatial Hash for deterministic chunk seeding
function hash2D(seed, cx, cy) {
  let h = seed ^ (cx * 374761393) ^ (cy * 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const TILE_SIZE = 50;
const TILES_PER_CHUNK = 16;
const CHUNK_SIZE = TILE_SIZE * TILES_PER_CHUNK; // 800px

const TILES = {
  FLOOR: 0,
  WALL: 1,
  CRACKED_WALL: 2,
  SPIKE_TRAP: 3,
  CHASM: 4,
  RUNE_GATE: 5,
  GLYPH_TILE: 6
};

const BIOMES = {
  OUTSKIRTS: {
    id: 'outskirts',
    name: 'Forgotten Crypts',
    minDist: 0,
    maxDist: 1400,
    floorColor: '#0b0f19',
    floorTileColor: '#111827',
    wallTopColor: '#334155',
    wallFrontColor: '#1e293b',
    wallBorderColor: '#38bdf8',
    threatLevel: 'Low',
    threatColor: '#38bdf8'
  },
  BARRENS: {
    id: 'barrens',
    name: 'Ashen Labyrinth',
    minDist: 1400,
    maxDist: 3200,
    floorColor: '#140c0c',
    floorTileColor: '#1f1313',
    wallTopColor: '#451a1a',
    wallFrontColor: '#2b1111',
    wallBorderColor: '#f87171',
    threatLevel: 'Moderate',
    threatColor: '#fb923c'
  },
  CATACOMBS: {
    id: 'catacombs',
    name: 'Cursed Mausoleum',
    minDist: 3200,
    maxDist: 6000,
    floorColor: '#0e0817',
    floorTileColor: '#180f26',
    wallTopColor: '#3b184e',
    wallFrontColor: '#240f33',
    wallBorderColor: '#c084fc',
    threatLevel: 'Dangerous',
    threatColor: '#c084fc'
  },
  SINGULARITY: {
    id: 'singularity',
    name: 'Void Catacombs',
    minDist: 6000,
    maxDist: Infinity,
    floorColor: '#050508',
    floorTileColor: '#0d0d16',
    wallTopColor: '#3b0d2a',
    wallFrontColor: '#24081a',
    wallBorderColor: '#f472b6',
    threatLevel: 'Lethal',
    threatColor: '#f43f5e'
  }
};

class WorldManager {
  constructor(seed = 133742) {
    this.seed = seed;
    this.chunks = new Map(); // "cx,cy" -> Chunk
    this.exploredChunks = new Set();
    this.openedChests = new Set();
    this.clearedShrines = new Set();
    this.usedWells = new Set();
    this.collectedKeys = new Set();
    this.unlockedGates = new Set();
    this.brokenUrns = new Set();
    this.destroyedCrackedWalls = new Set();
    this.riddles = new Map();
    this.solvedRiddles = new Set();
    this.isTutorial = false;
    this.tutorialDoors = new Map();

    this.playerHasRuneKey = false;

    // Sanctuary Beacon at center of chunk (0, 0)
    this.spawnBeacon = {
      x: 400,
      y: 400,
      radius: 45,
      glowRadius: 160
    };
  }

  reset(newSeed) {
    if (newSeed !== undefined) this.seed = newSeed;
    this.chunks.clear();
    this.exploredChunks.clear();
    this.openedChests.clear();
    this.clearedShrines.clear();
    this.usedWells.clear();
    this.collectedKeys.clear();
    this.unlockedGates.clear();
    this.brokenUrns.clear();
    this.destroyedCrackedWalls.clear();
    this.riddles.clear();
    this.solvedRiddles.clear();
    this.isTutorial = false;
    this.tutorialDoors.clear();
    this.playerHasRuneKey = false;
  }

  getBiomeAt(worldX, worldY) {
    const dist = Math.hypot(worldX - 400, worldY - 400);
    const angle = Math.atan2(worldY - 400, worldX - 400);
    const wobble = Math.sin(angle * 4) * 120 + Math.cos(angle * 2) * 80;
    const effectiveDist = dist + wobble;

    if (effectiveDist < BIOMES.OUTSKIRTS.maxDist) return BIOMES.OUTSKIRTS;
    if (effectiveDist < BIOMES.BARRENS.maxDist) return BIOMES.BARRENS;
    if (effectiveDist < BIOMES.CATACOMBS.maxDist) return BIOMES.CATACOMBS;
    return BIOMES.SINGULARITY;
  }

  getChunkCoords(worldX, worldY) {
    return {
      cx: Math.floor(worldX / CHUNK_SIZE),
      cy: Math.floor(worldY / CHUNK_SIZE)
    };
  }

  getChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    }
    if (this.isTutorial) {
      return {
        cx,
        cy,
        worldX: cx * CHUNK_SIZE,
        worldY: cy * CHUNK_SIZE,
        biome: BIOMES.OUTSKIRTS,
        grid: Array.from({ length: TILES_PER_CHUNK }, () => Array(TILES_PER_CHUNK).fill(TILES.WALL)),
        urns: [],
        keys: [],
        gates: [],
        spikes: [],
        pois: [],
        crackedWalls: new Map(),
        riddles: []
      };
    }
    const chunk = this.generateChunk(cx, cy);
    this.chunks.set(key, chunk);
    return chunk;
  }

  // Generate a chunk deterministically with rooms, mazes, and objects
  generateChunk(cx, cy) {
    const chunkSeed = hash2D(this.seed, cx, cy);
    const rng = mulberry32(chunkSeed);

    const worldX = cx * CHUNK_SIZE;
    const worldY = cy * CHUNK_SIZE;
    const centerX = worldX + CHUNK_SIZE / 2;
    const centerY = worldY + CHUNK_SIZE / 2;
    const biome = this.getBiomeAt(centerX, centerY);

    // 16x16 grid initialized to walls
    const grid = Array.from({ length: TILES_PER_CHUNK }, () => 
      Array(TILES_PER_CHUNK).fill(TILES.WALL)
    );

    const urns = [];
    const keys = [];
    const gates = [];
    const spikes = [];
    const pois = [];
    const crackedWalls = new Map();
    const riddles = [];

    const isSpawn = (cx === 0 && cy === 0);

    if (isSpawn) {
      // --- Sanctuary Temple (0, 0) ---
      // Grand open hall in the center with 4 wide corridors leading to chunk edges
      for (let y = 3; y <= 12; y++) {
        for (let x = 3; x <= 12; x++) {
          grid[y][x] = TILES.FLOOR;
        }
      }
      // Pillars at corners
      grid[5][5] = TILES.WALL;
      grid[5][10] = TILES.WALL;
      grid[10][5] = TILES.WALL;
      grid[10][10] = TILES.WALL;

      // 4 grand entrance corridors (2 tiles wide)
      for (let i = 0; i < 16; i++) {
        grid[i][7] = TILES.FLOOR; // North-South
        grid[i][8] = TILES.FLOOR;
        grid[7][i] = TILES.FLOOR; // West-East
        grid[8][i] = TILES.FLOOR;
      }

      // Starter urns in the corners
      urns.push(
        { id: `urn_${cx}_${cy}_1`, x: worldX + 4 * TILE_SIZE + 25, y: worldY + 4 * TILE_SIZE + 25, radius: 14, isBroken: this.brokenUrns.has(`urn_${cx}_${cy}_1`) },
        { id: `urn_${cx}_${cy}_2`, x: worldX + 11 * TILE_SIZE + 25, y: worldY + 4 * TILE_SIZE + 25, radius: 14, isBroken: this.brokenUrns.has(`urn_${cx}_${cy}_2`) },
        { id: `urn_${cx}_${cy}_3`, x: worldX + 4 * TILE_SIZE + 25, y: worldY + 11 * TILE_SIZE + 25, radius: 14, isBroken: this.brokenUrns.has(`urn_${cx}_${cy}_3`) },
        { id: `urn_${cx}_${cy}_4`, x: worldX + 11 * TILE_SIZE + 25, y: worldY + 11 * TILE_SIZE + 25, radius: 14, isBroken: this.brokenUrns.has(`urn_${cx}_${cy}_4`) }
      );
    } else {
      // Pick room archetype
      const archetypeRoll = rng();

      // GUARANTEE CROSS-CORRIDORS so chunks always connect seamlessly
      for (let i = 0; i < 16; i++) {
        grid[i][7] = TILES.FLOOR;
        grid[i][8] = TILES.FLOOR;
        grid[7][i] = TILES.FLOOR;
        grid[8][i] = TILES.FLOOR;
      }

      if (archetypeRoll < 0.28) {
        // Archetype 1: Twisting Labyrinth
        this.carveLabyrinth(grid, rng);
      } else if (archetypeRoll < 0.50) {
        // Archetype 2: Pillared Great Hall
        for (let y = 2; y <= 13; y++) {
          for (let x = 2; x <= 13; x++) {
            grid[y][x] = TILES.FLOOR;
          }
        }
        // Inner colonnades
        const pillarLocs = [[4, 4], [4, 11], [11, 4], [11, 11], [4, 7], [4, 8], [11, 7], [11, 8]];
        for (const [px, py] of pillarLocs) {
          grid[py][px] = TILES.WALL;
        }
      } else if (archetypeRoll < 0.70) {
        // Archetype 3: Crypt Chambers with Sarcophagi & Cracked Walls
        this.carveCrypts(grid, rng, crackedWalls, cx, cy);
      } else if (archetypeRoll < 0.85) {
        // Archetype 4: Rune Vault & Spike Gauntlet
        this.carveRuneVault(grid, rng, gates, keys, spikes, cx, cy, worldX, worldY);
      } else {
        // Archetype 5: Ancient Rune Riddle Chamber (Interactive floor puzzle)
        this.carveRuneRiddle(grid, rng, riddles, cx, cy, worldX, worldY);
      }

      // Populate interactive Urns in open floor spaces
      const urnCount = Math.floor(rng() * 4) + 2;
      for (let i = 0; i < urnCount; i++) {
        const tx = Math.floor(rng() * 12) + 2;
        const ty = Math.floor(rng() * 12) + 2;
        if (grid[ty][tx] === TILES.FLOOR) {
          const uid = `urn_${cx}_${cy}_${i}`;
          urns.push({
            id: uid,
            x: worldX + tx * TILE_SIZE + 25,
            y: worldY + ty * TILE_SIZE + 25,
            radius: 14,
            isBroken: this.brokenUrns.has(uid)
          });
        }
      }

      // Populate Spike Traps in corridors (reduced frequency: only ~20% of chunks)
      if (archetypeRoll > 0.80 && spikes.length === 0) {
        const spikeCount = Math.floor(rng() * 2) + 1;
        for (let i = 0; i < spikeCount; i++) {
          const stx = Math.floor(rng() * 10) + 3;
          const sty = Math.floor(rng() * 10) + 3;
          if (grid[sty][stx] === TILES.FLOOR) {
            grid[sty][stx] = TILES.SPIKE_TRAP;
            spikes.push({
              tileX: stx,
              tileY: sty,
              x: worldX + stx * TILE_SIZE + 25,
              y: worldY + sty * TILE_SIZE + 25,
              timer: rng() * 3.0,
              isWarning: false,
              isActive: false
            });
          }
        }
      }

      // POI Placement (Chests, Shrines, Blood Altars, Recovery Wells, Boss Altars)
      const isBossChunkGuaranteed = (cx === 1 && cy === 1) || (cx === -1 && cy === 0) || (cx === 0 && cy === -1);
      const poiRoll = rng();
      const poiId = `poi_${cx}_${cy}`;

      if (isBossChunkGuaranteed || poiRoll < 0.78) {
        // Find safe floor tile for POI
        let ptx = 7, pty = 7;
        for (let attempt = 0; attempt < 20; attempt++) {
          const rx = Math.floor(rng() * 10) + 3;
          const ry = Math.floor(rng() * 10) + 3;
          if (grid[ry][rx] === TILES.FLOOR && (rx !== 7 || ry !== 7)) {
            ptx = rx;
            pty = ry;
            break;
          }
        }

        const px = worldX + ptx * TILE_SIZE + 25;
        const py = worldY + pty * TILE_SIZE + 25;

        if (isBossChunkGuaranteed || poiRoll > 0.62) {
          // Boss Summoning Altar
          let bossType = 'shrine_boss_void';
          let bossName = 'Malakor, Void Monarch';
          let bossArchetype = 'boss_void';
          let altarName = 'ALTAR OF THE VOID MONARCH';
          let promptText = 'Awaken Malakor, Void Monarch';
          let color = '#a855f7';
          let sigil = '🕳️';

          if ((cx === -1 && cy === 0) || (biome.id === 'barrens') || (!isBossChunkGuaranteed && poiRoll > 0.72)) {
            bossType = 'shrine_boss_fire';
            bossName = 'Ignis, Infernal Titan';
            bossArchetype = 'boss_fire';
            altarName = 'ALTAR OF THE INFERNAL TITAN';
            promptText = 'Awaken Ignis, Infernal Titan';
            color = '#ea580c';
            sigil = '🔥';
          } else if ((cx === 0 && cy === -1) || (biome.id === 'catacombs') || (!isBossChunkGuaranteed && poiRoll > 0.67)) {
            bossType = 'shrine_boss_storm';
            bossName = 'Zephyrus, Tempest Wyrm';
            bossArchetype = 'boss_storm';
            altarName = 'ALTAR OF THE TEMPEST WYRM';
            promptText = 'Awaken Zephyrus, Tempest Wyrm';
            color = '#06b6d4';
            sigil = '⚡';
          }

          pois.push({
            id: poiId,
            type: bossType,
            bossArchetype,
            bossName,
            name: altarName,
            promptText,
            color,
            sigil,
            x: px,
            y: py,
            radius: 34,
            isCleared: this.clearedShrines.has(poiId),
            isActive: false
          });
        } else if (poiRoll < 0.28) {
          // Chest
          let chestType = 'common';
          const rarityRoll = rng();
          if (rarityRoll > 0.85 || biome.id === 'singularity') chestType = 'void';
          else if (rarityRoll > 0.55 || biome.id === 'catacombs') chestType = 'rare';

          pois.push({
            id: poiId,
            type: 'chest',
            chestType,
            x: px,
            y: py,
            radius: 20,
            name: `${chestType.toUpperCase()} CHEST`,
            isOpened: this.openedChests.has(poiId)
          });
        } else if (poiRoll < 0.40) {
          // Combat Shrine
          pois.push({
            id: poiId,
            type: 'shrine_combat',
            x: px,
            y: py,
            radius: 26,
            name: 'ALTAR OF VALOR',
            isCleared: this.clearedShrines.has(poiId),
            isActive: false
          });
        } else if (poiRoll < 0.50) {
          // Blood Altar
          pois.push({
            id: poiId,
            type: 'shrine_blood',
            x: px,
            y: py,
            radius: 25,
            name: 'BLOOD SACRIFICE ALTAR',
            isUsed: this.clearedShrines.has(poiId)
          });
        } else {
          // Recovery Well
          pois.push({
            id: poiId,
            type: 'well_healing',
            x: px,
            y: py,
            radius: 24,
            name: 'WELL OF RECOVERY',
            isUsed: this.usedWells.has(poiId)
          });
        }
      }
    }

    return {
      cx,
      cy,
      worldX,
      worldY,
      biome,
      grid,
      urns,
      keys,
      gates,
      spikes,
      pois,
      crackedWalls,
      riddles
    };
  }

  // Carve labyrinth pathways
  carveLabyrinth(grid, rng) {
    // Carve 4 quadrant maze clusters
    const rooms = [
      { minX: 1, maxX: 6, minY: 1, maxY: 6 },
      { minX: 9, maxX: 14, minY: 1, maxY: 6 },
      { minX: 1, maxX: 6, minY: 9, maxY: 14 },
      { minX: 9, maxX: 14, minY: 9, maxY: 14 }
    ];

    for (const r of rooms) {
      for (let y = r.minY; y <= r.maxY; y++) {
        for (let x = r.minX; x <= r.maxX; x++) {
          if (rng() > 0.35) {
            grid[y][x] = TILES.FLOOR;
          }
        }
      }
      // Ensure openings into the main central corridors
      const midY = Math.floor((r.minY + r.maxY) / 2);
      const midX = Math.floor((r.minX + r.maxX) / 2);
      grid[midY][r.minX] = TILES.FLOOR;
      grid[midY][r.maxX] = TILES.FLOOR;
      grid[r.minY][midX] = TILES.FLOOR;
      grid[r.maxY][midX] = TILES.FLOOR;
    }
  }

  // Carve Crypt Chambers with side rooms and secret cracked walls
  carveCrypts(grid, rng, crackedWalls, cx, cy) {
    // 4 Corner crypts
    const crypts = [
      { x: 2, y: 2, w: 4, h: 4, doorX: 6, doorY: 3 },
      { x: 10, y: 2, w: 4, h: 4, doorX: 9, doorY: 3 },
      { x: 2, y: 10, w: 4, h: 4, doorX: 6, doorY: 11 },
      { x: 10, y: 10, w: 4, h: 4, doorX: 9, doorY: 11 }
    ];

    for (const c of crypts) {
      for (let y = c.y; y < c.y + c.h; y++) {
        for (let x = c.x; x < c.x + c.w; x++) {
          grid[y][x] = TILES.FLOOR;
        }
      }

      // One crypt has a secret cracked wall doorway!
      const isSecret = rng() < 0.4;
      const wallId = `${cx}_${cy}_${c.doorX}_${c.doorY}`;

      if (isSecret && !this.destroyedCrackedWalls.has(wallId)) {
        grid[c.doorY][c.doorX] = TILES.CRACKED_WALL;
        crackedWalls.set(wallId, { tx: c.doorX, ty: c.doorY, hp: 45, maxHp: 45 });
      } else {
        grid[c.doorY][c.doorX] = TILES.FLOOR;
      }
    }
  }

  // Carve a Rune Vault locked by a Runic Gate
  carveRuneVault(grid, rng, gates, keys, spikes, cx, cy, worldX, worldY) {
    // Vault chamber in top-right quadrant
    for (let y = 2; y <= 6; y++) {
      for (let x = 10; x <= 14; x++) {
        grid[y][x] = TILES.FLOOR;
      }
    }

    const gateId = `gate_${cx}_${cy}`;
    const keyId = `key_${cx}_${cy}`;

    // Place Runic Gate at vault entrance
    const gateUnlocked = this.unlockedGates.has(gateId);
    grid[4][9] = gateUnlocked ? TILES.FLOOR : TILES.RUNE_GATE;
    gates.push({
      id: gateId,
      keyId,
      tileX: 9,
      tileY: 4,
      x: worldX + 9 * TILE_SIZE + 25,
      y: worldY + 4 * TILE_SIZE + 25,
      isUnlocked: gateUnlocked
    });

    // Place the Rune Key in opposite bottom-left quadrant
    for (let y = 10; y <= 13; y++) {
      for (let x = 2; x <= 5; x++) {
        grid[y][x] = TILES.FLOOR;
      }
    }

    if (!this.collectedKeys.has(keyId)) {
      keys.push({
        id: keyId,
        gateId,
        x: worldX + 3 * TILE_SIZE + 25,
        y: worldY + 11 * TILE_SIZE + 25,
        radius: 12,
        isCollected: false
      });
    }
  }

  // Carve an Ancient Rune Riddle Chamber (3 interactive floor glyphs + inscription clue tablet)
  carveRuneRiddle(grid, rng, riddles, cx, cy, worldX, worldY) {
    // Open central puzzle sanctum
    for (let y = 3; y <= 12; y++) {
      for (let x = 3; x <= 12; x++) {
        grid[y][x] = TILES.FLOOR;
      }
    }

    // Four corner decorative pillars
    grid[4][4] = TILES.WALL;
    grid[4][11] = TILES.WALL;
    grid[11][4] = TILES.WALL;
    grid[11][11] = TILES.WALL;

    const riddleId = `riddle_${cx}_${cy}`;
    const solved = this.solvedRiddles.has(riddleId);

    // Inscribed Tablet in north wall alcove
    const tabX = worldX + 7 * TILE_SIZE + 25;
    const tabY = worldY + 4 * TILE_SIZE + 25;

    // 3 Glyph tiles on the floor in a celestial triangle
    const glyphs = [
      { id: 'moon', rune: '🌙', name: 'Lunar Sigil', tileX: 5, tileY: 9, x: worldX + 5 * TILE_SIZE + 25, y: worldY + 9 * TILE_SIZE + 25, radius: 24, state: solved ? 'correct' : 'idle', lastStepTime: 0 },
      { id: 'star', rune: '⭐', name: 'Astral Sigil', tileX: 8, tileY: 10, x: worldX + 8 * TILE_SIZE + 25, y: worldY + 10 * TILE_SIZE + 25, radius: 24, state: solved ? 'correct' : 'idle', lastStepTime: 0 },
      { id: 'sun', rune: '☀️', name: 'Solar Sigil', tileX: 10, tileY: 9, x: worldX + 10 * TILE_SIZE + 25, y: worldY + 9 * TILE_SIZE + 25, radius: 24, state: solved ? 'correct' : 'idle', lastStepTime: 0 }
    ];

    // Mark tiles as GLYPH_TILE on grid
    glyphs.forEach(g => {
      grid[g.tileY][g.tileX] = TILES.GLYPH_TILE;
    });

    const riddleData = {
      id: riddleId,
      cx,
      cy,
      tablet: {
        x: tabX,
        y: tabY,
        radius: 24,
        name: 'ANCIENT RIDDLE TABLET',
        text: 'The cosmos flows: Moon (🌙) ➔ Star (⭐) ➔ Sun (☀️)'
      },
      sequence: ['moon', 'star', 'sun'],
      currentStep: 0,
      solved,
      rewardX: worldX + 7 * TILE_SIZE + 25,
      rewardY: worldY + 7 * TILE_SIZE + 25,
      rewardSpawned: solved,
      tiles: glyphs
    };

    this.riddles.set(riddleId, riddleData);
    riddles.push(riddleData);
  }

  // Update exploration based on player's position
  updateExploration(playerX, playerY, radius = 800) {
    const minCx = Math.floor((playerX - radius) / CHUNK_SIZE);
    const maxCx = Math.floor((playerX + radius) / CHUNK_SIZE);
    const minCy = Math.floor((playerY - radius) / CHUNK_SIZE);
    const maxCy = Math.floor((playerY + radius) / CHUNK_SIZE);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        this.getChunk(cx, cy);
        this.exploredChunks.add(`${cx},${cy}`);
      }
    }
  }

  // Fast tile lookup from world coordinates
  getTileAt(worldX, worldY) {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);

    const relX = worldX - chunk.worldX;
    const relY = worldY - chunk.worldY;
    const tx = Math.floor(relX / TILE_SIZE);
    const ty = Math.floor(relY / TILE_SIZE);

    if (tx < 0 || tx >= TILES_PER_CHUNK || ty < 0 || ty >= TILES_PER_CHUNK) {
      return TILES.WALL;
    }
    return chunk.grid[ty][tx];
  }

  // Checks if tile blocks entity movement
  isSolidTile(worldX, worldY) {
    const type = this.getTileAt(worldX, worldY);
    return (type === TILES.WALL || type === TILES.CRACKED_WALL || type === TILES.RUNE_GATE || type === TILES.CHASM);
  }

  // Circle vs Tile AABB Collision Resolution (Smooth sliding physics)
  resolveEntityCollisions(entity) {
    const r = entity.radius;
    const cxMin = Math.floor((entity.x - r - 10) / CHUNK_SIZE);
    const cxMax = Math.floor((entity.x + r + 10) / CHUNK_SIZE);
    const cyMin = Math.floor((entity.y - r - 10) / CHUNK_SIZE);
    const cyMax = Math.floor((entity.y + r + 10) / CHUNK_SIZE);

    for (let cx = cxMin; cx <= cxMax; cx++) {
      for (let cy = cyMin; cy <= cyMax; cy++) {
        const chunk = this.getChunk(cx, cy);

        // Tile coordinates to check
        const tStartCol = Math.max(0, Math.floor((entity.x - r - chunk.worldX) / TILE_SIZE));
        const tEndCol = Math.min(TILES_PER_CHUNK - 1, Math.floor((entity.x + r - chunk.worldX) / TILE_SIZE));
        const tStartRow = Math.max(0, Math.floor((entity.y - r - chunk.worldY) / TILE_SIZE));
        const tEndRow = Math.min(TILES_PER_CHUNK - 1, Math.floor((entity.y + r - chunk.worldY) / TILE_SIZE));

        for (let ty = tStartRow; ty <= tEndRow; ty++) {
          for (let tx = tStartCol; tx <= tEndCol; tx++) {
            const tileType = chunk.grid[ty][tx];

            if (tileType === TILES.WALL || tileType === TILES.CRACKED_WALL || tileType === TILES.RUNE_GATE || tileType === TILES.CHASM) {
              if (tileType === TILES.CHASM && entity.isInvulnerable) {
                continue; // Dash freely across chasms!
              }
              const tileLeft = chunk.worldX + tx * TILE_SIZE;
              const tileTop = chunk.worldY + ty * TILE_SIZE;
              const tileRight = tileLeft + TILE_SIZE;
              const tileBottom = tileTop + TILE_SIZE;

              // Nearest point on AABB to circle center
              const nearestX = Math.max(tileLeft, Math.min(entity.x, tileRight));
              const nearestY = Math.max(tileTop, Math.min(entity.y, tileBottom));

              const diffX = entity.x - nearestX;
              const diffY = entity.y - nearestY;
              const distSq = diffX * diffX + diffY * diffY;

              if (distSq < r * r) {
                const dist = Math.sqrt(distSq);
                if (dist > 0) {
                  const overlap = r - dist;
                  entity.x += (diffX / dist) * overlap;
                  entity.y += (diffY / dist) * overlap;
                } else {
                  // Inside tile center: push outwards
                  entity.x += 1;
                }
              }
            }
          }
        }
      }
    }
  }

  // Damage or break a cracked wall
  damageCrackedWall(worldX, worldY, damage) {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);

    const relX = worldX - chunk.worldX;
    const relY = worldY - chunk.worldY;
    const tx = Math.floor(relX / TILE_SIZE);
    const ty = Math.floor(relY / TILE_SIZE);

    if (tx >= 0 && tx < TILES_PER_CHUNK && ty >= 0 && ty < TILES_PER_CHUNK) {
      if (chunk.grid[ty][tx] === TILES.CRACKED_WALL) {
        const wallId = `${cx}_${cy}_${tx}_${ty}`;
        const wall = chunk.crackedWalls.get(wallId);
        if (wall) {
          wall.hp -= damage;
          window.particleSystem.emitSparks(worldX, worldY, '#cbd5e1', 6, 120);

          if (wall.hp <= 0) {
            // Shatter wall!
            chunk.grid[ty][tx] = TILES.FLOOR;
            this.destroyedCrackedWalls.add(wallId);
            window.soundEngine.playWallBreak();
            window.particleSystem.emitShockwave(worldX, worldY, 50, '#94a3b8', 4);
            window.particleSystem.emitSparks(worldX, worldY, '#64748b', 20, 200);
          }
          return true;
        }
      }
    }
    return false;
  }

  // Smash ceramic urn
  smashUrn(urn) {
    if (urn.isBroken) return;
    urn.isBroken = true;
    this.brokenUrns.add(urn.id);
    window.soundEngine.playShatterUrn();
    window.particleSystem.emitSparks(urn.x, urn.y, '#d97706', 15, 180);

    // Drop loot
    const roll = Math.random();
    const hasSkeletonKey = window.inventory && window.inventory.hasItem('skeleton_key');
    const multiplier = hasSkeletonKey ? 2 : 1;
    if (roll < 0.45) {
      window.gameEngine.pickups.push(new Pickup(urn.x, urn.y, 'xp', 20 * multiplier));
    } else if (roll < 0.70) {
      window.gameEngine.pickups.push(new Pickup(urn.x, urn.y, 'health', 15 * multiplier));
    }
  }

  // Collect Rune Key
  collectKey(key) {
    if (key.isCollected) return;
    key.isCollected = true;
    this.collectedKeys.add(key.id);
    this.playerHasRuneKey = true;
    window.soundEngine.playKeyPickup();
    window.particleSystem.emitShockwave(key.x, key.y, 60, '#fbbf24', 4);
    window.particleSystem.addFloatingText(key.x, key.y, 'RUNE KEY FOUND!', '#fbbf24', true);
  }

  // Unlock Runic Gate
  unlockGate(gate) {
    if (gate.isUnlocked) return;
    gate.isUnlocked = true;
    this.unlockedGates.add(gate.id);
    const hasSkeletonKey = window.inventory && window.inventory.hasItem('skeleton_key');
    if (!hasSkeletonKey) {
      this.playerHasRuneKey = false; // Key consumed
    }

    // Turn gate tile into floor
    const cx = Math.floor(gate.x / CHUNK_SIZE);
    const cy = Math.floor(gate.y / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    chunk.grid[gate.tileY][gate.tileX] = TILES.FLOOR;

    window.soundEngine.playGateOpen();
    window.particleSystem.emitShockwave(gate.x, gate.y, 90, '#38bdf8', 6);
    window.particleSystem.addFloatingText(gate.x, gate.y, hasSkeletonKey ? 'SKELETON KEY BYPASS' : 'GATE UNLOCKED', '#38bdf8', true);
  }

  // Update spike traps and damage entities standing on them
  updateTraps(dt, player, monsters) {
    const nearbyChunks = this.getNearbyChunks(player.x, player.y);

    for (const chunk of nearbyChunks) {
      for (const st of chunk.spikes) {
        st.timer += dt;
        // 3-second cycle: 0..1.8s dormant, 1.8..2.4s warning (amber glow & tick), 2.4..3.0s active spikes
        const cycleTime = st.timer % 3.0;
        const wasWarning = st.isWarning;
        const wasActive = st.isActive;

        st.isWarning = (cycleTime >= 1.8 && cycleTime < 2.4);
        st.isActive = (cycleTime >= 2.4);

        if (!wasWarning && st.isWarning) {
          if (Vec2.dist(st.x, st.y, player.x, player.y) < 550) {
            window.soundEngine.playTrapWarning();
            window.particleSystem.emitSparks(st.x, st.y, '#f59e0b', 4, 70);
          }
        }

        if (!wasActive && st.isActive) {
          if (Vec2.dist(st.x, st.y, player.x, player.y) < 550) {
            window.soundEngine.playSpikeTrap();
            window.particleSystem.emitSparks(st.x, st.y, '#ef4444', 10, 150);
          }
        }

        if (st.isActive) {
          // Damage player (danger!)
          if (Vec2.dist(st.x, st.y, player.x, player.y) < player.radius + 18) {
            player.takeDamage(25 * dt * 3.5);
            if (!st.lastDmgTime || st.timer - st.lastDmgTime > 0.45) {
              st.lastDmgTime = st.timer;
              window.particleSystem.addFloatingText(player.x, player.y, 'TRAP! -25', '#ef4444', true);
            }
          }
          // Damage monsters (reward smart trap luring!)
          if (monsters) {
            for (const m of monsters) {
              if (!m.isDead && Vec2.dist(st.x, st.y, m.x, m.y) < m.radius + 18) {
                m.takeDamage(80 * dt * 3.5, false, 'physical');
              }
            }
          }
        }
      }
    }
  }

  // Update Ancient Rune Riddles: stepping on glyph tiles in correct sequence
  updateRiddles(dt, player) {
    const nearbyChunks = this.getNearbyChunks(player.x, player.y);
    const now = Date.now() / 1000;

    for (const chunk of nearbyChunks) {
      if (!chunk.riddles) continue;
      for (const riddle of chunk.riddles) {
        if (riddle.solved) continue;

        for (const tile of riddle.tiles) {
          const d = Vec2.dist(player.x, player.y, tile.x, tile.y);
          if (d < tile.radius + player.radius) {
            if (tile.state !== 'correct' && now - tile.lastStepTime > 1.2) {
              tile.lastStepTime = now;

              const expectedRune = riddle.sequence[riddle.currentStep];
              if (tile.id === expectedRune) {
                // Correct sequence step!
                tile.state = 'correct';
                riddle.currentStep++;
                window.soundEngine.playPuzzleStep(riddle.currentStep);
                window.particleSystem.emitSparks(tile.x, tile.y, '#38bdf8', 12, 140);
                window.particleSystem.addFloatingText(tile.x, tile.y, `${tile.rune} RESONANCE!`, '#38bdf8', true);

                if (riddle.currentStep >= riddle.sequence.length) {
                  // Riddle Solved!
                  riddle.solved = true;
                  this.solvedRiddles.add(riddle.id);
                  window.soundEngine.playPuzzleSuccess();
                  window.particleSystem.emitShockwave(riddle.rewardX, riddle.rewardY, 130, '#22c55e', 6);
                  window.particleSystem.addFloatingText(riddle.rewardX, riddle.rewardY, '✦ RIDDLE SOLVED! ✦', '#22c55e', true);

                  if (this.isTutorial) {
                    this.openTutorialDoor(6);
                  } else {
                    // Normal mode: spawn celestial reward chest & shards
                    if (!riddle.rewardSpawned) {
                      riddle.rewardSpawned = true;
                      chunk.pois.push({
                        id: `poi_riddle_${riddle.id}`,
                        type: 'chest',
                        chestType: 'legendary',
                        x: riddle.rewardX,
                        y: riddle.rewardY,
                        radius: 20,
                        name: 'CELESTIAL RIDDLE CACHE',
                        isOpened: false
                      });
                      if (window.gameEngine && typeof window.gameEngine.spawnResonanceShards === 'function') {
                        window.gameEngine.spawnResonanceShards(riddle.rewardX, riddle.rewardY, 35);
                      }
                    }
                  }
                }
              } else {
                // Wrong sequence step!
                tile.state = 'wrong';
                window.soundEngine.playPuzzleFail();
                player.takeDamage(10);
                window.particleSystem.emitSparks(tile.x, tile.y, '#ef4444', 16, 160);
                window.particleSystem.addFloatingText(player.x, player.y, 'WRONG RUNE! -10', '#ef4444', true);

                // Reset sequence after brief flash
                setTimeout(() => {
                  riddle.currentStep = 0;
                  riddle.tiles.forEach(t => { t.state = 'idle'; });
                }, 450);
              }
            }
          }
        }
      }
    }
  }

  getNearbyChunks(worldX, worldY) {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        result.push(this.getChunk(cx + dx, cy + dy));
      }
    }
    return result;
  }

  getNearbyPOIs(viewX, viewY, viewW, viewH) {
    const minCx = Math.floor((viewX - 100) / CHUNK_SIZE);
    const maxCx = Math.floor((viewX + viewW + 100) / CHUNK_SIZE);
    const minCy = Math.floor((viewY - 100) / CHUNK_SIZE);
    const maxCy = Math.floor((viewY + viewH + 100) / CHUNK_SIZE);

    const nearby = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.getChunk(cx, cy);
        for (const poi of chunk.pois) nearby.push(poi);
      }
    }
    return nearby;
  }

  getClosestUndiscoveredPOI(playerX, playerY) {
    let closest = null;
    let minDist = Infinity;
    const { cx: pCx, cy: pCy } = this.getChunkCoords(playerX, playerY);

    for (let cx = pCx - 3; cx <= pCx + 3; cx++) {
      for (let cy = pCy - 3; cy <= pCy + 3; cy++) {
        const chunk = this.getChunk(cx, cy);
        for (const poi of chunk.pois) {
          const isDone = poi.isOpened || poi.isCleared || poi.isUsed;
          if (!isDone) {
            const d = Math.hypot(poi.x - playerX, poi.y - playerY);
            if (d < minDist) {
              minDist = d;
              closest = { ...poi, distance: d };
            }
          }
        }
      }
    }
    return closest;
  }

  openChest(poiId) {
    this.openedChests.add(poiId);
    for (const chunk of this.chunks.values()) {
      const p = chunk.pois.find(item => item.id === poiId);
      if (p) p.isOpened = true;
    }
  }

  clearShrine(poiId) {
    this.clearedShrines.add(poiId);
    for (const chunk of this.chunks.values()) {
      const p = chunk.pois.find(item => item.id === poiId);
      if (p) {
        p.isCleared = true;
        p.isUsed = true;
        p.isActive = false;
      }
    }
  }

  useWell(poiId) {
    this.usedWells.add(poiId);
    for (const chunk of this.chunks.values()) {
      const p = chunk.pois.find(item => item.id === poiId);
      if (p) p.isUsed = true;
    }
  }

  setupTutorial() {
    this.reset();
    this.isTutorial = true;

    for (let cxi = 0; cxi < 4; cxi++) {
      const cx = cxi;
      const cy = 0;
      const worldX = cx * CHUNK_SIZE;
      const worldY = 0;
      const key = `${cx},${cy}`;

      const grid = Array.from({ length: TILES_PER_CHUNK }, () => 
        Array(TILES_PER_CHUNK).fill(TILES.WALL)
      );
      const urns = [];
      const keys = [];
      const gates = [];
      const spikes = [];
      const pois = [];
      const crackedWalls = new Map();
      const riddles = [];

      // Open horizontal main corridor (rows 6, 7, 8, 9)
      for (let y = 6; y <= 9; y++) {
        for (let x = 0; x < 16; x++) {
          grid[y][x] = TILES.FLOOR;
        }
      }

      if (cx === 0) {
        // Room 1 (Start Dais): x: 1..6, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 1; x <= 6; x++) grid[y][x] = TILES.FLOOR;
        }
        // Room 2 (Target Range): x: 8..14, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 8; x <= 14; x++) grid[y][x] = TILES.FLOOR;
        }
        // 3 Training Urns
        urns.push(
          { id: 'tut_urn_1', x: worldX + 11 * TILE_SIZE + 25, y: worldY + 6 * TILE_SIZE + 25, radius: 14, isBroken: false },
          { id: 'tut_urn_2', x: worldX + 11 * TILE_SIZE + 25, y: worldY + 7 * TILE_SIZE + 25, radius: 14, isBroken: false },
          { id: 'tut_urn_3', x: worldX + 11 * TILE_SIZE + 25, y: worldY + 8 * TILE_SIZE + 25, radius: 14, isBroken: false }
        );
        // Doorway 2 (locked until urns shattered)
        for (let y = 6; y <= 9; y++) grid[y][15] = TILES.WALL;

      } else if (cx === 1) {
        // Room 3 (Void Dash Trench): x: 1..7, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 1; x <= 7; x++) grid[y][x] = TILES.FLOOR;
        }
        // 2-tile wide Void Chasm at x: 4 and 5
        for (let y = 5; y <= 10; y++) {
          grid[y][4] = TILES.CHASM;
          grid[y][5] = TILES.CHASM;
        }
        // Room 4 (Demolition): x: 9..14, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 9; x <= 14; x++) grid[y][x] = TILES.FLOOR;
        }
        // Cracked secret wall at x: 12
        for (let y = 6; y <= 9; y++) {
          grid[y][12] = TILES.CRACKED_WALL;
          const wid = `${cx}_0_12_${y}`;
          crackedWalls.set(wid, { hp: 40, maxHp: 40, x: worldX + 12 * TILE_SIZE + 25, y: worldY + y * TILE_SIZE + 25 });
        }

      } else if (cx === 2) {
        // Room 5 (Spike Trap & Training Dummy): x: 1..6, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 1; x <= 6; x++) grid[y][x] = TILES.FLOOR;
        }
        // Spike traps
        grid[7][3] = TILES.SPIKE_TRAP;
        grid[8][3] = TILES.SPIKE_TRAP;
        spikes.push(
          { tileX: 3, tileY: 7, x: worldX + 3 * TILE_SIZE + 25, y: worldY + 7 * TILE_SIZE + 25, timer: 0.6, isWarning: false, isActive: false },
          { tileX: 3, tileY: 8, x: worldX + 3 * TILE_SIZE + 25, y: worldY + 8 * TILE_SIZE + 25, timer: 0.6, isWarning: false, isActive: false }
        );
        // Doorway 5 (locked until dummy defeated)
        for (let y = 6; y <= 9; y++) grid[y][7] = TILES.WALL;

        // Room 6 (Ancient Rune Riddle): x: 9..14, y: 4..11
        for (let y = 4; y <= 11; y++) {
          for (let x = 9; x <= 14; x++) grid[y][x] = TILES.FLOOR;
        }
        // Inscription tablet & 3 glyphs
        const tabX = worldX + 11 * TILE_SIZE + 25;
        const tabY = worldY + 5 * TILE_SIZE + 25;
        const glyphs = [
          { id: 'moon', rune: '🌙', name: 'Lunar Sigil', tileX: 10, tileY: 8, x: worldX + 10 * TILE_SIZE + 25, y: worldY + 8 * TILE_SIZE + 25, radius: 24, state: 'idle', lastStepTime: 0 },
          { id: 'star', rune: '⭐', name: 'Astral Sigil', tileX: 11, tileY: 9, x: worldX + 11 * TILE_SIZE + 25, y: worldY + 9 * TILE_SIZE + 25, radius: 24, state: 'idle', lastStepTime: 0 },
          { id: 'sun', rune: '☀️', name: 'Solar Sigil', tileX: 12, tileY: 8, x: worldX + 12 * TILE_SIZE + 25, y: worldY + 8 * TILE_SIZE + 25, radius: 24, state: 'idle', lastStepTime: 0 }
        ];
        glyphs.forEach(g => { grid[g.tileY][g.tileX] = TILES.GLYPH_TILE; });

        const tutRiddle = {
          id: 'tut_riddle',
          cx,
          cy,
          tablet: {
            x: tabX,
            y: tabY,
            radius: 24,
            name: 'ANCIENT RIDDLE TABLET',
            text: 'The cosmos flows: Moon (🌙) ➔ Star (⭐) ➔ Sun (☀️)'
          },
          sequence: ['moon', 'star', 'sun'],
          currentStep: 0,
          solved: false,
          rewardX: worldX + 11 * TILE_SIZE + 25,
          rewardY: worldY + 7 * TILE_SIZE + 25,
          rewardSpawned: false,
          tiles: glyphs
        };
        this.riddles.set('tut_riddle', tutRiddle);
        riddles.push(tutRiddle);

        // Doorway 6 (locked until riddle solved)
        for (let y = 6; y <= 9; y++) grid[y][15] = TILES.WALL;

      } else if (cx === 3) {
        // Room 7 (Relic Forge): x: 1..6, y: 5..10
        for (let y = 5; y <= 10; y++) {
          for (let x = 1; x <= 6; x++) grid[y][x] = TILES.FLOOR;
        }
        // Training Relic Chest
        pois.push({
          id: 'tut_chest',
          type: 'chest',
          chestType: 'legendary',
          x: worldX + 3 * TILE_SIZE + 25,
          y: worldY + 7 * TILE_SIZE + 25,
          radius: 20,
          name: 'TRAINING RELIC CHEST',
          isOpened: false
        });

        // Room 8 (Runic Gate & Abyss Portal): x: 8..14, y: 4..11
        for (let y = 4; y <= 11; y++) {
          for (let x = 8; x <= 14; x++) grid[y][x] = TILES.FLOOR;
        }
        // Golden Rune Key in top alcove
        keys.push({
          id: 'tut_key',
          gateId: 'tut_gate',
          x: worldX + 9 * TILE_SIZE + 25,
          y: worldY + 5 * TILE_SIZE + 25,
          radius: 14,
          isCollected: false
        });

        // Locked Runic Gate
        grid[7][11] = TILES.RUNE_GATE;
        grid[8][11] = TILES.RUNE_GATE;
        gates.push({
          id: 'tut_gate',
          keyId: 'tut_key',
          tileX: 11,
          tileY: 7,
          x: worldX + 11 * TILE_SIZE + 25,
          y: worldY + 7 * TILE_SIZE + 25,
          isUnlocked: false
        });

        // Descent Portal Dais
        this.tutorialPortal = {
          x: worldX + 13 * TILE_SIZE + 25,
          y: worldY + 7 * TILE_SIZE + 25,
          radius: 35
        };
      }

      this.chunks.set(key, {
        cx,
        cy,
        worldX,
        worldY,
        biome: BIOMES.OUTSKIRTS,
        grid,
        urns,
        keys,
        gates,
        spikes,
        pois,
        crackedWalls,
        riddles
      });
    }
  }

  openTutorialDoor(doorIndex) {
    if (doorIndex === 2) {
      const c0 = this.getChunk(0, 0);
      for (let y = 6; y <= 9; y++) c0.grid[y][15] = TILES.FLOOR;
      window.soundEngine.playGateOpen();
      window.particleSystem.emitShockwave(800, 400, 100, '#38bdf8', 6);
    } else if (doorIndex === 5) {
      const c2 = this.getChunk(2, 0);
      for (let y = 6; y <= 9; y++) c2.grid[y][7] = TILES.FLOOR;
      window.soundEngine.playGateOpen();
      window.particleSystem.emitShockwave(2 * CHUNK_SIZE + 7 * TILE_SIZE + 25, 400, 100, '#38bdf8', 6);
    } else if (doorIndex === 6) {
      const c2 = this.getChunk(2, 0);
      for (let y = 6; y <= 9; y++) c2.grid[y][15] = TILES.FLOOR;
      window.soundEngine.playGateOpen();
      window.particleSystem.emitShockwave(3 * CHUNK_SIZE, 400, 100, '#38bdf8', 6);
    } else if (doorIndex === 7) {
      const c3 = this.getChunk(3, 0);
      for (let y = 6; y <= 9; y++) c3.grid[y][7] = TILES.FLOOR;
      window.soundEngine.playGateOpen();
      window.particleSystem.emitShockwave(3 * CHUNK_SIZE + 7 * TILE_SIZE + 25, 400, 100, '#38bdf8', 6);
    }
  }

  // --- Rendering Functions ---

  drawTerrain(ctx, camera, width, height) {
    const minCx = Math.floor(camera.x / CHUNK_SIZE);
    const maxCx = Math.floor((camera.x + width) / CHUNK_SIZE);
    const minCy = Math.floor(camera.y / CHUNK_SIZE);
    const maxCy = Math.floor((camera.y + height) / CHUNK_SIZE);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.getChunk(cx, cy);
        const sx = chunk.worldX - camera.x;
        const sy = chunk.worldY - camera.y;

        // Base chunk floor
        ctx.fillStyle = chunk.biome.floorColor;
        ctx.fillRect(sx, sy, CHUNK_SIZE, CHUNK_SIZE);

        // Render floor tile paving stones
        ctx.fillStyle = chunk.biome.floorTileColor;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        for (let ty = 0; ty < TILES_PER_CHUNK; ty++) {
          for (let tx = 0; tx < TILES_PER_CHUNK; tx++) {
            const tile = chunk.grid[ty][tx];
            const px = sx + tx * TILE_SIZE;
            const py = sy + ty * TILE_SIZE;

            if (tile === TILES.FLOOR || tile === TILES.SPIKE_TRAP || tile === TILES.GLYPH_TILE) {
              ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

              // 1. Spike Trap floor plate (3 purposeful states)
              if (tile === TILES.SPIKE_TRAP) {
                const st = chunk.spikes.find(s => s.tileX === tx && s.tileY === ty);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);

                if (st && st.isActive) {
                  // Active state: Lethal crimson spikes
                  ctx.strokeStyle = '#ef4444';
                  ctx.lineWidth = 2.5;
                  ctx.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);

                  ctx.fillStyle = '#f87171';
                  ctx.shadowColor = '#ef4444';
                  ctx.shadowBlur = 8;
                  const spikePositions = [ [px + 14, py + 14], [px + 36, py + 14], [px + 14, py + 36], [px + 36, py + 36], [px + 25, py + 25] ];
                  spikePositions.forEach(([spX, spY]) => {
                    ctx.beginPath();
                    ctx.arc(spX, spY, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                  });
                  ctx.shadowBlur = 0;
                } else if (st && st.isWarning) {
                  // Warning state: Pulsing amber caution plate
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                  ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
                  ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);

                  ctx.fillStyle = '#fbbf24';
                  ctx.font = '700 13px "JetBrains Mono", monospace';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('⚠', px + 25, py + 25);
                } else {
                  // Safe/dormant state: Dark iron grate with crossbars
                  ctx.strokeStyle = '#475569';
                  ctx.lineWidth = 1.5;
                  ctx.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                  ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
                  ctx.beginPath();
                  ctx.moveTo(px + 10, py + 25);
                  ctx.lineTo(px + 40, py + 25);
                  ctx.moveTo(px + 25, py + 10);
                  ctx.lineTo(px + 25, py + 40);
                  ctx.stroke();
                }
              }

              // 2. Ancient Glyph Puzzle Floor Tile
              if (tile === TILES.GLYPH_TILE) {
                let gTile = null;
                if (chunk.riddles) {
                  for (const r of chunk.riddles) {
                    const match = r.tiles.find(t => t.tileX === tx && t.tileY === ty);
                    if (match) { gTile = match; break; }
                  }
                }

                if (gTile) {
                  let borderCol = '#0284c7';
                  let glowCol = '#38bdf8';
                  let fillGlow = 'rgba(56, 189, 248, 0.15)';

                  if (gTile.state === 'correct') {
                    borderCol = '#22c55e';
                    glowCol = '#4ade80';
                    fillGlow = 'rgba(34, 197, 94, 0.35)';
                  } else if (gTile.state === 'wrong') {
                    borderCol = '#ef4444';
                    glowCol = '#f87171';
                    fillGlow = 'rgba(239, 68, 68, 0.35)';
                  }

                  ctx.fillStyle = fillGlow;
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                  ctx.strokeStyle = borderCol;
                  ctx.lineWidth = 2;
                  ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                  ctx.shadowColor = glowCol;
                  ctx.shadowBlur = 8;
                  ctx.font = '18px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(gTile.rune, px + 25, py + 25);
                  ctx.shadowBlur = 0;
                }
              }

            } else if (tile === TILES.CHASM) {
              // Void pit with purple ethereal glow
              ctx.fillStyle = '#020307';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
          }
        }
      }
    }

    // Spawn Sanctuary Dais on the floor at (400, 400)
    const sbx = this.spawnBeacon.x - camera.x;
    const sby = this.spawnBeacon.y - camera.y;
    if (sbx + 300 > 0 && sbx - 300 < width && sby + 300 > 0 && sby - 300 < height) {
      // Soft radial blue floor glow
      const grad = ctx.createRadialGradient(sbx, sby, 15, sbx, sby, this.spawnBeacon.glowRadius);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sbx, sby, this.spawnBeacon.glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Translucent floor magic rings (flat on ground, does not obstruct the player)
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sbx, sby, this.spawnBeacon.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(sbx, sby, this.spawnBeacon.radius - 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Subtle label placed below circle so it never overlaps player
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('✦ SANCTUARY DAIS ✦', sbx, sby + this.spawnBeacon.radius + 8);
      ctx.restore();
    }

    // Tutorial Abyss Descent Portal
    if (this.isTutorial && this.tutorialPortal) {
      const tpx = this.tutorialPortal.x - camera.x;
      const tpy = this.tutorialPortal.y - camera.y;
      if (tpx + 200 > 0 && tpx - 200 < width && tpy + 200 > 0 && tpy - 200 < height) {
        ctx.save();
        const grad = ctx.createRadialGradient(tpx, tpy, 10, tpx, tpy, 60);
        grad.addColorStop(0, 'rgba(192, 132, 252, 0.7)');
        grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tpx, tpy, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(tpx, tpy, 35, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(tpx, tpy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f472b6';
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('🌀 ABYSS DESCENT PORTAL 🌀', tpx, tpy + 42);
        ctx.restore();
      }
    }
  }

  // Draw solid walls, cracked walls, gates, urns, keys, and POIs
  drawObjects(ctx, camera, width, height) {
    const minCx = Math.floor(camera.x / CHUNK_SIZE);
    const maxCx = Math.floor((camera.x + width) / CHUNK_SIZE);
    const minCy = Math.floor(camera.y / CHUNK_SIZE);
    const maxCy = Math.floor((camera.y + height) / CHUNK_SIZE);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.getChunk(cx, cy);
        const sx = chunk.worldX - camera.x;
        const sy = chunk.worldY - camera.y;

        // 1. Draw Maze Walls with 3D Depth
        for (let ty = 0; ty < TILES_PER_CHUNK; ty++) {
          for (let tx = 0; tx < TILES_PER_CHUNK; tx++) {
            const tile = chunk.grid[ty][tx];
            const px = sx + tx * TILE_SIZE;
            const py = sy + ty * TILE_SIZE;

            if (tile === TILES.WALL) {
              // Wall Front Face (depth)
              ctx.fillStyle = chunk.biome.wallFrontColor;
              ctx.fillRect(px, py + 8, TILE_SIZE, TILE_SIZE - 8);

              // Wall Top Surface
              ctx.fillStyle = chunk.biome.wallTopColor;
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE - 8);

              // Top highlight border
              ctx.strokeStyle = chunk.biome.wallBorderColor;
              ctx.lineWidth = 1.2;
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE - 8);

            } else if (tile === TILES.CRACKED_WALL) {
              // Cracked Wall (Destructible)
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

              // Crack zig-zag symbol
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px + 10, py + 10);
              ctx.lineTo(px + 24, py + 26);
              ctx.lineTo(px + 20, py + 34);
              ctx.lineTo(px + 38, py + 42);
              ctx.stroke();

            } else if (tile === TILES.RUNE_GATE) {
              // Locked Runic Gate
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

              // Glowing energy bars
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3;
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 10;
              for (let bar = 10; bar < TILE_SIZE; bar += 10) {
                ctx.beginPath();
                ctx.moveTo(px + bar, py);
                ctx.lineTo(px + bar, py + TILE_SIZE);
                ctx.stroke();
              }
              ctx.shadowBlur = 0;
            }
          }
        }

        // 2. Draw Destructible Urns
        for (const urn of chunk.urns) {
          if (urn.isBroken) continue;
          const ux = urn.x - camera.x;
          const uy = urn.y - camera.y;

          ctx.save();
          // Drop shadow
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.ellipse(ux + 2, uy + 8, urn.radius, urn.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Ceramic Body
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ux, uy, urn.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Gold decorative rune
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(ux, uy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 3. Draw Rune Keys
        for (const key of chunk.keys) {
          if (key.isCollected) continue;
          const kx = key.x - camera.x;
          const ky = key.y - camera.y;

          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;

          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🗝️', kx, ky);
          ctx.restore();
        }

        // 4. Draw POIs (Chests, Shrines)
        for (const poi of chunk.pois) {
          const sx = poi.x - camera.x;
          const sy = poi.y - camera.y;

          ctx.save();
          if (poi.type === 'chest') {
            const isOpened = poi.isOpened;
            ctx.fillStyle = isOpened ? '#334155' : (poi.chestType === 'void' ? '#ec4899' : poi.chestType === 'rare' ? '#38bdf8' : '#fbbf24');
            ctx.strokeStyle = isOpened ? '#475569' : '#ffffff';
            ctx.lineWidth = 2;

            ctx.fillRect(sx - 16, sy - 12, 32, 24);
            ctx.strokeRect(sx - 16, sy - 12, 32, 24);

            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isOpened ? '📭' : '📦', sx, sy);
          } else if (poi.type === 'shrine_combat') {
            const isDone = poi.isCleared;
            ctx.fillStyle = isDone ? '#1e293b' : '#31102f';
            ctx.strokeStyle = isDone ? '#475569' : (poi.isActive ? '#ef4444' : '#c084fc');
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(sx, sy, poi.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚔️', sx, sy);
          } else if (poi.type === 'shrine_blood') {
            const isDone = poi.isUsed;
            ctx.fillStyle = isDone ? '#1e293b' : '#3b0d0c';
            ctx.strokeStyle = isDone ? '#475569' : '#f87171';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(sx, sy, poi.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🩸', sx, sy);
          } else if (poi.type === 'well_healing') {
            const isDone = poi.isUsed;
            ctx.fillStyle = isDone ? '#1e293b' : '#042f2e';
            ctx.strokeStyle = isDone ? '#475569' : '#2dd4bf';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(sx, sy, poi.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💖', sx, sy);
          } else if (poi.type && poi.type.startsWith('shrine_boss_')) {
            const isDone = poi.isCleared;
            const time = Date.now() * 0.0025;

            // 1. Outer runic summoning circle
            ctx.beginPath();
            ctx.arc(sx, sy, poi.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = isDone ? '#475569' : poi.color;
            ctx.lineWidth = 2.5;
            ctx.setLineDash(isDone ? [] : [10, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Heavy Obsidian Altar Dais
            ctx.fillStyle = isDone ? '#0f172a' : '#090d16';
            ctx.beginPath();
            ctx.arc(sx, sy, poi.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = isDone ? '#334155' : poi.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 3. Rotating elemental runes around dais
            if (!isDone) {
              const runes = 3;
              for (let r = 0; r < runes; r++) {
                const rAngle = time + (r / runes) * Math.PI * 2;
                const rx = sx + Math.cos(rAngle) * (poi.radius - 8);
                const ry = sy + Math.sin(rAngle) * (poi.radius - 8);
                ctx.beginPath();
                ctx.arc(rx, ry, 4, 0, Math.PI * 2);
                ctx.fillStyle = poi.color;
                ctx.shadowColor = poi.color;
                ctx.shadowBlur = 8;
                ctx.fill();
              }
            }

            // 4. Central Sigil Icon
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isDone ? '🪦' : poi.sigil, sx, sy - 2);

            // 5. Overhead Altar Title Tag
            ctx.font = '800 10px "JetBrains Mono", monospace';
            ctx.fillStyle = isDone ? '#22c55e' : poi.color;
            ctx.shadowColor = isDone ? 'transparent' : poi.color;
            ctx.shadowBlur = isDone ? 0 : 6;
            ctx.fillText(isDone ? '👑 DEFEATED' : `👑 ${poi.bossName.toUpperCase()}`, sx, sy - poi.radius - 12);
          }
          ctx.restore();
        }

        // 5. Draw Ancient Riddle Inscription Tablets
        if (chunk.riddles) {
          for (const riddle of chunk.riddles) {
            const tab = riddle.tablet;
            const rx = tab.x - camera.x;
            const ry = tab.y - camera.y;

            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(rx - 18, ry - 22, 36, 44);
            ctx.strokeStyle = riddle.solved ? '#22c55e' : '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(rx - 18, ry - 22, 36, 44);

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📜', rx, ry - 4);

            ctx.fillStyle = riddle.solved ? '#4ade80' : '#7dd3fc';
            ctx.font = '700 9px "JetBrains Mono", monospace';
            ctx.fillText(riddle.solved ? 'SOLVED' : 'RIDDLE', rx, ry + 14);
            ctx.restore();
          }
        }
      }
    }
  }

  // Fog of War Darkness Mask with dynamic torchlight
  drawFogOfWar(ctx, camera, width, height, playerX, playerY, lightRadius = null) {
    ctx.save();
    const plx = playerX - camera.x;
    const ply = playerY - camera.y;

    let rad = lightRadius;
    if (rad === null || rad === undefined) {
      rad = (window.inventory && window.inventory.hasItem('dungeon_lantern')) ? 680 : 450;
    }

    const maskGrad = ctx.createRadialGradient(plx, ply, 70, plx, ply, rad);
    maskGrad.addColorStop(0, 'rgba(4, 6, 12, 0)');
    maskGrad.addColorStop(0.65, 'rgba(4, 6, 12, 0.45)');
    maskGrad.addColorStop(0.9, 'rgba(4, 6, 12, 0.88)');
    maskGrad.addColorStop(1, 'rgba(4, 6, 12, 0.98)');

    ctx.fillStyle = maskGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

// Global world singleton
window.worldManager = new WorldManager();
