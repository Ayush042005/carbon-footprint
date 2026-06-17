import { describe, it, expect } from 'vitest';
import { calculateEmission } from '../../server/src/services/emissionService';

describe('Server Emission Calculator', () => {
  it('calculates car petrol emissions correctly', () => {
    expect(calculateEmission('transport', 'car_petrol_km', 100))
      .toBeCloseTo(17.1, 1);
  });

  it('returns 0 for cycling', () => {
    expect(calculateEmission('transport', 'bicycle_km', 50)).toBe(0);
  });

  it('throws for negative quantity', () => {
    expect(() => calculateEmission('transport', 'car_petrol_km', -1))
      .toThrow('Quantity cannot be negative');
  });

  it('throws for invalid category/subtype', () => {
    expect(() => calculateEmission('transport', 'invalid_type', 100))
      .toThrow(/Invalid subtype invalid_type/);
  });

  describe('electricity_kwh country factors', () => {
    it('uses IN factor by default or specifically', () => {
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'IN')).toBe(82);
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'in')).toBe(82);
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'OTHER')).toBe(82);
    });

    it('uses US factor', () => {
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'US')).toBe(38);
    });

    it('uses DE factor', () => {
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'DE')).toBe(40);
    });

    it('uses CA factor', () => {
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'CA')).toBe(12);
    });

    it('uses GB factor', () => {
      expect(calculateEmission('energy', 'electricity_kwh', 100, 'GB')).toBe(25);
    });
  });
});
