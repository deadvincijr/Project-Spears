# Project: Cabled In

## Overview
**Cabled In** is a 2D top-down simulation/action game built with HTML5 Canvas and JavaScript, packaged for desktop via Electron/Tauri.

### Core Premise & Theme
- **Setting**: An enormous high-density server warehouse / data center with decaying rack uptime, overheating units, disconnected links, and cascade failures.
- **Player Mechanics**:
  - Momentum-based physics: Low-friction, slippery raised data-center floors allowing drift and inertia.
  - Patch Cable Management: Dragging patch cables between racks, managing cable slack/tension, connecting switch/server ports to restore uptime before thermal throttles or critical failures occur.

### Current Architectural Focus & Milestone
1. **Virtual Tracking Camera**:
   - Smooth target tracking (lerp / dampening) following the sliding player.
   - World-to-screen and screen-to-world coordinate transformations.
   - Screen boundaries, lookahead based on player velocity, and zoom/shake capabilities.
2. **Viewport Culling**:
   - Spatial partitioning (uniform grid or bounding-box queries) for massive warehouse maps.
   - Strict frustum/viewport culling with safety margins to ensure only visible racks, cables, tiles, and particles draw per frame.
3. **Off-Screen Directional Alerts**:
   - Clamped edge-of-screen radar/indicators pointing to out-of-viewport racks undergoing uptime decay or alarms.
   - Dynamic distance readouts, color-coded urgency (warning vs. critical failure), and rotation pointing directly along the off-screen vector.
   - Objective Target Beacon: When dragging a patch cable, an emerald beacon points directly to the destination server rack across the warehouse.

4. **Incident & Patch Cable Mechanics**:
   - Random Chance Errors: Racks trigger randomized faults (e.g. `CABLE_DISCONNECT`) linking to another target rack across the warehouse.
   - Proximity Interaction: `[E]` grabs the patch cable from the failing rack.
   - Floor Physics Dragging: Cable trails smoothly behind sliding cart across data center aisles.
   - Target Port Snapping: Walking up to destination rack and pressing `[E]` plugs the cable in, restores uptime, spawns data sparks, and runs active data packet animations along the cable.
   - Cancel / Drop: `[Q]` drops the active cable.

5. **NOC Master Console & Auth Lockout Minigame**:
   - Random Chance Error `AUTH_LOCKOUT`: Racks trigger an authorization lockout with a randomized 4-digit PIN.
   - Master Station Desk: Positioned at the bottom (South) of the warehouse with multiple terminal displays and its own solid hitbox.
   - On-Foot PIN Retrieval: The player must physically slide to the failing rack and press `[E]` to read and copy the 4-digit PIN into their HUD clipboard buffer before they can solve it.
   - Terminal Minigame: Walking up to the South NOC Desk and pressing `[E]` opens the interactive cyber override terminal with keypad (supporting mouse clicks and physical keyboard input `0-9`, `Backspace`, `Enter`, `Escape`).
   - Live Emergency Countdowns in Keypad: Overheat timers across the warehouse—including the target node's 30s critical countdown—continue ticking live while inside the keypad modal, featuring a real-time countdown readout and depleting danger bar to maintain high-stakes tension.
   - Entering the correct PIN restores the rack's uptime and clears the alarm.

6. **Hitbox Obstacle Slalom & Cross-Aisle Walkways**:
   - Server racks have solid AABB hitboxes with elastic bounce and momentum deflection (`restitution: 0.45`).
   - Racks are spaced with ~63px gaps (player diameter is 32px), creating a fast, chaotic slalom drift experience.
   - Cross-Aisle Corridors: Every 5th vertical rack slot is omitted to provide open transit breaks across the warehouse.

7. **Configurable Movement Parameters (`CONFIG`)**:
   - `CONFIG.SPEED`: Maximum top velocity (e.g. 650).
   - `CONFIG.FRICTION`: Surface slipperiness (updated to `0.982` for fast, extended inertia drift).
   - `CONFIG.ACCELERATION`: Propulsion responsiveness (e.g. 1150).
   - `CONFIG.BRAKE_FRICTION`: Spacebar anchor strength (e.g. 0.88).

8. **Universal Server Codes**:
   - ALL server racks across the warehouse have persistent 4-digit diagnostic PINs.
   - Sliding up to ANY rack and pressing `[E]` reads and logs its PIN into the HUD clipboard buffer.

