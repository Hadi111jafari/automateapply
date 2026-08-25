'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, Filter, LoaderCircle, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { useDemoMode } from '@/lib/demo-mode';

type Match = { score: number | null; reason: string };
type Job = {
  sourceId: string;
  legacySourceId: string;
  source: string;
  url: string;
  letter: string;
  company: string;
  title: string;
  score: number | null;
  scoreReason: string;
  location: string;
  salary: string;
  age: string;
  isNew: boolean;
  tags: string[];
  type: string;
  match: Match;
  postedAt?: string | null;
  level?: string;
  remote?: boolean;
  salaryMin?: number | null;
  excerpt?: string;
};
type SavedApplication = {
  id: string;
  source_id: string;
  source_url: string;
  company: string;
  title: string;
  location: string;
  match_score: number;
  stage: string;
  created_at: string;
};
type Filters = {
  location: string;
  remote: boolean;
  type: '' | 'full-time' | 'contract' | 'part-time' | 'freelance';
  level: '' | 'senior';
  minSalary: number;
  minScore: number;
  postedWithinDays: 0 | 1 | 7 | 30;
};
type MatchTab = 'all' | '90' | '80' | 'saved';

// Mirrors the locations the jobs API can resolve (GEO_ALIASES in
// app/api/jobs/route.ts). Anything else would search worldwide with a
// "not recognized" notice, so the dropdown only offers supported values.
const JOB_LOCATIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Europe',
  'Germany',
  'France',
  'Australia',
  'India',
  'Singapore',
  'Japan',
  'Brazil',
  'Mexico',
];

type JobsCachePayload = {
  query: string;
  location: string;
  allJobs: Job[];
  saved: Record<string, SavedApplication>;
  applicationRecords: SavedApplication[];
  materialApplicationIds: Set<string>;
  at: number;
};

// Session cache so revisiting Job Search reuses the last provider results
// (quick chips keep filtering them locally) instead of refetching on every
// visit. An explicit Search or Reset always fetches fresh and rewrites this.
const JOBS_CACHE_TTL = 5 * 60 * 1000;
let jobsCache: JobsCachePayload | null = null;

// Both providers live behind external networks, so a momentary connection
// blip can fail every source at once. Retry the initial load quietly once
// before surfacing an error; the prefix matches the API's all-sources-down
// message from app/api/jobs/route.ts.
const JOBS_RETRY_DELAY_MS = 1_000;
const ALL_SOURCES_DOWN_PREFIX = 'No job source could be reached';

function readJobsCache(query: string): JobsCachePayload | null {
  if (
    !jobsCache ||
    jobsCache.query !== query ||
    Date.now() - jobsCache.at >= JOBS_CACHE_TTL
  ) {
    return null;
  }
  return jobsCache;
}

function writeJobsCache(payload: Omit<JobsCachePayload, 'at'>) {
  jobsCache = { ...payload, at: Date.now() };
}

function syncJobsCache(
  next: Pick<JobsCachePayload, 'saved' | 'applicationRecords'>,
) {
  if (jobsCache) {
    jobsCache.saved = next.saved;
    jobsCache.applicationRecords = next.applicationRecords;
  }
}

const demoJobs: Job[] = [
  {
    sourceId: 'demo:1',
    legacySourceId: '1',
    source: 'Demo',
    url: 'https://jobicy.com',
    letter: 'S',
    company: 'Stripe',
    title: 'Senior Product Manager, Growth',
    score: 96,
    scoreReason: 'Sarah’s prepared demo match',
    location: 'Remote (US)',
    salary: '$210k–$280k + equity',
    age: '4h ago',
    isNew: true,
    tags: ['Growth', 'B2B SaaS', 'Full-time'],
    type: 'Full-time',
    match: { score: 96, reason: 'Sarah’s prepared demo match' },
  },
  {
    sourceId: 'demo:2',
    legacySourceId: '2',
    source: 'Demo',
    url: 'https://jobicy.com',
    letter: 'L',
    company: 'Linear',
    title: 'Group Product Manager, Platform',
    score: 93,
    scoreReason: 'Sarah’s prepared demo match',
    location: 'Remote',
    salary: '$200k–$260k + equity',
    age: '12h ago',
    isNew: true,
    tags: ['Platform', 'Developer tools', 'Full-time'],
    type: 'Full-time',
    match: { score: 93, reason: 'Sarah’s prepared demo match' },
  },
  {
    sourceId: 'demo:3',
    legacySourceId: '3',
    source: 'Demo',
    url: 'https://jobicy.com',
    letter: 'V',
    company: 'Vercel',
    title: 'Director of Product, AI',
    score: 91,
    scoreReason: 'Sarah’s prepared demo match',
    location: 'SF / Remote',
    salary: '$240k–$310k + equity',
    age: '1d ago',
    isNew: false,
    tags: ['AI/ML', 'Infrastructure', 'Full-time'],
    type: 'Full-time',
    match: { score: 91, reason: 'Sarah’s prepared demo match' },
  },
];

