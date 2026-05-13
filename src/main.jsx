import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
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