9. **IT Supply Depot & Powerup Economy**:
   - Data Credits (`⚡`): Earned by restoring cable links (+60⚡), authenticating PIN overrides (+75⚡), and high uptime dividends (+10⚡).
   - Supply Kiosk: Physical station positioned at the South wall (`x: Center + 120`, `y: 3030`) with solid hitboxes, or toggled on-demand via `[B]` key.
   - Powerup Catalog:
     - **High-Voltage Energy Drink** (Base: 150⚡, +50⚡ per purchase): Permanently boosts player maximum speed limit by +35 px/s per drink (with responsive acceleration scaling).
     - **Neodymium Floor Magnet** (Base: 150⚡, +50⚡ per purchase): Permanently increases ground friction and floor traction (reduces slip factor by -0.004 per purchase, clamped at 0.920) for sharper turning and faster braking on slippery tiles.
     - **Kinetic Cannon Charge** (150⚡ set fixed price): Bullet-time time freeze with Angry Birds style dotted trajectory aiming; slingshots player at 2150 px/s with frictionless air hockey puck physics and 0.92 elastic bank shot ricochets. (HUD indicator above head removed; charge count tracked and displayed in shop/toasts).
     - **Enterprise Server Node** (1000⚡ fixed price): Hot-swap chassis to replace and rebuild an exploded server node back to 100% operational uptime.
   - Removed Legacy Items: Overclock Thrusters, Mag-Grip Stabilizers, Auto-Patch Nanobots, and Thermal Coolant Flush have been removed.

10. **Critical Overheat, 30s Explosion & Enterprise Replacement Chassis**:
    - **No Teleporting / Recentering**: All quick reset/teleport buttons and keybinds have been completely removed.
    - **30-Second Critical Countdown**: When a server suffers a fault (Cable Disconnect or Auth Lockout), an internal 30-second timer begins ticking. Its on-rack countdown bar depletes and warning sparks emit.
    - **Catastrophic Explosion**: If 30 seconds elapse without the player solving the fault, the server explodes violently with 55 multi-hue fire particles, WebAudio bass boom, and heavy camera screen shake.
    - **Permanent Uptime Drag**: Exploded racks become charred ruins (`isDestroyed: true`) emitting periodic smoke. Their uptime is permanently locked to 0%, dragging down global warehouse uptime integrity and preventing high uptime dividends.
    - **Expensive Replacement**: An exploded server cannot be healed by normal means. It must be replaced by deploying an **Enterprise Server Node Chassis** (cost: 1000 ⚡, configurable via `CONFIG.ERRORS.REPLACEMENT_COST`), either by on-foot inspection with `[E]` or through the IT Supply Depot Shop.

11. **Progressive Difficulty & DEFCON Escalation**:
    - **Escalation Curve**: Fault interval gradually drops from `9.0s` down to `3.2s` over `210s` (3.5 minutes) of gameplay (`CONFIG.DIFFICULTY`).
    - **Concurrency Ceiling**: Max active concurrent faults scales dynamically from 2 up to 6.
    - **HUD Threat Readout**: Color-coded DEFCON rating displayed live in the top bar:
      - `DEFCON 5 // STABLE` (green)
      - `DEFCON 4 // ELEVATED` (cyan)
      - `DEFCON 3 // HIGH` (amber)
      - `DEFCON 2 // SEVERE` (orange)
      - `DEFCON 1 // CASCADE CRITICAL` (pulsing crimson)

12. **Multi-Computer Cord Chaining (`MULTI_CABLE_CHAIN`)**:
    - **Dynamic Daisy-Chain Bus Fault**: Racks trigger a multi-node bus corrupt error requiring a cord to be extended across a random length from 3 to 8 servers (e.g. Rack A ➔ Rack B ➔ ... ➔ Rack N).
    - **Active Chain Lighting**: Target servers you chain to **ONLY turn green** (`#00ff9d`) while actively holding their chain (`this.activeCable`). Before grabbing the cable or when dropped, destination servers remain visually normal.
    - **Hop Snapping**: Walking up to each sequential green target hop and pressing `[E]` locks that segment into the permanent bus (`MultiHopCable`), plays an intermediate chime with emerald sparks, and illuminates the next target hop green.
    - **Scaled Reward**: Restoring the full chain awards scaled credits based on chain length (`30 + (totalNodes * 20) ⚡`, awarding between +90⚡ for 3 servers up to +190⚡ for 8 servers) and resets uptime across the entire chain.
    - **Dropping/Reeling**: Pressing `[Q]` safely clears uncompleted segments, reels the cord back to origin, and un-highlights target servers.

