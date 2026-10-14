import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generatePost } from "@/lib/ai.functions";

export function AiAssistant({ onResult }: { onResult: (text: string, tags: string) => void }) {
  const gen = useServerFn(generatePost);
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!idea.trim()) { toast.error("اكتب فكرة المنشور أولاً"); return; }
    setBusy(true);
    try {
      const r = await gen({ data: { idea } });
      if ("error" in r && r.error) toast.error(r.error);
      else if ("text" in r) { onResult(r.text, r.tags); toast.success("تمت صياغة المنشور ✨"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر توليد المنشور");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-primary/40 bg-accent/40 p-3">
      <div className="flex items-center gap-1 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" /> المساعد الذكي</div>
      <div className="flex gap-2">
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && run()}
          placeholder="مثلاً: عرض لبرنامج محاسبة ومبيعات"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <Button onClick={run} disabled={busy} size="sm" className="shrink-0">{busy ? "يكتب..." : "اكتب لي"}</Button>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-bold text-foreground">🚀 نصائح لمشاهدات وإعجابات أكثر</summary>
        <ul className="mt-2 list-disc space-y-1 pr-4">
          <li>انشر وقت الذروة: 8–10 مساءً، أو 1–2 ظهراً بتوقيت اليمن.</li>
          <li>استخدم صورة من التصاميم الجاهزة؛ المنشورات المصورة تحصل على تفاعل أكبر.</li>
          <li>انشر بانتظام: 3–5 منشورات أسبوعياً أفضل من كثرة متقطعة.</li>
          <li>اختم بسؤال، ورُدّ على كل تعليق في أول ساعة.</li>
          <li>3–5 هاشتاغات مركّزة أفضل من كثيرة عشوائية.</li>
          <li>الفيديو القصير (ريلز وتيك توك) يصل لأكبر عدد من غير المتابعين.</li>
        </ul>
      </details>
    </div>
  );
}
