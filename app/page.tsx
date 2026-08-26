'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const featureData = [
  {
    title: 'Smart job discovery',
    color: 'rgba(232, 148, 56, 0.15)',
    ink: 'var(--brand-300)',
    copy: "Monitors 50+ boards, company pages, and hidden markets. Filters out listings that don't match your salary, location, or seniority bar.",
    points: [
      'LinkedIn, Indeed, Greenhouse, Ashby, Workday',
      'Salary range enforcement',
      '"Fresh in last 24h" feed',
    ],
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </>
    ),
  },
  {
    title: 'Resume tailoring, per job',
    color: 'rgba(244, 179, 90, 0.12)',
    ink: 'var(--warn)',
    copy: 'Rewrites your resume for every role in under 5 seconds. Highlights the right bullets, swaps keywords, recalibrates your summary — all without lying.',
    points: [
      'ATS keyword optimization',
      'Truthful rewrites (no fabrication)',
      'Versions saved, side-by-side diff',
    ],
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </>
    ),
  },
  {
    title: 'Auto-apply, human-quality',
    color: 'rgba(109, 212, 154, 0.12)',
    ink: 'var(--ok)',
    copy: 'Handles multi-step forms, custom questions, and cover letters like a real applicant. Pauses on anything risky and asks you first.',
    points: [
      'Workday, Greenhouse, Lever, Ashby',
      'Custom Q&A, generated from your story',
      'Daily caps and cooldowns',
    ],
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
  {
    title: 'Follow-ups that land',
    color: 'rgba(244, 179, 90, 0.12)',
    ink: 'var(--warn)',
    copy: 'Detects when a recruiter has gone quiet and sends a polite nudge calibrated to the company. Tracks every touchpoint in one timeline.',
    points: [
      'Smart timing (never on weekends)',
      'Tone matching per industry',
      'Auto-pause on out-of-office',
    ],
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
  },
  {
    title: 'Interview copilot',
    color: 'rgba(232, 112, 112, 0.12)',
    ink: 'var(--err)',
    copy: 'Real-time prompts, talking points, and "don’t say that" flags during calls. Post-call, generates a debrief and a thank-you note.',
    points: [
      'Live audio & Zoom support',
      'Company research, generated',
      'Practice mode with mock Qs',
    ],
    icon: (
      <>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </>
    ),
  },
  {
    title: 'Market intelligence',
    color: 'rgba(139, 184, 224, 0.12)',
    ink: 'var(--info)',
    copy: 'Tells you which skills are spiking in salary, which companies are hiring your role, and when to push vs. wait. The pulse of the market, daily.',
    points: [
      'Salary trend graphs',
      'Competitor move tracking',
      'Weekly strategy email',
    ],
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
];

const faqs = [
  [
    'Is this ethical? Won’t recruiters blacklist me?',
    'No blacklisting, because what AutomateApply sends is high-quality and human-reviewed where it matters. We don’t spam, we don’t lie, and we don’t impersonate you. Resumes are tailored using your real experience — just better positioned. Cover letters are written in your voice. We’re more polite than most human applicants, frankly.',
  ],
  [
    'Does it work on Workday / Greenhouse / Ashby?',
    'Yes. AutomateApply handles all major ATS platforms including Workday, Greenhouse, Lever, Ashby, iCIMS, and SmartRecruiters. For companies using custom career pages, we fall back to a smart-fill mode and confirm with you before submitting.',
  ],
  [
    'Can I review applications before they go out?',
    'Absolutely. You can run in three modes: Auto (full autopilot with daily caps), Review (AutomateApply drafts, you click approve), and Assisted (AutomateApply fills the form, you submit). Most users start in Review and switch to Auto after a week.',
  ],
  [
    'How is this different from LinkedIn Easy Apply?',
    'Easy Apply is a button. AutomateApply is a system. We monitor 50+ sources not on LinkedIn, score jobs against your profile, tailor your resume per role, write cover letters, handle multi-step forms, follow up on silence, and prep you for interviews. Easy Apply doesn’t even fill in your work history on Workday. We do.',
  ],
  [
    'What if I already have a job and can’t be “always on”?',
    'Most of our users do. Set quiet hours, daily caps (default 10/day), and a stealth mode that hides your profile from your current employer. AutomateApply runs at 3 AM; you read the digest at 8 AM with coffee.',
  ],
];

function Brand() {
  return (
    <>
      <span className="brand-mark" />
      AutomateApply
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const closeMobile = () => setMobileOpen(false);

  return (
    <main className="landing">
      <nav className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="AutomateApply home">
            <Brand />
          </Link>
          <div className="nav-links">
            <a href="#product" className="nav-link active">
              Product
            </a>
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how" className="nav-link">
              How it works
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
            <Link href="/dashboard" className="nav-link">
              App
            </Link>
          </div>
          <div className="row">
            <Link href="/login" className="btn btn-quiet btn-sm">
              Sign in
            </Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </div>
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={20} />}
          </button>
          <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
            <a href="#features" onClick={closeMobile}>
              Features
            </a>
            <a href="#how" onClick={closeMobile}>
              How it works
            </a>
            <a href="#pricing" onClick={closeMobile}>
              Pricing
            </a>
            <a href="#faq" onClick={closeMobile}>
              FAQ
            </a>
            <Link href="/login" onClick={closeMobile}>
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-primary"
              onClick={closeMobile}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero" id="product">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">
                <span className="dot" />
                Now running 1,400+ applications per minute
              </div>
              <h1 className="mt-24">
                Your job search,
                <br />
                <span className="text-grad-amber">on autopilot.</span>
              </h1>
              <p className="hero-sub mt-24">
                AutomateApply finds roles that fit, tailors your resume, fills
                out the application, and follows up — while you sleep. The
                average user lands 3x more interviews in half the time.
              </p>
              <div className="row mt-48">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Start free trial{' '}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <a href="#how" className="btn btn-ghost btn-lg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Watch demo
                </a>
              </div>
              <div className="row mt-32 hero-trust">
                <div className="row gap-8 text-sm text-muted">
                  <CheckIcon />
                  No credit card
                </div>
                <div className="row gap-8 text-sm text-muted">
                  <CheckIcon />
                  Cancel anytime
                </div>
                <div className="row gap-8 text-sm text-muted">
                  <CheckIcon />
                  2-minute setup
                </div>
              </div>
            </div>
            <div className="hero-visual" aria-label="Product activity preview">
              <div className="hv-gauge card">
                <div className="hv-gauge-label">Applications this week</div>
                <div className="hv-gauge-wrap">
                  <svg viewBox="0 0 200 200" className="hv-gauge-svg">
                    <defs>
                      <linearGradient
                        id="gaugeGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#fcd28a" />
                        <stop offset="50%" stopColor="#e89438" />
                        <stop offset="100%" stopColor="#b85e0e" />
                      </linearGradient>
                      <radialGradient id="gaugeGlow" cx="50%" cy="50%" r="50%">
                        <stop
                          offset="0%"
                          stopColor="#fcd28a"
                          stopOpacity=".3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#fcd28a"
                          stopOpacity="0"
                        />
                      </radialGradient>
                    </defs>
                    <circle
                      cx="100"
                      cy="100"
                      r="86"
                      fill="none"
                      stroke="rgba(255,220,170,0.06)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke="rgba(255,220,170,0.08)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="68"
                      fill="none"
                      stroke="rgba(255,220,170,0.08)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="68"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="427"
                      strokeDashoffset="60"
                      transform="rotate(-90 100 100)"
                    />
                    <g stroke="rgba(255,220,170,0.3)" strokeWidth="1">
                      <line x1="100" y1="20" x2="100" y2="26" />
                      <line x1="100" y1="174" x2="100" y2="180" />
                      <line x1="20" y1="100" x2="26" y2="100" />
                      <line x1="174" y1="100" x2="180" y2="100" />
                    </g>
                    <circle cx="100" cy="100" r="50" fill="url(#gaugeGlow)" />
                  </svg>
                  <div className="hv-gauge-num">
                    <div>
                      <div className="num">47</div>
                      <div className="lbl">sent</div>
                    </div>
                  </div>
                </div>
                <div className="hv-gauge-foot">
                  <div>
                    <div className="flbl">Interviews</div>
                    <div className="fval">12</div>
                  </div>
                  <div className="hv-divider" />
                  <div>
                    <div className="flbl">Response rate</div>
                    <div className="fval">28%</div>
                  </div>
                </div>
              </div>
              <div className="hv-live card">
                <div className="row spread mb-16">
                  <div className="row gap-8">
                    <div className="hv-pulse" />
                    <strong style={{ fontSize: 13 }}>
                      Live · 4 active runs
                    </strong>
                  </div>
                  <span className="chip chip-accent">Auto</span>
                </div>
                <div className="hv-feed">
                  {[
                    [
                      'S',
                      'linear-gradient(135deg, #635bff, #4f63ff)',
                      <>
                        Applied to <strong>Stripe</strong>
                      </>,
                      'Senior PM, Growth · 94% match',
                      '2m',
                    ],
                    [
                      'L',
                      'linear-gradient(135deg, #5e6ad2, #4f63ff)',
                      <>
                        Interview at <strong>Linear</strong>
                      </>,
                      'Recruiter screen · Tue 10 AM',
                      '14m',
                    ],
                    [
                      'A',
                      'linear-gradient(135deg, #cb6e1f, #de7c2b)',
                      <>
                        Tailored resume for <strong>Anthropic</strong>
                      </>,
                      'PM, API · 91% match · 4.2s',
                      '38m',
                    ],
                    [
                      'V',
                      'linear-gradient(135deg, #000, #434343)',
                      <>
                        Applied to <strong>Vercel</strong>
                      </>,
                      'Director of Product, AI',
                      '1h',
                    ],
                  ].map(([logo, background, title, meta, time]) => (
                    <div className="hvf-item" key={String(time)}>
                      <div
                        className="hvf-logo"
                        style={{ background: String(background) }}
                      >
                        {logo}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="hvf-title">{title}</div>
                        <div className="hvf-meta">{meta}</div>
                      </div>
                      <div className="hvf-time">{time}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hv-curve card">
                <div className="text-xs text-muted">
                  Salary trend · your target
                </div>
                <div className="hv-curve-num">
                  $215k <span className="text-muted text-sm">median</span>
                </div>
                <svg
                  viewBox="0 0 200 50"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: 40 }}
                >
                  <defs>
                    <linearGradient
                      id="curveGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#d97a1e" />
                      <stop offset="100%" stopColor="#fcd28a" />
                    </linearGradient>
                    <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fcd28a" stopOpacity=".3" />
                      <stop offset="100%" stopColor="#fcd28a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,40 Q25,38 50,32 T100,22 T150,15 T200,8"
                    fill="none"
                    stroke="url(#curveGradient)"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,40 Q25,38 50,32 T100,22 T150,15 T200,8 L200,50 L0,50 Z"
                    fill="url(#curveFill)"
                  />
                </svg>
                <div className="text-xs text-muted">+8.2% this month</div>
              </div>
              <div className="hv-mini card">
                <div className="text-xs text-muted">Resume tailored for</div>
                <div
                  className="text-sm"
                  style={{ fontWeight: 500, marginTop: 4 }}
                >
                  Notion · Sr. PM
                </div>
                <div className="progress mt-16" style={{ marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: '96%' }} />
                </div>
                <div
                  className="text-xs text-muted mt-8"
                  style={{ marginTop: 6 }}
                >
                  96% match · tailored in 4s
                </div>
              </div>
            </div>
          </div>
          <div className="logos mt-64">
            <span
              className="text-xs text-muted"
              style={{ letterSpacing: '.12em', textTransform: 'uppercase' }}
            >
              Hired at
            </span>
            <div className="logo-row">
              {[
                'Stripe',
                'Linear',
                'Vercel',
                'Notion',
                'Figma',
                'Anthropic',
                'Ramp',
              ].map((name) => (
                <div className="logo-pill" key={name}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="metrics">
        <div className="container">
          <div className="grid-4">
            {[
              ['3.2', '×', 'More interviews vs. manual applying'],
              ['14', 'd', 'Median time to first offer'],
              ['92', '%', 'Resume-to-job match accuracy'],
              ['$127', 'k', 'Average offer accepted by users'],
            ].map(([main, suffix, label]) => (
              <div key={label}>
                <div className="metric-num">
                  {main}
                  <span
                    className={suffix === 'd' || suffix === 'k' ? 'd' : 'x'}
                  >
                    {suffix}
                  </span>
                </div>
                <div className="metric-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <div className="section-intro">
            <div className="eyebrow">
              <span className="dot" />
              Features
            </div>
            <h2 className="mt-16">
              A copilot that{' '}
              <span className="text-grad-amber">does the work.</span>
            </h2>
            <p className="mt-16 text-dim">
              Most job tools give you a list. AutomateApply runs the search,
              writes the resume, fills the form, and follows up — end to end.
            </p>
          </div>
          <div className="features-grid mt-64">
            {featureData.map((feature) => (
              <article className="feature card" key={feature.title}>
                <div
                  className="feature-icon"
                  style={{ background: feature.color, color: feature.ink }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3>{feature.title}</h3>
                <p className="text-dim mt-8">{feature.copy}</p>
                <div className="feature-list">
                  {feature.points.map((point) => (
                    <div className="fl-item" key={point}>
                      <span className="fl-check">✓</span>
                      {point}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="container">
          <div className="section-intro">
            <div className="eyebrow">
              <span className="dot" />
              How it works
            </div>
            <h2 className="mt-16">
              From “thinking about it” <br />
              to <span className="text-grad-amber">signed offer</span>.
            </h2>
          </div>
          <div className="steps mt-64">
            <article className="step card">
              <div className="step-num">01</div>
              <div>
                <h3>Set your target</h3>
                <p className="text-dim mt-8">
                  Upload your resume once. Tell AutomateApply the roles you
                  want, salary floor, locations, and what’s a deal-breaker.
                  Takes 90 seconds.
                </p>
                <div className="step-visual">
                  <div className="codeblock">
                    <span className="c">{'// Your preferences'}</span>
                    {'\n'}
                    {'{'}
                    {'\n'} <span className="k">&quot;roles&quot;</span>: [
                    <span className="s">&quot;Senior PM&quot;</span>,{' '}
                    <span className="s">&quot;Director of Product&quot;</span>],
                    {'\n'} <span className="k">&quot;salary_min&quot;</span>:{' '}
                    <span className="n">180000</span>,{'\n'}{' '}
                    <span className="k">&quot;locations&quot;</span>: [
                    <span className="s">&quot;Remote US&quot;</span>,{' '}
                    <span className="s">&quot;NYC&quot;</span>],{'\n'}{' '}
                    <span className="k">&quot;deal_breakers&quot;</span>: [
                    <span className="s">&quot;agencies&quot;</span>,{' '}
                    <span className="s">&quot;Series A&quot;</span>]{'\n'}
                    {'}'}
                  </div>
                </div>
              </div>
            </article>
            <article className="step card">
              <div className="step-num">02</div>
              <div>
                <h3>AutomateApply gets to work</h3>
                <p className="text-dim mt-8">
                  Every day, AutomateApply scans 200+ sources, scores matches
                  against your profile, tailors your resume, and submits
                  applications. You get a single daily digest.
                </p>
                <div className="step-visual">
                  <div className="codeblock">
                    <span className="c">{'// 6:00 AM digest'}</span>
                    {'\n'}
                    <span className="k">Applied</span>:{' '}
                    <span className="n">23</span> new roles (92%+ match){'\n'}
                    <span className="k">Tailored</span>:{' '}
                    <span className="n">23</span> resume versions{'\n'}
                    <span className="k">Interview</span>:{' '}
                    <span className="n">1</span> recruiter screen (Stripe){'\n'}
                    <span className="k">Follow-up</span>:{' '}
                    <span className="n">4</span> pending nudges sent
                  </div>
                </div>
              </div>
            </article>
            <article className="step card">
              <div className="step-num">03</div>
              <div>
                <h3>You show up, AutomateApply does the rest</h3>
                <p className="text-dim mt-8">
                  When recruiters reply, AutomateApply triages, schedules, and
                  preps you. During the call, the interview copilot whispers the
                  right answers. You close.
                </p>
                <div className="step-visual">
                  <div className="codeblock">
                    <span className="c">
                      {'// 2:30 PM — Stripe recruiter screen'}
                    </span>
                    {'\n'}
                    <span className="k">Prep ready</span>: 3 talking points, 2
                    questions to ask{'\n'}
                    <span className="k">Watchlist</span>:{' '}
                    <span className="s">&quot;AI policy experience&quot;</span>{' '}
                    — highlight early{'\n'}
                    <span className="k">Saved</span>: 1 debrief, 1 thank-you
                    note (drafted)
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <div className="section-intro">
            <div className="eyebrow">
              <span className="dot" />
              From real users
            </div>
            <h2 className="mt-16">
              People who{' '}
              <span className="text-grad-amber">
                stopped applying manually.
              </span>
            </h2>
          </div>
          <div className="grid-3 mt-64">
            {[
              [
                'MR',
                'Maya Rodriguez',
                'Senior Engineer · $185k offer @ Vercel',
                '“47 applications in two weeks, 8 interviews, 2 offers. I literally had to turn AutomateApply off because I got tired of saying yes to calls.”',
                undefined,
              ],
              [
                'DK',
                'Daniel Kim',
                'Product Designer · Stripe',
                '“I was skeptical about AI-written resumes until I saw the diff. It pulled a project from 2019 I’d forgotten about. Recruiter literally quoted it back.”',
                'radial-gradient(circle at 30% 30%, #a9e631, #4f63ff 60%, #1a1a40)',
              ],
              [
                'AT',
                'Aisha Thompson',
                'Staff Eng · Anthropic',
                '“The interview copilot got me through a brutal System Design round. Asked if I wanted it to draft a thank-you note before I’d even hung up.”',
                'radial-gradient(circle at 30% 30%, #fcd28a, #cb6e1f 60%, #5a2e08)',
              ],
            ].map(([initials, name, role, quote, background]) => (
              <article className="tcard card" key={String(name)}>
                <div className="tquote">{quote}</div>
                <div className="tauthor">
                  <div
                    className="avatar"
                    style={
                      background
                        ? { background: String(background) }
                        : undefined
                    }
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="tname">{name}</div>
                    <div className="trole">{role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-intro">
            <div className="eyebrow">
              <span className="dot" />
              Pricing
            </div>
            <h2 className="mt-16">
              Pays for itself on the{' '}
              <span className="text-grad-amber">first offer.</span>
            </h2>
            <p className="mt-16 text-dim">
              All plans include a 14-day free trial. No credit card. Cancel
              anytime.
            </p>
          </div>
          <div className="plans mt-64">
            {[
              {
                name: 'Starter',
                price: '$29',
                desc: 'For focused, 4-6 week job searches.',
                features: [
                  '50 applications / month',
                  'Resume tailoring',
                  '5 job boards monitored',
                  'Email follow-ups',
                  'Daily digest',
                ],
                button: 'Start free trial',
              },
              {
                name: 'Pro',
                price: '$79',
                desc: 'For serious, full-time search mode.',
                features: [
                  'Unlimited applications',
                  'All boards, including hidden ATS',
                  'Interview copilot (live)',
                  'Cover letters & custom Q&A',
                  'Salary intelligence',
                  '1:1 resume review (1x)',
                ],
                button: 'Start free trial',
                popular: true,
              },
              {
                name: 'Career+',
                price: '$199',
                desc: 'For executives and senior ICs.',
                features: [
                  'Everything in Pro',
                  'Coaching calls (2x / month)',
                  'Negotiation support',
                  'Exec resume writer',
                  'Priority AI capacity',
                  'White-glove onboarding',
                ],
                button: 'Talk to sales',
              },
            ].map((plan) => (
              <article
                className={`plan card${plan.popular ? ' popular' : ''}`}
                key={plan.name}
              >
                {plan.popular && (
                  <div className="popular-tag">Most popular</div>
                )}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">
                  <span className="pp-num">{plan.price}</span>
                  <span className="pp-per">/mo</span>
                </div>
                <p className="text-dim text-sm">{plan.desc}</p>
                <div className="divider" />
                <ul className="plan-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  {plan.button}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="container-narrow">
          <div className="section-intro">
            <div className="eyebrow">
              <span className="dot" />
              FAQ
            </div>
            <h2 className="mt-16">Questions, answered.</h2>
          </div>
          <div className="faq-list mt-64">
            {faqs.map(([question, answer], index) => (
              <article
                className={`faq-item card${openFaq === index ? ' open' : ''}`}
                key={question}
              >
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  {question}
                </button>
                <div className="faq-a">
                  <p>{answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container-narrow">
          <div className="cta-card card">
            <div className="eyebrow">
              <span className="dot" />
              Ready when you are
            </div>
            <h2 className="mt-16">
              Stop applying.{' '}
              <span className="text-grad-amber">Start interviewing.</span>
            </h2>
            <p className="mt-16 text-dim">
              Set it up in 2 minutes. Get your first tailored resume in 30
              seconds. Let AutomateApply do the rest.
            </p>
            <div className="row mt-32">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Start free trial
              </Link>
              <a
                href="mailto:hello@automateapply.example"
                className="btn btn-ghost btn-lg"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="brand">
                <Brand />
              </Link>
              <p className="text-muted text-sm mt-16" style={{ maxWidth: 280 }}>
                Your job search, on autopilot. Built by ex-recruiters and
                ex-applicants who hated both sides.
              </p>
            </div>
            {[
              [
                'Product',
                [
                  ['Features', '#features'],
                  ['How it works', '#how'],
                  ['Pricing', '#pricing'],
                  ['App', '/dashboard'],
                ],
              ],
              [
                'Company',
                [
                  ['About', '#'],
                  ['Careers', '#'],
                  ['Press', '#'],
                  ['Contact', '#'],
                ],
              ],
              [
                'Resources',
                [
                  ['Blog', '#'],
                  ['Salary guide', '#'],
                  ['Help center', '#'],
                  ['Changelog', '#'],
                ],
              ],
              [
                'Legal',
                [
                  ['Privacy', '#'],
                  ['Terms', '#'],
                  ['Security', '#'],
                  ['DPA', '#'],
                ],
              ],
            ].map(([title, links]) => (
              <div key={String(title)}>
                <div className="ftitle">{title}</div>
                {(links as [string, string][]).map(([label, href]) =>
                  href.startsWith('/') ? (
                    <Link href={href} key={label}>
                      {label}
                    </Link>
                  ) : (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ),
                )}
              </div>
            ))}
          </div>
          <div className="footer-base">
            <div className="text-muted text-sm">
              © 2026 AutomateApply Labs Inc.
            </div>
            <div className="row gap-16 text-muted text-sm">
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
