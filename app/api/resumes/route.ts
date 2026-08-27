import { requireUser } from '@/lib/api-auth';
import { z } from 'zod';
import mammoth from 'mammoth';
import { getData } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

PDFParse.setWorker(getData());

// Force Node.js runtime (not Edge) so pdf-parse and its worker have
// access to node:path, node:fs, and the full Node.js APIs.
export const runtime = 'nodejs';

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);

async function extractTextBuffer(contentType: string, arrayBuffer: ArrayBuffer) {
  if (contentType === 'text/plain') {
    const text = Buffer.from(arrayBuffer).toString('utf8').trim();
    console.info('[resumes] extractTextBuffer: text/plain — extracted', { length: text.length });
    return text;
  }
  if (contentType === 'application/pdf') {
    console.info('[resumes] extractTextBuffer: PDF — starting parse', { byteLength: arrayBuffer.byteLength });
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    try {
      const result = await parser.getText();
      const text = result.text.trim();
      console.info('[resumes] extractTextBuffer: PDF — parse succeeded', { textLength: text.length, totalPages: result.total });
      return text;
    } finally {
      await parser.destroy();
    }
  }
  // DOCX
  console.info('[resumes] extractTextBuffer: DOCX — starting mammoth extraction', { byteLength: arrayBuffer.byteLength });
  const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
  const text = result.value.trim();
  console.info('[resumes] extractTextBuffer: DOCX — extraction succeeded', { textLength: text.length });
  return text;
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
    // Read the buffer once and reuse for both storage upload and text
    // extraction. Some runtimes invalidate the File object after the first
    // consume (e.g. Supabase upload), so we must not call file.arrayBuffer()
    // a second time.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    filePath = `${auth.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await auth.supabase.storage.from('resumes').upload(filePath, buffer, { contentType: file.type, upsert: false });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    try {
      content = await extractTextBuffer(file.type, arrayBuffer);
    } catch (err) {
      console.error('[resumes] extractText failed:', { contentType: file.type, fileName: file.name, fileSize: file.size, err });
      return Response.json({ error: 'We could not read that document. Try another PDF/DOCX or paste the resume text.' }, { status: 422 });
    }
  }
  if (!content) {
    console.warn('[resumes] extractText returned empty content', { hasFile: file instanceof File, contentType: file instanceof File ? file.type : 'n/a', fileName: file instanceof File ? file.name : 'n/a' });
    return Response.json({ error: 'No readable text was found. Try a text-based PDF/DOCX or paste the resume text.' }, { status: 422 });
  }
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
