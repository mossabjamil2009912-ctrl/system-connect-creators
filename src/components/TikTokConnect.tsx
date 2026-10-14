import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tiktokAuthUrl, tiktokExchange } from "@/lib/tiktok.functions";

const KEY = "arsh-tiktok";
type Saved = { accessToken: string; refreshToken: string; expiresAt: number; name: string };

/** Handles TikTok's redirect back to the site root (?code=...&state=tiktok). */
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
        localStorage.setItem(KEY, JSON.stringify(t));
        toast.success(`تم ربط تيك توك${t.name ? ` (${t.name})` : ""}`);
        navigate({ to: "/settings" });
      })
      .catch((e: Error) => toast.error(`فشل ربط تيك توك: ${e.message}`));
  }, []);
  return null;
}

export function TikTokConnectCard() {
  const getUrl = useServerFn(tiktokAuthUrl);
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { /* ignore */ }
  }, []);
  const connect = async () => {
    try { window.location.href = (await getUrl()).url; } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <div className="font-bold">ربط حساب تيك توك</div>
      {saved ? (
        <p className="text-sm text-primary">🟢 متصل{saved.name ? `: ${saved.name}` : ""}</p>
      ) : (
        <p className="text-xs text-muted-foreground">اضغط الزر، سجّل دخولك في تيك توك ووافق، وسترجع هنا تلقائياً.</p>
      )}
      <Button onClick={connect} variant="outline" className="font-bold">{saved ? "إعادة الربط" : "ربط تيك توك"}</Button>
    </div>
  );
}
