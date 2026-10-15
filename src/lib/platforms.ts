export type PlatformId = "facebook" | "instagram" | "twitter" | "telegram" | "whatsapp" | "tiktok";

export interface Platform {
  id: PlatformId;
  name: string;
  limit: number;
  needsMedia: boolean;
  hue: string; // oklch hue for the badge dot
  setup: string;
}

export const PLATFORMS: Platform[] = [
  { id: "facebook", name: "فيسبوك", limit: 63206, needsMedia: false, hue: "250", setup: "أنشئ تطبيقًا في Meta for Developers واربطه بصفحتكم للحصول على رمز الصفحة." },
  { id: "instagram", name: "انستقرام", limit: 2200, needsMedia: true, hue: "350", setup: "حوّل الحساب إلى حساب أعمال واربطه بصفحة الفيسبوك، ثم استخدم نفس تطبيق Meta." },
  { id: "twitter", name: "تويتر / X", limit: 280, needsMedia: false, hue: "230", setup: "مجاني عبر المشاركة: يفتح تطبيق X والنص جاهز — اضغط نشر فقط." },
  { id: "telegram", name: "قناة تليجرام", limit: 4096, needsMedia: false, hue: "220", setup: "المنشور يُنشر في قناتكم باسم القناة. اكتب معرّف القناة هنا (مثل @arsh_channel). يلزم مساعد نشر صغير من @BotFather يُضاف مشرفًا في القناة، ولا يظهر للمتابعين." },
  { id: "whatsapp", name: "واتساب", limit: 4096, needsMedia: false, hue: "150", setup: "اربط رقم واتساب للأعمال (WhatsApp Business) لإرسال المنشور للأرقام أو القوائم." },
  { id: "tiktok", name: "تيك توك", limit: 2200, needsMedia: true, hue: "330", setup: "سجّل تطبيقًا في TikTok for Developers وفعّل خدمة نشر المحتوى." },
];

export const platformById = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!;

/** Platforms whose text exceeds that platform's character limit. */
export function overLimit(text: string, selected: PlatformId[]): PlatformId[] {
  return selected.filter((id) => text.length > platformById(id).limit);
}

/** Platforms that cannot publish without an image or video. */
export function missingMedia(hasMedia: boolean, selected: PlatformId[]): PlatformId[] {
  return hasMedia ? [] : selected.filter((id) => platformById(id).needsMedia);
}

export type PostStatus = "success" | "pending" | "error";
export interface PostResult { platform: PlatformId; status: PostStatus; message: string }
export interface PostRecord { id: string; text: string; image?: string | undefined; createdAt: string; results: PostResult[] }
