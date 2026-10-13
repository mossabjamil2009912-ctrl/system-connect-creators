import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import mobile from "@/assets/gallery/mobile-apps.jpg";
import windows from "@/assets/gallery/windows.jpg";
import api from "@/assets/gallery/api.jpg";
import services from "@/assets/gallery/services.jpg";
import companies from "@/assets/gallery/companies.jpg";
import whatsapp from "@/assets/gallery/whatsapp-api.jpg";
import reports from "@/assets/gallery/project-reports.jpg";
import solar from "@/assets/gallery/solar-sales.jpg";
import cover from "@/assets/gallery/cover.png";

export const DESIGNS = [
  { src: mobile, label: "تطبيقات الجوال" },
  { src: windows, label: "أنظمة ويندوز" },
  { src: api, label: "ربط API" },
  { src: services, label: "خدمات الفريق" },
  { src: companies, label: "أنظمة الشركات" },
  { src: whatsapp, label: "واتساب API" },
  { src: reports, label: "تقارير المشاريع" },
  { src: solar, label: "مبيعات الطاقة" },
  { src: cover, label: "غلاف الصفحة" },
];

export async function toDataUrl(src: string) {
  const blob = await (await fetch(src)).blob();
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export function DesignGallery({ onPick }: { onPick: (dataUrl: string) => void }) {
  const [open, setOpen] = useState(false);
  const pick = async (src: string) => {
    try { onPick(await toDataUrl(src)); setOpen(false); toast.success("تم اختيار التصميم"); }
    catch { toast.error("تعذّر تحميل التصميم"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3 font-medium text-primary hover:bg-primary/10">
          <LayoutGrid className="h-5 w-5" /> تصاميم عرش الهندسة الجاهزة
        </button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>معرض التصاميم</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DESIGNS.map((d) => (
            <button key={d.label} onClick={() => pick(d.src)} className="overflow-hidden rounded-xl border border-border text-right hover:border-primary">
              <img src={d.src} alt={d.label} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="p-2 text-sm">{d.label}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
