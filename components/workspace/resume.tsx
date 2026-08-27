'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, FileUp, LoaderCircle, RotateCcw, Send, Sparkles, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { TinyCompany } from './workspace-shell';
import styles from './resume.module.css';
import { apiFetch, describeLoadError } from '@/lib/api-client';
import { useDemoMode } from '@/lib/demo-mode';
import { useProfile } from '@/lib/use-profile';

type ResumeRecord = { id: string; name: string; content: string; created_at: string };
type Application = { id: string; company: string; title: string; match_score: number | null; stage?: string; notes?: string | null };
type Material = { id: string; resume_id: string; application_id: string | null; tailored_resume: string; cover_letter: string; note: string };

const demoResume = `Growth-focused product leader with 6 years scaling B2B SaaS revenue.

Klarna · Senior Product Manager, Growth
• Owned SMB activation funnel; lifted self-serve conversion 47% YoY.
• Built payments integration tooling that reduced onboarding time 40%.

Skills
PLG · activation funnels · payments APIs · experimentation`;

const truncate = (value: string, limit = 360) => value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

function ResumeWorkspace({ demo = false }: { demo?: boolean }) {
  const { profile, email } = useProfile();
  const searchParams = useSearchParams();
  const requestedApplicationId = searchParams.get('application') ?? '';
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [jobs, setJobs] = useState<Application[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [source, setSource] = useState(demo ? demoResume : '');
  const [tailored, setTailored] = useState(demo ? demoResume : '');
  const [letter, setLetter] = useState(demo ? 'Hi Sarah,\n\nI would welcome the opportunity to discuss how my growth and payments experience could support Stripe.\n\nBest,\nSarah' : '');
  const [materialId, setMaterialId] = useState('');
  const [instruction] = useState('Tailor this resume for the selected role using only the supplied facts.');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(!demo);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [editingLetter, setEditingLetter] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    if (demo) return;
    void Promise.all([
      apiFetch<{ resumes: ResumeRecord[] }>('/api/resumes'),
      apiFetch<{ applications: Application[] }>('/api/applications'),
      apiFetch<{ materials: Material[] }>('/api/materials'),
    ]).then(([resumeData, applicationData, materialData]) => {
      setResumes(resumeData.resumes); setJobs(applicationData.applications); setMaterials(materialData.materials);
      const first = resumeData.resumes[0];
      if (first) { setResumeId(first.id); setSource(first.content); }
      if (requestedApplicationId && applicationData.applications.some((application) => application.id === requestedApplicationId)) setJobId(requestedApplicationId);
    }).catch((cause: unknown) => {
      const failure = describeLoadError(cause);
      if (failure.auth) setSessionEnded(true);
      else setError(failure.message);
    })
      .finally(() => setLoading(false));
  }, [demo, requestedApplicationId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), 4_500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedJob = jobs.find((job) => job.id === jobId);
  const activateMaterial = (nextResumeId: string, nextJobId: string) => {
    const material = materials.find((item) => item.resume_id === nextResumeId && item.application_id === (nextJobId || null));
    setMaterialId(material?.id ?? ''); setTailored(material?.tailored_resume ?? ''); setLetter(material?.cover_letter ?? '');
  };
  const selectResume = (id: string) => { const next = resumes.find((item) => item.id === id); setResumeId(id); setSource(next?.content ?? ''); setFile(undefined); setError(undefined); activateMaterial(id, jobId); };
  const selectJob = (id: string) => { setJobId(id); activateMaterial(resumeId, id); };
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0]; setFile(next); if (next) setNotice(`${next.name} will be privately stored and text extracted.`); };
  const saveResume = async () => {
    if (demo) return;
    if (!source.trim() && !file) { setError('Paste resume text or choose a PDF, DOCX, or TXT file.'); return; }
    setSaving(true); setError(undefined);
    try {
      if (file) {
        // A selected file is the source of truth for a new upload. Do not
        // submit the text from the previously selected resume, otherwise the
        // API would save that stale text instead of extracting this file.
        const body = new FormData(); body.set('file', file);
        const { resume } = await apiFetch<{ resume: ResumeRecord }>('/api/resumes', { method: 'POST', body });
        setResumes((items) => [resume, ...items]); setResumeId(resume.id); setSource(resume.content); setMaterialId(''); setTailored(''); setLetter(''); setFile(undefined); setNotice('Resume uploaded and saved.');
      } else if (resumeId) {
        const { resume } = await apiFetch<{ resume: ResumeRecord }>('/api/resumes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resumeId, content: source }) });
        setResumes((items) => items.map((item) => item.id === resume.id ? resume : item)); setNotice('Source resume changes saved.');
      } else {
        const body = new FormData(); body.set('content', source);
        const { resume } = await apiFetch<{ resume: ResumeRecord }>('/api/resumes', { method: 'POST', body });
        setResumes((items) => [resume, ...items]); setResumeId(resume.id); setSource(resume.content); setMaterialId(''); setTailored(''); setLetter(''); setNotice('Resume saved.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the resume.'); }
    finally { setSaving(false); }
  };
  const selectedResume = resumes.find((item) => item.id === resumeId);
  const sourceDirty = Boolean(
    file ||
      (source.trim() &&
        (!selectedResume || source !== selectedResume.content)),
  );
  const savedMaterial = materials.find((item) => item.id === materialId);
  const materialsDirty = Boolean(
    tailored &&
      letter &&
      (!savedMaterial ||
        tailored !== savedMaterial.tailored_resume ||
        letter !== savedMaterial.cover_letter),
  );
  const removeResume = async () => {
    if (demo || !resumeId) return;
    setSaving(true); setError(undefined);
    try { await apiFetch(`/api/resumes?id=${resumeId}`, { method: 'DELETE' }); const next = resumes.filter((item) => item.id !== resumeId); const nextId = next[0]?.id ?? ''; setResumes(next); setResumeId(nextId); setSource(next[0]?.content ?? ''); activateMaterial(nextId, jobId); setDeleteDialogOpen(false); setNotice('Resume deleted.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete the resume.'); }
    finally { setSaving(false); }
  };
  const tailor = async (request = instruction) => {
    if (demo) { setMessages((items) => [...items, request]); return; }
    if (!source.trim()) { setError('Save or enter your source resume first.'); return; }
    if (!selectedJob) { setError('Choose a job from your review queue first.'); return; }
    setGenerating(true); setError(undefined); setNotice(undefined);
    try {
      const result = await apiFetch<{ resume: string; coverLetter: string; note: string }>('/api/ai/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: source, jobTitle: selectedJob.title, company: selectedJob.company, jobDescription: (selectedJob.notes ?? '').slice(0, 25_000), instruction: request }) });
      setTailored(result.resume); setLetter(result.coverLetter); setMaterialId(''); if (request !== instruction) setMessages((items) => [...items, request]); setNotice(result.note || 'AI draft is ready for review.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI tailoring failed.'); }
    finally { setGenerating(false); }
  };
  const saveMaterials = async () => {
    if (demo) return;
    if (!resumeId || !tailored || !letter) { setError('Generate or enter both materials before saving.'); return; }
    setSavingMaterial(true); setError(undefined);
    try {
      const { material } = await apiFetch<{ material: Material }>('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: materialId || undefined, resumeId, applicationId: jobId || null, tailoredResume: tailored, coverLetter: letter, note: 'User-reviewed tailored materials.' }) });
      setMaterialId(material.id); setMaterials((items) => [material, ...items.filter((item) => item.id !== material.id)]); setNotice('Tailored materials saved.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save tailored materials.'); }
    finally { setSavingMaterial(false); }
  };
  const contact = [profile?.locations?.[0], email, profile?.phone, profile?.linkedin].filter(Boolean).join(' · ');
  const wordCount = letter.trim() ? letter.trim().split(/\s+/).length : 0;
  if (loading) return <div className="panel grid min-h-[420px] place-items-center gap-3 p-8 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" /> Loading your private resume workspace…</div>;
  if (sessionEnded)
    return (
      <div className="panel grid min-h-[420px] place-items-center p-8 text-center">
        <div>
          <h2 className="display text-2xl font-bold">Your session has ended</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Sign in again to open your resume workspace. Everything you saved is
            exactly where you left it.
          </p>
          <a href="/login" className="amber-button mt-5 px-5 py-2.5 text-sm">Sign in</a>
        </div>
      </div>
    );

  return <>
    <div className={styles.resume}>
    <section className={styles.jobCard}><TinyCompany letter={(selectedJob?.company ?? (demo ? 'Stripe' : 'R')).slice(0, 1).toUpperCase()} /><div className={styles.company}><div className={styles.companyText}>{demo ? <><p className={styles.companyTitle}>Stripe · Senior Product Manager, Growth <span className={styles.tag}>Demo draft</span></p><p className={styles.meta}>Sarah&apos;s prepared local demo data</p></> : <><label className={styles.companyTitle}>Review-queue job <select value={jobId} onChange={(event) => selectJob(event.target.value)} className="mt-2 block w-full min-w-0 rounded-md border border-border bg-[#1a1815] px-2 py-1 text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto"><option value="">Choose a job…</option>{[...jobs].sort((a, b) => (a.stage === 'review' ? 0 : 1) - (b.stage === 'review' ? 0 : 1)).map((job) => <option key={job.id} value={job.id}>{job.stage === 'review' ? '· ' : ''}{job.company} · {job.title}</option>)}</select></label><p className={styles.meta}>{selectedJob ? `${selectedJob.company} · ${selectedJob.title}` : jobs.length ? 'Choose a saved job to tailor your materials.' : 'Add a job from Job Search to begin tailoring.'}</p></>}</div></div><div className={styles.score}><p className={styles.scoreLabel}>Match score</p><p className={styles.scoreValue}>{demo ? '96%' : selectedJob?.match_score != null ? `${selectedJob.match_score}%` : '—'}</p></div><div className={styles.actions}><button onClick={() => void tailor()} disabled={generating || (!demo && !selectedJob)} className="ghost-button px-4 py-2 text-sm"><RotateCcw size={14} /> {generating ? 'Tailoring…' : 'Re-tailor'}</button><button onClick={() => void saveMaterials()} disabled={demo || savingMaterial || !materialsDirty} className="amber-button px-4 py-2 text-sm"><Send size={14} /> {demo ? 'Demo only' : savingMaterial ? 'Saving…' : materialId ? 'Save changes' : 'Save materials'}</button></div></section>
    <section className={styles.grid}><div className={styles.column}>
      <section className={styles.card}><div className={styles.sectionHead}><div><h2>{demo ? 'Sarah’s source resume' : 'Your source resume'}</h2><p>{demo ? 'Demo-only data' : 'Private to your account · used as the factual source'}</p></div>{!demo && <div className={styles.actions}><label className="ghost-button cursor-pointer px-3 py-2 text-sm"><FileUp size={14} /> {file?.name ?? 'Upload'}<input className="sr-only" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={chooseFile} /></label>{resumeId && <button onClick={() => setDeleteDialogOpen(true)} disabled={saving} className="ghost-button px-3 py-2 text-sm" aria-label="Delete selected resume"><Trash2 size={14} /></button>}</div>}</div>{!demo && resumes.length > 0 && <select value={resumeId} onChange={(event) => selectResume(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-[#1a1815] px-3 py-2 text-sm">{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} · {new Date(resume.created_at).toLocaleDateString()}</option>)}</select>}<textarea value={source} onChange={(event) => setSource(event.target.value)} readOnly={demo} placeholder="Upload a PDF, DOCX, or TXT file, or paste your resume here…" className="mt-4 min-h-48 w-full rounded-xl border border-border bg-[#1a1815] p-4 text-sm leading-6" />{!demo && <button onClick={() => void saveResume()} disabled={saving || !sourceDirty} className="amber-button mt-4 px-4 py-2 text-sm">{saving && <LoaderCircle className="animate-spin" size={14} />}{saving ? 'Saving…' : file ? 'Upload & extract' : resumeId ? 'Save source changes' : 'Save resume'}</button>}{error && <p className="mt-3 text-sm text-red-400">{error}</p>}{notice && <p className="mt-3 text-sm text-green-400">{notice}</p>}</section>
      <section className={styles.card}><div className={styles.sectionHead}><div><h2>What changed</h2><p>Compare the source resume with the editable tailored draft</p></div></div><div className={styles.diff}>{tailored && tailored !== source ? <article className={styles.change}><p className={styles.changeTitle}>· <strong>Tailored draft</strong></p><p className={`${styles.line} ${styles.removed}`}><span className={styles.mark}>−</span><span>{truncate(source)}</span></p><p className={`${styles.line} ${styles.added}`}><span className={styles.mark}>+</span><span>{truncate(tailored)}</span></p></article> : <p className="text-sm text-muted-foreground">Choose a review-queue job, then generate a draft to see the comparison.</p>}</div><div className={styles.truth}><Sparkles className="size-[18px] shrink-0" /><span><b>Review every change.</b> The AI is instructed to use only your source facts.</span></div></section>
      <section className={styles.card}><div className={styles.sectionHead}><div><h2>Cover letter</h2><p>{wordCount ? `${wordCount} words · editable before saving` : 'Generated for the selected role'}</p></div><div className={styles.actions}><button onClick={() => void tailor('Regenerate the cover letter and tailored resume using only the supplied facts.')} disabled={generating || (!demo && !selectedJob)} className="amber-button-quiet px-3 py-2 text-sm">Regenerate</button><button onClick={() => setEditingLetter((value) => !value)} className="ghost-button px-3 py-2 text-sm">{editingLetter ? 'Preview' : 'Edit'}</button></div></div><div className={`${styles.diff} ${styles.cover}`}>{editingLetter ? <textarea value={letter} onChange={(event) => setLetter(event.target.value)} readOnly={demo} className="min-h-64 w-full bg-transparent text-sm outline-none" /> : <p>{letter || 'Generate a draft to review your cover letter here.'}</p>}</div><div className={styles.coverFooter}><span>{wordCount ? `${wordCount} words · review before saving` : 'No cover letter generated yet'}</span>{!demo && <button onClick={() => void saveMaterials()} disabled={savingMaterial || !materialsDirty} className="amber-button px-4 py-2">{savingMaterial ? 'Saving…' : 'Save materials'}</button>}</div></section>
    </div><div className={styles.column}>
      <section><div className={styles.previewHead}><div className={styles.previewTitle}><h2>Preview</h2><p>How your tailored resume renders</p></div><div className={styles.zoom}><button onClick={() => setEditingResume((value) => !value)} className="ghost-button px-3 py-2 text-sm">{editingResume ? 'Preview' : 'Edit draft'}</button><button onClick={() => setZoom((value) => Math.max(.85, value - .1))} className="amber-icon-button" aria-label="Zoom out"><ZoomOut size={15} /></button><button onClick={() => setZoom((value) => Math.min(1.1, value + .1))} className="amber-icon-button" aria-label="Zoom in"><ZoomIn size={15} /></button></div></div>{editingResume ? <textarea value={tailored} onChange={(event) => setTailored(event.target.value)} readOnly={demo} className="min-h-[620px] w-full rounded-xl border border-border bg-[#1a1815] p-4 text-sm leading-6" placeholder="Generate a tailored resume to edit it here." /> : <article style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%` }} className={styles.paper}><h2>{demo ? 'Sarah Chen' : profile?.full_name || email.split('@')[0] || 'Your name'}</h2><p className={styles.paperMeta}>{demo ? 'San Francisco, CA · sarah.chen@gmail.com' : contact || 'Add contact information in Settings'}</p><section><h3>{tailored ? 'Tailored resume' : 'Source resume'}</h3><p>{tailored || source || 'Your saved resume will appear here.'}</p></section></article>}</section>
      <section className={styles.card}><div className={styles.sectionHead}><div><h2>Ask the AI</h2><p>Refine the resume with natural language</p></div></div><div className={styles.chat}>{messages.map((message, index) => <div key={`${message}-${index}`} className={`${styles.message} ${styles.messageUser}`}>{message}</div>)}{generating && <div className={`${styles.message} ${styles.messageAi}`}>Working on your draft…</div>}{!messages.length && !generating && <div className={`${styles.message} ${styles.messageAi}`}>Ask for an emphasis, clearer tone, or a different ordering. Review the generated result before saving.</div>}</div><div className={styles.input}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && chatInput.trim()) { const request = chatInput.trim(); setChatInput(''); void tailor(request); } }} placeholder="Ask AutomateApply to refine the resume…" /><button onClick={() => { const request = chatInput.trim(); if (request) { setChatInput(''); void tailor(request); } }} disabled={generating || (!demo && !selectedJob)} className="amber-button px-4 py-2"><Send size={15} />Send</button></div></section>
    </div></section>
    </div>
    {deleteDialogOpen && selectedResume && (
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setDeleteDialogOpen(false);
        }}
      >
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-resume-title"
          aria-describedby="delete-resume-description"
          className="panel w-full max-w-md border border-red-900/60 p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-5">
            <span className="grid size-11 place-items-center rounded-full bg-red-950/70 text-red-300">
              <AlertTriangle size={21} />
            </span>
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
              aria-label="Close delete dialog"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              <X size={17} />
            </button>
          </div>
          <h2 id="delete-resume-title" className="display mt-5 text-2xl font-bold">Delete this resume?</h2>
          <p id="delete-resume-description" className="mt-2 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">{selectedResume.name}</span> and its original private file will be permanently removed. This cannot be undone.
          </p>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleteDialogOpen(false)} disabled={saving} className="ghost-button px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={() => void removeResume()} disabled={saving} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60">
              {saving ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </section>
      </div>
    )}
  </>;
}

export function Resume({ initialDemo = false }: { initialDemo?: boolean }) {
  const clientDemoMode = useDemoMode();
  // Server cookie flag OR client flag: the demo workspace must never hit the
  // API, even if localStorage is unavailable in the current browsing context.
  const demoMode = clientDemoMode || initialDemo;
  return <ResumeWorkspace demo={demoMode} />;
}
