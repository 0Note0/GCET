import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  CampusStateStore,
  createSeedState,
  formatServerTime,
  isValidEntityId,
  sanitizePlainText,
  validateBase64ImageEvidence,
  type CollectionAlertRecord,
  type IssueType,
  type OverflowReportRecord,
  type ReporterRole,
} from './store.ts';

const VALID_ROLES: ReadonlyArray<ReporterRole> = ['Student', 'Faculty', 'Staff'];
const VALID_ISSUES: ReadonlyArray<IssueType> = [
  'Bin Overflowing',
  'Odor or Spill Hazard',
  'Sensor Offline',
  'Damaged Lid',
];
const VALID_URGENCIES = ['Standard', 'Urgent'] as const;

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex).trim();
    const val = part.slice(eqIndex + 1).trim();
    result[key] = decodeURIComponent(val);
  }
  return result;
}

export interface CreateAppOptions {
  stateFilePath?: string;
  sessionSecret?: string;
  rateLimitMax?: number;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const store = new CampusStateStore(options.stateFilePath);
  const sessionSecret =
    options.sessionSecret ||
    process.env.SESSION_SECRET ||
    crypto.randomBytes(32).toString('hex');

  const rateLimitWindowMs = 60_000;
  const rateLimitMax = options.rateLimitMax ?? 240;
  const requestBuckets = new Map<string, { count: number; resetAt: number }>();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1500kb' }));

