// send-nudges — Supabase Edge Function (Deno).
//
// CRON: hourly via pg_cron (`0 * * * *`).
//
// LOGIC: for each user where notification_preferences.nudge_enabled = true,
// fire a push if the user's local hour (their stored timezone) equals their
// chosen nudge_hour AND no nudge of this type has been sent in the last
// nudge_days_inactive days.
//
// SEMANTICS: nudge_days_inactive is "minimum days between nudges", NOT
// "minimum days of inactivity". The server has no knowledge of when the user
// last opened the app or wrote a fragment (that lived in localStorage when
// this notion was originally drafted). This is the rate-limit interpretation
// we agreed on at design time.

import {
  adminClient,
  logSend,
  nudgeBody,
  pruneStaleEndpoints,
  recentlyNotified,
  sendToSubscriptions,
  localHourInTimezone,
  type Subscription,
} from '../_shared/push.ts';

declare const Deno: { serve: (h: (req: Request) => Promise<Response> | Response) => void };

Deno.serve(async () => {
  const supabase = adminClient();

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('user_id, nudge_hour, nudge_days_inactive, timezone, locale')
    .eq('nudge_enabled', true);
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

    const localHour = localHourInTimezone(p.timezone || 'UTC', now);
    if (localHour === null) continue;
    if (localHour !== p.nudge_hour) continue;

    if (await recentlyNotified(supabase, p.user_id, 'nudge', p.nudge_days_inactive)) {
      continue;
    }

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', p.user_id);
    if (!subs || subs.length === 0) continue;

    const payload = {
      title: 'Mnemo',
      body: nudgeBody(p.locale || 'en'),
      url: '/capture',
    };
    const result = await sendToSubscriptions(subs as Subscription[], payload);
    await pruneStaleEndpoints(supabase, p.user_id, result.staleEndpoints);
    if (result.sent > 0) {
      await logSend(supabase, p.user_id, 'nudge');
      sent += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, processed, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
