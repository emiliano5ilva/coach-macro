import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { PrivacyPolicy, TermsOfService, HealthDisclaimer, HealthDataNotice,
  WashingtonPrivacy, CaliforniaPrivacy, SupportPage } from './legal.jsx';

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
  <React.StrictMode><Root /></React.StrictMode>
);
