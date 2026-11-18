import {
  CampusBuildingFeature,
  CollectionAlert,
  OverflowReport,
  SmartBin,
} from '../types/waste';

// Verified coordinates strictly scoped to Galgotias College of Engineering & Technology (GCET)
// Plot No. 1, Knowledge Park II, Greater Noida, UP 201310
export const GCET_CENTER: [number, number] = [28.45675, 77.49748];
export const GCET_ENTRANCE: [number, number] = [28.45724, 77.49877];
export const CLOUD_GATEWAY_POS: [number, number] = [28.45676, 77.49818];

// Tight campus-only bounding box so Google Maps shows ONLY GCET campus grounds
export const GCET_CAMPUS_BOUNDS = {
  north: 28.45808,
  south: 28.4553,
  west: 77.49575,
  east: 77.49905,
};

export const STORAGE_KEYS = {
  BINS: 'gcet_story_bins_v2',
  ALERTS: 'gcet_story_alerts_v2',
  REPORTS: 'gcet_story_reports_v2',
};

// Exact campus building polygons queried from OpenStreetMap for GCET Greater Noida
export const GCET_BUILDINGS: CampusBuildingFeature[] = [
  {
    id: 'bldg-block-a',
    osmWayId: 'way/351843049',
    name: 'Academic Block A & Cloud Hub',
    category: 'Main Academic Wing',
    center: [28.45678, 77.49818],
    polygon: [
      [28.456847, 77.497838],
      [28.456867, 77.497938],
      [28.456916, 77.497925],
      [28.456929, 77.497988],
      [28.456969, 77.497977],
      [28.457033, 77.49829],
      [28.456933, 77.498317],
      [28.456966, 77.498481],
      [28.456785, 77.498529],
      [28.456756, 77.498385],
      [28.456656, 77.498411],
      [28.456586, 77.498065],
      [28.456678, 77.497973],
      [28.45666, 77.497887],
    ],
  },
  {
    id: 'bldg-block-b',
    osmWayId: 'way/351843040',
    name: 'Academic Block B (CSE & IT)',
    category: 'Engineering Wing',
    center: [28.45626, 77.49826],
    polygon: [
      [28.456147, 77.497909],
      [28.45628, 77.497901],
      [28.456585, 77.498344],
      [28.456263, 77.498631],
      [28.455936, 77.498157],
    ],
  },
  {
    id: 'bldg-block-c',
    osmWayId: 'way/1493598700',
    name: 'Block C & Central Library',
    category: 'Library & Research',
    center: [28.45646, 77.49743],
    polygon: [
      [28.456263, 77.497392],
      [28.456187, 77.497464],
      [28.456421, 77.497648],
      [28.456707, 77.49736],
      [28.456547, 77.497125],
      [28.456463, 77.497205],
      [28.456563, 77.497342],
      [28.456365, 77.49753],
    ],
  },
  {
    id: 'bldg-canteen',
    osmWayId: 'way/1493598702',
    name: 'Central Canteen & Student Plaza',
    category: 'Dining & Courtyard',
    center: [28.45596, 77.4976],
    polygon: [
      [28.455977, 77.497469],
      [28.456081, 77.497611],
      [28.455934, 77.49774],
      [28.455848, 77.497586],
    ],
  },
  {
    id: 'bldg-labs',
    osmWayId: 'way/351582624',
    name: 'Engineering Labs & Block D',
    category: 'Workshops & Labs',
    center: [28.456445, 77.496951],
    polygon: [
      [28.45658, 77.49682],
      [28.45658, 77.49708],
      [28.45631, 77.49708],
      [28.45631, 77.49682],
    ],
  },
  {
    id: 'bldg-hostel',
    osmWayId: 'way/351582845',
    name: 'Campus Hostel & Residential Wing',
    category: 'Student Residences',
    center: [28.4573, 77.49639],
    polygon: [
      [28.457674, 77.496555],
      [28.4575, 77.496719],
      [28.457209, 77.49632],
      [28.457013, 77.496506],
      [28.456919, 77.496377],
      [28.457264, 77.496051],
    ],
  },
  {
    id: 'bldg-court',
    osmWayId: 'way/1493607051',
    name: 'Basketball Court & Sports Grounds',
    category: 'Recreation & Athletics',
    center: [28.45732, 77.49687],
    polygon: [
      [28.457394, 77.496693],
      [28.457489, 77.496832],
      [28.457248, 77.497045],
      [28.457153, 77.496906],
    ],
  },
  {
    id: 'bldg-workshop',
    osmWayId: 'way/1493607056',
    name: 'Mechanical & Innovation Workshop',
    category: 'Industrial Labs',
    center: [28.45596, 77.4966],
    polygon: [
      [28.456017, 77.496466],
      [28.456111, 77.496587],
      [28.45591, 77.496769],
      [28.455823, 77.496651],
    ],
  },
];

