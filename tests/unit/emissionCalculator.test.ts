import { describe, it, expect } from 'vitest';
import { calculateEmission } from '../../client/src/lib/emissionFactors';

describe('Emission Calculator', () => {
  it('calculates car petrol emissions correctly', () => {
    expect(calculateEmission('transport', 'car_petrol_km', 100))
      .toBeCloseTo(17.1, 1);
  });

  it('returns 0 for cycling', () => {
    expect(calculateEmission('transport', 'bicycle_km', 50)).toBe(0);
  });

  it('throws for negative quantity', () => {
    expect(() => calculateEmission('transport', 'car_petrol_km', -1))
      .toThrow();
  });
});
