import { createServerFn } from "@tanstack/react-start";
import type { PlatformId, PostResult } from "./platforms";

interface Input {
  text: string;
  imageDataUrl?: string | undefined;
  igImageDataUrl?: string | undefined;
  tiktokToken?: string | undefined;
  tiktokVideoDataUrl?: string | undefined;
  targets: { platform: PlatformId; target: string }[];
}

async function sendTelegram(chatId: string, text: string, image?: string): Promise<PostResult> {
  const tg = process.env["TELEGRAM_API_KEY"];
  if (!tg) return { platform: "telegram", status: "pending", message: "تليجرام غير مربوط بعد" };
  const headers = {};
  const base = `https://api.telegram.org/bot${tg}`;
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

const GRAPH = "https://graph.facebook.com/v21.0";

async function uploadFbPhoto(image: string, caption: string, published: boolean) {
  const token = process.env["FACEBOOK_PAGE_ACCESS_TOKEN"]!;
  const pageId = process.env["FACEBOOK_PAGE_ID"]!;
  const blob = await (await fetch(image)).blob();
  const form = new FormData();
  form.append("source", blob, "post.jpg");
  form.append("caption", caption);
  form.append("published", String(published));
  form.append("access_token", token);
  const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body: form });
  const body = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || !body.id) throw new Error(body.error?.message ?? `فشل (${res.status})`);
  return body.id;
}

async function sendFacebook(text: string, image?: string): Promise<PostResult> {
  const token = process.env["FACEBOOK_PAGE_ACCESS_TOKEN"];
  const pageId = process.env["FACEBOOK_PAGE_ID"];
  if (!token || !pageId) return { platform: "facebook", status: "pending", message: "فيسبوك غير مربوط" };
  if (image) {
    await uploadFbPhoto(image, text, true);
  } else {
    const res = await fetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, access_token: token }),
    });
    const body = await res.json() as { error?: { message: string } };
    if (!res.ok) return { platform: "facebook", status: "error", message: body.error?.message ?? `فشل (${res.status})` };
  }
  return { platform: "facebook", status: "success", message: "تم النشر في الصفحة" };
}

