import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './design-system/tokens.css';
import App from './App.jsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.2,
  environment: import.meta.env.DEV ? 'development' : 'production',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#050810',color:'#f5f5f0',fontFamily:'sans-serif',fontSize:15}}>Something went wrong. Please restart the app.</div>}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
