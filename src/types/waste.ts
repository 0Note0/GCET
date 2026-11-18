export type CampusZone =
  | 'Academic Core'
  | 'Dining & Plaza'
  | 'Library & Labs'
  | 'Hostel & Sports';

export type WasteStream = 'Dry & Recyclables' | 'Wet & Organic' | 'E-Waste & Paper';

export type BinStatus = 'Nominal' | 'Near Full' | 'Overflowing';

export type ReporterRole = 'Student' | 'Faculty' | 'Staff';

export type IssueType =
  | 'Bin Overflowing'
  | 'Odor or Spill Hazard'
  | 'Sensor Offline'
  | 'Damaged Lid';

export interface SmartBin {
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

export interface CollectionAlert {
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

export interface OverflowReport {
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
  createdAt: string;
  status: 'Pending Dispatch' | 'Crew En Route' | 'Cleared';
}

export interface CampusBuildingFeature {
  id: string;
  osmWayId: string;
  name: string;
  category: string;
  center: [number, number];
  polygon: Array<[number, number]>;
}
