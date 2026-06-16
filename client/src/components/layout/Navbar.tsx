import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/log', label: 'Log Activity', icon: '✏️' },
    { path: '/map', label: 'Travel Map', icon: '🗺️' },
    { path: '/insights', label: 'AI Insights', icon: '💡' },
    { path: '/profile', label: 'Profile & Goal', icon: '👤' },
  ];

  return (
    <nav className="bg-white border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl" role="img" aria-label="leaf">🌿</span>
              <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-green-600 transition-colors">
                GreenTrace
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex space-x-8 items-center">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-slate-600 hover:text-green-600 hover:border-green-200'
                  }`}
                >
                  <span className="mr-1.5" role="img" aria-hidden="true">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Info / Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">{user.name}</span>
              <span className="text-xs text-slate-500 font-mono">
                {user.monthlyTarget ? `${user.monthlyTarget} kg CO2e` : 'No Target'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Logout"
            >
              <span className="text-lg" role="img" aria-hidden="true">🚪</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Links */}
      <div className="md:hidden flex justify-around border-t border-green-50 py-2 bg-white">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center text-xs font-medium transition-colors ${
                isActive ? 'text-green-600' : 'text-slate-500 hover:text-green-600'
              }`}
            >
              <span className="text-lg mb-0.5" role="img" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
