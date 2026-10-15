import { FaFacebook, FaInstagram, FaTelegram, FaWhatsapp, FaTiktok, FaXTwitter } from "react-icons/fa6";
import type { PlatformId } from "@/lib/platforms";

const MAP = {
  facebook: { I: FaFacebook, c: "#1877F2" },
  instagram: { I: FaInstagram, c: "#E4405F" },
  telegram: { I: FaTelegram, c: "#26A5E4" },
  whatsapp: { I: FaWhatsapp, c: "#25D366" },
  tiktok: { I: FaTiktok, c: "#000000" },
  twitter: { I: FaXTwitter, c: "#000000" },
} as const;

export function PlatformIcon({ id, className = "h-4 w-4" }: { id: PlatformId; className?: string }) {
  const { I, c } = MAP[id];
  return <I className={`shrink-0 ${className}`} style={{ color: c }} aria-hidden />;
}
