import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, Check, Eye, FileText, Heart, ImagePlus, MessageCircle, PenLine, Repeat2, Send, Share2, ThumbsUp, Trash2, X } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { DesignGallery, DESIGNS, toDataUrl } from "@/components/DesignGallery";
import { AiAssistant } from "@/components/AiAssistant";

const DRAFT_KEY = "arsh-draft";
const QUICK_TAGS = ["#عرش_الهندسة", "#تطبيقات_جوال", "#أنظمة_ويندوز", "#ربط_API", "#صنعاء_اليمن"];
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformDot } from "@/components/AppShell";
import { PLATFORMS, missingMedia, overLimit, platformById, type PlatformId } from "@/lib/platforms";
import { useHistory, useSettings } from "@/lib/store";
import { publishPost } from "@/lib/publish.functions";
import { toInstagramImage } from "@/lib/instagram-image";
import icon from "@/assets/arsh-throne-icon-transparent.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نشر منشور موحّد — عرش الهندسة" },
      { name: "description", content: "اكتب منشورك مرة واحدة وانشره في فيسبوك وانستقرام وتويتر وتليجرام وواتساب وتيك توك." },
      { property: "og:title", content: "نشر منشور موحّد — عرش الهندسة" },
      { property: "og:description", content: "منصة نشر واحدة لست مواقع تواصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Composer,
});

