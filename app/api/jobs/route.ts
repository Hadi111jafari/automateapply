import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  q: z.string().trim().max(80).default(''),
  location: z.string().trim().max(80).default(''),
  type: z
    .enum(['', 'full-time', 'contract', 'part-time', 'freelance'])
    .default(''),
  level: z.enum(['', 'senior']).default(''),
  remote: z
    .enum(['0', '1'])
    .default('0')
    .transform((value) => value === '1'),
  postedWithinDays: z.coerce
    .number()
    .int()
    .refine(
      (value) => [0, 1, 7, 30].includes(value),
      'Invalid posted-date filter.',
    )
    .default(0),
  minSalary: z.coerce.number().int().min(0).max(2_000_000).default(0),
  minScore: z.coerce.number().int().min(0).max(100).default(0),
});

type NormalizedJob = {
  sourceId: string;
  legacySourceId: string;
  source: 'Jobicy' | 'Himalayas';
  url: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  type: string;
  level: string;
  excerpt: string;
  tags: string[];
  postedAt: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salary: string;
  remote: boolean;
};

type Match = {
  score: number | null;
  reason: string;
  factors: Array<{ label: string; value: number; max: number }>;
};

const STOP_WORDS = new Set([
  'about',
  'after',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'have',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'their',
  'this',
  'to',
  'with',
  'will',
  'you',
  'your',
  'years',
  'experience',
  'work',
  'role',
  'team',
  'skills',
]);
const TERM_ALIASES: Record<string, string[]> = {
  developer: ['developer', 'engineer', 'engineering'],
  engineer: ['engineer', 'developer', 'engineering'],
  frontend: ['frontend', 'front-end', 'front end', 'ui', 'user interface'],
  'front-end': ['frontend', 'front-end', 'front end', 'ui', 'user interface'],
  fullstack: ['fullstack', 'full-stack', 'full stack'],
  'full-stack': ['fullstack', 'full-stack', 'full stack'],
  backend: ['backend', 'back-end', 'back end'],
  'back-end': ['backend', 'back-end', 'back end'],
};
// Free-text locations are resolved to one canonical slug, then each provider
// gets only the values it supports (verified against both APIs).
const GEO_ALIASES: Record<string, string> = {
  'united states': 'usa',
  us: 'usa',
  usa: 'usa',
  america: 'usa',
  'san francisco': 'usa',
  'new york': 'usa',
  canada: 'canada',
  uk: 'uk',
  'united kingdom': 'uk',
  england: 'uk',
  europe: 'europe',
  germany: 'germany',
  france: 'france',
  australia: 'australia',
  india: 'india',
  singapore: 'singapore',
  japan: 'japan',
  brazil: 'brazil',
  mexico: 'mexico',
  worldwide: '',
  anywhere: '',
  remote: '',
};

type ResolvedLocation = {
  /** Normalized text the user asked about ('' when none). */
  requested: string;
  /** Canonical country slug, '' = anywhere, null = unrecognized free text. */
  slug: string | null;
  /** Known name the text was corrected from, when prefix-fuzzy matched. */
  correctedFrom?: string;
};

function resolveLocation(raw: string): ResolvedLocation {
  const requested = normalize(raw);
  if (!requested || ['remote', 'anywhere', 'worldwide'].includes(requested))
    return { requested, slug: '' };
  const direct = GEO_ALIASES[requested];
  if (direct !== undefined) return { requested, slug: direct };
  // Tolerate common misspellings: match known names sharing a long prefix
  // ("austrailia" still resolves to australia instead of a 400).
  const fuzzy = Object.keys(GEO_ALIASES).find(
    (key) =>
      key.length >= 5 &&
      (key.startsWith(requested.slice(0, 5)) ||
        requested.startsWith(key.slice(0, 5))),
  );
  if (fuzzy !== undefined)
    return {
      requested,
      slug: GEO_ALIASES[fuzzy],
      correctedFrom: raw.trim(),
    };
  return { requested, slug: null };
}

