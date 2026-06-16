import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Log from './pages/Log';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import MapPage from './pages/MapPage';

export default function App() {
  const { user, isLoading, fetchProfile } = useStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce" role="img" aria-label="leaf">🌿</span>
          <div className="text-green-700 font-semibold animate-pulse">Loading GreenTrace...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-green-50 flex flex-col">
        {user && <Navbar />}
        <main className="flex-1" id="main-content">
          <Routes>
            {!user ? (
              <>
                <Route path="*" element={<Home />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/log" element={<Log />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
