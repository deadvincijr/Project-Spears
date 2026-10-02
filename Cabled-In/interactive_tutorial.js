/**
 * Cabled In - Interactive Tutorial System
 * 
 * Provides an interactive, step-by-step tutorial where the game freezes at each new mechanic,
 * displays animated glowing arrows pointing to objectives with child-friendly (explain like you're 6)
 * dialogue, and advances sequential arrows via Left Click or [SPACE].
 * 
 * Features:
 * - Cart Movement & Friction Physics
 * - Hydraulic Spacebar Braking
 * - Object & Perimeter Wall Bouncing
 * - 4 Error Types: Standard Wire Bus, Auth PIN Lockout, Breaker Knife Switch Reboot, Chain Wire
 * - South Station Interactions: Terminal Desk, Emergency Supplies Closet, IT Supply Depot Shop
 * - Kinetic Cannon Bullet-Time Slingshot Launch
 * - Bug Boss Emergence & Rope Restraint Coiling
 * - 3-Choice Apex Powerup Requisition with individual arrow walkthroughs
 * - Hands-on training with the chosen powerup
 * - 30-Second Calm Countdown ➔ Comedic Relief Climax ("Well it looks like you're ready to go! Good Luck!")
 *   where all 50+ server racks immediately go critical and detonate in cascading fireworks!
 */

class InteractiveTutorial {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.isFrozen = false;
    this.stepIndex = 0;
    this.subStepIndex = 0;

    // Timer & Animation State
    this.animTime = 0;
    this.practiceTimer = 0;
    this.climaxTimer = 0;
    this.isClimaxActive = false;
    this.climaxExplosionIndex = 0;
    this.climaxExplosionTimer = 0;

    // Tracking player actions during practice phases
    this.startPlayerPos = { x: 0, y: 0 };
    this.distanceTraveled = 0;
    this.hasBrakedWithSpace = false;
    this.hasBounced = false;
    this.targetRack = null;
    this.sourceRack = null;
    this.chainHops = [];
    this.chosenPowerup = null;

    // DOM UI elements
    this.guideCard = null;
    this.climaxBanner = null;

