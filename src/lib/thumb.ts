export async function makeThumb(src: string, size = 240): Promise<string | undefined> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const s = Math.min(1, size / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  } catch { return undefined; }
}