  // Security Headers Middleware (iframe-compatible & Google Maps Platform ready)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https:",
        "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com ws: wss:",
        "worker-src 'self' blob:",
      ].join('; ')
    );
    next();
  });

  // Sliding-window Rate Limiter for /api/*
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'local';
    const now = Date.now();
    const bucket = requestBuckets.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
      return next();
    }

    if (bucket.count >= rateLimitMax) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before retrying.',
      });
    }

    bucket.count += 1;
    return next();
  });

  function signSessionToken(sid: string, csrf: string): string {
    const payload = `${sid}.${csrf}`;
    const sig = crypto
      .createHmac('sha256', sessionSecret)
      .update(payload)
      .digest('hex');
    return `${payload}.${sig}`;
  }

  function verifySessionToken(rawToken: string | undefined): {
    sid: string;
    csrf: string;
  } | null {
    if (!rawToken) return null;
    const parts = rawToken.split('.');
    if (parts.length !== 3) return null;
    const [sid, csrf, sig] = parts;
    if (!sid || !csrf || !sig) return null;

    const expected = crypto
      .createHmac('sha256', sessionSecret)
      .update(`${sid}.${csrf}`)
      .digest('hex');

    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    return { sid, csrf };
  }

  function requireCsrf(req: Request, res: Response, next: NextFunction) {
    const cookies = parseCookies(req.headers.cookie);
    const headerSession = req.header('x-session-token');
    const session =
      verifySessionToken(cookies['gcet_sid']) || verifySessionToken(headerSession);
    const headerToken = req.header('x-csrf-token');

    if (!session || !headerToken) {
      return res.status(403).json({
        error: 'Missing or invalid CSRF session token. Refresh /api/session.',
      });
    }

    const headerBuf = Buffer.from(headerToken, 'utf8');
    const csrfBuf = Buffer.from(session.csrf, 'utf8');
    if (headerBuf.length !== csrfBuf.length || !crypto.timingSafeEqual(headerBuf, csrfBuf)) {
      return res.status(403).json({
        error: 'CSRF verification failed.',
      });
    }

    return next();
  }

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'gcet-smart-waste',
      campus: 'GCET Greater Noida',
      coordinates: { lat: 28.45675, lon: 77.49748 },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/maps-config', (_req: Request, res: Response) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      '';
    res.json({ apiKey });
  });

  app.get('/api/session', (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const existingRaw = cookies['gcet_sid'];
    const existing = verifySessionToken(existingRaw);

    if (existing && existingRaw) {
      return res.json({
        csrfToken: existing.csrf,
        sessionToken: existingRaw,
        authenticated: true,
      });
    }

    const sid = crypto.randomBytes(16).toString('hex');
    const csrf = crypto.randomBytes(24).toString('hex');
    const signed = signSessionToken(sid, csrf);
    const isHttps =
      req.secure || req.header('x-forwarded-proto') === 'https';

    res.cookie('gcet_sid', signed, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      path: '/',
      maxAge: 1000 * 60 * 60 * 12,
    });

    return res.json({
      csrfToken: csrf,
      sessionToken: signed,
      authenticated: true,
    });
  });

  app.get('/api/campus/state', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await store.load();
      res.json(state);
    } catch (err) {
      next(err);
    }
  });

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

  app.post('/api/bins/simulate', requireCsrf, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await store.update((state) => {
        const nowLabel = formatServerTime();
        const newAlerts: CollectionAlertRecord[] = [];

        const updatedBins = state.bins.map((bin, idx) => {
          if (bin.dispatched) return bin;
          const delta = ((idx * 3 + Math.floor(Math.random() * 6)) % 7) + 3;
          const nextFill = Math.min(99, bin.fillLevel + delta);

          if (bin.fillLevel < 85 && nextFill >= 85) {
            newAlerts.push({
              id: `alrt-${Date.now()}-${bin.id}`,
              binId: bin.id,
              binCode: bin.code,
              location: bin.name,
              zone: bin.zone,
              trigger: 'Automated Threshold',
              severity: 'Critical',
              message: `Ultrasonic sensor crossed 85% threshold (${nextFill}% full).`,
              timestamp: nowLabel,
              assignedCrew: null,
              status: 'Active',
            });
          }

          return {
            ...bin,
            fillLevel: nextFill,
            updatedAt: nowLabel,
          };
        });

        const nextState = {
          bins: updatedBins,
          alerts: [...newAlerts, ...state.alerts],
          reports: state.reports,
          updatedAt: state.updatedAt,
        };
        return { nextState, result: nextState };
      });

      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/bins/:id/overflow', requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!isValidEntityId(id)) {
        return res.status(400).json({ error: 'Invalid bin identifier.' });
      }

      const saved = await store.update((state) => {
        const target = state.bins.find((b) => b.id === id);
        if (!target) {
          throw new HttpError(404, 'Campus bin not found.');
        }

        const nowLabel = formatServerTime();
        const updatedBins = state.bins.map((b) =>
          b.id === id
            ? {
                ...b,
                fillLevel: Math.max(b.fillLevel, 91),
                reportedOverflow: true,
                updatedAt: nowLabel,
              }
            : b
        );

        const newAlert: CollectionAlertRecord = {
          id: `alrt-${Date.now()}-${id}`,
          binId: target.id,
          binCode: target.code,
          location: target.name,
          zone: target.zone,
          trigger: 'Sensor Telemetry',
          severity: 'Critical',
          message: `Overflow triggered at ${target.location}.`,
          timestamp: nowLabel,
          assignedCrew: null,
          status: 'Active',
        };

        const nextState = {
          bins: updatedBins,
          alerts: [newAlert, ...state.alerts],
          reports: state.reports,
          updatedAt: state.updatedAt,
        };
        return { nextState, result: nextState };
      });

      return res.json(saved);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/bins/:id/dispatch', requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!isValidEntityId(id)) {
        return res.status(400).json({ error: 'Invalid bin identifier.' });
      }

      const saved = await store.update((state) => {
        const target = state.bins.find((b) => b.id === id);
        if (!target) {
          throw new HttpError(404, 'Campus bin not found.');
        }

        const crew = `EV Cart 0${Math.floor(1 + Math.random() * 3)}`;
        const nextState = {
          bins: state.bins.map((b) => (b.id === id ? { ...b, dispatched: true } : b)),
          alerts: state.alerts.map((a) =>
            a.binId === id && a.status === 'Active'
              ? { ...a, status: 'Dispatched' as const, assignedCrew: crew }
              : a
          ),
          reports: state.reports.map((r) =>
            r.binId === id && r.status === 'Pending Dispatch'
              ? { ...r, status: 'Crew En Route' as const }
              : r
          ),
          updatedAt: state.updatedAt,
        };
        return { nextState, result: nextState };
      });

      return res.json(saved);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/bins/:id/collect', requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!isValidEntityId(id)) {
        return res.status(400).json({ error: 'Invalid bin identifier.' });
      }

      const saved = await store.update((state) => {
        const target = state.bins.find((b) => b.id === id);
        if (!target) {
          throw new HttpError(404, 'Campus bin not found.');
        }

        const nowLabel = formatServerTime();
        const nextState = {
          bins: state.bins.map((b) =>
            b.id === id
              ? {
                  ...b,
                  fillLevel: 8,
                  reportedOverflow: false,
                  dispatched: false,
                  lastEmptied: nowLabel,
                  updatedAt: nowLabel,
                }
              : b
          ),
          alerts: state.alerts.map((a) =>
            a.binId === id && a.status !== 'Resolved'
              ? { ...a, status: 'Resolved' as const, severity: 'Resolved' as const }
              : a
          ),
          reports: state.reports.map((r) =>
            r.binId === id && r.status !== 'Cleared' ? { ...r, status: 'Cleared' as const } : r
          ),
          updatedAt: state.updatedAt,
        };
        return { nextState, result: nextState };
      });

      return res.json(saved);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/reports', requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const binId = body.binId;
      if (!isValidEntityId(binId)) {
        return res.status(400).json({ error: 'Valid binId is required.' });
      }

      const reporterName = sanitizePlainText(body.reporterName, 80);
      const campusId = sanitizePlainText(body.campusId, 32);
      const notes = sanitizePlainText(body.notes, 320);
      const role = body.role as ReporterRole;
      const issueType = body.issueType as IssueType;
      const urgency = body.urgency as 'Standard' | 'Urgent';

      if (reporterName.length < 2) {
        return res.status(400).json({ error: 'Reporter name must be at least 2 characters.' });
      }
      if (!/^[a-zA-Z0-9_-]{4,32}$/.test(campusId)) {
        return res.status(400).json({
          error: 'Campus ID must be 4-32 alphanumeric characters (letters, digits, hyphens).',
        });
      }
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid reporter role.' });
      }
      if (!VALID_ISSUES.includes(issueType)) {
        return res.status(400).json({ error: 'Invalid issue type.' });
      }
      if (!VALID_URGENCIES.includes(urgency)) {
        return res.status(400).json({ error: 'Invalid urgency value.' });
      }

      const evidenceCheck = validateBase64ImageEvidence(body.evidenceDataUrl);
      if (!evidenceCheck.valid) {
        return res.status(400).json({ error: evidenceCheck.error });
      }

      const payloadResult = await store.update((state) => {
        const target = state.bins.find((b) => b.id === binId);
        if (!target) {
          throw new HttpError(404, 'Selected campus bin not found.');
        }

        const nowLabel = formatServerTime();
        const ticketNumber = `GCET-RPT-${Math.floor(1000 + Math.random() * 9000)}`;
        const hasEvidencePhoto = Boolean(body.evidenceDataUrl);

        const createdReport: OverflowReportRecord = {
          id: `rpt-${Date.now()}`,
          ticketNumber,
          binId: target.id,
          binCode: target.code,
          location: target.name,
          reporterName,
          campusId,
          role,
          issueType,
          urgency,
          notes,
          hasEvidencePhoto,
          createdAt: nowLabel,
          status: 'Pending Dispatch',
        };

        const createdAlert: CollectionAlertRecord = {
          id: `alrt-${Date.now()}`,
          binId: target.id,
          binCode: target.code,
          location: target.name,
          zone: target.zone,
          trigger: 'Student/Staff Report',
          severity: urgency === 'Urgent' ? 'Critical' : 'Warning',
          message: `${issueType} reported by ${reporterName} (${role}).`,
          timestamp: nowLabel,
          assignedCrew: null,
          status: 'Active',
        };

        const nextState = {
          bins: state.bins.map((b) =>
            b.id === target.id
              ? {
                  ...b,
                  reportedOverflow: issueType === 'Bin Overflowing',
                  fillLevel:
                    issueType === 'Bin Overflowing'
                      ? Math.max(b.fillLevel, 93)
                      : b.fillLevel,
                  updatedAt: nowLabel,
                }
              : b
          ),
          alerts: [createdAlert, ...state.alerts],
          reports: [createdReport, ...state.reports],
          updatedAt: state.updatedAt,
        };
        return {
          nextState,
          result: { report: createdReport, state: nextState },
        };
      });

      return res.status(201).json(payloadResult);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/alerts/:id/dismiss', requireCsrf, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!isValidEntityId(id)) {
        return res.status(400).json({ error: 'Invalid alert identifier.' });
      }

      const saved = await store.update((state) => {
        const exists = state.alerts.some((a) => a.id === id);
        if (!exists) {
          throw new HttpError(404, 'Alert not found.');
        }

        const nextState = {
          ...state,
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, status: 'Resolved' as const, severity: 'Resolved' as const } : a
          ),
        };
        return { nextState, result: nextState };
      });

      return res.json(saved);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/reset', requireCsrf, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const saved = await store.save(createSeedState());
      return res.json(saved);
    } catch (err) {
      return next(err);
    }
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    const isSyntaxErr =
      typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      (err as { type?: string }).type === 'entity.parse.failed';
    if (isSyntaxErr) {
      return res.status(400).json({ error: 'Malformed JSON request body.' });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
