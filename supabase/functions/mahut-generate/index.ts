// MAHUT (המהות) — turns a raw thought into a magazine article.
// Text: Claude (ANTHROPIC_API_KEY). Image: fal.ai (FAL_API_KEY), copied into the
// mahut-media bucket so it never expires. Admins only (mahut_admins by email).
// A follow-up also writes its bridge from the previous part and refreshes the
// series note on the root article.
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SB_HEADERS = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
const BUCKET = "mahut-media";

const BASE_PROPS = {
  title: { type: "string" },
  subtitle: { type: "string" },
  quote: { type: "string" },
  sections: {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["heading", "content"],
      properties: { heading: { type: "string" }, content: { type: "string" } },
    },
  },
  pragmatic_action: { type: "string" },
  visual_prompt: { type: "string" },
};
const BASE_REQUIRED = ["title", "subtitle", "quote", "sections", "pragmatic_action", "visual_prompt"];
const SCHEMA = { type: "object", additionalProperties: false, required: BASE_REQUIRED, properties: BASE_PROPS };
const FOLLOW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [...BASE_REQUIRED, "bridge", "series_note"],
  properties: { ...BASE_PROPS, bridge: { type: "string" }, series_note: { type: "string" } },
};

const SYSTEM = `את/ה העורך/ת הראשי/ת של "המהות", מגזין עברי על אדריכלות, עיר, צמצום ורוח.
מקבלים מחשבה גולמית ומזקקים אותה לכתבה אחת, כמו כפולת עמודים במגזין מודפס.
- title: כותרת קצרה וחזקה, 2 עד 5 מילים.
- subtitle: משפט אחד שפותח את הרעיון.
- quote: משפט אחד מתוך הכתבה, שאפשר לתלות על קיר.
- sections: 3 עד 4 פרקים. heading של 2 עד 4 מילים. content של 60 עד 110 מילים, עברית תקינה וחיה, דימוי אחד מוחשי בכל פרק, בלי קלישאות ובלי סימני קריאה.
- pragmatic_action: פעולה אחת שאפשר לעשות השבוע, משפט או שניים.
- visual_prompt: באנגלית. תצלום אדריכלי תיעודי של מרחב אחד שמגלם את הרעיון: חומר, אור, קנה מידה, ניגוד אחד ברור. בהיר, אווררי, הרבה חלל לבן, בלי אנשים בפוקוס, בלי טקסט.
בכתבת המשך בסדרה מוסיפים:
- bridge: משפט או שניים, עד 30 מילים, שמסבירים איך החלק הזה ממשיך את החלק הקודם. נפתח בתנועה, למשל "מהחלל אל הדעת."
- series_note: 2 עד 4 משפטים שמסבירים לקורא את הסדרה כולה, כולל החלק החדש: על מה כל חלק, ומה החוט שמחבר ביניהם.
כותבים בגוף שלישי או בגוף ראשון רבים, לא בגוף שני מתחנחן.`;

async function adminId(auth: string | null): Promise<string | null> {
  if (!auth) return null;
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SERVICE } });
  if (!r.ok) return null;
  const user = await r.json();
  const email = String(user?.email ?? "").toLowerCase();
  if (!email) return null;
  const q = await fetch(`${SB_URL}/rest/v1/mahut_admins?select=email&email=ilike.${encodeURIComponent(email)}`, { headers: SB_HEADERS });
  const rows = q.ok ? await q.json() : [];
  return rows.length ? user.id : null;
}

function falKey(): string | undefined {
  const direct = Deno.env.get("FAL_API_KEY")?.trim();
  if (direct) return direct;
  for (const name of Object.keys(Deno.env.toObject())) {
    if (!/fal/i.test(name) || /^SUPABASE_/i.test(name)) continue;
    const v = Deno.env.get(name)?.trim();
    if (v) return v;
  }
}