// Capability checks verified against the live APIs on 2026-08-24:
// Himalayas rejects region groupings; Jobicy rejects some single countries.
const HIMALAYAS_COUNTRIES = new Set([
  'usa',
  'canada',
  'uk',
  'germany',
  'france',
  'australia',
  'india',
  'singapore',
  'japan',
  'brazil',
  'mexico',
]);
const JOBICY_GEOS = new Set([
  'usa',
  'canada',
  'uk',
  'europe',
  'germany',
  'france',
  'australia',
  'singapore',
  'japan',
  'brazil',
  'mexico',
]);

const cleanText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_/,-]+/g, ' ')
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const expandTerm = (term: string) => {
  const expanded = TERM_ALIASES[term] ?? [];
  return [term, ...expanded].filter(Boolean);
};
const words = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
const unique = <T>(values: T[]) => [...new Set(values)];
const typeSlug = (value: string) => normalize(value).replace(/ /g, '-');

function formatSalary(min: number | null, max: number | null, currency = '$') {
  if (!min) return 'Salary not listed';
  return `${currency}${min.toLocaleString()}${max ? `–${currency}${max.toLocaleString()}` : '+'}`;
}

async function fetchProviderJson(url: URL, provider: string) {
  let lastError = `${provider} did not respond.`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AutomateApply-MVP/0.1 (job discovery)',
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(12_000),
      });
      if (response.ok) return response.json() as Promise<unknown>;
      const body = await response.text().catch(() => '');
      lastError = `${provider} returned ${response.status}${body ? `: ${body}` : '.'} (url: ${url.href})`;
      // Retrying a bad client request or an explicit rate limit only adds load.
      if (response.status < 500 || attempt === 1) break;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lastError =
        msg === 'TimeoutError' ||
        (error instanceof DOMException && error.name === 'TimeoutError')
          ? `${provider} timed out. (url: ${url.href})`
          : `${provider} could not be reached. (${msg}) (url: ${url.href})`;
      if (attempt === 1) break;
    }
  }
  throw new Error(lastError);
}

async function getJobicyJobs(
  input: z.infer<typeof searchSchema>,
  resolved: ResolvedLocation,
) {
  const url = new URL('https://jobicy.com/api/v2/remote-jobs');
  url.searchParams.set('count', '50');
  if (resolved.slug && JOBICY_GEOS.has(resolved.slug))
    url.searchParams.set('geo', resolved.slug);
  if (input.q.length >= 3) url.searchParams.set('tag', input.q);
  const payload = (await fetchProviderJson(url, 'Jobicy')) as {
    jobs?: Array<Record<string, unknown>>;
  };
  return (payload.jobs ?? []).map((item): NormalizedJob => {
    const min = typeof item.salaryMin === 'number' ? item.salaryMin : null;
    const max = typeof item.salaryMax === 'number' ? item.salaryMax : null;
    const currency =
      typeof item.salaryCurrency === 'string' ? item.salaryCurrency : '$';
    const id = String(item.id ?? '');
    return {
      sourceId: `jobicy:${id}`,
      legacySourceId: id,
      source: 'Jobicy',
      url: String(item.url ?? ''),
      title: String(item.jobTitle ?? ''),
      company: String(item.companyName ?? ''),
      logo: typeof item.companyLogo === 'string' ? item.companyLogo : null,
      location: String(item.jobGeo ?? 'Remote'),
      type: Array.isArray(item.jobType)
        ? item.jobType.join(', ')
        : String(item.jobType ?? 'Not specified'),
      level: String(item.jobLevel ?? ''),
      excerpt: cleanText(String(item.jobExcerpt ?? item.jobDescription ?? '')),
      tags: Array.isArray(item.jobIndustry)
        ? item.jobIndustry.filter(
            (tag): tag is string => typeof tag === 'string',
          )
        : [],
      postedAt: typeof item.pubDate === 'string' ? item.pubDate : null,
      salaryMin: min,
      salaryMax: max,
      salary: formatSalary(min, max, currency === 'USD' ? '$' : currency),
      remote: true,
    };
  });
}

