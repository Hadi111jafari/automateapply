# Functional MVP Tracker

This is the source of truth for reaching a launchable closed-beta MVP. Update a checkbox only after its acceptance checks pass.

Legend: `[x]` done · `[~]` partial/in progress · `[ ]` not started · `[!]` blocked

## Launch definition

A real user can create and confirm an account, complete a profile, provide a resume, discover jobs, create/edit/save AI-tailored materials, add a job to a review queue, track the application, and see that same real data on the dashboard. Sarah’s demo remains local-only and never uses Supabase.

## Current status

- [~] Supabase email/password authentication — sign-up and sign-in work; production-grade server-side route protection remains.
- [~] Demo versus real-account separation — local demo mode exists; verify every route and all user-visible data after final integration.
- [x] Supabase schema and RLS — applied manually; profile auto-creation migration applied on 2026-08-22.
- [x] Production build — verified successfully by the user on 2026-08-21; Turbopack workspace-root warning removed in configuration.
- [ ] End-to-end real-user workflow — no complete journey currently exists.

## P0 — launch blockers

### 1. Build and secure real-account access

- [x] Resolve the stuck production build and confirm `npm run build` exits successfully.
- [x] Add server-side Supabase cookie/session handling.
- [x] Protect all workspace routes on the server; redirect unauthenticated non-demo visitors to `/login` before rendering workspace content.
- [x] Preserve the local Sarah demo path without creating a Supabase session or allowing it to call authenticated APIs.

Acceptance: production build succeeds; opening `/dashboard`, `/jobs`, `/applications`, `/resume`, or `/settings` while signed out redirects to login; a signed-in user can access their workspace; demo remains usable offline from the login page.

### 2. Finish profile and preferences

- [x] Run `supabase/profile-auth-migration.sql` in the existing Supabase project.
- [~] Verify new sign-ups receive a `profiles` row with their email and a safe default display name. *(User verification pending.)*
- [x] Load the profile once for real accounts and show it consistently in sidebar, page title, and Settings. Resume identity remains part of P0.3/P0.4.
- [~] Persist and reload: target roles, locations, minimum salary, threshold, privacy toggles, contact fields, and employer. *(Implemented; user verification pending.)*
- [x] Replace decorative Settings controls with working controls or disabled “Coming soon” states.

Acceptance: a newly created account shows its own email/name—not Sarah; Settings changes survive refresh/sign-out/sign-in; no Sarah content appears in a real account.

### 3. Complete resume intake and storage

- [x] Add a real-account resume intake UI: paste text and upload PDF/DOCX/TXT.
- [~] Extract text from supported PDF and DOCX uploads server-side; show a clear unsupported/extraction failure state. *(Implemented with `pdftotext` and LibreOffice; deployment runtime must provide those binaries.)*
- [x] Save original files privately and store extracted content/version metadata in Supabase.
- [~] List and select only the current user’s resume versions. Replace/delete controls remain.
- [ ] Confirm Storage RLS prevents cross-account file access.

Acceptance: User A uploads a resume, reloads, and can select it for tailoring; User B cannot list, download, or mutate it; unsupported files fail safely.

### 4. Complete AI tailoring workflow

- [~] Make provider selection/configuration reliable for OpenRouter/Together free-tier models. *(Fallback route exists; manual provider test pending.)*
- [ ] Add resilient parsing for providers that do not support JSON response mode.
- [x] Let a user select a saved resume and a saved/review job as tailoring inputs.
- [x] Save tailored resume and cover-letter versions in Supabase. *(Requires tailored-materials migration.)*
- [~] Provide editing, re-generation, loading, and error states. Retry feedback remains.
- [~] Attach an approved tailored version to a review-queue application. *(Material now stores the associated application; Applications display remains next task.)*

Acceptance: with a configured provider, a real user can tailor, edit, save, reload, and attach materials; provider failure does not lose source text and offers an actionable retry/error message.

### 5. Finish job discovery and review queue

- [~] Validate multi-source live fetching and graceful upstream failure/empty states. *(Jobicy + Himalayas response shapes verified on 2026-08-24; manual UI verification pending.)*
- [~] Make job search query and visible filters functional. *(Implemented keyword, location, remote, type, seniority, salary, date, and match filters; manual verification pending.)*
- [~] Persist saved/review jobs with the external source URL and a user-owned job snapshot. *(Implemented; manual persistence verification pending.)*
- [x] Replace “Auto-apply” behavior with an explicit disabled/future state—MVP never submits external applications.
- [~] Add outbound “Open application” handoff and a manual “Mark applied” action. *(Implemented; manual verification pending.)*

Acceptance: a real user can find a Jobicy job, add it to review, reopen it later, visit the original listing, and mark it applied without third-party submission.

### 6. Make Applications and Dashboard real-data-only

- [~] Derive application counts, stage columns, filters, and empty states from Supabase records. *(Kanban/table/chips/summary now derive from `/api/applications`; zero-state added. Manual browser acceptance pending.)*
- [x] Remove remaining demo totals, company names, dates, and timeline data for real accounts. *(Demo-only views gated behind demo mode; timeline disabled with Coming soon for real accounts.)*
- [~] Persist stage changes, including review → applied → screen → technical → final/offer/rejected. *(Fixed wrong-stage mapping bug; reject/restore actions persist via PATCH with optimistic rollback. Verified via API.)*
- [x] Implement real-data table/timeline views or mark them disabled/Coming soon. *(Real table view implemented; timeline marked Coming soon for real accounts.)*
- [~] Build dashboard summary, recent activity, and suggested jobs from the same real records. *(Stats, pipeline, activity feed, and next actions derive from applications + materials; fabricated widgets removed for real accounts. Manual browser acceptance pending.)*

