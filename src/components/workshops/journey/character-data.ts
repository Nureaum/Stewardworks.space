// Character data extracted from the Pilot Workshops HTML prototype
// All sprite rects are [x, y, width, height, color] for a 28×28 or 16×16 grid
// Color tokens: A=accent, AD=accent dark, SK=skin, SD=skin dark, HR=hair, HD=hair dark

export type SpriteRect = [number, number, number, number, string]

export interface CharacterDef {
  key: string
  name: string
  kind: string
  people: boolean
  skinDefault: string | null
  rects: SpriteRect[]
  faceFx?: SpriteRect[]
}

export interface AccentOption {
  id: string
  color: string
}

// ── Darken helper ──
export function darken(hex: string, factor: number): string {
  try {
    let h = (hex || '#000').replace('#', '')
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    const n = parseInt(h, 16)
    let r = (n >> 16) & 255
    let g = (n >> 8) & 255
    let b = n & 255
    r = Math.round(r * (1 - factor))
    g = Math.round(g * (1 - factor))
    b = Math.round(b * (1 - factor))
    return '#' + [r, g, b].map(v => ('0' + v.toString(16)).slice(-2)).join('')
  } catch {
    return hex
  }
}

const _wht = '#f7f0ff'
const _eye = '#241826'
const _mth = '#8a3a52'

