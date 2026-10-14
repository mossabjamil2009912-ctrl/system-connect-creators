export type TikTokTok = { accessToken: string; refreshToken: string; expiresAt: number; name: string };

const REDIRECT = "https://system-connect-creators.lovable.app";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function tokenRequest(body: Record<string, string>): Promise<TikTokTok> {
  const key = process.env["TIKTOK_CLIENT_KEY"];
  const secret = process.env["TIKTOK_CLIENT_SECRET"];
  if (!key || !secret) throw new Error("مفاتيح تيك توك غير موجودة");
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: key, client_secret: secret, ...body }),
  });
  const t = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !t.access_token) throw new Error(t.error_description ?? t.error ?? `فشل (${res.status})`);
  let name = "";
  const u = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name", {
    headers: { Authorization: `Bearer ${t.access_token}` },
  });
  if (u.ok) name = ((await u.json()) as { data?: { user?: { display_name?: string } } }).data?.user?.display_name ?? "";
  return { accessToken: t.access_token, refreshToken: t.refresh_token ?? "", expiresAt: Date.now() + (t.expires_in ?? 86400) * 1000, name };
}

export async function saveTok(t: TikTokTok) {
  const s = await db();
  const { error } = await s.from("tiktok_connection").upsert({
    id: 1, access_token: t.accessToken, refresh_token: t.refreshToken, expires_at: t.expiresAt, name: t.name, updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("تعذر حفظ ربط تيك توك");
}

export async function exchangeCode(code: string) {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: REDIRECT });
  await saveTok(t);
  return { name: t.name };
}

export async function loadTok() {
  const s = await db();
  const { data } = await s.from("tiktok_connection").select("*").eq("id", 1).maybeSingle();
  return data;
}

/** Returns a valid stored token, refreshing it automatically when near expiry. */
export async function getStoredTikTokToken(): Promise<string | undefined> {
  const row = await loadTok();
  if (!row) return undefined;
  if (Number(row.expires_at) - Date.now() > 60_000) return row.access_token;
  if (!row.refresh_token) return undefined;
  const t = await tokenRequest({ refresh_token: row.refresh_token, grant_type: "refresh_token" });
  await saveTok({ ...t, name: t.name || row.name });
  return t.accessToken;
}
