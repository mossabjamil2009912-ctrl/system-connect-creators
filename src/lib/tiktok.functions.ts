import { createServerFn } from "@tanstack/react-start";
import { exchangeCode, loadTok } from "./tiktok.server";

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

export const tiktokExchange = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => {
    if (!d.code || d.code.length > 1000) throw new Error("رمز غير صالح");
    return d;
  })
  .handler(async ({ data }) => exchangeCode(data.code));

export const tiktokStatus = createServerFn({ method: "GET" }).handler(async () => {
  const row = await loadTok();
  return { connected: !!row, name: row?.name ?? "" };
});