Acceptance: creating or moving an application immediately changes Applications and Dashboard after refresh; a new real account sees zero-state UI only; Sarah demo retains its sample activity.

## P1 — required product honesty and quality

- [x] Disable/overlay all non-core demo controls for real accounts: Interview, Market Intel, Messages, integrations, billing, exports, account deletion, notifications, and any unfinished view/filter. *(Market Intel/Messages/notifications/PDF download/Delete/Grid-Map grayed with "Coming soon" tooltips; CSV + JSON exports made real; fabricated billing/profile pills commented out.)*
- [x] Ensure every disabled control explains “Coming soon” or grayed out look like disabled and does not mutate local or remote state. *(Global `button:disabled` style in globals.css; ComingSoon overlay is pointer-events-none.)*
- [x] Add global loading, empty, and error states for authenticated data views. *(Dashboard/Applications/Jobs/Resume already had them; Settings profile rows now show Loading… until the profile resolves.)*
- [x] Update README with environment variables, Supabase migration order, demo behavior, local setup, and manual QA steps.
- [x] Remove unused/dead code only after its replacement is functioning. *(ChevronLink removed; demo-only data arrays retained for demo mode.)*

## P1 — manual launch verification

- [ ] Test sign-up with Confirm Email enabled, confirmation redirect, sign-in, sign-out, password validation, and failed login.
- [ ] Test two separate accounts for profiles, applications, resumes, and Storage RLS isolation.
- [ ] Test Jobicy success, no-results, timeout, and upstream failure states.
- [ ] Test each configured AI provider, unavailable provider, malformed provider output, and retry behavior.
- [ ] Test desktop and mobile navigation, demo login, real login, refresh, and direct workspace URLs.
- [ ] Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` successfully before every release candidate.

## Task log

| Date | Task | Status | Evidence / notes |
| --- | --- | --- | --- |
| 2026-08-21 | Initial MVP audit | [x] | Auth/schema/API scaffolding exists; launch blockers identified. |
| 2026-08-21 | Demo/real-account visual separation | [~] | Main routes gated, but requires end-to-end verification after core work. |
| 2026-08-21 | P0.1 build and secure access | [x] | Added Supabase SSR cookie clients, proxy route check, server page guards, and a local demo-session cookie that grants no data access. |
| 2026-08-22 | P0.1 manual verification | [x] | User confirmed real-account redirect/session and Sarah demo refresh behavior. |
| 2026-08-22 | Profile auto-creation migration | [x] | User applied `supabase/profile-auth-migration.sql` to the existing project. |
| 2026-08-22 | P0.2 profile/preferences implementation | [~] | Real profile now synchronizes across workspace UI; edit/search/privacy settings persist; auto-apply is truthfully disabled as Coming soon. Manual verification remains. |
| 2026-08-22 | P0.2 API field mapping fix | [x] | Corrected camelCase request fields to snake_case Supabase columns; added profile backfill migration for existing accounts. |
| 2026-08-22 | P0.3 resume intake | [~] | Added real-account private upload/paste/select flow and server-side PDF/DOCX extraction. Requires manual upload/RLS test and deployment-runtime decision for extraction binaries. |
| 2026-08-22 | P0.4 AI materials implementation | [~] | Added saved resume/review-job selection, AI draft editing, approval persistence, and OpenRouter/Together/Gemini provider fallback; provider-key verification pending. |
| 2026-08-22 | P0.5 job discovery and review queue | [~] | Added submitted Jobicy search, loading/empty/retry states, upstream timeout handling, durable review-queue saves, original-listing handoff, manual Mark applied, and disabled Auto-apply/unfinished filters. |
| 2026-08-24 | P0.5 search and matching correction | [~] | Replaced placeholder Jobicy-only behavior with verified Jobicy + Himalayas backend search; added normalized/deduplicated results, profile/resume-based explainable scoring, working quick/advanced filters, functional All/90%+/80%+/Saved controls, and staged card actions. Manual browser acceptance remains. |
| 2026-08-25 | P0.6 Applications & Dashboard real-data | [~] | Kanban columns/chips/summary/table now derive from Supabase records; fixed stage mapping (technical → final), added reject/restore with persisted PATCH; real dashboard stats/pipeline/activity/next actions replace placeholder; fabricated widgets (live run, market intel, upcoming) hidden for real accounts; demo mode unchanged. API-level verification passed; manual browser acceptance remains. |
| 2026-08-25 | P1 product honesty implementation | [x] | Dead controls either made real (applications CSV export, full-account JSON export, ⌘K focus, real sidebar counts, real avatar initials, settings nav active state) or disabled with Coming-soon tooltips (Market Intel, Messages, bell, PDF download, Delete, Grid/Map); fabricated billing/profile content commented out; global disabled styling added; README rewritten; settings nav pinned below header. Manual browser acceptance remains. |
