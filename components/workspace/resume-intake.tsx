'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { FileUp, LoaderCircle, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

type Resume = { id: string; name: string; content: string; created_at: string };

export function ResumeIntake() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [text, setText] = useState('');
  const [file, setFile] = useState<File>();
  const [savingResume, setSavingResume] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingMaterials, setSavingMaterials] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [applications, setApplications] = useState<Array<{ id: string; company: string; title: string; source_url: string }>>([]);
  const [applicationId, setApplicationId] = useState('');
  const [instruction, setInstruction] = useState('Tailor this resume for the selected role using only the supplied facts.');
  const [tailoredResume, setTailoredResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [materialId, setMaterialId] = useState<string>();
  useEffect(() => { void Promise.all([apiFetch<{ resumes: Resume[] }>('/api/resumes'), apiFetch<{ applications: Array<{ id: string; company: string; title: string; source_url: string }> }>('/api/applications')]).then(([resumeData, applicationData]) => { setResumes(resumeData.resumes); setSelectedId(resumeData.resumes[0]?.id); setText(resumeData.resumes[0]?.content ?? ''); setApplications(applicationData.applications); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load resume workspace.')); }, []);
  const save = async () => {
    if (!text.trim() && !file) { setError('Paste your resume text or choose a PDF, DOCX, or TXT file.'); return; }
    setSavingResume(true); setError(undefined); setNotice(undefined);
    try {
      if (file) {
        // A file upload must not inherit text from the previously selected
        // resume. The API extracts and stores the selected file's own text.
        const form = new FormData(); form.set('file', file);
        const { resume } = await apiFetch<{ resume: Resume }>('/api/resumes', { method: 'POST', body: form });
        setResumes((current) => [resume, ...current]); setSelectedId(resume.id); setText(resume.content); setFile(undefined); setNotice('Resume uploaded and extracted securely.');
      } else if (selectedId) {
        const { resume } = await apiFetch<{ resume: Resume }>('/api/resumes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedId, content: text }) });
        setResumes((current) => current.map((item) => item.id === resume.id ? resume : item)); setNotice('Changes saved to this resume.');
      } else {
        const form = new FormData(); form.set('content', text);
        const { resume } = await apiFetch<{ resume: Resume }>('/api/resumes', { method: 'POST', body: form });
        setResumes((current) => [resume, ...current]); setSelectedId(resume.id); setText(resume.content); setNotice('Pasted resume saved securely.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save resume.'); }
    finally { setSavingResume(false); }
  };
  const remove = async () => {
    if (!selectedId || !window.confirm('Delete this resume and its original private file?')) return;
    setSavingResume(true); setError(undefined);
    try { await apiFetch(`/api/resumes?id=${selectedId}`, { method: 'DELETE' }); const next = resumes.filter((resume) => resume.id !== selectedId); setResumes(next); setSelectedId(next[0]?.id); setText(next[0]?.content ?? ''); setNotice('Resume deleted.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete resume.'); }
    finally { setSavingResume(false); }
  };
  const tailor = async () => {
    const selected = resumes.find((resume) => resume.id === selectedId); const job = applications.find((application) => application.id === applicationId);
    if (!selected) { setError('Save or select a resume before tailoring.'); return; }
    if (!job) { setError('Add a job to your review queue and select it before tailoring.'); return; }
    setGenerating(true); setError(undefined); setNotice(undefined);
    try { const result = await apiFetch<{ resume: string; coverLetter: string; note: string }>('/api/ai/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: selected.content, jobTitle: job.title, company: job.company, instruction }) }); setTailoredResume(result.resume); setCoverLetter(result.coverLetter); setNotice(result.note || 'AI draft ready for your review.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'AI tailoring failed.'); }
    finally { setGenerating(false); }
  };
  const saveMaterials = async () => {
    if (!selectedId || !tailoredResume || !coverLetter) return;
    setSavingMaterials(true); setError(undefined);
    try { const { material } = await apiFetch<{ material: { id: string } }>('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: materialId, resumeId: selectedId, applicationId: applicationId || null, tailoredResume, coverLetter, note: 'User-approved tailored materials.' }) }); setMaterialId(material.id); setNotice('Approved tailored materials saved.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save materials.'); }
    finally { setSavingMaterials(false); }
  };
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0]; setFile(next); if (next) setNotice(`${next.name} will be uploaded and text extracted securely.`); };
  const actionLabel = file ? 'Upload & extract resume' : selectedId ? 'Save changes' : 'Save pasted resume';
  return <div className="mx-auto max-w-4xl space-y-5"><section className="panel p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Resume & AI</p><h2 className="display mt-2 text-3xl font-bold">{selectedId ? 'Your resume' : 'Add your resume'}</h2><p className="mt-2 text-sm text-muted-foreground">Upload PDF, DOCX, or TXT (max 8 MB), or paste plain text. Files remain private to your account.</p></div><label className="ghost-button cursor-pointer px-4 py-2 text-sm"><FileUp size={16} /> {file?.name ?? 'Upload another file'}<input className="sr-only" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={chooseFile} /></label></div>{resumes.length > 0 && <div className="mt-6 flex gap-2"><label className="min-w-0 flex-1 text-sm">Saved resumes<select value={selectedId} onChange={(event) => { const selected = resumes.find((resume) => resume.id === event.target.value); setSelectedId(event.target.value); setText(selected?.content ?? ''); setFile(undefined); }} className="mt-2 w-full rounded-xl border border-border bg-[#1a1815] px-3 py-2">{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name} · {new Date(resume.created_at).toLocaleDateString()}</option>)}</select></label><button onClick={() => void remove()} disabled={savingResume} aria-label="Delete selected resume" className="mt-6 grid size-10 place-items-center rounded-xl border border-red-900/60 text-red-300"><Trash2 size={16} /></button></div>}<label className="mt-6 block text-sm">Resume text<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste your resume here…" className="mt-2 min-h-[280px] w-full rounded-xl border border-border bg-[#1a1815] p-4 text-sm leading-6" /></label>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}{notice && <p className="mt-3 text-sm text-green-400">{notice}</p>}<button onClick={() => void save()} disabled={savingResume} className="amber-button mt-5 px-5 py-3 text-sm disabled:opacity-60">{savingResume && <LoaderCircle className="animate-spin" size={16} />}{savingResume ? 'Saving…' : actionLabel}</button></section>{selectedId && <section className="panel p-6 sm:p-8"><p className="eyebrow">AI tailoring</p><h2 className="display mt-2 text-3xl font-bold">Create tailored materials</h2><p className="mt-2 text-sm text-muted-foreground">Select a job from your review queue, then approve and save the generated draft.</p><label className="mt-5 block text-sm">Review-queue job<select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-[#1a1815] px-3 py-2"><option value="">Select a job…</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.company} · {application.title}</option>)}</select></label><label className="mt-4 block text-sm">Instructions<textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-border bg-[#1a1815] p-3 text-sm" /></label><button onClick={() => void tailor()} disabled={generating || !applicationId} className="amber-button mt-5 px-5 py-3 text-sm disabled:opacity-60">{generating && <LoaderCircle className="animate-spin" size={16} />}{generating ? 'Generating…' : 'Generate draft'}</button>{tailoredResume && <div className="mt-6 grid gap-4"><label className="text-sm">Tailored resume<textarea value={tailoredResume} onChange={(event) => setTailoredResume(event.target.value)} className="mt-2 min-h-72 w-full rounded-xl border border-border bg-[#1a1815] p-4 text-sm leading-6" /></label><label className="text-sm">Cover letter<textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} className="mt-2 min-h-56 w-full rounded-xl border border-border bg-[#1a1815] p-4 text-sm leading-6" /></label><button onClick={() => void saveMaterials()} disabled={savingMaterials} className="amber-button w-fit px-5 py-3 text-sm">{savingMaterials && <LoaderCircle className="animate-spin" size={16} />}{savingMaterials ? 'Saving materials…' : 'Approve & save materials'}</button></div>}</section>}</div>;
}
