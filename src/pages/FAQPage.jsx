import { useState } from 'react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --bg: #000000;
    --red: #E8341C;
    --red-glow: rgba(232,52,28,0.4);
    --red-border: rgba(232,52,28,0.18);
    --white: #FFFFFF;
    --white-dim: rgba(255,255,255,0.5);
    --white-faint: rgba(255,255,255,0.3);
    --white-border: rgba(255,255,255,0.06);
    --condensed: 'Barlow Condensed', sans-serif;
    --body: 'Inter', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  .faq-page * { box-sizing: border-box; margin: 0; padding: 0; }
  .faq-page { background: var(--bg); color: var(--white); font-family: var(--body); min-height: 100vh; -webkit-font-smoothing: antialiased; }

  /* NAV */
  .faq-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(0,0,0,0.85); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid var(--white-border); }
  .faq-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .faq-nav-logo-mark { width: 30px; height: 30px; border-radius: 7px; object-fit: cover; box-shadow: 0 0 18px rgba(232,52,28,0.45); }
  .faq-nav-logo-text { font-family: var(--condensed); font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); display: flex; gap: 4px; align-items: baseline; }
  .faq-nav-logo-coach { color: var(--white-dim); font-style: italic; font-weight: 400; }
  .faq-nav-links { display: flex; gap: 28px; align-items: center; }
  .faq-nav-link { color: var(--white-dim); font-size: 13px; font-weight: 500; text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; }
  .faq-nav-link:hover { color: var(--white); }
  .faq-nav-link.active { color: var(--white); }
  .faq-nav-cta { font-family: var(--condensed); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); background: transparent; border: 1px solid var(--red); padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.25s; text-decoration: none; }
  .faq-nav-cta:hover { background: var(--red); color: var(--white); box-shadow: 0 0 30px var(--red-glow); }

  /* PAGE HEADER */
  .faq-header { padding: 140px 48px 80px; max-width: 900px; margin: 0 auto; }
  .faq-eyebrow { font-family: var(--mono); font-size: 12px; color: var(--red); letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 20px; }
  .faq-headline { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(48px, 6vw, 80px); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 24px; }
  .faq-headline .period { color: var(--red); }
  .faq-sub { font-family: var(--mono); font-size: 13px; color: var(--white-faint); letter-spacing: 0.04em; }
  .faq-sub a { color: var(--red); text-decoration: none; }
  .faq-sub a:hover { text-decoration: underline; }

  /* CONTENT */
  .faq-content { max-width: 900px; margin: 0 auto; padding: 0 48px 120px; }

  /* GROUP */
  .faq-group { margin-bottom: 64px; }
  .faq-group-eyebrow { font-family: var(--mono); font-size: 11px; color: var(--red); letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 24px; }

  /* ACCORDION ITEM */
  .faq-item { border-top: 1px solid var(--white-border); transition: border-color 0.2s; }
  .faq-item:last-child { border-bottom: 1px solid var(--white-border); }
  .faq-item.open { border-top-color: rgba(232,52,28,0.3); }
  .faq-q { width: 100%; background: none; border: none; cursor: pointer; padding: 22px 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; text-align: left; }
  .faq-q-text { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; color: var(--white); text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.1; transition: color 0.2s; }
  .faq-item.open .faq-q-text { color: var(--white); }
  .faq-q-icon { font-family: var(--mono); font-size: 20px; color: var(--red); flex-shrink: 0; transition: transform 0.25s; line-height: 1; margin-top: 2px; }
  .faq-item.open .faq-q-icon { transform: rotate(45deg); }
  .faq-a-wrap { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
  .faq-item.open .faq-a-wrap { max-height: 400px; }
  .faq-a { padding: 0 40px 24px 0; border-left: 2px solid var(--red); padding-left: 20px; margin-left: 2px; }
  .faq-a-text { font-family: var(--condensed); font-weight: 400; font-size: 18px; line-height: 1.55; color: var(--white-dim); }

  /* FOOTER */
  .faq-footer { padding: 32px 48px; border-top: 1px solid rgba(232,52,28,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
  .faq-footer-copy { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.04em; }
  .faq-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .faq-footer-links a { font-size: 12px; color: var(--white-dim); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
  .faq-footer-links a:hover { color: var(--red); }

  @media (max-width: 768px) {
    .faq-nav { padding: 0 20px; }
    .faq-nav-links { display: none; }
    .faq-header { padding: 110px 24px 60px; }
    .faq-content { padding: 0 24px 80px; }
    .faq-q-text { font-size: 18px; }
    .faq-a-text { font-size: 16px; }
    .faq-footer { flex-direction: column; text-align: center; padding: 32px 24px; }
    .faq-footer-links { justify-content: center; }
  }
`;

const GROUPS = [
  {
    eyebrow: '// THE APP',
    items: [
      {
        q: 'What exactly does Coach Macro do?',
        a: 'Coach Macro is an AI-powered training and nutrition system that builds your program, adjusts your macros daily based on your workouts, and tells you exactly what to eat and when. It\'s not a tracker — it\'s a full coaching stack that adapts to you in real time.',
      },
      {
        q: 'Is it only for bodybuilders and lifters?',
        a: 'No. The system handles resistance training, endurance work, hybrid training, and Hyrox. If you train with intent and want your nutrition to match your output, Coach Macro works for you. Runners, cyclists, and hybrid athletes are some of our most active users.',
      },
      {
        q: 'What does "training day adjustment" actually mean?',
        a: 'On a training day, your carbohydrate and calorie targets increase to match your session volume and intensity. After you log a completed workout, your remaining macro budget updates in real time. Rest days run a reduced target automatically. You don\'t touch a single setting.',
      },
      {
        q: 'Can I connect my wearable or smartwatch?',
        a: 'Apple Health connects today. More wearable integrations are in active development. For now, the app uses manual session logging and its own METs-based energy model. Wearable sync will make the system even more precise when available.',
      },
    ],
  },
  {
    eyebrow: '// PRICING',
    items: [
      {
        q: 'Is there a free trial?',
        a: 'Yes. Every new account gets a 7-day free trial with full access to every feature — no credit card required. You get to see the full system before deciding anything.',
      },
      {
        q: 'How much does it cost?',
        a: 'Coach Macro is $49.99 per year ($4.17/month). Monthly is $12.99. The annual plan saves 68% vs monthly. Both plans include everything — no feature tiers, no add-ons.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Cancel from inside the app or through your App Store / Google Play subscription settings at any time. Your access continues through the end of your current billing period. No hoops, no dark patterns.',
      },
      {
        q: 'What happens when my trial ends?',
        a: 'You choose a plan or you stop. No automatic charge. If you continue, select monthly or annual. If not, your account moves to read-only — your data stays intact, you just can\'t log new entries.',
      },
    ],
  },
  {
    eyebrow: '// PRIVACY & DATA',
    items: [
      {
        q: 'Is my data private?',
        a: 'Your data is never sold. Never shared with advertisers or third parties. We use it only to run your personalized coaching model and improve the system. You can export or delete everything at any time from within the app.',
      },
      {
        q: 'What health data does Coach Macro collect?',
        a: 'We collect training logs, body weight, macro targets, and food entries you provide directly. If you connect Apple Health, we read activity data to calibrate your program. Nothing is shared outside the app.',
      },
      {
        q: 'Can I delete my account and all my data?',
        a: 'Yes. You can delete your account and all associated data from the app\'s settings at any time. Deletion is permanent and complete — we don\'t retain backups of deleted user data beyond standard database retention windows.',
      },
    ],
  },
  {
    eyebrow: '// LAUNCH',
    items: [
      {
        q: 'When does Coach Macro launch?',
        a: 'We\'re preparing for a public launch now. Everyone on the waitlist gets first access and an extended free trial before anyone else. Sign up at the bottom of the home page.',
      },
      {
        q: 'How do I get early access?',
        a: 'Join the waitlist on the home page. We\'re rolling out in waves — waitlist members get priority invites, an extended trial, and early pricing locked in.',
      },
      {
        q: 'Will there be an Android version?',
        a: 'Android is on the roadmap. We\'re launching iOS first to get the coaching model right. If Android is important to you, add your name to the waitlist — it helps us prioritize.',
      },
    ],
  },
];

function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div className={`faq-item${isOpen ? ' open' : ''}`}>
      <button className="faq-q" onClick={onToggle}>
        <span className="faq-q-text">{q}</span>
        <span className="faq-q-icon">+</span>
      </button>
      <div className="faq-a-wrap">
        <div className="faq-a">
          <p className="faq-a-text">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState(null);

  const toggle = (key) => setOpenKey(openKey === key ? null : key);

  return (
    <div className="faq-page">
      <style>{CSS}</style>

      <nav className="faq-nav">
        <a href="/" className="faq-nav-logo">
          <img src="/images/app-icon.png" alt="Coach Macro" className="faq-nav-logo-mark" />
          <span className="faq-nav-logo-text">
            <span className="faq-nav-logo-coach">Coach</span>
            <span>&nbsp;Macro</span>
          </span>
        </a>
        <div className="faq-nav-links">
          <a href="/#features" className="faq-nav-link">Features</a>
          <a href="/#how" className="faq-nav-link">How It Works</a>
          <a href="/about" className="faq-nav-link">About</a>
          <a href="/faq" className="faq-nav-link active">FAQ</a>
        </div>
        <a href="/#waitlist" className="faq-nav-cta">Join Waitlist</a>
      </nav>

      <header className="faq-header">
        <div className="faq-eyebrow">// FAQ</div>
        <h1 className="faq-headline">
          Frequently asked<br />questions<span className="period">.</span>
        </h1>
        <p className="faq-sub">
          Can't find what you're looking for?{' '}
          <a href="mailto:support@coach-macro.com">support@coach-macro.com</a>
        </p>
      </header>

      <main className="faq-content">
        {GROUPS.map((group) => (
          <div key={group.eyebrow} className="faq-group">
            <div className="faq-group-eyebrow">{group.eyebrow}</div>
            {group.items.map((item, i) => {
              const key = `${group.eyebrow}-${i}`;
              return (
                <AccordionItem
                  key={key}
                  q={item.q}
                  a={item.a}
                  isOpen={openKey === key}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </div>
        ))}
      </main>

      <footer className="faq-footer">
        <div className="faq-footer-copy">© 2026 Coach Macro LLC. All rights reserved.</div>
        <div className="faq-footer-links">
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/health-disclaimer">Health Disclaimer</a>
          <a href="/support">Support</a>
        </div>
      </footer>
    </div>
  );
}
