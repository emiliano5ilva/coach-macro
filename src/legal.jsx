import { useState } from "react";

// ─── SHARED DESIGN TOKENS ────────────────────────────────────────────────────
const LEGAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; color: #fff; }
  .legal-wrap { max-width: 800px; margin: 0 auto; padding: 80px 24px; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.8; color: #fff; }
  .legal-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; margin-bottom: 56px; cursor: pointer; }
  .legal-logo-text { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; }
  .legal-logo-text span { color: #e53935; }
  .legal-tag { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px; }
  .legal-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 52px; line-height: 1; text-transform: uppercase; margin-bottom: 8px; }
  .legal-updated { font-family: 'DM Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 56px; }
  .legal-section { margin-bottom: 48px; }
  .legal-h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: 0.06em; color: #fff; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
  .legal-p { color: rgba(255,255,255,0.8); margin-bottom: 14px; }
  .legal-ul { color: rgba(255,255,255,0.8); padding-left: 24px; margin-bottom: 14px; }
  .legal-ul li { margin-bottom: 8px; }
  .legal-highlight { background: rgba(229,57,53,0.08); border-left: 3px solid #e53935; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
  .legal-highlight p { color: rgba(255,255,255,0.9); margin: 0; }
  .legal-footer { margin-top: 72px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); }
  .legal-footer-title { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 16px; }
  .legal-footer-links { display: flex; flex-wrap: wrap; gap: 8px 0; }
  .legal-footer-link { font-family: 'DM Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.4); text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; transition: color 0.2s; }
  .legal-footer-link:hover { color: #fff; }
  .legal-footer-sep { font-family: 'DM Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.2); padding: 0 10px; }
  .legal-email { color: #e53935; text-decoration: none; }
  .legal-email:hover { text-decoration: underline; }
  .legal-warning { background: rgba(229,57,53,0.06); border: 1px solid rgba(229,57,53,0.2); border-radius: 12px; padding: 24px; margin-bottom: 32px; }
  .legal-warning-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 18px; text-transform: uppercase; color: #e53935; margin-bottom: 8px; letter-spacing: 0.06em; }
`;

const LEGAL_LINKS = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Health Disclaimer", path: "/health-disclaimer" },
  { label: "Health Data Notice", path: "/health-data-notice" },
  { label: "Washington Privacy", path: "/washington-privacy" },
  { label: "California Privacy", path: "/california-privacy" },
  { label: "Support", path: "/support" },
];

function LegalFooter({ currentPath }) {
  return (
    <div className="legal-footer">
      <div className="legal-footer-title">Legal Pages</div>
      <div className="legal-footer-links">
        {LEGAL_LINKS.map((l, i) => (
          <span key={l.path} style={{ display: "flex", alignItems: "center" }}>
            <button
              className="legal-footer-link"
              onClick={() => window.location.href = l.path}
              style={{ color: currentPath === l.path ? "rgba(255,255,255,0.6)" : undefined, textDecoration: currentPath === l.path ? "underline" : undefined }}
            >
              {l.label}
            </button>
            {i < LEGAL_LINKS.length - 1 && <span className="legal-footer-sep">·</span>}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 24, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
        © 2026 Coach Macro LLC · All rights reserved
      </div>
    </div>
  );
}

function LegalLogo() {
  return (
    <div className="legal-logo" onClick={() => window.location.href = "/"}>
      <div className="legal-logo-text">Coach<span>Macro</span></div>
    </div>
  );
}

// ─── PRIVACY POLICY ──────────────────────────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">Legal</div>
        <h1 className="legal-title">Privacy Policy</h1>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Information We Collect</h2>
          <p className="legal-p">We collect the following categories of information when you use Coach Macro:</p>
          <ul className="legal-ul">
            <li><strong>Account information:</strong> name, email address, password</li>
            <li><strong>Profile data:</strong> age, height, weight, body composition, fitness goals, dietary preferences</li>
            <li><strong>Health and fitness data:</strong> food logs, workout history, macro targets, body measurements</li>
            <li><strong>Usage data:</strong> app interactions, features used, session duration</li>
            <li><strong>Device information:</strong> device type, operating system, browser type</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. How We Use Your Information</h2>
          <ul className="legal-ul">
            <li>To provide and personalize the Coach Macro service</li>
            <li>To calculate your nutritional targets and workout recommendations</li>
            <li>To sync with connected fitness devices and apps (Strava, Apple Health, Garmin)</li>
            <li>To send you account-related emails and service updates</li>
            <li>To improve our AI recommendations over time</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>We do NOT sell your personal information to third parties.</strong></p>
          </div>
          <div className="legal-highlight">
            <p><strong>We do NOT use your data for advertising purposes.</strong></p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. Data Storage and Security</h2>
          <ul className="legal-ul">
            <li>Data stored securely using Supabase infrastructure</li>
            <li>Encryption in transit (TLS) and at rest</li>
            <li>We retain your data for as long as your account is active</li>
            <li>You can request deletion of your data at any time</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Third Party Services</h2>
          <p className="legal-p">Coach Macro uses the following third-party services to operate:</p>
          <ul className="legal-ul">
            <li><strong>Supabase</strong> (database and authentication) — stores all user data</li>
            <li><strong>Anthropic Claude API</strong> (AI features) — processes prompts containing nutrition and training context. We do not send personally identifiable information to Anthropic beyond what is necessary for AI feature functionality.</li>
            <li><strong>RevenueCat</strong> (subscription management) — manages in-app purchases and subscription status</li>
            <li><strong>Paddle</strong> (web payment processing) — processes web subscriptions</li>
            <li><strong>Stripe</strong> (payment processing) — legacy web payments</li>
            <li><strong>Resend</strong> (email delivery) — sends transactional emails</li>
            <li><strong>Apple Health</strong> (optional integration) — reads sleep, heart rate, HRV, and steps when user grants permission</li>
            <li><strong>ExerciseDB via RapidAPI</strong> — provides exercise demonstration data</li>
            <li><strong>Open Food Facts</strong> (food database) — open source food nutrition data</li>
            <li><strong>USDA FoodData Central</strong> — US government food nutrition database</li>
            <li><strong>Google Sign-In</strong> — authentication option</li>
            <li><strong>Sign in with Apple</strong> — authentication option</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. Artificial Intelligence Features</h2>
          <p className="legal-p">Coach Macro uses the Anthropic Claude API to power several features including:</p>
          <ul className="legal-ul">
            <li>Personalized nutrition suggestions</li>
            <li>Restaurant meal recommendations</li>
            <li>Workout adaptation (Adapt Now)</li>
            <li>Morning Brief coaching messages</li>
            <li>Meal planning and prep suggestions</li>
          </ul>
          <p className="legal-p">When you use AI features, relevant context about your fitness goals, current macros, and training schedule may be sent to Anthropic's API to generate personalized responses. We do not send your name, email, or other directly identifying information in AI prompts.</p>
          <p className="legal-p">You can disable AI features in <strong>Settings → Preferences → AI Features</strong>. Disabling AI features will not affect core nutrition tracking or program access.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Social Sign In</h2>
          <p className="legal-p">If you choose to sign in with Google or Apple:</p>
          <p className="legal-p"><strong>Google Sign In:</strong> We receive your name and email address from Google. We do not receive your Google password or access to other Google services.</p>
          <p className="legal-p"><strong>Sign In with Apple:</strong> We receive your name and either your real email or an Apple relay email address. Apple Sign In is privacy-preserving — Apple does not share additional data with us.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">7. Local Device Storage</h2>
          <p className="legal-p">Coach Macro stores certain data locally on your device to:</p>
          <ul className="legal-ul">
            <li>Enable offline functionality in the gym</li>
            <li>Cache your workout and nutrition data for faster loading</li>
            <li>Store your app preferences and settings</li>
          </ul>
          <p className="legal-p">Local data is encrypted by your device's security system and is deleted when you uninstall the app or clear app data.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">8. Calendar Access (Optional)</h2>
          <p className="legal-p">When you connect your calendar, Coach Macro reads the following to adapt training around your schedule:</p>
          <ul className="legal-ul">
            <li>Event titles (to detect travel, deadlines, and free time blocks)</li>
            <li>Event start and end times</li>
            <li>Event dates</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>We do NOT read:</strong> event descriptions or notes, attendee information, location details, or any event content beyond title and time.</p>
          </div>
          <p className="legal-p">Calendar data is processed on-device. Event titles are never sent to our servers or to third-party services — all analysis runs locally on your device.</p>
          <p className="legal-p">Coach Macro will never write to your calendar without your explicit permission. You can disconnect calendar access at any time in <strong>Settings → Calendar Integration</strong>.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">9. Your Rights</h2>
          <ul className="legal-ul">
            <li>Access your data at any time through the app</li>
            <li>Export your data by contacting support</li>
            <li>Delete your account and all associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">10. Account Deletion</h2>
          <p className="legal-p">You can delete your account at any time:</p>
          <ol className="legal-ul" style={{listStyleType:"decimal"}}>
            <li>Go to <strong>Settings → Account → Delete Account</strong></li>
            <li>Confirm deletion</li>
          </ol>
          <p className="legal-p" style={{marginTop:14}}>Upon deletion:</p>
          <ul className="legal-ul">
            <li>All personal data deleted within 30 days</li>
            <li>Health and fitness data deleted immediately</li>
            <li>Subscription cancelled (no refund for remaining subscription period)</li>
            <li>Anonymous aggregate data may be retained for analytics</li>
          </ul>
          <p className="legal-p">For <strong>Sign in with Apple</strong> users: deleting your account also revokes Coach Macro's access to your Apple ID.</p>
          <p className="legal-p">To request manual deletion: <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">11. Contact</h2>
          <p className="legal-p">For privacy-related questions or requests, contact us at: <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></p>
        </div>

        <LegalFooter currentPath="/privacy" />
      </div>
    </div>
  );
}

// ─── WASHINGTON MY HEALTH MY DATA ACT ────────────────────────────────────────
export function WashingtonPrivacy() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">State Privacy Notice</div>
        <h1 className="legal-title" style={{ fontSize: 38 }}>Washington My Health MY Data Act</h1>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Introduction</h2>
          <p className="legal-p">Coach Macro LLC is committed to compliance with the Washington My Health MY Data Act (MHMDA), which provides Washington state residents with enhanced protections for their consumer health data.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. What is Consumer Health Data</h2>
          <p className="legal-p">Under the MHMDA, consumer health data includes information that identifies your physical or mental health condition. Coach Macro collects the following consumer health data:</p>
          <ul className="legal-ul">
            <li>Body weight, height, and body composition data</li>
            <li>Dietary intake and nutrition information</li>
            <li>Physical activity and exercise data</li>
            <li>Fitness goals and health objectives</li>
            <li>Menstrual cycle data (if provided by female users)</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. How We Use Your Health Data</h2>
          <ul className="legal-ul">
            <li>To calculate personalized nutrition targets</li>
            <li>To generate workout recommendations</li>
            <li>To track fitness progress over time</li>
            <li>To provide AI-powered meal and exercise suggestions</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>We do NOT sell your consumer health data.</strong></p>
          </div>
          <div className="legal-highlight">
            <p><strong>We do NOT share your consumer health data with third parties for advertising.</strong></p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Your Rights Under MHMDA</h2>
          <ul className="legal-ul">
            <li>Right to access your consumer health data</li>
            <li>Right to withdraw consent for collection</li>
            <li>Right to deletion of your consumer health data</li>
            <li>Right to receive a list of third parties with whom we share your data</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. How to Exercise Your Rights</h2>
          <p className="legal-p">Contact us at: <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></p>
          <p className="legal-p">We will respond to all requests within 45 days.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Data Retention</h2>
          <p className="legal-p">We retain consumer health data for as long as your account remains active. Upon account deletion we permanently delete all consumer health data within 30 days.</p>
        </div>

        <LegalFooter currentPath="/washington-privacy" />
      </div>
    </div>
  );
}

// ─── CALIFORNIA PRIVACY NOTICE ────────────────────────────────────────────────
export function CaliforniaPrivacy() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">State Privacy Notice</div>
        <h1 className="legal-title" style={{ fontSize: 42 }}>California Privacy Notice</h1>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>CCPA / CPRA</div>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Introduction</h2>
          <p className="legal-p">This notice applies to California residents and is provided pursuant to the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA).</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. Categories of Personal Information We Collect</h2>
          <ul className="legal-ul">
            <li><strong>Identifiers:</strong> name, email address, user ID</li>
            <li><strong>Personal information:</strong> age, physical characteristics (height, weight)</li>
            <li><strong>Health and fitness data:</strong> food logs, workout history, body composition</li>
            <li><strong>Commercial information:</strong> subscription status, payment history</li>
            <li><strong>Internet activity:</strong> app usage, features accessed</li>
            <li><strong>Inferences:</strong> fitness recommendations, nutritional targets</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. How We Use Personal Information</h2>
          <ul className="legal-ul">
            <li>Providing and improving our services</li>
            <li>Personalizing your experience</li>
            <li>Processing payments</li>
            <li>Sending service communications</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>We do NOT sell personal information.</strong></p>
          </div>
          <div className="legal-highlight">
            <p><strong>We do NOT share personal information for cross-context behavioral advertising.</strong></p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Your California Privacy Rights</h2>
          <ul className="legal-ul">
            <li><strong>Right to Know:</strong> request disclosure of personal information collected</li>
            <li><strong>Right to Delete:</strong> request deletion of your personal information</li>
            <li><strong>Right to Correct:</strong> request correction of inaccurate information</li>
            <li><strong>Right to Opt-Out:</strong> opt out of sale or sharing (we do not sell data)</li>
            <li><strong>Right to Non-Discrimination:</strong> we will not discriminate for exercising rights</li>
            <li><strong>Right to Limit:</strong> limit use of sensitive personal information</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. Sensitive Personal Information</h2>
          <p className="legal-p">We collect the following sensitive personal information:</p>
          <ul className="legal-ul">
            <li>Health and fitness data</li>
            <li>Precise body composition data</li>
          </ul>
          <p className="legal-p">We use this data solely to provide the Coach Macro service.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Contact for Privacy Requests</h2>
          <p className="legal-p">Email: <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></p>
          <p className="legal-p">We respond to all verified requests within 45 days.</p>
        </div>

        <LegalFooter currentPath="/california-privacy" />
      </div>
    </div>
  );
}

// ─── TERMS OF SERVICE ────────────────────────────────────────────────────────
export function TermsOfService() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">Legal</div>
        <h1 className="legal-title">Terms of Service</h1>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Acceptance of Terms</h2>
          <p className="legal-p">By using Coach Macro you agree to these Terms of Service. If you do not agree, do not use the service.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. Description of Service</h2>
          <p className="legal-p">Coach Macro is an AI-powered fitness and nutrition application that provides personalized macro targets, workout recommendations, and related health guidance.</p>
          <div className="legal-warning">
            <div className="legal-warning-title">Not Medical Advice</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>Coach Macro is NOT a medical service and does not provide medical advice. See our <a className="legal-email" href="/health-disclaimer">Health Disclaimer</a> for full details.</p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. Eligibility</h2>
          <p className="legal-p">You must be at least 18 years old to use Coach Macro. By using the service you represent that you are 18 or older.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. User Accounts</h2>
          <ul className="legal-ul">
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must provide accurate information</li>
            <li>You are responsible for all activity under your account</li>
            <li>Notify us immediately of any unauthorized access at <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. Artificial Intelligence</h2>
          <p className="legal-p">Coach Macro uses AI to provide personalized recommendations. AI-generated content is for informational purposes only and does not constitute medical, nutritional, or fitness professional advice.</p>
          <p className="legal-p">AI recommendations may occasionally be inaccurate. Always use your judgment and consult qualified professionals for medical or clinical guidance.</p>
          <p className="legal-p">You can report inaccurate AI responses using the flag button (🚩) on any AI-generated content.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Subscription and Cancellation</h2>
          <p className="legal-p"><strong>Free Trial:</strong> New users and referral recipients may receive a free trial period. No charge occurs during the trial. You may cancel before the trial ends without being charged.</p>
          <ul className="legal-ul">
            <li>Coach Macro offers free and paid subscription tiers</li>
            <li>Paid subscriptions are billed monthly or annually</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
            <li>Prices may change with 30 days notice</li>
          </ul>
          <p className="legal-p"><strong>Cancellation:</strong> You may cancel at any time through:</p>
          <ul className="legal-ul">
            <li><strong>iOS:</strong> Settings → Apple ID → Subscriptions</li>
            <li><strong>Web:</strong> coach-macro.com/account → Manage Subscription</li>
            <li><strong>Email:</strong> <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></li>
          </ul>
          <p className="legal-p">Cancellation takes effect at the end of the current billing period. No partial refunds for unused subscription time unless required by applicable law.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">7. Acceptable Use</h2>
          <p className="legal-p">You agree not to:</p>
          <ul className="legal-ul">
            <li>Use the service for any unlawful purpose</li>
            <li>Share your account with others</li>
            <li>Attempt to reverse engineer the application</li>
            <li>Submit false or misleading health information</li>
            <li>Use the service to harm others</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">8. Health Disclaimer</h2>
          <p className="legal-p">Coach Macro provides general fitness and nutrition guidance only. Always consult a qualified healthcare provider before starting any diet or exercise program. See our full <a className="legal-email" href="/health-disclaimer">Health Disclaimer</a>.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">9. Intellectual Property</h2>
          <p className="legal-p">All content, features, and functionality of Coach Macro are owned by Coach Macro LLC and protected by copyright law.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">10. Limitation of Liability</h2>
          <p className="legal-p">Coach Macro LLC is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">11. Termination</h2>
          <p className="legal-p">We may terminate your account for violation of these terms. You may cancel your account at any time through the app settings.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">12. Governing Law</h2>
          <p className="legal-p">These terms are governed by the laws of the State of Texas.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">13. Contact</h2>
          <p className="legal-p">Email: <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></p>
        </div>

        <LegalFooter currentPath="/terms" />
      </div>
    </div>
  );
}

// ─── HEALTH DISCLAIMER ───────────────────────────────────────────────────────
export function HealthDisclaimer() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">Legal</div>
        <h1 className="legal-title">Health Disclaimer</h1>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-warning" style={{ marginBottom: 48 }}>
          <div className="legal-warning-title">Important — Please Read Carefully</div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7 }}>Coach Macro does NOT provide medical advice, diagnosis, or treatment. Nothing in the Coach Macro application should be construed as medical advice.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Not Medical Advice</h2>
          <p className="legal-p">Coach Macro is a fitness and nutrition tracking application. The information, recommendations, and content provided by Coach Macro — including AI-generated nutrition targets, workout recommendations, and health guidance — are for general informational and educational purposes only.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. Consult Your Healthcare Provider</h2>
          <p className="legal-p">Before starting any new diet, nutrition plan, or exercise program — especially if you have any of the following — you should consult with a qualified healthcare professional:</p>
          <ul className="legal-ul">
            <li>Pre-existing medical conditions</li>
            <li>Are pregnant or breastfeeding</li>
            <li>Have a history of eating disorders</li>
            <li>Take prescription medications</li>
            <li>Have been advised by a doctor to follow specific dietary or activity restrictions</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. Nutrition Information</h2>
          <p className="legal-p">Macro and calorie targets provided by Coach Macro are estimates based on general formulas and information you provide. Individual metabolic needs vary significantly. These are starting points, not prescriptions.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Exercise Information</h2>
          <p className="legal-p">Workout recommendations provided by Coach Macro are general fitness guidance. Improper exercise technique can cause injury. If you are new to exercise, consider working with a certified personal trainer to learn proper form.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. AI-Generated Content</h2>
          <p className="legal-p">Coach Macro uses artificial intelligence to generate personalized recommendations. While we strive for accuracy, AI-generated content may occasionally contain errors. Always use your judgment and consult professionals when in doubt.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Assumption of Risk</h2>
          <p className="legal-p">By using Coach Macro you acknowledge that fitness and nutrition activities carry inherent risks. You assume full responsibility for your participation in any diet or exercise program.</p>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">7. Emergency Situations</h2>
          <div className="legal-warning">
            <div className="legal-warning-title">Emergency Notice</div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15 }}>Coach Macro is not designed for emergency use. If you are experiencing a medical emergency, call <strong>911</strong> immediately.</p>
          </div>
        </div>

        <LegalFooter currentPath="/health-disclaimer" />
      </div>
    </div>
  );
}

// ─── HEALTH DATA NOTICE ──────────────────────────────────────────────────────
export function HealthDataNotice() {
  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">Legal</div>
        <h1 className="legal-title">Health Data Notice</h1>
        <div className="legal-updated">Last Updated: May 13, 2026</div>

        <div className="legal-section">
          <h2 className="legal-h2">1. Types of Health Data We Collect</h2>
          <p className="legal-p">Coach Macro collects and processes the following health and fitness data:</p>
          <ul className="legal-ul">
            <li><strong>Body metrics:</strong> height, weight, body fat percentage, body measurements</li>
            <li><strong>Nutritional data:</strong> food intake, macro and calorie consumption, meal logs</li>
            <li><strong>Physical activity:</strong> workout sessions, exercise types, sets, reps, weights lifted</li>
            <li><strong>Biometric data:</strong> resting heart rate, sleep data (if connected to wearables)</li>
            <li><strong>Reproductive health data:</strong> menstrual cycle information (optional, female users only)</li>
            <li><strong>Health goals:</strong> weight loss or gain targets, fitness objectives</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">2. How We Process Health Data</h2>
          <p className="legal-p">Your health data is used exclusively to:</p>
          <ul className="legal-ul">
            <li>Calculate personalized daily macro and calorie targets</li>
            <li>Generate workout recommendations matched to your fitness level</li>
            <li>Track your progress over time</li>
            <li>Provide AI-powered food and exercise suggestions</li>
            <li>Adjust recommendations based on your training schedule</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">3. Apple Health Integration (Optional)</h2>
          <p className="legal-p">When you connect Apple Health, Coach Macro reads the following data types with your explicit permission:</p>
          <ul className="legal-ul">
            <li>Sleep analysis (hours and quality)</li>
            <li>Resting heart rate</li>
            <li>Heart rate variability (HRV)</li>
            <li>Step count</li>
            <li>Active energy burned</li>
            <li>Body weight (if available)</li>
          </ul>
          <p className="legal-p">This data is used exclusively to:</p>
          <ul className="legal-ul">
            <li>Calculate your daily Coach Macro Score</li>
            <li>Adjust today's workout intensity based on your recovery</li>
            <li>Modify calorie targets based on activity</li>
            <li>Generate personalized Morning Brief messages</li>
          </ul>
          <p className="legal-p">Coach Macro writes the following to Apple Health with your permission:</p>
          <ul className="legal-ul">
            <li>Completed workout sessions</li>
            <li>Active calories from logged workouts</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>Apple Health data is never sent to third-party services or used for advertising.</strong> You can revoke Apple Health access at any time in <strong>iOS Settings → Privacy → Health → Coach Macro</strong>.</p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">4. Health Data Sharing</h2>
          <p className="legal-p">We share your health data only with:</p>
          <ul className="legal-ul">
            <li><strong>Supabase:</strong> our secure database provider for storage</li>
            <li><strong>Anthropic:</strong> our AI provider processes prompts that may include health context</li>
            <li><strong>Fitness integrations</strong> you explicitly connect (Apple Health)</li>
          </ul>
          <div className="legal-highlight">
            <p><strong>We never sell health data. We never share health data with advertisers.</strong></p>
          </div>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">5. Sensitive Health Data</h2>
          <p className="legal-p">We treat reproductive health data (menstrual cycle information) as sensitive and apply additional protections:</p>
          <ul className="legal-ul">
            <li>This data is never included in AI prompts sent to third parties</li>
            <li>This data is stored separately with enhanced encryption</li>
            <li>You can delete this data at any time independently of your account</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">6. Data Retention and Deletion</h2>
          <ul className="legal-ul">
            <li><strong>Active account:</strong> health data retained for service delivery</li>
            <li><strong>Account deletion:</strong> all health data permanently deleted within 30 days</li>
            <li><strong>Specific data deletion:</strong> contact <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a></li>
          </ul>
        </div>

        <div className="legal-section">
          <h2 className="legal-h2">7. Your Health Data Rights</h2>
          <ul className="legal-ul">
            <li>View all your health data in the app</li>
            <li>Export your health data by contacting support</li>
            <li>Delete specific health data categories</li>
            <li>Delete all health data by deleting your account</li>
          </ul>
        </div>

        <LegalFooter currentPath="/health-data-notice" />
      </div>
    </div>
  );
}

// ─── SUPPORT PAGE ────────────────────────────────────────────────────────────
export function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "Technical Issue", subject: "", description: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const CATEGORIES = ["Account & Billing", "Technical Issue", "Feature Request", "Privacy & Data", "Other"];

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim()) return;
    if (form.description.trim().length < 20) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none",
    fontFamily: "'Inter', sans-serif", transition: "border-color .2s", boxSizing: "border-box",
  };

  const FAQS = [
    { q: "How do I cancel my subscription?", a: "Go to Settings → Subscription → Cancel Plan." },
    { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account." },
    { q: "I forgot my password", a: "Click \"Forgot Password\" on the login screen to receive a reset link." },
    { q: "How do I change my email?", a: "Contact support with your request and we'll update it for you." },
  ];

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{LEGAL_CSS}{`
        .support-label { display: block; font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
        .support-field { margin-bottom: 20px; }
        .support-input:focus { border-color: #e53935 !important; }
        .support-btn { width: 100%; padding: 16px; background: #e53935; color: #fff; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; border: none; border-radius: 12px; cursor: pointer; transition: opacity .2s; margin-top: 8px; }
        .support-btn:hover { opacity: 0.9; }
        .support-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .faq-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
        .faq-q { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; color: #fff; margin-bottom: 8px; }
        .faq-a { font-family: 'Inter', sans-serif; font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
      `}</style>
      <div className="legal-wrap">
        <LegalLogo />
        <div className="legal-tag">Help</div>
        <h1 className="legal-title">Support Center</h1>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 56 }}>
          We typically respond within 24 hours
        </div>

        {/* Ticket Form */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px", marginBottom: 56 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 28 }}>Submit a Ticket</div>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, textTransform: "uppercase", marginBottom: 12 }}>Ticket Submitted</div>
              <div style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                We'll respond to <strong style={{ color: "#fff" }}>{form.email}</strong> within 24 hours.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <div className="support-field">
                  <label className="support-label">Full Name *</label>
                  <input className="support-input" style={inputStyle} value={form.name} onChange={e => setField("name", e.target.value)} required placeholder="Your name" />
                </div>
                <div className="support-field">
                  <label className="support-label">Email Address *</label>
                  <input className="support-input" style={inputStyle} type="email" value={form.email} onChange={e => setField("email", e.target.value)} required placeholder="your@email.com" />
                </div>
              </div>

              <div className="support-field">
                <label className="support-label">Category</label>
                <select className="support-input" style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={form.category} onChange={e => setField("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#111" }}>{c}</option>)}
                </select>
              </div>

              <div className="support-field">
                <label className="support-label">Subject *</label>
                <input className="support-input" style={inputStyle} value={form.subject} onChange={e => setField("subject", e.target.value)} required placeholder="Brief description of your issue" />
              </div>

              <div className="support-field">
                <label className="support-label">Description * (minimum 20 characters)</label>
                <textarea className="support-input" style={{ ...inputStyle, minHeight: 140, resize: "vertical" }} value={form.description} onChange={e => setField("description", e.target.value)} required minLength={20} placeholder="Please describe your issue in detail..." />
              </div>

              {status === "error" && (
                <div style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  Something went wrong. Email us directly at <a className="legal-email" href="mailto:support@coach-macro.com">support@coach-macro.com</a>
                </div>
              )}

              <button type="submit" className="support-btn" disabled={status === "loading"}>
                {status === "loading" ? "Submitting..." : "Submit Ticket →"}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>Common Questions</div>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>

        <LegalFooter currentPath="/support" />
      </div>
    </div>
  );
}
