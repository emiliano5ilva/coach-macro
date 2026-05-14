import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import SetupScreen from './SetupScreen.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  // null=loading, 'setup'=needs TOTP setup, false=unauth, {email}=authed
  const [auth, setAuth] = useState(null);

  const check = () => {
    fetch('/api/admin-verify', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setAuth({ email: d.email });
        } else {
          // Check whether TOTP has been configured yet
          fetch('/api/admin-setup')
            .then((r) => r.json())
            .then((s) => setAuth(s.needsSetup ? 'setup' : false))
            .catch(() => setAuth(false));
        }
      })
      .catch(() => setAuth(false));
  };

  useEffect(() => { check(); }, []);

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST', credentials: 'include' });
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080808' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (auth === 'setup') return <SetupScreen onSetupComplete={() => setAuth(false)} />;
  if (!auth)           return <Login onLogin={(data) => setAuth(data)} />;

  return <Dashboard adminEmail={auth.email} onLogout={handleLogout} />;
}
