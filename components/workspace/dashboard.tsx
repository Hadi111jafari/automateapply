'use client';

import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  DollarSign,
  Pause,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { MiniTrend, TinyCompany } from './workspace-shell';
import { useDemoMode } from '@/lib/demo-mode';

const jobs = [
  {
    letter: 'S',
    company: 'Stripe',
    title: 'Senior Product Manager, Growth',
    score: '96',
    tone: 'violet' as const,
    location: 'Remote (US)',
    compensation: '$210k–$280k',
    time: '4h ago',
    status: 'Tailored',
    detail: '+47 comp boosts',
  },
  {
    letter: 'L',
    company: 'Linear',
    title: 'Group Product Manager, Platform',
    score: '93',
    tone: 'violet' as const,
    location: 'Remote',
    compensation: '$200k–$260k',
    time: '12h ago',
    status: 'Tailored',
    detail: undefined,
  },
  {
    letter: 'V',
    company: 'Vercel',
    title: 'Director of Product, AI',
    score: '91',
    tone: 'black' as const,
    location: 'SF / Remote',
    compensation: '$240k–$310k',
    time: '1d ago',
    status: 'Tailored',
    detail: undefined,
  },
  {
    letter: 'N',
    company: 'Notion',
    title: 'Senior PM, Enterprise',
    score: '88',
    tone: 'coral' as const,
    location: 'San Francisco',
    compensation: '$190k–$240k',
    time: '2d ago',
    status: 'Needs review',
    detail: undefined,
  },
  {
    letter: 'A',
    company: 'Anthropic',
    title: 'Product Manager, API Platform',
    score: '87',
    tone: 'orange' as const,
    location: 'San Francisco',
    compensation: '$220k–$290k',
    time: '3h ago',
    status: 'Tailored',
    detail: undefined,
  },
] as const;

const activityRows = [
  {
    icon: 'check',
    prefix: 'Applied to',
    emphasis: 'Linear',
    suffix: ' · Group PM, Platform',
    time: '2 minutes ago · Resume v12 · Cover letter drafted',
    status: 'Sent',
    tone: 'brand',
  },
  {
    icon: 'arrow',
    prefix: '',
    emphasis: 'Stripe',
    suffix: ' replied to your application',
    time: '14 minutes ago · "Let\'s schedule a 30-min screen next week"',
    status: 'Reply',
    tone: 'brand',
  },
  {
    icon: 'spark',
    prefix: 'Tailored resume for',
    emphasis: 'Anthropic · PM, API',
    suffix: '',
    time: '38 minutes ago · 96% match · 4.2s',
    status: 'Ready',
    tone: 'warn',
  },
  {
    icon: 'warn',
    prefix: 'Followed up with',
    emphasis: 'Ramp',
    suffix: ' · Senior PM',
    time: '1 hour ago · No response in 6 days · Soft nudge sent',
    status: 'Nudge',
    tone: 'warn',
  },
  {
    icon: 'check',
    prefix: 'Applied to',
    emphasis: 'Vercel',
    suffix: ' · Director of Product, AI',
    time: '2 hours ago · Resume v9',
    status: 'Sent',
    tone: 'brand',
  },
  {
    icon: 'error',
    prefix: 'Skipped',
    emphasis: 'Meta',
    suffix: ' · Senior PM',
    time: '3 hours ago · Salary below your floor ($145k vs $180k)',
    status: 'Filtered',
    tone: 'err',
  },
] as const;

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  pill,
  color,
  points,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  suffix?: string;
  pill: string;
  color: string;
  points: string;
}) {
  return (
    <article className="panel stat">
      <div className="stat-label">
        <Icon size={14} />
        {label}
      </div>
      <div className="stat-value">
        {value}
        {suffix ? <span className="stat-suffix">{suffix}</span> : null}
      </div>
      <div className="spread stat-footer">
        <span className="pill green stat-delta">{pill}</span>
        <MiniTrend color={color} points={points} />
      </div>
    </article>
  );
}

function DashboardLink({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="dashboard-link">
      {children}
      <ChevronRight size={14} />
    </button>
  );
}