const logoColor = (company: string) => {
  const colors = [
    '#635bff',
    '#4f63ff',
    '#d97757',
    '#cb6e1f',
    '#a259ff',
    '#1d4ed8',
  ];
  return colors[
    company
      .split('')
      .reduce((sum, character) => sum + character.charCodeAt(0), 0) %
      colors.length
  ];
};

function JobLogo({ job }: { job: Job }) {
  return (
    <span
      className="jobs-logo"
      style={{
        background: `linear-gradient(135deg, ${logoColor(job.company)}, #322e2a)`,
      }}
    >
      {job.letter}
    </span>
  );
}

function age(value: string | null) {
  if (!value) return 'Recently';
  const milliseconds = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return 'Recently';
  const hours = Math.floor(milliseconds / 3_600_000);
  return hours < 1
    ? 'Just posted'
    : hours < 24
      ? `${hours}h ago`
      : `${Math.floor(hours / 24)}d ago`;
}

function jobStatus(saved: SavedApplication | undefined, hasMaterials: boolean) {
  if (saved?.stage === 'applied') return 'Applied';
  if (saved && hasMaterials) return 'Tailored';
  if (saved) return 'Queued';
  return 'Needs review';
}

function isNew(postedAt: string) {
  const date = new Date(postedAt).getTime();
  return Number.isFinite(date) && date >= Date.now() - 24 * 60 * 60 * 1000;
}

