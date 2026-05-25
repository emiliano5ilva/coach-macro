import React, { useState } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;1,900&family=DM+Mono:wght@400;500&display=swap');

  .about-page {
    background: #000;
    color: #f5f5f0;
    font-family: 'Barlow Condensed', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* HERO — text only, no image */
  .about-hero {
    padding: 120px 48px 80px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
  }

  .about-hero::after {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,52,28,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  .about-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #e8341c;
    margin-bottom: 20px;
    display: block;
  }

  .about-hero-headline {
    font-family: 'Barlow Condensed', sans-serif;
    font-style: italic;
    font-weight: 900;
    font-size: clamp(56px, 9vw, 112px);
    color: #f5f5f0;
    text-transform: uppercase;
    line-height: 0.88;
    margin-bottom: 0;
  }

  .about-hero-headline .red { color: #e8341c; }

  /* BODY COPY */
  .about-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 80px 48px 100px;
  }

  .about-red-bar {
    width: 48px;
    height: 3px;
    background: #e8341c;
    border-radius: 2px;
    margin-bottom: 48px;
  }

  .about-paragraph {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: clamp(19px, 1.8vw, 23px);
    font-weight: 400;
    color: #f5f5f0;
    line-height: 1.65;
    margin-bottom: 28px;
    max-width: 720px;
  }

  .about-paragraph.dim {
    color: rgba(245,245,240,0.6);
  }

  .about-pull-quote {
    font-family: 'Barlow Condensed', sans-serif;
    font-style: italic;
    font-weight: 900;
    font-size: clamp(26px, 3vw, 40px);
    color: #f5f5f0;
    text-transform: uppercase;
    line-height: 1.05;
    border-left: 3px solid #e8341c;
    padding-left: 24px;
    margin: 48px 0;
    max-width: 640px;
  }

  .about-divider {
    width: 100%;
    height: 1px;
    background: rgba(245,245,240,0.06);
    margin: 56px 0;
  }

  .about-closing {
    font-family: 'Barlow Condensed', sans-serif;
    font-style: italic;
    font-weight: 900;
    font-size: clamp(32px, 4vw, 52px);
    color: #f5f5f0;
    text-transform: uppercase;
    line-height: 0.9;
    margin-bottom: 40px;
  }

  .about-closing .red { color: #e8341c; }
  .about-closing .dim { color: rgba(245,245,240,0.18); }

  .about-sign {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #e8341c;
    margin-top: 52px;
    display: block;
  }

  /* TEXAS */
  .about-texas {
    border-top: 1px solid rgba(245,245,240,0.05);
    padding: 64px 48px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .about-texas-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(245,245,240,0.22);
    text-align: center;
  }

  .about-texas-text .accent {
    color: rgba(232,52,28,0.5);
  }

  @media (max-width: 768px) {
    .about-hero,
    .about-body,
    .about-texas {
      padding-left: 24px;
      padding-right: 24px;
    }
    .about-hero {
      padding-top: 80px;
      padding-bottom: 48px;
    }
  }
`;

export default function AboutPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="about-page">

        {/* HERO */}
        <section className="about-hero">
          <span className="about-eyebrow">// Our Story</span>
          <h1 className="about-hero-headline">
            ABOUT<br />
            COACH<span className="red"> MACRO</span><span className="red">.</span>
          </h1>
        </section>

        {/* BODY */}
        <section className="about-body">
          <div className="about-red-bar" />

          <p className="about-paragraph">
            I started Coach Macro because I couldn't ignore how broken the fitness space felt.
          </p>

          <p className="about-paragraph dim">
            People are trying their hardest to change their lives, yet they're stuck bouncing between apps that don't communicate with each other, following advice that feels impossible to sustain, and restarting over and over again.
          </p>

          <p className="about-paragraph">
            I know that frustration because I've lived it too.
          </p>

          <p className="about-paragraph dim">
            And eventually I got tired of waiting for someone else to build something better.
          </p>

          <div className="about-pull-quote">
            "So I started building it myself."
          </div>

          <p className="about-paragraph dim">
            Coach Macro isn't backed by a giant corporation or built by a massive team. It started with one person, one vision, and an obsession with creating something genuinely useful for people trying to improve their lives.
          </p>

          <p className="about-paragraph dim">
            Every late night, every update, every feature, and every decision comes back to one question:
          </p>

          <div className="about-pull-quote">
            "How do I build something that actually helps people stay consistent?"
          </div>

          <p className="about-paragraph dim">
            Not something bloated with features. Not something designed just to keep people scrolling. Something people can genuinely rely on.
          </p>

          <div className="about-divider" />

          <p className="about-paragraph">
            I'm building Coach Macro to become the platform I always wished existed.
          </p>

          <p className="about-paragraph dim">
            A place where your nutrition, workouts, progress, and goals all work together instead of feeling disconnected. Because fitness changes when everything finally connects.
          </p>

          <p className="about-paragraph dim">
            And honestly, I believe fitness technology is heading in the wrong direction. More noise. More confusion. More complexity.
          </p>

          <p className="about-paragraph">
            Coach Macro was created to go the opposite direction.
          </p>

          <div className="about-pull-quote">
            Simpler. Smarter. More personal. More human.
          </div>

          <div className="about-divider" />

          <p className="about-paragraph dim">
            What means the most to me is that this has never felt like "my" platform. From the beginning, the people using Coach Macro have helped shape what it becomes through feedback, ideas, support, and belief in the vision.
          </p>

          <p className="about-paragraph">
            That's why I say "we."
          </p>

          <p className="about-paragraph dim">
            Because Coach Macro isn't just being built for people. It's being built with them.
          </p>

          <p className="about-paragraph dim">
            Whether you've been here since day one or just discovered us recently, thank you for being part of this journey. I truly believe we're building something special together.
          </p>

          <span className="about-sign">— Coach Macro</span>
        </section>

        {/* TEXAS */}
        <div className="about-texas">
          <div className="about-texas-text">
            Born in <span className="accent">Texas</span>. Built for every athlete.
          </div>
        </div>

      </div>
    </>
  );
}
