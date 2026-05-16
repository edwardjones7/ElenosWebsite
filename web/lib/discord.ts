type Field = { name: string; value: string; inline?: boolean };

type Notification = {
  title: string;
  color?: number;
  fields: Field[];
};

const BRAND_PURPLE = 0xa200ff;

export async function notifyDiscord(n: Notification): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
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
