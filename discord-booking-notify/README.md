# Calendly booking → Discord notification

Sends a Discord message every time someone books on Calendly.

> **Important:** this lives in the site repo for safekeeping, but it is **not**
> part of the website. It deploys separately to **Cloudflare Workers**, not
> GitHub Pages.

---

## Which version do I need?

| Your Calendly plan | Use this | Why |
|---|---|---|
| **Free** | **Email Worker** (the default — `worker.js`) | Calendly's webhook API is paid-only, but the free plan still **emails** you on every booking. We parse that email. |
| **Standard / Teams / Enterprise** | **Native webhook** (see bottom) | Clean JSON payload, no email parsing — more reliable. |

You're on the **free plan**, so follow **Path A**.

---

## Step 0 — Create the Discord webhook (both paths)

1. In Discord: **Server Settings → Integrations → Webhooks → New Webhook**.
2. Pick the channel, name it (e.g. `Calendly`), **Copy Webhook URL**.
3. Keep that URL handy — it's a secret.

---

## Path A — Free plan (Email Worker)

This routes the Calendly confirmation email through Cloudflare to the Worker.

**Requirement:** `elenos.ai`'s DNS must be on Cloudflare so you can use
**Email Routing**. (It's free. If your DNS is elsewhere, you'd move the domain's
nameservers to Cloudflare — GitHub Pages keeps working via the same DNS records.)

### 1. Deploy the Worker

```bash
cd discord-booking-notify
npx wrangler login
npx wrangler secret put DISCORD_WEBHOOK_URL   # paste the Discord URL when prompted
npx wrangler deploy
```

### 2. Enable Email Routing + route to the Worker

1. Cloudflare dashboard → your `elenos.ai` zone → **Email → Email Routing** →
   enable it (this adds the required MX/TXT records automatically).
2. **Email Routing → Routes → Custom address** → create e.g.
   `bookings@elenos.ai`.
3. Set its action to **Send to a Worker** → pick `calendly-discord-notify`.

### 3. Point Calendly's notification email at it

On the free plan you can't change the destination per-event, so forward the
booking emails:

- **If Calendly notifies you at a Gmail address:** Gmail → **Settings → Filters
  → Create filter** with `from:notifications@calendly.com` and
  `subject:"New Event"`, action **Forward to** `bookings@elenos.ai`. (Gmail makes
  you verify the forwarding address once — approve it from the Worker logs via
  `npx wrangler tail`, or temporarily route `bookings@` to your inbox to grab the
  code.)
- **If you can set your Calendly account email** to `bookings@elenos.ai`
  directly, even simpler — booking emails land straight on the Worker.

### 4. Test

Book a slot on https://calendly.com/ed-elenos/30min (use a different email).
Within a few seconds you should see the Discord message. Tail logs while testing:

```bash
npx wrangler tail
```

If nothing arrives: check the email actually reached `bookings@elenos.ai`
(Email Routing → Activity log), then check `wrangler tail` for parse/post errors.

---

## Path B — Paid plan (Native webhook) — for later

If you upgrade Calendly, swap `worker.js` for the HTTP version below. It receives
Calendly's real JSON, so no email parsing and no Email Routing setup.

Replace the contents of `worker.js` with:

```js
const BRAND_PURPLE = 0xa200ff;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("ok"); // health check
    const body = await request.json();

    // Calendly sends invitee.created / invitee.canceled
    const p = body.payload || {};
    const eventType = body.event === "invitee.canceled" ? "❌ Cancelled" : "📅 New booking";
    const name = p.name || p.email || "Someone";
    const start = p?.scheduled_event?.start_time;

    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Calendly",
        embeds: [{
          title: eventType,
          description: `**${name}** — ${p?.scheduled_event?.name || "meeting"}`,
          color: BRAND_PURPLE,
          fields: [
            p.email ? { name: "Email", value: p.email, inline: true } : null,
            start ? { name: "When", value: new Date(start).toUTCString(), inline: true } : null,
          ].filter(Boolean),
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    return new Response("ok");
  },
};
```

Then:

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy          # note the *.workers.dev URL it prints
```

Register the webhook with Calendly (one-time, needs a paid Personal Access Token
from https://calendly.com/integrations/api_webhooks):

```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer YOUR_CALENDLY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://calendly-discord-notify.<your-subdomain>.workers.dev",
    "events": ["invitee.created", "invitee.canceled"],
    "organization": "https://api.calendly.com/organizations/YOUR_ORG_UUID",
    "scope": "organization"
  }'
```

(Get your org UUID from `GET https://api.calendly.com/users/me`.)
