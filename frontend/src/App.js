import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import Sessions from './pages/Sessions';
import Dashboard from './pages/Dashboard';
import Observability from './pages/Observability';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('txc_user')); } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('txc_user', JSON.stringify(user));
    else localStorage.removeItem('txc_user');
  }, [user]);

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing user={user} setUser={setUser} />} />
            <Route path="/assess" element={user ? <Assessment user={user} /> : <Navigate to="/" replace />} />
            <Route path="/results/:id" element={user ? <Results user={user} /> : <Navigate to="/" replace />} />
            <Route path="/sessions" element={<Sessions user={user} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
            <Route path="/observability" element={<Observability />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <div className="footer-inner">
            <span>🎯 TechXConf Career Compass</span>
            <span className="footer-sep">·</span>
            <span>Powered by Harness observability guardrails</span>
            <span className="footer-sep">·</span>
            <span>TechXConf 2026</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
