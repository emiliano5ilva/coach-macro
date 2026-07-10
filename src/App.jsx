import React, { useEffect, lazy, Suspense } from 'react';
import { LandingPage } from './landing.jsx';
import { PrivacyPolicy, TermsOfService, HealthDisclaimer, HealthDataNotice,
  WashingtonPrivacy, CaliforniaPrivacy, TexasPrivacy, SupportPage } from './legal.jsx';
import AboutPage from './pages/AboutPage.jsx';
import FAQPage from './pages/FAQPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';

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

  // Distinct, descriptive page titles per route (WCAG 2.4.2 Page Titled).
  useEffect(() => {
    const titles = {
      '/':                   'Coach Macro — Your food and your training, finally connected',
      '/features':           'Features — Coach Macro',
      '/about':              'About — Coach Macro',
      '/faq':                'FAQ — Coach Macro',
      '/privacy':            'Privacy Policy — Coach Macro',
      '/terms':              'Terms of Service — Coach Macro',
      '/support':            'Support — Coach Macro',
      '/health-disclaimer':  'Health Disclaimer — Coach Macro',
      '/health-data-notice': 'Health Data Notice — Coach Macro',
      '/washington-privacy': 'Washington Privacy Notice — Coach Macro',
      '/california-privacy': 'California Privacy Notice — Coach Macro',
      '/texas-privacy':      'Texas Privacy Notice — Coach Macro',
    };
    document.title = titles[path] || 'Coach Macro';
  }, [path]);

  if (path === '/privacy')            return <PrivacyPolicy />;
  if (path === '/terms')              return <TermsOfService />;
  if (path === '/health-disclaimer')  return <HealthDisclaimer />;
  if (path === '/health-data-notice') return <HealthDataNotice />;
  if (path === '/washington-privacy') return <WashingtonPrivacy />;
  if (path === '/california-privacy') return <CaliforniaPrivacy />;
  if (path === '/texas-privacy')      return <TexasPrivacy />;
  if (path === '/support')            return <SupportPage />;
  if (path === '/about')              return <AboutPage />;
  if (path === '/faq')                return <FAQPage />;
  if (path === '/features')           return <FeaturesPage />;
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