13. **5-Second Hold-to-Reboot (`HARD_REBOOT`)**:
    - **Kernel Panic Freeze**: Servers encounter a thermal lockup requiring manual physical breaker restart.
    - **Proximity Hold**: Player must slide into proximity and hold `[E]` for 5 continuous seconds (`CONFIG.ERRORS.REBOOT_HOLD_TIME: 5.0`).
    - **Momentum Challenge**: Because the data center floor is slippery (`FRICTION: 0.982`), the player must skillfully brake with `[SPACE]` to avoid drifting out of range.
    - **Live Audio & Meter**: As `[E]` is held, a charging oscillator whines upward (160Hz ➔ 880Hz), electrical cyan sparks emit, and an on-rack recharge meter fills.
    - **Discharge Penalty**: Releasing `[E]` or drifting out of range prematurely resets progress with an audible shutdown discharge.
    - **Completion**: Completing the 5-second hold resets the server to 100% uptime and awards `+70 ⚡`.

14. **Kinetic Cannon Slingshot & Air Hockey Puck Mechanics (`CANNON`)**:
    - **Bullet-Time Freeze**: Pressing `[F]` completely freezes world time — racks, countdown timers, and particle physics halt while aiming.
    - **Angry Birds Dotted Line Trajectory**: Animated glowing dots march outward along the launch vector for the first ~440px. Raycasts against nearby server racks and world walls dynamically predict and draw bank-shot bounce reflections.
    - **Air Hockey Table Glide & Bank Shots**: Firing (via Left Click or `[SPACE]`/`[ENTER]`) unleashes the player at 2150 px/s with near-zero drag friction (`0.997`). Collision restitution against server racks and world perimeter walls jumps to `0.92`, causing the cart to ricochet energetically across aisles with authentic air-hockey acoustic clacks and cyan sparks.
    - **Shop & Inventory**: Available in the IT Supply Depot for 150 ⚡ per charge (set fixed price). The player starts with 1 free starter charge. Cancelling with `[ESC]` preserves the charge. The floating HUD indicator above the player's head has been removed.

15. **Unified Bottom Toast Notification System**:
    - **Bottom Notification Placement**: All in-game incident and fault alerts (e.g. `⚠️ FAULT AT RACK 53 [30s UNTIL EXPLOSION] ➔ RUN CABLE`, multi-chain corruptions, power breaker reboots, and auth lockouts), as well as action updates (cable grabbed/dropped, chassis rebuild, item purchases), pop up in the bottom status bar (`.hud-bottom-bar`) between the controls legend and the shop button.
    - **Come In and Leave Auto-Dismiss**: Notifications pop in smoothly with `@keyframes toast-pop-in`, remain visible for 3.5 seconds, and cleanly auto-dismiss (`hidden`), ensuring the player character and data center floor remain completely unobstructed.
    - **Dynamic Urgency Scheme**: Glassmorphic dark badge (`rgba(8, 14, 26, 0.94)` with `backdrop-filter: blur(12px)`), color-coded glow borders (amber for warning/faults, crimson for critical errors, emerald for links/rewards, cyan for cannon/general), animated icons, and text overflow protection.

