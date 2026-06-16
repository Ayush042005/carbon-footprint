import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import EmissionMap from '../components/map/EmissionMap';

export default function MapPage() {
  const { activities, fetchActivities } = useStore();

  useEffect(() => {
    fetchActivities();
  }, []);

  const transportLogs = activities.filter((act) => act.category === 'transport');

  const getAlternativeComparison = (subType: string, qty: number, originalEmission: number) => {
    if (subType === 'bicycle_km' || subType === 'walking_km') {
      return { text: 'Great choice! Zero carbon emission.', saving: 0 };
    }
    
    // Train factor: 0.041 kg/km
    const trainEmission = qty * 0.041;
    const saving = originalEmission - trainEmission;

    if (saving <= 0.1) {
      return { text: 'Already optimal or low emission.', saving: 0 };
    }

    return {
      text: `Taking a train would save approx ${saving.toFixed(1)} kg CO₂e.`,
      saving,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Emission route Map</h1>
        <p className="text-slate-500 text-sm">
          Visualize your travel history, compare transport intensities, and evaluate green alternatives.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Container */}
        <div className="lg:col-span-2 space-y-4">
          <EmissionMap activities={activities} />
          
          {/* Map Color Coding Legend */}
          <div className="bg-white px-6 py-4 rounded-2xl border border-green-100 shadow-sm flex flex-wrap gap-6 items-center justify-center text-xs font-semibold">
            <span className="text-slate-400">Emission Intensity Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a]" />
              <span>Low (&lt; 10 kg CO₂e)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b]" />
              <span>Medium (10 - 30 kg CO₂e)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444]" />
              <span>High (&gt; 30 kg CO₂e)</span>
            </div>
          </div>
        </div>

        {/* Sidebar logs list */}
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col h-[560px]">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Travel Logs & Alternatives</h2>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {transportLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="text-4xl" role="img" aria-label="car">🚗</span>
                <p className="text-xs">No transport logs recorded yet.</p>
              </div>
            ) : (
              transportLogs.map((log) => {
                const alt = getAlternativeComparison(log.sub_type, log.quantity, log.emission_kg);
                return (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 capitalize text-sm">
                          {log.sub_type.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-red-500">
                        {log.emission_kg.toFixed(1)} kg
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Distance: <b>{log.quantity} km</b>
                    </div>

                    {alt.saving > 0 && (
                      <div className="p-2 bg-green-50/50 rounded-lg border border-green-100/50 text-[10px] font-medium text-green-700 flex items-center gap-1">
                        <span>💡</span>
                        <span>{alt.text}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
