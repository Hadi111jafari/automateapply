import { requireUser } from '@/lib/api-auth';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);
const execFileAsync = promisify(execFile);

async function extractText(file: File) {
  if (file.type === 'text/plain') return (await file.text()).trim();
  const directory = await mkdtemp(join(tmpdir(), 'automateapply-resume-'));
  const source = join(directory, file.type === 'application/pdf' ? 'resume.pdf' : 'resume.docx');
  try {
    await writeFile(source, Buffer.from(await file.arrayBuffer()));
    if (file.type === 'application/pdf') {
      const output = join(directory, 'resume.txt');
      await execFileAsync('pdftotext', [source, output], { timeout: 20_000 });
      return (await readFile(output, 'utf8')).trim();
    }
    await execFileAsync('libreoffice', ['--headless', '--convert-to', 'txt:Text', '--outdir', directory, source], { timeout: 30_000 });
    return (await readFile(join(directory, 'resume.txt'), 'utf8')).trim();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const { data, error } = await auth.supabase.from('resumes').select('*').order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ resumes: data });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const form = await request.formData();
  let content = String(form.get('content') ?? '').trim();
  const file = form.get('file');
  if (!content && !(file instanceof File)) return Response.json({ error: 'Paste resume text or choose a file.' }, { status: 400 });
  if (file instanceof File && (file.size > MAX_SIZE || !ALLOWED.has(file.type))) return Response.json({ error: 'Use a PDF, DOCX, or text file up to 8 MB.' }, { status: 400 });
  let filePath: string | null = null;
  if (file instanceof File) {
    filePath = `${auth.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await auth.supabase.storage.from('resumes').upload(filePath, file, { contentType: file.type, upsert: false });
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  if (!content && file instanceof File) {
    try { content = await extractText(file); }
    catch { return Response.json({ error: 'We could not read that document. Try another PDF/DOCX or paste the resume text.' }, { status: 422 }); }
  }
  if (!content) return Response.json({ error: 'No readable text was found. Try a text-based PDF/DOCX or paste the resume text.' }, { status: 422 });
  const { data, error } = await auth.supabase.from('resumes').insert({ user_id: auth.user.id, name: file instanceof File ? file.name : 'Pasted resume', content, file_path: filePath }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ resume: data }, { status: 201 });
}

const updateSchema = z.object({ id: z.string().uuid(), content: z.string().trim().min(1).max(80_000) });

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: 'Resume text is required.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('resumes').update({ content: parsed.data.content }).eq('id', parsed.data.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ resume: data });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if ('error' in auth) return Response.json(auth, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Resume id is required.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('resumes').select('file_path').eq('id', id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  if (data.file_path) await auth.supabase.storage.from('resumes').remove([data.file_path]);
  const { error: deleteError } = await auth.supabase.from('resumes').delete().eq('id', id);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 400 });
  return Response.json({ ok: true });
}