16. **Main Menu, Operations Manual Tutorial, & Pause System**:
    - **Cyber Main Menu**:
      - Launches on initial page load with title `CABLED IN`, NOC Emergency Response Protocol branding, feature highlights (Low-Friction Drift, 30s Critical Overheat, IT Supply Depot), and controls legend.
      - **Live Warehouse Backdrop**: The game canvas runs an ambient camera pan across the warehouse rows behind a blurred glassmorphic overlay while incident timers and player inputs remain safely paused.
      - **Audio Autoplay Compliance**: Clicking `▶ START SHIFT [PLAY]` or `📖 OPERATIONS MANUAL [TUTORIAL]` initializes the Web Audio API context on first interaction.
    - **Interactive Facility Operations Manual (7-Slide Tutorial Modal)**:
      - Accessible directly from the Main Menu (`#btn-menu-tutorial`), in-game bottom bar (`MANUAL [H]`), or the pause screen.
      - Includes tabbed navigation, previous/next buttons, and interactive progress dots across 7 comprehensive operational modules:
        1. **Moving & Momentum Drift**: Explains slippery raised floor physics (`FRICTION: 0.982`), carrying momentum through turns, and navigating slalom cross-aisles.
        2. **Stopping & Spacebar Braking**: Explains how holding `[SPACE]` deploys hydraulic floor anchors (`BRAKE_FRICTION: 0.88`) to stop immediately and line up with racks.
        3. **IT Supply Depot & Powerups**: Details earning Data Credits (⚡) and catalog upgrades: High-Voltage Energy Drink (+35 px/s top speed), Neodymium Floor Magnet (enhanced grip/braking), Kinetic Cannon Slingshot (`[F]` air-hockey puck launch), and Enterprise Replacement Chassis (1000 ⚡).
        4. **Error 1: Connect Wire (`CABLE_DISCONNECT`)**: Crimson blinking rack; press `[E]` to grab patch cable, drift across aisles following the emerald beacon to the destination server, and press `[E]` to plug in and restore uptime (`+60 ⚡`); `[Q]` drops cable.
        5. **Error 2: Get Code & Auth Override (`AUTH_LOCKOUT`)**: Amber blinking rack; drift to failing rack and press `[E]` to scan 4-digit PIN into HUD clipboard; slide to South NOC Desk, press `[E]` to open keypad terminal, type PIN, and submit (`+75 ⚡`).
        6. **Error 3: 5-Second Hold Reboot (`HARD_REBOOT`)**: Cyan frozen rack; slide into proximity, hold `[E]` continuously for 5.0 seconds while counter-braking with `[SPACE]` to stay in range as the charge oscillator whines upward to restart (`+70 ⚡`).
        7. **30s Critical Overheat Hazard**: Explains the 30-second ticking clock before server racks explode into ruins, permanently locking uptime to 0% unless replaced with an Enterprise Chassis.
      - On the final slide, a prominent emerald `START SHIFT ▶` button launches directly into the shift.
    - **Pause Modal System**:
      - Pressing `[ESC]` or clicking the in-game `PAUSE [ESC]` button freezes game clocks, thermal countdowns, and cart physics.
      - Provides options to `RESUME SHIFT [ESC]`, open `OPERATIONS MANUAL [H]`, or `RETURN TO MAIN MENU`.

17. **Corrupted Bug Boss & Wire-Wrapping Restraint Mechanic**:
    - **10-Minute Breach**: After 10 minutes of elapsed gameplay (`CONFIG.BOSS.TRIGGER_TIME: 600`), an enormous cyber Bug Boss breaches violently from a central server rack.
    - **Slower Difficulty Escalation**: Threat ramp duration stretched to 600 seconds (`RAMP_DURATION: 600`), initial spawn interval relaxed to 14.0s (ramping down to 4.5s), and initial max concurrent errors set to 1 (scaling up to 5).
    - **Dev Shortcut (`[B]`)**: Pressing `[B]` during gameplay advances the shift clock directly to 10:00 and immediately triggers the Bug Boss emergence sequence. Shop modal toggle remapped to `[K]`.
    - **Containment Wire Restraint Mechanic**:
      - The boss's host server rack illuminates with a green containment beacon and prompt (`[E] GRAB CONTAINMENT WIRE`).
      - To defeat the boss, the player must grab this wire, skate into proximity, and wrap the wire around the boss 3 to 5 times (`CONFIG.BOSS.MIN_WRAPS: 3`, `MAX_WRAPS: 5`).
      - **Bidirectional Wrapping & Loop Reversal/Unwinding**:
        - Supports coiling either **Clockwise (CW)** or **Counter-Clockwise (CCW)**. The initial circling direction sets the active winding polarity.
        - If the player reverses movement direction after completing loop(s) or having partial progress in one direction, the wire unwinds: the in-progress angle depletes, and if it crosses zero, completed wraps decrement (`boss.completedWraps--`), emitting sparks, camera rumble, an acoustic unspool sweep (`playBossWrapUnwind()`), and a toast notification (`↩️ COIL UNWOUND! [X/Y]`).
        - Once all coils in that direction are completely unwound back to 0, continuing in the reverse direction dynamically flips wrap direction (`wrapDirection = -wrapDirection`), allowing the player to seamlessly begin wrapping in the opposite direction.
      - Each full 360-degree revolution cinches a visible high-voltage wire coil onto the bug's thorax, triggering electrical sparks, acoustic cinches, direction indicator toasts (`[CLOCKWISE]` / `[COUNTER-CLOCKWISE]`), and filling the Boss HUD restraint track.
    - **Player Health Bar & Boss Attacks**:
      - Player has an active System Integrity health meter (100 HP) in the HUD with damage vignette screen flashes and 1.2s invulnerability frames.
      - Boss possesses an AI combat state machine: Stalking crawl, telegraphing Lunge Dash (25 damage), Static EMP Ring Discharges (15 damage), and Melee Chassis Contact (20 damage).
      - Defibrillator Fallback: If player HP drops to 0, an emergency defibrillator reboots the cart at the South NOC Master Console with 75 HP.
    - **Incident Suspension & Post-Boss Fault Purge**:
      - Existing errors continue their 30s thermal timers during the boss fight, but no new faults spawn.
      - Defeating the boss triggers a massive explosion, awards `+500 ⚡`, and automatically purges and restores all active errors on living server nodes to 100% uptime (destroyed chassis remain charred ruins).

