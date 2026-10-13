import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformDot } from "@/components/AppShell";
import { PLATFORMS } from "@/lib/platforms";
import { useSettings } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { checkConnections } from "@/lib/publish.functions";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "ربط المنصات — عرش الهندسة" },
      { name: "description", content: "اربط حسابات فيسبوك وانستقرام وتويتر وتليجرام وواتساب وتيك توك." },
      { property: "og:title", content: "ربط المنصات — عرش الهندسة" },
      { property: "og:description", content: "إعداد ربط المنصات الست." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [checking, setChecking] = useState(false);
  const check = useServerFn(checkConnections);
  const runCheck = async () => {
    setChecking(true);
    try {
      const tg = (draft.telegram ?? settings.telegram?.target ?? "").trim();
      setStatus(await check({ data: { telegramTarget: tg || undefined } }));
    } catch { toast.error("تعذّر الفحص"); }
    finally { setChecking(false); }
  };
  const save = () => {
    const next = { ...settings };
    for (const [id, v] of Object.entries(draft)) next[id as keyof typeof next] = { target: v.trim(), enabled: true };
    setSettings(next);
    toast.success("تم حفظ الإعدادات");
  };
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">ربط المنصات</h1>
        <p className="text-sm text-muted-foreground">المفاتيح السرية تُحفظ بأمان في الخادم، وهنا تكتب فقط وجهة النشر (القناة، الصفحة، الرقم).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((p) => (
          <div key={p.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-bold"><PlatformDot hue={p.hue} /> {p.name}</div>
            <p className="text-xs text-muted-foreground">{p.setup}</p>
            <Input
              placeholder={p.id === "telegram" ? "@arsh_channel" : p.id === "whatsapp" ? "967xxxxxxxxx" : "معرّف الحساب أو الصفحة"}
              value={draft[p.id] ?? settings[p.id]?.target ?? ""}
              onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })}
              dir="ltr"
            />
            {status[p.id] && (
              <div className={`text-xs font-medium ${status[p.id].ok ? "text-primary" : "text-destructive"}`}>
                {status[p.id].ok ? "🟢" : "🔴"} {status[p.id].message}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={save} size="lg" className="w-full bg-gold font-bold text-primary-foreground sm:w-auto">حفظ</Button>
        <Button onClick={runCheck} disabled={checking} variant="outline" size="lg" className="w-full font-bold sm:w-auto">
          {checking ? "جاري الفحص..." : "فحص الاتصال"}
        </Button>
      </div>
    </div>
  );
}
