import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const DEFAULTS = {
  nudge_enabled: true,
  nudge_hour: 20,
  nudge_days_inactive: 3,
  anniversary_enabled: true,
  resurfacing_enabled: true,
  timezone: 'UTC',
  locale: 'en',
  first_fragment_at: null,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'nudge_enabled, nudge_hour, nudge_days_inactive, anniversary_enabled, resurfacing_enabled, timezone, locale, first_fragment_at, updated_at',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);

  const seed = { user_id: user.id, ...DEFAULTS };
  const { data: inserted, error: insertErr } = await supabase
    .from('notification_preferences')
    .insert(seed)
    .select(
      'nudge_enabled, nudge_hour, nudge_days_inactive, anniversary_enabled, resurfacing_enabled, timezone, locale, first_fragment_at, updated_at',
    )
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json(inserted);
}

type PutBody = Partial<{
  nudge_enabled: boolean;
  nudge_hour: number;
  nudge_days_inactive: number;
  anniversary_enabled: boolean;
  resurfacing_enabled: boolean;
  timezone: string;
  locale: string;
  first_fragment_at: string | null;
}>;

const ALLOWED_LOCALES = ['en', 'it', 'de', 'fr', 'es', 'zh'];

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.nudge_enabled === 'boolean') update.nudge_enabled = body.nudge_enabled;
  if (typeof body.anniversary_enabled === 'boolean')
    update.anniversary_enabled = body.anniversary_enabled;
  if (typeof body.resurfacing_enabled === 'boolean')
    update.resurfacing_enabled = body.resurfacing_enabled;

  if (typeof body.nudge_hour === 'number') {
    if (!Number.isInteger(body.nudge_hour) || body.nudge_hour < 0 || body.nudge_hour > 23) {
      return NextResponse.json({ error: 'nudge_hour out of range' }, { status: 400 });
    }
    update.nudge_hour = body.nudge_hour;
  }
  if (typeof body.nudge_days_inactive === 'number') {
    if (
      !Number.isInteger(body.nudge_days_inactive) ||
      body.nudge_days_inactive < 1 ||
      body.nudge_days_inactive > 14
    ) {
      return NextResponse.json({ error: 'nudge_days_inactive out of range' }, { status: 400 });
    }
    update.nudge_days_inactive = body.nudge_days_inactive;
  }
  if (typeof body.timezone === 'string' && body.timezone.length > 0 && body.timezone.length < 64) {
    update.timezone = body.timezone;
  }
  if (typeof body.locale === 'string' && ALLOWED_LOCALES.includes(body.locale)) {
    update.locale = body.locale;
  }
  if (body.first_fragment_at === null || typeof body.first_fragment_at === 'string') {
    update.first_fragment_at = body.first_fragment_at;
  }

  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const cols =
    'nudge_enabled, nudge_hour, nudge_days_inactive, anniversary_enabled, resurfacing_enabled, timezone, locale, first_fragment_at, updated_at';

  if (existing) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(update)
      .eq('user_id', user.id)
      .select(cols)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const seed = { user_id: user.id, ...DEFAULTS, ...update };
  const { data, error } = await supabase
    .from('notification_preferences')
    .insert(seed)
    .select(cols)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
