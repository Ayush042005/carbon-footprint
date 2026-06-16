import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = {
  Transport: '#3b82f6',
  Food: '#10b981',
  Energy: '#f59e0b',
  Shopping: '#8b5cf6',
  Waste: '#ef4444',
};

export default function Dashboard() {
  const { user, activities, fetchActivities, fetchProfile } = useStore();

  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, []);

  // 1. Calculations
  const last30Days = activities.filter((act) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(act.date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const totalEmissions30Days = last30Days.reduce((acc, curr) => acc + curr.emission_kg, 0);
  const totalEmissionsYearProj = totalEmissions30Days * 12; // Project 1 year based on current 30 days
  const treesRequired = Math.round(totalEmissions30Days / 22); // 1 mature tree absorbs ~22kg of CO2/year

  // 2. Streaks (Log frequency in consecutive days)
  const calculateStreak = () => {
    if (activities.length === 0) return 0;
    const loggedDates = Array.from(new Set(activities.map((act) => act.date.split('T')[0]))).sort();
    let streak = 0;
    let todayStr = new Date().toISOString().split('T')[0];
    let yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user logged today or yesterday
    if (!loggedDates.includes(todayStr) && !loggedDates.includes(yesterdayStr)) {
      return 0;
    }

    let checkDate = loggedDates.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);

    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (loggedDates.includes(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // 3. Recharts Formatter
  const getDailyChartData = () => {
    const dataMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = 0;
    }

    last30Days.forEach((act) => {
      const dateStr = act.date.split('T')[0];
      if (dataMap[dateStr] !== undefined) {
        dataMap[dateStr] += act.emission_kg;
      }
    });

    return Object.entries(dataMap).map(([date, kg]) => ({
      date: date.substring(5), // MM-DD
      'Emissions (kg)': parseFloat(kg.toFixed(1)),
    }));
  };

  const getCategoryData = () => {
    const categories = {
      Transport: 0,
      Food: 0,
      Energy: 0,
      Shopping: 0,
      Waste: 0,
    };

    last30Days.forEach((act) => {
      const catName = act.category.charAt(0).toUpperCase() + act.category.slice(1) as keyof typeof categories;
      if (categories[catName] !== undefined) {
        categories[catName] += act.emission_kg;
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(1)),
      }))
      .filter((item) => item.value > 0);
  };

  const chartData = getDailyChartData();
  const categoryData = getCategoryData();

  // Daily target line threshold
  const targetPerDay = user?.monthlyTarget ? user.monthlyTarget / 30 : 2000 / 365;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome & Motivational Headline */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome Back, {user?.name}!</h1>
          <p className="text-slate-500 text-sm">Here is your carbon footprint breakdown for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-green-100 shadow-sm">
          <span className="text-2xl" role="img" aria-label="fire">🔥</span>
          <div>
            <div className="text-xs text-slate-400 font-medium">Logging Streak</div>
            <div className="font-bold text-slate-900">{currentStreak} {currentStreak === 1 ? 'day' : 'days'} in a row</div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">30-Day Footprint</div>
          <div className="text-4xl font-extrabold text-slate-900 font-mono mb-2">
            {totalEmissions30Days.toFixed(1)} <span className="text-lg font-normal text-slate-500">kg CO₂e</span>
          </div>
          <p className="text-xs text-slate-500">
            = Projected annual total: {totalEmissionsYearProj.toFixed(0)} kg CO₂e
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Alignment</div>
            <div className="text-4xl font-extrabold text-slate-900 font-mono mb-2">
              {user?.monthlyTarget ? `${user.monthlyTarget} kg` : 'None'}
            </div>
          </div>
          {user?.monthlyTarget ? (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalEmissions30Days > user.monthlyTarget
                      ? 'bg-red-500'
                      : totalEmissions30Days > user.monthlyTarget * 0.8
                      ? 'bg-amber-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((totalEmissions30Days / user.monthlyTarget) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold font-mono">
                <span>Used: {((totalEmissions30Days / user.monthlyTarget) * 100).toFixed(0)}%</span>
                <span>{totalEmissions30Days <= user.monthlyTarget ? '🟢 Under' : '🔴 Exceeding'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Set target in Profile settings.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Offset Equivalent</div>
            <div className="text-4xl font-extrabold text-slate-900 font-mono mb-2">
              {treesRequired} <span className="text-lg font-normal text-slate-500">{treesRequired === 1 ? 'tree' : 'trees'}</span>
            </div>
            <p className="text-xs text-slate-500">needed to absorb your emissions this month.</p>
          </div>
          <span className="text-5xl" role="img" aria-label="tree">🌳</span>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">30-Day Emission Trend</h2>
          <div className="h-72" role="img" aria-label="30-day emission trend line graph">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="Emissions (kg)"
                  stroke="#16a34a"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <ReferenceLine
                  y={parseFloat(targetPerDay.toFixed(1))}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Daily Budget', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Category Breakdown</h2>
          {categoryData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="text-4xl" role="img" aria-label="empty">🍃</span>
              <p className="text-sm">No activity logs recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
                    />
                    <span className="text-slate-600 truncate">{entry.name}: {entry.value} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Benchmark Comparisons Bar Chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">How You Compare (Annualized CO₂e)</h2>
          <p className="text-slate-500 text-xs mb-6 font-medium">
            Comparing your projected annual carbon footprint (based on the last 30 days) against key climate targets and regional averages.
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Your Proj. Annual', 'CO₂ (kg/yr)': Math.round(totalEmissionsYearProj), color: '#16a34a' },
                  { name: 'Paris Target Limit', 'CO₂ (kg/yr)': 2000, color: '#3b82f6' },
                  { name: 'India Avg per Capita', 'CO₂ (kg/yr)': 1900, color: '#f59e0b' },
                ]}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
              >
                <XAxis type="number" stroke="#94a3b8" fontSize={11} unit=" kg" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip formatter={(value) => [`${value} kg CO₂e`, 'Annualized Carbon']} />
                <Bar dataKey="CO₂ (kg/yr)" radius={[0, 6, 6, 0]} barSize={24}>
                  {
                    [
                      { color: '#16a34a' },
                      { color: '#3b82f6' },
                      { color: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Wins for Today
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Turn off idle lights', desc: 'Saves 0.2 kg CO₂e per hour. Use natural light where possible.', difficulty: 'Easy' },
            { title: 'Choose a veggie meal', desc: 'Opting for plant-based meals saves up to 3 kg CO₂e per meal compared to meat.', difficulty: 'Easy' },
            { title: 'Walk short distances', desc: 'Avoid short car trips. Walking saves 0.17 kg CO₂e per kilometer.', difficulty: 'Easy' },
          ].map((win, idx) => (
            <div key={idx} className="p-4 bg-green-50/50 border border-green-100/50 rounded-xl">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-100 rounded-full mb-2">
                {win.difficulty}
              </span>
              <h3 className="font-semibold text-slate-800 mb-1">{win.title}</h3>
              <p className="text-xs text-slate-500">{win.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