type ApplicationRecord = {
  id: string;
  company: string;
  title: string;
  location: string;
  match_score: number | null;
  stage: string;
  source_url: string;
  created_at: string;
  updated_at: string;
};

function relativeTime(iso: string) {
  const milliseconds = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(milliseconds)) return '';
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 14 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

const PIPELINE_ROWS: Array<{ label: string; stages: string[]; tone: string }> = [
  { label: 'Review queue', stages: ['review'], tone: 'pending' },
  { label: 'Applied', stages: ['applied'], tone: 'amber' },
  { label: 'Recruiter screen', stages: ['screen'], tone: 'blue' },
  { label: 'Technical', stages: ['technical'], tone: 'warn' },
  { label: 'Final / Offer', stages: ['final', 'offer'], tone: 'lime' },
  { label: 'Rejected', stages: ['rejected'], tone: 'err' },
];

const LOGO_TONES = ['violet', 'orange', 'black', 'coral', 'blue'] as const;

function logoTone(name: string): (typeof LOGO_TONES)[number] {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return LOGO_TONES[hash % LOGO_TONES.length];
}

function RealStat({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number | string;
  suffix?: string;
  sub: string;
}) {
  return (
    <article className="panel stat">
      <div className="stat-label">
        <Icon size={14} />
        {label}
      </div>
      <div className="stat-value">
        {value}
        {suffix ? <span className="stat-suffix">{suffix}</span> : null}
      </div>
      <div className="spread stat-footer">
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </article>
  );
}

