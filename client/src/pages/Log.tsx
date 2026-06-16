import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { Loader } from '@googlemaps/js-api-loader';

const EMISSION_FACTORS_CLIENT: Record<string, number> = {
  car_petrol_km: 0.171,
  car_electric_km: 0.053,
  bus_km: 0.089,
  train_km: 0.041,
  flight_domestic_km: 0.255,
  flight_international_km: 0.195,
  motorcycle_km: 0.116,
  bicycle_km: 0,
  walking_km: 0,
  beef_kg: 27.0,
  lamb_kg: 39.2,
  pork_kg: 12.1,
  chicken_kg: 6.9,
  fish_kg: 6.1,
  dairy_kg: 3.2,
  eggs_kg: 4.8,
  vegetables_kg: 2.0,
  vegan_meal: 0.5,
  meat_meal: 3.8,
  electricity_kwh: 0.82,
  natural_gas_kwh: 0.202,
  lpg_kg: 2.983,
  coal_kg: 2.42,
  clothing_item: 10.0,
  electronics_small: 70.0,
  electronics_large: 300.0,
  furniture_item: 50.0,
  landfill_kg: 0.5,
  recycled_kg: 0.021,
  composted_kg: 0.01,
};

const subTypesMap: Record<Category, { value: string; label: string; unit: string }[]> = {
  transport: [
    { value: 'car_petrol_km', label: 'Petrol/Diesel Car', unit: 'km' },
    { value: 'car_electric_km', label: 'Electric Car (EV)', unit: 'km' },
    { value: 'bus_km', label: 'Auto Rickshaw / Local Bus', unit: 'km' },
    { value: 'train_km', label: 'Metro / Indian Railways Train', unit: 'km' },
    { value: 'flight_domestic_km', label: 'Domestic Flight (e.g. Delhi to Mumbai)', unit: 'km' },
    { value: 'flight_international_km', label: 'International Flight', unit: 'km' },
    { value: 'motorcycle_km', label: 'Two-Wheeler (Scooter/Motorbike)', unit: 'km' },
    { value: 'bicycle_km', label: 'Bicycle ride', unit: 'km' },
    { value: 'walking_km', label: 'Walking / Foot', unit: 'km' },
  ],
  food: [
    { value: 'vegan_meal', label: 'Simple Veg Meal (Dal, Rice & Roti)', unit: 'meals' },
    { value: 'vegetables_kg', label: 'Dairy-rich Veg Meal (with Paneer/Butter)', unit: 'meals' },
    { value: 'chicken_kg', label: 'Chicken Curry Meal', unit: 'meals' },
    { value: 'lamb_kg', label: 'Mutton/Lamb Dish', unit: 'meals' },
    { value: 'fish_kg', label: 'Fish / Seafood Curry', unit: 'meals' },
    { value: 'dairy_kg', label: 'Milk / Lassi / Ghee', unit: 'kg' },
    { value: 'eggs_kg', label: 'Egg Bhurji / Eggs', unit: 'kg' },
    { value: 'meat_meal', label: 'Standard Non-Veg Thali', unit: 'meals' },
  ],
  energy: [
    { value: 'electricity_kwh', label: 'Grid Electricity (State Board)', unit: 'kWh' },
    { value: 'lpg_kg', label: 'LPG Cylinder (standard 14.2 kg cooking gas)', unit: 'kg' },
    { value: 'natural_gas_kwh', label: 'PNG (Piped Natural Gas)', unit: 'kWh' },
    { value: 'coal_kg', label: 'Traditional Coal / Wood combustion', unit: 'kg' },
  ],
  shopping: [
    { value: 'clothing_item', label: 'Clothing Item (Saree, Kurta, Jeans)', unit: 'items' },
    { value: 'electronics_small', label: 'Smart Phone / Tablet / Small gadget', unit: 'items' },
    { value: 'electronics_large', label: 'Refrigerator / AC / TV', unit: 'items' },
    { value: 'furniture_item', label: 'Furniture (Wooden / Steel)', unit: 'items' },
  ],
  waste: [
    { value: 'landfill_kg', label: 'Municipal Garbage / Trash bin', unit: 'kg' },
    { value: 'recycled_kg', label: 'Recycled Waste (Raddi / Kabadiwala)', unit: 'kg' },
    { value: 'composted_kg', label: 'Home Composting (kitchen waste)', unit: 'kg' },
  ],
};

