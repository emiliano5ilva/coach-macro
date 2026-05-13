import React, { useEffect } from 'react';
import { LandingPage } from './landing.jsx';
import { PrivacyPolicy, TermsOfService, HealthDisclaimer, HealthDataNotice,
  WashingtonPrivacy, CaliforniaPrivacy, SupportPage } from './legal.jsx';

// coach-macro.com is a pure marketing site.
// The app lives in the native iOS/Android build — not here.
export default function App() {
  const path = window.location.pathname;

  // Capture referral invite params set by api/r.js redirect (?invited=true&code=...&token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('invited') === 'true') {
      try {
        const inv = {
          code:      params.get('code')  || '',
          token:     params.get('token') || '',
          freeWeeks: 2,
          savedAt:   Date.now(),
        };
        localStorage.setItem('coachMacroInvite', JSON.stringify(inv));
      } catch {}
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (path === '/privacy')            return <PrivacyPolicy />;
  if (path === '/terms')              return <TermsOfService />;
  if (path === '/health-disclaimer')  return <HealthDisclaimer />;
  if (path === '/health-data-notice') return <HealthDataNotice />;
  if (path === '/washington-privacy') return <WashingtonPrivacy />;
  if (path === '/california-privacy') return <CaliforniaPrivacy />;
  if (path === '/support')            return <SupportPage />;

  // /invite, /r/*, and everything else → landing page
  return <LandingPage />;
}
