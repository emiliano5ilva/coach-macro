import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const WaitlistConfirmation = ({ firstName = '' }) => {
  const greeting = firstName ? `You're in, ${firstName}.` : `You're in.`;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <Font
          fontFamily="Barlow Condensed"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/barlowcondensed/v12/HTxwL3I-JCGChYJ8VI-L6OO_au7B6xPjF8Z2c8.woff2',
            format: 'woff2',
          }}
          fontWeight={900}
          fontStyle="italic"
        />
        <Font
          fontFamily="Barlow"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/barlow/v12/7cHpv4kjgoGqM7E_DMs5.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="DM Mono"
          fallbackFontFamily="monospace"
          webFont={{
            url: 'https://fonts.gstatic.com/s/dmmono/v10/aFTU7PB1QTsUX8KYth-orYZ-bIw.woff2',
            format: 'woff2',
          }}
          fontWeight={500}
          fontStyle="normal"
        />
      </Head>
      <Preview>Coach Macro launches soon. You&apos;ll be the first to know.</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* HEADER */}
          <Section style={header}>
            <Text style={wordmark}>
              COACH MACRO<span style={{ color: '#e8341c', fontStyle: 'italic', fontFamily: condensedStack }}>.</span>
            </Text>
          </Section>

          {/* HERO */}
          <Section style={hero}>
            <Text style={eyebrow}>// WAITLIST CONFIRMED</Text>
            <Heading as="h1" style={headline}>
              {greeting.split('.')[0]}
              <span style={{ color: '#e8341c', fontFamily: condensedStack, fontStyle: 'italic' }}>.</span>
            </Heading>
            <Text style={lead}>
              Coach Macro launches soon. When it does, you&apos;ll be among the first to get access.
            </Text>
          </Section>

          {/* COACH SPEAKS CARD */}
          <Section style={coachCardWrap}>
            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              width="100%"
              style={coachTable}
            >
              <tbody>
                <tr>
                  <td style={coachCard}>
                    <Text style={coachEyebrow}>// COACH</Text>
                    <Text style={coachQuote}>
                      &quot;Most fitness apps make you choose. Food or training. We&apos;re building the one that does both — and adapts every day.&quot;
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* WHAT'S NEXT */}
          <Section style={nextSection}>
            <Text style={sectionEyebrow}>// WHAT&apos;S NEXT</Text>

            <Section style={nextRow}>
              <Text style={nextLabel}>// 01</Text>
              <Text style={nextText}>
                We&apos;ll email you the moment access opens.
              </Text>
            </Section>

            <Section style={nextRow}>
              <Text style={nextLabel}>// 02</Text>
              <Text style={nextText}>
                Waitlist members get early Pro pricing.
              </Text>
            </Section>

            <Section style={nextRowLast}>
              <Text style={nextLabel}>// 03</Text>
              <Text style={nextText}>
                Occasional build updates. No noise.
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* FOOTER */}
          <Section style={footer}>
            <Text style={footerLead}>
              The first unified athlete OS<span style={{ color: '#e8341c', fontStyle: 'italic', fontFamily: condensedStack }}>.</span>
            </Text>
            <Text style={footerSmall}>
              Coach Macro · coach-macro.com
            </Text>
            <Text style={footerSmall}>
              You&apos;re receiving this because you joined the waitlist at coach-macro.com.{' '}
              <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistConfirmation;

// ============================
// STYLES
// ============================

const condensedStack =
  "'Barlow Condensed', 'Oswald', 'Arial Narrow', 'Helvetica Neue Condensed', Impact, sans-serif";
const bodyStack =
  "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const monoStack =
  "'DM Mono', 'SF Mono', 'Roboto Mono', Menlo, Monaco, Consolas, 'Courier New', monospace";

const body = {
  backgroundColor: '#050810',
  fontFamily: bodyStack,
  margin: 0,
  padding: 0,
  color: '#f5f5f0',
  WebkitFontSmoothing: 'antialiased',
};

const container = {
  backgroundColor: '#0a0e1a',
  maxWidth: '600px',
  margin: '0 auto',
  padding: 0,
};