function Composer() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<string>();
  const [selected, setSelected] = useState<PlatformId[]>(PLATFORMS.map((p) => p.id));
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [history, setHistory] = useHistory();
  const [settings] = useSettings();
  const publish = useServerFn(publishPost);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as { text?: string; tags?: string; image?: string };
      if (d.text) setText(d.text);
      if (d.tags) setTags(d.tags);
      if (d.image) setImage(d.image);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, tags, image })); }
    catch { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, tags })); } catch { /* ignore */ } }
  }, [text, tags, image, loaded]);

  const clearDraft = () => { setText(""); setTags(""); setImage(undefined); localStorage.removeItem(DRAFT_KEY); };

  const full = [text.trim(), tags.trim()].filter(Boolean).join("\n\n");
  const tooLong = overLimit(full, selected);
  const noMedia = missingMedia(!!image, selected);

  const toggle = (id: PlatformId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 4_000_000) { toast.error("الصورة أكبر من 4 ميجا"); return; }
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(f);
  };

  const shareWhatsApp = async () => {
    if (!full && !image) { toast.error("اكتب نص المنشور أو أضف صورة"); return; }
    try {
      if (image && navigator.canShare) {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], "arsh-post.jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          if (full) await navigator.clipboard?.writeText(full).catch(() => {});
          await navigator.share({ files: [file], text: full });
          return;
        }
      }
      if (!image && navigator.share) { await navigator.share({ text: full }); return; }
      if (full) await navigator.clipboard?.writeText(full).catch(() => {});
      window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank");
      if (image) toast.info("تم نسخ النص — أرفق الصورة يدوياً في واتساب");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("تعذّر فتح المشاركة");
    }
  };

  const submit = async () => {
    if (!full && !image) { toast.error("اكتب نص المنشور أو أضف صورة"); return; }
    if (!selected.length) { toast.error("اختر منصة واحدة على الأقل"); return; }
    setBusy(true);
    try {
      const igImage = image && selected.includes("instagram") ? await toInstagramImage(image) : undefined;
      const results = await publish({
        data: {
          text: full,
          imageDataUrl: image,
          igImageDataUrl: igImage,
          targets: selected.map((p) => ({ platform: p, target: settings[p]?.target ?? "" })),
        },
      });
      setHistory([{ id: crypto.randomUUID(), text: full, image, createdAt: new Date().toISOString(), results }, ...history].slice(0, 50));
      const ok = results.filter((r) => r.status === "success").length;
      toast.success(`تم الإرسال — نجح في ${ok} من ${results.length} منصات`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
    <div className="sticky top-[86px] z-10 grid grid-cols-2 gap-1 rounded-full border border-border bg-secondary p-1 shadow-sm lg:hidden">
      {([["edit", "تحرير المنشور", PenLine], ["preview", "معاينة مباشرة", Eye]] as const).map(([v, l, I]) => (
        <button key={v} onClick={() => setMobileView(v)} className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold transition-colors ${mobileView === v ? "bg-gold text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>
          <I className="h-4 w-4" /> {l}
        </button>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className={`${mobileView === "edit" ? "" : "hidden"} lg:block min-w-0 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-gold`}>
        <div>
          <h1 className="text-2xl font-extrabold">منشور جديد</h1>
          <p className="text-sm text-muted-foreground">اكتب مرة واحدة، وانشر في كل المنصات.</p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1 text-sm font-bold"><FileText className="h-4 w-4 text-primary" /> قوالب جاهزة</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => { setText(t.text); setTags(t.tags); const d = DESIGNS.find((x) => x.label === t.design); if (d) toDataUrl(d.src).then(setImage).catch(() => {}); }} className="shrink-0 rounded-full border border-primary/40 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground">
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <AiAssistant onResult={(t, g) => { setText(t); setTags(g); }} />

        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="ماذا تريد أن تنشر اليوم؟" className="min-h-40 text-base" />
          <Textarea value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#عرش_الهندسة #تطبيقات #اليمن" className="min-h-12" />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {QUICK_TAGS.map((t) => {
              const on = tags.split(/\s+/).includes(t);
              return (
                <button key={t} onClick={() => setTags(on ? tags.split(/\s+/).filter((x) => x && x !== t).join(" ") : [tags.trim(), t].filter(Boolean).join(" "))}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{full.length} حرف {(text || tags) && "· المسودة محفوظة تلقائياً"}</span>
            {(text || tags || image) && (
              <button onClick={clearDraft} className="flex items-center gap-1 text-destructive"><Trash2 className="h-3 w-3" /> مسح</button>
            )}
          </div>
        </div>

        {image ? (
          <div className="relative w-fit">
            <img src={image} alt="صورة المنشور" className="max-h-56 rounded-xl border border-border" />
            <button onClick={() => setImage(undefined)} className="absolute -left-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground" aria-label="حذف الصورة">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-input p-6 text-muted-foreground hover:text-primary">
              <ImagePlus className="h-5 w-5" /> أضف صورة من جهازك
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <DesignGallery onPick={setImage} />
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">المنصات <span className="text-xs font-normal text-muted-foreground">· تم تحديد {selected.length} من {PLATFORMS.length}</span></h2>
            <button className="text-xs text-primary" onClick={() => setSelected(selected.length === PLATFORMS.length ? [] : PLATFORMS.map((p) => p.id))}>
              {selected.length === PLATFORMS.length ? "إلغاء الكل" : "تحديد الكل"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLATFORMS.map((p) => {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => toggle(p.id)} aria-pressed={on}
                  className={`relative flex min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-start text-sm transition-all ${on ? "border-primary bg-accent font-bold text-accent-foreground shadow-sm" : "border-border bg-secondary text-muted-foreground"}`}>
                  <PlatformDot hue={p.hue} />
                  <span className="truncate">{p.name}</span>
                  {on && <Check className="ms-auto h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {(tooLong.length > 0 || noMedia.length > 0) && (
          <div className="space-y-1 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
            {tooLong.map((id) => <div key={id}>⚠️ النص أطول من المسموح في {platformById(id).name} ({platformById(id).limit} حرف)</div>)}
            {noMedia.map((id) => <div key={id}>⚠️ {platformById(id).name} يحتاج صورة أو فيديو</div>)}
          </div>
        )}

        <Button onClick={submit} disabled={busy} size="lg" className="w-full bg-gold text-base font-bold text-primary-foreground">
          <Send className="h-4 w-4" /> {busy ? "جاري النشر..." : `انشر في ${selected.length} منصات`}
        </Button>

        <Button onClick={shareWhatsApp} variant="outline" size="lg" className="w-full text-base font-bold">
          <Share2 className="h-4 w-4" /> مشاركة في واتساب (حالتي + القناة)
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          تفتح نافذة واتساب والصورة والنص جاهزان — اختر «حالتي» وقناتك معاً ثم أرسل.
        </p>
      </section>

      <section className={`${mobileView === "preview" ? "" : "hidden"} lg:block min-w-0 rounded-2xl border border-border bg-card p-5`}>
        <h2 className="mb-3 font-bold">معاينة المنشور</h2>
        <Tabs defaultValue="facebook" dir="rtl">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
            {PLATFORMS.map((p) => <TabsTrigger key={p.id} value={p.id} className="shrink-0">{p.name}</TabsTrigger>)}
          </TabsList>
          {PLATFORMS.map((p) => (
            <TabsContent key={p.id} value={p.id}>
              <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
                <div className="flex items-center gap-2 border-b border-border p-3">
                  <img src={icon} alt="" className="h-9 w-9 shrink-0 rounded-full border border-border bg-background object-contain p-0.5" />
                  <div>
                    <div className="text-sm font-bold">عرش الهندسة</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><PlatformDot hue={p.hue} /> {p.name} · الآن</div>
                  </div>
                </div>
                {p.id === "instagram" ? (
                  <>
                    {image ? <img src={image} alt="" className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">إنستغرام يحتاج صورة</div>}
                    <div className="flex items-center gap-3 p-3 pb-1"><Heart className="h-5 w-5" /><MessageCircle className="h-5 w-5" /><Send className="h-5 w-5" /><Bookmark className="ms-auto h-5 w-5" /></div>
                    <p className="whitespace-pre-wrap px-3 pb-3 text-sm"><b>arsh_engineering</b> {full ? full.slice(0, p.limit) : <span className="text-muted-foreground">سيظهر نص منشورك هنا...</span>}</p>
                  </>
                ) : p.id === "telegram" ? (
                  <div className="bg-secondary p-3">
                    <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-ss-sm border border-border bg-background shadow-sm">
                      {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
                      <p className="whitespace-pre-wrap p-3 pb-1 text-sm">{full ? full.slice(0, p.limit) : <span className="text-muted-foreground">سيظهر نص منشورك هنا...</span>}</p>
                      <div className="flex items-center justify-end gap-1 px-3 pb-2 text-[11px] text-muted-foreground"><Eye className="h-3 w-3" /> 1.2K · الآن</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap p-3 text-sm">{full ? full.slice(0, p.limit) : <span className="text-muted-foreground">سيظهر نص منشورك هنا...</span>}</p>
                    {image && <img src={image} alt="" className="max-h-80 w-full object-cover" />}
                    <div className="grid grid-cols-3 border-t border-border text-xs text-muted-foreground">
                      {(p.id === "twitter" ? [[MessageCircle, "رد"], [Repeat2, "إعادة نشر"], [Heart, "إعجاب"]] : [[ThumbsUp, "أعجبني"], [MessageCircle, "تعليق"], [Share2, "مشاركة"]] as const).map(([I, l]) => (
                        <div key={l as string} className="flex items-center justify-center gap-1 py-2.5"><I className="h-4 w-4" /> {l as string}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
    </div>
  );
}