// Internal GCET campus service road network only (strictly inside Plot No. 1 campus grounds)
export const GCET_CAMPUS_ROADS: Array<Array<[number, number]>> = [
  // East Entrance & Spine Road
  [
    [28.457313, 77.498758],
    [28.457274, 77.498461],
    [28.457097, 77.497396],
    [28.457075, 77.497288],
    [28.456997, 77.497253],
    [28.45691, 77.497285],
    [28.456917, 77.497451],
    [28.4571, 77.498484],
    [28.457155, 77.498791],
  ],
  // East Perimeter Road
  [
    [28.457274, 77.498461],
    [28.4571, 77.498484],
    [28.45701, 77.498525],
    [28.456783, 77.498701],
    [28.456543, 77.498859],
    [28.456383, 77.498921],
  ],
  // South Perimeter Road
  [
    [28.456383, 77.498921],
    [28.456219, 77.498801],
    [28.455482, 77.497872],
    [28.455438, 77.497777],
  ],
  // West-South Service Loop
  [
    [28.455438, 77.497777],
    [28.455779, 77.497335],
    [28.456036, 77.497105],
    [28.456232, 77.497312],
    [28.456621, 77.496956],
  ],
  // West-North Hostel Loop
  [
    [28.456036, 77.497105],
    [28.457243, 77.495991],
    [28.457326, 77.496012],
    [28.457748, 77.496514],
  ],
];

// Continuous optimal waste truck path strictly following the verified OSM campus service roads
export const OPTIMAL_TRUCK_ROUTE: Array<[number, number]> = [
  [28.457313, 77.498758], // Main Gate East Entry
  [28.457274, 77.498461], // Block A Entrance Junction
  [28.45718, 77.49792],   // Mid-spine passing Block A
  [28.457097, 77.497396], // Central Library Turnaround
  [28.457218, 77.497327], // Sports Court spur
  [28.457097, 77.497396], // Back onto spine
  [28.457075, 77.497288],
  [28.45691, 77.497285],
  [28.456621, 77.496956], // West Lab Corridor
  [28.456232, 77.497312],
  [28.456036, 77.497105], // Hostel & Workshop Junction
  [28.45664, 77.49654],   // Up West-North service road near Hostels
  [28.457243, 77.495991], // Hostel Wing North Corner
  [28.45664, 77.49654],   // Return south on service road
  [28.456036, 77.497105], // Workshop & Labs stop
  [28.455779, 77.497335], // Canteen West Approach
  [28.455438, 77.497777], // South Perimeter Corner (Canteen)
  [28.455482, 77.497872],
  [28.456219, 77.498801], // Block B South-East Wing
  [28.456383, 77.498921],
  [28.456783, 77.498701], // East Perimeter past Block A
  [28.4571, 77.498484],
  [28.457155, 77.498791], // Exit Gate
];

export const INITIAL_CAMPUS_BINS: SmartBin[] = [
  {
    id: 'bin-101',
    code: 'GCET-BIN-101',
    name: 'Academic Block A Atrium',
    location: 'Block A Main Spine Entrance',
    zone: 'Academic Core',
    stream: 'Dry & Recyclables',
    lat: 28.45706,
    lon: 77.49818,
    deploymentStage: 1,
    fillLevel: 48,
    temperatureC: 24,
    batteryPct: 94,
    lastEmptied: '07:15 AM',
    updatedAt: 'Just now',
    reportedOverflow: false,
    dispatched: false,
    routeOrder: 1,
  },
  {
    id: 'bin-103',
    code: 'GCET-BIN-103',
    name: 'Block C & Central Library',
    location: 'Central Library Plaza Turnaround',
    zone: 'Library & Labs',
    stream: 'E-Waste & Paper',
    lat: 28.45672,
    lon: 77.49742,
    deploymentStage: 1,
    fillLevel: 79,
    temperatureC: 23,
    batteryPct: 96,
    lastEmptied: '08:00 AM',
    updatedAt: '1 min ago',
    reportedOverflow: false,
    dispatched: false,
    routeOrder: 2,
  },
  {
    id: 'bin-104',
    code: 'GCET-BIN-104',
    name: 'Campus Hostel Wing',
    location: 'West Service Road · Hostel Gate',
    zone: 'Hostel & Sports',
    stream: 'Wet & Organic',
    lat: 28.45718,
    lon: 77.49615,
    deploymentStage: 3,
    fillLevel: 88,
    temperatureC: 27,
    batteryPct: 82,
    lastEmptied: 'Yesterday 08:15 PM',
    updatedAt: '2 mins ago',
    reportedOverflow: false,
    dispatched: true,
    routeOrder: 3,
  },
  {
    id: 'bin-106',
    code: 'GCET-BIN-106',
    name: 'Mechanical & Innovation Workshop',
    location: 'South-West Service Junction',
    zone: 'Library & Labs',
    stream: 'E-Waste & Paper',
    lat: 28.45605,
    lon: 77.49685,
    deploymentStage: 3,
    fillLevel: 69,
    temperatureC: 25,
    batteryPct: 89,
    lastEmptied: '07:45 AM',
    updatedAt: '3 mins ago',
    reportedOverflow: false,
    dispatched: false,
    routeOrder: 4,
  },
  {
    id: 'bin-102',
    code: 'GCET-BIN-102',
    name: 'Central Canteen Courtyard',
    location: 'Student Food Plaza South Exit',
    zone: 'Dining & Plaza',
    stream: 'Wet & Organic',
    lat: 28.45578,
    lon: 77.49755,
    deploymentStage: 2,
    fillLevel: 93,
    temperatureC: 29,
    batteryPct: 86,
    lastEmptied: 'Yesterday 06:30 PM',
    updatedAt: 'Just now',
    reportedOverflow: true,
    dispatched: false,
    routeOrder: 5,
  },
  {
    id: 'bin-105',
    code: 'GCET-BIN-105',
    name: 'Academic Block B (CSE & IT)',
    location: 'South-East Perimeter Courtyard',
    zone: 'Academic Core',
    stream: 'Dry & Recyclables',
    lat: 28.45628,
    lon: 77.49862,
    deploymentStage: 2,
    fillLevel: 86,
    temperatureC: 26,
    batteryPct: 91,
    lastEmptied: '06:50 AM',
    updatedAt: '2 mins ago',
    reportedOverflow: false,
    dispatched: false,
    routeOrder: 6,
  },
];

