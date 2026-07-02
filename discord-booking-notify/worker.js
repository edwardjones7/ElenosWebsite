/**
 * Cloudflare EMAIL Worker — Calendly booking → Discord notification
 * -----------------------------------------------------------------
 * Works on Calendly's FREE plan (no paid webhook API needed).
 *
 * Flow:
 *   Someone books on Calendly
 *     → Calendly emails the host a "New Event" confirmation
 *     → that email is routed to this Worker (Cloudflare Email Routing)
 *     → this Worker parses it and POSTs a Discord embed via a webhook
 *
 * Setup lives in ./README.md. The Discord webhook URL is stored as a
 * Cloudflare secret named DISCORD_WEBHOOK_URL — it is NOT in this file.
 *
 * If you later upgrade Calendly to a paid plan, switch to the cleaner
 * native-webhook version at the bottom of README.md (real JSON, no
 * email parsing).
 */

const BRAND_PURPLE = 0xa200ff; // matches the site accent (#a200ff)

export default {
  async email(message, env) {
    // --- 1. Only act on real Calendly notifications -------------------
    const from = (message.from || "").toLowerCase();
    if (!from.includes("calendly.com")) {
      // Not from Calendly — ignore (and don't bounce loudly).
      return;
    }

    // --- 2. Pull what we can out of the email ------------------------
    const subject = message.headers.get("subject") || "New Calendly booking";

    // Subject is the most reliable signal, e.g.
    //   "New Event: 30 Minute Meeting - Jane Doe, 09:00 Mon Jun 15, 2026"
    const title = subject.replace(/^new event:\s*/i, "").trim() || subject;

    // Best-effort extras from the email body (resilient to format drift).
    let body = "";
    try {
      body = await new Response(message.raw).text();
    } catch {
      // If the raw stream can't be read, we still send the subject-only ping.
    }

    const inviteeEmail = extractInviteeEmail(body);
    const eventTime = extractEventTime(body);

    // --- 3. Build the Discord message --------------------------------
    const fields = [];
    if (inviteeEmail) fields.push({ name: "Invitee", value: inviteeEmail, inline: true });
    if (eventTime) fields.push({ name: "When", value: eventTime, inline: true });

    const payload = {
      username: "Calendly",
      embeds: [
        {
          title: "📅 New booking",
          description: `**${title}**`,
          color: BRAND_PURPLE,
          fields,
          footer: { text: "via Calendly → Cloudflare → Discord" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // --- 4. Send it --------------------------------------------------
    const res = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Surfaces in `wrangler tail` / the Worker logs so you can debug.
      console.error("Discord webhook failed", res.status, await res.text());
    }
  },
};

/** Grab the first email address in the body that isn't Calendly's own. */
function extractInviteeEmail(body) {
  if (!body) return null;
  const matches = body.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  const invitee = matches.find((e) => !/calendly\.com$/i.test(e.split("@")[1] || ""));
  return invitee || null;
}

/**
 * Best-effort time pull. Calendly emails contain a line like
 * "09:00 - 09:30, Monday, June 15, 2026". We grab the first plausible
 * time+date string; if the format ever changes we simply omit the field.
 */
function extractEventTime(body) {
  if (!body) return null;
  // Decode quoted-printable soft breaks so the regex can span lines.
  const text = body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  const m = text.match(
    /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b[^\n<]{0,60}?\b(?:January|February|March|April|May|June|July|August|September|October|November|December)[^\n<]{0,15}\d{4}/i
  );
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}