function RealDashboard() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [tailoredCount, setTailoredCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [lastWeekCount, setLastWeekCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let alive = true;
    void Promise.all([
      apiFetch<{ applications: ApplicationRecord[] }>('/api/applications'),
      apiFetch<{ materials: Array<{ id: string }> }>('/api/materials'),
    ])
      .then(([applicationData, materialData]) => {
        if (!alive) return;
        setApps(applicationData.applications);
        setTailoredCount(materialData.materials.length);
        const now = Date.now();
        const weekMs = 7 * 86_400_000;
        const ages = applicationData.applications.map(
          (app) => now - new Date(app.created_at).getTime(),
        );
        setWeekCount(ages.filter((age) => age < weekMs).length);
        setLastWeekCount(
          ages.filter((age) => age >= weekMs && age < 2 * weekMs).length,
        );
      })
      .catch((cause: unknown) =>
        alive ? setError(cause instanceof Error ? cause.message : 'Could not load your workspace data.') : undefined,
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of apps) counts[app.stage] = (counts[app.stage] ?? 0) + 1;
    return counts;
  }, [apps]);
  const countStages = (stages: string[]) =>
    stages.reduce((sum, stage) => sum + (stageCounts[stage] ?? 0), 0);

  const interviews = countStages(['screen', 'technical', 'final', 'offer']);
  const offers = countStages(['offer']);
  const inMotion = countStages(['applied', 'screen', 'technical', 'final', 'offer']);
  const maxPipeline = Math.max(1, apps.length);

  const avgMatch = apps.length
    ? Math.round(apps.reduce((sum, app) => sum + (app.match_score ?? 0), 0) / apps.length)
    : 0;
  const inMotionPct = apps.length ? Math.round((inMotion / apps.length) * 100) : 0;
  const gaugeOffset = Math.round(377 * (1 - inMotionPct / 100));

  // Real activity feed: every event is derived from a stored record timestamp.
  const activity = useMemo(() => {
    type Event = { key: string; time: string; icon: 'check' | 'arrow' | 'spark'; text: React.ReactNode; status: string; tone: 'brand' | 'warn' | 'blue' };
    const events: Event[] = [];
    for (const app of apps) {
      events.push({
        key: `saved-${app.id}`,
        time: app.created_at,
        icon: 'check',
        text: (
          <>
            Saved <strong>{app.company}</strong> · {app.title}
          </>
        ),
        status: `${app.match_score != null ? `${app.match_score}%` : '—'} match`,
        tone: 'brand',
      });
      if (app.stage !== 'review' && app.updated_at > app.created_at) {
        events.push({
          key: `moved-${app.id}`,
          time: app.updated_at,
          icon: 'arrow',
          text: (
            <>
              <strong>{app.company}</strong> moved to{' '}
              {app.stage.charAt(0).toUpperCase() + app.stage.slice(1)}
            </>
          ),
          status: app.stage === 'rejected' ? 'Closed' : 'Updated',
          tone: app.stage === 'rejected' ? 'warn' : 'blue',
        });
      }
    }
    return events
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8);
  }, [apps]);

  const nextActions = useMemo(
    () =>
      [...apps]
        .filter((app) => app.stage === 'review')
        .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1))
        .slice(0, 5),
    [apps],
  );

  if (loading)
    return (
      <section className="panel grid min-h-[420px] place-items-center p-8">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </section>
    );
  if (error)
    return (
      <section className="panel grid min-h-[300px] place-items-center p-8 text-center">
        <div>
          <h2 className="display text-2xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-sm text-red-400">{error}</p>
        </div>
      </section>
    );
  if (!apps.length)
    return (
      <section className="panel grid min-h-[420px] place-items-center p-8 text-center">
        <div>
          <h2 className="display text-3xl font-bold">Your pipeline starts here</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Search for roles, save the interesting ones, and track everything
            from this dashboard. Your data stays private to your account.
          </p>
          <Link href="/jobs" className="amber-button mt-6 px-5 py-2.5 text-sm">
            Find your first role
          </Link>
        </div>
      </section>
    );

  return (
    <div className="dashboard">
      <section className="dash-top">
        <article className="panel hero-stat">
          <div className="hs-row">
            <div>
              <div className="hs-label">
                <span className="dot" /> This week
              </div>
              <div className="hs-num">{weekCount}</div>
              <div className="hs-sub">
                {apps.length} saved · {interviews} in interviews · {offers}{' '}
                {offers === 1 ? 'offer' : 'offers'}
              </div>
              <div className="hs-meta">
                {lastWeekCount > 0 ? (
                  <span className="pill green stat-delta">
                    {weekCount >= lastWeekCount ? '↑' : '↓'}{' '}
                    {Math.abs(
                      Math.round(((weekCount - lastWeekCount) / lastWeekCount) * 100),
                    )}
                    % vs last week
                  </span>
                ) : (
                  <span className="pill green stat-delta">↑ {weekCount} new</span>
                )}
                <span className="text-muted text-sm">avg match {avgMatch}%</span>
              </div>
            </div>
            <div className="hs-gauge">
              <svg viewBox="0 0 160 160" aria-label={`${inMotionPct} percent in motion`}>
                <defs>
                  <linearGradient id="dashboard-gauge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fcd28a" />
                    <stop offset="100%" stopColor="#d97a1e" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="rgba(255,220,170,0.06)"
                  strokeWidth="1"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="rgba(255,220,170,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="url(#dashboard-gauge)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="377"
                  strokeDashoffset={gaugeOffset}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="hs-gauge-text">
                <div className="pct">
                  {inMotionPct}
                  <span>%</span>
                </div>
                <div className="lbl">in motion</div>
              </div>
            </div>
          </div>
        </article>

        <div className="dash-stats-grid">
          <RealStat
            icon={CheckCircle2}
            label="Interviews"
            value={interviews}
            sub="screen → offer stages"
          />
          <RealStat
            icon={ArrowUpRight}
            label="In motion"
            value={inMotion}
            sub="applied → offer stages"
          />
          <RealStat
            icon={Sparkles}
            label="Tailored materials"
            value={tailoredCount}
            sub="AI drafts saved"
          />
        </div>
      </section>

      <section className="dash-cols">
        <div className="stack-lg">
          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>High-match opportunities</h3>
                <p>Saved roles waiting for review · sorted by match</p>
              </div>
              <Link href="/jobs" className="ghost-button dashboard-button-sm">
                Find more →
              </Link>
            </div>
            <div className="job-list">
              {nextActions.length ? (
                nextActions.map((app) => (
                  <article className="job-row" key={app.id}>
                    <TinyCompany
                      letter={app.company[0]?.toUpperCase() ?? '?'}
                      tone={logoTone(app.company)}
                    />
                    <div className="job-copy">
                      <div className="job-title">{app.title}</div>
                      <div className="job-meta">
                        <span>
                          <strong>{app.company}</strong>
                        </span>
                        <span className="dot" />
                        <span>{app.location}</span>
                        <span className="dot" />
                        <span>{relativeTime(app.created_at)}</span>
                      </div>
                    </div>
                    <div className="job-badges">
                      <span className="pill amber">{app.match_score ?? 0}% match</span>
                    </div>
                    <div className={`job-score-num ${(app.match_score ?? 0) >= 90 ? 'hi' : ''}`}>
                      {app.match_score ?? '—'}
                    </div>
                    <Link
                      href={`/resume?application=${encodeURIComponent(app.id)}`}
                      className="amber-button dashboard-button-sm"
                    >
                      Tailor
                    </Link>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing waiting for review. Saved jobs appear here sorted by match.
                </p>
              )}
            </div>
          </section>

          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>Recent activity</h3>
                <p>From your saved applications</p>
              </div>
            </div>
            <div>
              {activity.map((event) => (
                <div className="feed-item" key={event.key}>
                  <span className={`feed-dot ${event.tone}`}>
                    {event.icon === 'check' ? <Check size={14} /> : <ArrowUpRight size={14} />}
                  </span>
                  <div className="feed-content">
                    <div className="feed-title">{event.text}</div>
                    <div className="feed-time">{relativeTime(event.time)}</div>
                  </div>
                  <span className={`pill ${event.tone === 'brand' ? 'green' : 'blue'}`}>{event.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="stack-lg">
          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>Pipeline</h3>
                <p>Where everything stands right now</p>
              </div>
              <Link href="/applications" className="ghost-button dashboard-button-sm">View all</Link>
            </div>
            <div className="pipeline-list">
              {PIPELINE_ROWS.map((row) => {
                const count = countStages(row.stages);
                return (
                  <div key={row.label}>
                    <div className="spread pipeline-label">
                      <span>{row.label}</span>
                      <span className="mono text-muted">{count}</span>
                    </div>
                    <div className="progress">
                      <div
                        className={`progress-fill progress-fill-${row.tone}`}
                        style={{ width: `${Math.round((count / maxPipeline) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>Keep going</h3>
                <p>Everything stays manual and private</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              AutomateApply never submits applications for you. Review each
              tailored draft, then apply on the original listing and mark it
              applied here to keep your pipeline honest.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

export function Dashboard() {
  const demoMode = useDemoMode();
  if (demoMode) return <DemoDashboard />;
  return <RealDashboard />;
}

function DemoDashboard() {
  return (
    <div className="dashboard">
      <section className="dash-top">
        <article className="panel hero-stat">
          <div className="hs-row">
            <div>
              <div className="hs-label">
                <span className="dot" /> This week
              </div>
              <div className="hs-num">47</div>
              <div className="hs-sub">
                applications sent · 12 interviews · 1 offer out
              </div>
              <div className="hs-meta">
                <span className="pill green stat-delta">↑ 23% vs last week</span>
                <span className="text-muted text-sm">avg response 2.4d</span>
              </div>
            </div>
            <div className="hs-gauge">
              <svg viewBox="0 0 160 160" aria-label="80 percent target">
                <defs>
                  <linearGradient id="dashboard-gauge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fcd28a" />
                    <stop offset="100%" stopColor="#d97a1e" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="rgba(255,220,170,0.06)"
                  strokeWidth="1"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="rgba(255,220,170,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="url(#dashboard-gauge)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="377"
                  strokeDashoffset="75"
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="hs-gauge-text">
                <div className="pct">
                  80<span>%</span>
                </div>
                <div className="lbl">target</div>
              </div>
            </div>
          </div>
        </article>

        <div className="dash-stats-grid">
          <StatCard
            icon={CheckCircle2}
            label="Interviews"
            value="12"
            pill="↑ 3 today"
            color="#e89438"
            points="0,32 15,30 30,30 45,25 60,20 75,22 90,15 105,12 120,8"
          />
          <StatCard
            icon={Clock3}
            label="Response time"
            value="2.4"
            suffix="d"
            pill="↓ 0.8d faster"
            color="#6dd49a"
            points="0,10 15,12 30,18 45,20 60,25 75,28 90,30 105,32 120,35"
          />
          <StatCard
            icon={DollarSign}
            label="Offer comp"
            value="$172"
            suffix="k"
            pill="↑ $14k vs target"
            color="#f4b35a"
            points="0,30 15,28 30,22 45,24 60,18 75,15 90,12 105,10 120,6"
          />
        </div>
      </section>

      <section className="panel live-run">
        <div className="spread live-run-head">
          <div>
            <div className="live-run-title">
              <span className="live-dot" />
              <strong>Live run · Cycle 47</strong>
              <span className="pill amber">Auto-apply</span>
            </div>
            <div className="text-xs text-muted live-run-meta">
              Started 14 minutes ago · next check in 23 min
            </div>
          </div>
          <div className="live-run-actions">
            <button type="button" className="ghost-button dashboard-button-sm">
              <Pause size={14} /> Pause
            </button>
            <button type="button" className="amber-button dashboard-button-sm">
              View log
            </button>
          </div>
        </div>
        <div className="lr-grid">
          {[
            ['241', 'Discovered', '100%', 'amber'],
            ['47', 'Tailored resumes', '100%', 'amber'],
            ['23', 'Submitted', '49%', 'amber'],
            ['4', 'Pending review', '8%', 'pending'],
          ].map(([num, label, width, tone]) => (
            <div className="lr-stage" key={label}>
              <div className="lr-num">{num}</div>
              <div className="lr-lbl">{label}</div>
              <div className="progress">
                <div
                  className={`progress-fill ${tone === 'pending' ? 'progress-fill-pending' : ''}`}
                  style={{ width }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dash-cols">
        <div className="stack-lg">
          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>High-match opportunities</h3>
                <p>Tailored resumes ready · sorted by match</p>
              </div>
              <button type="button" className="ghost-button dashboard-button-sm">
                View all 147 →
              </button>
            </div>
            <div className="job-list">
              {jobs.map((job) => (
                <article className="job-row" key={job.company}>
                  <TinyCompany letter={job.letter} tone={job.tone} />
                  <div className="job-copy">
                    <div className="job-title">{job.title}</div>
                    <div className="job-meta">
                      <span>
                        <strong>{job.company}</strong>
                      </span>
                      <span className="dot" />
                      <span>{job.location}</span>
                      <span className="dot" />
                      <span>{job.compensation}</span>
                      <span className="dot" />
                      <span>{job.time}</span>
                    </div>
                  </div>
                  <div className="job-badges">
                    <span className={`pill ${job.status === 'Needs review' ? 'amber' : 'amber'}`}>
                      {job.status}
                    </span>
                    {job.detail ? <span className="pill job-detail">{job.detail}</span> : null}
                  </div>
                  <div className={`job-score-num ${job.score >= '91' ? 'hi' : ''}`}>
                    {job.score}
                  </div>
                  <button
                    type="button"
                    className={`${job.status === 'Needs review' ? 'ghost-button' : 'amber-button'} dashboard-button-sm`}
                  >
                    {job.status === 'Needs review' ? 'Review' : 'Apply'}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>AI activity log</h3>
                <p>What AutomateApply did in the last 24 hours</p>
              </div>
              <div className="tabs">
                <button type="button" className="tab active">Today</button>
                <button type="button" className="tab">Week</button>
                <button type="button" className="tab">Month</button>
              </div>
            </div>
            <div>
              {activityRows.map((row) => (
                <div className="feed-item" key={`${row.emphasis}-${row.status}`}>
                  <span className={`feed-dot ${row.tone}`}>
                    {row.icon === 'check' ? <Check size={14} /> : null}
                    {row.icon === 'arrow' ? <ArrowUpRight size={14} /> : null}
                    {row.icon === 'spark' ? '⚡' : null}
                    {row.icon === 'warn' ? '!' : null}
                    {row.icon === 'error' ? '×' : null}
                  </span>
                  <div className="feed-content">
                    <div className="feed-title">
                      {row.prefix} {row.prefix ? null : null}
                      <strong>{row.emphasis}</strong>
                      {row.suffix}
                    </div>
                    <div className="feed-time">{row.time}</div>
                  </div>
                  {row.status === 'Reply' ? (
                    <button type="button" className="amber-button dashboard-button-sm">Reply</button>
                  ) : (
                    <span className={`pill ${row.status === 'Ready' ? 'blue' : row.status === 'Filtered' ? 'red' : row.status === 'Nudge' ? 'amber' : 'green'}`}>
                      {row.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="stack-lg">
          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>Pipeline</h3>
                <p>Where everything stands</p>
              </div>
              <DashboardLink>View</DashboardLink>
            </div>
            <div className="pipeline-list">
              {[
                ['Applied', '89', '100%', 'amber'],
                ['Recruiter screen', '12', '14%', 'blue'],
                ['Technical', '5', '6%', 'warn'],
                ['Final round', '2', '2%', 'lime'],
                ['Offers', '1', '1%', 'lime'],
              ].map(([label, count, width, tone]) => (
                <div key={label}>
                  <div className="spread pipeline-label">
                    <span>{label}</span>
                    <span className="mono text-muted">{count}</span>
                  </div>
                  <div className="progress">
                    <div className={`progress-fill progress-fill-${tone}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel dashboard-card">
            <div className="section-head">
              <div>
                <h3>Upcoming</h3>
                <p>Don&apos;t miss these</p>
              </div>
            </div>
            <div className="upcoming-list">
              {[
                ['TUE', '17', 'Stripe · Recruiter screen', '10:00 AM · 30 min · Zoom', 'Prep ready', 'blue'],
                ['THU', '19', 'Linear · Hiring manager', '2:30 PM · 45 min', 'Prep due', 'amber'],
                ['MON', '23', 'Vercel · Final round', 'Onsite · SF or remote', 'Onsite', 'amber'],
              ].map(([day, date, title, meta, status, tone]) => (
                <div className="up-item" key={title}>
                  <div className="up-time">
                    <div className="up-day">{day}</div>
                    <div className="up-num">{date}</div>
                    {day === 'MON' ? <div className="up-dot" /> : null}
                  </div>
                  <div className="up-copy">
                    <div className="text-sm up-title">{title}</div>
                    <div className="text-xs text-muted up-meta">{meta}</div>
                  </div>
                  <span className={`pill ${tone}`}>{status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel dashboard-card market-intel">
            <div className="section-head">
              <div>
                <h3>Market intel</h3>
                <p>For your target roles</p>
              </div>
            </div>
            <div className="mi-trend">
              <div className="spread">
                <div className="text-sm market-role">Senior PM · Remote US</div>
                <span className="pill green market-change">+8.2%</span>
              </div>
              <div className="mi-num">
                $215k <span>median</span>
              </div>
              <svg viewBox="0 0 240 50" preserveAspectRatio="none" className="market-chart">
                <defs>
                  <linearGradient id="market-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97a1e" />
                    <stop offset="100%" stopColor="#fcd28a" />
                  </linearGradient>
                  <linearGradient id="market-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fcd28a" stopOpacity=".3" />
                    <stop offset="100%" stopColor="#fcd28a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,40 Q30,38 60,32 T120,22 T180,15 T240,8" fill="none" stroke="url(#market-line)" strokeWidth="2.5" />
                <path d="M0,40 Q30,38 60,32 T120,22 T180,15 T240,8 L240,50 L0,50 Z" fill="url(#market-fill)" />
              </svg>
            </div>
            <div className="divider" />
            <div>
              <div className="market-label">Hot skills this week</div>
              <div className="market-chips">
                <span className="pill amber">AI/ML product</span>
                <span className="pill lime">+34% demand</span>
                <span className="pill">Pricing</span>
                <span className="pill">Growth PM</span>
                <span className="pill lime">+18% demand</span>
                <span className="pill">B2B SaaS</span>
              </div>
            </div>
            <div className="divider" />
            <div>
              <div className="market-label">Hiring velocity (last 7d)</div>
              <div className="velocity-list">
                {[
                  ['Stripe', '+12', 'amber'],
                  ['Linear', '+8', 'lime'],
                  ['Vercel', '+6', 'blue'],
                  ['Anthropic', '+4', 'warn'],
                ].map(([company, count, tone]) => (
                  <div className="spread" key={company}>
                    <span className="velocity-company"><span className={`velocity-dot ${tone}`} />{company}</span>
                    <span className="mono text-xs">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
