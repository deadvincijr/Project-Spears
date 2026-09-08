/**
 * Aegis of the Void - Items, Relics & Synergy Matrix
 */

const ITEM_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  BOSS: 'boss',
  SYNERGY: 'synergy'
};

const BASE_ITEMS = {
  lightning_spire: {
    id: 'lightning_spire',
    name: 'Lightning Spire',
    icon: '⚡',
    rarity: ITEM_RARITY.RARE,
    element: 'electric',
    desc: 'Attacks have a 35% chance to discharge chain lightning, striking up to 3 nearby foes for 75% damage.',
    synergies: ['plasma_arcs', 'tempest_spear']
  },
  flame_infusion: {
    id: 'flame_infusion',
    name: 'Flame Infusion',
    icon: '🔥',
    rarity: ITEM_RARITY.COMMON,
    element: 'fire',
    desc: 'Attacks ignite foes, inflicting 40% weapon damage as burn over 3 seconds.',
    synergies: ['plasma_arcs', 'toxic_cataclysm', 'supernova_rift']
  },
  frostbite_needle: {
    id: 'frostbite_needle',
    name: 'Frostbite Needle',
    icon: '❄️',
    rarity: ITEM_RARITY.COMMON,
    element: 'frost',
    desc: 'Slows hit enemies by 40%. Repeated hits stack chill; at 3 stacks, targets are frozen solid for 1.5s.',
    synergies: ['absolute_shatter']
  },
  explosive_tip: {
    id: 'explosive_tip',
    name: 'Explosive Tip',
    icon: '💥',
    rarity: ITEM_RARITY.RARE,
    element: 'explosive',
    desc: 'Spears explode upon impact, dealing 65% area damage in an 80px blast radius.',
    synergies: ['absolute_shatter', 'supernova_rift']
  },
  triple_spear: {
    id: 'triple_spear',
    name: 'Split Spears',
    icon: '🔱',
    rarity: ITEM_RARITY.RARE,
    element: 'physical',
    desc: 'Launch +2 additional spears in an angled spread with each attack.',
    synergies: ['tempest_spear', 'phalanx_abyss']
  },
  piercing_core: {
    id: 'piercing_core',
    name: 'Piercing Core',
    icon: '🗡️',
    rarity: ITEM_RARITY.COMMON,
    element: 'physical',
    desc: 'Spears pierce through 2 additional enemies and travel 20% faster.',
    synergies: ['phalanx_abyss']
  },
  vampiric_fang: {
    id: 'vampiric_fang',
    name: 'Vampiric Fang',
    icon: '🩸',
    rarity: ITEM_RARITY.EPIC,
    element: 'blood',
    desc: 'Critical strikes siphon 6 HP. Defeating an enemy heals 2 HP.',
    synergies: ['crimson_aegis']
  },
  void_rift_dash: {
    id: 'void_rift_dash',
    name: 'Void Rift Dash',
    icon: '🌀',
    rarity: ITEM_RARITY.EPIC,
    element: 'void',
    desc: 'Dashing tears reality, leaving a swirling gravitational void rift that pulls and damages enemies.',
    synergies: ['void_singularity', 'supernova_rift']
  },
  orbital_glaives: {
    id: 'orbital_glaives',
    name: 'Orbital Glaives',
    icon: '🛡️',
    rarity: ITEM_RARITY.RARE,
    element: 'arcane',
    desc: 'Two celestial blades orbit you, slicing nearby enemies for continuous damage and deflecting enemy projectiles.',
    synergies: ['crimson_aegis', 'phalanx_abyss']
  },
  magnet_relic: {
    id: 'magnet_relic',
    name: 'Attractor Relic',
    icon: '🧲',
    rarity: ITEM_RARITY.COMMON,
    element: 'utility',
    desc: 'Expands your pickup collection radius by +130% and periodically draws distant energy orbs to you.',
    synergies: ['void_singularity']
  },
  titan_heart: {
    id: 'titan_heart',
    name: 'Titan Heart',
    icon: '💖',
    rarity: ITEM_RARITY.COMMON,
    element: 'survival',
    desc: '+60 Max HP. Automatically generates an energy barrier that absorbs up to 50 damage and recharges out of combat.',
    synergies: []
  },
  hermes_wings: {
    id: 'hermes_wings',
    name: 'Zephyr Greaves',
    icon: '👟',
    rarity: ITEM_RARITY.COMMON,
    element: 'mobility',
    desc: '+28% Movement Speed and reduces Dash cooldown by 30%.',
    synergies: []
  },
  berserker_crest: {
    id: 'berserker_crest',
    name: 'Berserker Crest',
    icon: '💀',
    rarity: ITEM_RARITY.EPIC,
    element: 'fury',
    desc: 'As your health decreases, gain up to +120% attack damage and +40% attack speed.',
    synergies: []
  },
  kinetic_battery: {
    id: 'kinetic_battery',
    name: 'Kinetic Battery',
    icon: '🔋',
    rarity: ITEM_RARITY.COMMON,
    element: 'kinetic',
    desc: 'Moving accumulates kinetic charge up to 100. At full charge, your next attack emits a 360° sonic shockwave.',
    synergies: ['tempest_spear']
  },
  acid_spores: {
    id: 'acid_spores',
    name: 'Caustic Spores',
    icon: '🧪',
    rarity: ITEM_RARITY.COMMON,
    element: 'poison',
    desc: 'Slain monsters dissolve into caustic acid pools that severely corrode armor and poison enemies walking through.',
    synergies: ['toxic_cataclysm']
  },
  chronos_hourglass: {
    id: 'chronos_hourglass',
    name: 'Chronos Hourglass',
    icon: '⏳',
    rarity: ITEM_RARITY.EPIC,
    element: 'time',
    desc: 'Distorts spacetime around you: incoming enemy projectiles move 45% slower within your vicinity.',
    synergies: []
  },
  overcharge_coil: {
    id: 'overcharge_coil',
    name: 'Overcharge Coil',
    icon: '💠',
    rarity: ITEM_RARITY.RARE,
    element: 'crit',
    desc: '+25% Critical Hit Chance and +60% Critical Strike Damage.',
    synergies: []
  },
  dungeon_lantern: {
    id: 'dungeon_lantern',
    name: "Dungeoneer's Lantern",
    icon: '🏮',
    rarity: ITEM_RARITY.RARE,
    element: 'utility',
    desc: 'Expands your field of vision through dark maze corridors by +60% and illuminates distant chambers.',
    synergies: []
  },
  skeleton_key: {
    id: 'skeleton_key',
    name: 'Skeleton Key',
    icon: '🗝️',
    rarity: ITEM_RARITY.EPIC,
    element: 'utility',
    desc: 'Unlocks all Runic Gates without needing to find a key, and doubles shard drops from smashed urns.',
    synergies: []
  },
  boss_void_crown: {
    id: 'boss_void_crown',
    name: 'Crown of the Void Sovereign',
    icon: '👑🌌',
    rarity: ITEM_RARITY.BOSS,
    element: 'void',
    desc: 'Arcane spears have a 30% chance to rip open miniature Void Rifts pulling foes inward. Void Dash cooldown is reduced by 35% and leaves a lasting cosmic rift.',
    isBossRelic: true,
    bossSource: 'Malakor, Void Monarch',
    color: '#a855f7',
    synergies: []
  },
  boss_infernal_core: {
    id: 'boss_infernal_core',
    name: 'Molten Core of Ignis',
    icon: '❤️‍🔥',
    rarity: ITEM_RARITY.BOSS,
    element: 'fire',
    desc: 'Every 3.5s, calls down a fiery sky meteor on nearby foes for 200 damage. Attacks inflict permanent hellfire (30 dmg/sec) and grant +25% movespeed near burning enemies.',
    isBossRelic: true,
    bossSource: 'Ignis, Infernal Titan',
    color: '#ea580c',
    synergies: []
  },
  boss_tempest_eye: {
    id: 'boss_tempest_eye',
    name: 'Eye of the Tempest Wyrm',
    icon: '👁️⚡',
    rarity: ITEM_RARITY.BOSS,
    element: 'electric',
    desc: 'Arcane spears call down violent chain lightning on hit (up to 4 targets for 85 damage). Barrier emits a crackling electrostatic shield that zaps attackers for 75 damage.',
    isBossRelic: true,
    bossSource: 'Zephyrus, Tempest Wyrm',
    color: '#06b6d4',
    synergies: []
  }
};

