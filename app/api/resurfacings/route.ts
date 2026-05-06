import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REACTIONS = ['still_true', 'changed', 'archived'] as const;
const TRIGGERS = ['day_7', 'day_14', 'day_30', 'day_60'] as const;

type ResurfaceDTO = {
  fragmentId: string;
  shownAt: string;
  reaction: 'still_true' | 'changed' | 'archived' | null;
  triggerType: 'day_7' | 'day_14' | 'day_30' | 'day_60';
};

type DbRow = {
  fragment_id: string;
  shown_at: string;
  reaction: string | null;
  trigger_type: string;
};

function rowToDto(r: DbRow): ResurfaceDTO {
  return {
    fragmentId: r.fragment_id,
    shownAt: r.shown_at,
    reaction:
      r.reaction && (REACTIONS as readonly string[]).includes(r.reaction)
        ? (r.reaction as ResurfaceDTO['reaction'])
        : null,
    triggerType: r.trigger_type as ResurfaceDTO['triggerType'],
  };
}

function validate(r: unknown, userId: string):
  | { ok: true; row: { user_id: string; fragment_id: string; shown_at: string; reaction: string | null; trigger_type: string } }
  | { ok: false; error: string } {
  if (!r || typeof r !== 'object') return { ok: false, error: 'resurfacing not an object' };
  const o = r as Record<string, unknown>;
  if (typeof o.fragmentId !== 'string' || !UUID_RE.test(o.fragmentId)) {
    return { ok: false, error: 'invalid fragmentId' };
  }
  if (typeof o.shownAt !== 'string' || Number.isNaN(Date.parse(o.shownAt))) {
    return { ok: false, error: 'invalid shownAt' };
  }
  if (typeof o.triggerType !== 'string' || !(TRIGGERS as readonly string[]).includes(o.triggerType)) {
    return { ok: false, error: 'invalid triggerType' };
  }
  let reaction: string | null = null;
  if (o.reaction !== undefined && o.reaction !== null) {
    if (typeof o.reaction !== 'string' || !(REACTIONS as readonly string[]).includes(o.reaction)) {
      return { ok: false, error: 'invalid reaction' };
    }
    reaction = o.reaction;
  }
  return {
    ok: true,
    row: {
      user_id: userId,
      fragment_id: o.fragmentId,
      shown_at: o.shownAt,
      reaction,
      trigger_type: o.triggerType,
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
    .from('resurfacings')
    .select('fragment_id, shown_at, reaction, trigger_type')
    .eq('user_id', user.id);

  if (error) {
    console.error('[/api/resurfacings] supabase error:', error);
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }
  return NextResponse.json({ resurfacings: (data as DbRow[]).map(rowToDto) });
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

  const incoming = (body as { resurfacings?: unknown }).resurfacings;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'resurfacings[] required' }, { status: 400 });
  }
  if (incoming.length > 500) {
    return NextResponse.json({ error: 'batch too large (max 500)' }, { status: 400 });
  }

  const rows = [];
  for (const r of incoming) {
    const v = validate(r, user.id);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    rows.push(v.row);
  }

  const { data, error } = await supabase
    .from('resurfacings')
    .upsert(rows, { onConflict: 'user_id,fragment_id' })
    .select('fragment_id, shown_at, reaction, trigger_type');

  if (error) {
    console.error('[/api/resurfacings] supabase error:', error);
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }
  return NextResponse.json({ resurfacings: (data as DbRow[]).map(rowToDto) });
}
