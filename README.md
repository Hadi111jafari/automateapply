# AutomateApply

A Next.js MVP for authenticated job discovery, AI resume tailoring, and a
review-only application tracker. AutomateApply **never submits applications**
for you: you review each tailored draft, apply on the original listing, and
mark it applied here to keep your pipeline honest.

## Requirements

- Node.js (see `package.json` engines / LTS)
- A Supabase project (database, auth, and storage)
- `pdftotext` (poppler) and LibreOffice (`soffice`) on the PATH for PDF/DOCX
  resume text extraction. Unsupported or failed extractions surface a clear
  error in the UI; TXT and pasted text always work.

## Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<your project url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your anon key>   # or NEXT_PUBLIC_SUPABASE_ANON_KEY

# AI tailoring — at least one provider. OpenRouter example:
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=<key>
OPENROUTER_MODEL=<model id>        # optional

# Optional fallbacks / alternatives:
TOGETHER_BASE_URL / TOGETHER_API_KEY / TOGETHER_MODEL
GEMINI_BASE_URL / GEMINI_API_KEY / GEMINI_MODEL
AI_BASE_URL / AI_API_KEY / AI_MODEL   # generic OpenAI-compatible override
```

## Supabase migrations (run in order, SQL editor)

1. `supabase/schema.sql` — tables, RLS policies, private `resumes` bucket,
   profile auto-creation trigger.
2. `supabase/profile-auth-migration.sql` — profile columns for existing
   projects (idempotent).
3. `supabase/backfill-existing-profiles.sql` — backfills profile rows for
   users created before the trigger existed.
4. `supabase/tailored-materials-migration.sql` — tailored resume/cover-letter
   storage.

## Local setup

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # release check
npm run lint    # eslint
npx tsc --noEmit
```

## Demo mode vs real accounts

- **Real accounts** use Supabase auth. Every workspace route is protected on
  the server; signed-out visitors are redirected to `/login`. All data
  (profile, resumes, applications, tailored materials) is private per account
  via RLS.
- **Demo mode** ("Try Demo Account" on the login page) is a local-only
  showcase with Sarah's sample data. It creates no Supabase session and
  cannot call authenticated APIs. Fabricated demo widgets (live run, market
  intel, upcoming interviews) appear only in demo mode; real accounts see
  only data derived from their own records.
- Unfinished features are disabled in place — grayed out with a "Coming
  soon" tooltip (Market Intel, Messages, notifications, PDF download,
  account deletion, Grid/Map views, deal-breakers). Working exports:
  applications CSV (Applications header) and full-account JSON (Settings →
  Privacy).

## Manual QA checklist

1. Sign up with email confirmation enabled; confirm redirect, sign in, sign
   out, wrong password, and password validation all behave.
2. New account: profile row auto-created with email + safe display name;
   dashboard shows zero-state only; sidebar shows no fabricated counts.
3. Settings changes survive refresh and sign-out/sign-in.
4. Upload a resume (PDF/DOCX/TXT), reload, select it, tailor for a saved
   job, edit, save, reload — materials persist.
5. Two accounts: neither can list, download, or mutate the other's resumes,
   applications, or files (Storage RLS).
6. Job search: Jobicy/Himalayas success, no-results, and provider-failure
   states; save → tailor → open original listing → mark applied manually.
7. Applications: create/move stages, reject/restore; dashboard reflects the
   same data after refresh.
8. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass before every
   release candidate.
