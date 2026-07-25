type Field = { name: string; value: string; inline?: boolean };

type Notification = {
  title: string;
  color?: number;
  fields: Field[];
};

/** Which webhook channel to post to. Falls back to DISCORD_WEBHOOK_URL if the
 *  channel-specific var isn't set, so a single legacy var keeps working. */
type Channel = "contacts" | "subscribers" | "leads" | "tickets" | "sales" | "bookings";

const BRAND_PURPLE = 0xa200ff;

function webhookFor(channel: Channel): string | undefined {
  const specific =
    channel === "contacts"
      ? process.env.DISCORD_WEBHOOK_URL_CONTACTS
      : channel === "leads"
        ? process.env.DISCORD_WEBHOOK_URL_LEADS
        : channel === "tickets"
          ? process.env.DISCORD_WEBHOOK_URL_TICKETS
          : channel === "sales"
            ? process.env.DISCORD_WEBHOOK_URL_SALES
            : channel === "bookings"
              ? process.env.DISCORD_WEBHOOK_URL_BOOKINGS
              : process.env.DISCORD_WEBHOOK_URL_SUBSCRIBERS;
  return specific || process.env.DISCORD_WEBHOOK_URL;
}

export async function notifyDiscord(channel: Channel, n: Notification): Promise<void> {
  const url = webhookFor(channel);
  if (!url) return;

  const payload = {
    username: "elenos.ai",
    embeds: [
      {
        title: n.title,
        color: n.color ?? BRAND_PURPLE,
        fields: n.fields
          .filter((f) => f.value && f.value.length > 0)
          .map((f) => ({
            name: f.name,
            value: f.value.length > 1024 ? f.value.slice(0, 1021) + "..." : f.value,
            inline: f.inline ?? false,
          })),
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error("discord webhook failed", err);
  }
}
