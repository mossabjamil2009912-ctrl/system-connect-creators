import { createServerFn } from "@tanstack/react-start";

const INSTRUCTIONS = `أنت كاتب محتوى تسويقي لفريق «عرش الهندسة للحلول التقنية الذكية» من اليمن، المتخصص في بناء تطبيقات ويندوز وأندرويد وآيفون، ربط API، والحلول التقنية.
اكتب منشوراً عربياً احترافياً جذاباً لمواقع التواصل بناءً على فكرة المستخدم: عنوان قوي، نقاط مزايا قصيرة مع رموز تعبيرية مناسبة، ودعوة للتواصل في النهاية.
لا تخترع أرقام هواتف أو أسعاراً أو روابط. أعد النتيجة بصيغة JSON فقط.`;

export const generatePost = createServerFn({ method: "POST" })
  .inputValidator((d: { idea: string }) => {
    const idea = String(d?.idea ?? "").trim().slice(0, 500);
    if (!idea) throw new Error("اكتب فكرة المنشور أولاً");
    return { idea };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "مفتاح الذكاء الاصطناعي غير مضبوط" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: INSTRUCTIONS,
        input: [{ role: "user", content: data.idea }],
        text: {
          format: {
            type: "json_schema",
            name: "post",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["text", "tags"],
              properties: {
                text: { type: "string", description: "نص المنشور بدون هاشتاغات" },
                tags: { type: "string", description: "4-7 هاشتاغات عربية مفصولة بمسافة تبدأ بـ #" },
              },
            },
          },
        },
      }),
    });
    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => "");
      console.error("AI error", res.status, msg);
      if (res.status === 429) return { error: "طلبات كثيرة، حاول بعد قليل" };
      if (res.status === 402) return { error: "نفد رصيد الذكاء الاصطناعي في مساحة العمل" };
      return { error: "تعذر توليد المنشور، حاول مرة أخرى" };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error") return { error: "تعذر توليد المنشور" };
        } catch { /* partial */ }
      }
    }
    try {
      const j = JSON.parse(out) as { text: string; tags: string };
      return { text: j.text, tags: j.tags };
    } catch {
      return { error: "رد غير صالح، حاول مرة أخرى" };
    }
  });
