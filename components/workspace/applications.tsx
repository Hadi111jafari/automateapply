'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, describeLoadError } from '@/lib/api-client';
import { useDemoMode } from '@/lib/demo-mode';
import type { ReactNode } from 'react';
import { ExternalLink, MoreHorizontal, X } from 'lucide-react';

type LogoTone = 'violet' | 'orange' | 'black' | 'coral' | 'blue' | 'plaid';
type ChipTone = 'accent' | 'info' | 'ok' | 'warn' | 'err' | 'neutral';
type ApplicationCard = {
  company: string;
  title: string;
  letter: string;
  tone: LogoTone;
  score: number;
  status: string;
  statusTone?: ChipTone;
  muted?: boolean;
  applicationId?: string;
};
type ApplicationColumn = {
  name: string;
  count: number;
  items: ApplicationCard[];
  final?: boolean;
  rejected?: boolean;
};

const logoBackgrounds: Record<LogoTone, string> = {
  violet: 'linear-gradient(135deg, #635bff, #4f63ff)',
  orange: 'linear-gradient(135deg, #cb6e1f, #de7c2b)',
  black: 'linear-gradient(135deg, #000, #434343)',
  coral: 'linear-gradient(135deg, #d97757, #c66949)',
  blue: 'linear-gradient(135deg, #4d8eff, #1d4ed8)',
  plaid: 'linear-gradient(135deg, #ff5e5e, #d93838)',
};

// Kanban order mirrors the Supabase stage enum. "offer" shares the final
// column; "rejected" lives apart so it never advances forward.
const STAGE_COLUMNS: Array<{
  name: string;
  chipName: string;
  stages: string[];
  final?: boolean;
  rejected?: boolean;
}> = [
  { name: 'Review', chipName: 'Saved', stages: ['review'] },
  { name: 'Applied', chipName: 'Applied', stages: ['applied'] },
  { name: 'Recruiter screen', chipName: 'Screen', stages: ['screen'] },
  { name: 'Technical', chipName: 'Tech', stages: ['technical'] },
  { name: 'Final / Offer', chipName: 'Final', stages: ['final', 'offer'], final: true },
  { name: 'Rejected', chipName: 'Rejected', stages: ['rejected'], rejected: true },
];

function stageChipTone(stage: string): ChipTone | undefined {
  if (stage === 'offer') return 'accent';
  if (stage === 'final') return 'warn';
  if (stage === 'technical') return 'warn';
  if (stage === 'screen') return 'info';
  if (stage === 'applied') return 'ok';
  if (stage === 'rejected') return 'err';
  return undefined;
}