export default function Log() {
  const { user, activities, fetchActivities, logActivity, deleteActivity } = useStore();

  const [category, setCategory] = useState<Category>('transport');
  const [subType, setSubType] = useState('car_petrol_km');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16));
  const [notes, setNotes] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Maps autocomplete setup
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchActivities();

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      setGoogleLoaded(true);
    }).catch((err) => console.error('Error loading google maps inside Log', err));
  }, []);

  // Set up autocomplete listeners
  useEffect(() => {
    if (!googleLoaded || category !== 'transport') return;
    const g = (window as any).google;
    if (!g) return;

    let originAutocomplete: any = null;
    let destAutocomplete: any = null;

    if (originInputRef.current) {
      originAutocomplete = new g.maps.places.Autocomplete(originInputRef.current, {
        types: ['geocode', 'establishment'],
      });
      originAutocomplete.addListener('place_changed', () => {
        const place = originAutocomplete?.getPlace();
        if (place?.formatted_address) {
          setOrigin(place.formatted_address);
        } else if (place?.name) {
          setOrigin(place.name);
        }
      });
    }

    if (destinationInputRef.current) {
      destAutocomplete = new g.maps.places.Autocomplete(destinationInputRef.current, {
        types: ['geocode', 'establishment'],
      });
      destAutocomplete.addListener('place_changed', () => {
        const place = destAutocomplete?.getPlace();
        if (place?.formatted_address) {
          setDestination(place.formatted_address);
        } else if (place?.name) {
          setDestination(place.name);
        }
      });
    }

    return () => {
      if (originAutocomplete) g.maps.event.clearInstanceListeners(originAutocomplete);
      if (destAutocomplete) g.maps.event.clearInstanceListeners(destAutocomplete);
    };
  }, [googleLoaded, category]);

  // Automated Distance Matrix fetch
  useEffect(() => {
    if (category !== 'transport' || !origin || !destination || !googleLoaded) return;
    const g = (window as any).google;
    if (!g) return;

    const delayDebounceFn = setTimeout(() => {
      const service = new g.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (response: any, status: any) => {
          if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
            const distanceMeters = response.rows[0].elements[0].distance.value;
            const distanceKm = distanceMeters / 1000;
            setQuantity(distanceKm.toFixed(1));
          }
        }
      );
    }, 800); // Debounce distance requests

    return () => clearTimeout(delayDebounceFn);
  }, [origin, destination, googleLoaded, category]);

  // Update subtype automatically when category changes
  useEffect(() => {
    const list = subTypesMap[category];
    if (list && list.length > 0) {
      setSubType(list[0].value);
    }
    setOrigin('');
    setDestination('');
  }, [category]);

  const currentUnit = subTypesMap[category]?.find((item) => item.value === subType)?.unit || '';

  const getPreviewEmissionsAndTrees = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return null;

    let factor = EMISSION_FACTORS_CLIENT[subType] || 0;
    if (category === 'energy' && subType === 'electricity_kwh' && user?.country) {
      switch (user.country.toUpperCase()) {
        case 'US': factor = 0.38; break;
        case 'DE': factor = 0.40; break;
        case 'CA': factor = 0.12; break;
        case 'GB': factor = 0.25; break;
        case 'IN': default: factor = 0.82; break;
      }
    }

    const emission = qty * factor;
    const trees = emission / 22; // 1 tree offsets ~22kg of CO2 per year
    return {
      emission: emission.toFixed(2),
      trees: trees.toFixed(3),
    };
  };

  const preview = getPreviewEmissionsAndTrees();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('Quantity must be a positive number');
      return;
    }

    setLoading(true);
    try {
      await logActivity({
        category,
        subType,
        quantity: parsedQty,
        unit: currentUnit,
        date: new Date(date).toISOString(),
        notes: notes || undefined,
        origin: category === 'transport' && origin ? origin : undefined,
        destination: category === 'transport' && destination ? destination : undefined,
      });
      setQuantity('');
      setNotes('');
      setOrigin('');
      setDestination('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this activity log?')) {
      try {
        await deleteActivity(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Log Section */}
      <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm lg:col-span-1 h-fit">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Log Carbon Activity</h2>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100" role="alert" id="quantity-error">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Log carbon activity">
          {/* Category Fieldset */}
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-sm font-medium text-slate-700 mb-2">Category</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['transport', 'food', 'energy', 'shopping', 'waste'] as Category[]).map((cat) => (
                <label
                  key={cat}
                  htmlFor={`cat-${cat}`}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer capitalize font-semibold transition-all ${
                    category === cat
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    id={`cat-${cat}`}
                    name="category"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="sr-only"
                  />
                  <span>
                    {cat === 'transport' && '🚗'}
                    {cat === 'food' && '🍲'}
                    {cat === 'energy' && '⚡'}
                    {cat === 'shopping' && '🛍️'}
                    {cat === 'waste' && '🗑️'}
                  </span>
                  <span className="text-xs mt-1">{cat}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Subtype Option */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="subType">
              Activity Type
            </label>
            <select
              id="subType"
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              {subTypesMap[category]?.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Origin & Destination (for Transport category) */}
          {category === 'transport' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="origin">
                  Origin Location
                </label>
                <input
                  id="origin"
                  type="text"
                  ref={originInputRef}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="destination">
                  Destination Location
                </label>
                <input
                  id="destination"
                  type="text"
                  ref={destinationInputRef}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Indira Gandhi Airport, Delhi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="quantity">
              Quantity ({currentUnit}) {category === 'transport' && '(Auto-calculated if locations set)'}
            </label>
            <input
              id="quantity"
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              aria-describedby={formError ? "quantity-error" : undefined}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder={`Enter amount in ${currentUnit}`}
            />
          </div>

          {/* Dynamic Trees Equivalent Preview */}
          {preview && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between text-xs font-semibold text-green-800">
              <div>
                <div className="text-[10px] uppercase text-green-600 font-bold tracking-wider mb-0.5">Est. Impact</div>
                <div className="font-mono text-sm font-extrabold">{preview.emission} kg CO₂e</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-green-600 font-bold tracking-wider mb-0.5">Offset Equivalent</div>
                <div className="font-mono">🌳 {preview.trees} tree yrs</div>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="date">
              Date & Time
            </label>
            <input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all h-20 resize-none"
              placeholder="E.g., Commute to office, grocery run"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Activity'}
          </button>
        </form>
      </div>

      {/* Activities Log History Table */}
      <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-[580px]">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Activity Logs History</h2>

        <div className="flex-1 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
              <span className="text-4xl" role="img" aria-label="empty">🍃</span>
              <p className="text-sm">No activity logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">CO₂ & Trees Offset</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {new Date(act.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-100 text-slate-700">
                          {act.category === 'transport' && '🚗'}
                          {act.category === 'food' && '🍲'}
                          {act.category === 'energy' && '⚡'}
                          {act.category === 'shopping' && '🛍️'}
                          {act.category === 'waste' && '🗑️'}
                          <span className="ml-1">{act.category}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-slate-700 font-medium">
                        <div>{subTypesMap[act.category]?.find((item) => item.value === act.sub_type)?.label || act.sub_type}</div>
                        {act.origin && act.destination && (
                          <div className="text-[10px] text-green-600 font-semibold truncate max-w-[180px]">
                            📍 {act.origin.split(',')[0]} ➔ {act.destination.split(',')[0]}
                          </div>
                        )}
                        {act.notes && <div className="text-[10px] text-slate-400 font-normal italic">{act.notes}</div>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-slate-600 font-mono">
                        {act.quantity} {act.unit}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-mono">
                        <div className="font-extrabold text-green-700">{act.emission_kg.toFixed(2)} kg</div>
                        <div className="text-[10px] text-slate-500 font-semibold">🌳 {(act.emission_kg / 22).toFixed(3)} tree yrs</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                          aria-label={`Delete activity logged on ${new Date(act.date).toLocaleDateString()}`}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