async function makeImage(prompt: string, id: string): Promise<string | null> {
  const key = falKey();
  if (!key) return null;
  const full = `${prompt}. Documentary realism, professional architecture photography, high-key, airy, soft natural light, generous white space, no text.`;
  for (const [endpoint, body] of [
    ["https://fal.run/fal-ai/nano-banana-2", { prompt: full, image_size: "landscape_16_9" }],
    ["https://fal.run/fal-ai/flux/schnell", { prompt: full, image_size: "landscape_16_9", num_inference_steps: 4, num_images: 1 }],
  ] as const) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const url = data?.images?.[0]?.url;
      if (!url) continue;
      const img = await fetch(url);
      if (!img.ok) return url;
      const type = img.headers.get("content-type") ?? "image/jpeg";
      const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
      const path = `articles/${id}.${ext}`;
      const up = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: { ...SB_HEADERS, "Content-Type": type, "x-upsert": "true", "Cache-Control": "31536000" },
        body: await img.arrayBuffer(),
      });
      return up.ok ? `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}` : url;
    } catch (_) { /* try next */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const userId = await adminId(req.headers.get("Authorization"));
  if (!userId) return json({ error: "רק עורכת המגזין יכולה ליצור כתבות." }, 403);

  let body: { input?: string; rootId?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const input = String(body.input ?? "").trim().slice(0, 4000);
  if (!input) return json({ error: "צריך לכתוב מחשבה." }, 400);

  // Follow-up: load the series so far.
  type Part = { id: string; title: string; subtitle: string; root_title: string | null; part_number: number; bridge: string | null };
  let series: Part[] = [];
  let rootId: string | null = null;
  if (body.rootId && /^[0-9a-f-]{36}$/i.test(body.rootId)) {
    const q = await fetch(
      `${SB_URL}/rest/v1/mahut_articles?select=id,title,subtitle,root_title,part_number,bridge&or=(id.eq.${body.rootId},root_id.eq.${body.rootId})&order=part_number`,
      { headers: SB_HEADERS },
    );
    series = q.ok ? await q.json() : [];
    if (series.length) rootId = series[0].id;
  }
  const isFollow = !!rootId;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
  const client = new Anthropic({ apiKey });

  const userText = isFollow
    ? `זו כתבת המשך, חלק ${series.length + 1} בסדרה "${series[0].title}".\nהחלקים הקודמים:\n${series.map((s) => `${s.part_number}. ${s.title}: ${s.subtitle}${s.bridge ? ` (גשר: ${s.bridge})` : ""}`).join("\n")}\nהתהייה שעלתה עכשיו: ${input}\nבנו גשר מהחלק הקודם והעמיקו, בלי לחזור על מה שכבר נאמר.`
    : `המחשבה הגולמית: ${input}`;

  let article: Record<string, unknown>;
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 12000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "medium", format: { type: "json_schema", schema: isFollow ? FOLLOW_SCHEMA : SCHEMA } },
      messages: [{ role: "user", content: userText }],
    } as never);
    if (response.stop_reason === "refusal") return json({ error: "הבקשה נדחתה. נסו ניסוח אחר." }, 422);
    const text = response.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    article = JSON.parse(text);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: "עומס זמני, נסו שוב בעוד דקה." }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: `Claude API ${err.status}: ${err.message}` }, 502);
    return json({ error: String(err) }, 500);
  }

  const id = crypto.randomUUID();
  const image_url = await makeImage(String(article.visual_prompt ?? article.title), id);

  const row = {
    id,
    title: article.title,
    subtitle: article.subtitle,
    quote: article.quote,
    sections: article.sections,
    pragmatic_action: article.pragmatic_action,
    visual_prompt: article.visual_prompt,
    image_url,
    source_input: input,
    root_id: rootId,
    root_title: isFollow ? (series[0].root_title ?? series[0].title) : null,
    part_number: isFollow ? series.length + 1 : 1,
    bridge: isFollow ? article.bridge : null,
    created_by: userId,
  };
  const ins = await fetch(`${SB_URL}/rest/v1/mahut_articles`, {
    method: "POST",
    headers: { ...SB_HEADERS, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!ins.ok) return json({ error: `שמירה נכשלה: ${await ins.text()}` }, 500);
  const [saved] = await ins.json();

  if (isFollow && article.series_note) {
    await fetch(`${SB_URL}/rest/v1/mahut_articles?id=eq.${rootId}`, {
      method: "PATCH",
      headers: { ...SB_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ series_note: article.series_note }),
    });
  }
  return json({ article: saved });
});
