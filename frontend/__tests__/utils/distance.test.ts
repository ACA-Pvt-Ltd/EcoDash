import { haversineKm, inRadiusBand } from '@/utils/distance';

// Reference points (lat, lon)
const COLOMBO = { lat: 6.9271, lon: 79.8612 };
const KANDY = { lat: 7.2906, lon: 80.6337 };

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(COLOMBO.lat, COLOMBO.lon, COLOMBO.lat, COLOMBO.lon)).toBe(0);
  });

  it('computes a known real-world distance (Colombo to Kandy ~94km)', () => {
    const km = haversineKm(COLOMBO.lat, COLOMBO.lon, KANDY.lat, KANDY.lon);
    expect(km).toBeGreaterThan(90);
    expect(km).toBeLessThan(100);
  });

  it('is symmetric regardless of argument order', () => {
    const ab = haversineKm(COLOMBO.lat, COLOMBO.lon, KANDY.lat, KANDY.lon);
    const ba = haversineKm(KANDY.lat, KANDY.lon, COLOMBO.lat, COLOMBO.lon);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it('treats 0,0 as a real coordinate rather than missing data', () => {
    expect(haversineKm(0, 0, 0, 0)).toBe(0);
    expect(haversineKm(0, 0, COLOMBO.lat, COLOMBO.lon)).toBeGreaterThan(0);
  });

  it('computes roughly half the earth circumference for antipodal points', () => {
    const km = haversineKm(0, 0, 0, 180);
    expect(km).toBeCloseTo(Math.PI * 6371, 0);
  });

  it('returns NaN for NaN or undefined input rather than throwing', () => {
    expect(haversineKm(NaN, 0, 0, 0)).toBeNaN();
    expect(haversineKm(undefined as never, 0, 0, 0)).toBeNaN();
  });

  // Documents a real sharp edge: null coerces to 0 in arithmetic, so a missing
  // coordinate silently becomes "off the coast of Africa" instead of failing.
  it('silently coerces null coordinates to 0 (no validation)', () => {
    expect(haversineKm(null as never, null as never, 0, 0)).toBe(0);
  });
});

describe('inRadiusBand', () => {
  it('accepts everything for the "all" band, including null distance', () => {
    expect(inRadiusBand(999999, 'all')).toBe(true);
    expect(inRadiusBand(null, 'all')).toBe(true);
  });

  it('rejects a null distance for every concrete band', () => {
    expect(inRadiusBand(null, '0-50')).toBe(false);
    expect(inRadiusBand(null, '50-150')).toBe(false);
    expect(inRadiusBand(null, '150-250')).toBe(false);
  });

  it.each([
    [10, '0-50', true],
    [50, '0-50', true],
    [50.01, '0-50', false],
    [50, '50-150', false],
    [50.01, '50-150', true],
    [150, '50-150', true],
    [150.01, '50-150', false],
    [150.01, '150-250', true],
    [250, '150-250', true],
    [250.01, '150-250', false],
  ])('places %pkm in band %s -> %s', (km, band, expected) => {
    expect(inRadiusBand(km, band)).toBe(expected);
  });

  it('excludes a distance from every band it does not belong to', () => {
    expect(inRadiusBand(100, '0-50')).toBe(false);
    expect(inRadiusBand(100, '150-250')).toBe(false);
    expect(inRadiusBand(100, '50-150')).toBe(true);
  });

  it('returns false for NaN distances in concrete bands', () => {
    expect(inRadiusBand(NaN, '0-50')).toBe(false);
  });

  // Documented quirks — not in the agreed fix list, pinned so a future change
  // to this helper is a deliberate decision rather than an accident.
  it('fails open for an unrecognised band name', () => {
    expect(inRadiusBand(99999, '250+')).toBe(true);
  });

  it('lets a negative distance pass the 0-50 band', () => {
    expect(inRadiusBand(-5, '0-50')).toBe(true);
  });
});