/** Build humanoid base sprite from skin/hair/pant colors */
function hum(
  skin: string,
  hair: string,
  hairR: SpriteRect[],
  pant: string,
  extra?: SpriteRect[],
  bodyType?: string
): SpriteRect[] {
  const pS = darken(pant, 0.3)
  const shoe = '#211722'
  const shoeHi = '#3a2b3a'
  const bt = bodyType || 'classic'
  const gold = '#ffd23f'
  const goldD = '#c99020'
  const _wht = '#f7f0ff'
  const _eye = '#241826'
  const _mth = '#8a3a52'

  let body: SpriteRect[] = []

  if (bt === 'masc') {
    body = [
      [7,13,14,2,'A'],
      [7,13,1,2,'AD'],[20,13,1,2,'AD'],
      [7,15,14,1,'A'],[8,16,12,2,'A'],[8,18,12,1,'A'],[9,19,10,2,'A'],
      [7,15,1,1,'AD'],[20,15,1,1,'AD'],[8,16,1,3,'AD'],[19,16,1,3,'AD'],
      [13,15,1,5,'AD'],
      [9,16,2,2,'AD'],[17,16,2,2,'AD'],
      [5,14,2,6,'A'],[21,14,2,6,'A'],
      [5,14,1,6,'AD'],[22,14,1,6,'AD'],
      [5,20,2,2,'SK'],[21,20,2,2,'SK'],
      [5,20,1,2,'SD'],[22,20,1,2,'SD'],
      [8,21,12,1,'AD'],[13,21,2,1,gold],
      [8,22,5,5,pant],[15,22,5,5,pant],
      [8,22,1,5,pS],[15,22,1,5,pS],
      [7,26,7,1,shoe],[15,26,6,1,shoe],
      [7,25,6,1,shoeHi],[15,25,5,1,shoeHi]
    ] as SpriteRect[]
  } else if (bt === 'fem') {
    body = [
      [12,13,3,1,'SK'],[15,13,1,1,'SD'],
      [11,14,6,1,'A'],
      [10,15,8,1,'A'],
      [10,15,1,1,'AD'],[17,15,1,1,'AD'],
      [10,16,8,1,'A'],
      [10,16,1,1,'AD'],[17,16,1,1,'AD'],[13,16,1,1,'AD'],
      [10,17,8,1,'A'],
      [10,17,1,1,'AD'],[17,17,1,1,'AD'],
      [10,18,8,1,'AD'],[12,18,4,1,gold],
      [8,15,2,3,'A'],[18,15,2,3,'A'],
      [8,15,1,3,'AD'],[19,15,1,3,'AD'],
      [8,18,2,2,'SK'],[18,18,2,2,'SK'],
      [8,18,1,2,'SD'],[19,18,1,2,'SD'],
      [10,19,8,1,'A'],[9,20,10,1,'A'],[9,21,10,1,'A'],[8,22,12,1,'A'],
      [13,19,1,4,'AD'],
      [10,19,1,1,'AD'],[9,20,1,1,'AD'],[8,22,1,1,'AD'],[17,21,1,1,'AD'],
      [10,23,3,3,pant],[15,23,3,3,pant],
      [10,23,1,3,pS],[15,23,1,3,pS],
      [9,26,5,2,shoe],[14,26,5,2,shoe],
      [9,26,5,1,shoeHi],[14,26,5,1,shoeHi]
    ] as SpriteRect[]
  } else if (bt === 'enby') {
    body = [
      [8,13,12,1,'A'],[8,14,12,9,'A'],
      [8,14,1,9,'AD'],[19,14,1,9,'AD'],
      [13,14,1,9,'AD'],
      [8,22,12,1,'AD'],
      [9,17,10,1,'AD'],
      [6,14,2,7,'A'],[20,14,2,7,'A'],
      [6,14,1,7,'AD'],[21,14,1,7,'AD'],
      [6,21,2,1,'SK'],[20,21,2,1,'SK'],
      [9,23,4,4,pant],[15,23,4,4,pant],
      [9,23,1,4,pS],[15,23,1,4,pS],
      [9,26,5,1,shoe],[15,26,5,1,shoe],
      [9,25,4,1,shoeHi],[15,25,4,1,shoeHi]
    ] as SpriteRect[]
  } else if (bt === 'hero') {
    body = [
      [7,14,14,7,'A'],
      [7,14,2,7,'AD'],[19,14,2,7,'AD'],
      [4,12,6,3,'A'],[18,12,6,3,'A'],
      [4,12,1,3,'AD'],[23,12,1,3,'AD'],
      [4,12,6,1,gold],[18,12,6,1,gold],
      [5,15,2,5,'A'],[21,15,2,5,'A'],
      [5,20,2,2,'SK'],[21,20,2,2,'SK'],
      [13,15,2,1,gold],[12,16,4,1,gold],[13,17,2,1,gold],[12,17,1,1,goldD],[15,17,1,1,goldD],
      [7,21,14,1,gold],[7,21,1,1,goldD],[20,21,1,1,goldD],
      [8,22,5,5,pant],[15,22,5,5,pant],
      [8,22,1,5,pS],[15,22,1,5,pS],
      [7,26,7,1,shoe],[14,26,7,1,shoe],
      [7,25,6,1,shoeHi],[15,25,6,1,shoeHi]
    ] as SpriteRect[]
  } else {
    body = [
      [8,13,12,1,'A'],[8,14,12,9,'A'],
      [8,14,1,9,'AD'],[19,14,1,9,'AD'],
      [13,14,1,9,'AD'],[8,22,12,1,'AD'],
      [6,14,2,7,'A'],[20,14,2,7,'A'],
      [6,14,1,7,'AD'],[21,14,1,7,'AD'],
      [6,21,2,1,'SK'],[20,21,2,1,'SK'],
      [9,23,4,4,pant],[15,23,4,4,pant],
      [9,23,1,4,pS],[15,23,1,4,pS],
      [9,26,5,1,shoe],[15,26,5,1,shoe],
      [9,25,4,1,shoeHi],[15,25,4,1,shoeHi]
    ] as SpriteRect[]
  }

  let head: SpriteRect[] = [
    [12,11,4,2,'SK'],[12,12,4,1,'SD'],
    [10,3,8,1,'SK'],[9,4,10,7,'SK'],[11,10,6,1,'SK'],
    [17,4,1,7,'SD'],[9,10,1,1,'SD'],
    [8,6,1,2,'SK'],[19,6,1,2,'SK'],[19,6,1,2,'SD'],
    ...(hairR || []),
    [11,4,2,1,'HD'],[15,4,2,1,'HD'],
    [11,6,2,2,_wht],[15,6,2,2,_wht],
    [11,7,1,1,_eye],[15,7,1,1,_eye],
    [14,8,1,1,'SD'],
    [13,10,2,1,_mth],[12,9,1,1,'SD'],[15,9,1,1,'SD']
  ] as SpriteRect[]

  return [...(extra || []), ...body, ...head]
}


