import { describe, expect, it } from 'vitest';
import {
  isValidEntityId,
  sanitizePlainText,
  validateBase64ImageEvidence,
} from '../server/store.ts';
import {
  findRouteProgressForBin,
  GCET_BUILDINGS,
  GCET_CAMPUS_ROADS,
  GCET_CENTER,
  getBinStatus,
  haversineDistanceKm,
  INITIAL_CAMPUS_BINS,
  interpolateRoutePoint,
  OPTIMAL_TRUCK_ROUTE,
} from '../src/data/gcetOsmData';
import { escapeHtml } from '../src/utils/security';

describe('GCET Geographic Data & Bin Logic (Unit)', () => {
  it('anchors GCET campus center to verified Knowledge Park II coordinates', () => {
    expect(GCET_CENTER[0]).toBeCloseTo(28.4568, 3);
    expect(GCET_CENTER[1]).toBeCloseTo(77.4976, 3);
    expect(GCET_BUILDINGS.length).toBeGreaterThanOrEqual(8);
    expect(GCET_CAMPUS_ROADS.length).toBeGreaterThanOrEqual(5);
  });

  it('computes Haversine distance accurately', () => {
    const zero = haversineDistanceKm(28.4568, 77.4976, 28.4568, 77.4976);
    expect(zero).toBe(0);

    // Distance between GCET center and Knowledge Park II Metro (~260m)
    const toMetro = haversineDistanceKm(28.45682, 77.49762, 28.457058, 77.500318);
    expect(toMetro).toBeGreaterThan(0.2);
    expect(toMetro).toBeLessThan(0.4);
  });

  it('evaluates getBinStatus across threshold boundaries', () => {
    const base = { ...INITIAL_CAMPUS_BINS[0], reportedOverflow: false };
    expect(getBinStatus({ ...base, fillLevel: 64 })).toBe('Nominal');
    expect(getBinStatus({ ...base, fillLevel: 65 })).toBe('Near Full');
    expect(getBinStatus({ ...base, fillLevel: 84 })).toBe('Near Full');
    expect(getBinStatus({ ...base, fillLevel: 85 })).toBe('Overflowing');
    expect(getBinStatus({ ...base, fillLevel: 15, reportedOverflow: true })).toBe(
      'Overflowing'
    );
  });

  it('interpolates truck coordinates smoothly along verified campus route', () => {
    const start = interpolateRoutePoint(OPTIMAL_TRUCK_ROUTE, 0);
    const end = interpolateRoutePoint(OPTIMAL_TRUCK_ROUTE, 1);
    expect(start).toEqual(OPTIMAL_TRUCK_ROUTE[0]);
    expect(end).toEqual(OPTIMAL_TRUCK_ROUTE[OPTIMAL_TRUCK_ROUTE.length - 1]);

    const canteenBin = INITIAL_CAMPUS_BINS.find((b) => b.id === 'bin-102')!;
    const progress = findRouteProgressForBin(
      OPTIMAL_TRUCK_ROUTE,
      canteenBin.lat,
      canteenBin.lon
    );
    expect(progress).toBeGreaterThan(0.5);
    expect(progress).toBeLessThanOrEqual(1);
  });
});

describe('Security & Sanitization Helpers (Unit)', () => {
  it('escapes HTML meta-characters to neutralize XSS payloads', () => {
    const payload = `<img src=x onerror="alert('xss')">`;
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).toContain('&lt;img');
  });

  it('strips HTML tags and control characters in plain-text sanitizer', () => {
    const dirty = 'Hello <script>alert(1)</script> \n\t World';
    expect(sanitizePlainText(dirty, 50)).toBe('Hello alert(1) World');
  });

  it('validates entity IDs against path-traversal and injection characters', () => {
    expect(isValidEntityId('bin-102')).toBe(true);
    expect(isValidEntityId('../etc/passwd')).toBe(false);
    expect(isValidEntityId('bin-102;DROP TABLE')).toBe(false);
  });

  it('verifies image magic bytes and rejects spoofed MIME uploads', () => {
    const fakePng = `data:image/png;base64,${Buffer.from('<html><script>1</script></html>').toString('base64')}`;
    expect(validateBase64ImageEvidence(fakePng).valid).toBe(false);

    // Valid minimal PNG header bytes (89 50 4E 47 0D 0A 1A 0A)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const validPng = `data:image/png;base64,${pngHeader.toString('base64')}`;
    expect(validateBase64ImageEvidence(validPng).valid).toBe(true);
  });
});