18. **Post-Boss Rogue Bug Infestation & Server Destruction Rampage**:
    - **Post-Boss Incident Type (`BUG_INFESTATION`)**:
      - Once the Corrupted Bug Boss is defeated (`this.bossDefeatedOnce = true`), rogue cyber bugs start emerging from computers across the warehouse (~28% roll during incident generation).
    - **Computer Breach & Autonomous Target Seeking**:
      - A small cyber bug crawls out from an origin server rack with alarm sirens, screen camera rumble, and red toxic glitch sparks.
      - It automatically acquires a living target server rack across the warehouse and scuttles directly towards it at 180 px/s with authentic insect leg locomotion, lateral wiggling, glowing red eyes, and toxic particle trails.
    - **Catastrophic Destruction & Continuous Rampage Loop**:
      - When the small bug reaches its target server, it crawls inside and triggers an immediate explosion (`targetRack.explode(game)`), reducing the node to charred 0% uptime ruins with screen shake, fire particles, and alarm audio.
      - **CRITICAL RAMPAGE MECHANIC**: The bug DOES NOT DIE or stop after destroying one server! If not crushed by the player, it immediately locks onto the next random living server and continues scuttling across aisles to destroy it, repeating indefinitely until neutralized.
    - **Momentum-Based Player Squash Mechanic**:
      - The player must slide their cart directly into the scuttling bug (`crushDistance: ~37px`).
      - Running it down crushes the bug with a heavy acoustic crunch/squish sound (`playBugSquish()`), screen shake, neon-green cyber bug guts explosion, and awards `+85 ⚡` Data Credits.
    - **Off-Screen Radar Warning Beacon**:
      - Clamped HUD edge radar displays a distinct magenta/crimson beacon pointing towards active rogue bugs (`🐛 SQUISH BUG ➔ RACK-XX`), with dynamic distance readouts to help the player track and intercept it.
    - **Dev Shortcut Key (`[N]`)**:
      - Pressing `[N]` during gameplay instantly spawns a rogue small bug from a random living server for rapid testing and debugging.

