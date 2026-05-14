import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [auth, setAuth] = useState(null); // null=loading, false=unauth, {email}=authed

  useEffect(() => {
    fetch('/api/admin-verify', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuth(d.authenticated ? { email: d.email } : false))
      .catch(() => setAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST', credentials: 'include' });
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!auth) return <Login onLogin={(data) => setAuth(data)} />;

  return <Dashboard adminEmail={auth.email} onLogout={handleLogout} />;
}
