import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const KEY = "arsh-macrodroid";

const GUIDE = `ماكرو «عرش الهندسة» — النشر التلقائي في واتساب وتيك توك

المُشغّل (Trigger):
  Webhook (URL) ← المعرّف: arsh
  انسخ الرابط الظاهر وضعه في لوحة عرش الهندسة ← صفحة الربط.

الإجراءات (Actions):
1) HTTP Request (GET) ← الرابط: [v=webhook_image] ← حفظ في ملف: Download/arsh.jpg
2) Set Clipboard ← [v=webhook_text]
3) If [v=webhook_platform] = whatsapp:
     Share File ← Download/arsh.jpg ← التطبيق: WhatsApp
     Wait 2s ← UI Interaction: Click «حالتي»
     Wait 2s ← UI Interaction: Click زر الإرسال
4) If [v=webhook_platform] = tiktok:
     Share File ← Download/arsh.jpg ← التطبيق: TikTok
     Wait 4s ← UI Interaction: Click «التالي»
     Wait 3s ← UI Interaction: Long Press خانة الوصف ← Paste
     UI Interaction: Click «نشر»

الأذونات: فعّل لـ MacroDroid «إمكانية الوصول» والتخزين، وأوقف تحسين البطارية له.`;

export function MacroDroidCard() {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(localStorage.getItem(KEY) ?? ""), []);

  const save = () => {
    const v = url.trim();
    if (v && !v.startsWith("https://trigger.macrodroid.com/")) { toast.error("الرابط يجب أن يبدأ بـ https://trigger.macrodroid.com/"); return; }
    localStorage.setItem(KEY, v);
    toast.success(v ? "تم حفظ رابط هاتفك" : "تم إلغاء الربط");
  };

  const test = async () => {
    const v = url.trim().replace(/\/+$/, "").replace(/\/arsh$/, "");
    if (!v) return;
    try {
      await fetch(`${v}/arsh?platform=test&text=${encodeURIComponent("تجربة من عرش الهندسة")}`, { mode: "no-cors" });
      toast.success("أُرسلت إشارة تجربة — شاهد إشعار MacroDroid في هاتفك");
    } catch { toast.error("تعذر الإرسال"); }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([GUIDE], { type: "text/plain;charset=utf-8" }));
    a.download = "arsh-macrodroid.txt";
    a.click();
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-bold">📱 أتمتة الهاتف (MacroDroid) — واتساب وتيك توك</h2>
      <p className="text-sm text-muted-foreground">عند النشر، يصل أمر لهاتفك فينشر MacroDroid الحالة في واتساب والفيديو في تيك توك تلقائياً.</p>
      <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://trigger.macrodroid.com/xxxx/arsh" />
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} className="bg-gold font-bold text-primary-foreground">حفظ</Button>
        <Button onClick={test} variant="outline">تجربة</Button>
        <Button onClick={download} variant="outline">تحميل خطوات الماكرو</Button>
      </div>
    </section>
  );
}
