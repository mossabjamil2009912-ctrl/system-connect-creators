import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PlatformDot } from "@/components/AppShell";
import { platformById, type PostStatus } from "@/lib/platforms";
import { useHistory } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "سجل المنشورات — عرش الهندسة" },
      { name: "description", content: "حالة نشر كل منشور في كل منصة." },
      { property: "og:title", content: "سجل المنشورات — عرش الهندسة" },
      { property: "og:description", content: "تابع نجاح النشر في كل منصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

const LABEL: Record<PostStatus, string> = { success: "✅ تم", pending: "⏳ بانتظار الربط", error: "❌ خطأ" };

function History() {
  const [history, setHistory] = useHistory();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">سجل المنشورات</h1>
        {history.length > 0 && (
          <button onClick={() => { if (confirm("مسح كل السجل؟")) setHistory([]); }} className="text-sm text-destructive">مسح السجل</button>
        )}
      </div>
      {history.length === 0 && <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">لا توجد منشورات بعد — انشر أول منشور من صفحة «نشر».</p>}
      {history.map((h) => (
        <article key={h.id} className="relative flex gap-3 rounded-2xl border border-border bg-card p-4">
          <button onClick={() => setHistory(history.filter((x) => x.id !== h.id))} aria-label="حذف" className="absolute left-3 top-3 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          {h.image && <img src={h.image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover sm:h-24 sm:w-24" />}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("ar")}</div>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm">{h.text}</p>
            <div className="flex flex-wrap gap-2">
              {h.results.map((r) => (
                <span key={r.platform} title={r.message} className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs">
                  <PlatformDot hue={platformById(r.platform).hue} /> {platformById(r.platform).name}: {LABEL[r.status]}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
