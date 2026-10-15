export const CONTACT_PHONE = "777350287";
export const CONTACT_LINE = `📞 للتواصل: ${CONTACT_PHONE}`;

export function withContact(text: string) {
  if (!text.trim() || text.includes(CONTACT_PHONE)) return text;
  return `${text}\n\n${CONTACT_LINE}`;
}

/** Draws a contact bar at the bottom of the image, keeping full resolution. */
export async function stampContact(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const w = img.naturalWidth, h = img.naturalHeight;
  const bar = Math.round(Math.max(48, h * 0.075));
  const c = document.createElement("canvas");
  c.width = w; c.height = h + bar;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.fillStyle = "#111111";
  g.fillRect(0, h, w, bar);
  g.fillStyle = "#D4AF37";
  g.fillRect(0, h, w, Math.max(3, Math.round(bar * 0.06)));
  g.fillStyle = "#FFFFFF";
  g.font = `bold ${Math.round(bar * 0.48)}px Tahoma, Arial, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.direction = "rtl";
  g.fillText(`للتواصل: ${CONTACT_PHONE} 📞`, w / 2, h + bar / 2 + bar * 0.03);
  return c.toDataURL("image/png");
}
