import {
  CollectionAlert,
  IssueType,
  OverflowReport,
  ReporterRole,
  SmartBin,
} from '../types/waste';

export interface CampusStatePayload {
  bins: SmartBin[];
  alerts: CollectionAlert[];
  reports: OverflowReport[];
  updatedAt: string;
}

let cachedTokens: { csrfToken: string; sessionToken: string } | null = null;

async function ensureSessionTokens(): Promise<{
  csrfToken: string;
  sessionToken: string;
}> {
  if (cachedTokens) return cachedTokens;
  const res = await fetch('/api/session', { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error('Unable to establish secure session.');
  }
  const data = (await res.json()) as {
    csrfToken: string;
    sessionToken: string;
  };
  cachedTokens = {
    csrfToken: data.csrfToken,
    sessionToken: data.sessionToken,
  };
  return cachedTokens;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const tokens = await ensureSessionTokens();
  let res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': tokens.csrfToken,
      'X-Session-Token': tokens.sessionToken,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 403) {
    cachedTokens = null;
    const fresh = await ensureSessionTokens();
    res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': fresh.csrfToken,
        'X-Session-Token': fresh.sessionToken,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const campusApi = {
  async fetchState(): Promise<CampusStatePayload> {
    await ensureSessionTokens();
    const res = await fetch('/api/campus/state', { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error('Failed to load campus telemetry state.');
    }
    return (await res.json()) as CampusStatePayload;
  },

  simulateCycle(): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>('/api/bins/simulate');
  },

  flagOverflow(binId: string): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>(`/api/bins/${encodeURIComponent(binId)}/overflow`);
  },

  dispatchCrew(binId: string): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>(`/api/bins/${encodeURIComponent(binId)}/dispatch`);
  },

  collectBin(binId: string): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>(`/api/bins/${encodeURIComponent(binId)}/collect`);
  },

  dismissAlert(alertId: string): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>(`/api/alerts/${encodeURIComponent(alertId)}/dismiss`);
  },

  resetCampus(): Promise<CampusStatePayload> {
    return postJson<CampusStatePayload>('/api/reset');
  },

  submitReport(payload: {
    binId: string;
    reporterName: string;
    campusId: string;
    role: ReporterRole;
    issueType: IssueType;
    urgency: 'Standard' | 'Urgent';
    notes: string;
    evidenceDataUrl?: string;
  }): Promise<{ report: OverflowReport; state: CampusStatePayload }> {
    return postJson<{ report: OverflowReport; state: CampusStatePayload }>(
      '/api/reports',
      payload
    );
  },
};