export const INITIAL_ALERTS: CollectionAlert[] = [
  {
    id: 'alrt-1',
    binId: 'bin-102',
    binCode: 'GCET-BIN-102',
    location: 'Central Canteen Courtyard',
    zone: 'Dining & Plaza',
    trigger: 'Student/Staff Report',
    severity: 'Critical',
    message: 'Fill reached 93% with student overflow flag at Food Plaza exit.',
    timestamp: '10:08 AM',
    assignedCrew: null,
    status: 'Active',
  },
  {
    id: 'alrt-2',
    binId: 'bin-104',
    binCode: 'GCET-BIN-104',
    location: 'Campus Hostel Wing',
    zone: 'Hostel & Sports',
    trigger: 'Automated Threshold',
    severity: 'Critical',
    message: 'Ultrasonic node crossed 85% threshold (88% full).',
    timestamp: '09:54 AM',
    assignedCrew: 'EV Cart 02',
    status: 'Dispatched',
  },
  {
    id: 'alrt-3',
    binId: 'bin-105',
    binCode: 'GCET-BIN-105',
    location: 'Academic Block B (CSE & IT)',
    zone: 'Academic Core',
    trigger: 'Automated Threshold',
    severity: 'Critical',
    message: 'Peak break fill spike detected (86% capacity).',
    timestamp: '09:47 AM',
    assignedCrew: null,
    status: 'Active',
  },
];

export const INITIAL_REPORTS: OverflowReport[] = [
  {
    id: 'rpt-1',
    ticketNumber: 'GCET-RPT-4812',
    binId: 'bin-102',
    binCode: 'GCET-BIN-102',
    location: 'Central Canteen Courtyard',
    reporterName: 'Aarav Sharma',
    campusId: '2200970100042',
    role: 'Student',
    issueType: 'Bin Overflowing',
    urgency: 'Urgent',
    notes: 'Beverage cups stacking near South Food Plaza exit.',
    createdAt: '10:08 AM',
    status: 'Pending Dispatch',
  },
];

export function getBinStatus(bin: SmartBin): 'Overflowing' | 'Near Full' | 'Nominal' {
  if (bin.reportedOverflow || bin.fillLevel >= 85) return 'Overflowing';
  if (bin.fillLevel >= 65) return 'Near Full';
  return 'Nominal';
}

export function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function loadStoredState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function interpolateRoutePoint(
  route: Array<[number, number]>,
  progress: number
): [number, number] {
  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegments = route.length - 1;
  const scaled = clamped * totalSegments;
  const idx = Math.min(totalSegments - 1, Math.floor(scaled));
  const localT = scaled - idx;
  const [lat1, lon1] = route[idx];
  const [lat2, lon2] = route[idx + 1];
  return [lat1 + (lat2 - lat1) * localT, lon1 + (lon2 - lon1) * localT];
}

export function findRouteProgressForBin(
  route: Array<[number, number]>,
  binLat: number,
  binLon: number
): number {
  let bestProgress = 0;
  let bestDistSq = Infinity;
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const [lat, lon] = interpolateRoutePoint(route, p);
    const dSq = (lat - binLat) ** 2 + (lon - binLon) ** 2;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestProgress = p;
    }
  }
  return bestProgress;
}
