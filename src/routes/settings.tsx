import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformDot } from "@/components/AppShell";
import { PLATFORMS } from "@/lib/platforms";
import { useSettings } from "@/lib/store";

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
              defaultValue={settings[p.id]?.target ?? ""}
              onBlur={(e) => setSettings({ ...settings, [p.id]: { target: e.target.value.trim(), enabled: true } })}
              dir="ltr"
            />
          </div>
        ))}
      </div>
      <Button onClick={() => toast.success("تم حفظ الإعدادات")} className="bg-gold text-primary-foreground">حفظ</Button>
    </div>
  );
}
