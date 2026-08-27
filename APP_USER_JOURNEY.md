# AutomateApply — User Journey & MVP Test Guide

**Purpose:** use this document to understand the current product and test it end to end as a real user.

## First: what the MVP actually does

AutomateApply is a private, review-first job-search workspace. It can:

1. save your job-search preferences and resume;
2. search current remote roles from Jobicy and Himalayas;
3. score jobs using your saved profile/resume;
4. save a role to a private review queue;
5. generate, let you edit, and store tailored resume/cover-letter drafts (when an AI provider is configured);
6. send you to the original job listing; and
7. let you manually record the application's stage.

It **never submits an external application**, does not send follow-ups, and has no real interview copilot yet.

## Two ways to enter

| Route | Who it is for | Data behavior |
| --- | --- | --- |
| `/login` → **Try Demo Account** | Exploring the interface | Local Sarah Chen sample data only; no Supabase session or authenticated API access. Demo changes are temporary. |
| `/login` → **Sign up** / **Sign in** | Actual MVP test | Your own Supabase-authenticated account. Profile, resume, materials, and pipeline records are private to that account. |

Signed-out direct visits to Dashboard, Job Search, Applications, Resume & AI, Interview, or Settings redirect to login. Signing out clears both the real session and demo mode.

## Recommended real-user journey

Use a non-sensitive test resume and one disposable email account. The successful route is:

```text
Account → profile/search preferences → resume → job search → save for review
→ tailor and review materials → apply on original job site yourself
→ mark applied → move through pipeline → verify dashboard/export
```

### 1. Account creation and access

1. Open `/login`.
2. Choose **Need an account? Sign up**.
3. Enter a valid email and a password of at least 8 characters, then choose **Create account**.
4. If email confirmation is enabled in Supabase, use the inbox link, then return and sign in. Otherwise, you should land on Dashboard immediately.
5. Sign out from the icon beside your avatar, then sign in again.

Expected results:

- Invalid email and short password are rejected before a useful workspace is created.
- Wrong credentials show an actionable error.
- Your own name/email, not Sarah Chen, appears in the sidebar after sign-in.
- Refreshing a protected page preserves a valid session; signing out returns you to `/login`.

### 2. Set the inputs that drive matching

Open **Settings** in the sidebar.

1. In **Profile**, choose **Edit**. Fill Name, Headline, Phone, LinkedIn, and Current employer. Choose **Save profile**; **Cancel** and **Close** discard this modal's unsaved changes.
2. In **Search preferences**, enter target roles and locations as comma-separated values and a minimum salary. Choose **Save search preferences**.
3. In **Privacy**, turn **Stealth mode** and/or **Anonymized applications** on or off. Each toggle saves immediately.
4. Optionally choose **Request export** to download a JSON snapshot of account data.
5. Refresh the page and sign out/in to verify persistence.

Notes:

- Target roles, locations, salary, and resume text help calculate an explainable match score.
- The visible **Auto-apply rules**, integrations, billing, and **Delete** account action are intentionally disabled/Coming soon; their controls should not be treated as working.

### 3. Add the factual source resume

Open **Resume & AI**.

1. Either paste plain resume text into **Your source resume**, or choose **Upload**.
2. Accepted uploads are PDF, DOCX, and TXT up to 8 MB. Choose **Upload & extract** after selecting a file; use **Save resume** for pasted text.
3. If you have more than one saved version, use the resume selector to switch versions. Editing a selected version and choosing **Save source changes** updates its extracted text.
4. The trash icon deletes the selected resume and, if applicable, its private stored file.

Expected results:

- The resume appears after refresh and is only visible to this account.
- Scanned/unreadable PDF/DOCX files produce a clear error; paste the text as the fallback.
- Delete is destructive: test it only with a disposable resume.

### 4. Discover and filter roles

Open **Job Search**.

1. Enter a role keyword (for example, `Frontend Engineer`) and choose **Search**. The header's **Quick job search** (or `Cmd/Ctrl + K`) opens this page with its query.
2. Use the quick chips: **Remote**, **Full-time**, **Senior level**, **$120k+**, and **75%+ match**. Clicking again removes each filter.
3. Open **More filters** for country, other employment types, salary, minimum match, posting date, and **Reset search**.
4. Use **All**, **90%+**, **80%+**, and **Saved** to change the displayed set.
5. Read each card's source, original location/salary/age, tags, match percentage, and explanation. The results are fetched from Jobicy and Himalayas and sorted by match.

Expected results:

- Empty searches, provider warnings, and provider failures are visible rather than silently replaced with sample jobs.
- Grid and Map are disabled (Coming soon); List is the sole working layout.
- A missing match score means the profile/resume has insufficient matching input, not that a job is rejected.

### 5. Create the review queue

1. On a promising result, choose **Save for review**.
2. Confirm its state becomes **Queued** / **Needs review**, and select the **Saved** tab to find it again.
3. Refresh, then open **Applications**: the role should exist in the **Review** column.
4. Return to Job Search and choose **Tailor application** for that saved role.

This creates a private snapshot (company, role, source URL, match score, location, and a short job-context note). Saving the same source again updates the same review entry rather than duplicating it.

### 6. Tailor, inspect, and save application materials

On **Resume & AI**:

1. Pick the saved role in **Review-queue job** (the URL from Job Search should preselect it).
2. Choose **Re-tailor** to generate a resume and cover-letter draft. It remains disabled until a role is selected.
3. In **What changed**, compare source and generated text. The model is instructed to use only resume facts—check every claim yourself.
4. Choose **Edit draft** to edit the tailored resume; use **Preview** to return to display mode. The zoom buttons only change on-screen preview scale.
5. In **Cover letter**, choose **Edit** / **Preview** and edit text as needed. **Regenerate** asks AI for a fresh draft.
6. Use **Ask the AI** with a focused request such as “Emphasize accessibility work using only my existing experience,” then press Enter or **Send**.
7. Choose **Save materials**. This creates or updates a tailored-materials record connected to the selected resume and application.

