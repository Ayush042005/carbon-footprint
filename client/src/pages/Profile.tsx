import { useState, useEffect, FormEvent } from 'react';
import { useStore } from '../store/useStore';

export default function Profile() {
  const { user, updateProfile } = useStore();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('IN');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCountry(user.country);
      setMonthlyTarget(user.monthlyTarget ? user.monthlyTarget.toString() : '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const parsedTarget = monthlyTarget ? parseFloat(monthlyTarget) : undefined;
    if (parsedTarget !== undefined && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      setError('Target budget must be a positive number');
      setLoading(false);
      return;
    }

    try {
      await updateProfile({
        name,
        country,
        monthlyTarget: parsedTarget,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profile & Carbon Goals</h1>
        <p className="text-slate-500 text-sm">
          Set up your reduction targets and personal parameters to calibrate your carbon budgets.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>✅</span> Profile settings saved successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="name">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email Address (Read-only)
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="country">
              Country / Region
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="CA">Canada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="monthlyTarget">
              Monthly Carbon Target Budget (kg CO₂e)
            </label>
            <input
              id="monthlyTarget"
              type="number"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              placeholder="e.g. 150"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => setMonthlyTarget(String(Math.round(158 * 0.9)))}
                className="px-3 py-1.5 text-[11px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium transition-all"
              >
                10% Reduction (142 kg)
              </button>
              <button
                type="button"
                onClick={() => setMonthlyTarget(String(Math.round(158 * 0.8)))}
                className="px-3 py-1.5 text-[11px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium transition-all"
              >
                20% Reduction (126 kg)
              </button>
              <button
                type="button"
                onClick={() => setMonthlyTarget(String(Math.round(158 * 0.7)))}
                className="px-3 py-1.5 text-[11px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium transition-all"
              >
                30% Reduction (111 kg)
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-normal">
              Indian average monthly emissions is about <b>158 kg</b> per capita.
              Paris Agreement target for holding warming to 2°C is approx. <b>166 kg/month</b> (2000 kg/year).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