async function getHimalayasJobs(
  input: z.infer<typeof searchSchema>,
  resolved: ResolvedLocation,
) {
  const url = new URL('https://himalayas.app/jobs/api/search');
  if (input.q.length >= 3) url.searchParams.set('q', input.q);
  // Only send countries Himalayas validates; anything else stays worldwide
  // rather than failing the whole provider request with a 400.
  if (resolved.slug && HIMALAYAS_COUNTRIES.has(resolved.slug))
    url.searchParams.set('country', resolved.slug);
  if (input.level === 'senior') url.searchParams.set('seniority', 'Senior');
  if (input.type === 'full-time')
    url.searchParams.set('employment_type', 'Full Time');
  if (input.type === 'contract')
    url.searchParams.set('employment_type', 'Contractor');
  if (input.type === 'part-time')
    url.searchParams.set('employment_type', 'Part Time');
  url.searchParams.set('sort', 'recent');
  const payload = (await fetchProviderJson(url, 'Himalayas')) as {
    jobs?: Array<Record<string, unknown>>;
    data?: Array<Record<string, unknown>>;
  };
  const records = payload.jobs ?? payload.data ?? [];
  return records.map((item): NormalizedJob => {
    const min = typeof item.minSalary === 'number' ? item.minSalary : null;
    const max = typeof item.maxSalary === 'number' ? item.maxSalary : null;
    const currency = typeof item.currency === 'string' ? item.currency : '$';
    const id = String(item.guid ?? item.id ?? '');
    const restrictions = Array.isArray(item.locationRestrictions)
      ? item.locationRestrictions.filter(
          (location): location is string => typeof location === 'string',
        )
      : [];
    const categories = Array.isArray(item.categories)
      ? item.categories.filter(
          (category): category is string => typeof category === 'string',
        )
      : Array.isArray(item.category)
        ? item.category.filter(
            (category): category is string => typeof category === 'string',
          )
        : [];
    const seniority = Array.isArray(item.seniority)
      ? item.seniority
          .filter((level): level is string => typeof level === 'string')
          .join(', ')
      : String(item.seniority ?? '');
    const postedAt =
      typeof item.pubDate === 'number'
        ? new Date(item.pubDate * 1_000).toISOString()
        : typeof item.pubDate === 'string'
          ? item.pubDate
          : null;
    return {
      sourceId: `himalayas:${id}`,
      legacySourceId: id,
      source: 'Himalayas',
      url: String(item.applicationLink ?? item.url ?? ''),
      title: String(item.title ?? ''),
      company: String(item.companyName ?? ''),
      logo: typeof item.companyLogo === 'string' ? item.companyLogo : null,
      location: restrictions.length ? restrictions.join(', ') : 'Worldwide',
      type: String(item.employmentType ?? 'Not specified'),
      level: seniority,
      excerpt: cleanText(String(item.excerpt ?? item.description ?? '')),
      tags: categories,
      postedAt,
      salaryMin: min,
      salaryMax: max,
      salary: formatSalary(min, max, currency === 'USD' ? '$' : currency),
      remote: true,
    };
  });
}

// Every query word must be satisfied, but any alias of that word counts.
// ("frontend developer" needs one frontend-ish AND one developer-ish match,
// not every literal variant of both.)
function includesAllTerms(haystack: string, query: string) {
  const hay = normalize(haystack);
  const wordGroups = words(query).map((word) => unique(expandTerm(word)));
  if (!wordGroups.length) return true;
  return wordGroups.every((group) =>
    group.some((alias) => hay.includes(alias)),
  );
}

function isSenior(job: NormalizedJob) {
  return /\b(senior|sr\.?|lead|principal|staff|director|manager|head)\b/i.test(
    `${job.title} ${job.level}`,
  );
}

// Providers spell regions differently ("USA" vs "United States"), so a
// location match accepts any known spelling of the requested place.
const LOCATION_SYNONYMS: Record<string, string[]> = {
  usa: ['usa', 'united states', 'united states of america', 'america', 'us'],
};