Expected results:

- Saving persists both documents through refresh/sign-out/sign-in.
- If no AI provider/key is configured, it should show an error and keep the source text intact.
- **Download PDF** is disabled; this MVP stores editable text, not a rendered application PDF.

### 7. Apply outside AutomateApply and record it honestly

1. Back in **Job Search**, a role with saved materials changes to **Apply on Jobicy/Himalayas**. Choose it to open the source listing in a new tab.
2. Complete (or deliberately do not complete) the external application yourself.
3. Only after your external application is submitted, return and choose **Mark applied manually**.
4. The card changes to **Applied** and offers **View listing**.

This is the MVP's trust boundary: the app tracks your work but does not send anything to a third-party ATS.

### 8. Manage the application pipeline

Open **Applications**.

1. Start in **Kanban**. Use stage filter chips to show one stage, or toggle an active chip off to return to All.
2. Drag a real-account card between columns to update its stage: Review → Applied → Recruiter screen → Technical → Final/Offer. Move it to Rejected as appropriate.
3. On a card, use the `…` menu to **Reject** an active application or **Restore to review** a rejected one.
4. Use **Table** for a compact current-record view. Its original-listing icon opens the saved external URL.
5. **Timeline** lists locally derived saved, stage-change, and tailored-material events. It is not a recruiter/email timeline.
6. Use the top-right **Export CSV** (only enabled when applications exist) to download company, role, stage, match, location, dates, and listing URL.

Expected results:

- Moving a card persists after refresh. If the save fails, the UI rolls the optimistic movement back and shows an error.
- The checkboxes and table `…` menu are presentation-only in the current implementation; do not expect bulk actions.

### 9. Read the dashboard as a summary, not a separate system

Open **Dashboard**.

- A brand-new account shows the zero state and **Find your first role**.
- After saving roles, the dashboard aggregates your actual records: weekly saved count, in-motion percentage, interview-stage count, saved tailored materials, next review actions, recent activity, and stage totals.
- **Tailor**, **Find more**, and **View all** are navigation shortcuts. They should lead back to the same underlying records.

## Demo-only tour

The demo is useful for learning layout and interaction without creating an account. It includes Sarah's populated dashboard, jobs, pipeline, resume draft, and interview screen. Demo card moves and saved jobs are local and temporary. Do not use demo results as proof that real integrations, follow-ups, interviews, or AI are working.

## Controls intentionally not part of the MVP

| Area | Current status |
| --- | --- |
| Market Intel, Messages, notifications | Disabled / Coming soon |
| Auto-apply rules and external integrations | Disabled / Coming soon |
| External application submission, smart fill, follow-ups | Not implemented |
| Interview page for real accounts | Coming soon |
| Interview demo | Visual/local demonstration only |
| Resume PDF download | Disabled / Coming soon |
| Job Grid and Map | Disabled / Coming soon |
| Account deletion | Disabled / Coming soon |
| Application table bulk selection and `…` action | No working action attached |

## End-to-end acceptance checklist

Run the checks in this order and record pass/fail plus a screenshot/error message:

- [ ] Sign up / confirmation (if enabled) / sign in / sign out / invalid password behavior.
- [ ] Protected URLs redirect while signed out.
- [ ] Settings profile, preferences, and privacy toggles persist through refresh and re-login.
- [ ] Upload TXT and one text-based PDF or DOCX; verify a bad/unsupported file error.
- [ ] Search a known keyword, filter results, reset filters, and observe no-results/provider-error handling.
- [ ] Save one job, refresh, find it in Saved and Applications → Review.
- [ ] Generate materials, edit both documents, save, refresh, and confirm they remain attached to the same role.
- [ ] Open the original listing, submit manually (or stop before submission), then only mark it applied if it was submitted.
- [ ] Move the application through Screen, Technical, Final/Offer, then Rejected and Restore; refresh after each critical move.
- [ ] Verify Dashboard totals/activity and Applications CSV reflect the same role and stage.
- [ ] Request account JSON export and verify it is your data only.
- [ ] On mobile width, test menu open/close and every working route.
- [ ] With a second account, verify it cannot see the first account's profile, resumes, materials, application rows, or files.

## Review findings to resolve before describing this as broader automation

1. **Landing-page mismatch (high priority):** `/` still markets automated submission, Workday/Greenhouse/Lever/Ashby support, follow-ups, live interview support, and “1,400+ applications per minute.” These claims conflict with the authenticated MVP, README, and disabled controls. Update the landing copy or clearly label it as future vision before inviting testers.
2. **AI is environment-dependent:** Tailoring needs a valid, reachable configured provider. If provider keys/network/model output fail, the rest of the workflow remains usable but AI generation cannot pass end to end.
3. **Document extraction is deployment-dependent:** PDF requires `pdftotext`; DOCX requires LibreOffice (`libreoffice` in code, while README also refers to `soffice`). Ensure the deployment image has the executable or guide users toward TXT/pasted text.
4. **Build verification needs a clean rerun:** lint and TypeScript checks passed in this review. An earlier build command left `.next/lock`; a later build reported another build process, so do not call the current production-build verification conclusive until it is rerun after the lock/process situation is resolved.
5. **Dirty working tree:** this review did not alter existing application code. The repository already contains uncommitted app changes, so keep them distinct from this documentation file when reviewing work.