// ── 12 Characters ──
export const CHARACTERS: Record<string, CharacterDef> = {
  nayeli: { key: 'nayeli', name: 'NAYELI', kind: 'Steward', people: true, skinDefault: '#f0c090',
    rects: hum('#f0c090', '#3a241f', [[10,2,8,1,'HR'],[9,3,10,1,'HR'],[10,3,8,1,'HD'],[9,4,1,11,'HR'],[18,4,1,11,'HR'],[8,5,1,10,'HR'],[19,5,1,10,'HR'],[8,14,1,1,'HD'],[19,14,1,1,'HD']], '#3a2f6a', undefined, 'fem') },
  mateo: { key: 'mateo', name: 'MATEO', kind: 'Steward', people: true, skinDefault: '#a56a43',
    rects: hum('#a56a43', '#1c120a', [[10,2,8,1,'HR'],[9,3,10,1,'HR'],[9,4,1,3,'HR'],[18,4,1,3,'HR'],[10,3,8,1,'HD']], '#2a2550', undefined, 'masc') },
  sam: { key: 'sam', name: 'SAM', kind: 'Steward', people: true, skinDefault: '#d99a6a',
    rects: hum('#d99a6a', '#241812', [[10,2,8,1,'HR'],[9,3,9,1,'HR'],[16,2,3,2,'HR'],[9,4,1,3,'HR'],[18,4,1,4,'HR'],[10,3,7,1,'HD']], '#3a2f6a', undefined, 'enby') },
  roadrunner: { key: 'roadrunner', name: 'RÍO', kind: 'Roadrunner', people: false, skinDefault: null,
    rects: [[3,15,3,2,'#6a5a3a'],[2,13,3,2,'#7a6a4a'],[1,12,2,2,'#8a7656'],[6,14,9,6,'#8a7656'],[6,14,9,1,'#a08c66'],[6,19,9,1,'#6a5a3a'],[14,13,2,3,'#9a8666'],[16,10,5,5,'#9a8666'],[16,10,5,1,'#a8946a'],[17,8,2,3,'#3a2a1a'],[18,7,1,2,'#3a2a1a'],[19,12,1,1,'#241033'],[19,12,1,1,'A'],[21,12,4,1,'#e0b040'],[21,13,3,1,'#c99020'],[8,20,1,4,'#4a3a2a'],[12,20,1,4,'#4a3a2a'],[7,24,3,1,'#4a3a2a'],[11,24,3,1,'#4a3a2a']] },
  coyote: { key: 'coyote', name: 'CENIZO', kind: 'Coyote', people: false, skinDefault: null,
    rects: [[1,15,3,3,'#8a6a44'],[0,14,2,2,'#a08050'],[3,14,5,5,'#a08050'],[3,14,5,1,'#b89468'],[7,15,10,4,'#b89468'],[7,15,10,1,'#c8a478'],[16,10,6,6,'#c8a478'],[16,10,6,1,'#d8b488'],[16,8,2,3,'#8a6a44'],[20,8,2,3,'#8a6a44'],[21,14,3,1,'#8a6a44'],[22,15,2,1,'#6a4f30'],[19,12,1,1,'#241033'],[19,12,1,1,'A'],[4,19,2,5,'#8a6a44'],[7,19,2,5,'#8a6a44'],[12,19,2,5,'#8a6a44'],[15,19,2,5,'#8a6a44'],[4,24,2,1,'#6a4f30'],[7,24,2,1,'#6a4f30'],[12,24,2,1,'#6a4f30'],[15,24,2,1,'#6a4f30']] },
  tortoise: { key: 'tortoise', name: 'MOJAVE', kind: 'Desert Tortoise', people: false, skinDefault: null,
    rects: [[6,11,13,8,'#8a7a3a'],[7,10,11,1,'#9a8a4a'],[7,11,11,1,'#a89860'],[8,13,3,2,'#6a5a26'],[13,13,3,2,'#6a5a26'],[10,16,3,2,'#6a5a26'],[7,15,2,2,'#6a5a26'],[15,15,2,2,'#6a5a26'],[18,13,5,4,'#a89860'],[18,13,5,1,'#c0b070'],[21,14,1,1,'#241033'],[21,14,1,1,'A'],[4,15,3,2,'#9a8a4a'],[7,19,3,3,'#9a8a4a'],[10,19,3,3,'#8a7a3a'],[14,19,3,3,'#9a8a4a']] },
  jackrabbit: { key: 'jackrabbit', name: 'LIEBRE', kind: 'Jackrabbit', people: false, skinDefault: null,
    rects: [[9,2,2,8,'#b89870'],[13,2,2,8,'#b89870'],[10,3,1,6,'#e0a8a8'],[13,3,1,6,'#e0a8a8'],[8,10,9,6,'#d8c0a0'],[8,10,9,1,'#e8d4b4'],[15,12,1,1,'#241033'],[15,12,1,1,'A'],[17,13,1,1,'#e07a90'],[6,16,10,5,'#c8b090'],[6,16,10,1,'#d8c0a0'],[6,20,3,4,'#b89870'],[11,20,3,4,'#b89870'],[4,17,2,2,'#f0ece0']] },
  quail: { key: 'quail', name: 'GAMBEL', kind: "Gambel's Quail", people: false, skinDefault: null,
    rects: [[15,3,2,4,'#20140c'],[16,2,2,2,'#20140c'],[11,7,7,6,'#7a6a4a'],[11,7,7,1,'#8a7a58'],[12,8,4,2,'#241a10'],[16,9,1,1,'#f0ece0'],[16,9,1,1,'A'],[18,9,4,1,'#e0b040'],[18,10,2,1,'#c99020'],[6,12,11,7,'#9a8a6a'],[8,14,7,4,'#c8a878'],[6,12,11,1,'#a89878'],[5,13,3,3,'#7a6a4a'],[9,19,1,4,'#e0b040'],[13,19,1,4,'#e0b040']] },
  chuckwalla: { key: 'chuckwalla', name: 'ROCA', kind: 'Chuckwalla', people: false, skinDefault: null,
    rects: [[1,15,4,3,'#8a6a44'],[0,16,2,2,'#7a5c3a'],[4,13,14,6,'#9a7850'],[4,14,14,2,'#b89060'],[4,13,14,1,'#a88458'],[17,12,5,5,'#a07a52'],[17,12,5,1,'#b8905f'],[21,14,1,1,'#241033'],[21,14,1,1,'A'],[6,15,1,1,'#6a4f30'],[9,16,1,1,'#6a4f30'],[12,15,1,1,'#6a4f30'],[14,17,1,1,'#6a4f30'],[5,19,2,3,'#7a5c3a'],[9,19,2,3,'#7a5c3a'],[13,19,2,3,'#7a5c3a'],[16,18,2,3,'#7a5c3a']] },
    quest: { key: 'quest', name: 'VALE', kind: 'Valley Quest Hero', people: true, skinDefault: '#e8b088',
    rects: hum('#e8b088', '#3a1a4a', [[10,2,8,1,'HR'],[9,3,10,1,'HR'],[9,4,1,5,'HR'],[18,4,1,5,'HR'],[8,5,1,4,'HR'],[19,5,1,4,'HR'],[10,2,8,1,'HD']], '#5a3f9a',
    [[3,13,3,12,'#ff5fd2'],[22,13,3,12,'#ff5fd2'],[3,13,1,12,'#c2359e'],[24,13,1,12,'#c2359e'],[4,24,19,2,'#ff5fd2'],[4,25,19,1,'#c2359e'],[10,2,8,1,'#ffd23f'],[10,0,2,2,'#ffd23f'],[13,0,2,2,'#ffd23f'],[16,0,2,2,'#ffd23f']], 'hero'),
    faceFx: [[9,5,10,1,'#ffd23f'],[9,6,2,2,'#3a1a6a'],[17,6,2,2,'#3a1a6a'],[13,6,2,2,'#3a1a6a'],[9,8,4,1,'#3a1a6a'],[15,8,4,1,'#3a1a6a']] },
  kitfox: { key: 'kitfox', name: 'ZORRO', kind: 'Kit Fox', people: false, skinDefault: null,
    rects: [[7,3,3,5,'#e6c99a'],[15,3,3,5,'#e6c99a'],[8,4,1,3,'#3a2a1a'],[16,4,1,3,'#3a2a1a'],[8,7,9,6,'#f0dcc0'],[8,7,9,1,'#f6ecd6'],[9,7,7,1,'#e6c99a'],[10,9,1,2,'#241033'],[15,9,1,2,'#241033'],[10,9,1,1,'A'],[15,9,1,1,'A'],[12,11,2,1,'#3a2a1a'],[9,13,8,6,'#e6c99a'],[10,14,6,4,'#f6ecd6'],[17,14,5,2,'#e6c99a'],[21,12,2,3,'#f6ecd6'],[9,19,2,4,'#d9b98a'],[14,19,2,4,'#d9b98a']] },
  bighorn: { key: 'bighorn', name: 'BORREGO', kind: 'Desert Bighorn', people: false, skinDefault: null,
    rects: [[5,4,3,3,'#c9a86a'],[3,5,2,5,'#c9a86a'],[3,10,3,2,'#b89a70'],[5,11,2,1,'#c9a86a'],[17,4,3,3,'#c9a86a'],[20,5,2,5,'#c9a86a'],[19,10,3,2,'#b89a70'],[18,11,2,1,'#c9a86a'],[9,4,8,7,'#a0805a'],[9,4,8,1,'#b0906a'],[10,6,1,1,'#241033'],[14,6,1,1,'#241033'],[10,6,1,1,'A'],[11,8,4,1,'#6a5030'],[8,11,10,8,'#8a6a44'],[8,12,10,1,'#9a7a54'],[8,19,2,4,'#6a5030'],[11,19,2,4,'#6a5030'],[14,19,2,4,'#6a5030'],[16,19,2,4,'#6a5030']] },
}

