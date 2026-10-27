import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🎯</span>
        <span>TechXConf Career Compass</span>
        <span className="brand-badge">LIVE</span>
      </Link>

      <div className="navbar-links">
        <NavLink to="/sessions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          📅 Sessions
        </NavLink>
        {user && (
          <>
            <NavLink to="/assess" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              🧭 Assess
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              📊 My Plan
            </NavLink>
          </>
        )}
        <NavLink to="/observability" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          🔭 Observability
        </NavLink>
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <div className="user-badge">
              <div className="avatar" aria-hidden="true">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user.name?.split(' ')[0]}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Sign out">
              Sign out
            </button>
          </>
        ) : (
          <Link to="/" className="btn btn-primary btn-sm">
            Get Started →
          </Link>
        )}
      </div>
    </nav>
  );
}
