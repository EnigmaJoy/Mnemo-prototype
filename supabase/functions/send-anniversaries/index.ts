// send-anniversaries — Supabase Edge Function (Deno).
//
// CRON: hourly via pg_cron (`0 * * * *`). Hourly (not daily) so each user
// receives the push around 09:00 local time regardless of timezone, by only
// firing for users whose current local hour equals 9.
//
// LOGIC: for each user where notification_preferences.anniversary_enabled = true
// and first_fragment_at is set, fire a push if today's local month-day
// matches the month-day of first_fragment_at AND we haven't already sent an
// anniversary push to this user in the last 24 hours.

import {
  adminClient,
  anniversaryBody,
  logSend,
  pruneStaleEndpoints,
  recentlyNotified,
  sendToSubscriptions,
  localHourInTimezone,
  type Subscription,
} from '../_shared/push.ts';

declare const Deno: { serve: (h: (req: Request) => Promise<Response> | Response) => void };

const ANNIVERSARY_LOCAL_HOUR = 9;

function localMonthDay(tz: string, now: Date): { month: number; day: number; year: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: tz,
    });
    const formatted = formatter.format(now); // "YYYY-MM-DD"
    const [y, m, d] = formatted.split('-').map((s) => parseInt(s, 10));
    if (!y || !m || !d) return null;
    return { year: y, month: m, day: d };
  } catch {
    return null;
  }
}

Deno.serve(async () => {
  const supabase = adminClient();

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('user_id, locale, first_fragment_at, timezone')
    .eq('anniversary_enabled', true)
    .not('first_fragment_at', 'is', null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!prefs || prefs.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0, sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  let processed = 0;
  let sent = 0;

  for (const p of prefs) {
    processed += 1;
    if (!p.first_fragment_at) continue;

    const tz = p.timezone || 'UTC';

    const localHour = localHourInTimezone(tz, now);
    if (localHour !== ANNIVERSARY_LOCAL_HOUR) continue;

    const localToday = localMonthDay(tz, now);
    const firstLocal = localMonthDay(tz, new Date(p.first_fragment_at));
    if (!localToday || !firstLocal) continue;

    if (localToday.month !== firstLocal.month || localToday.day !== firstLocal.day) continue;

    const yearsAgo = localToday.year - firstLocal.year;
    if (yearsAgo < 1) continue;

    if (await recentlyNotified(supabase, p.user_id, 'anniversary', 1)) continue;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', p.user_id);
    if (!subs || subs.length === 0) continue;

    const payload = {
      title: 'Mnemo',
      body: anniversaryBody(p.locale || 'en', yearsAgo),
      url: '/archive',
    };
    const result = await sendToSubscriptions(subs as Subscription[], payload);
    await pruneStaleEndpoints(supabase, p.user_id, result.staleEndpoints);
    if (result.sent > 0) {
      await logSend(supabase, p.user_id, 'anniversary');
      sent += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
