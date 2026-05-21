import React, { useEffect, lazy, Suspense } from 'react';
import { LandingPage } from './landing.jsx';
import { PrivacyPolicy, TermsOfService, HealthDisclaimer, HealthDataNotice,
  WashingtonPrivacy, CaliforniaPrivacy, SupportPage } from './legal.jsx';
import { AboutPage } from './about.jsx';

const NativeApp = lazy(() => import('./NativeApp.jsx'));
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;

function WebApp() {
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

  const path = window.location.pathname;
  if (path === '/privacy')            return <PrivacyPolicy />;
  if (path === '/terms')              return <TermsOfService />;
  if (path === '/health-disclaimer')  return <HealthDisclaimer />;
  if (path === '/health-data-notice') return <HealthDataNotice />;
  if (path === '/washington-privacy') return <WashingtonPrivacy />;
  if (path === '/california-privacy') return <CaliforniaPrivacy />;
  if (path === '/support')            return <SupportPage />;
  if (path === '/about')              return <AboutPage />;
  return <LandingPage />;
}

// Web (coach-macro.com) shows the marketing site.
// Native Capacitor (iOS/Android) lazy-loads the full app.
export default function App() {
  if (isNative) {
    return (
      <Suspense fallback={<div style={{background:'#000',height:'100vh'}}/>}>
        <NativeApp />
      </Suspense>
    );
  }
  return <WebApp />;
}
