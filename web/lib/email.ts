/** Transactional email via the Resend REST API (no SDK — one fetch).
 *  Used by /api/lead to deliver the guide PDF + Discord invite. */

const BRAND_PURPLE = "#a200ff";

type UnlockEmail = {
  name: string;
  email: string;
};

type SendResult = { sent: boolean };

function unlockHtml(firstName: string, pdfUrl: string, discordUrl: string): string {
  // Table layout + inline styles: the only thing email clients respect.
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:32px;" align="center">
          <img src="https://elenos.ai/images/wordmark-white.png" alt="Elenos" width="120" style="display:block;">
        </td></tr>
        <tr><td style="border:1px solid rgba(255,255,255,0.12);background-color:#05030a;padding:40px 32px;">
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Access unlocked</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">You're in, ${firstName}.</h1>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            Two things, as promised: the no-hype guide to how AI actually gets used, and your invite to the private Elenos Discord — where the systems in the guide get built and discussed.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding-bottom:12px;">
              <a href="${pdfUrl}" style="display:block;text-align:center;background-color:${BRAND_PURPLE};color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 24px;border-radius:999px;">Get the guide →</a>
            </td></tr>
            <tr><td>
              <a href="${discordUrl}" style="display:block;text-align:center;background-color:transparent;border:1px solid rgba(255,255,255,0.25);color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:13px 24px;border-radius:999px;">Join the Discord →</a>
            </td></tr>
          </table>
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Hit reply if anything's broken — a human reads this inbox.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;border-top:1px solid rgba(255,255,255,0.12);">
            <tr><td style="padding-top:24px;">
              <p style="margin:0 0 6px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">P.S.</p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.55);">
                When you're ready to get <em>paid</em> for this stuff — <a href="https://elenos.ai/course/" style="color:#ffffff;text-decoration:underline;">Getting Your First AI Client</a> is the $49 playbook: positioning, outreach scripts, and the sales call, start to finish.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.35);">© Elenos Solutions · elenos.ai</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type CourseModule = { title: string; url: string };

/** COURSE_PDF_LINKS is a JSON array: [{"title":"01 — Pick your lane","url":"https://..."}, ...] */
function courseModules(): CourseModule[] {
  try {
    const parsed = JSON.parse(process.env.COURSE_PDF_LINKS || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is CourseModule => !!m && typeof m.title === "string" && typeof m.url === "string");
  } catch {
    return [];
  }
}

function courseHtml(firstName: string, modules: CourseModule[], discordUrl: string | undefined): string {
  const moduleRows = modules
    .map(
      (m) => `<tr><td style="padding-bottom:12px;">
              <a href="${m.url}" style="display:block;text-align:left;background-color:transparent;border:1px solid rgba(255,255,255,0.25);color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:13px 20px;border-radius:12px;">${m.title} <span style="color:${BRAND_PURPLE};">→</span></a>
            </td></tr>`,
    )
    .join("");
  const discordRow = discordUrl
    ? `<tr><td style="padding-top:8px;">
              <a href="${discordUrl}" style="display:block;text-align:center;background-color:${BRAND_PURPLE};color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 24px;border-radius:999px;">Join the private Discord →</a>
            </td></tr>`
    : "";
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:32px;" align="center">
          <img src="https://elenos.ai/images/wordmark-white.png" alt="Elenos" width="120" style="display:block;">
        </td></tr>
        <tr><td style="border:1px solid rgba(255,255,255,0.12);background-color:#05030a;padding:40px 32px;">
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Purchase confirmed</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">Let's get you a client, ${firstName}.</h1>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            Every module of <em>Getting Your First AI Client</em> is below. Work them in order — the whole thing reads in a weekend. Keep this email; the links are yours for good.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${moduleRows}
            ${discordRow}
          </table>
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Hit reply if anything's broken — a human reads this inbox.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.35);">© Elenos Solutions · elenos.ai</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Sends the course delivery email with links to every module PDF.
 *  Resolves { sent: false } (never throws) when RESEND_API_KEY or
 *  COURSE_PDF_LINKS is unset/invalid, so the purchase is still recorded
 *  and can be delivered manually. */
export async function sendCoursePurchaseEmail({ name, email }: { name: string | null; email: string }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const modules = courseModules();
  if (!apiKey || modules.length === 0) return { sent: false };

  const firstName = (name || "").split(/\s+/)[0] || "there";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Elenos <ed@elenos.ai>",
        to: [email],
        subject: "Your course is here — Getting Your First AI Client",
        html: courseHtml(firstName, modules, process.env.DISCORD_INVITE_URL),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) console.error("resend failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("resend request failed", err);
    return { sent: false };
  }
}

/** Shared shell for the simpler follow-up emails (welcome / acknowledgment):
 *  wordmark header, dark card with the given inner HTML, footer. */
