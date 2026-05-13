import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';

// Sentry is optional — only activates when VITE_SENTRY_DSN is set
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn:              import.meta.env.VITE_SENTRY_DSN,
    environment:      import.meta.env.MODE,
    tracesSampleRate: 0.2,
    integrations:     [Sentry.browserTracingIntegration()],
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      onError={(error, componentStack) => {
        console.error('BOUNDARY CAUGHT:', error.message);
        console.error('STACK:', componentStack);
      }}
      fallback={<div style={{padding:40,color:'#fff',fontFamily:'sans-serif'}}>Something went wrong. Please reload the app.</div>}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
