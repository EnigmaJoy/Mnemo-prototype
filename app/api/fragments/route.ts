import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SENTIMENT_CODES, type SentimentCode } from '@/lib/sentiment';

export const runtime = 'nodejs';

type FragmentDTO = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type?: 'text' | 'audio';
  audioId?: string;
  sentimentCode?: SentimentCode;
};

type DbRow = {
  id: string;
  content: string;
  type: 'text' | 'audio';
  audio_id: string | null;
  sentiment_code: string | null;
  created_at: string;
  updated_at: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function rowToDto(r: DbRow): FragmentDTO {
  const dto: FragmentDTO = {
    id: r.id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    type: r.type,
  };
  if (r.audio_id) dto.audioId = r.audio_id;
  if (r.sentiment_code && (SENTIMENT_CODES as readonly string[]).includes(r.sentiment_code)) {
    dto.sentimentCode = r.sentiment_code as SentimentCode;
  }
  return dto;
}

function validate(f: unknown, userId: string): {
  ok: true;
  row: {
    id: string;
    user_id: string;
    content: string;
    type: 'text' | 'audio';
    audio_id: string | null;
    sentiment_code: string | null;
    created_at: string;
    updated_at: string;
  };
} | { ok: false; error: string } {
  if (!f || typeof f !== 'object') return { ok: false, error: 'fragment not an object' };
  const o = f as Record<string, unknown>;
  if (typeof o.id !== 'string' || !UUID_RE.test(o.id)) return { ok: false, error: 'invalid id' };
  if (typeof o.content !== 'string') return { ok: false, error: 'invalid content' };
  if (typeof o.createdAt !== 'string' || Number.isNaN(Date.parse(o.createdAt))) {
    return { ok: false, error: 'invalid createdAt' };
  }
  if (typeof o.updatedAt !== 'string' || Number.isNaN(Date.parse(o.updatedAt))) {
    return { ok: false, error: 'invalid updatedAt' };
  }
  const type = o.type === 'audio' ? 'audio' : 'text';
  const audio_id = typeof o.audioId === 'string' ? o.audioId : null;
  const sentiment_code =
    typeof o.sentimentCode === 'string' &&
    (SENTIMENT_CODES as readonly string[]).includes(o.sentimentCode)
      ? o.sentimentCode
      : null;
  return {
    ok: true,
    row: {
      id: o.id,
      user_id: userId,
      content: o.content,
      type,
      audio_id,
      sentiment_code,
      created_at: o.createdAt,
      updated_at: o.updatedAt,
    },
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('fragments')
    .select('id, content, type, audio_id, sentiment_code, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/fragments] supabase error:', error);
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }
  return NextResponse.json({ fragments: (data as DbRow[]).map(rowToDto) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const incoming = (body as { fragments?: unknown }).fragments;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'fragments[] required' }, { status: 400 });
  }
  if (incoming.length > 500) {
    return NextResponse.json({ error: 'batch too large (max 500)' }, { status: 400 });
  }

  const rows = [];
  for (const f of incoming) {
    const v = validate(f, user.id);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    rows.push(v.row);
  }

  const { data, error } = await supabase
    .from('fragments')
    .upsert(rows, { onConflict: 'id' })
    .select('id, content, type, audio_id, sentiment_code, created_at, updated_at');

  if (error) {
    console.error('[POST /api/fragments] supabase error:', error, 'rows.length:', rows.length);
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }
  return NextResponse.json({ fragments: (data as DbRow[]).map(rowToDto) });
}