19. **Unique Quantum Teleporter Item & Post-Boss Reward**:
    - **Post-Boss Acquisition**:
      - Purging the Corrupted Bug Boss awards the exclusive, permanent prototype item: the **Quantum Teleporter Kit**.
      - Status is tracked live in the HUD tray (`.active-buffs-container`), cycling dynamically from `[PRESS T FOR NODE α]` to `[PRESS T FOR NODE β]`, and finally `[TELEPORT LINK ONLINE]`.
    - **Permanent 2-Node Placement Flow (`[T]`)**:
      - **First Press (`[T]`)**: Permanently deploys **Node Alpha [α]** (`#00f3ff`) at the player's coordinate with rising quantum chime audio (`playTeleportDeploy(0)`), digital sparks, and screen shake.
      - **Second Press (`[T]`)**: After moving across the warehouse (min distance: 120px), deploys **Node Beta [β]** (`#e024c3`) with harmonic resonant chords (`playTeleportDeploy(1)`), quantum shockwaves, and camera rumble.
      - Once placed, both nodes remain permanently fixed on the data center floor for the remainder of the game session.
    - **Instant Subspace Teleportation**:
      - **Automatic Step-On**: Gliding or drifting into a teleporter pad's activation circle (`dist < 30px`) immediately initiates a subspace warp to the counterpart pad.
      - **Manual Proximity Key (`[E]` / `[T]`)**: Pressing either key within `52px` of a node triggers the teleport jump.
      - **Visual & Acoustic Warp Feedback**: Origin pad triggers quantum implosion particles; destination pad detonates expanding shockwave rings and 50+ cyan/magenta sparks; the camera snaps smoothly to destination with visceral shake (`16px`); the viewport flashes with a custom cyan/violet warp vignette (`.damage-vignette.warp-flash`); and a deep frequency-dive WebAudio sweep plays (`playTeleportWarp()`).
      - **Cable Compatibility**: Trailing patch cables are cleanly re-anchored to the player's new position upon teleporting, avoiding physics snapping.
      - **Cooldown & Recharging Ring**: Internal 1.2s cooldown with an on-pad arc sweep indicator prevents infinite bouncing.
    - **Warehouse-Wide Off-Screen Radar Tracking**:
      - Clamped HUD edge radar displays color-coded beacons pointing directly toward off-screen nodes:
        - Cyan beacon: `🌀 NODE α (XXm)`
        - Magenta beacon: `🌀 NODE β (XXm)`
    - **Dev Shortcut Key (`Shift + T`)**:
      - Pressing `Shift + T` during gameplay grants the Quantum Teleporter Kit immediately for testing without waiting for or defeating the boss.

