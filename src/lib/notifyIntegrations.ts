import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function notifyIntegrations(userId: string, alert: { title: string; description: string; type: string; app_id?: string; review_id?: string }) {
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );

  const { data: webhooks, error } = await supabase
    .from("integration_webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error || !webhooks || webhooks.length === 0) return;

  const promises = webhooks.map(async (wh) => {
    try {
      if (wh.platform === 'slack') {
        await fetch(wh.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `🚨 *${alert.title}*\n${alert.description}` })
        });
      } else if (wh.platform === 'discord') {
        await fetch(wh.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `🚨 **${alert.title}**\n${alert.description}` })
        });
      } else if (wh.platform === 'custom') {
        const payload = JSON.stringify(alert);
        const signature = crypto.createHmac("sha256", wh.secret || '').update(payload).digest("hex");
        await fetch(wh.webhook_url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Mindphor-Signature': signature
          },
          body: payload
        });
      }
    } catch (e) {
      console.error(`Failed to notify webhook ${wh.id}:`, e);
    }
  });

  await Promise.allSettled(promises);
}
