// Siêu GiaPha chat · Edge Function "ai": chuyển yêu cầu AI của người dùng đã đăng
// nhập tới 1 trong 7 hãng. Khóa API của từng hãng nằm trong secret của Supabase,
// không bao giờ gửi xuống trình duyệt. Hãng nào chưa có khóa thì không bật.
//   GET  -> { providers: ["claude", "gpt", ...] }   (các hãng đã có khóa)
//   POST { provider, tier: "quick"|"default", messages, max_tokens } -> { text, truncated, model }
// messages theo dạng Anthropic (content gồm khối text và image base64).
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

type Kind = "anthropic" | "openai";
const PROVIDERS: Record<string, { kind: Kind; url: string; env: string; quick: string; model: string; images: boolean }> = {
  claude:   { kind: "anthropic", url: "https://api.anthropic.com/v1/messages", env: "ANTHROPIC_API_KEY", quick: "claude-haiku-5-5", model: "claude-sonnet-5-5", images: true },
  gpt:      { kind: "openai", url: "https://api.openai.com/v1/chat/completions", env: "OPENAI_API_KEY", quick: "gpt-5-mini", model: "gpt-5", images: true },
  gemini:   { kind: "openai", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", env: "GEMINI_API_KEY", quick: "gemini-2.5-flash", model: "gemini-2.5-pro", images: true },
  grok:     { kind: "openai", url: "https://api.x.ai/v1/chat/completions", env: "XAI_API_KEY", quick: "grok-4-fast", model: "grok-4", images: true },
  deepseek: { kind: "openai", url: "https://api.deepseek.com/chat/completions", env: "DEEPSEEK_API_KEY", quick: "deepseek-chat", model: "deepseek-chat", images: false },
  mistral:  { kind: "openai", url: "https://api.mistral.ai/v1/chat/completions", env: "MISTRAL_API_KEY", quick: "mistral-small-latest", model: "mistral-large-latest", images: false },
  qwen:     { kind: "openai", url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", env: "DASHSCOPE_API_KEY", quick: "qwen-turbo", model: "qwen-plus", images: false },
};
const keyOf = (id: string) => Deno.env.get(PROVIDERS[id].env) ?? "";
// Đổi mô hình bằng secret, ví dụ GPT_MODEL=gpt-5.1, GPT_MODEL_QUICK=gpt-5-mini
const modelOf = (id: string, tier: string) =>
  Deno.env.get(`${id.toUpperCase()}_MODEL${tier === "quick" ? "_QUICK" : ""}`) ?? (tier === "quick" ? PROVIDERS[id].quick : PROVIDERS[id].model);

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

type Block = { type: string; text?: string; source?: { media_type: string; data: string } };
type Msg = { role: string; content: string | Block[] };
const toOpenAI = (msgs: Msg[]) => msgs.map((m) => ({
  role: m.role,
  content: typeof m.content === "string" ? m.content : m.content.map((c) =>
    c.type === "image" ? { type: "image_url", image_url: { url: `data:${c.source!.media_type};base64,${c.source!.data}` } } : { type: "text", text: c.text ?? "" }),
}));
const hasImage = (msgs: Msg[]) => msgs.some((m) => Array.isArray(m.content) && m.content.some((c) => c.type === "image"));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json(401, { error: "Cần đăng nhập" });

  if (req.method === "GET") return json(200, { providers: Object.keys(PROVIDERS).filter((id) => keyOf(id)) });
  if (req.method !== "POST") return json(405, { error: "Chỉ nhận GET, POST" });

  let body: { provider?: string; tier?: string; max_tokens?: number; messages?: Msg[] };
  try { body = await req.json(); } catch { return json(400, { error: "JSON không hợp lệ" }); }
  if (!Array.isArray(body.messages)) return json(400, { error: "Thiếu messages" });
  const id = body.provider && PROVIDERS[body.provider] ? body.provider : "claude";
  const P = PROVIDERS[id], key = keyOf(id);
  if (!key) return json(400, { error: `Máy chủ chưa bật ${id}` });
  if (!P.images && hasImage(body.messages)) return json(400, { error: `${id} chưa đọc được ảnh` });

  const limit = Number(Deno.env.get("DAILY_LIMIT") ?? "200");
  const day = new Date().toISOString().slice(0, 10);
  const { data: used } = await admin.from("ai_usage").select("n").eq("user_id", user.id).eq("day", day).maybeSingle();
  if ((used?.n ?? 0) >= limit) return json(429, { error: `Đã dùng hết ${limit} lượt AI hôm nay` });
  await admin.from("ai_usage").upsert({ user_id: user.id, day, n: (used?.n ?? 0) + 1 });

  const model = modelOf(id, body.tier ?? "default");
  const max_tokens = Math.min(Number(body.max_tokens) || 4000, 8000);
  const r = await fetch(P.url, P.kind === "anthropic"
    ? { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens, messages: body.messages }) }
    : { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify({ model, max_tokens, messages: toOpenAI(body.messages) }) });
  if (!r.ok) return json(r.status, { error: `${id} ${r.status}: ${(await r.text()).slice(0, 300)}` });
  const j = await r.json();
  return json(200, P.kind === "anthropic"
    ? { text: (j.content ?? []).filter((c: Block) => c.type === "text").map((c: Block) => c.text).join(""), truncated: j.stop_reason === "max_tokens", model: j.model }
    : { text: j.choices?.[0]?.message?.content ?? "", truncated: j.choices?.[0]?.finish_reason === "length", model: j.model });
});