function stageLabel(stage: string) {
  if (stage === 'review') return 'Needs review';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

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

const initialColumns: ApplicationColumn[] = [
  {
    name: 'Applied',
    count: 89,
    items: [
      { company: 'Anthropic', title: 'PM, API Platform', letter: 'A', tone: 'orange', score: 87, status: '3d ago' },
      { company: 'Ramp', title: 'Senior PM, Risk', letter: 'R', tone: 'blue', score: 72, status: '5d ago' },
      { company: 'Plaid', title: 'Senior PM, Growth', letter: 'P', tone: 'plaid', score: 79, status: '5d ago' },
      { company: 'Airbnb', title: 'Senior PM, Host', letter: 'A', tone: 'coral', score: 75, status: 'Rejected', statusTone: 'err', muted: true },
    ],
  },
  {
    name: 'Recruiter screen',
    count: 12,
    items: [
      { company: 'Stripe', title: 'Senior PM, Growth', letter: 'S', tone: 'violet', score: 96, status: 'Tue 10am', statusTone: 'info' },
      { company: 'Linear', title: 'Group PM, Platform', letter: 'L', tone: 'violet', score: 93, status: 'Awaiting', statusTone: 'warn' },
      { company: 'Notion', title: 'Senior PM, Enterprise', letter: 'N', tone: 'coral', score: 88, status: 'Screen done', statusTone: 'info' },
      { company: 'Figma', title: 'PM, Growth', letter: 'F', tone: 'violet', score: 84, status: '2d ago' },
    ],
  },
  {
    name: 'Technical',
    count: 5,
    items: [
      { company: 'Vercel', title: 'Director of Product, AI', letter: 'V', tone: 'black', score: 91, status: 'Take-home', statusTone: 'warn' },
      { company: 'Anthropic', title: 'PM, API', letter: 'A', tone: 'orange', score: 87, status: 'Round 2', statusTone: 'info' },
      { company: 'Stripe', title: 'PM, Capital', letter: 'S', tone: 'violet', score: 89, status: 'Onsite set', statusTone: 'ok' },
    ],
  },
  {
    name: 'Final / Offer',
    count: 3,
    final: true,
    items: [
      { company: 'Linear', title: 'Group PM, Platform', letter: 'L', tone: 'violet', score: 93, status: 'Offer out', statusTone: 'accent' },
      { company: 'Vercel', title: 'Director of Product, AI', letter: 'V', tone: 'black', score: 91, status: 'Onsite Mon', statusTone: 'accent' },
      { company: 'Figma', title: 'Senior PM', letter: 'F', tone: 'violet', score: 84, status: 'Final round', statusTone: 'warn' },
    ],
  },
];

const tableRows = [
  ['L', 'Linear', 'Group PM, Platform', 'Offer out', '93', '12d ago', 'Offer received · 2h', 'violet', 'accent'],
  ['V', 'Vercel', 'Director of Product, AI', 'Onsite set', '91', '14d ago', 'Onsite scheduled · 1d', 'black', 'accent'],
  ['S', 'Stripe', 'Senior PM, Growth', 'Screen', '96', '4d ago', 'Recruiter replied · 14m', 'violet', 'info'],
  ['A', 'Anthropic', 'PM, API Platform', 'Tech round', '87', '9d ago', 'Round 2 scheduled · 3d', 'orange', 'warn'],
  ['N', 'Notion', 'Senior PM, Enterprise', 'Screen', '88', '2d ago', 'Screen completed · 1d', 'coral', 'info'],
  ['F', 'Figma', 'PM, Growth', 'Screen', '84', '1d ago', 'Recruiter email · 4h', 'violet', 'info'],
  ['R', 'Ramp', 'Senior PM, Risk', 'Queued', '72', '3d ago', 'Follow-up sent · 1h', 'blue', 'neutral'],
  ['A', 'Airbnb', 'Senior PM, Host', 'Rejected', '75', '8d ago', 'Rejection · 3d', 'coral', 'err'],
] as const;

const timelineRows = [
  ['Today', '15:42', 'Stripe recruiter replied', 'Sarah Patel · "Let’s schedule a 30-min screen next week"', 'Action needed', 'info', '#d97a1e'],
  ['Today', '15:38', 'Applied to Linear · Group PM, Platform', 'Resume v12 · Cover letter: "Why Linear" tailored · Match 93%', 'Sent', 'ok', '#6dd49a'],
  ['Yesterday', '14:12', 'Vercel take-home assignment', '"Design a product spec for AI feature" · Due in 4 days', 'In progress', 'warn', '#f4b35a'],
  ['2d ago', '09:24', 'Linear · Offer received 🎉', '$245k base + 0.15% equity · Start date flexible · 4-year vest', 'Offer', 'accent', '#a9e631'],
  ['3d ago', '16:55', 'Anthropic · Round 2 scheduled', 'System design + product critique · 90 min · Prep materials generated', 'Scheduled', 'info', '#d97a1e'],
  ['5d ago', '11:30', 'Airbnb · Not moving forward', 'Generic rejection email · AI noted: "Stronger fit for B2B roles"', 'Rejected', 'err', '#e87070'],
] as const;

type ApplicationRecord = {
  id: string;
  company: string;
  title: string;
  match_score: number | null;
  stage: string;
  location: string;
  source_url: string;
  created_at: string;
  updated_at: string;
};

function buildColumns(records: ApplicationRecord[]): ApplicationColumn[] {
  return STAGE_COLUMNS.map((column) => ({
    name: column.name,
    count: 0,
    final: column.final,
    rejected: column.rejected,
    items: records
      .filter((record) => column.stages.includes(record.stage))
      .sort(
        (a, b) =>
          String(b.updated_at).localeCompare(String(a.updated_at)),
      )
      .map((record) => ({
        company: record.company,
        title: record.title,
        letter: record.company[0]?.toUpperCase() ?? '?',
        tone: 'violet' as LogoTone,
        score: record.match_score ?? 0,
        status: stageLabel(record.stage),
        statusTone: stageChipTone(record.stage),
        muted: record.stage === 'rejected',
        applicationId: record.id,
      })),
  }));
}

function CompanyLogo({ letter, tone, small = false }: { letter: string; tone: LogoTone; small?: boolean }) {
  return (
    <span
      className={`applications-logo${small ? ' small' : ''}`}
      style={{ background: logoBackgrounds[tone] }}
    >
      {letter}
    </span>
  );
}

function Chip({ children, tone = 'neutral', small = false }: { children: ReactNode; tone?: ChipTone; small?: boolean }) {
  return <span className={`applications-chip applications-chip-${tone}${small ? ' small' : ''}`}>{children}</span>;
}

export type TimelineEvent = {
  key: string;
  iso: string;
  dayLabel: string;
  timeLabel: string;
  title: ReactNode;
  detail: string;
  status: string;
  tone: ChipTone;
  color: string;
};

function buildTimeline(
  apps: ApplicationRecord[],
  materials: Array<{ application_id: string | null; updated_at: string }>,
): TimelineEvent[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dayLabel = (iso: string) => {
    const diff = Math.floor(
      (todayStart.getTime() - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000,
    );
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  type Draft = Omit<TimelineEvent, 'dayLabel' | 'timeLabel'>;
  const drafts: Draft[] = [];
  for (const app of apps) {
    drafts.push({
      key: `saved-${app.id}`,
      iso: app.created_at,
      title: (
        <>
          Saved <strong>{app.company}</strong> · {app.title}
        </>
      ),
      detail:
        app.match_score != null
          ? `${app.match_score}% match · ${app.location || 'Remote'}`
          : app.location || 'Remote',
      status: 'Saved',
      tone: 'ok',
      color: '#6dd49a',
    });
    if (app.stage !== 'review' && app.updated_at > app.created_at) {
      const label = stageLabel(app.stage);
      drafts.push({
        key: `stage-${app.id}`,
        iso: app.updated_at,
        title: (
          <>
            <strong>{app.company}</strong> moved to {label}
          </>
        ),
        detail: 'Stage updated from your pipeline board',
        status: label,
        tone: stageChipTone(app.stage) ?? 'neutral',
        color:
          app.stage === 'rejected'
            ? '#e87070'
            : ['final', 'offer'].includes(app.stage)
              ? '#a9e631'
              : '#d97a1e',
      });
    }
  }
  for (const material of materials) {
    if (!material.application_id) continue;
    const app = apps.find((item) => item.id === material.application_id);
    if (!app) continue;
    drafts.push({
      key: `materials-${app.id}`,
      iso: material.updated_at,
      title: (
        <>
          Tailored materials ready for <strong>{app.company}</strong>
        </>
      ),
      detail: 'Resume and cover letter saved for this application',
      status: 'Ready',
      tone: 'accent',
      color: '#f4b35a',
    });
  }
  // Timestamp labels are derived here (after data loads), keeping render pure.
  return drafts
    .sort((a, b) => b.iso.localeCompare(a.iso))
    .slice(0, 30)
    .map((draft) => ({
      ...draft,
      dayLabel: dayLabel(draft.iso),
      timeLabel: timeLabel(draft.iso),
    }));
}

export function Applications({ initialDemo = false }: { initialDemo?: boolean }) {
  const clientDemoMode = useDemoMode();
  // Server cookie flag OR client flag keeps the demo board stable even when
  // localStorage is unavailable (private modes, embedded preview frames).
  const demoMode = clientDemoMode || initialDemo;
  const [demoColumns, setDemoColumns] = useState<ApplicationColumn[]>(() => initialColumns.map((column) => ({ ...column, count: 0, items: [] })));
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(!demoMode);
  const [view, setView] = useState<'kanban' | 'table' | 'timeline'>('kanban');
  const [filter, setFilter] = useState(-1);
  const [selected, setSelected] = useState<string>();
  const [syncError, setSyncError] = useState<{ message: string; auth: boolean }>();
  const [draggingId, setDraggingId] = useState<string>();
  const [dragOverColumn, setDragOverColumn] = useState<number>();

  useEffect(() => {
    if (!selected) return;
    const timer = window.setTimeout(() => setSelected(undefined), 4_500);
    return () => window.clearTimeout(timer);
  }, [selected]);

  useEffect(() => {
    if (demoMode) { window.setTimeout(() => setDemoColumns(initialColumns), 0); return; }
    void Promise.all([
      apiFetch<{ applications: ApplicationRecord[] }>('/api/applications'),
      apiFetch<{ materials: Array<{ application_id: string | null; updated_at: string }> }>('/api/materials'),
    ])
      .then(([applicationData, materialData]) => {
        setRecords(applicationData.applications);
        setTimelineEvents(buildTimeline(applicationData.applications, materialData.materials));
      })
      .catch((error: unknown) => setSyncError(describeLoadError(error)))
      .finally(() => setLoading(false));
  }, [demoMode]);

  const columns = useMemo(
    () => (demoMode ? demoColumns : buildColumns(records)),
    [demoMode, demoColumns, records],
  );
  const total = demoMode ? 89 : records.length;
  const inMotion = demoMode
    ? 12
    : records.filter((record) => !['review', 'rejected'].includes(record.stage)).length;
  const visibleColumns = filter < 0 ? columns : [columns[filter]];
  const persistStage = async (
    applicationId: string,
    company: string,
    previousStage: string,
    nextStage: string,
  ) => {
    try {
      await apiFetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicationId, stage: nextStage }),
      });
      setSelected(company);
    } catch (error) {
      // Roll the optimistic move back so the board never lies.
      setRecords((current) =>
        current.map((record) =>
          record.id === applicationId
            ? { ...record, stage: previousStage }
            : record,
        ),
      );
      setSyncError(describeLoadError(error));
    }
  };

  const setApplicationStage = (applicationId: string | undefined, nextStage: string) => {
    if (!applicationId) return;
    const record = records.find((item) => item.id === applicationId);
    if (!record || record.stage === nextStage) return;
    setRecords((current) =>
      current.map((item) =>
        item.id === applicationId
          ? { ...item, stage: nextStage, updated_at: new Date().toISOString() }
          : item,
      ),
    );
    void persistStage(applicationId, record.company, record.stage, nextStage);
  };

  // Demo board moves, no backend involved: cards can be dragged to any
  // column (or clicked to advance one stage) exactly like a real account.
  const moveDemoTo = (fromColumn: number, itemIndex: number, toColumn: number) => {
    if (fromColumn === toColumn || toColumn < 0 || toColumn >= demoColumns.length) return;
    const next = demoColumns.map((column) => ({ ...column, items: [...column.items] }));
    const [card] = next[fromColumn].items.splice(itemIndex, 1);
    if (!card) return;
    if (toColumn > fromColumn) card.muted = false;
    if (next[toColumn].rejected) card.status = 'Rejected';
    else if (next[toColumn].final) card.status = 'Offer out';
    next[toColumn].items.unshift(card);
    setDemoColumns(next);
    setSelected(card.company);
  };

  // Demo interaction: clicking a card advances it one column forward.
  const moveDemo = (columnIndex: number, itemIndex: number) =>
    moveDemoTo(columnIndex, itemIndex, columnIndex + 1);

  return (
    <section className="applications-page">
      {!demoMode && !loading && !records.length ? (
        <div className="jobs-empty">
          <p className="display">No applications yet</p>
          <p>
            Save roles from Job Search to build your pipeline. Everything you
            track here stays private to your account.
          </p>
          <Link href="/jobs" className="amber-button mt-5 px-4 py-2">
            Find your first role
          </Link>
        </div>
      ) : (
        <>
          <section className="applications-filterbar">
            <div className="applications-filter-group">
              {demoMode
                ? ['All stages', 'Applied (89)', 'Screen (12)', 'Tech (5)', 'Final (2)', 'Offer (1)', 'Rejected (14)'].map((label, index) => (
                    <button key={label} type="button" className={`applications-filter-chip${index === 0 ? ' active' : ''}`}>
                      {label}
                    </button>
                  ))
                : [
                    { label: `All (${total})`, index: -1 },
                    ...STAGE_COLUMNS.slice(1).map((column, i) => ({
                      label: `${column.chipName} (${columns[i + 1].items.length})`,
                      index: i + 1,
                    })),
                  ].map((chip) => {
                    const isActive = filter === chip.index;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFilter(isActive ? -1 : chip.index)}
                        className={`applications-filter-chip${isActive ? ' active' : ''}`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
            </div>
            {!demoMode && (
              <div className="applications-filter-group secondary">
                <span className="applications-result-summary text-sm text-muted-foreground">
                  Updated live from your account
                </span>
              </div>
            )}
          </section>

          <div className="applications-results-toolbar">
            <p className="applications-result-summary">
              <strong>{total}</strong> total ·{' '}
              {demoMode ? '1 offer pending' : `${inMotion} in motion`}
            </p>
            <div className="applications-view-tabs" role="tablist" aria-label="Application views">
              {(['kanban', 'table', 'timeline'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={view === tab}
                  className={view === tab ? 'active' : ''}
                  onClick={() => setView(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {syncError && !syncError.auth && (
            <p className="mb-3 text-sm text-red-400">{syncError.message}</p>
          )}
          {syncError?.auth && (
            <p className="mb-3 text-sm text-muted-foreground">
              {syncError.message}{' '}
              <Link href="/login" className="underline underline-offset-4 hover:text-[#faf3e8]">
                Sign in
              </Link>
            </p>
          )}
          {loading && !demoMode && (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading your pipeline…</p>
          )}

          {view === 'kanban' && (!loading || demoMode) && (
            <section className="applications-kanban">
              {visibleColumns.map((column) => {
                const columnIndex = columns.indexOf(column);
                const isDropTarget = dragOverColumn === columnIndex;
                return (
                  <div
                    key={column.name}
                    className={`applications-kanban-column${column.final ? ' final' : ''}${column.rejected ? ' muted' : ''}`}
                    style={
                      isDropTarget && draggingId
                        ? { outline: '2px dashed #d97a1e', outlineOffset: '-4px', borderRadius: 14 }
                        : undefined
                    }
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      if (dragOverColumn !== columnIndex) setDragOverColumn(columnIndex);
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setDragOverColumn(undefined);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOverColumn(undefined);
                      const id = event.dataTransfer.getData('text/plain') || draggingId;
                      if (!id) return;
                      if (id.startsWith('demo:')) {
                        // Demo cards carry their board coordinates instead of
                        // an application id.
                        const [, fromColumn, itemIndex] = id.split(':').map(Number);
                        moveDemoTo(fromColumn, itemIndex, columnIndex);
                      } else {
                        const record = records.find((item) => item.id === id);
                        if (!record) return;
                        // Dropping anywhere in a column moves the card to that column's primary stage.
                        setApplicationStage(id, STAGE_COLUMNS[columnIndex].stages[0]);
                      }
                      setDraggingId(undefined);
                    }}
                  >
                    <h3>{column.name}<span>{column.items.length}</span></h3>
                    <div>
                      {column.items.map((card, itemIndex) => {
                        const record = records.find((item) => item.id === card.applicationId);
                        const cardKey = card.applicationId ?? `demo:${columnIndex}:${itemIndex}`;
                        return (
                          <div
                            key={cardKey}
                            className={`applications-kanban-card${card.muted ? ' muted' : ''}${draggingId === cardKey ? ' opacity-50' : ''}`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', cardKey);
                              event.dataTransfer.effectAllowed = 'move';
                              setDraggingId(cardKey);
                            }}
                            onDragEnd={() => setDraggingId(undefined)}
                            onClick={demoMode ? () => moveDemo(columnIndex, itemIndex) : undefined}
                            style={demoMode && columnIndex < columns.length - 1 ? { cursor: 'pointer' } : undefined}
                            title={demoMode ? 'Drag to another stage · or click to move forward' : 'Drag to another stage'}
                          >
                            <div className="applications-card-top">
                              <CompanyLogo letter={card.letter} tone={card.tone} small />
                              <span>{card.company}</span>
                              {!demoMode && (
                                <span className="ml-auto flex items-center gap-1">
                                  {!column.final && !column.rejected && (
                                    <button
                                      type="button"
                                      aria-label={`Move ${card.company} forward to ${STAGE_COLUMNS[columnIndex + 1]?.name}`}
                                      title={`Move forward → ${STAGE_COLUMNS[columnIndex + 1]?.name}`}
                                      className="grid size-5 place-items-center rounded-md text-[#948370] transition hover:bg-[#302b25] hover:text-[#f3a133]"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setApplicationStage(
                                          card.applicationId,
                                          STAGE_COLUMNS[columnIndex + 1].stages[0],
                                        );
                                      }}
                                    >
                                      →
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    aria-label={column.rejected ? `Restore ${card.company} to review` : `Reject ${card.company}`}
                                    title={column.rejected ? 'Restore to review queue' : 'Mark rejected'}
                                    className="grid size-5 place-items-center rounded-md text-[#948370] transition hover:bg-[#302b25] hover:text-[#f3a133]"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setApplicationStage(card.applicationId, column.rejected ? 'review' : 'rejected');
                                    }}
                                  >
                                    {column.rejected ? '↺' : <X size={12} />}
                                  </button>
                                </span>
                              )}
                            </div>
                            <p className="applications-card-role">{card.title}</p>
                            <div className="applications-card-foot">
                              {!demoMode && record && record.updated_at > record.created_at ? (
                                <Chip small>{relativeTime(record.updated_at)}</Chip>
                              ) : null}
                              {card.statusTone ? <Chip tone={card.statusTone} small>{card.status}</Chip> : <Chip small>{card.status}</Chip>}
                              <span className="applications-card-score">{card.score}</span>
                            </div>
                          </div>
                        );
                      })}
                      {!column.items.length && (
                        <p className="px-1 py-2 text-xs text-muted-foreground">
                          {demoMode
                            ? '—'
                            : column.rejected
                              ? 'Nothing rejected'
                              : 'Drag a card here'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {view === 'table' && demoMode && (
            <section className="applications-table-card">
              <div className="applications-table-scroll">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th className="applications-table-optional"><input aria-label="Select all applications" type="checkbox" /></th>
                      <th>Company</th><th>Role</th><th>Stage</th><th>Match</th>
                      <th className="applications-table-optional">Applied</th>
                      <th className="applications-table-optional">Last activity</th><th className="applications-table-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(([letter, company, role, stage, score, applied, activity, tone, chipTone]) => (
                      <tr key={`${company}-${role}`}>
                        <td className="applications-table-optional"><input aria-label={`Select ${company}`} type="checkbox" /></td>
                        <td><div className="applications-company-cell"><CompanyLogo letter={letter} tone={tone as LogoTone} small /><strong>{company}</strong></div></td>
                        <td className="muted-cell">{role}</td>
                        <td><Chip tone={chipTone as ChipTone}>{stage}</Chip></td>
                        <td><span className="applications-table-score">{score}</span></td>
                        <td className="muted-cell applications-table-optional">{applied}</td>
                        <td className="muted-cell applications-table-optional">{activity}</td>
                        <td className="applications-table-action"><button type="button" aria-label={`More actions for ${company}`} className="applications-more"><MoreHorizontal size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {view === 'table' && !demoMode && (
            <section className="applications-table-card">
              <div className="applications-table-scroll">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Company</th><th>Role</th><th>Stage</th><th>Match</th>
                      <th className="applications-table-optional">Updated</th><th className="applications-table-action" />
                    </tr>
                  </thead>
                  <tbody>
                    {[...records]
                      // The stage chips above filter this table too.
                      .filter((record) => filter < 0 || STAGE_COLUMNS[filter].stages.includes(record.stage))
                      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
                      .map((record) => (
                        <tr key={record.id}>
                          <td><div className="applications-company-cell"><CompanyLogo letter={record.company[0]?.toUpperCase() ?? '?'} tone="violet" small /><strong>{record.company}</strong></div></td>
                          <td className="muted-cell">{record.title}</td>
                          <td><Chip tone={stageChipTone(record.stage) ?? 'neutral'}>{stageLabel(record.stage)}</Chip></td>
                          <td><span className="applications-table-score">{record.match_score ?? '—'}</span></td>
                          <td className="muted-cell applications-table-optional">{relativeTime(record.updated_at)}</td>
                            <td className="applications-table-action">
                              <a href={record.source_url} target="_blank" rel="noreferrer" aria-label={`Open the original ${record.company} listing`} className="applications-more">
                                <ExternalLink size={15} />
                              </a>
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {view === 'timeline' && demoMode && (
            <section className="applications-timeline-card">
              <div className="applications-timeline-list">
                {timelineRows.map(([date, time, title, detail, status, tone, color]) => (
                  <article key={`${date}-${time}-${title}`} className="applications-timeline-item">
                    <div className="applications-timeline-time"><div>{date}</div><strong>{time}</strong></div>
                    <div className="applications-timeline-line" style={{ background: color }} />
                    <div className="applications-timeline-event" style={{ borderLeftColor: color }}>
                      <div className="applications-timeline-event-head"><div>{title}</div><Chip tone={tone as ChipTone}>{status}</Chip></div>
                      <p>{detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === 'timeline' && !demoMode && (
            timelineEvents.length ? (
              <section className="applications-timeline-card">
                <div className="applications-timeline-list">
                  {timelineEvents.map((event) => (
                    <article key={event.key} className="applications-timeline-item">
                      <div className="applications-timeline-time"><div>{event.dayLabel}</div><strong>{event.timeLabel}</strong></div>
                      <div className="applications-timeline-line" style={{ background: event.color }} />
                      <div className="applications-timeline-event" style={{ borderLeftColor: event.color }}>
                        <div className="applications-timeline-event-head"><div>{event.title}</div><Chip tone={event.tone}>{event.status}</Chip></div>
                        <p>{event.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <div className="jobs-empty">
                <p className="display">Nothing to show yet</p>
                <p>Saved roles and stage changes appear here as they happen.</p>
              </div>
            )
          )}

          {selected && view === 'kanban' && <p className="applications-move-message">Moved {selected} forward in your pipeline.</p>}
        </>
      )}
    </section>
  );
}
