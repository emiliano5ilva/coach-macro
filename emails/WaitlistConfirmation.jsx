import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ─── HOSTED ASSETS ───────────────────────────────────────────────────────────
// Claude Code: copy cm-logo-email.png to public/ folder in the project root.
// After deploying, this URL resolves to the logo automatically.
const LOGO_URL = 'https://coach-macro.com/cm-logo-email.png';

// ─── FONT STACKS ─────────────────────────────────────────────────────────────
const condensed = "'Barlow Condensed', 'Oswald', 'Arial Narrow', Impact, sans-serif";
const bodyFont  = "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const mono      = "'DM Mono', 'SF Mono', 'Roboto Mono', Menlo, Monaco, Consolas, 'Courier New', monospace";

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const navy      = '#0a0e1a';
const red       = '#e8341c';
const white     = '#f5f5f0';
const whiteDim  = 'rgba(245,245,240,0.65)';
const whiteFaint= 'rgba(245,245,240,0.40)';
const border    = 'rgba(245,245,240,0.08)';

export const WaitlistConfirmation = ({ firstName = '' }) => {
  const name = firstName ? `, ${firstName}` : '';

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        {/* Force dark backgrounds in Gmail — bgcolor on <td> is the key fix */}
        <style>{`
          body, .body-outer { background-color: #050810 !important; }
          .navy-bg          { background-color: #0a0e1a !important; }
        `}</style>
        <Font fontFamily="Barlow Condensed" fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B6xPjF8Z2c8.woff2', format: 'woff2' }}
          fontWeight={900} fontStyle="italic" />
        <Font fontFamily="Barlow" fallbackFontFamily="Helvetica"
          webFont={{ url: 'https://fonts.gstatic.com/s/barlow/v12/7cHpv4kjgoGqM7E_DMs5.woff2', format: 'woff2' }}
          fontWeight={400} fontStyle="normal" />
        <Font fontFamily="DM Mono" fallbackFontFamily="monospace"
          webFont={{ url: 'https://fonts.gstatic.com/s/dmmono/v10/aFTU7PB1QTsUX8KYth-orYZ-bIw.woff2', format: 'woff2' }}
          fontWeight={500} fontStyle="normal" />
      </Head>

      <Preview>Coach Macro launches soon. You&apos;ll be the first to know.</Preview>

      <Body className="body-outer" style={{ margin: 0, padding: 0, backgroundColor: '#050810' }}>

        {/* Outer wrapper — bgcolor on <td> is what Gmail actually respects */}
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor="#050810">
          <tbody><tr>
            <td align="center" bgcolor="#050810" style={{ backgroundColor: '#050810', padding: '24px 0' }}>

              {/* Email card */}
              <table role="presentation" width="600" cellPadding="0" cellSpacing="0" border={0}
                bgcolor="#0a0e1a" style={{ maxWidth: 600, backgroundColor: navy }}>
                <tbody>

                  {/* HEADER */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '28px 32px 24px', borderBottom: `1px solid ${border}` }}>
                      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                        <tbody><tr>
                          <td style={{ verticalAlign: 'middle', width: 40 }}>
                            <Img src={LOGO_URL} width="40" height="40" alt="Coach Macro"
                              style={{ display: 'block', borderRadius: 10 }} />
                          </td>
                          <td style={{ verticalAlign: 'middle', paddingLeft: 12 }}>
                            <Text style={{ fontFamily: condensed, fontStyle: 'italic', fontWeight: 900,
                              fontSize: 18, letterSpacing: '0.02em', color: white, margin: 0,
                              textTransform: 'uppercase', lineHeight: 1 }}>
                              COACH MACRO<span style={{ color: red, fontFamily: condensed }}>.</span>
                            </Text>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr>

                  {/* HERO */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '48px 32px 8px' }}>
                      <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em',
                        color: red, textTransform: 'uppercase', margin: '0 0 20px', fontWeight: 500 }}>
                        // WAITLIST CONFIRMED
                      </Text>
                      <Heading as="h1" style={{ fontFamily: condensed, fontStyle: 'italic', fontWeight: 900,
                        fontSize: 64, lineHeight: '0.92', letterSpacing: '-0.02em', color: red,
                        textTransform: 'uppercase', margin: '0 0 24px' }}>
                        You&apos;re in{name}<span style={{ color: white, fontFamily: condensed }}>.</span>
                      </Heading>
                      <Text style={{ fontFamily: bodyFont, fontSize: 16, lineHeight: '1.55',
                        color: whiteDim, margin: 0 }}>
                        Coach Macro launches soon. When it does, you&apos;ll be among the first to get access.
                      </Text>
                    </td>
                  </tr>

                  {/* COACH CARD */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '24px 32px 8px' }}>
                      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                        <tbody><tr>
                          <td bgcolor="#110806"
                            style={{ backgroundColor: 'rgba(232,52,28,0.06)',
                              borderLeft: `3px solid ${red}`, borderRadius: '0 12px 12px 0',
                              padding: '18px 20px' }}>
                            <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em',
                              color: red, textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 500 }}>
                              // COACH
                            </Text>
                            <Text style={{ fontFamily: bodyFont, fontSize: 14, fontStyle: 'italic',
                              lineHeight: '1.55', color: white, margin: 0 }}>
                              &quot;Most fitness apps make you choose. Food or training. We&apos;re building the one that does both — and adapts every day.&quot;
                            </Text>
                          </td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr>

                  {/* WHAT'S NEXT */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '24px 32px 16px' }}>
                      <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em',
                        color: red, textTransform: 'uppercase', margin: '0 0 24px', fontWeight: 500 }}>
                        // WHAT&apos;S NEXT
                      </Text>

                      {[
                        ['// 01', "We'll email you the moment access opens."],
                        ['// 02', 'Waitlist members get early Pro pricing.'],
                        ['// 03', 'Occasional build updates. No noise.'],
                      ].map(([label, text], i, arr) => (
                        <table key={label} role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}
                          style={{ borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none',
                            marginBottom: i < arr.length - 1 ? 14 : 0,
                            paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                          <tbody><tr><td>
                            <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em',
                              color: whiteFaint, margin: '0 0 6px', fontWeight: 500, textTransform: 'uppercase' }}>
                              {label}
                            </Text>
                            <Text style={{ fontFamily: bodyFont, fontSize: 14, lineHeight: '1.5', color: white, margin: 0 }}>
                              {text}
                            </Text>
                          </td></tr></tbody>
                        </table>
                      ))}
                    </td>
                  </tr>

                  {/* DIVIDER */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '16px 32px 0' }}>
                      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                        <tbody><tr><td style={{ borderTop: `1px solid ${border}`, height: 1 }} /></tr></tbody>
                      </table>
                    </td>
                  </tr>

                  {/* FOOTER */}
                  <tr>
                    <td bgcolor="#0a0e1a" className="navy-bg"
                      style={{ backgroundColor: navy, padding: '24px 32px 40px' }}>
                      <Text style={{ fontFamily: condensed, fontStyle: 'italic', fontWeight: 800,
                        fontSize: 14, letterSpacing: '0.02em', color: whiteDim,
                        textTransform: 'uppercase', margin: '0 0 14px', lineHeight: '1.35' }}>
                        The first unified athlete OS<span style={{ color: red, fontFamily: condensed }}>.</span>
                      </Text>
                      <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.08em',
                        color: whiteFaint, margin: '0 0 8px', lineHeight: '1.6' }}>
                        Coach Macro · coach-macro.com
                      </Text>
                      <Text style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.08em',
                        color: whiteFaint, margin: 0, lineHeight: '1.6' }}>
                        You&apos;re receiving this because you joined the waitlist at coach-macro.com.{' '}
                        <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}"
                          style={{ color: whiteDim, textDecoration: 'underline' }}>
                          Unsubscribe
                        </Link>
                      </Text>
                    </td>
                  </tr>

                </tbody>
              </table>
              {/* end card */}

            </td>
          </tr></tbody>
        </table>

      </Body>
    </Html>
  );
};

export default WaitlistConfirmation;