function cardShell(inner: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:32px;" align="center">
          <img src="https://elenos.ai/images/wordmark-white.png" alt="Elenos" width="120" style="display:block;">
        </td></tr>
        <tr><td style="border:1px solid rgba(255,255,255,0.12);background-color:#05030a;padding:40px 32px;">
          ${inner}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.35);">© Elenos Solutions · elenos.ai</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Elenos <ed@elenos.ai>",
        to: [to],
        subject,
        html,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) console.error("resend failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("resend request failed", err);
    return { sent: false };
  }
}

/** Welcome email for new newsletter subscribers. Never throws. */
export async function sendSubscribeWelcomeEmail({
  email,
  unsubscribeUrl,
}: {
  email: string;
  unsubscribeUrl: string;
}): Promise<SendResult> {
  const discordUrl = process.env.DISCORD_INVITE_URL;
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">You're on the list</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">Welcome to the other side.</h1>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            No hype, no tool roundups. Occasional dispatches on the AI systems real businesses run to make money — what's working, what's worth copying, and what to ignore.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding-bottom:12px;">
              <a href="https://elenos.ai/learn/" style="display:block;text-align:center;background-color:${BRAND_PURPLE};color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 24px;border-radius:999px;">Get the free guide →</a>
            </td></tr>${
              discordUrl
                ? `
            <tr><td>
              <a href="${discordUrl}" style="display:block;text-align:center;background-color:transparent;border:1px solid rgba(255,255,255,0.25);color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:13px 24px;border-radius:999px;">Join the Discord →</a>
            </td></tr>`
                : ""
            }
          </table>
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Hit reply anytime — a human reads this inbox. Don't want these? <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.45);text-decoration:underline;">Unsubscribe</a>.
          </p>`;
  return sendViaResend(email, "You're in — Elenos", cardShell(inner));
}

/** Acknowledgment for contact-form submissions. Never throws. */
export async function sendContactAckEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<SendResult> {
  const firstName = name.split(/\s+/)[0] || "there";
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Message received</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">Got it, ${firstName}.</h1>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            Your message landed in a real inbox — no ticket queue, no autoresponder maze. Ed reads every one and you'll hear back within one business day, usually sooner.
          </p>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            In the meantime, if you want to see how we work: <a href="https://elenos.ai/work/" style="color:#ffffff;text-decoration:underline;">recent builds</a>.
          </p>
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Need to add something? Just reply to this email — it threads straight to Ed.
          </p>`;
  return sendViaResend(email, `Got your message, ${firstName} — Elenos`, cardShell(inner));
}

function primaryBtn(href: string, label: string): string {
  return `<a href="${href}" style="display:block;text-align:center;background-color:${BRAND_PURPLE};color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 24px;border-radius:999px;">${label}</a>`;
}
function ghostBtn(href: string, label: string): string {
  return `<a href="${href}" style="display:block;text-align:center;background-color:transparent;border:1px solid rgba(255,255,255,0.25);color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:13px 24px;border-radius:999px;">${label}</a>`;
}

type BookingEmail = {
  name: string;
  email: string;
  whenLabel: string; // date/time already formatted in the visitor's timezone
  meetUrl?: string | null;
  addToCalendarUrl?: string | null;
  manageUrl?: string | null;
};

/** Confirmation for a new booking: time, Google Meet link, add-to-calendar,
 *  and reschedule/cancel links. Never throws. */
export async function sendBookingConfirmationEmail({
  name,
  email,
  whenLabel,
  meetUrl,
  addToCalendarUrl,
  manageUrl,
}: BookingEmail): Promise<SendResult> {
  const firstName = name.split(/\s+/)[0] || "there";
  const meetRow = meetUrl
    ? `<tr><td style="padding-bottom:12px;">${primaryBtn(meetUrl, "Join the Google Meet →")}</td></tr>`
    : "";
  const calRow = addToCalendarUrl
    ? `<tr><td style="padding-bottom:12px;">${ghostBtn(addToCalendarUrl, "Add to calendar →")}</td></tr>`
    : "";
  const meetLine = meetUrl
    ? `Your Google Meet link is below — it's also on the calendar invite.`
    : `We'll send your video link before the call.`;
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Call confirmed</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">You're booked, ${firstName}.</h1>
          <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            <strong style="color:#ffffff;">${whenLabel}</strong>
          </p>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            30 minutes, no slides. ${meetLine}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${meetRow}${calRow}
          </table>${
            manageUrl
              ? `
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Need a different time? <a href="${manageUrl}" style="color:#ffffff;text-decoration:underline;">Reschedule or cancel</a> — no login needed.
          </p>`
              : ""
          }
          <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Or just reply to this email — a human reads it.
          </p>`;
  return sendViaResend(email, `You're booked, ${firstName} — Elenos`, cardShell(inner));
}

