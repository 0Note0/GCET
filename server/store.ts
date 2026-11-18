import fs from 'node:fs/promises';
import path from 'node:path';

export type CampusZone =
  | 'Academic Core'
  | 'Dining & Plaza'
  | 'Library & Labs'
  | 'Hostel & Sports';

export type WasteStream = 'Dry & Recyclables' | 'Wet & Organic' | 'E-Waste & Paper';
export type ReporterRole = 'Student' | 'Faculty' | 'Staff';
export type IssueType =
  | 'Bin Overflowing'
  | 'Odor or Spill Hazard'
  | 'Sensor Offline'
  | 'Damaged Lid';

export interface SmartBinRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  zone: CampusZone;
  stream: WasteStream;
  lat: number;
  lon: number;
  deploymentStage: 1 | 2 | 3;
  fillLevel: number;
  temperatureC: number;
  batteryPct: number;
  lastEmptied: string;
  updatedAt: string;
  reportedOverflow: boolean;
  dispatched: boolean;
  routeOrder: number;
}

export interface CollectionAlertRecord {
  id: string;
  binId: string;
  binCode: string;
  location: string;
  zone: CampusZone;
  trigger: 'Automated Threshold' | 'Student/Staff Report' | 'Sensor Telemetry';
  severity: 'Critical' | 'Warning' | 'Resolved';
  message: string;
  timestamp: string;
  assignedCrew: string | null;
  status: 'Active' | 'Dispatched' | 'Resolved';
}

export interface OverflowReportRecord {
  id: string;
  ticketNumber: string;
  binId: string;
  binCode: string;
  location: string;
  reporterName: string;
  campusId: string;
  role: ReporterRole;
  issueType: IssueType;
  urgency: 'Standard' | 'Urgent';
  notes: string;
  hasEvidencePhoto?: boolean;
  createdAt: string;
  status: 'Pending Dispatch' | 'Crew En Route' | 'Cleared';
}

export interface CampusState {
  bins: SmartBinRecord[];
  alerts: CollectionAlertRecord[];
  reports: OverflowReportRecord[];
  updatedAt: string;
}

export const INITIAL_BINS_SEED: SmartBinRecord[] = [
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

export const INITIAL_ALERTS_SEED: CollectionAlertRecord[] = [
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

export const INITIAL_REPORTS_SEED: OverflowReportRecord[] = [
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
    hasEvidencePhoto: false,
    createdAt: '10:08 AM',
    status: 'Pending Dispatch',
  },
];

export function formatServerTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sanitizePlainText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function isValidEntityId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function validateBase64ImageEvidence(dataUrl: unknown): {
  valid: boolean;
  error?: string;
} {
  if (dataUrl === undefined || dataUrl === null || dataUrl === '') {
    return { valid: true };
  }
  if (typeof dataUrl !== 'string') {
    return { valid: false, error: 'Evidence payload must be a string.' };
  }
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    return {
      valid: false,
      error: 'Only PNG, JPEG, or WEBP base64 image evidence is supported.',
    };
  }
  const mime = match[1];
  const rawBuffer = Buffer.from(match[2], 'base64');
  if (rawBuffer.byteLength === 0 || rawBuffer.byteLength > 1024 * 1024) {
    return { valid: false, error: 'Image evidence must be between 1 byte and 1 MB.' };
  }

  // Magic-byte signature verification (prevents spoofed MIME uploads)
  const isPng =
    mime === 'image/png' &&
    rawBuffer.length >= 8 &&
    rawBuffer[0] === 0x89 &&
    rawBuffer[1] === 0x50 &&
    rawBuffer[2] === 0x4e &&
    rawBuffer[3] === 0x47;
  const isJpeg =
    mime === 'image/jpeg' &&
    rawBuffer.length >= 3 &&
    rawBuffer[0] === 0xff &&
    rawBuffer[1] === 0xd8 &&
    rawBuffer[2] === 0xff;
  const isWebp =
    mime === 'image/webp' &&
    rawBuffer.length >= 12 &&
    rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (!isPng && !isJpeg && !isWebp) {
    return {
      valid: false,
      error: 'File signature does not match declared image MIME type.',
    };
  }

  return { valid: true };
}

export function createSeedState(): CampusState {
  return {
    bins: INITIAL_BINS_SEED.map((b) => ({ ...b })),
    alerts: INITIAL_ALERTS_SEED.map((a) => ({ ...a })),
    reports: INITIAL_REPORTS_SEED.map((r) => ({ ...r })),
    updatedAt: new Date().toISOString(),
  };
}

export class CampusStateStore {
  private readonly filePath: string;
  private state: CampusState | null = null;
  private mutationQueue: Promise<unknown> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath =
      filePath ||
      process.env.CAMPUS_STATE_FILE ||
      path.resolve('/tmp', 'gcet-smart-waste-state.json');
  }

  async load(): Promise<CampusState> {
    if (this.state) return this.state;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as CampusState;
      if (
        Array.isArray(parsed.bins) &&
        Array.isArray(parsed.alerts) &&
        Array.isArray(parsed.reports)
      ) {
        this.state = parsed;
        return this.state;
      }
    } catch {
      // Seed cleanly on first boot or corrupt file
    }
    this.state = createSeedState();
    await this.persist(this.state);
    return this.state;
  }

  async save(nextState: CampusState): Promise<CampusState> {
    return this.enqueue(async () => {
      await this.load();
      nextState.updatedAt = new Date().toISOString();
      this.state = nextState;
      await this.persist(nextState);
      return nextState;
    });
  }

  async update<T>(
    mutator: (
      current: CampusState
    ) => { nextState: CampusState; result: T } | Promise<{ nextState: CampusState; result: T }>
  ): Promise<T> {
    return this.enqueue(async () => {
      const current = await this.load();
      const { nextState, result } = await mutator(current);
      nextState.updatedAt = new Date().toISOString();
      this.state = nextState;
      await this.persist(nextState);
      return result;
    });
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.mutationQueue.then(task, task);
    this.mutationQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async persist(snapshot: CampusState): Promise<void> {
    const serialized = JSON.stringify(snapshot, null, 2);
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(tmpPath, serialized, 'utf8');
    await fs.rename(tmpPath, this.filePath);
  }
}
