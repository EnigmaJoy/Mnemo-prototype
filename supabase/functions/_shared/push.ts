// Shared Web Push helper used by send-nudges and send-anniversaries.
// Runs in Deno (Supabase Edge Function runtime). Uses npm:web-push for the
// VAPID-signed POST to the user's push service.

// @ts-ignore - npm specifier resolved by Deno at runtime
import webpush from 'npm:web-push@3.6.7';
// @ts-ignore - esm.sh URL resolved by Deno at runtime
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: { env: { get: (k: string) => string | undefined }; serve: (h: (req: Request) => Promise<Response> | Response) => void };

let configured = false;
function ensureVapid() {
  if (configured) return;
  const subject = Deno.env.get('VAPID_SUBJECT');
  const pub = Deno.env.get('VAPID_PUBLIC_KEY');
  const priv = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!subject || !pub || !priv) {
    throw new Error('VAPID env vars missing (VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)');
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Subscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendResult = {
  sent: number;
  staleEndpoints: string[];
};

export async function sendToSubscriptions(
  subs: Subscription[],
  payload: { title: string; body: string; url?: string },
): Promise<SendResult> {
  ensureVapid();
  const json = JSON.stringify(payload);
  const stale: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
        sent += 1;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404 / 410 = the push service no longer recognises this endpoint
        // (browser uninstalled, user reset notifications). Drop these from
        // the table so we stop wasting requests on them.
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    }),
  );
  return { sent, staleEndpoints: stale };
}

export async function pruneStaleEndpoints(
  supabase: SupabaseClient,
  userId: string,
  endpoints: string[],
): Promise<void> {
  if (endpoints.length === 0) return;
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .in('endpoint', endpoints);
}

export function localHourInTimezone(tz: string, now: Date = new Date()): number | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: tz,
    });
    const h = parseInt(formatter.format(now), 10);
    if (Number.isNaN(h)) return null;
    return h === 24 ? 0 : h;
  } catch {
    return null;
  }
}

// Used to dedupe: was a notification of this type sent to this user within
// the given number of days? Reads notification_log via service role.
export async function recentlyNotified(
  supabase: SupabaseClient,
  userId: string,
  type: 'nudge' | 'anniversary' | 'resurfacing',
  withinDays: number,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - withinDays * 86_400_000).toISOString();
  const { data } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('sent_at', cutoff)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function logSend(
  supabase: SupabaseClient,
  userId: string,
  type: 'nudge' | 'anniversary' | 'resurfacing',
  fragmentId: string | null = null,
): Promise<void> {
  await supabase.from('notification_log').insert({
    user_id: userId,
    type,
    fragment_id: fragmentId,
  });
}

export const NUDGE_BODY: Record<string, string> = {
  en: 'A quiet thought is worth keeping.',
  it: 'Anche un pensiero silenzioso vale la pena di restare.',
  de: 'Auch ein leiser Gedanke ist es wert, festgehalten zu werden.',
  fr: 'Même une pensée discrète mérite d’être gardée.',
  es: 'Incluso un pensamiento silencioso merece quedarse.',
  zh: '即使是一个安静的想法,也值得留下。',
};

export function nudgeBody(locale: string): string {
  return NUDGE_BODY[locale] ?? NUDGE_BODY.en;
}

export function anniversaryBody(locale: string, years: number): string {
  switch (locale) {
    case 'it':
      return years === 1
        ? 'Un anno con Mnemo. Riguarda da dove sei partito.'
        : `${years} anni con Mnemo. Riguarda da dove sei partito.`;
    case 'de':
      return years === 1
        ? 'Ein Jahr mit Mnemo. Schau, wo du angefangen hast.'
        : `${years} Jahre mit Mnemo. Schau, wo du angefangen hast.`;
    case 'fr':
      return years === 1
        ? 'Un an avec Mnemo. Regarde d’où tu es parti.'
        : `${years} ans avec Mnemo. Regarde d’où tu es parti.`;
    case 'es':
      return years === 1
        ? 'Un año con Mnemo. Mira dónde empezaste.'
        : `${years} años con Mnemo. Mira dónde empezaste.`;
    case 'zh':
      return `与 Mnemo 同行 ${years} 年。回看你的起点。`;
    case 'en':
    default:
      return years === 1
        ? '1 year with Mnemo. Look back to where you started.'
        : `${years} years with Mnemo. Look back to where you started.`;
  }
}