/** Confirmation that a booking was moved to a new time. Never throws. */
export async function sendBookingRescheduleEmail({
  name,
  email,
  whenLabel,
  meetUrl,
  manageUrl,
}: BookingEmail): Promise<SendResult> {
  const firstName = name.split(/\s+/)[0] || "there";
  const meetRow = meetUrl
    ? `<tr><td style="padding-bottom:12px;">${primaryBtn(meetUrl, "Join the Google Meet →")}</td></tr>`
    : "";
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Call rescheduled</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">New time locked in, ${firstName}.</h1>
          <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            <strong style="color:#ffffff;">${whenLabel}</strong>
          </p>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            Same call, new slot. The video link is unchanged.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${meetRow}
          </table>${
            manageUrl
              ? `
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Need to change it again? <a href="${manageUrl}" style="color:#ffffff;text-decoration:underline;">Reschedule or cancel</a>.
          </p>`
              : ""
          }`;
  return sendViaResend(email, `Rescheduled — Elenos discovery call`, cardShell(inner));
}

/** Copy for each step of the pre-call reminder sequence. Reminders only — the
 *  job is to get them on the call, so no other links compete with the Meet button. */
const REMINDER_COPY = {
  "3d": {
    subject: "In 3 days — your Elenos discovery call",
    eyebrow: "In 3 days",
    heading: (n: string) => `Three days out, ${n}.`,
    body: "Nothing to prepare. Come with the thing you're trying to fix and we'll talk through it.",
    showManage: true,
  },
  "24h": {
    subject: "Tomorrow — your Elenos discovery call",
    eyebrow: "Tomorrow",
    heading: (n: string) => `See you tomorrow, ${n}.`,
    body: "30 minutes, no slides. Your Google Meet link is below and on the calendar invite.",
    showManage: true,
  },
  "20m": {
    subject: "Starting in 20 minutes — Elenos discovery call",
    eyebrow: "Starting soon",
    heading: (n: string) => `20 minutes out, ${n}.`,
    body: "Good time to grab coffee and find a quiet spot. Link's below.",
    showManage: false,
  },
  start: {
    subject: "Starting now — Elenos discovery call",
    eyebrow: "Starting now",
    heading: (n: string) => `We're live, ${n}.`,
    body: "Jumping on now — join whenever you're ready.",
    showManage: false,
  },
} as const;

export type ReminderEmailKind = keyof typeof REMINDER_COPY;

/** One step of the pre-call sequence. Never throws. */
export async function sendBookingReminderEmail({
  kind,
  name,
  email,
  whenLabel,
  meetUrl,
  manageUrl,
}: BookingEmail & { kind: ReminderEmailKind }): Promise<SendResult> {
  const firstName = name.split(/\s+/)[0] || "there";
  const copy = REMINDER_COPY[kind];
  const meetRow = meetUrl
    ? `<tr><td>${primaryBtn(meetUrl, "Join the Google Meet →")}</td></tr>`
    : "";
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">${copy.eyebrow}</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">${copy.heading(firstName)}</h1>
          <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            <strong style="color:#ffffff;">${whenLabel}</strong>
          </p>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            ${copy.body}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${meetRow}
          </table>${
            copy.showManage && manageUrl
              ? `
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Something come up? <a href="${manageUrl}" style="color:#ffffff;text-decoration:underline;">Reschedule or cancel</a> — no login needed.
          </p>`
              : `
          <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
            Running late? Just reply — a human reads it.
          </p>`
          }`;
  return sendViaResend(email, copy.subject, cardShell(inner));
}

/** Confirmation that a booking was canceled. Never throws. */
export async function sendBookingCancelEmail({
  name,
  email,
  rebookUrl,
}: {
  name: string;
  email: string;
  rebookUrl: string;
}): Promise<SendResult> {
  const firstName = name.split(/\s+/)[0] || "there";
  const inner = `
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_PURPLE};">Call canceled</p>
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;color:#ffffff;">All set, ${firstName} — that's canceled.</h1>
          <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
            Your discovery call has been removed from the calendar. No hard feelings — when the timing's right, the door's open.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td>${primaryBtn(rebookUrl, "Book another time →")}</td></tr>
          </table>`;
  return sendViaResend(email, `Canceled — Elenos discovery call`, cardShell(inner));
}

/** Sends the /learn unlock email. Resolves { sent: false } (never throws) when
 *  RESEND_API_KEY is unset or Resend errors, so the lead is still captured. */
export async function sendLeadUnlockEmail({ name, email }: UnlockEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const pdfUrl = process.env.LEAD_PDF_URL;
  const discordUrl = process.env.DISCORD_INVITE_URL;
  if (!apiKey || !pdfUrl || !discordUrl) return { sent: false };

  const firstName = name.split(/\s+/)[0] || "there";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Elenos <ed@elenos.ai>",
        to: [email],
        subject: "Your guide + Discord access — Elenos",
        html: unlockHtml(firstName, pdfUrl, discordUrl),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) console.error("resend failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("resend request failed", err);
    return { sent: false };
  }
}
