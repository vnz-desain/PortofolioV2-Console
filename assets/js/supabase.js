/* ═══════════════════════════════════════════════════════════
   SUPABASE.JS — Client + Auth helpers
═══════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://ocedszxukzrnmvrecrnx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZWRzenh1a3pybm12cmVjcm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjI4ODAsImV4cCI6MjA5Nzg5ODg4MH0.fxgMdyZlbp0V20oSvI6ZgnZNgWFh4g0iHMI4SxYLkkE';
const SESSION_KEY  = `sb-ocedszxukzrnmvrecrnx-auth-token`;

const sb = {

  _headers(extra = {}) {
    const s = this._session();
    return {
      'apikey'       : SUPABASE_KEY,
      'Authorization': s?.access_token ? `Bearer ${s.access_token}` : `Bearer ${SUPABASE_KEY}`,
      'Content-Type' : 'application/json',
      'Prefer'       : 'return=representation',
      ...extra
    };
  },

  _session() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Supabase bisa simpan sebagai { access_token, ... } atau { session: { access_token } }
      return data?.access_token ? data : (data?.session || null);
    } catch { return null; }
  },

  _saveSession(data) {
    // Normalise — pastikan selalu ada access_token di root
    const session = data?.access_token ? data : (data?.session || data);
    // Hitung expires_at kalau belum ada
    if (!session.expires_at && session.expires_in) {
      session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /* ── Auth ── */
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method : 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.message || 'Login failed');
    return this._saveSession(data);
  },

  async signOut() {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method : 'POST',
        headers: this._headers()
      });
    } catch {}
    localStorage.removeItem(SESSION_KEY);
  },

  getUser() {
    const s = this._session();
    return s?.user || null;
  },

  isLoggedIn() {
    const s = this._session();
    if (!s?.access_token) return false;
    // Kalau ada expires_at, cek apakah belum expired
    if (s.expires_at) {
      return s.expires_at > Math.floor(Date.now() / 1000);
    }
    // Kalau tidak ada expires_at, anggap valid (baru login)
    return true;
  },

  /* ── Database ── */
  async select(table, opts = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    if (opts.order)  url += `&order=${opts.order}`;
    if (opts.filter) url += `&${opts.filter}`;
    if (opts.limit)  url += `&limit=${opts.limit}`;
    const res = await fetch(url, { headers: this._headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method : 'POST',
      headers: this._headers(),
      body   : JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method : 'PATCH',
      headers: this._headers(),
      body   : JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method : 'DELETE',
      headers: { ...this._headers(), 'Prefer': 'return=minimal' }
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  /* ── Storage ── */
  async uploadFile(bucket, path, file) {
    const s   = this._session();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method : 'POST',
      headers: {
        'apikey'       : SUPABASE_KEY,
        'Authorization': `Bearer ${s?.access_token || SUPABASE_KEY}`,
        'Content-Type' : file.type,
        'x-upsert'     : 'true'
      },
      body: file
    });
    if (!res.ok) throw new Error(await res.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  },

  async deleteFile(bucket, path) {
    const s   = this._session();
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method : 'DELETE',
      headers: {
        'apikey'       : SUPABASE_KEY,
        'Authorization': `Bearer ${s?.access_token || SUPABASE_KEY}`
      }
    });
    return res.ok;
  },

  getPublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
};

export { sb, SUPABASE_URL, SUPABASE_KEY };
