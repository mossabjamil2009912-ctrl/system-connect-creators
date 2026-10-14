import { createServerFn } from "@tanstack/react-start";

const REDIRECT = "https://system-connect-creators.lovable.app";

export const tiktokAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["TIKTOK_CLIENT_KEY"];
  if (!key) throw new Error("مفتاح تيك توك غير موجود");
  const p = new URLSearchParams({
    client_key: key,
    scope: "user.info.basic,video.publish,video.upload",
    response_type: "code",
    redirect_uri: REDIRECT,
    state: "tiktok",
  });
  return { url: `https://www.tiktok.com/v2/auth/authorize/?${p}` };
});

interface Tok { access_token?: string; refresh_token?: string; open_id?: string; expires_in?: number; error?: string; error_description?: string }

async function tokenRequest(body: Record<string, string>) {
  const key = process.env["TIKTOK_CLIENT_KEY"];
  const secret = process.env["TIKTOK_CLIENT_SECRET"];
  if (!key || !secret) throw new Error("مفاتيح تيك توك غير موجودة");
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: key, client_secret: secret, ...body }),
  });
  const t = (await res.json()) as Tok;
  if (!res.ok || !t.access_token) throw new Error(t.error_description ?? t.error ?? `فشل (${res.status})`);
  let name = "";
  const u = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name", {
    headers: { Authorization: `Bearer ${t.access_token}` },
  });
  if (u.ok) name = ((await u.json()) as { data?: { user?: { display_name?: string } } }).data?.user?.display_name ?? "";
  return { accessToken: t.access_token, refreshToken: t.refresh_token ?? "", expiresAt: Date.now() + (t.expires_in ?? 86400) * 1000, name };
}

export const tiktokExchange = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => {
    if (!d.code || d.code.length > 1000) throw new Error("رمز غير صالح");
    return d;
  })
  .handler(async ({ data }) => tokenRequest({ code: data.code, grant_type: "authorization_code", redirect_uri: REDIRECT }));

export const tiktokRefresh = createServerFn({ method: "POST" })
  .inputValidator((d: { refreshToken: string }) => {
    if (!d.refreshToken || d.refreshToken.length > 1000) throw new Error("رمز غير صالح");
    return d;
  })
  .handler(async ({ data }) => tokenRequest({ refresh_token: data.refreshToken, grant_type: "refresh_token" }));
