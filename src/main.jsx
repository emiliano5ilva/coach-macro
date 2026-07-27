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

const _isDev = import.meta.env.MODE !== 'production';

window.__reactMounted=true;
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({error, componentStack, resetError}) => (
        <div style={{minHeight:'100vh',background:'#050810',color:'#f5f5f0',fontFamily:'sans-serif',padding:24,boxSizing:'border-box',overflowY:'auto'}}>
          {_isDev ? (
            <>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.14em',color:'#FF3B30',marginBottom:10}}>ROOT CRASH — escaped all inner ErrorBoundaries</div>
              <div style={{fontSize:14,fontWeight:700,color:'#f5f5f0',marginBottom:8,wordBreak:'break-all'}}>{error?.message||'Unknown error'}</div>
              <div style={{fontSize:10,color:'rgba(245,245,240,0.55)',whiteSpace:'pre-wrap',wordBreak:'break-all',marginBottom:16}}>{String(error?.stack||'').slice(0,800)}</div>
              {componentStack&&<div style={{fontSize:10,color:'rgba(245,245,240,0.35)',whiteSpace:'pre-wrap',wordBreak:'break-all',marginBottom:16}}>Component stack:{componentStack.slice(0,600)}</div>}
              <button onClick={resetError} style={{padding:'8px 20px',background:'#FF3B30',border:'none',borderRadius:20,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Retry</button>
            </>
          ) : (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontSize:15}}>Something went wrong. Please restart the app.</div>
          )}
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