export const CHARACTER_ORDER = ['nayeli','mateo','sam','roadrunner','coyote','tortoise','jackrabbit','quail','chuckwalla','quest','kitfox','bighorn']

// ── Accent colors (Signal Aura) ──
export const ACCENTS: AccentOption[] = [
  { id: 'cyan', color: '#45d6ff' },
  { id: 'pink', color: '#ff5fd2' },
  { id: 'lime', color: '#74f0a0' },
  { id: 'gold', color: '#ffd23f' },
  { id: 'violet', color: '#b06bff' },
  { id: 'coral', color: '#ff8a4a' },
]

// ── Skin tones (Field Tint, people only) ──
export const TINTS = ['#f6d3ad', '#e8b088', '#c98a5a', '#9a6a3f', '#6f4a2c']

// ── Headgear (people only) ──
export const HEADGEAR: Record<string, SpriteRect[]> = {
  bare: [],
  cap: [[8,2,11,1,'#241a2e'],[9,1,8,1,'A'],[10,0,6,1,'A'],[19,2,4,1,'#3a2a3e'],[9,3,9,1,'#14101f']],
  bandana: [[9,3,9,1,'A'],[9,4,10,1,'A'],[19,5,3,1,'A'],[8,4,1,1,'A']],
  visor: [[8,2,12,2,'#14101f'],[9,4,10,1,'A'],[9,5,10,1,'#7cdcff']],
}
export const HEADGEAR_META: [string, string][] = [['bare','BARE'],['cap','FIELD CAP'],['bandana','BANDANA'],['visor','HUD VISOR']]

