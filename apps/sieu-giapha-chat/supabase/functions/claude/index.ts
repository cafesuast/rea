// Siêu GiaPha chat · Edge Function "claude": chuyển yêu cầu AI của người dùng đã
// đăng nhập tới Claude API. Khóa Claude API nằm trong secret ANTHROPIC_API_KEY,
// không bao giờ gửi xuống trình duyệt. Giới hạn số lượt mỗi người mỗi ngày.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const ALLOWED_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"];
const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Chỉ nhận POST" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json(401, { error: "Cần đăng nhập" });

  const limit = Number(Deno.env.get("DAILY_LIMIT") ?? "200");
  const day = new Date().toISOString().slice(0, 10);
  const { data: used } = await admin.from("ai_usage").select("n").eq("user_id", user.id).eq("day", day).maybeSingle();
  if ((used?.n ?? 0) >= limit) return json(429, { error: `Đã dùng hết ${limit} lượt AI hôm nay` });
  await admin.from("ai_usage").upsert({ user_id: user.id, day, n: (used?.n ?? 0) + 1 });

  let body: { model?: string; max_tokens?: number; messages?: unknown; system?: string };
  try { body = await req.json(); } catch { return json(400, { error: "JSON không hợp lệ" }); }
  if (!Array.isArray(body.messages)) return json(400, { error: "Thiếu messages" });
  const model = ALLOWED_MODELS.includes(body.model ?? "") ? body.model : "claude-sonnet-5-5";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: Math.min(Number(body.max_tokens) || 4000, 8000),
      messages: body.messages,
      ...(typeof body.system === "string" ? { system: body.system } : {}),
    }),
  });
  return new Response(await r.text(), { status: r.status, headers: { ...cors, "content-type": "application/json" } });
});