export function Jobs() {
  const demoMode = useDemoMode();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() ?? '';
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    location: '',
    remote: false,
    type: '',
    level: '',
    minSalary: 0,
    minScore: 0,
    postedWithinDays: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [saved, setSaved] = useState<Record<string, SavedApplication>>({});
  const [applicationRecords, setApplicationRecords] = useState<
    SavedApplication[]
  >([]);
  const [materialApplicationIds, setMaterialApplicationIds] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [moreOpen, setMoreOpen] = useState(false);
  const [matchTab, setMatchTab] = useState<MatchTab>('all');
  // StrictMode runs mount effects twice in dev; remember the query the mount
  // effect already loaded so providers are not hit twice per page view.
  const autoLoadedQuery = useRef<string | null>(null);
  // Non-null while a silent retry of a failed initial load is scheduled.
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadJobs = async (
    nextQuery: string,
    nextFilters: Filters,
    useDefaults = false,
    allowRetry = useDefaults,
  ) => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    setLoading(true);
    setError(undefined);
    setNotice(undefined);
    const params = new URLSearchParams();
    // Only send the user-visible search and location to providers.
    // Quick filter chips (type, level, minSalary, minScore, postedWithinDays)
    // are applied locally to avoid repeated provider requests.
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextFilters.location.trim())
      params.set('location', nextFilters.location.trim());
    try {
      const [jobData, applicationData, materialData] = await Promise.all([
        apiFetch<{
          jobs: Array<{
            sourceId: string;
            legacySourceId: string;
            source: string;
            url: string;
            title: string;
            company: string;
            location: string;
            salary: string;
            postedAt: string | null;
            tags: string[];
            type: string;
            match: Match;
            level?: string;
            remote?: boolean;
            salaryMin?: number | null;
            excerpt?: string;
          }>;
          meta: {
            effectiveQuery: string;
            effectiveLocation: string;
            locationNotice?: string;
            warnings: string[];
          };
        }>(`/api/jobs?${params.toString()}`),
        apiFetch<{ applications: SavedApplication[] }>('/api/applications'),
        apiFetch<{ materials: Array<{ application_id: string | null }> }>(
          '/api/materials',
        ),
      ]);
      const full = jobData.jobs.map((job) => ({
        ...job,
        letter: job.company[0]?.toUpperCase() ?? '?',
        score: job.match.score,
        scoreReason: job.match.reason,
        age: age(job.postedAt),
        isNew: isNew(job.postedAt ?? ''),
      }));
      setAllJobs(full);
      setJobs(applyLocalFilters(full, nextFilters));
      const applications = Object.fromEntries(
        applicationData.applications.flatMap((item) => [
          [item.source_id, item],
          ...(item.source_id.startsWith('jobicy:')
            ? [[item.source_id.slice('jobicy:'.length), item]]
            : []),
        ]),
      );
      setSaved(applications);
      setApplicationRecords(applicationData.applications);
      setMaterialApplicationIds(
        new Set(
          materialData.materials.flatMap((item) =>
            item.application_id ? [item.application_id] : [],
          ),
        ),
      );
      writeJobsCache({
        query: nextQuery,
        location: nextFilters.location,
        allJobs: full,
        saved: applications,
        applicationRecords: applicationData.applications,
        materialApplicationIds: new Set(
          materialData.materials.flatMap((item) =>
            item.application_id ? [item.application_id] : [],
          ),
        ),
      });
      if (useDefaults) {
        if (!nextQuery && jobData.meta.effectiveQuery)
          setQuery(jobData.meta.effectiveQuery);
        if (!nextFilters.location && jobData.meta.effectiveLocation)
          setFilters((current) => ({
            ...current,
            location: jobData.meta.effectiveLocation,
          }));
      }
      if (jobData.meta.locationNotice) {
        console.warn('Jobs location notice:', jobData.meta.locationNotice);
        setNotice(jobData.meta.locationNotice);
      }
      if (jobData.meta.warnings.length) {
        // Log detailed warnings to the browser console and show a short toast.
        console.warn('Jobs provider warnings:', jobData.meta.warnings);
        toast.error(
          'Some providers were unavailable. Showing results from available sources.',
        );
        setNotice(
          'Some providers were unavailable. Showing results from available sources.',
        );
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Could not load jobs.';
      console.error('Jobs load error:', cause);
      if (allowRetry && message.startsWith(ALL_SOURCES_DOWN_PREFIX)) {
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          void loadJobs(nextQuery, nextFilters, useDefaults, false);
        }, JOBS_RETRY_DELAY_MS);
        return;
      }
      toast.error(message);
      setJobs([]);
      setError(message);
    } finally {
      // A retry is about to run; keep showing the loading state until then.
      if (!retryTimer.current) setLoading(false);
    }
  };

  // Quick chips re-filter the server results locally. Location is not part of
  // this pass: the API already applied the effective search location, and
  // provider spellings ("United States" vs "USA") would wrongly hide matches.
  const applyLocalFilters = (jobList: Job[], currentFilters: Filters) =>
    jobList.filter((job) => {
      if (currentFilters.remote && !job.remote) return false;
      if (
        currentFilters.type &&
        !job.type.toLowerCase().includes(currentFilters.type)
      )
        return false;
      if (currentFilters.level === 'senior') {
        if (
          !/\b(senior|sr\.?|lead|principal|staff|director|manager|head)\b/i.test(
            `${job.title} ${job.level ?? ''}`,
          )
        )
          return false;
      }
      if (currentFilters.minSalary) {
        const min = job.salaryMin;
        if (!min || min < currentFilters.minSalary) return false;
      }
      if (
        currentFilters.minScore &&
        (job.score ?? -1) < currentFilters.minScore
      )
        return false;
      if (currentFilters.postedWithinDays) {
        const posted = job.postedAt ? new Date(job.postedAt).getTime() : NaN;
        if (
          !Number.isFinite(posted) ||
          posted < Date.now() - currentFilters.postedWithinDays * 86_400_000
        )
          return false;
      }
      return true;
    });

  useEffect(() => {
    if (demoMode) {
      window.setTimeout(() => {
        setJobs(demoJobs);
        setLoading(false);
      }, 0);
      return;
    }
    if (autoLoadedQuery.current === urlQuery) return;
    autoLoadedQuery.current = urlQuery;
    const cached = readJobsCache(urlQuery);
    window.setTimeout(() => {
      setQuery(urlQuery);
      if (
        cached &&
        cached.query === urlQuery &&
        Date.now() - cached.at < JOBS_CACHE_TTL
      ) {
        // Reuse the last provider results; quick chips filter locally.
        setAllJobs(cached.allJobs);
        setJobs(applyLocalFilters(cached.allJobs, filters));
        setSaved(cached.saved);
        setApplicationRecords(cached.applicationRecords);
        setMaterialApplicationIds(cached.materialApplicationIds);
        // Keep the country filter coherent with the cached results.
        if (cached.location) setFilters((current) => ({ ...current, location: cached.location }));
        setLoading(false);
        return;
      }
      void loadJobs(urlQuery, filters, true);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, urlQuery]);

  const applyFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value } as Filters;
    setFilters(next);
    // Only re-run providers when the effective search or location changes.
    // Quick filter chips should be applied locally to avoid repeated provider requests.
    if (key === 'location') {
      if (!demoMode) void loadJobs(query, next);
    } else {
      setJobs(applyLocalFilters(allJobs, next));
    }
  };
  const search = () => {
    if (!demoMode) void loadJobs(query, filters);
  };
  const reset = () => {
    const next: Filters = {
      location: '',
      remote: false,
      type: '',
      level: '',
      minSalary: 0,
      minScore: 0,
      postedWithinDays: 0,
    };
    setQuery('');
    setFilters(next);
    setMatchTab('all');
    if (!demoMode) void loadJobs('', next, true);
  };
  const saveForReview = async (job: Job) => {
    if (demoMode) {
      setSaved((items) => ({
        ...items,
        [job.sourceId]: {
          id: job.sourceId,
          source_id: job.sourceId,
          source_url: job.url,
          company: job.company,
          title: job.title,
          location: job.location,
          match_score: job.score ?? 0,
          stage: 'review',
          created_at: new Date().toISOString(),
        },
      }));
      return;
    }
    setSavingId(job.sourceId);
    setError(undefined);
    setNotice(undefined);
    try {
      const { application } = await apiFetch<{ application: SavedApplication }>(
        '/api/applications',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: job.sourceId,
            sourceUrl: job.url,
            company: job.company,
            title: job.title,
            score: job.score ?? 0,
            location: job.location,
            // Kept as tailoring context for the Resume & AI workspace.
            notes: (job.excerpt ?? '').slice(0, 2_000),
          }),
        },
      );
      const nextSaved = {
        ...saved,
        [job.sourceId]: application,
        [job.legacySourceId]: application,
      };
      const nextRecords = [
        application,
        ...applicationRecords.filter((item) => item.id !== application.id),
      ];
      setSaved(nextSaved);
      setApplicationRecords(nextRecords);
      syncJobsCache({ saved: nextSaved, applicationRecords: nextRecords });
      setNotice(`${job.company} was saved to your review queue.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save this job.',
      );
    } finally {
      setSavingId(undefined);
    }
  };
  const markApplied = async (job: Job, application: SavedApplication) => {
    if (demoMode) {
      setSaved((items) => ({
        ...items,
        [job.sourceId]: { ...application, stage: 'applied' },
      }));
      return;
    }
    setSavingId(job.sourceId);
    setError(undefined);
    setNotice(undefined);
    try {
      const { application: updated } = await apiFetch<{
        application: SavedApplication;
      }>('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, stage: 'applied' }),
      });
      const nextSaved = {
        ...saved,
        [job.sourceId]: updated,
        [job.legacySourceId]: updated,
      };
      const nextRecords = applicationRecords.map((item) =>
        item.id === updated.id ? updated : item,
      );
      setSaved(nextSaved);
      setApplicationRecords(nextRecords);
      syncJobsCache({ saved: nextSaved, applicationRecords: nextRecords });
      setNotice(
        `Marked ${job.company} as applied. AutomateApply did not submit an application for you.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not update this application.',
      );
    } finally {
      setSavingId(undefined);
    }
  };

  const savedJobs = demoMode
    ? jobs.filter((job) => saved[job.sourceId])
    : applicationRecords.map((application) => {
        const canonicalSourceId = application.source_id.includes(':')
          ? application.source_id
          : `jobicy:${application.source_id}`;
        const existing = jobs.find(
          (job) =>
            job.sourceId === canonicalSourceId ||
            job.legacySourceId === application.source_id,
        );
        if (existing) return existing;
        return {
          sourceId: canonicalSourceId,
          legacySourceId: application.source_id.replace(/^jobicy:/, ''),
          source: application.source_id.startsWith('himalayas:')
            ? 'Himalayas'
            : 'Jobicy',
          url: application.source_url,
          letter: application.company[0]?.toUpperCase() ?? '?',
          company: application.company,
          title: application.title,
          score: application.match_score,
          scoreReason:
            'Saved match score. Search again to recalculate using your current profile and resume.',
          location: application.location,
          salary: 'Salary not listed',
          age: age(application.created_at),
          isNew: false,
          tags: [],
          type: 'Saved job',
          match: {
            score: application.match_score,
            reason: 'Saved match score.',
          },
        };
      });
  const visibleJobs = (matchTab === 'saved' ? savedJobs : jobs).filter(
    (job) => {
      if (matchTab === '90') return (job.score ?? -1) >= 90;
      if (matchTab === '80') return (job.score ?? -1) >= 80;
      return true;
    },
  );

  return (
    <section className="jobs-page">
      <form
        className="jobs-filterbar jobs-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label className="jobs-field">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Frontend Engineer"
            aria-label="Detailed job search"
            className="jobs-query-input"
          />
        </label>
        <button
          type="button"
          onClick={() => applyFilter('remote', !filters.remote)}
          className={`jobs-filter-chip${filters.remote ? ' active' : ''}`}
        >
          Remote
        </button>
          <button
            type="button"
            onClick={() =>
              applyFilter('type', filters.type === 'full-time' ? '' : 'full-time')
            }
            className={`jobs-filter-chip${filters.type === 'full-time' ? ' active' : ''}`}
          >
            Full-time
          </button>
          <button
            type="button"
            onClick={() =>
              applyFilter('level', filters.level === 'senior' ? '' : 'senior')
            }
            className={`jobs-filter-chip${filters.level === 'senior' ? ' active' : ''}`}
          >
            Senior level
          </button>
          <button
            type="button"
            onClick={() =>
              applyFilter('minSalary', filters.minSalary === 120000 ? 0 : 120000)
            }
            className={`jobs-filter-chip${filters.minSalary === 120000 ? ' active' : ''}`}
          >
            $120k+
          </button>
          <button
            type="button"
            onClick={() =>
              applyFilter('minScore', filters.minScore === 75 ? 0 : 75)
            }
            className={`jobs-filter-chip${filters.minScore === 75 ? ' active' : ''}`}
          >
            75%+ match
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            className={`ghost-button jobs-more-filters${moreOpen ? ' active' : ''}`}
          >
            <Filter size={14} /> More filters
          </button>
          <button
            type="submit"
            className="amber-button px-4 py-2 text-sm"
            disabled={loading}
          >
            {loading && <LoaderCircle size={14} className="animate-spin" />}{' '}
            Search
          </button>
      </form>
      {moreOpen && (
        <section
          className="jobs-advanced-filters"
          aria-label="More job filters"
        >
          <label>
            Country
            <select
              value={filters.location}
              onChange={(event) => applyFilter('location', event.target.value)}
            >
              <option value="">Any location</option>
              {JOB_LOCATIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
              {/* Profile-derived or legacy locations that are not in the
                  known list still render so the select never lies. */}
              {filters.location && !JOB_LOCATIONS.includes(filters.location) ? (
                <option value={filters.location}>{filters.location}</option>
              ) : null}
            </select>
          </label>
          <label>
            Employment type
            <select
              value={filters.type}
              onChange={(event) =>
                applyFilter('type', event.target.value as Filters['type'])
              }
            >
              <option value="">Any type</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
              <option value="freelance">Freelance</option>
            </select>
          </label>
          <label>
            Minimum listed salary
            <select
              value={filters.minSalary}
              onChange={(event) =>
                applyFilter('minSalary', Number(event.target.value))
              }
            >
              <option value="0">Any salary</option>
              <option value="80000">$80k+</option>
              <option value="120000">$120k+</option>
              <option value="160000">$160k+</option>
              <option value="200000">$200k+</option>
            </select>
          </label>
          <label>
            Minimum match
            <select
              value={filters.minScore}
              onChange={(event) =>
                applyFilter('minScore', Number(event.target.value))
              }
            >
              <option value="0">Any match</option>
              <option value="60">60%+</option>
              <option value="75">75%+</option>
              <option value="90">90%+</option>
            </select>
          </label>
          <label>
            Posted
            <select
              value={filters.postedWithinDays}
              onChange={(event) =>
                applyFilter(
                  'postedWithinDays',
                  Number(event.target.value) as Filters['postedWithinDays'],
                )
              }
            >
              <option value="0">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
          <button
            type="button"
            onClick={reset}
            className="ghost-button px-4 py-2 text-sm"
          >
            Reset search
          </button>
          <p>
            Jobicy and Himalayas are searched now. Each result preserves its
            source and opens the original application outside AutomateApply.
          </p>
        </section>
      )}
      <div className="jobs-results-toolbar">
        <p className="jobs-result-summary">
          <strong>{visibleJobs.length}</strong> matching · sorted by{' '}
          <b>your match</b>
        </p>
        <div className="jobs-view-controls">
          <div className="jobs-tabs" role="tablist" aria-label="Match filters">
            {(
              [
                ['all', 'All'],
                ['90', '90%+'],
                ['80', '80%+'],
                ['saved', 'Saved'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={matchTab === value}
                onClick={() => setMatchTab(value)}
                className={matchTab === value ? 'active' : ''}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="jobs-tabs jobs-layout-tabs" aria-label="Job layout">
            <button type="button" className="active">
              List
            </button>
            <button type="button" disabled title="Coming soon">
              Grid
            </button>
            <button type="button" disabled title="Coming soon">
              Map
            </button>
          </div>
        </div>
      </div>
      <div className="jobs-list">
        {visibleJobs.map((job) => {
          const application =
            saved[job.sourceId] ??
            (job.source === 'Jobicy' ? saved[job.legacySourceId] : undefined);
          const hasMaterials = Boolean(
            application && materialApplicationIds.has(application.id),
          );
          const status = jobStatus(application, hasMaterials);
          const isApplied = application?.stage === 'applied';
          return (
            <article key={job.sourceId} className="jobs-job-row">
              <JobLogo job={job} />
              <div className="jobs-job-copy">
                <div className="jobs-job-heading">
                  <h2>{job.title}</h2>
                  {job.isNew && (
                    <span className="jobs-chip jobs-chip-accent jobs-new">
                      NEW
                    </span>
                  )}
                  <span className="jobs-chip jobs-source">{job.source}</span>
                </div>
                <p className="jobs-job-meta">
                  <strong>{job.company}</strong>
                  <span className="jobs-meta-piece">
                    <span className="jobs-meta-dot" />
                    {job.location}
                  </span>
                  <span className="jobs-meta-piece">
                    <span className="jobs-meta-dot" />
                    {job.salary}
                  </span>
                  <span className="jobs-meta-piece">
                    <span className="jobs-meta-dot" />
                    {job.age}
                  </span>
                </p>
                <div className="jobs-job-tags">
                  {Array.from(new Set([job.type, ...job.tags].filter(Boolean)))
                    .slice(0, 5)
                    .map((tag) => (
                      <span
                        key={`${job.sourceId}-${tag}`}
                        className="jobs-chip"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <p className="jobs-match-explanation">
                  {job.score === null
                    ? 'Match unavailable — add a target role or resume to enable it.'
                    : job.scoreReason}
                </p>
              </div>
              <span
                className={`jobs-chip jobs-status jobs-status-${status.toLowerCase().replaceAll(' ', '-')}`}
              >
                {status}
              </span>
              <div className="jobs-score" title={job.scoreReason}>
                <strong
                  className={
                    job.score !== null && job.score >= 75 ? 'high' : ''
                  }
                >
                  {job.score === null ? '—' : `${job.score}%`}
                </strong>
                <span>match</span>
              </div>
              <div className="jobs-card-actions">
                {!application ? (
                  <button
                    type="button"
                    disabled={savingId === job.sourceId}
                    onClick={() => void saveForReview(job)}
                    className="amber-button jobs-action"
                  >
                    {savingId === job.sourceId ? 'Saving…' : 'Save for review'}
                  </button>
                ) : !hasMaterials ? (
                  <Link
                    href={`/resume?application=${encodeURIComponent(application.id)}`}
                    className="amber-button jobs-action"
                  >
                    Tailor application
                  </Link>
                ) : (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="amber-button jobs-action"
                  >
                    Apply on {job.source} <ExternalLink size={13} />
                  </a>
                )}
                {application && !isApplied && (
                  <button
                    type="button"
                    disabled={savingId === job.sourceId}
                    onClick={() => void markApplied(job, application)}
                    className="jobs-mark-applied"
                  >
                    Mark applied manually
                  </button>
                )}
                {isApplied && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="jobs-mark-applied"
                  >
                    View listing <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {loading && !demoMode && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Searching Jobicy and Himalayas…
        </p>
      )}
      {!loading && !visibleJobs.length && !error && (
        <div className="jobs-empty">
          <p className="display">No matching opportunities</p>
          <p>
            Try another title or skill, broaden your location, clear a filter,
            or switch back to All results.
          </p>
          <button
            type="button"
            onClick={reset}
            className="ghost-button mt-5 px-4 py-2"
          >
            Clear search and filters
          </button>
        </div>
      )}
      {error && (
        <div className="jobs-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={search}
            className="ghost-button mt-3 px-3 py-2"
          >
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}
      {notice && <p className="jobs-notice">{notice}</p>}
    </section>
  );
}
