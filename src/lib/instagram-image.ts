// Fit any image into Instagram-accepted ratio (between 4:5 and 1.91:1) by padding, never cutting content.
export async function toInstagramImage(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const w = img.naturalWidth, h = img.naturalHeight;
  const ratio = w / h;
  let cw = w, ch = h;
  if (ratio > 1.91) { cw = w; ch = Math.round(w / 1); } // too wide -> square canvas
  else if (ratio < 0.8) { ch = h; cw = Math.round(h * 0.8); } // too tall -> 4:5
  const scale = Math.min(1, 1440 / Math.max(cw, ch));
  const W = Math.round(cw * scale), H = Math.round(ch * scale);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);
  const dw = w * scale, dh = h * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return c.toDataURL("image/jpeg", 0.92);
}
