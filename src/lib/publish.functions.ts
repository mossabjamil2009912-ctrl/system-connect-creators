import { createServerFn } from "@tanstack/react-start";
import type { PlatformId, PostResult } from "./platforms";

interface Input {
  text: string;
  imageDataUrl?: string | undefined;
  targets: { platform: PlatformId; target: string }[];
}

async function sendTelegram(chatId: string, text: string, image?: string): Promise<PostResult> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const tg = process.env["TELEGRAM_API_KEY"];
  if (!lovable || !tg) return { platform: "telegram", status: "pending", message: "تليجرام غير مربوط بعد" };
  const headers = { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": tg };
  const base = "https://connector-gateway.lovable.dev/telegram";
  let res: Response;
  if (image) {
    const blob = await (await fetch(image)).blob();
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", text.slice(0, 1024));
    form.append("photo", blob, "post.jpg");
    res = await fetch(`${base}/sendPhoto`, { method: "POST", headers, body: form });
  } else {
    res = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
  const body = await res.text();
  if (!res.ok) return { platform: "telegram", status: "error", message: `فشل (${res.status}): ${body.slice(0, 200)}` };
  return { platform: "telegram", status: "success", message: "تم النشر في القناة" };
}

export const publishPost = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d.text?.trim() && !d.imageDataUrl) throw new Error("المنشور فارغ");
    return d;
  })
  .handler(async ({ data }) => {
    const results: PostResult[] = [];
    for (const t of data.targets) {
      try {
        if (t.platform === "telegram" && t.target) {
          results.push(await sendTelegram(t.target, data.text, data.imageDataUrl));
        } else {
          results.push({ platform: t.platform, status: "pending", message: "بانتظار ربط مفاتيح المنصة" });
        }
      } catch (e) {
        results.push({ platform: t.platform, status: "error", message: e instanceof Error ? e.message : "خطأ غير معروف" });
      }
    }
    return results;
  });
