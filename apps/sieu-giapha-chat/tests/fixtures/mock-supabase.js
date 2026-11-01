/* Supabase giả lập cho kiểm thử: bảng docs/profiles/editors trong bộ nhớ (lưu localStorage),
 * RLS đơn giản giống schema.sql, phiên đăng nhập lấy từ localStorage "__sb_user". */
(() => {
  const K = "__sb_db";
  const db = JSON.parse(localStorage.getItem(K) || '{"docs":{},"profiles":{},"editors":{}}');
  const save = () => localStorage.setItem(K, JSON.stringify(db));
  const userId = localStorage.getItem("__sb_user");
  const session = userId ? { access_token: "tok-" + userId, user: { id: userId, email: userId.slice(0, 4) + "@x.vn", user_metadata: { full_name: "Người " + userId.slice(0, 4) } } } : null;
  const priv = (p) => (p.startsWith("data/users/") ? p.split("/")[2] : null);
  const canRead = (t, r) => t !== "docs" || !priv(r.path) || priv(r.path) === userId;
  const canWrite = (t, r) => { if (!userId) return false; if (t !== "docs") return true; const o = priv(r.path); return o ? o === userId : r.col !== "bots" || r.id === userId; };
  const chans = [];
  const emit = (eventType, row, old) => chans.forEach((cb) => setTimeout(() => cb({ eventType, new: row && canRead("docs", row) ? row : {}, old: old ? { path: old.path } : {} }), 5));
  function q(table) {
    const f = []; let mode = "select", payload = null, single = false, rng = null;
    const api = {
      select() { return api; }, eq(c, v) { f.push((r) => r[c] === v); return api; }, in(c, v) { f.push((r) => v.includes(r[c])); return api; },
      like(c, pat) { const re = new RegExp("^" + pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$"); f.push((r) => re.test(r[c])); return api; },
      order() { return api; }, range(a, b) { rng = [a, b]; return api; }, maybeSingle() { single = true; return api; },
      upsert(rows) { mode = "upsert"; payload = [].concat(rows); return api; }, delete() { mode = "delete"; return api; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    const keyOf = (r) => (table === "docs" ? r.path : table === "editors" ? r.user_id : r.id);
    function run() {
      const T = (db[table] = db[table] || {});
      if (mode === "upsert") {
        for (const r of payload) { if (!canWrite(table, r)) return { data: null, error: { message: "new row violates row-level security policy" } }; }
        for (const r of payload) { const k = keyOf(r); const old = T[k]; T[k] = { ...(old || { owner: userId }), ...r }; if (table === "docs") emit(old ? "UPDATE" : "INSERT", T[k]); }
        save(); return { data: null, error: null };
      }
      let rows = Object.values(T).filter((r) => canRead(table, r) && f.every((fn) => fn(r)));
      if (mode === "delete") { for (const r of rows) { if (!canWrite(table, r)) continue; delete T[keyOf(r)]; if (table === "docs") emit("DELETE", null, r); } save(); return { data: null, error: null }; }
      rows = rows.sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : 1));
      if (rng) rows = rows.slice(rng[0], rng[1] + 1);
      return { data: single ? rows[0] || null : JSON.parse(JSON.stringify(rows)), error: null };
    }
    return api;
  }
  window.__sbdb = db;
  window.supabase = {
    createClient: () => ({
      from: q,
      auth: {
        getSession: async () => ({ data: { session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signInWithOAuth: async ({ provider }) => { window.__signin = provider; return { error: null }; },
        signInWithOtp: async ({ email }) => { window.__signin = email; return { error: null }; },
        signOut: async () => { localStorage.removeItem("__sb_user"); return { error: null }; },
      },
      channel: () => { const c = { on(_e, _f, cb) { chans.push(cb); return c; }, subscribe() { return c; } }; return c; },
    }),
  };
})();
