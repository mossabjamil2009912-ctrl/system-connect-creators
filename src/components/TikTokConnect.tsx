import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tiktokAuthUrl, tiktokExchange, tiktokStatus } from "@/lib/tiktok.functions";

/** Handles TikTok's redirect back to the site root (?code=...&state=tiktok). The link is saved on the server. */
export function TikTokCallback() {
  const exchange = useServerFn(tiktokExchange);
  const navigate = useNavigate();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const code = q.get("code");
    if (q.get("state") !== "tiktok" || !code) return;
    window.history.replaceState({}, "", "/");
    exchange({ data: { code } })
      .then((t) => {
        toast.success(`تم ربط تيك توك بشكل دائم${t.name ? ` (${t.name})` : ""}`);
        navigate({ to: "/settings" });
      })
      .catch((e: Error) => toast.error(`فشل ربط تيك توك: ${e.message}`));
  }, []);
  return null;
}

export function TikTokConnectCard() {
  const getUrl = useServerFn(tiktokAuthUrl);
  const status = useServerFn(tiktokStatus);
  const [saved, setSaved] = useState<{ connected: boolean; name: string } | null>(null);
  useEffect(() => { status().then(setSaved).catch(() => setSaved(null)); }, []);
  const connect = async () => {
    try { window.location.href = (await getUrl()).url; } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <div className="font-bold">ربط حساب تيك توك</div>
      {saved?.connected ? (
        <p className="text-sm text-primary">🟢 متصل دائماً{saved.name ? `: ${saved.name}` : ""} — يعمل من أي جهاز</p>
      ) : (
        <p className="text-xs text-muted-foreground">اضغط الزر مرة واحدة فقط، سجّل دخولك في تيك توك ووافق، ويُحفظ الربط دائماً.</p>
      )}
      <Button onClick={connect} variant="outline" className="font-bold">{saved?.connected ? "إعادة الربط" : "ربط تيك توك"}</Button>
    </div>
  );
}
