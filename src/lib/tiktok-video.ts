/** Turns a still image into a short vertical WebM clip (TikTok accepts video uploads, not raw photos). */
export async function imageToTikTokVideo(dataUrl: string, seconds = 6): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const draw = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const s = Math.min(W / img.width, H / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  };
  draw();
  const stream = canvas.captureStream(30);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<void>((r) => { rec.onstop = () => r(); });
  rec.start(500);
  const timer = setInterval(draw, 1000 / 30);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  clearInterval(timer);
  rec.stop();
  await done;
  const blob = new Blob(chunks, { type: "video/webm" });
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("تعذر تجهيز الفيديو"));
    fr.readAsDataURL(blob);
  });
}
