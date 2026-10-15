import type { PostResult } from "./platforms";

const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function creds() {
  const ck = process.env["TWITTER_API_KEY"], cs = process.env["TWITTER_API_SECRET"];
  const at = process.env["TWITTER_ACCESS_TOKEN"], as = process.env["TWITTER_ACCESS_TOKEN_SECRET"];
  return ck && cs && at && as ? { ck, cs, at, as } : null;
}

async function authHeader(method: string, url: string, extra: Record<string, string> = {}) {
  const c = creds()!;
  const o: Record<string, string> = {
    oauth_consumer_key: c.ck,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: c.at,
    oauth_version: "1.0",
  };
  const all = { ...o, ...extra };
  const params = Object.keys(all).sort().map((k) => `${enc(k)}=${enc(all[k]!)}`).join("&");
  const base = `${method}&${enc(url)}&${enc(params)}`;
  o["oauth_signature"] = await hmac(`${enc(c.cs)}&${enc(c.as)}`, base);
  return "OAuth " + Object.keys(o).sort().map((k) => `${enc(k)}="${enc(o[k]!)}"`).join(", ");
}

export function twitterConfigured() { return !!creds(); }

export async function sendTwitter(text: string, image?: string): Promise<PostResult> {
  if (!creds()) return { platform: "twitter", status: "pending", message: "تويتر غير مربوط" };
  let mediaId: string | undefined;
  if (image) {
    const url = "https://upload.twitter.com/1.1/media/upload.json";
    const blob = await (await fetch(image)).blob();
    const form = new FormData();
    form.append("media", blob, "post.jpg");
    const r = await fetch(url, { method: "POST", headers: { Authorization: await authHeader("POST", url) }, body: form });
    const b = await r.json() as { media_id_string?: string; errors?: { message: string }[] };
    if (!r.ok || !b.media_id_string) return { platform: "twitter", status: "error", message: b.errors?.[0]?.message ?? `فشل رفع الصورة (${r.status})` };
    mediaId = b.media_id_string;
  }
  const url = "https://api.twitter.com/2/tweets";
  const body: Record<string, unknown> = { text: text.slice(0, 280) };
  if (mediaId) body["media"] = { media_ids: [mediaId] };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: await authHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const b = await r.json() as { data?: { id: string }; detail?: string; title?: string };
  if (!r.ok || !b.data) {
    const msg = r.status === 402 ? "حساب X بلا رصيد — أضف رصيداً من Buy Credits" : (b.detail ?? b.title ?? `فشل (${r.status})`);
    return { platform: "twitter", status: "error", message: msg };
  }
  return { platform: "twitter", status: "success", message: "تم النشر في X" };
}

export async function checkTwitter(): Promise<{ ok: boolean; message: string }> {
  if (!creds()) return { ok: false, message: "غير مربوط" };
  const url = "https://api.twitter.com/2/users/me";
  const r = await fetch(url, { headers: { Authorization: await authHeader("GET", url) } });
  const b = await r.json() as { data?: { username: string }; detail?: string; title?: string };
  return b.data ? { ok: true, message: `متصل: @${b.data.username}` } : { ok: false, message: r.status === 402 ? "المفاتيح صحيحة لكن الحساب بلا رصيد" : (b.detail ?? b.title ?? `فشل (${r.status})`) };
}