20. **Infinite 10-Minute Boss Escalation, New Incident Errors & Hardware Build Synergies**:
    - **Infinite 10-Minute Boss Wave Schedule**:
      - Every 10 minutes of elapsed shift time (`10:00`, `20:00`, `30:00`, `40:00`, `50:00`...), an alarm siren blares and an emergency boss encounter breaches from a central server rack.
      - Incident timers on existing faults continue ticking, but new standard incidents are suspended during the boss encounter.
      - Defeating any boss purges and restores all active errors on living server nodes to 100% uptime, clears the boss host rack, and awards progressive Data Credits (`500 * Wave ⚡`).
      - **Dev Shortcut Key (`[B]`)**: Pressing `[B]` advances the shift clock and immediately spawns the next boss wave (`Wave 1 ➔ Wave 2 ➔ Wave 3 ➔ Wave 4 ➔ Wave 5...`).
    - **Boss Wave Catalog & Mechanics**:
      - **Wave 1 (10:00) — Corrupted Bug Boss**:
        - Restraint: Containment Wire (`#00ff9d`).
        - Mechanics: Stalking crawl, telegraphing lunge dash (25 DMG), static EMP ring discharge (15 DMG), melee chassis contact (20 DMG).
        - Error Unlocked: `BUG_INFESTATION` (Rogue small bugs breach and rampage to destroy living servers).
        - Permanent Reward: **Quantum Teleporter Kit** (Deploy Node α and Node β to warp instantaneously).
      - **Wave 2 (20:00) — Thermal Golem Titan**:
        - Restraint: Cryo Coolant Hose (`#00f3ff`).
        - Mechanics: Molten magma core, ground thermal shockwave stomps (20 DMG), high contact density (25 DMG).
        - Error Unlocked: `COOLANT_LEAK` (Cryogenic pipe fractures spawn slippery ice slicks; player must hold `[E]` for 3.5s to seal the valve, awarding `+80 ⚡`).
        - Permanent Reward: **Cryo Deflector Shield** (Passive icy barrier that absorbs lethal chassis damage every 45s with freezing frost shatter).
      - **Wave 3 (30:00) — Spectral Daemon Anomaly**:
        - Restraint: Faraday Grounding Cable (`#c084fc`).
        - Mechanics: Dimensional phasing (alternates between visible and ethereal cloaking), telemetry distortion, telepathic phantom blasts (18 DMG).
        - Error Unlocked: `PHANTOM_GLITCH` (Spawns 2 holographic decoy server nodes with corrupt PINs; player must identify the authentic server, scan its PIN, and submit it at the South NOC Desk to dispel the anomaly, awarding `+90 ⚡`).
        - Permanent Reward: **Phase Dash Module** (Pressing `[SHIFT]` triggers an instantaneous subspace phase warp across 220px with glitch particles and 3.5s cooldown).
      - **Wave 4 (40:00) — Titan Colossus Fortress**:
        - Restraint: Heavy SCRAM Bus Cable (`#f59e0b`).
        - Mechanics: Massive dual-turret cyber fortress, rotational EMP flak mortar sweeps (22 DMG), chassis armor deflection.
        - Error Unlocked: `NETWORK_WORM` (Self-replicating cyber pathogen; if not cleansed within 12.0s, replicates and infects the nearest healthy server node; holding `[E]` for 2.5s purges the worm, awarding `+85 ⚡`).
        - Permanent Reward: **Nanotech Auto-Repair Hub** (Autonomous nanite swarm that passively regenerates cart health at +3 HP/s).
      - **Wave 5+ (50:00+) — Procedural Apex Entities**:
        - An infinite, procedural escalation engine that generates uniquely named titans (e.g. `VOID MONOLITH // APEX`, `NEXUS HYDRA // OVERLORD`, `CHRONO BEHEMOTH // PRIME`) with shifting HSL color palettes, dynamically generated restraint cables, orbiting defense satellites, compound attack patterns, and enrage acceleration below 50% restraint wraps.
        - Scaled Defeat Rewards: `500 * Wave ⚡` Data Credits plus permanent stat overclocks cycling between:
          - Maximum System Integrity boost (`+25 Max HP` with full heal).
          - Maximum Velocity boost (`+50 px/s` top drift speed).
          - Free starter charge of Kinetic Cannon Slingshot.
    - **IT Supply Depot Build Synergies (14 Hardware Items across 3 Archetypes)**:
      - Modal includes category filter tabs (`ALL HARDWARE`, `DRIFT VELOCITY`, `COMBAT ENFORCER`, `NETOPS ARCHITECT`) and an active build synergy tracker banner.
      - **Drift Velocity Build**:
        - Hardware: High-Voltage Energy Drink (+35 px/s speed), Neodymium Floor Magnet (enhanced grip/braking), Liquid Nitrogen Injector (`[SHIFT]` nitrous thrust with blue flames), Slalom Precision Springs (+25% rebound speed boost on rack bounce), Teflon Coated Skids (ultra-low drift friction `0.988`).
        - Synergies:
          - *Bronze (2 items)*: +15% Nitrous boost duration.
          - *Silver (3 items)*: +25 px/s permanent top velocity ceiling.
          - *Gold (4 items)*: Nitrous thrust leaves frictionless neon drift trail and cleanses collision stun.
      - **Combat Enforcer Build**:
        - Hardware: Kinetic Cannon Slingshot (`[F]` bullet-time air hockey launch), Spiked Chassis Bumper (+80% squash hitbox, 40 ram damage, +50 Max HP), EMP Shockwave Emitter (`[V]` pulse, 380px radius, stuns bugs/bosses), Nanotech Defibrillator Core (auto-revives at 100 HP on chassis destruction).
        - Synergies:
          - *Bronze (2 items)*: +10% EMP pulse radius and shockwave knockback.
          - *Silver (3 items)*: Kinetic Cannon starts with +1 extra charge and recovers 1 free charge on every boss defeat.
          - *Gold (4 items)*: Crushing rogue small bugs heals the cart by +15 HP.
      - **NetOps Architect Build**:
        - Hardware: Super-Conductive Reel (auto-snaps patch cables within 120px), Hex Diagnostic Decoder (180px PIN scan radius, green NOC keypad digit highlights), Autonomous Patch Drone (patrols warehouse, clears nearby faults and accelerates reboot holds), High-Yield Data Bonds (passive dividend of +35 ⚡ / +70 ⚡ every 30s), Enterprise Replacement Chassis (hot-swap chassis to restore exploded servers).
        - Synergies:
          - *Bronze (2 items)*: +30 ⚡ bonus credits on all error clears.
          - *Silver (3 items)*: Hold-to-reboot time reduced from 5.0s to 3.0s.
          - *Gold (4 items)*: Critical server overheat explosion timer extended from 30s to 45s.


