export type FacilityKind = 'all' | 'water' | 'medical' | 'energy' | 'restroom' | 'exit';

export type RushLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface VenueFacility {
  id: string;
  name: string;
  kind: 'water' | 'medical' | 'energy' | 'restroom' | 'exit';
  x: number;
  y: number;
  desc: string;
  status: string;
  icon: string;
  badge: string;
  color: string;
  queueMin: number;
  queueCount: number;
  rushLevel: RushLevel;
  tapsOrStaff: string;
  recommendation?: string;
  altFacilityId?: string;
}

export const VENUE_FACILITIES: VenueFacility[] = [
  // Hydration / Water Refill Stalls
  {
    id: 'w1',
    name: 'Water Station #1 (Gate A)',
    kind: 'water',
    x: 235,
    y: 135,
    desc: 'Free filtered water & ORS electrolyte packs · Concourse West',
    status: 'High Rush · 14m Wait',
    icon: '💧',
    badge: 'Hydration Stall',
    color: '#38bdf8',
    queueMin: 14,
    queueCount: 54,
    rushLevel: 'critical',
    tapsOrStaff: '4 Taps (Overloaded)',
    recommendation: '⚠️ High Concourse Rush (14m wait). Divert to Gate C Water Station #2 — only 1m wait & 8 fast taps.',
    altFacilityId: 'w2',
  },
  {
    id: 'w2',
    name: 'Water Station #2 (Gate C Fast-Track)',
    kind: 'water',
    x: 325,
    y: 105,
    desc: 'Dedicated 8-tap fast refill bar for diverted Gate C arrivals',
    status: 'Express Refill · 1m Wait',
    icon: '💧',
    badge: 'Express Hydration',
    color: '#38bdf8',
    queueMin: 1,
    queueCount: 4,
    rushLevel: 'low',
    tapsOrStaff: '8 Fast Refill Taps (Express)',
    recommendation: '🟢 Recommended Refill Point · 0–1 min wait + complimentary ORS electrolyte packs.',
  },
  {
    id: 'w3',
    name: 'Water Point #3 (Arena East)',
    kind: 'water',
    x: 585,
    y: 230,
    desc: 'Arena east concourse chilled water station with touchless bottle fillers',
    status: 'Moderate Flow · 5m Wait',
    icon: '💧',
    badge: 'Hydration Stall',
    color: '#38bdf8',
    queueMin: 5,
    queueCount: 18,
    rushLevel: 'moderate',
    tapsOrStaff: '6 Touchless Concourse Taps',
    recommendation: '🟡 Moderate queue. Flowing steadily.',
  },

  // Energy Drink & Beverage Kiosks
  {
    id: 'e1',
    name: 'Red Bull Energy Kiosk (West Concourse)',
    kind: 'energy',
    x: 235,
    y: 210,
    desc: 'Chilled energy cans, vitamin boosters & cold energy drinks',
    status: 'Open · Express Lane',
    icon: '⚡',
    badge: 'Energy Drinks',
    color: '#facc15',
    queueMin: 8,
    queueCount: 29,
    rushLevel: 'moderate',
    tapsOrStaff: '2 Express POS Desks',
    recommendation: '🟡 8 min queue. 2 cashless registers open.',
  },
  {
    id: 'e2',
    name: 'Monster Energy & Food Court Bar',
    kind: 'energy',
    x: 670,
    y: 335,
    desc: 'Energy drinks, mocktails, quick snacks & cold refreshments',
    status: 'High Flow · 12m Queue',
    icon: '⚡',
    badge: 'Energy & Food Court',
    color: '#facc15',
    queueMin: 12,
    queueCount: 46,
    rushLevel: 'high',
    tapsOrStaff: '3 Registers Open',
    recommendation: '⚠️ Food court queue peaking. Red Bull West Kiosk has shorter wait (8m).',
    altFacilityId: 'e1',
  },

  // Medical / First Aid & Med Kit Posts
  {
    id: 'm1',
    name: 'Emergency Med Kit Post Alpha (Stage/VIP)',
    kind: 'medical',
    x: 290,
    y: 300,
    desc: '2 Paramedics, AED defibrillator, triage med kits, trauma packs',
    status: 'Standing By · Zero Delay',
    icon: '🚑',
    badge: 'First Aid / Med Kit',
    color: '#ef4444',
    queueMin: 0,
    queueCount: 0,
    rushLevel: 'low',
    tapsOrStaff: '2 Paramedics & AED Staged',
    recommendation: '🟢 On standby. Immediate zero-delay assistance.',
  },
  {
    id: 'm2',
    name: 'First Aid Tent Bravo (Gate B/C Sector)',
    kind: 'medical',
    x: 515,
    y: 110,
    desc: 'Rapid dehydration treatment, ice packs & heat-stress med kits',
    status: 'Active · 3 Medics',
    icon: '🚑',
    badge: 'First Aid Tent',
    color: '#ef4444',
    queueMin: 0,
    queueCount: 0,
    rushLevel: 'low',
    tapsOrStaff: '3 Medics & ORS Station',
    recommendation: '🟢 Rapid cooling and dehydration treatment ready.',
  },

  // Restrooms
  {
    id: 'r1',
    name: 'Restrooms West Block',
    kind: 'restroom',
    x: 180,
    y: 255,
    desc: 'Wheelchair-accessible washroom facilities with continuous running water',
    status: 'Low Queue (2m)',
    icon: '🚻',
    badge: 'Restrooms',
    color: '#a855f7',
    queueMin: 2,
    queueCount: 6,
    rushLevel: 'low',
    tapsOrStaff: '16 Cubicles Operational',
    recommendation: '🟢 Fast access (2m wait).',
  },
  {
    id: 'r2',
    name: 'Restrooms East Concourse',
    kind: 'restroom',
    x: 745,
    y: 285,
    desc: 'Concourse sanitation, washrooms & hygiene stations',
    status: 'Moderate Queue (7m)',
    icon: '🚻',
    badge: 'Restrooms',
    color: '#a855f7',
    queueMin: 7,
    queueCount: 24,
    rushLevel: 'moderate',
    tapsOrStaff: '12 Cubicles Operational',
    recommendation: '🟡 Consider West Block restrooms for faster entry.',
  },

  // Emergency Evacuation Exits
  {
    id: 'x1',
    name: 'BKC North Emergency Exit Gate',
    kind: 'exit',
    x: 115,
    y: 45,
    desc: 'Direct wide evacuation passage onto BKC Main Connector',
    status: 'Clear & Unobstructed',
    icon: '🚪',
    badge: 'Evacuation Exit',
    color: '#10b981',
    queueMin: 0,
    queueCount: 0,
    rushLevel: 'low',
    tapsOrStaff: 'Direct 8m Wide Passage',
  },
  {
    id: 'x2',
    name: 'BKC South Fire Assembly Gate',
    kind: 'exit',
    x: 660,
    y: 475,
    desc: 'Wide double-gate emergency egress to open assembly grounds',
    status: 'Clear & Unobstructed',
    icon: '🚪',
    badge: 'Evacuation Exit',
    color: '#10b981',
    queueMin: 0,
    queueCount: 0,
    rushLevel: 'low',
    tapsOrStaff: 'Wide Double-Gate Egress',
  },
];

export function getRushColor(level: RushLevel) {
  switch (level) {
    case 'critical':
      return {
        bg: '#ef4444',
        text: '#ffffff',
        border: '#991b1b',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        label: 'CRITICAL RUSH',
        barWidth: '92%',
        barColor: 'bg-rose-500',
      };
    case 'high':
      return {
        bg: '#f43f5e',
        text: '#ffffff',
        border: '#be123c',
        badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
        label: 'HIGH RUSH',
        barWidth: '75%',
        barColor: 'bg-pink-500',
      };
    case 'moderate':
      return {
        bg: '#f59e0b',
        text: '#ffffff',
        border: '#b45309',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        label: 'MODERATE',
        barWidth: '45%',
        barColor: 'bg-amber-400',
      };
    case 'low':
    default:
      return {
        bg: '#10b981',
        text: '#ffffff',
        border: '#047857',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        label: 'LOW / FAST',
        barWidth: '15%',
        barColor: 'bg-emerald-400',
      };
  }
}