const header = {
  padding: '32px 32px 24px 32px',
  borderBottom: '1px solid rgba(245,245,240,0.08)',
};

const wordmark = {
  fontFamily: condensedStack,
  fontStyle: 'italic',
  fontWeight: 900,
  fontSize: '20px',
  letterSpacing: '0.02em',
  color: '#f5f5f0',
  margin: 0,
  textTransform: 'uppercase',
  lineHeight: 1,
};

const hero = {
  padding: '48px 32px 8px 32px',
};

const eyebrow = {
  fontFamily: monoStack,
  fontSize: '10px',
  letterSpacing: '0.16em',
  color: '#e8341c',
  textTransform: 'uppercase',
  margin: '0 0 20px 0',
  fontWeight: 500,
};

const headline = {
  fontFamily: condensedStack,
  fontStyle: 'italic',
  fontWeight: 900,
  fontSize: '60px',
  lineHeight: '0.92',
  letterSpacing: '-0.02em',
  color: '#f5f5f0',
  textTransform: 'uppercase',
  margin: '0 0 24px 0',
};

const lead = {
  fontFamily: bodyStack,
  fontSize: '16px',
  lineHeight: '1.55',
  color: 'rgba(245,245,240,0.85)',
  margin: 0,
  fontWeight: 400,
};

const coachCardWrap = {
  padding: '24px 32px 8px 32px',
};

const coachTable = {
  backgroundColor: 'rgba(232,52,28,0.06)',
  borderRadius: '0 12px 12px 0',
  borderLeft: '3px solid #e8341c',
};

const coachCard = {
  padding: '18px 20px',
};

const coachEyebrow = {
  fontFamily: monoStack,
  fontSize: '10px',
  letterSpacing: '0.16em',
  color: '#e8341c',
  textTransform: 'uppercase',
  margin: '0 0 10px 0',
  fontWeight: 500,
};

const coachQuote = {
  fontFamily: bodyStack,
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '1.55',
  color: '#f5f5f0',
  margin: 0,
  fontWeight: 400,
};

const nextSection = {
  padding: '24px 32px 16px 32px',
};

const sectionEyebrow = {
  fontFamily: monoStack,
  fontSize: '10px',
  letterSpacing: '0.16em',
  color: '#e8341c',
  textTransform: 'uppercase',
  margin: '0 0 24px 0',
  fontWeight: 500,
};

const nextRow = {
  marginBottom: '14px',
  paddingBottom: '14px',
  borderBottom: '1px solid rgba(245,245,240,0.08)',
};

const nextRowLast = {
  marginBottom: '0',
  paddingBottom: '0',
};

const nextLabel = {
  fontFamily: monoStack,
  fontSize: '10px',
  letterSpacing: '0.16em',
  color: 'rgba(245,245,240,0.4)',
  margin: '0 0 6px 0',
  fontWeight: 500,
  textTransform: 'uppercase',
};

const nextText = {
  fontFamily: bodyStack,
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#f5f5f0',
  margin: 0,
  fontWeight: 400,
};

const divider = {
  borderColor: 'rgba(245,245,240,0.08)',
  borderTop: '1px solid rgba(245,245,240,0.08)',
  margin: '32px 32px 24px 32px',
};

const footer = {
  padding: '0 32px 40px 32px',
};

const footerLead = {
  fontFamily: condensedStack,
  fontStyle: 'italic',
  fontWeight: 800,
  fontSize: '15px',
  letterSpacing: '0.02em',
  color: 'rgba(245,245,240,0.7)',
  textTransform: 'uppercase',
  margin: '0 0 16px 0',
  lineHeight: '1.35',
};

const footerSmall = {
  fontFamily: monoStack,
  fontSize: '10px',
  letterSpacing: '0.08em',
  color: 'rgba(245,245,240,0.4)',
  margin: '0 0 8px 0',
  fontWeight: 400,
  lineHeight: '1.6',
};

const footerLink = {
  color: 'rgba(245,245,240,0.7)',
  textDecoration: 'underline',
};