// ── Gear / Loadout (all characters) ──
export const GEAR: Record<string, SpriteRect[]> = {
  none: [],
  camera: [[19,14,1,3,'#3a2a1a'],[20,16,5,4,'#20161f'],[21,17,3,2,'A'],[24,16,1,1,'#efe6ff']],
  kit: [[2,18,5,5,'#5a4a32'],[2,18,5,1,'A'],[3,20,3,2,'#c9a13a']],
  slate: [[20,15,6,6,'#12283a'],[21,16,4,3,'A'],[20,20,6,1,'#0a1a26']],
}
export const GEAR_META: [string, string, string][] = [
  ['none', 'TRAVEL LIGHT', 'A clear mind \u2014 no rig'],
  ['camera', 'CAMERA RIG', 'Storyteller \u00b7 Day 1 path'],
  ['kit', 'FIELD KIT', 'Land steward \u00b7 Day 2 path'],
  ['slate', 'DATA SLATE', 'Vibe-coder \u00b7 Day 3 path'],
]

// ── Outfit (people only) ──
export const OUTFIT: Record<string, SpriteRect[]> = {
  plain: [],
  vest: [[7,14,2,7,'#2a2145'],[19,14,2,7,'#2a2145'],[7,13,14,1,'#37307a'],[9,14,1,7,'#37307a'],[17,14,1,7,'#37307a'],[12,15,2,6,'#efe6ff']],
  poncho: [[6,13,16,1,'A'],[6,14,2,7,'A'],[20,14,2,7,'A'],[9,17,10,1,'#241033'],[11,19,6,1,'#241033'],[6,20,16,1,'AD']],
  coat: [[7,14,14,8,'#4a3628'],[12,14,4,8,'#5c4632'],[7,14,2,8,'#3a2a1e'],[19,14,2,8,'#3a2a1e'],[13,15,2,6,'#c9a13a']],
}
export const OUTFIT_META: [string, string][] = [['plain','FIELD PLAIN'],['vest','UTILITY VEST'],['poncho','DESERT PONCHO'],['coat','LONG COAT']]