async function sendInstagram(text: string, image?: string): Promise<PostResult> {
  const token = process.env["FACEBOOK_PAGE_ACCESS_TOKEN"];
  const igId = process.env["INSTAGRAM_BUSINESS_ACCOUNT_ID"];
  if (!token || !igId) return { platform: "instagram", status: "pending", message: "إنستغرام غير مربوط" };
  if (!image) return { platform: "instagram", status: "error", message: "إنستغرام يتطلب صورة" };
  // Instagram needs a public image URL: host it as an unpublished Facebook photo first.
  const photoId = await uploadFbPhoto(image, "", false);
  const info = await (await fetch(`${GRAPH}/${photoId}?fields=images&access_token=${token}`)).json() as { images?: { source: string }[] };
  const url = info.images?.[0]?.source;
  if (!url) return { platform: "instagram", status: "error", message: "تعذر تجهيز رابط الصورة" };
  const c = await fetch(`${GRAPH}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: url, caption: text, access_token: token }),
  });
  const cb = await c.json() as { id?: string; error?: { message: string } };
  if (!c.ok || !cb.id) return { platform: "instagram", status: "error", message: cb.error?.message ?? "فشل إنشاء المنشور" };
  for (let i = 0; i < 10; i++) {
    const p = await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: cb.id, access_token: token }),
    });
    const pb = await p.json() as { id?: string; error?: { message: string; code?: number } };
    if (p.ok && pb.id) return { platform: "instagram", status: "success", message: "تم النشر في إنستغرام" };
    if (pb.error?.code !== 9007) return { platform: "instagram", status: "error", message: pb.error?.message ?? "فشل النشر" };
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { platform: "instagram", status: "error", message: "انتهت مهلة تجهيز الصورة" };
}

async function sendTikTok(token: string | undefined, text: string, video?: string): Promise<PostResult> {
  if (!token) return { platform: "tiktok", status: "pending", message: "اربط تيك توك من صفحة الربط أولاً" };
  if (!video) return { platform: "tiktok", status: "error", message: "تيك توك يتطلب صورة" };
  const bytes = new Uint8Array(await (await fetch(video)).arrayBuffer());
  const size = bytes.byteLength;
  const init = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: { title: text.slice(0, 2200), privacy_level: "SELF_ONLY", disable_comment: false, disable_duet: false, disable_stitch: false },
      source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 },
    }),
  });
  const ib = await init.json() as { data?: { upload_url?: string }; error?: { code?: string; message?: string } };
  const uploadUrl = ib.data?.upload_url;
  if (!init.ok || !uploadUrl) return { platform: "tiktok", status: "error", message: ib.error?.message || ib.error?.code || `فشل (${init.status})` };
  const up = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/webm", "Content-Range": `bytes 0-${size - 1}/${size}` },
    body: bytes,
  });
  if (!up.ok) return { platform: "tiktok", status: "error", message: `فشل رفع الفيديو (${up.status})` };
  return { platform: "tiktok", status: "success", message: "أُرسل إلى تيك توك (خاص لك في وضع التجربة)" };
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
        } else if (t.platform === "facebook") {
          results.push(await sendFacebook(data.text, data.imageDataUrl));
        } else if (t.platform === "instagram") {
          results.push(await sendInstagram(data.text, data.igImageDataUrl ?? data.imageDataUrl));
        } else if (t.platform === "tiktok") {
          results.push(await sendTikTok(data.tiktokToken, data.text, data.tiktokVideoDataUrl));
        } else {
          results.push({ platform: t.platform, status: "pending", message: "بانتظار ربط مفاتيح المنصة" });
        }
      } catch (e) {
        results.push({ platform: t.platform, status: "error", message: e instanceof Error ? e.message : "خطأ غير معروف" });
      }
    }
    return results;
  });

export const checkConnections = createServerFn({ method: "POST" })
  .inputValidator((d: { telegramTarget?: string }) => d)
  .handler(async ({ data }) => {
    const out: Record<string, { ok: boolean; message: string }> = {};
    const token = process.env["FACEBOOK_PAGE_ACCESS_TOKEN"];
    const pageId = process.env["FACEBOOK_PAGE_ID"];
    const igId = process.env["INSTAGRAM_BUSINESS_ACCOUNT_ID"];
    try {
      if (!token || !pageId) out["facebook"] = { ok: false, message: "غير مربوط" };
      else {
        const b = await (await fetch(`${GRAPH}/${pageId}?fields=name&access_token=${token}`)).json() as { name?: string; error?: { message: string } };
        out["facebook"] = b.name ? { ok: true, message: `متصل: ${b.name}` } : { ok: false, message: b.error?.message ?? "فشل" };
      }
    } catch { out["facebook"] = { ok: false, message: "تعذر الاتصال" }; }
    try {
      if (!token || !igId) out["instagram"] = { ok: false, message: "غير مربوط" };
      else {
        const b = await (await fetch(`${GRAPH}/${igId}?fields=username&access_token=${token}`)).json() as { username?: string; error?: { message: string } };
        out["instagram"] = b.username ? { ok: true, message: `متصل: @${b.username}` } : { ok: false, message: b.error?.message ?? "فشل" };
      }
    } catch { out["instagram"] = { ok: false, message: "تعذر الاتصال" }; }
    try {
      const tg = process.env["TELEGRAM_API_KEY"];
      if (!tg) out["telegram"] = { ok: false, message: "غير مربوط" };
      else {
        const headers = { "Content-Type": "application/json" };
        const base = `https://api.telegram.org/bot${tg}`;
        if (data.telegramTarget) {
          const b = await (await fetch(`${base}/getChat`, { method: "POST", headers, body: JSON.stringify({ chat_id: data.telegramTarget }) })).json() as { ok?: boolean; result?: { title?: string }; description?: string };
          out["telegram"] = b.ok ? { ok: true, message: `متصل: ${b.result?.title ?? data.telegramTarget}` } : { ok: false, message: b.description ?? "القناة غير صحيحة" };
        } else {
          const b = await (await fetch(`${base}/getMe`, { method: "POST", headers, body: "{}" })).json() as { ok?: boolean; result?: { username?: string } };
          out["telegram"] = b.ok ? { ok: true, message: `البوت يعمل: @${b.result?.username} — أضف القناة` } : { ok: false, message: "فشل" };
        }
      }
    } catch { out["telegram"] = { ok: false, message: "تعذر الاتصال" }; }
    return out;
  });