function locationMatches(resolved: ResolvedLocation, jobLocation: string) {
  // Unrecognized free text already fell back to a worldwide provider search;
  // filtering locally by it would wrongly hide those results.
  if (!resolved.slug) return true;
  if (/(worldwide|anywhere|global)/.test(jobLocation)) return true;
  return unique([
    ...(LOCATION_SYNONYMS[resolved.slug] ?? []),
    resolved.slug,
  ]).some((place) => jobLocation.includes(normalize(place)));
}

function matchesFilters(
  job: NormalizedJob,
  input: z.infer<typeof searchSchema>,
  resolved: ResolvedLocation,
) {
  const searchable = normalize(
    `${job.title} ${job.company} ${job.excerpt} ${job.tags.join(' ')}`,
  );
  if (!includesAllTerms(searchable, input.q)) return false;
  if (input.type && !typeSlug(job.type).includes(input.type)) return false;
  if (input.level === 'senior' && !isSenior(job)) return false;
  if (input.remote && !job.remote) return false;
  if (input.minSalary && (!job.salaryMin || job.salaryMin < input.minSalary))
    return false;
  if (input.postedWithinDays) {
    const postedAt = job.postedAt ? new Date(job.postedAt).getTime() : NaN;
    if (
      !Number.isFinite(postedAt) ||
      postedAt < Date.now() - input.postedWithinDays * 86_400_000
    )
      return false;
  }
  return locationMatches(resolved, normalize(job.location));
}

function candidateSeniority(value: string) {
  if (/\b(executive|vp|vice president|chief)\b/i.test(value)) return 5;
  if (/\b(director|head)\b/i.test(value)) return 4;
  if (/\b(principal|staff|lead)\b/i.test(value)) return 3;
  if (/\b(senior|sr\.?)\b/i.test(value)) return 2;
  if (/\b(mid|intermediate)\b/i.test(value)) return 1;
  return 0;
}