// ── Hair styles (people only) ──
export const HAIR: Record<string, SpriteRect[]> = {
  signature: [],
  long: [[8,4,1,10,'HR'],[19,4,1,10,'HR'],[7,6,1,7,'HR'],[20,6,1,7,'HR'],[7,13,2,1,'HR'],[19,13,2,1,'HR'],[8,4,1,1,'HD'],[19,4,1,1,'HD']],
  topknot: [[12,0,4,2,'HR'],[13,0,2,1,'HD'],[10,3,1,1,'HR'],[17,3,1,1,'HR'],[11,1,1,1,'HR'],[16,1,1,1,'HR']],
  spikes: [[9,1,1,2,'A'],[11,0,1,3,'A'],[13,0,1,3,'A'],[15,0,1,3,'A'],[17,1,1,2,'A']],
  curls: [[9,1,2,2,'HR'],[12,0,2,2,'HR'],[15,1,2,2,'HR'],[8,3,2,2,'HR'],[18,3,2,2,'HR'],[10,0,1,1,'HD'],[16,1,1,1,'HD']],
  afro: [[8,0,12,4,'HR'],[7,2,1,4,'HR'],[20,2,1,4,'HR'],[8,0,10,1,'HD'],[9,4,1,3,'HR'],[18,4,1,3,'HR']],
  braids: [[8,4,2,11,'HR'],[18,4,2,11,'HR'],[8,14,2,2,'HR'],[18,14,2,2,'HR'],[9,2,10,1,'HR'],[8,13,2,1,'HD'],[18,13,2,1,'HD']],
}
export const HAIR_META: [string, string][] = [['signature','SIGNATURE'],['long','LONG'],['topknot','TOP KNOT'],['spikes','NEON SPIKES'],['curls','CURLS'],['afro','AFRO'],['braids','BRAIDS']]

// ── Signature hair hex per human ──
export const HAIRHEX: Record<string, string> = { nayeli: '#3a241f', mateo: '#1c120a', sam: '#241812', quest: '#3a1a4a' }

// ── Hair colors ──
export const HAIRCOLS = ['#120c08','#3a241f','#6a4022','#9a6a34','#c69350','#e2c488','#b9bcc6','#c86ad0','#5fd6ff','#74f0a0']

