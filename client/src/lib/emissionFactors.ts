// Source: IPCC AR6, EPA GHG Factors Hub 2023
export const EMISSION_FACTORS = {
  transport: {
    car_petrol_km: 0.171,       // kg CO2e per km
    car_electric_km: 0.053,
    bus_km: 0.089,
    train_km: 0.041,
    flight_domestic_km: 0.255,
    flight_international_km: 0.195,
    motorcycle_km: 0.116,
    bicycle_km: 0,
    walking_km: 0,
  },
  food: {
    beef_kg: 27.0,              // kg CO2e per kg food
    lamb_kg: 39.2,
    pork_kg: 12.1,
    chicken_kg: 6.9,
    fish_kg: 6.1,
    dairy_kg: 3.2,
    eggs_kg: 4.8,
    vegetables_kg: 2.0,
    vegan_meal: 0.5,            // per meal
    meat_meal: 3.8,
  },
  energy: {
    electricity_kwh: 0.233,     // India grid average kg CO2e/kWh
    natural_gas_kwh: 0.202,
    lpg_kg: 2.983,
    coal_kg: 2.42,
  },
  shopping: {
    clothing_item: 10.0,        // kg CO2e per item
    electronics_small: 70.0,
    electronics_large: 300.0,
    furniture_item: 50.0,
  },
  waste: {
    landfill_kg: 0.5,
    recycled_kg: 0.021,
    composted_kg: 0.01,
  }
} as const;

export const GLOBAL_AVG_ANNUAL_KG = 4000;   // kg CO2e/year
export const INDIA_AVG_ANNUAL_KG = 1900;
export const TARGET_ANNUAL_KG = 2000;        // Paris Agreement 2°C target

export function calculateEmission(
  category: keyof typeof EMISSION_FACTORS,
  subType: string,
  quantity: number,
  country: string = 'IN'
): number {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  const factors = EMISSION_FACTORS[category];
  if (!factors || !(subType in factors)) {
    throw new Error(`Invalid subtype ${subType} for category ${category}`);
  }
  let factor = (factors as Record<string, number>)[subType];

  // Apply country-specific emission factors for electricity
  if (category === 'energy' && subType === 'electricity_kwh') {
    switch (country.toUpperCase()) {
      case 'US':
        factor = 0.38; // United States
        break;
      case 'DE':
        factor = 0.40; // Germany
        break;
      case 'CA':
        factor = 0.12; // Canada (clean grid)
        break;
      case 'GB':
        factor = 0.25; // United Kingdom
        break;
      case 'IN':
      default:
        factor = 0.82; // India (coal-heavy grid average)
        break;
    }
  }

  return quantity * factor;
}
