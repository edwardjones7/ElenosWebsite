/** Google Calendar integration for the /book scheduler.
 *
 *  Raw fetch, no SDK (matches email.ts / discord.ts / stripe). Auth is a single
 *  owner account via a long-lived refresh token minted once out-of-band
 *  (see scripts/get-google-token.mjs). We read free/busy to compute availability
 *  and write an event (with an auto-generated Google Meet link) on each booking.
 *
 *  Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 *       GOOGLE_CALENDAR_ID (default "primary").
 *
 *  Functions throw on hard failure; callers decide how to degrade. */

import { randomUUID } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

export type BusyInterval = { start: string; end: string };

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

/** True when all three Google credentials are present. Lets callers skip the
 *  integration gracefully (e.g. in local dev without Google set up). */
export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

// In-module access-token cache (survives across requests on a warm lambda).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar credentials are not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Google token exchange failed (${res.status}): ${await res.text().catch(() => "")}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      value: data.access_token,
      expiresAt: now + (data.expires_in || 3600) * 1000,
    };
    return cachedToken.value;
  } finally {
    clearTimeout(timeout);
  }
}

async function calFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(`${CAL_BASE}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Busy intervals on the owner calendar between two ISO instants. */
export async function getBusy(fromISO: string, toISO: string): Promise<BusyInterval[]> {
  const res = await calFetch("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: fromISO,
      timeMax: toISO,
      items: [{ id: calendarId() }],
    }),
  });
  if (!res.ok) {
    throw new Error(`freeBusy failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: BusyInterval[] }>;
  };
  return data.calendars?.[calendarId()]?.busy || [];
}

export type CreateEventInput = {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  /** IANA tz the event is displayed in (owner tz). */
  timeZone: string;
};

export type CreatedEvent = { eventId: string; meetUrl: string | null };

/** Creates a calendar event with an auto-generated Google Meet link.
 *  Owner-only (no attendees) so Google sends no invite of its own — our branded
 *  confirmation email is the single source of truth. */
export async function createEvent(input: CreateEventInput): Promise<CreatedEvent> {
  const requestId = `elenos-${randomUUID()}`;
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId())}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: input.summary,
        description: input.description || "",
        start: { dateTime: input.startISO, timeZone: input.timeZone },
        end: { dateTime: input.endISO, timeZone: input.timeZone },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`event insert failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };
  const video = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return { eventId: data.id, meetUrl: video?.uri || data.hangoutLink || null };
}



/** Moves an existing event to a new time (reschedule). Keeps the Meet link. */
export async function updateEvent(
  eventId: string,
  input: { startISO: string; endISO: string; timeZone: string },
): Promise<void> {
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        start: { dateTime: input.startISO, timeZone: input.timeZone },
        end: { dateTime: input.endISO, timeZone: input.timeZone },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`event patch failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
}

/** Deletes an event (cancel). A 404/410 is treated as already-gone. */
export async function deleteEvent(eventId: string): Promise<void> {
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`event delete failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
}
