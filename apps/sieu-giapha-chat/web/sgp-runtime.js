/* Siêu GiaPha chat · lớp chạy độc lập (ngoài Claude)
 *
 * Cung cấp window.claude.use(...) giống môi trường Claude, để cùng một app chạy
 * được trên mọi trình duyệt. Có hai chế độ:
 *   1. Supabase (khi config.js có supabaseUrl): đăng nhập Google/email, dữ liệu
 *      chung cho mọi người, gia phả riêng chỉ chủ tài khoản đọc được (Row Level
 *      Security), cập nhật trực tiếp (Realtime), AI qua Edge Function "claude".
 *   2. Trên máy (khi chưa cấu hình): dữ liệu trong IndexedDB của trình duyệt,
 *      AI bằng khóa Claude API của chính người dùng (tùy chọn).
 */
(() => {
  "use strict";
  const CFG = window.SGP_CONFIG || {};
  const MODE = CFG.supabaseUrl && CFG.supabaseAnonKey ? "supabase" : "local";
  const LS = "sgp-standalone:";
  const lsGet = (k, d) => { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch {} };
  const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const parentOf = (key) => key.slice(0, key.lastIndexOf("/"));
  const idOf = (key) => key.slice(key.lastIndexOf("/") + 1);
  const privOwner = (key) => (key.startsWith("data/users/") ? key.split("/")[2] : null);

  /* ================= Bộ nhớ đệm + thông báo thay đổi (dùng chung 2 chế độ) ================= */
  const mem = new Map(); /* "col/.../id" -> object */
  const subs = new Set();
  const notify = (keys) => { const cols = new Set(keys.map(parentOf)); subs.forEach((s) => { if (s.doc ? keys.includes(s.path) : cols.has(s.path)) s.fire(); }); };

  /* ================= Chế độ trên máy: IndexedDB, đồng bộ giữa các tab ================= */
  function localBackend() {
    let idb = null;
    const openIdb = () => new Promise((res) => {
      if (!("indexedDB" in window)) return res(null);
      const r = indexedDB.open("sieu-giapha-chat", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("docs");
      r.onsuccess = () => res(r.result); r.onerror = () => res(null);
    });
    const idbAll = () => new Promise((res) => {
      if (!idb) return res([]);
      const out = []; const c = idb.transaction("docs", "readonly").objectStore("docs").openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); };
      c.onerror = () => res(out);
    });
    const idbPut = (k, v) => { if (!idb) { lsSet("docs", Object.fromEntries(mem)); return; } try { const st = idb.transaction("docs", "readwrite").objectStore("docs"); v === undefined ? st.delete(k) : st.put(v, k); } catch {} };
    const idbGet = (k) => new Promise((res) => { if (!idb) return res(undefined); const r = idb.transaction("docs").objectStore("docs").get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); });
    const bc = "BroadcastChannel" in window ? new BroadcastChannel("sieu-giapha-chat") : null;
    if (bc) bc.onmessage = async (e) => { const keys = e.data?.keys || []; for (const k of keys) { const v = await idbGet(k); v === undefined ? mem.delete(k) : mem.set(k, v); } notify(keys); };
    let uid = lsGet("uid", null); if (!uid) { uid = "local_" + rid(); lsSet("uid", uid); }
    return {
      mode: "local",
      async init() { idb = await openIdb(); if (idb) for (const [k, v] of await idbAll()) mem.set(k, v); else for (const [k, v] of Object.entries(lsGet("docs", {}))) mem.set(k, v); },
      uid: () => uid, signedIn: () => true, canEdit: () => true,
      profile: () => ({ name: lsGet("name", ""), avatarUrl: "" }),
      async loadCol() {}, async loadDoc() {},
      async put(key, val) { idbPut(key, val); bc?.postMessage({ keys: [key] }); },
      async del(key) { idbPut(key, undefined); bc?.postMessage({ keys: [key] }); },
      async profiles() { return {}; },
      async ai(body, signal) {
        const key = lsGet("apikey", "");
        if (!key) throw { code: "not_granted", message: "Chưa có khóa Claude API. Mở Tài khoản › Cài đặt app để thêm." };
        return fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal, headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body) });
      },
      aiReady: () => !!lsGet("apikey", ""),
      exportDocs: async () => Object.fromEntries(mem),
      async importDocs(docs) { for (const [k, v] of Object.entries(docs)) { mem.set(k, v); idbPut(k, v); } notify(Object.keys(docs)); bc?.postMessage({ keys: Object.keys(docs) }); },
    };
  }

  /* ================= Chế độ Supabase ================= */
  function supabaseBackend() {
    let sb = null, session = null, me = null, editor = false;
    const loaded = new Map(); /* col -> Promise */
    const docLoaded = new Map();
    const PROF = new Map();
    const row = (key, val) => ({ path: key, col: parentOf(key), id: idOf(key), data: val, updated_at: new Date().toISOString() });
    const onChange = (p) => {
      const key = p.new?.path || p.old?.path; if (!key) return;
      const col = parentOf(key);
      if (!loaded.has(col) && !docLoaded.has(key)) return;
      if (p.eventType === "DELETE") mem.delete(key); else mem.set(key, p.new.data);
      notify([key]);
    };
    async function fetchAll(q) {
      const out = []; for (let from = 0; ; from += 1000) {
        const { data, error } = await q().range(from, from + 999);
        if (error) throw { code: "unavailable", message: error.message };
        out.push(...data); if (data.length < 1000) break;
      } return out;
    }
    return {
      mode: "supabase",
      async init() {
        if (!window.supabase?.createClient) throw new Error("Không tải được thư viện Supabase");
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } });
        window.SGP_SB = sb;
        session = (await sb.auth.getSession()).data.session;
        sb.auth.onAuthStateChange((ev, s) => { const was = session?.user?.id; session = s; if ((s?.user?.id || null) !== (was || null) && ev !== "INITIAL_SESSION" && ev !== "TOKEN_REFRESHED") location.reload(); });
        if (session) {
          const u = session.user, md = u.user_metadata || {};
          me = { name: md.full_name || md.name || (u.email || "").split("@")[0], avatarUrl: md.avatar_url || md.picture || "" };
          sb.from("profiles").upsert({ id: u.id, name: me.name, avatar_url: me.avatarUrl, updated_at: new Date().toISOString() }).then(() => {}, () => {});
          const { data } = await sb.from("editors").select("user_id").eq("user_id", u.id).maybeSingle().then((r) => r, () => ({ data: null }));
          editor = !!data;
        }
        sb.channel("sgp-docs").on("postgres_changes", { event: "*", schema: "public", table: "docs" }, onChange).subscribe();
      },
      uid: () => session?.user?.id || null, signedIn: () => !!session, canEdit: () => editor,
      profile: () => me || { name: "", avatarUrl: "" },
      loadCol(col) {
        if (!loaded.has(col)) loaded.set(col, fetchAll(() => sb.from("docs").select("path,data").eq("col", col).order("path")).then((rows) => { rows.forEach((r) => mem.set(r.path, r.data)); notify(rows.length ? rows.map((r) => r.path) : [col + "/_"]); }).catch((e) => { loaded.delete(col); throw e; }));
        return loaded.get(col);
      },
      loadDoc(key) {
        if (loaded.has(parentOf(key))) return loaded.get(parentOf(key));
        if (!docLoaded.has(key)) docLoaded.set(key, sb.from("docs").select("path,data").eq("path", key).maybeSingle().then(({ data }) => { if (data) mem.set(key, data.data); }));
        return docLoaded.get(key);
      },
      async put(key, val) {
        if (!session) throw { code: "invalid_argument", message: "Cần đăng nhập để lưu" };
        const { error } = await sb.from("docs").upsert(row(key, val));
        if (error) throw { code: "invalid_argument", message: error.message };
      },
      async del(key) {
        if (!session) throw { code: "invalid_argument", message: "Cần đăng nhập để xóa" };
        const { error } = await sb.from("docs").delete().eq("path", key);
        if (error) throw { code: "invalid_argument", message: error.message };
      },
      async profiles(ids) {
        const need = ids.filter((i) => !PROF.has(i) && /^[0-9a-f-]{36}$/.test(i));
        if (need.length && session) { const { data } = await sb.from("profiles").select("id,name,avatar_url").in("id", need); (data || []).forEach((p) => PROF.set(p.id, { name: p.name || "", avatarUrl: p.avatar_url || "" })); need.forEach((i) => PROF.has(i) || PROF.set(i, { name: "", avatarUrl: "" })); }
        return Object.fromEntries(ids.map((i) => [i, PROF.get(i) || { name: "", avatarUrl: "" }]));
      },
      async ai(body, signal) {
        if (!session) throw { code: "not_granted", message: "Cần đăng nhập để dùng AI" };
        const s = (await sb.auth.getSession()).data.session;
        return fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/functions/v1/claude", { method: "POST", signal, headers: { "content-type": "application/json", apikey: CFG.supabaseAnonKey, authorization: "Bearer " + s.access_token }, body: JSON.stringify(body) });
      },
      aiReady: () => !!session,
      async exportDocs() { const out = {}; for (const [k, v] of mem) if (privOwner(k) === session?.user?.id) out[k] = v; const rows = await fetchAll(() => sb.from("docs").select("path,data").like("path", `data/users/${session.user.id}/%`).order("path")); rows.forEach((r) => (out[r.path] = r.data)); return out; },
      async importDocs(docs) { const mine = Object.entries(docs).filter(([k]) => privOwner(k)).map(([k, v]) => [k.replace(/^data\/users\/[^/]+\//, `data/users/${session.user.id}/`), v]); for (let i = 0; i < mine.length; i += 200) { const { error } = await sb.from("docs").upsert(mine.slice(i, i + 200).map(([k, v]) => row(k, v))); if (error) throw new Error(error.message); } mine.forEach(([k, v]) => mem.set(k, v)); notify(mine.map(([k]) => k)); },
      signIn(provider, email) { const redirectTo = location.origin + location.pathname; return provider === "email" ? sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }) : sb.auth.signInWithOAuth({ provider, options: { redirectTo } }); },
      signOut() { return sb.auth.signOut(); },
    };
  }

  const B = MODE === "supabase" ? supabaseBackend() : localBackend();
  const ready = B.init().catch((e) => { console.error(e); window.SGP_INIT_ERROR = String(e?.message || e); });

  /* ================= API kho dữ liệu giống Claude ================= */
  const SEG = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
  const check = (path, even) => {
    const p = String(path).split("/");
    if (!p.every((s) => SEG.test(s) && s !== "." && s !== "..")) throw new TypeError("Đường dẫn không hợp lệ: " + path);
    if ((p.length % 2 === 0) !== even) throw new TypeError((even ? "Cần đường dẫn tài liệu (số đoạn chẵn): " : "Cần đường dẫn bộ sưu tập (số đoạn lẻ): ") + path);
    return p.join("/");
  };
  const allowed = (key) => { const o = privOwner(key); return !o || o === B.uid(); };
  const merge = (a, b) => { for (const k in b) { const v = b[k]; if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) merge(a[k], v); else a[k] = v; } return a; };
  async function write(key, val) {
    if (!allowed(key)) throw { code: "invalid_argument", message: "Không có quyền ghi vào vùng riêng của người khác" };
    const old = mem.get(key);
    val === undefined ? mem.delete(key) : mem.set(key, clone(val)); notify([key]);
    try { val === undefined ? await B.del(key) : await B.put(key, clone(val)); }
    catch (e) { old === undefined ? mem.delete(key) : mem.set(key, old); notify([key]); throw e; }
  }
  const snapDoc = (key) => ({ id: idOf(key), exists: mem.has(key), data: () => clone(mem.get(key)) });

  function docRef(path) {
    const key = check(path, true);
    return {
      id: idOf(key), path: key,
      async get() { await ready; if (!allowed(key)) return snapDoc("_/_"); await B.loadDoc(key); return snapDoc(key); },
      async set(d) { await ready; if (!d || typeof d !== "object") throw { code: "invalid_argument", message: "Dữ liệu phải là object" }; await write(key, d); },
      async update(d) { await ready; await B.loadDoc(key); if (!mem.has(key)) throw { code: "invalid_argument", message: "Tài liệu chưa có" }; await write(key, merge(clone(mem.get(key)), clone(d))); },
      async delete() { await ready; await write(key, undefined); },
      collection(c) { return colRef(key + "/" + c); },
      onSnapshot(cb, err) {
        const s = { doc: true, path: key, fire: () => { try { cb(snapDoc(key)); } catch (e) { console.error(e); } } };
        subs.add(s); ready.then(() => (allowed(key) ? B.loadDoc(key) : null)).then(() => setTimeout(s.fire, 0), (e) => err?.(e));
        return () => subs.delete(s);
      },
    };
  }
  function colRef(path, q = {}) {
    const col = check(path, false);
    const run = () => {
      let docs = allowed(col + "/x") ? [...mem.keys()].filter((k) => parentOf(k) === col).map(snapDoc) : [];
      for (const [f, op, v] of q.where || []) docs = docs.filter((d) => { const x = d.data()?.[f]; return op === "==" || op === "eq" ? x === v : op === "!=" || op === "ne" ? x !== v : op === "<" || op === "lt" ? x < v : op === "<=" || op === "lte" ? x <= v : op === ">" || op === "gt" ? x > v : op === ">=" || op === "gte" ? x >= v : op === "in" ? v.includes(x) : op === "array-contains" ? Array.isArray(x) && x.includes(v) : true; });
      if (q.order) { const [f, dir] = q.order; docs.sort((a, b) => { const x = a.data()?.[f], y = b.data()?.[f]; return (x == null) - (y == null) || (x < y ? -1 : x > y ? 1 : 0) * (dir === "desc" ? -1 : 1); }); }
      else docs.sort((a, b) => (a.id < b.id ? -1 : 1));
      if (q.limit) docs = docs.slice(0, q.limit);
      return { docs, size: docs.length, empty: !docs.length };
    };
    return {
      path: col,
      doc(id) { return docRef(col + "/" + (id || rid())); },
      async add(d) { const r = docRef(col + "/" + rid()); await r.set(d); return r; },
      where(f, op, v) { return colRef(col, { ...q, where: [...(q.where || []), [f, op, v]] }); },
      orderBy(f, dir = "asc") { return colRef(col, { ...q, order: [f, dir] }); },
      limit(n) { return colRef(col, { ...q, limit: n }); },
      async get() { await ready; if (allowed(col + "/x")) await B.loadCol(col); return run(); },
      onSnapshot(cb, err) {
        const s = { doc: false, path: col, fire: () => { try { cb(run()); } catch (e) { console.error(e); } } };
        subs.add(s); ready.then(() => (allowed(col + "/x") ? B.loadCol(col) : null)).then(() => setTimeout(s.fire, 0), (e) => err?.(e));
        return () => subs.delete(s);
      },
    };
  }
  const db = Object.freeze({ collection: colRef, doc: docRef });

  /* ================= Người dùng ================= */
  const initials = (n, c = "#007AFF") => { const t = (n || "?").trim().split(/\s+/).pop().slice(0, 1).toUpperCase() || "?"; return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="${c}"/><text x="20" y="26" font-family="-apple-system,sans-serif" font-size="17" font-weight="600" fill="#fff" text-anchor="middle">${esc(t)}</text></svg>`); };
  const prof = () => { const p = B.profile(), id = B.uid(); return { id, name: p.name || "", avatarUrl: p.avatarUrl || initials(p.name || "Bạn"), color: "#007AFF", email: null, isOwner: B.canEdit(), canEdit: B.canEdit() }; };
  const user = Object.freeze({
    id: async () => B.uid(), me: async () => prof(), name: async () => prof().name, avatarUrl: async () => prof().avatarUrl, email: async () => null,
    isOwner: async () => B.canEdit(), canEdit: async () => B.canEdit(), can: async () => B.signedIn(),
    async profiles(ids) {
      ids = [...new Set([].concat(ids))]; const me = B.uid(); const got = await B.profiles(ids.filter((i) => i !== me));
      return Object.fromEntries(ids.map((i) => [i, i === me ? { ...prof(), isMe: true, guest: false } : { id: i, name: got[i]?.name || "", avatarUrl: got[i]?.avatarUrl || initials(got[i]?.name || "?", "#8E8E93"), color: "#8E8E93", email: null, isMe: false, guest: false }]));
    },
    search: async () => [{ ...prof(), isMe: true, guest: false }],
  });

  const downloads = Object.freeze({
    async save({ filename, data, mimeType }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType || (/\.json$/i.test(filename) ? "application/json" : /\.md$/i.test(filename) ? "text/markdown" : "text/plain") + ";charset=utf-8" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename || "tep"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
  });

  /* ================= AI (Claude) ================= */
  const MODELS = { quick: "claude-haiku-5-5", default: "claude-sonnet-5-5", complex: "claude-sonnet-5-5" };
  const toB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function callClaude(input, opts = {}, wantJson) {
    const msgs = typeof input === "string" ? [{ role: "user", content: input }] : clone(input);
    const imgs = [];
    for (const b of opts.images || []) imgs.push({ type: "image", source: { type: "base64", media_type: /^image\/(png|jpeg|gif|webp)$/.test(b.type) ? b.type : "image/jpeg", data: await toB64(b) } });
    const last = msgs[msgs.length - 1];
    last.content = [...imgs, { type: "text", text: String(last.content) + (wantJson ? "\n\nChỉ trả về một đối tượng JSON hợp lệ, không thêm chữ nào khác." : "") }];
    const r = await B.ai({ model: MODELS[opts.modelTier] || MODELS.default, max_tokens: 8000, messages: msgs }, opts.signal).catch((e) => { throw e?.code ? e : { code: e?.name === "AbortError" ? "aborted" : "unavailable", message: String(e?.message || e) }; });
    if (!r.ok) { const t = await r.text(); throw { code: r.status === 429 ? "rate_limited" : r.status === 401 || r.status === 403 ? "not_granted" : "unavailable", message: `AI ${r.status}: ${t.slice(0, 200)}` }; }
    const j = await r.json(); const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    opts.onText?.({ text, delta: text });
    return { text, truncated: j.stop_reason === "max_tokens", modelApplied: j.model };
  }
  const parseJson = (t) => { const s = t.indexOf("{"), a = t.indexOf("["); const i = s < 0 ? a : a < 0 ? s : Math.min(s, a); const e = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]")); if (i < 0 || e < i) throw { code: "invalid_output", message: "AI không trả JSON" }; return JSON.parse(t.slice(i, e + 1)); };
  const sample = Object.assign((input, opts) => callClaude(input, opts, false), {
    json: async (input, opts) => parseJson((await callClaude(input, opts, true)).text),
    limits: async () => ({ images: true }),
  });
  const permissions = Object.freeze({
    state: async (n) => { await ready; const m = { db: "granted", user: "granted", downloads: "granted", sample: B.aiReady() ? "granted" : "unavailable", mcp: "unavailable" }; return n ? m[n] || "unavailable" : m; },
    request: async () => permissions.state(), manage: async () => SGP.openSettings(),
  });

  if (!window.claude) window.claude = Object.freeze({
    use: async (name) => { await ready; if (window.SGP_INIT_ERROR) return name === "downloads" ? downloads : null;
      return { db, user, downloads, permissions, sample: B.aiReady() ? sample : null }[name] ?? null; },
  });

  /* ================= Đăng nhập (Supabase) ================= */
  function loginSheet() {
    if (MODE !== "supabase" || B.signedIn() || sessionStorage.getItem("sgp-guest")) return;
    const d = document.createElement("div"); d.className = "sgp-login"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Đăng nhập");
    d.innerHTML = `<div class="sgp-card"><div class="sgp-logo">GP</div><h2>Siêu GiaPha chat</h2><p>Đăng nhập để lưu gia phả riêng, có bot riêng và dùng AI.</p>
      <button class="sgp-b sgp-g" data-sgpin="google"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>Tiếp tục với Google</button>
      <form class="sgp-mail"><input type="email" required placeholder="Email của bạn" aria-label="Email" autocomplete="email"><button class="sgp-b sgp-p">Gửi link đăng nhập</button></form>
      <p class="sgp-msg" role="status"></p>
      <button class="sgp-link" data-sgpguest>Xem như khách</button>
      <p class="sgp-fine">Người dùng khác không đọc được gia phả riêng của bạn.</p></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", async (e) => {
      const g = e.target.closest("[data-sgpin]"); if (g) { const { error } = await B.signIn(g.dataset.sgpin); if (error) d.querySelector(".sgp-msg").textContent = error.message; }
      if (e.target.closest("[data-sgpguest]")) { sessionStorage.setItem("sgp-guest", "1"); d.remove(); }
    });
    d.querySelector("form").addEventListener("submit", async (e) => { e.preventDefault(); const em = e.target.querySelector("input").value.trim(); const m = d.querySelector(".sgp-msg"); m.textContent = "Đang gửi..."; const { error } = await B.signIn("email", em); m.textContent = error ? "Chưa gửi được: " + error.message : "Đã gửi. Mở email và bấm link để đăng nhập."; });
  }
  const css = document.createElement("style");
  css.textContent = `.sgp-login{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:grid;place-items:center;padding:16px}
.sgp-card{background:var(--panel,#fff);color:var(--fg,#1c1c1e);width:min(380px,100%);border-radius:20px;padding:28px 22px;display:flex;flex-direction:column;gap:12px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:-apple-system,BlinkMacSystemFont,"Be Vietnam Pro",system-ui,sans-serif}
.sgp-card h2{margin:0;font-size:22px}.sgp-card p{margin:0;color:var(--muted,#6e6e73);font-size:14px;line-height:1.5}
.sgp-logo{width:64px;height:64px;border-radius:16px;margin:0 auto;background:linear-gradient(160deg,#34C759,#007AFF);color:#fff;font:700 24px/64px -apple-system,sans-serif}
.sgp-b{min-height:46px;border-radius:12px;border:0;font:600 15px -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;width:100%}
.sgp-g{background:var(--panel-2,#f2f2f7);color:inherit}.sgp-p{background:#007AFF;color:#fff}
.sgp-mail{display:flex;flex-direction:column;gap:8px}.sgp-mail input{min-height:46px;border-radius:12px;border:1px solid var(--line,#e5e5ea);padding:0 14px;font:15px -apple-system,system-ui,sans-serif;background:var(--panel,#fff);color:inherit}
.sgp-link{background:none;border:0;color:#007AFF;font:500 14px -apple-system,system-ui,sans-serif;cursor:pointer;padding:6px}.sgp-fine{font-size:12px!important}.sgp-msg:empty{display:none}`;
  document.head.appendChild(css);

  /* ================= Cài đặt app ================= */
  const SGP = (window.SGP = {
    standalone: true, mode: MODE,
    settingsCard() {
      if (MODE === "supabase") {
        return `<div class="card" id="sgpSet"><h3>⚙️ Tài khoản</h3>${B.signedIn() ? `<p>Đã đăng nhập. Dữ liệu chung được cập nhật trực tiếp cho mọi người; gia phả riêng chỉ bạn đọc được.</p>
          <div class="btns"><button class="btn ghost" id="sgpExport">⬇️ Sao lưu dữ liệu riêng (.json)</button><button class="btn ghost" id="sgpImport">⬆️ Khôi phục</button><button class="btn ghost" id="sgpOut">Đăng xuất</button></div>`
          : `<p>Bạn đang xem như khách: chỉ xem dữ liệu chung.</p><div class="btns"><button class="btn primary" id="sgpIn">Đăng nhập</button></div>`}${window.SGP_INIT_ERROR ? `<p class="src">Lỗi kết nối máy chủ: ${esc(window.SGP_INIT_ERROR)}</p>` : ""}</div>`;
      }
      const k = lsGet("apikey", "");
      return `<div class="card" id="sgpSet"><h3>⚙️ Cài đặt app trên máy này</h3>
        <p>App đang chạy trên máy: dữ liệu lưu trong trình duyệt của máy này, không gửi lên máy chủ nào. Hãy sao lưu thường xuyên.</p>
        <label class="field">Tên của bạn<input id="sgpName" maxlength="60" value="${esc(lsGet("name", ""))}" placeholder="Ví dụ: Lê Văn An"></label>
        <label class="field">Khóa Claude API (để dùng AI)<input id="sgpKey" type="password" autocomplete="off" value="${k ? "••••••••" + esc(k.slice(-4)) : ""}" placeholder="sk-ant-..."></label>
        <p class="src">Lấy khóa ở console.anthropic.com. Khóa chỉ lưu trên máy này và chỉ gửi tới api.anthropic.com. Không dùng trên máy dùng chung.</p>
        <div class="btns"><button class="btn primary" id="sgpSave">Lưu</button>${k ? `<button class="btn ghost" id="sgpKeyDel">Xóa khóa</button>` : ""}<button class="btn ghost" id="sgpExport">⬇️ Sao lưu toàn bộ (.json)</button><button class="btn ghost" id="sgpImport">⬆️ Khôi phục</button></div></div>`;
    },
    openSettings() { document.querySelector("#acctChip")?.click(); },
    async exportAll() { await ready; await downloads.save({ filename: `sieu-giapha-chat-sao-luu-${new Date().toISOString().slice(0, 10)}.json`, data: JSON.stringify({ app: "sieu-giapha-chat", v: 1, at: new Date().toISOString(), docs: await B.exportDocs() }) }); },
    async importAll(file) {
      const j = JSON.parse(await file.text()); if (j.app !== "sieu-giapha-chat" || !j.docs) throw new Error("Không phải tệp sao lưu của Siêu GiaPha chat");
      if (!confirm(`Khôi phục ${Object.keys(j.docs).length} mục? Mục trùng sẽ được ghi đè.`)) return;
      await ready; await B.importDocs(j.docs); alert("Đã khôi phục. App sẽ tải lại."); location.reload();
    },
  });
  document.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("#sgpSave")) {
      lsSet("name", document.querySelector("#sgpName").value.trim());
      const k = document.querySelector("#sgpKey").value.trim();
      if (k && !k.startsWith("••")) { if (!/^sk-ant-/.test(k)) { alert("Khóa Claude API thường bắt đầu bằng sk-ant-"); return; } lsSet("apikey", k); }
      alert("Đã lưu. App sẽ tải lại để áp dụng."); location.reload();
    }
    if (t.closest("#sgpKeyDel")) { lsSet("apikey", ""); location.reload(); }
    if (t.closest("#sgpExport")) SGP.exportAll().catch((er) => alert(er.message || er));
    if (t.closest("#sgpImport")) { const i = document.createElement("input"); i.type = "file"; i.accept = "application/json,.json"; i.onchange = () => i.files[0] && SGP.importAll(i.files[0]).catch((er) => alert(er.message || er)); i.click(); }
    if (t.closest("#sgpOut")) { await B.signOut(); location.reload(); }
    if (t.closest("#sgpIn")) { sessionStorage.removeItem("sgp-guest"); loginSheet(); }
  });
  ready.then(() => { if (document.readyState === "loading") addEventListener("DOMContentLoaded", loginSheet); else loginSheet(); });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
