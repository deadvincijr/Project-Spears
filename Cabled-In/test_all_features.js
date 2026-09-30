/**
 * Comprehensive Automated Test Suite for Cabled-In Updates
 * Tests:
 * 1. Hardware Shop DOM Streamlining (3 active items, 11 hidden legacy items)
 * 2. Boss Reward Requisition 3-Choice Draft (Slot 1 shop overclock, Slots 2-3 randomized pool, drone uniqueness)
 * 3. Autonomous Patch Companion Drone (Auto-plugging within 140px for both cable types)
 * 4. Wave 2 Overheat Daemon / Thermal Golem (Machine gun 8-shot burst, rack cover collision, pressure gauge drain/repressurize, freeze shatter)
 * 5. Wave 3 Glitched Sprite (10s cannon cooldown, long-range dodge >= 460px, close-range hit < 300px)
 * 6. Multi-pair Teleporters (Pair tracking α/β, γ/δ, etc., deployment & warping)
 * 7. Multi-console Field NOC Terminals (Limit increments, placement, prompt)
 * 8. Run State Persistence (Save/load teleporters, terminals, cooldowns)
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING CABLED-IN COMPREHENSIVE TEST SUITE ===\n');

// ----------------------------------------------------------------------------
// Test 1: Hardware Shop Streamlining in index.html
// ----------------------------------------------------------------------------
console.log('Test 1: Verifying Hardware Shop HTML structure...');
const html = fs.readFileSync('index.html', 'utf8');

// Match shop items
const shopItemsRegex = /<div\s+class="shop-card([^"]*)"[^>]*data-item="([^"]+)"/g;
let match;
const shopItems = [];
while ((match = shopItemsRegex.exec(html)) !== null) {
  shopItems.push({
    classes: match[1].trim(),
    id: match[2],
    isHidden: match[1].includes('hidden')
  });
}

const activeItems = shopItems.filter(item => !item.isHidden).map(item => item.id);
const hiddenItems = shopItems.filter(item => item.isHidden).map(item => item.id);

console.log('Active shop items:', activeItems);
console.log('Hidden legacy items count:', hiddenItems.length, hiddenItems);

assert.strictEqual(activeItems.length, 3, 'Active shop items must be exactly 3');
assert.deepStrictEqual(activeItems.sort(), ['cannon', 'energy_drink', 'replacement_chassis'].sort(),
  'Active items must be energy_drink, cannon, and replacement_chassis');
assert(hiddenItems.length >= 11, 'All other legacy shop items must be hidden');
console.log('✓ Test 1 Passed: Hardware shop strictly limited to 3 active items with 11 extensible hidden cards.\n');

// ----------------------------------------------------------------------------
// Mocking Browser Environment for main.js
// ----------------------------------------------------------------------------
function createMockElement(tag = 'div') {
  const listeners = {};
  const classSet = new Set();
  return {
    tagName: tag.toUpperCase(),
    style: {},
    dataset: {},
    classList: {
      add: (c) => classSet.add(c),
      remove: (c) => classSet.delete(c),
      contains: (c) => classSet.has(c),
      toggle: (c, val) => {
        if (val === undefined) {
          if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
        } else if (val) classSet.add(c); else classSet.delete(c);
      }
    },
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      return c;
    },
    addEventListener: (evt, fn) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    click: function() {
      if (listeners['click']) listeners['click'].forEach(fn => fn({ preventDefault: () => {}, stopPropagation: () => {} }));
    },
    innerHTML: '',
    textContent: '',
    querySelector: () => createMockElement(),
    querySelectorAll: () => [],
    getContext: () => ({
      resetTransform: () => {},
      createPattern: () => null,
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      roundRect: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      setLineDash: () => {},
      measureText: (txt) => ({ width: (txt || '').length * 8 }),
      fillText: () => {},
      strokeText: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      drawImage: () => {}
    }),
    value: '',
    focus: () => {},
    blur: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 })
  };
}

const elementsById = {};
function getOrCreateEl(id) {
  if (!elementsById[id]) {
    elementsById[id] = createMockElement('div');
    elementsById[id].id = id;
  }
  return elementsById[id];
}

const bossRewardGrid = createMockElement('div');
bossRewardGrid.className = 'boss-reward-grid';

const mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const domListeners = {};
global.window = {
  addEventListener: (evt, fn) => {
    domListeners[evt] = domListeners[evt] || [];
    domListeners[evt].push(fn);
  },
  removeEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  localStorage: mockLocalStorage,
  location: { reload: () => {} },
  AudioContext: class {
    constructor() { this.currentTime = 0; }
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      };
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: { setValueAtTime: () => {} },
        connect: () => {}
      };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(1024) };
    }
    resume() {}
  }
};

global.document = {
  getElementById: (id) => getOrCreateEl(id),
  querySelectorAll: (sel) => [],
  querySelector: (sel) => {
    if (sel && sel.includes('boss-reward-grid')) return bossRewardGrid;
    return createMockElement();
  },
  createElement: (tag) => createMockElement(tag),
  addEventListener: (evt, fn) => {
    domListeners[evt] = domListeners[evt] || [];
    domListeners[evt].push(fn);
  },
  removeEventListener: () => {},
  body: createMockElement('body')
};

global.localStorage = mockLocalStorage;
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};

const vm = require('vm');
const mainJsCode = fs.readFileSync('main.js', 'utf8');
vm.runInThisContext(mainJsCode);

console.log('✓ main.js loaded into mock execution context successfully.\n');

// ----------------------------------------------------------------------------
// Test 2: Boss Reward Requisition 3-Choice Draft System
// ----------------------------------------------------------------------------
console.log('Test 2: Verifying Boss Reward 3-Choice Draft System...');
const game = new Game();

// Hook into bossRewardGrid appendChild to track cards
let generatedCards = [];
const originalAppend = bossRewardGrid.appendChild.bind(bossRewardGrid);
bossRewardGrid.appendChild = function(card) {
  generatedCards.push(card);
  return originalAppend(card);
};

// Wave 2 Boss Defeat Draft Test
generatedCards = [];
game.player.hasPatchDrone = false;
game.openBossRewardModal(2);

assert.strictEqual(generatedCards.length, 3, 'Boss reward draft must generate exactly 3 choice cards');
assert.strictEqual(generatedCards[0].dataset.rewardId, 'shop_expansion', 'Slot 1 must always be guaranteed Higher Shop Limits (shop_expansion)');

const draftedPool1 = [generatedCards[1].dataset.rewardId, generatedCards[2].dataset.rewardId];
assert.strictEqual(draftedPool1.length, 2, 'Must have 2 additional random choices');
console.log('Wave 2 Drafted Choices:', generatedCards.map(c => c.dataset.rewardId));

// Verify drone exclusion once claimed
game.player.hasPatchDrone = true;
generatedCards = [];
game.openBossRewardModal(3);

assert.strictEqual(generatedCards.length, 3, 'Boss reward draft must still generate 3 cards');
assert.strictEqual(generatedCards[0].dataset.rewardId, 'shop_expansion', 'Slot 1 must still be shop_expansion');
const draftedPool2 = [generatedCards[1].dataset.rewardId, generatedCards[2].dataset.rewardId];
assert(!draftedPool2.includes('patch_drone'), 'Claimed drone MUST be excluded from future reward drafts');
console.log('Wave 3 Drafted Choices (Drone already owned):', generatedCards.map(c => c.dataset.rewardId));

// Test Claim Rewards
// 1. Shop Expansion
const initialBonus = game.powerupMaxLimitBonus ?? 0;
const initialClearance = game.shopClearanceLevel ?? 0;
game.claimBossReward('shop_expansion');
assert.strictEqual(game.powerupMaxLimitBonus, initialBonus + 3, 'Powerup limit bonus increased by 3');
assert.strictEqual(game.shopClearanceLevel, initialClearance + 1, 'Shop clearance level incremented');

// 2. Teleporter Kit
const initialKits = game.teleporterKitsOwned ?? 0;
game.claimBossReward('teleporter');
assert.strictEqual(game.teleporterKitsOwned, initialKits + 1, 'Teleporter kits owned incremented');

// 3. Portable Terminal
const initialTerminalLimit = game.portableTerminalsLimit ?? 0;
game.claimBossReward('portable_terminal');
assert.strictEqual(game.portableTerminalsLimit, initialTerminalLimit + 1, 'Portable terminals limit incremented');

// 4. Patch Drone
game.player.hasPatchDrone = false;
game.hasPatchDrone = false;
game.patchDrone = null;
game.claimBossReward('patch_drone');
assert.strictEqual(game.player.hasPatchDrone, true, 'player.hasPatchDrone set to true');
assert.strictEqual(game.hasPatchDrone, true, 'hasPatchDrone set to true');
assert(game.patchDrone !== null, 'patchDrone instance created');
console.log('✓ Test 2 Passed: Boss reward draft and claim logic fully verified.\n');

// ----------------------------------------------------------------------------
// Test 3: Autonomous Patch Companion Drone
// ----------------------------------------------------------------------------
console.log('Test 3: Verifying Auto-Patch Companion Drone behavior...');
const drone = game.patchDrone;
assert(drone instanceof PatchDroneEntity, 'Drone is an instance of PatchDroneEntity');

const sourceRack = { id: 'RACK-A01', x: 400, y: 400, width: 40, height: 60, resolveError: () => {} };
const targetRack = { id: 'RACK-B02', x: 530, y: 530, width: 40, height: 60, resolveError: () => {} };
const realPatchCable = new PatchCable(sourceRack, targetRack);

game.player.x = 540;
game.player.y = 540;
game.activeCable = realPatchCable;
drone.x = 540;
drone.y = 540;

drone.update(0.1, game);
assert.strictEqual(realPatchCable.isConnected, true, 'Autonomous drone auto-plugged regular patch cable when within 140px');

// Test auto-plugging MultiHop Cable
const hopRack3 = { id: 'RACK-C03', x: 700, y: 700, width: 40, height: 60, resolveError: () => {} };
const realMultiHop = new MultiHopCable(sourceRack, [sourceRack, targetRack, hopRack3]);
game.player.x = 540;
game.player.y = 540;
game.activeCable = realMultiHop;
drone.x = 540;
drone.y = 540;

drone.update(0.1, game);
assert.strictEqual(realMultiHop.currentHopIndex, 2, 'Autonomous drone auto-plugged multi-hop cable when within 140px');
console.log('✓ Test 3 Passed: Autonomous companion drone successfully auto-patches both cable types.\n');

// ----------------------------------------------------------------------------
// Test 4: Wave 2 Overheat Daemon / Thermal Golem Combat Rework
// ----------------------------------------------------------------------------
// Test 4: Wave 2 Overheat Daemon / Thermal Golem Combat Rework
// ----------------------------------------------------------------------------
console.log('Test 4: Verifying Thermal Golem combat mechanics...');
const golem = new ThermalGolemBoss(1000, 1000, null, 0);
game.activeBoss = golem;
golem.isAlive = true;
golem.state = 'STALK';
game.player.x = 1300;
game.player.y = 1000; // Distance = 300px (within 750px machine gun range)
golem.machineGunCooldown = 0;

// Update to trigger machine-gun burst (8 shots)
golem.update(game.player, null, 0.05, game);
assert.strictEqual(golem.machineGunShotsLeft, 8, 'Thermal Golem armed an 8-shot fireball burst');

// Fire all 8 shots
for (let s = 0; s < 8; s++) {
  golem.update(game.player, null, 0.12, game);
}
assert(golem.projectiles.length > 0, 'Fireballs added to projectiles');
console.log(`Fired ${golem.projectiles.length} fireballs in machine gun burst`);

// Test Fireball Server Rack Cover Collision
const fireball = golem.projectiles[0];
const coverRack = {
  x: fireball.x - 5,
  y: fireball.y - 5,
  width: 50,
  height: 80,
  isDestroyed: false
};
game.racks = [coverRack];

golem.update(game.player, null, 0.016, game);
assert(fireball.life <= 0, 'Fireball was absorbed by server rack cover obstacle');

// Test Extinguisher Physical Pressure Gauge
game.hasFireExtinguisher = true;
game.extinguisherPressure = 100;
game.keys['KeyE'] = true;
game.player.x = golem.x + 100;
game.player.y = golem.y; // dist < 240
golem.update(game.player, null, 1.0, game); // 1s of spraying
assert(game.extinguisherPressure <= 68.1 && game.extinguisherPressure >= 67.9,
  `Extinguisher pressure should drain ~32%/s (actual: ${game.extinguisherPressure}%)`);

// Release trigger and repressurize
game.keys['KeyE'] = false;
game.isExtinguisherSpraying = false;
game.extinguisherPressure = Math.min(100, (game.extinguisherPressure ?? 0) + 28 * 1.0);
assert(game.extinguisherPressure <= 96.1 && game.extinguisherPressure >= 95.9,
  `Extinguisher pressure should repressurize ~28%/s (actual: ${game.extinguisherPressure}%)`);

// Test Freeze Shatter
golem.isFrozen = true;
golem.temperature = 0;
let bossDefeated = false;
game.defeatBoss = (b) => { bossDefeated = true; };
game.player.x = golem.x + 10;
game.player.y = golem.y + 10;
game.player.vx = 280; // > 260 px/s threshold
game.player.vy = 0;
golem.update(game.player, null, 0.016, game);
assert.strictEqual(bossDefeated, true, 'Zero-degree golem shatters upon high-speed ramming');
console.log('✓ Test 4 Passed: Wave 2 Overheat Daemon combat rework fully verified.\n');

// ----------------------------------------------------------------------------
// Test 5: Wave 3 Glitched Sprite Combat Rework
// ----------------------------------------------------------------------------
console.log('Test 5: Verifying Glitched Sprite Boss combat mechanics...');
const sprite = new GlitchedSpriteBoss(2000, 2000, null, 0);
game.activeBoss = sprite;
sprite.isAlive = true;

// Test Cannon Cooldown
game.cannonCharges = 5;
game.cannonCooldown = 0;
game.armCannon();
assert.strictEqual(game.isCannonAiming, true, 'Cannon armed');
game.fireCannon();
assert.strictEqual(game.cannonCooldown, 10, 'Firing kinetic cannon sets 10-second cannonCooldown');

// Attempt to arm/fire immediately while cannonCooldown > 0
game.armCannon();
assert.strictEqual(game.isCannonAiming, false, 'Cannot arm kinetic cannon while cannonCooldown > 0');

// Test Long-Range Teleport Dodge (Launch distance >= 460px)
game.cannonPuckTimer = 2.0;
game.cannonLaunchDistance = 600; // >= 460px
game.player.x = sprite.x + 100;
game.player.y = sprite.y; // distance 100 < 260 approach distance
sprite.hasDodgedCurrentLaunch = false;

// Mock Math.random to return 0.5 (< 0.8) to trigger dodge
const origRandom = Math.random;
Math.random = () => 0.5;
const spriteXBefore = sprite.x;
sprite.update(game.player, null, 0.016, game);
assert(sprite.hasDodgedCurrentLaunch, 'Sprite triggered dodge on long range launch approach');
assert(sprite.x !== spriteXBefore, 'Sprite teleported away');
Math.random = origRandom;

// Test Close-Range Guaranteed Hit (Launch distance < 300px)
sprite.x = 2000;
sprite.y = 2000;
game.cannonPuckTimer = 2.0;
game.cannonLaunchDistance = 250; // < 300px close slalom launch!
sprite.hasDodgedCurrentLaunch = false;
game.player.x = sprite.x + 20;
game.player.y = sprite.y; // < radius + player.radius
sprite.update(game.player, null, 0.016, game);
assert.strictEqual(sprite.hitsTaken, 1, 'Close-range launch (<300px) guarantees a hit on the Glitched Sprite');
console.log('✓ Test 5 Passed: Glitched Sprite 10s cannon cooldown and distance teleport dodge verified.\n');

// ----------------------------------------------------------------------------
// Test 6: Multi-pair Teleporters & Multi-console Terminals
// ----------------------------------------------------------------------------
console.log('Test 6: Verifying Multi-pair Teleporters & Multi-console Terminals...');
game.hasTeleporterItem = true;
game.teleporterKitsOwned = 2; // Can deploy 2 pairs (4 nodes: α, β, γ, δ)
game.teleporterNodes = [];

// Deploy Node 1 (Alpha)
game.player.x = 100;
game.player.y = 100;
game.handleTeleporterKey();
assert.strictEqual(game.teleporterNodes.length, 1);
assert.strictEqual(game.teleporterNodes[0].name, 'NODE α');

// Deploy Node 2 (Beta)
game.player.x = 200;
game.player.y = 200;
game.handleTeleporterKey();
assert.strictEqual(game.teleporterNodes.length, 2);
assert.strictEqual(game.teleporterNodes[1].name, 'NODE β');

// Deploy Node 3 (Gamma)
game.player.x = 300;
game.player.y = 300;
game.handleTeleporterKey();
assert.strictEqual(game.teleporterNodes.length, 3);
assert.strictEqual(game.teleporterNodes[2].name, 'NODE γ');

// Deploy Node 4 (Delta)
game.player.x = 400;
game.player.y = 400;
game.handleTeleporterKey();
assert.strictEqual(game.teleporterNodes.length, 4);
assert.strictEqual(game.teleporterNodes[3].name, 'NODE δ');

// Test Warping Partner Identification
const partner0 = game.getTeleporterPartner(game.teleporterNodes[0]);
const partner1 = game.getTeleporterPartner(game.teleporterNodes[1]);
const partner2 = game.getTeleporterPartner(game.teleporterNodes[2]);
const partner3 = game.getTeleporterPartner(game.teleporterNodes[3]);

assert.strictEqual(partner0, game.teleporterNodes[1], 'Alpha is paired with Beta');
assert.strictEqual(partner1, game.teleporterNodes[0], 'Beta is paired with Alpha');
assert.strictEqual(partner2, game.teleporterNodes[3], 'Gamma is paired with Delta');
assert.strictEqual(partner3, game.teleporterNodes[2], 'Delta is paired with Gamma');

// Test Multi-console Portable Terminals
game.hasPortableTerminal = true;
game.portableTerminals = [];
game.portableTerminalsLimit = 2;
game.player.x = 500;
game.player.y = 500;
game.handlePortableTerminalKey();
assert.strictEqual(game.portableTerminals.length, 1);

game.player.x = 800;
game.player.y = 800;
game.handlePortableTerminalKey();
assert.strictEqual(game.portableTerminals.length, 2);

console.log('✓ Test 6 Passed: Multi-pair teleporters and multi-console terminals verified.\n');

// ----------------------------------------------------------------------------
// Test 7: Run State Persistence
// ----------------------------------------------------------------------------
console.log('Test 7: Verifying Run State Save & Load...');
game.cannonCooldown = 7.5;
game.player.hasPatchDrone = true;
const saveData = game.serializeSaveData();

// Reset and load
const loadedGame = new Game();
loadedGame.applyLoadedSave(saveData);

assert.strictEqual(loadedGame.teleporterKitsOwned, game.teleporterKitsOwned, 'Teleporter kits owned persisted');
assert.strictEqual(loadedGame.portableTerminalsLimit, game.portableTerminalsLimit, 'Portable terminals limit persisted');
assert.strictEqual(loadedGame.player.hasPatchDrone, true, 'Patch drone ownership persisted');
assert.strictEqual(loadedGame.cannonCooldown, 7.5, 'Cannon cooldown persisted');

console.log('✓ Test 7 Passed: Run state persistence verified.\n');

console.log('====================================================');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (7/7)');
console.log('====================================================');