function scoreJob(
  job: NormalizedJob,
  targetRoles: string[],
  resumeText: string,
  resolved: ResolvedLocation,
  minimumSalary: number | null,
): Match {
  const jobTitle = normalize(job.title);
  const jobText = normalize(
    `${job.title} ${job.excerpt} ${job.tags.join(' ')}`,
  );
  const roleWords = unique(targetRoles.flatMap(words));
  const roleGroups = roleWords.map((word) => unique(expandTerm(word)));
  const resumeTerms = unique(words(resumeText))
    .filter((term) => term.length > 3)
    .slice(0, 350);
  const hasSignals = roleGroups.length > 0 || resumeTerms.length > 0;
  if (!hasSignals)
    return {
      score: null,
      reason: 'Complete your profile or add a resume to calculate a match.',
      factors: [],
    };
  const factors: Match['factors'] = [];
  if (roleGroups.length) {
    const matched = roleGroups.filter((group) =>
      group.some((alias) => jobTitle.includes(alias)),
    ).length;
    const phraseMatch = targetRoles.some((role) =>
      jobTitle.includes(normalize(role)),
    );
    factors.push({
      label: 'Role',
      value: phraseMatch
        ? 35
        : Math.min(30, Math.round((matched / roleGroups.length) * 30)),
      max: 35,
    });
  }
  if (resumeTerms.length) {
    const overlap = unique(
      resumeTerms.filter((term) => jobText.includes(term)),
    ).length;
    factors.push({
      label: 'Resume keywords',
      value: Math.min(35, overlap * 3),
      max: 35,
    });
  }
  const candidateLevel = candidateSeniority(
    `${targetRoles.join(' ')} ${resumeText}`,
  );
  const jobLevel = candidateSeniority(`${job.title} ${job.level}`);
  if (candidateLevel && jobLevel)
    factors.push({
      label: 'Seniority',
      value: Math.abs(candidateLevel - jobLevel) <= 1 ? 15 : 4,
      max: 15,
    });
  if (resolved.slug)
    factors.push({
      label: 'Location',
      value: locationMatches(resolved, normalize(job.location)) ? 10 : 0,
      max: 10,
    });
  if (minimumSalary)
    factors.push({
      label: 'Salary',
      value:
        job.salaryMin && job.salaryMin >= minimumSalary
          ? 5
          : job.salaryMax && job.salaryMax >= minimumSalary
            ? 3
            : 0,
      max: 5,
    });
  const earned = factors.reduce((sum, factor) => sum + factor.value, 0);
  // Scores deliberately use a fixed 100-point scale. Missing profile data is
  // not treated as a match, so a partial profile cannot receive a misleading 100%.
  const score = Math.round(earned);
  const reason = factors.length
    ? factors
        .map((factor) => `${factor.label} ${factor.value}/${factor.max}`)
        .join(' · ')
    : 'Add preferences to calculate a match.';
  return { score, reason, factors };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = searchSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid job search.' },
      { status: 400 },
    );
  const incoming = parsed.data;
  const [profileResult, resumeResult] = await Promise.all([
    auth.supabase
      .from('profiles')
      .select('target_roles, locations, minimum_salary')
      .eq('id', auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from('resumes')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const profile = profileResult.data;
  const defaultQuery = profile?.target_roles?.[0] ?? '';
  const defaultLocation = profile?.locations?.[0] ?? '';
  const input = {
    ...incoming,
    q: incoming.q || defaultQuery,
    location: incoming.location || defaultLocation,
  };
  const resolved = resolveLocation(input.location);
  // Be transparent: unrecognized locations search worldwide instead of
  // failing providers, and fuzzy corrections are called out so the user
  // can fix their profile spelling.
  const locationNotice =
    resolved.slug === null
      ? `We don't recognize "${input.location.trim()}" as a country yet, so results include every location. Check the spelling in your profile or filters.`
      : resolved.correctedFrom
        ? `Showing results for "${resolved.slug}" based on your location "${resolved.correctedFrom}".`
        : '';
  const sourceResults = await Promise.allSettled([
    getJobicyJobs(input, resolved),
    getHimalayasJobs(input, resolved),
  ]);
  const jobs: NormalizedJob[] = [];
  const warnings: string[] = [];
  sourceResults.forEach((result, index) => {
    if (result.status === 'fulfilled') jobs.push(...result.value);
    else {
      const provider = index === 0 ? 'Jobicy' : 'Himalayas';
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : `${provider} is temporarily unavailable.`;
      console.warn('[jobs] provider unavailable', { provider, reason });
      warnings.push(`${provider}: ${reason}`);
    }
  });
  if (!jobs.length && warnings.length === sourceResults.length)
    return Response.json(
      {
        error: `No job source could be reached. ${warnings.join(' ')} Please try again shortly.`,
        warnings,
      },
      { status: 502 },
    );
  const seen = new Set<string>();
  const filtered = jobs
    .filter((job) => {
      if (
        !job.url ||
        !job.title ||
        !job.company ||
        !matchesFilters(job, input, resolved)
      )
        return false;
      const fingerprint = normalize(`${job.company} ${job.title}`);
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    })
    .map((job) => ({
      ...job,
      match: scoreJob(
        job,
        profile?.target_roles ?? [],
        resumeResult.data?.content ?? '',
        resolved,
        profile?.minimum_salary ?? null,
      ),
    }))
    .filter(
      (job) => !input.minScore || (job.match.score ?? 0) >= input.minScore,
    )
    .sort(
      (a, b) =>
        (b.match.score ?? -1) - (a.match.score ?? -1) ||
        String(b.postedAt).localeCompare(String(a.postedAt)),
    );
  const sources = sourceResults
    .map((r, i) =>
      r.status === 'fulfilled' ? (i === 0 ? 'Jobicy' : 'Himalayas') : null,
    )
    .filter(Boolean) as string[];
  return Response.json({
    jobs: filtered,
    meta: {
      effectiveQuery: input.q,
      effectiveLocation: input.location,
      usedProfileDefaults: !incoming.q || !incoming.location,
      locationNotice,
      warnings,
      sources,
    },
  });
}
