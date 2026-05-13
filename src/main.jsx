import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import { PrivacyPolicy, TermsOfService, HealthDisclaimer, HealthDataNotice,
  WashingtonPrivacy, CaliforniaPrivacy, SupportPage } from './legal.jsx';

// Sentry is optional — only activates when VITE_SENTRY_DSN is set
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn:               import.meta.env.VITE_SENTRY_DSN,
    environment:       import.meta.env.MODE,
    tracesSampleRate:  0.2,
    integrations:      [Sentry.browserTracingIntegration()],
    // Note: for full native iOS crash reporting add @sentry/capacitor
  });
}

const LEGAL_ROUTES = {
  '/privacy':            PrivacyPolicy,
  '/terms':              TermsOfService,
  '/health-disclaimer':  HealthDisclaimer,
  '/health-data-notice': HealthDataNotice,
  '/washington-privacy': WashingtonPrivacy,
  '/california-privacy': CaliforniaPrivacy,
  '/support':            SupportPage,
};

const LegalPage = LEGAL_ROUTES[window.location.pathname];
const Root = LegalPage || App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{padding:40,color:'#fff',fontFamily:'sans-serif'}}>Something went wrong. Please reload the app.</div>}>
      <Root />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