const SYNERGIES = {
  plasma_arcs: {
    id: 'plasma_arcs',
    name: 'Plasma Arcs',
    icon: '🌌',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['lightning_spire', 'flame_infusion'],
    desc: 'Chain lightning transmutes into searing plasma beams that leave lasting scorch zones and melt enemy hordes.',
    color: '#38bdf8'
  },
  absolute_shatter: {
    id: 'absolute_shatter',
    name: 'Absolute Shatter',
    icon: '❄️💥',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['frostbite_needle', 'explosive_tip'],
    desc: 'Frozen enemies violently shatter when struck, firing high-velocity icicle shrapnel that freezes and executes nearby foes.',
    color: '#93c5fd'
  },
  void_singularity: {
    id: 'void_singularity',
    name: 'Void Singularity',
    icon: '🕳️',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['void_rift_dash', 'magnet_relic'],
    desc: 'Dash rifts become monstrous gravitational singularities, violently pulling in all monsters on screen before imploding.',
    color: '#a855f7'
  },
  crimson_aegis: {
    id: 'crimson_aegis',
    name: 'Crimson Aegis',
    icon: '🩸🛡️',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['vampiric_fang', 'orbital_glaives'],
    desc: 'Orbital glaives siphon lifeforce from shredded enemies to continuously recharge and overcharge your Barrier shield.',
    color: '#f43f5e'
  },
  tempest_spear: {
    id: 'tempest_spear',
    name: 'Tempest Javelins',
    icon: '⚡🔱',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['triple_spear', 'kinetic_battery', 'lightning_spire'],
    desc: 'Kinetic charge calls down devastating thunderbolts on all spears, unleashing a homing hurricane barrage.',
    color: '#fbbf24'
  },
  toxic_cataclysm: {
    id: 'toxic_cataclysm',
    name: 'Toxic Cataclysm',
    icon: '🧪🔥',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['acid_spores', 'flame_infusion'],
    desc: 'Caustic acid pools detonate on contact with fire, triggering room-clearing emerald chain-reactions.',
    color: '#22c55e'
  },
  supernova_rift: {
    id: 'supernova_rift',
    name: 'Supernova Rift',
    icon: '💥🌀',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['void_rift_dash', 'explosive_tip'],
    desc: 'Exiting a dash unleashes a thermonuclear shockwave that blows back and incinerates surrounding swarms.',
    color: '#f97316'
  },
  phalanx_abyss: {
    id: 'phalanx_abyss',
    name: 'Abyssal Phalanx',
    icon: '🗡️🛡️',
    rarity: ITEM_RARITY.SYNERGY,
    requires: ['piercing_core', 'orbital_glaives', 'triple_spear'],
    desc: 'Your orbital blades replicate and fire piercing projectile duplicates in a 360-degree shredding ring every 3 seconds.',
    color: '#ec4899'
  }
};