// ── Facial hair (people only) ──
export const FACIAL: Record<string, SpriteRect[]> = {
  none: [],
  stubble: [[10,10,1,1,'HD'],[12,11,1,1,'HD'],[15,10,1,1,'HD'],[17,10,1,1,'HD'],[11,11,1,1,'HD'],[16,11,1,1,'HD']],
  mustache: [[11,8,6,1,'HR']],
  goatee: [[13,10,2,1,'HR'],[13,11,2,1,'HR'],[13,12,2,1,'HD']],
  beard: [[9,9,1,3,'HR'],[17,9,1,3,'HR'],[10,11,8,1,'HR'],[11,12,6,1,'HR'],[12,13,4,1,'HD']],
}
export const FACIAL_META: [string, string][] = [['none','CLEAN'],['stubble','STUBBLE'],['mustache','MUSTACHE'],['goatee','GOATEE'],['beard','FULL BEARD']]

// ── Companions (people only, reuse animal sprites) ──
export const COMPANION_META: [string, string][] = [['none','NONE'],['roadrunner','R\u00cdO'],['kitfox','ZORRO'],['jackrabbit','LIEBRE'],['quail','GAMBEL']]

// ── Signature features ──
export const SIGFEATURE: Record<string, string> = {
  nayeli: "Songkeeper's echo \u2014 a bilingual voice aura that carries two tongues at once",
  mateo: "Tinker's kit \u2014 mends broken lines and dead prompts on the fly",
  sam: "Field surveyor \u2014 reads the hidden water table beneath any ground",
  quest: "Sovereign coder \u2014 an off-grid compute halo that runs models anywhere",
  roadrunner: "Trailblazer dash \u2014 scouts the fastest honest path ahead",
  coyote: "Trickster's nose \u2014 sniffs out synthetic fakes and cloned voices",
  tortoise: "Deep-time shell \u2014 carries generational memory, never rushed",
  jackrabbit: "Leap-sense ears \u2014 hears a scam three valleys away",
  quail: "Covey caller \u2014 rallies the whole cohort with one signal",
  chuckwalla: "Sun-forge hide \u2014 thrives where the grid can't reach",
  kitfox: "Night-vision eyes \u2014 sees the gaps a system hides in the dark",
  bighorn: "Sure-footed climb \u2014 never loses the high, hard road",
}

// ── Map icon sprites (16×16) ──
export const MAP_ICONS = {
  tent: [[2,13,12,1,'#241033'],[7,3,1,4,'#c9a13a'],[8,3,3,1,'A'],[3,7,10,6,'#2f9fb0'],[6,5,4,2,'#2f9fb0'],[7,4,2,1,'#2f9fb0'],[6,8,4,5,'#155a6a']] as SpriteRect[],
  mount: [[1,13,14,1,'#241033'],[3,6,7,7,'#6a5f9a'],[8,8,6,5,'#4a4080'],[5,6,3,2,'#e8e0ff'],[12,6,1,4,'#5fbf7a'],[11,7,1,1,'#5fbf7a'],[13,5,1,1,'#5fbf7a']] as SpriteRect[],
  rocket: [[7,1,2,3,'#ff5fd2'],[6,4,4,7,'#efe6ff'],[7,6,2,2,'#45d6ff'],[5,9,1,3,'#ff5fd2'],[10,9,1,3,'#ff5fd2'],[7,12,2,2,'#ffd23f'],[6,13,1,1,'#ff8a3f'],[9,13,1,1,'#ff8a3f']] as SpriteRect[],
  goal: [[3,5,10,3,'#9a6a30'],[3,7,10,6,'#7a4a20'],[3,9,10,1,'#4a2a12'],[7,7,2,3,'#ffd23f'],[2,3,1,1,'#ffd23f'],[13,3,1,1,'#ffd23f'],[7,2,1,1,'#ffffff']] as SpriteRect[],
  start: [[7,3,1,10,'#8a7aa8'],[8,3,4,3,'A'],[5,13,5,1,'#241033']] as SpriteRect[],
}

// ── Default character state ──
export const DEFAULT_CHARACTER = {
  character_key: 'nayeli',
  player_name: '',
  accent_color: '#45d6ff',
  tint: 'default',
  headgear: 'bare',
  loadout: 'none',
  outfit: 'plain',
  hair: 'signature',
  hair_color: 'default',
  facial: 'none',
  companion: 'none',
}



