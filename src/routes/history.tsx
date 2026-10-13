import { createFileRoute } from "@tanstack/react-router";
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
  const [history] = useHistory();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">سجل المنشورات</h1>
      {history.length === 0 && <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">لا توجد منشورات بعد.</p>}
      {history.map((h) => (
        <article key={h.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
          {h.image && <img src={h.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />}
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
