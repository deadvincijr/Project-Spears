/**
 * Comprehensive Automated Test Suite for Cabled-In Interactive Tutorial
 * 
 * Tests:
 * 1. Tutorial Module Initialization & State Architecture
 * 2. Step Definitions & 6-Year-Old Explanation Hierarchy
 * 3. Freeze-Frame Logic & Arrow Advancement via Space / Click
 * 4. Error Type Setups (Standard Wire Bus, PIN Lockout, Breaker Reboot, Daisy Chain)
 * 5. South Facility Stations (Terminal Desk, Supplies Closet, IT Supply Depot Shop)
 * 6. Kinetic Cannon Slingshot Freeze & Launch Mechanics
 * 7. Bug Boss Emergence & Rope Restraint Coiling
 * 8. Apex Powerup Choice Walkthrough (3 Sequential Arrows for Teleporter, Portable Terminal, Shop Clearance)
 * 9. Dedicated Powerup Hands-On Training
 * 10. 30-Second Countdown & Comedic All-Server Detonation Climax ("Well it looks like you're ready to go! Good Luck!")
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING CABLED-IN INTERACTIVE TUTORIAL TEST SUITE ===\n');

// Mock Browser Environment
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
    querySelectorAll: () => [createMockElement(), createMockElement(), createMockElement()],
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 80, height: 120, right: 180, bottom: 320 })
  };
}

global.document = {
  getElementById: (id) => createMockElement('div'),
  createElement: (tag) => createMockElement(tag),
  querySelectorAll: () => [createMockElement(), createMockElement(), createMockElement()],
  querySelector: () => createMockElement(),
  body: createMockElement('body')
};

global.window = {
  addEventListener: () => {},
  innerWidth: 1280,
  innerHeight: 720,
  game: null
};

// Load Tutorial Class
const { InteractiveTutorial } = require('./interactive_tutorial.js');

// Mock Game Object
function createMockGame() {
  const racks = [];
  for (let i = 1; i <= 50; i++) {
    racks.push({
      id: `RACK-${i.toString().padStart(2, '0')}`,
      x: (i % 10) * 120 + 100,
      y: Math.floor(i / 10) * 200 + 200,
      width: 40,
      height: 160,
      uptime: 100,
      isFailing: false,
      isDestroyed: false,
      isTargetDestination: false,
      code: '1234',
      triggerCableError: function(target) {
        this.isFailing = true;
        this.error = { type: 'CABLE_DISCONNECT' };
        if (target) target.isTargetDestination = true;
      },
      triggerAuthError: function() {
        this.isFailing = true;
        this.error = { type: 'AUTH_LOCKOUT' };
      },
      triggerHardRebootError: function() {
        this.isFailing = true;
        this.error = { type: 'HARD_REBOOT' };
      },
      triggerMultiChainError: function(hops) {
        this.isFailing = true;
        this.error = { type: 'MULTI_CABLE_CHAIN', hops };
      },
      explode: function(game) {
        this.isDestroyed = true;
        this.isFailing = false;
        this.uptime = 0;
      }
    });
  }

  const game = {
    isTutorialMode: false,
    player: { x: 500, y: 500, vx: 0, vy: 0, hp: 100, width: 32, height: 32 },
    camera: {
      x: 500, y: 500,
      toScreen: (wx, wy) => ({ x: wx - 400, y: wy - 400 })
    },
    racks: racks,
    nocDesk: { x: 500, y: 1500, width: 240, height: 60 },
    shopKiosk: { x: 900, y: 1500, width: 80, height: 60 },
    suppliesCloset: { x: 200, y: 1500, width: 80, height: 60 },
    keys: {},
    credits: 0,
    cannonCharges: 0,
    cannonPuckTimer: 0,
    energyDrinkPurchases: 0,
    magnetPurchases: 0,
    activeBoss: null,
    bugBoss: null,
    bossDefeatedOnce: false,
    sound: {
      init: () => {},
      playBlip: () => {},
      playUpgrade: () => {},
      playLevelUp: () => {},
      playBossAlarm: () => {}
    },
    camera: {
      shake: () => {},
      toScreen: (x, y) => ({ x, y })
    },
    startGame: (id) => {},
    updateCreditsUI: () => {},
    updateActiveAlertsCount: () => {},
    showTemporaryToast: () => {},
    addCredits: function(amt) { this.credits += amt; },
    spawnBoss: function(wave, isDev) {
      this.activeBoss = {
        name: 'Corrupted Bug Boss',
        isAlive: true,
        x: 500, y: 350,
        maxWraps: 3,
        completedWraps: 0
      };
      this.bugBoss = this.activeBoss;
    },
    triggerCatastrophicCascadeGameOver: function() {
      this.isGameOver = true;
    }
  };
  global.window.game = game;
  return game;
}

// ----------------------------------------------------------------------------
// Test 1: Tutorial Initialization & Start
// ----------------------------------------------------------------------------
console.log('Test 1: Verifying InteractiveTutorial initialization...');
const game = createMockGame();
const tutorial = new InteractiveTutorial(game);

assert(tutorial, 'InteractiveTutorial instance must be created');
assert.strictEqual(tutorial.isActive, false, 'Tutorial should not be active initially');

tutorial.start();
assert.strictEqual(tutorial.isActive, true, 'Tutorial must be active after start()');
assert.strictEqual(tutorial.isFrozen, true, 'Tutorial must start in frozen state for explanation');
assert.strictEqual(tutorial.stepIndex, 0, 'Tutorial must start at step index 0');
assert.strictEqual(game.isTutorialMode, true, 'Game isTutorialMode must be true');
console.log('✓ Test 1 Passed: Tutorial initializes and starts correctly.\n');

// ----------------------------------------------------------------------------
// Test 2: Step Definitions & 6-Year-Old Explanation Hierarchy
// ----------------------------------------------------------------------------
console.log('Test 2: Verifying Step Definitions and child-friendly content...');
const steps = tutorial.getStepDefinitions();
assert(steps.length >= 11, `Must have at least 11 comprehensive lessons (found: ${steps.length})`);

const expectedLessons = [
  'moving',
  'braking',
  'bouncing',
  'error_cable',
  'error_pin',
  'error_reboot',
  'error_chain',
  'supplies_closet',
  'shop_upgrade',
  'cannon_charge',
  'bug_boss'
];

expectedLessons.forEach(expectedId => {
  const found = steps.find(s => s.id === expectedId);
  assert(found, `Lesson '${expectedId}' must be defined in step definitions`);
  assert(found.slides.length >= 2, `Lesson '${expectedId}' must have multiple sequential arrows/slides`);
  assert(found.slides.every(s => typeof s.text === 'string' && s.text.length > 10), `Lesson '${expectedId}' slides must contain rich explanation text`);
  assert(found.practice, `Lesson '${expectedId}' must contain a practice objective`);
});
console.log('✓ Test 2 Passed: All 11 core lessons defined with sequential slides and practice criteria.\n');

// ----------------------------------------------------------------------------
// Test 3: Freeze-Frame Logic & Sequential Arrow Advancement
// ----------------------------------------------------------------------------
console.log('Test 3: Verifying arrow advancement via Space / Click and freeze transition...');
assert.strictEqual(tutorial.isFrozen, true, 'Should be frozen on slide 0');
assert.strictEqual(tutorial.subStepIndex, 0, 'Should start at subStepIndex 0');

// Press Space / Click to advance arrow
const handled1 = tutorial.handleInput({ type: 'keydown', key: ' ', code: 'Space' });
assert.strictEqual(handled1, true, 'Space key must be handled to advance arrow');
assert.strictEqual(tutorial.subStepIndex, 1, 'Should advance to subStepIndex 1');
assert.strictEqual(tutorial.isFrozen, true, 'Should remain frozen on slide 1');

// Press Click on final slide to unfreeze into practice phase
tutorial.lastArrowAdvanceTime = 0; // Clear debounce timer for synchronous unit test
const handled2 = tutorial.handleInput({ type: 'click' });
assert.strictEqual(handled2, true, 'Click must be handled on final slide');
assert.strictEqual(tutorial.isFrozen, false, 'Must unfreeze after final arrow slide to allow player practice');
console.log('✓ Test 3 Passed: Sequential arrow progression and unfreeze mechanics verified.\n');

// ----------------------------------------------------------------------------
// Test 4: Error Type Setups
// ----------------------------------------------------------------------------
console.log('Test 4: Verifying setup of all 4 error types (Cable, PIN, Reboot, Chain)...');

// 4A: Cable Disconnect
tutorial.setupCableError();
assert(tutorial.sourceRack, 'Source rack must be assigned for cable error');
assert(tutorial.sourceRack.isFailing, 'Source rack must be failing');
assert.strictEqual(tutorial.sourceRack.error.type, 'CABLE_DISCONNECT', 'Error type must be CABLE_DISCONNECT');

// 4B: PIN Auth Lockout
tutorial.setupAuthError();
assert(tutorial.targetRack, 'Target rack must be assigned for auth error');
assert(tutorial.targetRack.isFailing, 'Target rack must be failing');
assert.strictEqual(tutorial.targetRack.error.type, 'AUTH_LOCKOUT', 'Error type must be AUTH_LOCKOUT');

// 4C: Reboot (Hard Reboot)
tutorial.setupRebootError();
assert(tutorial.targetRack, 'Target rack must be assigned for reboot error');
assert(tutorial.targetRack.isFailing, 'Target rack must be failing');
assert.strictEqual(tutorial.targetRack.error.type, 'HARD_REBOOT', 'Error type must be HARD_REBOOT');

// 4D: Chain Wire (Daisy Chain)
tutorial.setupChainError();
assert(tutorial.sourceRack, 'Source rack must be assigned for chain error');
assert.strictEqual(tutorial.chainHops.length, 3, 'Chain hops must contain 3 connected racks');
assert.strictEqual(tutorial.sourceRack.error.type, 'MULTI_CABLE_CHAIN', 'Error type must be MULTI_CABLE_CHAIN');

console.log('✓ Test 4 Passed: All 4 error types correctly generated and configured.\n');

// ----------------------------------------------------------------------------
// Test 5: South Facility Stations & Upgrades
// ----------------------------------------------------------------------------
console.log('Test 5: Verifying Supplies Closet and Shop upgrades checkpoints...');
// Supplies Closet
tutorial.hasOpenedCloset = true;
const closetStep = steps.find(s => s.id === 'supplies_closet');
assert.strictEqual(closetStep.practice.checkComplete.call(tutorial), true, 'Closet step completes when closet is opened');

// Shop Upgrade
tutorial.hasPurchasedShopItem = true;
const shopStep = steps.find(s => s.id === 'shop_upgrade');
assert.strictEqual(shopStep.practice.checkComplete.call(tutorial), true, 'Shop step completes when upgrade is purchased');
console.log('✓ Test 5 Passed: Station interaction checkpoints verified.\n');

// ----------------------------------------------------------------------------
// Test 6: Kinetic Cannon Slingshot Mechanics
// ----------------------------------------------------------------------------
console.log('Test 6: Verifying Kinetic Cannon practice checkpoint...');
tutorial.hasFiredCannon = true;
const cannonStep = steps.find(s => s.id === 'cannon_charge');
assert.strictEqual(cannonStep.practice.checkComplete.call(tutorial), true, 'Cannon step completes when fired');
console.log('✓ Test 6 Passed: Kinetic Cannon checkpoint verified.\n');

// ----------------------------------------------------------------------------
// Test 7: Bug Boss Emergence & Defeat
// ----------------------------------------------------------------------------
console.log('Test 7: Verifying Bug Boss emergence and defeat trigger...');
tutorial.setupBugBoss();
assert(game.activeBoss, 'Bug Boss must be spawned in game');
assert.strictEqual(game.activeBoss.name, 'Corrupted Bug Boss', 'Boss name must be Corrupted Bug Boss');
assert.strictEqual(game.activeBoss.maxWraps, 3, 'Boss wraps tuned for tutorial');

game.bossDefeatedOnce = true;
const bossStep = steps.find(s => s.id === 'bug_boss');
assert.strictEqual(bossStep.practice.checkComplete.call(tutorial), true, 'Boss step completes on defeat');
console.log('✓ Test 7 Passed: Bug Boss emergence and restraint defeat verified.\n');

// ----------------------------------------------------------------------------
// Test 8: Apex Powerup Requisition Walkthrough (3 Sequential Arrows)
// ----------------------------------------------------------------------------
console.log('Test 8: Verifying 3 Apex Powerup choice walkthrough with sequential arrows...');
tutorial.startPowerupChoiceWalkthrough();
assert.strictEqual(tutorial.isPowerupModalWalkthrough, true, 'Powerup walkthrough must be active');
assert.strictEqual(tutorial.powerupCardArrowIndex, 0, 'Must start at arrow 0 (Teleporter)');

// Advance to Arrow 1 (Portable Terminal)
tutorial.advancePowerupModalArrow();
assert.strictEqual(tutorial.powerupCardArrowIndex, 1, 'Must advance to arrow 1 (Portable Terminal)');

// Advance to Arrow 2 (Shop Clearance)
tutorial.advancePowerupModalArrow();
assert.strictEqual(tutorial.powerupCardArrowIndex, 2, 'Must advance to arrow 2 (Shop Clearance)');

// Final advance unfreezes for player choice
tutorial.advancePowerupModalArrow();
assert.strictEqual(tutorial.isFrozen, false, 'Unfreezes so user can select their chosen card');
console.log('✓ Test 8 Passed: 3-Choice Apex Powerup Walkthrough verified.\n');

// ----------------------------------------------------------------------------
// Test 9: Dedicated Powerup Training
// ----------------------------------------------------------------------------
console.log('Test 9: Verifying hands-on training for chosen powerup...');
// Test 9A: Teleporter chosen
tutorial.onPowerupClaimed('teleporter', true);
assert.strictEqual(tutorial.chosenPowerup, 'teleporter', 'Chosen powerup must be teleporter');
assert.strictEqual(tutorial.isDedicatedPowerupTutorial, true, 'Dedicated tutorial must be active');

// Action 1: Deploy Node Alpha
tutorial.onDedicatedPowerupAction('deploy_alpha');
assert.strictEqual(tutorial.dedicatedPowerupStep, 'place_beta', 'Next step must be place_beta');

// Action 2: Deploy Node Beta
tutorial.onDedicatedPowerupAction('deploy_beta');
assert.strictEqual(tutorial.dedicatedPowerupStep, 'warp_test', 'Next step must be warp_test');

// Action 3: Warp Test
tutorial.onDedicatedPowerupAction('warped');
assert.strictEqual(tutorial.isDedicatedPowerupTutorial, false, 'Dedicated tutorial completed');
assert.strictEqual(tutorial.climaxTimer, 30.0, 'Must initiate 30.0 second countdown to comedic climax');
console.log('✓ Test 9 Passed: Dedicated powerup training steps verified.\n');

// ----------------------------------------------------------------------------
// Test 10: 30-Second Countdown & Comedic Relief Climax
// ----------------------------------------------------------------------------
console.log('Test 10: Verifying 30s countdown and comedic all-server critical explosion cascade...');
assert.strictEqual(tutorial.climaxTimer, 30.0, 'Climax timer must start at 30 seconds');

// Fast-forward 30 seconds
tutorial.update(30.1);
assert.strictEqual(tutorial.isClimaxActive, true, 'Climax must become active after 30 seconds');

// Trigger immediate server catastrophic overload
tutorial.detonateAllServersComedic();

// Verify EVERY single server in warehouse has a critical error!
const allFailing = game.racks.every(r => r.isFailing && r.error.description.includes('MELTDOWN'));
assert.strictEqual(allFailing, true, 'Every server in warehouse must immediately have a critical error');
assert.strictEqual(game.racks.length, 50, 'All 50 servers affected');

// Fast-forward explosion loop until all servers are exploded
for (let i = 0; i < 60; i++) {
  tutorial.updateComedicClimax(0.2);
}

const allDestroyed = game.racks.every(r => r.isDestroyed);
assert.strictEqual(allDestroyed, true, 'Every server must detonate in comedic firework explosion cascade');
assert.strictEqual(game.isGameOver, true, 'Game Over cascade must be triggered');
console.log('✓ Test 10 Passed: Comedic relief climax and 50-server cascade detonation verified.\n');

// ----------------------------------------------------------------------------
// Test 11: Verifying Hydraulic Braking Completion & Feature Gating
// ----------------------------------------------------------------------------
console.log('Test 11: Verifying Spacebar braking completion and component feature gating...');
const testGame = createMockGame();
const tut2 = new InteractiveTutorial(testGame);
tut2.start();

// Starter inventory must have 0 cannon charges and 0 shop credits
assert.strictEqual(testGame.credits, 0, 'Starter credits must be 0 in tutorial');
assert.strictEqual(testGame.cannonCharges, 0, 'Starter cannon charges must be 0 in tutorial');

// Step 0: Moving -> Cannon, Shop, Supplies must all be locked!
assert.strictEqual(tut2.isFeatureAllowed('cannon'), false, 'Cannon must be locked during moving');
assert.strictEqual(tut2.isFeatureAllowed('shop'), false, 'Shop must be locked during moving');
assert.strictEqual(tut2.isFeatureAllowed('supplies'), false, 'Supplies closet must be locked during moving');

// Load Step 1: Braking
tut2.loadStep(1, 0);
assert.strictEqual(tut2.isFeatureAllowed('cannon'), false, 'Cannon must be locked during braking');
assert.strictEqual(tut2.isFeatureAllowed('shop'), false, 'Shop must be locked during braking');

// Advance through slides into practice phase
tut2.advanceArrow(true);
tut2.advanceArrow(true);
assert.strictEqual(tut2.isFrozen, false, 'Must be in practice phase for braking');

// Simulate holding spacebar
testGame.keys['Space'] = true;
testGame.player.vx = 8;
testGame.player.vy = 4;
tut2.update(0.1);

const brakingStep = tut2.getStepDefinitions()[1];
assert.strictEqual(brakingStep.practice.checkComplete(), true, 'Braking practice must complete when holding Space and stopped');

// Advance to step 8: Shop
tut2.loadStep(8, 0);
assert.strictEqual(tut2.isFeatureAllowed('shop'), true, 'Shop must be allowed during shop_upgrade lesson');
assert.strictEqual(tut2.isFeatureAllowed('cannon'), false, 'Cannon must remain locked during shop lesson');

// Advance to step 9: Cannon
tut2.loadStep(9, 0);
assert.strictEqual(tut2.isFeatureAllowed('cannon'), true, 'Cannon must be allowed during cannon_charge lesson');

console.log('✓ Test 11 Passed: Braking completion and component gating fully verified.\n');

console.log('====================================================');
console.log('🎉 ALL INTERACTIVE TUTORIAL TESTS PASSED! (11/11)');
console.log('====================================================');