    this.initDOM();
  }

  initDOM() {
    // Floating child-friendly guide card
    let card = document.getElementById('tutorial-guide-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'tutorial-guide-card';
      card.className = 'tutorial-guide-card hidden';
      card.innerHTML = `
        <div class="tg-card-inner">
          <div class="tg-mascot-badge">
            <span class="tg-mascot-icon">🤖</span>
            <div class="tg-mascot-info">
              <span class="tg-mascot-name">CHIPPY THE CABLE CART</span>
              <span class="tg-step-badge" id="tg-step-badge">LESSON 1 OF 12</span>
            </div>
          </div>
          <div class="tg-dialogue-body">
            <h3 class="tg-dialogue-title" id="tg-dialogue-title">HELLO BUDDY!</h3>
            <p class="tg-dialogue-text" id="tg-dialogue-text">Welcome to the data center!</p>
          </div>
          <div class="tg-action-footer">
            <div class="tg-key-cue" id="tg-key-cue">
              <span class="key-pill">SPACE</span> or <span class="key-pill">CLICK</span> to continue
            </div>
            <button type="button" class="tg-btn-continue" id="tg-btn-continue">NEXT ➔</button>
          </div>
        </div>
      `;
      document.body.appendChild(card);
    }
    this.guideCard = card;

    // Comedic relief climax banner
    let banner = document.getElementById('tutorial-climax-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'tutorial-climax-banner';
      banner.className = 'tutorial-climax-banner hidden';
      banner.innerHTML = `
        <div class="climax-banner-window">
          <div class="climax-badge">MISSION BRIEFING COMPLETE</div>
          <h1 class="climax-title">Well it looks like you're ready to go! Good Luck! 😄👍</h1>
          <p class="climax-sub">All training safeties have now been deactivated.</p>
        </div>
      `;
      document.body.appendChild(banner);
    }
    this.climaxBanner = banner;

    // Event listener for continue button
    document.getElementById('tg-btn-continue')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.advanceArrow();
    });
  }

  // ==========================================================================
  // Start & End Interactive Tutorial
  // ==========================================================================
  start() {
    this.isActive = true;
    this.isFrozen = true;
    this.stepIndex = 0;
    this.subStepIndex = 0;
    this.animTime = 0;
    this.climaxTimer = 0;
    this.isClimaxActive = false;
    this.climaxExplosionIndex = 0;
    this.climaxExplosionTimer = 0;
    this.chosenPowerup = null;

    // Configure game state for clean tutorial
    this.game.isTutorialMode = true;
    this.game.activeScenarioId = 'beginner';
    this.game.startGame('beginner');

    // Start with 0 credits and 0 cannon charges so tools are locked until unlocked in their respective lessons!
    this.game.credits = 0;
    this.game.cannonCharges = 0;
    this.game.updateCreditsUI();
    this.game.updateBuffDisplay?.();

    // Clear any spontaneous random errors so tutorial controls pacing
    this.clearAllActiveErrors();

    // Start with Step 0
    this.loadStep(0, 0);
  }

  stop() {
    this.isActive = false;
    this.isFrozen = false;
    this.game.isTutorialMode = false;
    if (this.guideCard) this.guideCard.classList.add('hidden');
    if (this.climaxBanner) this.climaxBanner.classList.add('hidden');
  }

  isFeatureAllowed(feature) {
    if (!this.isActive) return true;
    const steps = this.getStepDefinitions();
    const currentStep = steps[this.stepIndex];
    const currentId = currentStep?.id;

    switch (feature) {
      case 'cannon':
        // Allowed only during or after 'cannon_charge' (Index 9) or post-boss
        return this.stepIndex >= 9 || this.chosenPowerup !== null || this.hasDefeatedBoss;
      case 'shop':
        // Allowed only during or after 'shop_upgrade' (Index 8) or post-boss
        return this.stepIndex >= 8 || this.chosenPowerup !== null || this.hasDefeatedBoss;
      case 'supplies':
        // Allowed only during or after 'supplies_closet' (Index 7) or post-boss
        return this.stepIndex >= 7 || this.chosenPowerup !== null || this.hasDefeatedBoss;
      case 'terminal':
        // Allowed from 'error_pin' (Index 4) onwards (including 'error_reboot' at Index 5, etc.)
        return this.stepIndex >= 4 || this.chosenPowerup !== null || this.hasDefeatedBoss;
      case 'teleporter':
        return this.chosenPowerup === 'teleporter' || this.hasDefeatedBoss;
      case 'portable_terminal':
        return this.chosenPowerup === 'portable_terminal' || this.hasDefeatedBoss;
      default:
        return true;
    }
  }

  clearAllActiveErrors() {
    if (!this.game.racks) return;
    for (const rack of this.game.racks) {
      rack.isFailing = false;
      rack.error = null;
      rack.isTargetDestination = false;
      rack.isBossHost = false;
      rack.uptime = 100;
    }
    this.game.activeCable = null;
    this.game.connectedCables = [];
    if (typeof this.game.updateActiveAlertsCount === 'function') {
      this.game.updateActiveAlertsCount();
    } else if (typeof this.game.updateObjectiveUI === 'function') {
      this.game.updateObjectiveUI();
    }
  }

  // ==========================================================================
  // Tutorial Steps Definition
  // ==========================================================================
  getStepDefinitions() {
    const p = this.game.player;
    const cam = this.game.camera;

    // Find nearest rack to player
    const nearRack = this.game.racks ? this.game.racks[0] : { x: p.x + 100, y: p.y, width: 40, height: 160 };

    return [
      // ----------------------------------------------------------------------
      // STEP 0: Introduction to Cart & Movement
      // ----------------------------------------------------------------------
      {
        id: 'moving',
        badge: 'LESSON 1 // ZOOM ZOOM CART',
        title: 'MEET YOUR SPEEDY CART! 🤖✨',
        slides: [
          {
            text: "Look at the shiny glowing arrow! That's YOU! You're a super cool maintenance cart with shiny roller skate wheels! Beep boop! 🛼",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#00f3ff'
          },
          {
            text: "The floor in this computer warehouse is super-duper slippery like a frozen ice skating rink! Wheeeee! ⛸️❄️",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x + 80, y: this.game.player.y + 80 }),
            color: '#38bdf8'
          }
        ],
        practice: {
          keyPrompt: 'Press [W], [A], [S], [D] or Arrow Keys to zoom around!',
          instruction: 'Skate around on the slippery floor! Notice how you slide smoothly through turns!',
          checkComplete: () => {
            return this.distanceTraveled > 180;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 1: Hydraulic Spacebar Braking
      // ----------------------------------------------------------------------
      {
        id: 'braking',
        badge: 'LESSON 2 // MAGIC BRAKES',
        title: 'WHOA! HOW DO WE STOP?! 🛑⚓',
        slides: [
          {
            text: "Whoa buddy, you're sliding fast! Because the floor is like ice, if you don't use your brakes, you'll slide forever and ever! 😱",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#f59e0b'
          },
          {
            text: "Hold down the SPACEBAR to drop your magic rubber floor anchors! It grabs the ground and stops you on a dime! ⚓✨",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#00ff9d'
          }
        ],
        onStart: () => {
          this.hasBrakedWithSpace = false;
          // Give player forward sliding momentum so they can immediately test the brakes!
          this.game.player.vx = 260;
          this.game.player.vy = 0;
        },
        practice: {
          keyPrompt: 'Hold [SPACE] while moving to stop!',
          instruction: 'Slide fast, then HOLD SPACEBAR until your cart comes to a complete standstill!',
          checkComplete: () => {
            const speed = Math.hypot(this.game.player.vx, this.game.player.vy);
            const isHoldingSpace = Boolean(this.game.keys['Space'] || this.game.keys[' ']);
            if (isHoldingSpace) {
              this.hasBrakedWithSpace = true;
            }
            // If player used spacebar and stopped (< 25 px/s)
            if (this.hasBrakedWithSpace && speed < 25) {
              return true;
            }
            // If player actively holds spacebar and slows down under 40 px/s
            if (isHoldingSpace && speed < 40 && this.practiceTimer > 0.4) {
              return true;
            }
            return false;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 2: Bouncing Off Objects
      // ----------------------------------------------------------------------
      {
        id: 'bouncing',
        badge: 'LESSON 3 // RUBBER BUMPERS',
        title: 'BOING! DON\'T FEAR THE WALLS! 🎾🧱',
        slides: [
          {
            text: "Look at those big computer boxes and the bright electric-blue walls! You might think crashing into them is bad, but guess what? 📦💙",
            targetType: 'world',
            getTarget: () => {
              const rack = this.game.getNearestRack() || nearRack;
              return { x: rack.x + rack.width / 2, y: rack.y + rack.height / 2 };
            },
            color: '#38bdf8'
          },
          {
            text: "Your cart has super bouncy rubber bumpers! Bumping into walls or computer boxes will just bounce you off like a pinball! Boing! 🎾💥",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#ff00aa'
          }
        ],
        practice: {
          keyPrompt: 'Bump into a computer box or wall!',
          instruction: 'Slide your cart straight into a computer rack or outer wall to test your bouncy bumper!',
          checkComplete: () => {
            return this.hasBounced;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 3: Basic Error 1 - Standard Wire Bus (Cable Disconnect)
      // ----------------------------------------------------------------------
      {
        id: 'error_cable',
        badge: 'LESSON 4 // FIXING BOO-BOOS: CABLES',
        title: 'ERROR 1: THE DISCONNECTED STRING! 🔌🚨',
        slides: [
          {
            text: "Uh oh! Look at the red flashing computer box! It got a big boo-boo because its string came unplugged! Let's help it! 🚨😢",
            targetType: 'world',
            getTarget: () => {
              if (this.sourceRack) return { x: this.sourceRack.x + this.sourceRack.width / 2, y: this.sourceRack.y + this.sourceRack.height / 2 };
              return { x: this.game.player.x + 200, y: this.game.player.y };
            },
            color: '#ff2a55'
          },
          {
            text: "Skate over to the red box and press [E] to grab the sparky patch string! 🪢⚡",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#00f3ff'
          }
        ],
        onStart: () => {
          this.setupCableError();
        },
        practice: {
          keyPrompt: 'Go to RED rack and press [E], then go to GREEN rack and press [E]!',
          instruction: 'Pick up the cable from the red flashing rack, skate to the emerald green target rack, and press [E] to plug it in!',
          checkComplete: () => {
            return this.sourceRack && !this.sourceRack.isFailing;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 4: Basic Error 2 - PIN to Grant Access (Auth Lockout)
      // ----------------------------------------------------------------------
      {
        id: 'error_pin',
        badge: 'LESSON 5 // FIXING BOO-BOOS: SECRET CODES',
        title: 'ERROR 2: THE SECRET 4-DIGIT PIN! 🔑🔐',
        slides: [
          {
            text: "Look! This yellow flashing computer box is locked with a secret combination lock! ⚠️🔒",
            targetType: 'world',
            getTarget: () => {
              if (this.targetRack) return { x: this.targetRack.x + this.targetRack.width / 2, y: this.targetRack.y + this.targetRack.height / 2 };
              return { x: this.game.player.x + 200, y: this.game.player.y };
            },
            color: '#ffb800'
          },
          {
            text: "First, skate up to the yellow box and press [E] to read the 4 secret numbers into your clipboard! 📋🔢",
            targetType: 'world',
            getTarget: () => {
              if (this.targetRack) return { x: this.targetRack.x + this.targetRack.width / 2, y: this.targetRack.y + this.targetRack.height / 2 };
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#ffb800'
          },
          {
            text: "Then, skate down to the Big Boss Terminal Desk at the south wall, press [E] to use the computer, and type in the secret numbers! 💻⌨️",
            targetType: 'world',
            getTarget: () => ({ x: this.game.nocDesk.x + this.game.nocDesk.width / 2, y: this.game.nocDesk.y + this.game.nocDesk.height / 2 }),
            color: '#00f3ff'
          }
        ],
        onStart: () => {
          this.setupAuthError();
        },
        practice: {
          keyPrompt: 'Read PIN with [E] at yellow rack ➔ Go South to Terminal Desk ➔ Enter PIN!',
          instruction: 'Scan the 4-digit PIN on foot, then travel to the Master NOC Console Desk at the South wall, press [E], and enter the code!',
          checkComplete: () => {
            return this.targetRack && !this.targetRack.isFailing;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 5: Basic Error 3 - Reboot (Knife Breaker Switch + 5s Hold)
      // ----------------------------------------------------------------------
      {
        id: 'error_reboot',
        badge: 'LESSON 6 // FIXING BOO-BOOS: POWER REBOOT',
        title: 'ERROR 3: THE FROZEN ICE POP BOX! ❄️🥶',
        slides: [
          {
            text: "Brrrr! Look at this icy blue computer box! It's frozen completely solid like an ice pop! ❄️🧊",
            targetType: 'world',
            getTarget: () => {
              if (this.targetRack) return { x: this.targetRack.x + this.targetRack.width / 2, y: this.targetRack.y + this.targetRack.height / 2 };
              return { x: this.game.player.x + 200, y: this.game.player.y };
            },
            color: '#00f3ff'
          },
          {
            text: "You can't wake it up while it's running! First, skate down to the South Terminal Desk, enter its PIN, and pull the big clunky power lever DOWN! ⚡🕹️",
            targetType: 'world',
            getTarget: () => ({ x: this.game.nocDesk.x + this.game.nocDesk.width / 2, y: this.game.nocDesk.y + this.game.nocDesk.height / 2 }),
            color: '#ffaa00'
          },
          {
            text: "Once the power switch is pulled, skate back to the icy blue box, hold [SPACE] so you don't drift away, and HOLD [E] for 5 full seconds until it beeps happy! ⏱️🎉",
            targetType: 'world',
            getTarget: () => {
              if (this.targetRack) return { x: this.targetRack.x + this.targetRack.width / 2, y: this.targetRack.y + this.targetRack.height / 2 };
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#00ff9d'
          }
        ],
        onStart: () => {
          this.setupRebootError();
        },
        practice: {
          keyPrompt: 'Enter PIN & pull lever at South Terminal ➔ Return to rack & HOLD [E] (5.0s)!',
          instruction: 'Turn off the breaker switch at the Master Terminal, then skate to the server, hold SPACE to stay still, and hold [E] for 5.0 seconds!',
          checkComplete: () => {
            return this.targetRack && !this.targetRack.isFailing;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 6: Basic Error 4 - Chain Wire (Multi-Cable Daisy Chain)
      // ----------------------------------------------------------------------
      {
        id: 'error_chain',
        badge: 'LESSON 7 // FIXING BOO-BOOS: DAISY CHAINS',
        title: 'ERROR 4: THE FRIENDSHIP BRACELET CHAIN! 🌸🔗',
        slides: [
          {
            text: "Look! This error needs a multi-string daisy chain! It's like making a friendship bracelet between 3 computers! 🔗👭",
            targetType: 'world',
            getTarget: () => {
              if (this.chainHops && this.chainHops.length > 0) {
                const r = this.chainHops[0];
                return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
              }
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#c084fc'
          },
          {
            text: "Press [E] to grab the first cable, skate to the next green box and press [E], then skate to the final green box and press [E]! Snap snap! ✨",
            targetType: 'world',
            getTarget: () => {
              if (this.chainHops && this.chainHops.length > 1) {
                const r = this.chainHops[1];
                return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
              }
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#00ff9d'
          }
        ],
        onStart: () => {
          this.setupChainError();
        },
        practice: {
          keyPrompt: 'Pick up cable with [E], then connect each green server hop in order!',
          instruction: 'Daisy chain the servers together! Press [E] at each highlighted destination hop until the chain is complete!',
          checkComplete: () => {
            return this.sourceRack && !this.sourceRack.isFailing;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 7: Using Emergency Supplies Closet
      // ----------------------------------------------------------------------
      {
        id: 'supplies_closet',
        badge: 'LESSON 8 // EMERGENCY SUPPLIES',
        title: 'THE SECRET MONSTER-HUNTING LOCKER! 🧰🔦',
        slides: [
          {
            text: "Look over there near the south wall! That big metal locker is the Facility Supplies Closet! 🧰🚪",
            targetType: 'world',
            getTarget: () => ({ x: this.game.suppliesCloset.x + this.game.suppliesCloset.width / 2, y: this.game.suppliesCloset.y + this.game.suppliesCloset.height / 2 }),
            color: '#38bdf8'
          },
          {
            text: "That's where the firefighters keep heavy taming ropes, fire extinguishers, and emergency rocket ammo! Skate over and press [E] to open it! 🧗",
            targetType: 'world',
            getTarget: () => ({ x: this.game.suppliesCloset.x + this.game.suppliesCloset.width / 2, y: this.game.suppliesCloset.y + this.game.suppliesCloset.height / 2 }),
            color: '#00ff9d'
          }
        ],
        practice: {
          keyPrompt: 'Skate to the Supplies Closet at South wall and press [E]!',
          instruction: 'Approach the Facility Supplies Closet and press [E] to browse the emergency gear! Press [ESC] when done.',
          checkComplete: () => {
            return this.game.isSuppliesModalOpen || this.game.isSuppliesOpen || this.hasOpenedCloset;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 8: Using IT Supply Depot / Shop Upgrade
      // ----------------------------------------------------------------------
      {
        id: 'shop_upgrade',
        badge: 'LESSON 9 // IT SUPPLY DEPOT',
        title: 'TIME TO GO SHOPPING! 🛒⚡',
        slides: [
          {
            text: "Woohoo! Look at all the shiny Data Credits ⚡ you earned by fixing computers! You're super rich! 💰🎉",
            targetType: 'dom',
            getElement: () => document.getElementById('preview-credits') || document.getElementById('memo-card'),
            color: '#ffb800'
          },
          {
            text: "Press [K] on your keyboard (or click the SHOP button) to open the upgrade toy store! 🛍️✨",
            targetType: 'dom',
            getElement: () => document.getElementById('btn-open-shop') || document.getElementById('btn-open-stats-top'),
            color: '#00f3ff'
          },
          {
            text: "Click BUY on an upgrade like a High-Voltage Energy Drink or Floor Magnet to make your cart faster or grippier! 🥤🧲",
            targetType: 'world',
            getTarget: () => ({ x: this.game.shopKiosk.x + this.game.shopKiosk.width / 2, y: this.game.shopKiosk.y + this.game.shopKiosk.height / 2 }),
            color: '#00ff9d'
          }
        ],
        onStart: () => {
          this.game.addCredits(500, '+500 ⚡ TUTORIAL SHOPPING SPREE!');
        },
        practice: {
          keyPrompt: 'Press [K] to open Shop ➔ Click BUY on any upgrade!',
          instruction: 'Open the IT Supply Depot with [K] or the South Kiosk, purchase an upgrade, and close with [ESC]!',
          checkComplete: () => {
            return (this.game.energyDrinkPurchases > 0 || this.game.magnetPurchases > 0 || this.hasPurchasedShopItem);
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 9: Using Kinetic Cannon Slingshot
      // ----------------------------------------------------------------------
      {
        id: 'cannon_charge',
        badge: 'LESSON 10 // KINETIC CANNON',
        title: 'SUPERSONIC ROCKET BLAST! 🚀💥',
        slides: [
          {
            text: "Are you ready to fly like a superhero rocket?! You have a Kinetic Cannon charge! Press [F] to freeze time! ⏱️🦸",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#00f3ff'
          },
          {
            text: "When you press [F], the whole world freezes! Move your mouse to aim the glowing dotted line, and LEFT CLICK or hit SPACE to blast off at supersonic speed! WHEEEEE! ☄️",
            targetType: 'world',
            getTarget: () => ({ x: this.game.player.x, y: this.game.player.y }),
            color: '#ff00aa'
          }
        ],
        onStart: () => {
          this.game.cannonCharges = Math.max(1, this.game.cannonCharges || 1);
        },
        practice: {
          keyPrompt: 'Press [F] to aim ➔ LEFT CLICK or hit [SPACE] to fire!',
          instruction: 'Activate the slingshot with [F], aim with your cursor, and fire to launch across the warehouse like an air hockey puck!',
          checkComplete: () => {
            return this.game.cannonPuckTimer > 0 || this.hasFiredCannon;
          }
        }
      },

      // ----------------------------------------------------------------------
      // STEP 10: Defeat First (Bug) Boss
      // ----------------------------------------------------------------------
      {
        id: 'bug_boss',
        badge: 'LESSON 11 // FIRST BOSS BATTLE',
        title: 'ROAR! A GIANT CYBER-BUG APPEARS! 👾😱',
        slides: [
          {
            text: "OH NO! A giant robo-bug monster just burst out of the computers! Don't panic, little buddy, we're gonna tame him! 👾🛡️",
            targetType: 'world',
            getTarget: () => {
              const boss = this.game.activeBoss || this.game.bugBoss;
              if (boss) return { x: boss.x, y: boss.y };
              return { x: this.game.player.x, y: this.game.player.y - 200 };
            },
            color: '#ff2a55'
          },
          {
            text: "Look at the boss's home computer rack (or in the Supplies Closet)! Skate over and press [E] to grab the Heavy Restraint Rope! 🧶",
            targetType: 'world',
            getTarget: () => {
              if (this.game.bossHostRack) return { x: this.game.bossHostRack.x + this.game.bossHostRack.width / 2, y: this.game.bossHostRack.y + this.game.bossHostRack.height / 2 };
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#00ff9d'
          },
          {
            text: "Once you have the rope, skate in big circles around the giant bug like wrapping a birthday present! 🎁 Circle him 3 times to tie him up tight!",
            targetType: 'world',
            getTarget: () => {
              const boss = this.game.activeBoss || this.game.bugBoss;
              if (boss) return { x: boss.x, y: boss.y };
              return { x: this.game.player.x, y: this.game.player.y };
            },
            color: '#ffaa00'
          }
        ],
        onStart: () => {
          this.setupBugBoss();
        },
        practice: {
          keyPrompt: 'Grab rope with [E] ➔ Skate circles around the Bug Boss to tie it up!',
          instruction: 'Circle the Corrupted Bug Boss until all restraint coils are locked into place to defeat the boss!',
          checkComplete: () => {
            return this.game.bossDefeatedOnce || (this.game.activeBoss === null && this.hasDefeatedBoss);
          }
        }
      }
    ];
  }

  // ==========================================================================
  // Setting Up Tutorial Errors & Boss
  // ==========================================================================
  setupCableError() {
    this.clearAllActiveErrors();
    const p = this.game.player;
    // Pick two racks near the player
    const sorted = [...this.game.racks].sort((a, b) => {
      const da = Math.hypot(a.x - p.x, a.y - p.y);
      const db = Math.hypot(b.x - p.x, b.y - p.y);
      return da - db;
    });

    this.sourceRack = sorted[0];
    this.targetRack = sorted[1] || sorted[0];

    this.sourceRack.triggerCableError(this.targetRack);
    this.sourceRack.uptime = 100;
  }

  setupAuthError() {
    this.clearAllActiveErrors();
    const p = this.game.player;
    const sorted = [...this.game.racks].sort((a, b) => {
      const da = Math.hypot(a.x - p.x, a.y - p.y);
      const db = Math.hypot(b.x - p.x, b.y - p.y);
      return da - db;
    });

    this.targetRack = sorted[0];
    this.targetRack.triggerAuthError();
    this.targetRack.uptime = 100;
  }

  setupRebootError() {
    this.clearAllActiveErrors();
    const p = this.game.player;
    const sorted = [...this.game.racks].sort((a, b) => {
      const da = Math.hypot(a.x - p.x, a.y - p.y);
      const db = Math.hypot(b.x - p.x, b.y - p.y);
      return da - db;
    });

    this.targetRack = sorted[0];
    this.targetRack.triggerHardRebootError();
    this.targetRack.uptime = 100;
  }

  setupChainError() {
    this.clearAllActiveErrors();
    const p = this.game.player;
    const sorted = [...this.game.racks].sort((a, b) => {
      const da = Math.hypot(a.x - p.x, a.y - p.y);
      const db = Math.hypot(b.x - p.x, b.y - p.y);
      return da - db;
    });

    const hops = [sorted[0], sorted[1], sorted[2]];
    this.sourceRack = hops[0];
    this.chainHops = hops;
    this.sourceRack.triggerMultiChainError(hops);
    this.sourceRack.uptime = 100;
  }

  setupBugBoss() {
    this.clearAllActiveErrors();
    // Place boss near player
    this.game.spawnBoss(1, true);
    // Make boss easier to wrap for tutorial (3 wraps)
    const boss = this.game.activeBoss || this.game.bugBoss;
    if (boss) {
      boss.maxWraps = 3;
      boss.x = this.game.player.x;
      boss.y = this.game.player.y - 180;
    }
  }

  // ==========================================================================
  // Step Navigation & State
  // ==========================================================================
  loadStep(stepIdx, subIdx = 0) {
    const steps = this.getStepDefinitions();
    if (stepIdx >= steps.length) {
      // Steps completed!
      return;
    }

    this.stepIndex = stepIdx;
    this.subStepIndex = subIdx;
    this.isFrozen = true;
    this.practiceTimer = 0;
    this.distanceTraveled = 0;
    this.startPlayerPos = { x: this.game.player.x, y: this.game.player.y };
    this.hasBrakedWithSpace = false;
    this.hasBounced = false;
    this.hasOpenedCloset = false;
    this.hasPurchasedShopItem = false;
    this.hasFiredCannon = false;
    this.hasDefeatedBoss = false;

    const currentStep = steps[stepIdx];
    if (subIdx === 0 && currentStep.onStart) {
      currentStep.onStart();
    }

    this.updateGuideCardUI();
  }

  updateGuideCardUI() {
    if (!this.guideCard) return;

    const steps = this.getStepDefinitions();
    const currentStep = steps[this.stepIndex];
    if (!currentStep) return;

    this.guideCard.classList.remove('hidden');

    const badgeEl = document.getElementById('tg-step-badge');
    const titleEl = document.getElementById('tg-dialogue-title');
    const textEl = document.getElementById('tg-dialogue-text');
    const keyCueEl = document.getElementById('tg-key-cue');
    const btnContinue = document.getElementById('tg-btn-continue');

    if (badgeEl) badgeEl.textContent = currentStep.badge;
    if (titleEl) titleEl.textContent = currentStep.title;

    if (this.isFrozen) {
      const slide = currentStep.slides[this.subStepIndex];
      if (textEl && slide) textEl.textContent = slide.text;
      if (keyCueEl) {
        keyCueEl.innerHTML = `<span class="key-pill">SPACE</span> or <span class="key-pill">CLICK</span> to advance arrow (${this.subStepIndex + 1}/${currentStep.slides.length})`;
      }
      if (btnContinue) {
        btnContinue.style.display = 'block';
        btnContinue.textContent = (this.subStepIndex + 1 < currentStep.slides.length) ? 'NEXT ARROW ➔' : 'TRY IT NOW! ▶';
      }
    } else {
      // In practice phase
      if (textEl && currentStep.practice) {
        textEl.innerHTML = `<strong>YOUR TURN:</strong> ${currentStep.practice.instruction}`;
      }
      if (keyCueEl && currentStep.practice) {
        keyCueEl.innerHTML = `👉 <span style="color: #00ff9d; font-weight: bold;">${currentStep.practice.keyPrompt}</span>`;
      }
      if (btnContinue) {
        btnContinue.style.display = 'none';
      }
    }
  }

  advanceArrow(force = false) {
    if (!this.isFrozen) return;

    // Debounce to strictly ensure a click or space press only advances exactly ONE arrow box!
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (!force && this.lastArrowAdvanceTime && (now - this.lastArrowAdvanceTime) < 260) {
      return;
    }
    this.lastArrowAdvanceTime = now;

    const steps = this.getStepDefinitions();
    const currentStep = steps[this.stepIndex];
    if (!currentStep) return;

    if (this.subStepIndex + 1 < currentStep.slides.length) {
      this.subStepIndex++;
      this.soundBlip();
      this.updateGuideCardUI();
    } else {
      // Completed all arrow slides for this step ➔ unfreeze for practice!
      this.isFrozen = false;
      this.soundSuccess();
      this.updateGuideCardUI();
    }
  }

  soundBlip() {
    try {
      if (this.game.sound?.playBlip) this.game.sound.playBlip();
      else if (this.game.sound?.playKey) this.game.sound.playKey();
      else if (this.game.sound?.playClick) this.game.sound.playClick();
      else if (this.game.sound?.playSwitchToggle) this.game.sound.playSwitchToggle();
    } catch (_) {}
  }

  soundSuccess() {
    try {
      if (this.game.sound?.playUpgrade) this.game.sound.playUpgrade();
      else if (this.game.sound?.playLinkSuccess) this.game.sound.playLinkSuccess();
      else if (this.game.sound?.playPlugSuccess) this.game.sound.playPlugSuccess();
    } catch (_) {}
  }

  handleInput(event) {
    if (!this.isActive) return false;

    // Track Space key down during active practice phase
    if (!this.isFrozen && (event.key === ' ' || event.code === 'Space')) {
      this.hasBrakedWithSpace = true;
    }

    // Ignore clicks that originated inside the guide card (handled by the button itself!)
    if (event.target && event.target.closest && event.target.closest('#tutorial-guide-card')) {
      return false;
    }

    // If game is frozen for an explanation slide, Left Click (button 0) or Space advances to next arrow!
    if (this.isFrozen) {
      if (event.type === 'click' || event.type === 'mousedown') {
        if (event.button !== undefined && event.button !== 0) return false;
        this.advanceArrow();
        return true;
      }
      if (event.type === 'keydown' && (event.key === ' ' || event.code === 'Space')) {
        this.advanceArrow();
        return true;
      }
    }

    return false;
  }

  // ==========================================================================
  // Update Loop
  // ==========================================================================
  update(dt) {
    if (!this.isActive) return;

    this.animTime += dt;

    // Check if in comedic climax phase
    if (this.isClimaxActive) {
      this.updateComedicClimax(dt);
      return;
    }

    // Check if in 30-second post-powerup calm before the storm
    if (this.climaxTimer > 0) {
      this.climaxTimer -= dt;
      const secs = Math.max(0, Math.ceil(this.climaxTimer));
      if (this.guideCard) {
        const titleEl = document.getElementById('tg-dialogue-title');
        const textEl = document.getElementById('tg-dialogue-text');
        const keyCueEl = document.getElementById('tg-key-cue');
        if (titleEl) titleEl.textContent = '🎓 GRADUATION CALIBRATION PROTOCOL';
        if (textEl) textEl.innerHTML = `You learned all the systems! Test your skills on the floor. Calm before the storm...`;
        if (keyCueEl) keyCueEl.innerHTML = `⏱️ <span style="color: #ffb800; font-weight: bold;">CALIBRATING DATA CENTER IN: ${secs}s</span>`;
      }

      if (this.climaxTimer <= 0) {
        this.triggerComedicClimax();
      }
      return;
    }

    // If frozen, keep entities stationary
    if (this.isFrozen) {
      return;
    }

    // In active practice phase
    this.practiceTimer += dt;

    // Track movement distance
    const p = this.game.player;
    const moveDist = Math.hypot(p.x - this.startPlayerPos.x, p.y - this.startPlayerPos.y);
    this.distanceTraveled += moveDist;
    this.startPlayerPos = { x: p.x, y: p.y };

    const steps = this.getStepDefinitions();
    const currentStep = steps[this.stepIndex];
    if (!currentStep) return;

    // Track space key braking
    if (this.game.keys?.['Space'] || this.game.keys?.[' ']) {
      this.hasBrakedWithSpace = true;
    }

    // Track wall/rack collisions for bouncing lesson
    if (currentStep.id === 'bouncing') {
      const nearWall = p.x <= 45 || p.x >= (typeof CONFIG !== 'undefined' ? CONFIG.WORLD.WIDTH : 2400) - 45 ||
                       p.y <= 45 || p.y >= (typeof CONFIG !== 'undefined' ? CONFIG.WORLD.HEIGHT : 1800) - 45;
      const nearRack = this.game.racks?.some(r => {
        const cx = Math.max(r.x, Math.min(p.x, r.x + r.width));
        const cy = Math.max(r.y, Math.min(p.y, r.y + r.height));
        return Math.hypot(p.x - cx, p.y - cy) < (p.radius + 14);
      });
      if (nearWall || nearRack || (p.lastWallBounceTime && performance.now() - p.lastWallBounceTime < 1000)) {
        this.hasBounced = true;
      }
    }

    // Check if practice criteria fulfilled
    if (currentStep.practice && currentStep.practice.checkComplete()) {
      this.soundSuccess();
      this.game.showTemporaryToast(`⭐ ${currentStep.title} MASTERED!`, '🌟');

      // Move to next tutorial step
      if (this.stepIndex + 1 < steps.length) {
        this.loadStep(this.stepIndex + 1, 0);
      } else {
        // Boss defeated step completed! Hand off to Apex Powerup Requisition
        this.guideCard?.classList.add('hidden');
      }
    }
  }

  // ==========================================================================
  // Apex Powerup Selection (Step 12) & Detailed Tutorial (Step 13)
  // ==========================================================================
  handleBossDefeatedInTutorial() {
    this.hasDefeatedBoss = true;
    // The game's defeatBoss() calls openBossRewardModal()
    // We hook into the modal display to explain all 3 powerups one by one with glowing arrows!
    setTimeout(() => {
      this.startPowerupChoiceWalkthrough();
    }, 400);
  }

  startPowerupChoiceWalkthrough() {
    this.isPowerupModalWalkthrough = true;
    this.powerupCardArrowIndex = 0;
    this.isFrozen = true;

    // Ensure the 3 reward choices are the 3 main apex cards
    const grid = document.querySelector('.boss-reward-grid');
    if (!grid) return;

    this.showPowerupArrowSlide(0);
  }

  showPowerupArrowSlide(idx) {
    this.powerupCardArrowIndex = idx;
    const cards = document.querySelectorAll('.boss-reward-card');
    if (!cards || cards.length === 0) return;

    const descriptions = [
      {
        title: "POWERUP 1: QUANTUM TELEPORTER KIT! 🌀",
        text: "Warp pads! Press [T] to drop two linked pads across the warehouse floor. Glide onto either pad to instantly zap across the room!",
        target: cards[0]
      },
      {
        title: "POWERUP 2: PORTABLE FIELD NOC TERMINAL! 💻",
        text: "A pocket desk! Press [P] to place a mini computer anywhere on the floor so you don't have to skate all the way south to enter PINs or trip switches!",
        target: cards[1]
      },
      {
        title: "POWERUP 3: SHOP CLEARANCE OVERCLOCK! 🔓",
        text: "Super shopping spree! Unlocks the Cryo Deflector Shield in the IT Depot and lets you buy way more drinks and rockets for your cart!",
        target: cards[2]
      }
    ];

    const d = descriptions[idx] || descriptions[0];

    if (this.guideCard) {
      this.guideCard.classList.remove('hidden');
      const badgeEl = document.getElementById('tg-step-badge');
      const titleEl = document.getElementById('tg-dialogue-title');
      const textEl = document.getElementById('tg-dialogue-text');
      const keyCueEl = document.getElementById('tg-key-cue');
      const btnContinue = document.getElementById('tg-btn-continue');

      if (badgeEl) badgeEl.textContent = 'LESSON 12 // APEX REQUISITION';
      if (titleEl) titleEl.textContent = d.title;
      if (textEl) textEl.textContent = d.text;
      if (keyCueEl) {
        keyCueEl.innerHTML = (idx < 2)
          ? `<span class="key-pill">SPACE</span> or <span class="key-pill">CLICK</span> for next powerup (${idx + 1}/3)`
          : `👉 Click on ANY of the 3 cards above to claim it!`;
      }
      if (btnContinue) {
        btnContinue.style.display = (idx < 2) ? 'block' : 'none';
        btnContinue.textContent = 'NEXT POWERUP ➔';
      }
    }
  }

  advancePowerupModalArrow() {
    if (this.powerupCardArrowIndex < 2) {
      this.powerupCardArrowIndex++;
      this.soundBlip();
      this.showPowerupArrowSlide(this.powerupCardArrowIndex);
    } else {
      // Reached 3rd arrow; let player click their chosen card
      this.isFrozen = false;
      this.updateGuideCardUI();
    }
  }

  onPowerupClaimed(rewardId, immediate = false) {
    this.chosenPowerup = rewardId;
    this.isPowerupModalWalkthrough = false;
    this.isFrozen = false;

    // Start dedicated hands-on tutorial for the chosen powerup!
    if (immediate) {
      this.startDedicatedPowerupTutorial(rewardId);
    } else {
      setTimeout(() => {
        this.startDedicatedPowerupTutorial(rewardId);
      }, 500);
    }
  }

  startDedicatedPowerupTutorial(rewardId) {
    this.isDedicatedPowerupTutorial = true;
    this.isFrozen = true;

    if (rewardId === 'teleporter') {
      this.dedicatedPowerupStep = 'place_alpha';
      this.setDialogue(
        'APEX PROTOCOL: QUANTUM TELEPORTER 🌀',
        'You chose the Teleporter Kit! Press [T] right now to place your first blue pad (Node Alpha) right beneath your cart!',
        'Press [T] to deploy Node Alpha!'
      );
    } else if (rewardId === 'portable_terminal') {
      this.dedicatedPowerupStep = 'place_terminal';
      this.setDialogue(
        'APEX PROTOCOL: PORTABLE NOC TERMINAL 💻',
        'You chose the Portable Field Terminal! Press [P] right now to drop your mini-desk right here on the warehouse floor!',
        'Press [P] to deploy Field Terminal!'
      );
    } else {
      // shop_expansion
      this.dedicatedPowerupStep = 'open_shop';
      this.setDialogue(
        'APEX PROTOCOL: SHOP OVERCLOCK 🔓',
        'You chose Shop Clearance! Press [K] to open the store and check out the brand new Cryo Deflector Shield and boosted limits!',
        'Press [K] to view upgraded shop!'
      );
    }
  }

  onDedicatedPowerupAction(action) {
    if (!this.isDedicatedPowerupTutorial) return;

    if (this.chosenPowerup === 'teleporter') {
      if (this.dedicatedPowerupStep === 'place_alpha' && action === 'deploy_alpha') {
        this.dedicatedPowerupStep = 'place_beta';
        this.setDialogue(
          'GREAT! NOW DROP THE PARTNER PAD! 🌀',
          'Node Alpha is placed! Now skate across the warehouse floor (at least 120px away) and press [T] again to drop Node Beta!',
          'Skate away and press [T] to deploy Node Beta!'
        );
      } else if (this.dedicatedPowerupStep === 'place_beta' && action === 'deploy_beta') {
        this.dedicatedPowerupStep = 'warp_test';
        this.setDialogue(
          'QUANTUM LINK ONLINE! 🌌✨',
          'Both pads are linked! Now glide right on top of either pad, or press [T] near it to instantly warp across the data center!',
          'Slide onto a pad to test subspace teleportation!'
        );
      } else if (this.dedicatedPowerupStep === 'warp_test' && action === 'warped') {
        this.finishPowerupTutorial();
      }
    } else if (this.chosenPowerup === 'portable_terminal') {
      if (this.dedicatedPowerupStep === 'place_terminal' && action === 'placed') {
        this.dedicatedPowerupStep = 'interact_terminal';
        this.setDialogue(
          'LOOK AT YOUR MINI-DESK! 💻🎉',
          'Press [E] next to your mobile desk anytime to enter PINs or trip breaker switches without sprinting south! Press [P] to pick it back up!',
          'Press [E] near it or [P] to pick up!'
        );
        setTimeout(() => this.finishPowerupTutorial(), 4000);
      }
    } else if (this.chosenPowerup === 'shop_expansion') {
      if (action === 'opened_shop') {
        this.setDialogue(
          'SHOPPING POWER UNLOCKED! 🛒🛡️',
          'Look at the new prototype gear and higher limits! You are a certified master data-center technician!',
          'Press [ESC] to exit shop and practice!'
        );
        setTimeout(() => this.finishPowerupTutorial(), 4000);
      }
    }
  }

  finishPowerupTutorial() {
    this.isDedicatedPowerupTutorial = false;
    this.isFrozen = false;
    this.soundSuccess();

    // Start the 30-Second Countdown to the Comedic Relief Climax!
    this.climaxTimer = 30.0;
  }

  setDialogue(title, text, prompt) {
    if (!this.guideCard) return;
    this.guideCard.classList.remove('hidden');
    const badgeEl = document.getElementById('tg-step-badge');
    const titleEl = document.getElementById('tg-dialogue-title');
    const textEl = document.getElementById('tg-dialogue-text');
    const keyCueEl = document.getElementById('tg-key-cue');
    const btnContinue = document.getElementById('tg-btn-continue');

    if (badgeEl) badgeEl.textContent = 'PRACTICE PROTOCOL';
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (keyCueEl) keyCueEl.innerHTML = `👉 <span style="color: #00ff9d; font-weight: bold;">${prompt}</span>`;
    if (btnContinue) btnContinue.style.display = 'none';
  }

  // ==========================================================================
  // The Comedic Relief Climax ("Well it looks like you're ready to go! Good Luck!")
  // ==========================================================================
  triggerComedicClimax() {
    this.isClimaxActive = true;
    this.isFrozen = true;
    this.climaxTimer = 0;
    this.climaxExplosionIndex = 0;
    this.climaxExplosionTimer = 0;

    if (this.guideCard) this.guideCard.classList.add('hidden');
    if (this.climaxBanner) this.climaxBanner.classList.remove('hidden');

    this.game.sound?.playLevelUp?.();
    this.game.camera?.shake(18, 1.2);

    // After 3.5 seconds of cheerful banner, trigger CATASTROPHIC ALL-SERVER OVERHEAT!
    setTimeout(() => {
      this.detonateAllServersComedic();
    }, 3500);
  }

  detonateAllServersComedic() {
    if (this.climaxBanner) this.climaxBanner.classList.add('hidden');
    this.isFrozen = false;

    // Siren alarm audio
    this.game.sound?.playBossAlarm?.();

    // Trigger critical failure on EVERY server in warehouse!
    for (const rack of this.game.racks) {
      rack.isFailing = true;
      rack.isDestroyed = false;
      rack.error = {
        type: (typeof CONFIG !== 'undefined' ? CONFIG.ERRORS.CABLE_DISCONNECT : 'CABLE_DISCONNECT'),
        description: '🔥 TOTAL MELTDOWN 🔥'
      };
      rack.uptime = 2; // Imminent countdown!
      rack.explosionCountdown = 0.5 + Math.random() * 4.0;
    }

    this.game.showTemporaryToast('🚨 CATASTROPHIC CASCADE FAILURE: ALL 50+ SERVERS OVERHEATING!', '💥');

    // Spawn funny small bugs everywhere
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.game.triggerServerBugIncident?.(true);
      }, i * 400);
    }
  }

  updateComedicClimax(dt) {
    this.climaxExplosionTimer += dt;

    // Explode living servers in rapid succession with huge fireworks
    if (this.climaxExplosionTimer > 0.12 && this.game.racks) {
      this.climaxExplosionTimer = 0;
      const unexploded = this.game.racks.filter(r => !r.isDestroyed);
      if (unexploded.length > 0) {
        const target = unexploded[Math.floor(Math.random() * unexploded.length)];
        target.explode(this.game);
        this.game.camera?.shake(24, 0.4);

        const funnyToasts = [
          `💥 ${target.id} DETONATED! KABLAM!`,
          '🔥 THIS IS FINE! EVERYTHING IS FINE! 🔥',
          '🚨 CRITICAL ERROR: RUNAWAY THERMAL REACTOR!',
          '⚡ FACILITY ROOF IS ON FIRE! 🚒'
        ];
        if (Math.random() < 0.35) {
          this.game.showTemporaryToast(funnyToasts[Math.floor(Math.random() * funnyToasts.length)], '💥');
        }
      } else {
        // All servers exploded! Kill player cart to trigger game over transition
        this.game.player.hp = 0;
        if (typeof this.game.triggerCatastrophicCascadeGameOver === 'function') {
          this.game.triggerCatastrophicCascadeGameOver();
        } else if (typeof this.game.triggerGameOver === 'function') {
          this.game.triggerGameOver('SERVER_LOSS_LIMIT');
        }

        // Customize the Game Over modal for tutorial graduation
        setTimeout(() => {
          const headline = document.getElementById('go-headline');
          const desc = document.getElementById('go-desc');
          const title = document.getElementById('go-title');
          if (title) title.textContent = '🎓 TUTORIAL COMPLETE // GRADUATION CERTIFIED!';
          if (headline) headline.textContent = '💥 YOU SURVIVED THE TUTORIAL... ALMOST!';
          if (desc) desc.textContent = 'Congratulations! You know all the rules and mechanics of Cabled In! Now take on a real shift from the Main Menu!';
        }, 100);

        this.stop();
      }
    }
  }

  // ==========================================================================
  // Render: Animated Glowing Arrows & Visual Indicators
  // ==========================================================================
  render(ctx, cam) {
    if (!this.isActive) return;

    const time = performance.now() * 0.001;

    // If on powerup modal walkthrough, render arrow pointing to target card
    if (this.isPowerupModalWalkthrough) {
      const cards = document.querySelectorAll('.boss-reward-card');
      const targetCard = cards[this.powerupCardArrowIndex];
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        const renderScale = this.game.renderScale || 1.0;
        const arrowX = (rect.left + rect.width / 2) / renderScale;
        const arrowY = (rect.top - 20) / renderScale;
        this.drawGlowingArrowScreen(ctx, arrowX, arrowY, 0, 1, '#00f3ff', time);
      }
      return;
    }

    if (!this.isFrozen) return;

    const steps = this.getStepDefinitions();
    const currentStep = steps[this.stepIndex];
    if (!currentStep) return;

    const slide = currentStep.slides[this.subStepIndex];
    if (!slide) return;

    let targetWorldPos = null;

    if (slide.targetType === 'world' && slide.getTarget) {
      targetWorldPos = slide.getTarget();
    } else if (slide.targetType === 'dom' && slide.getElement) {
      const el = slide.getElement();
      if (el) {
        const rect = el.getBoundingClientRect();
        const renderScale = this.game.renderScale || 1.0;
        const sx = (rect.left + rect.width / 2) / renderScale;
        const sy = (rect.top + rect.height / 2) / renderScale;
        this.drawGlowingArrowScreen(ctx, sx, sy - 30, 0, 1, slide.color || '#00f3ff', time);
        return;
      }
    }

    if (targetWorldPos) {
      const targetScreen = cam.toScreen(targetWorldPos.x, targetWorldPos.y);

      // Pulsing concentric halo on the target
      ctx.save();
      const haloRadius = 36 + Math.sin(time * 6) * 8;
      ctx.strokeStyle = slide.color || '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = slide.color || '#00f3ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(targetScreen.x, targetScreen.y, haloRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = (slide.color || '#00f3ff') + '22';
      ctx.beginPath();
      ctx.arc(targetScreen.x, targetScreen.y, haloRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bouncing glowing arrow pointing down towards target
      const bounce = Math.sin(time * 6) * 16;
      const arrowStartX = targetScreen.x;
      const arrowStartY = targetScreen.y - 75 - bounce;

      this.drawGlowingArrowScreen(ctx, arrowStartX, arrowStartY, 0, 1, slide.color || '#00f3ff', time);
    }
  }

  drawGlowingArrowScreen(ctx, x, y, dirX, dirY, color, time) {
    ctx.save();
    ctx.translate(x, y);

    const length = 48;
    const headSize = 22;

    // Glowing shadow
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Arrow Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-headSize, -headSize);
    ctx.lineTo(headSize, -headSize);
    ctx.closePath();
    ctx.fill();

    // Secondary bright white inner core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -length + 4);
    ctx.lineTo(0, -2);
    ctx.stroke();

    ctx.restore();
  }
}

// Export for usage in main.js and test scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InteractiveTutorial };
} else {
  window.InteractiveTutorial = InteractiveTutorial;
}