class InventorySystem {
  constructor() {
    this.items = new Map(); // id -> count
    this.activeSynergies = new Set(); // synergyId
  }

  reset() {
    this.items.clear();
    this.activeSynergies.clear();
  }

  addItem(itemId) {
    const current = this.items.get(itemId) || 0;
    this.items.set(itemId, current + 1);

    // Check for newly activated synergies
    const newSynergies = this.checkSynergies();
    return newSynergies;
  }

  hasItem(itemId) {
    return (this.items.get(itemId) || 0) > 0;
  }

  getItemCount(itemId) {
    return this.items.get(itemId) || 0;
  }

  checkSynergies() {
    const newlyUnlocked = [];
    for (const [synId, syn] of Object.entries(SYNERGIES)) {
      if (!this.activeSynergies.has(synId)) {
        const canForm = syn.requires.every(reqId => this.hasItem(reqId));
        if (canForm) {
          this.activeSynergies.add(synId);
          newlyUnlocked.push(syn);
        }
      }
    }
    return newlyUnlocked;
  }

  hasSynergy(synId) {
    return this.activeSynergies.has(synId);
  }

  // Generate 3 random upgrade choices for chest/shrine
  getRandomUpgradeOptions(count = 3) {
    const itemPool = Object.keys(BASE_ITEMS).filter(id => !BASE_ITEMS[id].isBossRelic);
    // Prioritize items that can trigger a synergy with already-owned items!
    const scoredPool = itemPool.map(id => {
      let score = 1;
      const item = BASE_ITEMS[id];
      if (item.synergies) {
        for (const synKey of item.synergies) {
          const syn = SYNERGIES[synKey];
          if (syn) {
            // Count how many ingredients we already have
            const ownedIngredients = syn.requires.filter(reqId => this.hasItem(reqId)).length;
            if (ownedIngredients > 0 && !this.hasSynergy(synKey)) {
              score += 4; // High weight: helps complete an upcoming synergy!
            }
          }
        }
      }
      return { id, score };
    });

    const choices = [];
    const poolCopy = [...scoredPool];

    while (choices.length < count && poolCopy.length > 0) {
      const totalScore = poolCopy.reduce((acc, curr) => acc + curr.score, 0);
      let rand = Math.random() * totalScore;
      let selectedIdx = 0;

      for (let i = 0; i < poolCopy.length; i++) {
        rand -= poolCopy[i].score;
        if (rand <= 0) {
          selectedIdx = i;
          break;
        }
      }

      const chosen = poolCopy.splice(selectedIdx, 1)[0];
      choices.push(BASE_ITEMS[chosen.id]);
    }

    return choices;
  }
}

// Global inventory singleton
window.inventory = new InventorySystem();
