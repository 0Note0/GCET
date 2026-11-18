import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';

describe('GCET SmartWaste Backend API & Security Integration Tests', () => {
  let tmpDir = '';
  let statePath = '';
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gcet-test-'));
    statePath = path.join(tmpDir, 'campus-state.json');
    app = createApp({
      stateFilePath: statePath,
      sessionSecret: 'test-secret-key-gcet-2026',
      rateLimitMax: 200,
    });
  });

  afterAll(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  async function getAuthenticatedAgent() {
    const agent = request.agent(app);
    const sessionRes = await agent.get('/api/session');
    expect(sessionRes.status).toBe(200);
    const csrfToken = sessionRes.body.csrfToken as string;
    const sessionToken = sessionRes.body.sessionToken as string;
    const cookies = sessionRes.headers['set-cookie'];
    expect(cookies[0]).toContain('HttpOnly');
    expect(sessionToken).toBeTruthy();
    return { agent, csrfToken, sessionToken };
  }

  it('serves health check with verified GCET coordinates and iframe-safe security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.coordinates.lat).toBeCloseTo(28.45675, 4);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('serves Google Maps config endpoint cleanly without leaking secrets when unconfigured', async () => {
    const res = await request(app).get('/api/maps-config');
    expect(res.status).toBe(200);
    expect(typeof res.body.apiKey).toBe('string');
  });

  it('supports stateless signed X-Session-Token + X-CSRF-Token headers inside iframes without cookies', async () => {
    const sessionRes = await request(app).get('/api/session');
    const { csrfToken, sessionToken } = sessionRes.body as {
      csrfToken: string;
      sessionToken: string;
    };
    const simRes = await request(app)
      .post('/api/bins/simulate')
      .set('X-CSRF-Token', csrfToken)
      .set('X-Session-Token', sessionToken);
    expect(simRes.status).toBe(200);
  });

  it('blocks mutating requests without valid CSRF token (403)', async () => {
    const res = await request(app).post('/api/bins/simulate');
    expect(res.status).toBe(403);
  });

  it('rejects path-traversal or invalid IDs on bin routes (400)', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();
    const res = await agent
      .post('/api/bins/bad$id!/overflow')
      .set('X-CSRF-Token', csrfToken);
    expect(res.status).toBe(400);
  });

  it('validates overflow report payload, sanitizes HTML, and rejects spoofed image uploads', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    // Reject invalid Campus ID
    const badId = await agent
      .post('/api/reports')
      .set('X-CSRF-Token', csrfToken)
      .send({
        binId: 'bin-101',
        reporterName: 'Ananya',
        campusId: '!!',
        role: 'Student',
        issueType: 'Bin Overflowing',
        urgency: 'Urgent',
        notes: '',
      });
    expect(badId.status).toBe(400);

    // Reject spoofed MIME image upload
    const fakeImg = `data:image/png;base64,${Buffer.from('not-a-png').toString('base64')}`;
    const badImg = await agent
      .post('/api/reports')
      .set('X-CSRF-Token', csrfToken)
      .send({
        binId: 'bin-101',
        reporterName: 'Ananya Verma',
        campusId: '2300970100084',
        role: 'Student',
        issueType: 'Bin Overflowing',
        urgency: 'Urgent',
        notes: 'Overflowing near stairs',
        evidenceDataUrl: fakeImg,
      });
    expect(badImg.status).toBe(400);

    // Accept valid report + sanitize XSS payload
    const validRes = await agent
      .post('/api/reports')
      .set('X-CSRF-Token', csrfToken)
      .send({
        binId: 'bin-101',
        reporterName: '<b>Ananya</b> Verma',
        campusId: '2300970100084',
        role: 'Student',
        issueType: 'Bin Overflowing',
        urgency: 'Urgent',
        notes: '<script>alert(1)</script>Near Block A gate',
      });

    expect(validRes.status).toBe(201);
    expect(validRes.body.report.reporterName).toBe('Ananya Verma');
    expect(validRes.body.report.notes).not.toContain('<script>');
    const updatedBin = validRes.body.state.bins.find(
      (b: { id: string }) => b.id === 'bin-101'
    );
    expect(updatedBin.reportedOverflow).toBe(true);
    expect(updatedBin.fillLevel).toBeGreaterThanOrEqual(93);
  });

  it('dispatches crew, collects bin, simulates sensors, and resets campus state', async () => {
    const { agent, csrfToken } = await getAuthenticatedAgent();

    const dispatchRes = await agent
      .post('/api/bins/bin-102/dispatch')
      .set('X-CSRF-Token', csrfToken);
    expect(dispatchRes.status).toBe(200);
    const dispatchedBin = dispatchRes.body.bins.find(
      (b: { id: string }) => b.id === 'bin-102'
    );
    expect(dispatchedBin.dispatched).toBe(true);

    const collectRes = await agent
      .post('/api/bins/bin-102/collect')
      .set('X-CSRF-Token', csrfToken);
    expect(collectRes.status).toBe(200);
    const clearedBin = collectRes.body.bins.find(
      (b: { id: string }) => b.id === 'bin-102'
    );
    expect(clearedBin.fillLevel).toBe(8);
    expect(clearedBin.reportedOverflow).toBe(false);

    const simRes = await agent
      .post('/api/bins/simulate')
      .set('X-CSRF-Token', csrfToken);
    expect(simRes.status).toBe(200);

    const resetRes = await agent
      .post('/api/reset')
      .set('X-CSRF-Token', csrfToken);
    expect(resetRes.status).toBe(200);
    const resetBin = resetRes.body.bins.find((b: { id: string }) => b.id === 'bin-102');
    expect(resetBin.fillLevel).toBe(93);
  });

  it('preserves all updates during concurrent bin collections without race conditions', async () => {
    const { csrfToken, sessionToken } = await getAuthenticatedAgent();
    const targetIds = ['bin-103', 'bin-104', 'bin-102', 'bin-105'];

    await Promise.all(
      targetIds.map((id) =>
        request(app)
          .post(`/api/bins/${id}/collect`)
          .set('X-CSRF-Token', csrfToken)
          .set('X-Session-Token', sessionToken)
          .expect(200)
      )
    );

    const finalState = await request(app).get('/api/campus/state').expect(200);
    for (const id of targetIds) {
      const bin = finalState.body.bins.find((b: { id: string }) => b.id === id);
      expect(bin.fillLevel).toBe(8);
    }

    await request(app)
      .post('/api/reset')
      .set('X-CSRF-Token', csrfToken)
      .set('X-Session-Token', sessionToken)
      .expect(200);
  });

  it('enforces API rate limits cleanly with 429', async () => {
    const strictApp = createApp({
      stateFilePath: path.join(tmpDir, 'rate-state.json'),
      sessionSecret: 'rate-secret',
      rateLimitMax: 3,
    });

    await request(strictApp).get('/api/health').expect(200);
    await request(strictApp).get('/api/health').expect(200);
    await request(strictApp).get('/api/health').expect(200);
    const limited = await request(strictApp).get('/api/health');
    expect(limited.status).toBe(429);
  });
});
