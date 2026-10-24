// الاتصال بالباك اند المحلي (XAMPP - Apache & MySQL) مع محرك محلي تلقائي للعمل عند النشر (GitHub Pages / Static Host)
import { CFG } from './config.js';
import { toast } from './ui.js';

const SESSION_KEY = 'idc.session';
const STORAGE_PREFIX = 'idc.store.';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(s) {
  if (!s) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

// محرك تخزين محلي يعمل في المتصفح تلقائياً عند النشر على GitHub Pages أو عدم توفر سيرفر PHP
const DEFAULT_ISSUERS = [
  { id: 'iss-01', name: 'وزارة الداخلية', name_en: 'Ministry of Interior', verified: true },
  { id: 'iss-02', name: 'وزارة الاتصالات (ITI)', name_en: 'Ministry of Communications (ITI)', verified: true },
  { id: 'iss-03', name: 'جامعة القاهرة', name_en: 'Cairo University', verified: true },
  { id: 'iss-04', name: 'Cisco', name_en: 'Cisco', verified: true },
  { id: 'iss-05', name: 'Microsoft', name_en: 'Microsoft', verified: true },
  { id: 'iss-06', name: 'Coursera', name_en: 'Coursera', verified: true },
  { id: 'iss-07', name: 'Udemy', name_en: 'Udemy', verified: true }
];

function getStore(k, fallback = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore(k, v) {
  try {
    localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v));
  } catch {}
}

async function localEngine(endpoint, options = {}, parsedBody = {}) {
  const session = getStoredSession();
  const userId = session?.user?.id || 'demo_user';
  const urlObj = new URL(endpoint, 'http://localhost');
  const path = urlObj.pathname.toLowerCase();
  const action = urlObj.searchParams.get('action') || '';
  const fn = urlObj.searchParams.get('fn') || '';

  // 1) Auth
  if (path.includes('auth.php')) {
    if (action === 'signup') {
      const email = (parsedBody.email || '').toLowerCase().trim();
      const fullName = parsedBody.options?.data?.full_name || parsedBody.full_name || 'مستخدم IDC';
      const uid = 'u_' + Math.random().toString(36).slice(2, 10);
      const handle = 'u' + Math.random().toString(36).slice(2, 10);

      const user = { id: uid, email, user_metadata: { full_name: fullName } };
      const newSession = { access_token: 'local_tok_' + uid, user };

      const users = getStore('users', {});
      users[email] = { ...user, password: parsedBody.password, handle };
      setStore('users', users);

      const profiles = getStore('profiles', {});
      profiles[uid] = {
        id: uid,
        full_name: fullName,
        handle,
        role: 'student',
        governorate: '',
        onboarded: false
      };
      setStore('profiles', profiles);

      setStoredSession(newSession);
      toast('تم إنشاء الحساب بنجاح (وضع النشر المباشر)');
      return { data: { user, session: newSession }, error: null };
    }

    if (action === 'login') {
      const login = (parsedBody.email || '').toLowerCase().trim();
      const users = getStore('users', {});
      let user = users[login];
      if (!user) {
        // Allow instant login for demo
        const uid = 'u_' + Math.random().toString(36).slice(2, 10);
        user = { id: uid, email: login || 'demo@idc.local', user_metadata: { full_name: 'مستخدم IDC' }, handle: 'u' + uid.slice(2) };
        users[login] = user;
        setStore('users', users);
      }
      const newSession = { access_token: 'local_tok_' + user.id, user };
      setStoredSession(newSession);
      return { data: { user, session: newSession }, error: null };
    }

    if (action === 'verify_otp' || action === 'send_otp') {
      toast('رمز التحقق للتجربة: 123456');
      return { data: { user: session?.user }, error: null };
    }

    if (action === 'update_user') {
      return { data: { user: session?.user }, error: null };
    }

    if (action === 'session' || action === 'me') {
      return { data: { session, user: session?.user }, error: null };
    }

    if (action === 'logout') {
      setStoredSession(null);
      return { data: null, error: null };
    }
  }

  // 2) Profiles
  if (path.includes('profiles.php')) {
    const profiles = getStore('profiles', {});
    let prof = profiles[userId] || {
      id: userId,
      full_name: session?.user?.user_metadata?.full_name || 'مستخدم IDC',
      handle: 'u' + userId.slice(0, 8),
      governorate: 'القاهرة',
      role: 'student',
      onboarded: false
    };

    if (options.method === 'POST' || options.method === 'PUT') {
      prof = { ...prof, ...parsedBody };
      profiles[userId] = prof;
      setStore('profiles', profiles);
      return { data: prof, error: null };
    }
    return { data: prof, error: null };
  }

  // 3) Items (Documents & Credentials)
  if (path.includes('items.php')) {
    const allItems = getStore('items', []);
    const vault = getStore('vault_' + userId, { open: false });

    if (options.method === 'GET' || !options.method) {
      const userItems = allItems.filter(i => i.user_id === userId);
      const visible = vault.open ? userItems : userItems.filter(i => i.level === 'public' || (i.level === 'secret' && i.secret_until && new Date(i.secret_until) <= new Date()));
      return { data: visible, error: null };
    }

    if (options.method === 'POST') {
      const newItem = {
        id: 'it_' + Math.random().toString(36).slice(2, 10),
        user_id: userId,
        created_at: new Date().toISOString(),
        ...parsedBody
      };
      allItems.unshift(newItem);
      setStore('items', allItems);
      return { data: newItem, error: null };
    }

    if (options.method === 'PUT') {
      const id = urlObj.searchParams.get('id') || parsedBody.id;
      const idx = allItems.findIndex(x => x.id === id);
      if (idx !== -1) {
        allItems[idx] = { ...allItems[idx], ...parsedBody };
        setStore('items', allItems);
        return { data: allItems[idx], error: null };
      }
    }

    if (options.method === 'DELETE') {
      const id = urlObj.searchParams.get('id') || parsedBody.id;
      const filtered = allItems.filter(x => x.id !== id);
      setStore('items', filtered);
      return { data: { success: true }, error: null };
    }
  }

  // 4) Issuers
  if (path.includes('issuers.php')) {
    return { data: DEFAULT_ISSUERS, error: null };
  }

  // 5) Access Logs
  if (path.includes('logs.php')) {
    const logs = getStore('logs_' + userId, [
      { action: 'unlock', ok: true, at: new Date().toISOString() }
    ]);
    return { data: logs, error: null };
  }

  // 6) Vault & RPC
  if (path.includes('vault.php') || path.includes('rpc.php')) {
    const vKey = 'vault_' + userId;
    let vState = getStore(vKey, { has_vault: false, open: false, pw: '' });

    const callFn = fn || action;
    if (callFn === 'vault_status' || callFn === 'status') {
      return { data: { has_vault: !!vState.has_vault, open: !!vState.open, locked_until: null }, error: null };
    }

    if (callFn === 'set_vault_password' || callFn === 'set_password') {
      const pw = parsedBody.pw || '';
      if (pw.length < 8) return { data: 'weak', error: null };
      vState.has_vault = true;
      vState.pw = pw;
      setStore(vKey, vState);
      return { data: 'ok', error: null };
    }

    if (callFn === 'unlock_vault' || callFn === 'unlock') {
      const pw = parsedBody.pw || '';
      if (!vState.has_vault) return { data: 'no_vault', error: null };
      if (vState.pw && vState.pw !== pw) return { data: 'wrong', error: null };
      vState.open = true;
      setStore(vKey, vState);
      return { data: 'ok', error: null };
    }

    if (callFn === 'lock_vault' || callFn === 'lock') {
      vState.open = false;
      setStore(vKey, vState);
      return { data: 'ok', error: null };
    }

    if (callFn === 'touch_vault' || callFn === 'touch') {
      return { data: 'ok', error: null };
    }

    if (callFn === 'mfa_send') {
      toast('رمز التحقق السريع: 123456');
      return { data: { factorId: 'factor_phone', challengeId: 'ch_local', debug_otp: '123456' }, error: null };
    }

    if (callFn === 'mfa_verify') {
      vState.open = true;
      setStore(vKey, vState);
      return { data: { verified: true }, error: null };
    }

    if (callFn === 'get_public_profile') {
      const h = parsedBody.h || urlObj.searchParams.get('h') || '';
      const profiles = getStore('profiles', {});
      const target = Object.values(profiles).find(p => p.handle === h) || Object.values(profiles)[0];
      if (!target) return { data: null, error: null };
      const allItems = getStore('items', []);
      const pubItems = allItems.filter(i => i.user_id === target.id && i.on_card);
      return {
        data: {
          full_name: target.full_name,
          governorate: target.governorate,
          role: target.role,
          items: pubItems
        },
        error: null
      };
    }
  }

  // 7) Public profile direct
  if (path.includes('public_profile.php')) {
    const h = urlObj.searchParams.get('h') || '';
    const profiles = getStore('profiles', {});
    const target = Object.values(profiles).find(p => p.handle === h) || Object.values(profiles)[0];
    if (!target) return { data: null, error: null };
    const allItems = getStore('items', []);
    const pubItems = allItems.filter(i => i.user_id === target.id && i.on_card);
    return {
      data: {
        full_name: target.full_name,
        governorate: target.governorate,
        role: target.role,
        items: pubItems
      },
      error: null
    };
  }

  // 8) Upload
  if (path.includes('upload.php')) {
    return { data: { path: 'local_avatar.jpg', signedUrl: '' }, error: null };
  }

  return { data: null, error: null };
}

async function request(endpoint, options = {}) {
  const session = getStoredSession();
  const token = session?.access_token || '';
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  let parsedBody = {};
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    parsedBody = body;
    body = JSON.stringify(body);
  }

  // Try network request to PHP / Apache backend first
  try {
    const base = CFG.API_URL.startsWith('http') ? CFG.API_URL : (window.location.origin + CFG.API_URL);
    const url = endpoint.startsWith('http') ? endpoint : (base + endpoint);

    const res = await fetch(url, { ...options, headers, body });
    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) {
      const data = await res.json();
      if (data?.debug_otp) {
        console.info('[IDC OTP Debug]', data.debug_otp);
        toast(`رمز التحقق: ${data.debug_otp}`);
      }
      return data;
    }
  } catch (err) {
    // Server is unreachable (e.g. running on GitHub Pages / Vercel without local XAMPP)
  }

  // Seamless fallback to resilient local engine
  return localEngine(endpoint, options, parsedBody);
}

export const sb = {
  auth: {
    async getSession() {
      const s = getStoredSession();
      if (!s) return { data: { session: null }, error: null };
      return { data: { session: s }, error: null };
    },

    async getUser() {
      const s = getStoredSession();
      if (!s?.user) return { data: { user: null }, error: { message: 'Not logged in' } };
      return { data: { user: s.user }, error: null };
    },

    async signInWithPassword({ email, phone, password }) {
      const res = await request('/auth.php?action=login', {
        method: 'POST',
        body: { email: email || phone, password }
      });
      if (res?.data?.session) {
        setStoredSession(res.data.session);
      }
      return res || { data: null, error: { message: 'Connection error' } };
    },

    async signUp({ email, password, options }) {
      const res = await request('/auth.php?action=signup', {
        method: 'POST',
        body: { email, password, options }
      });
      if (res?.data?.session) {
        setStoredSession(res.data.session);
      }
      return res || { data: null, error: { message: 'Connection error' } };
    },

    async updateUser(updates) {
      const res = await request('/auth.php?action=update_user', {
        method: 'POST',
        body: updates
      });
      if (res?.data?.user) {
        const s = getStoredSession() || {};
        s.user = { ...(s.user || {}), ...res.data.user };
        setStoredSession(s);
      }
      return res || { data: null, error: { message: 'Connection error' } };
    },

    async verifyOtp({ phone, token, type }) {
      const res = await request('/auth.php?action=verify_otp', {
        method: 'POST',
        body: { phone, token, type }
      });
      return res || { data: null, error: { message: 'Invalid OTP' } };
    },

    async signInWithOtp({ phone, options }) {
      const res = await request('/auth.php?action=send_otp', {
        method: 'POST',
        body: { phone, options }
      });
      return res || { data: null, error: { message: 'Connection error' } };
    },

    async signOut() {
      await request('/auth.php?action=logout', { method: 'POST' }).catch(() => {});
      setStoredSession(null);
      return { error: null };
    },

    async refreshSession() {
      const res = await request('/auth.php?action=session');
      if (res?.data?.session) {
        setStoredSession(res.data.session);
      }
      return res || { data: null, error: null };
    },

    mfa: {
      async listFactors() {
        return { data: { phone: [{ id: 'factor_phone', status: 'verified' }] } };
      },
      async unenroll() {
        return { data: null, error: null };
      },
      async enroll({ phone }) {
        return { data: { id: 'factor_phone', phone }, error: null };
      },
      async challenge({ factorId }) {
        const res = await request('/vault.php?action=mfa_send', { method: 'POST' });
        if (res?.error) return { data: null, error: res.error };
        return { data: { id: res.data?.challengeId || 'ch_default' }, error: null };
      },
      async verify({ factorId, challengeId, code }) {
        const res = await request('/vault.php?action=mfa_verify', {
          method: 'POST',
          body: { factorId, challengeId, code }
        });
        if (res?.error) throw new Error(res.error.message || 'MFA failed');
        return { data: res.data, error: null };
      }
    }
  },

  from(table) {
    return {
      select(cols = '*') {
        return {
          eq(col, val) {
            return {
              async single() {
                if (table === 'profiles') {
                  const r = await request('/profiles.php');
                  return { data: r?.data, error: r?.error };
                }
                return { data: null, error: null };
              },
              async maybeSingle() {
                if (table === 'profile_private') {
                  const r = await request('/profiles.php');
                  return { data: r?.data, error: r?.error };
                }
                return { data: null, error: null };
              }
            };
          },
          order(col, opts = {}) {
            return {
              async limit(n) {
                if (table === 'access_logs') {
                  const r = await request('/logs.php');
                  return { data: r?.data || [], error: r?.error };
                }
                return { data: [], error: null };
              },
              then(resolve, reject) {
                let p;
                if (table === 'items') {
                  p = request('/items.php').then(r => ({ data: r?.data || [], error: r?.error }));
                } else if (table === 'issuers') {
                  p = request('/issuers.php').then(r => ({ data: r?.data || [], error: r?.error }));
                } else if (table === 'access_logs') {
                  p = request('/logs.php').then(r => ({ data: r?.data || [], error: r?.error }));
                } else {
                  p = Promise.resolve({ data: [], error: null });
                }
                return p.then(resolve, reject);
              }
            };
          }
        };
      },

      insert(row) {
        return {
          select() {
            return {
              async single() {
                const r = await request('/items.php', { method: 'POST', body: row });
                return { data: r?.data, error: r?.error };
              }
            };
          }
        };
      },

      update(row) {
        return {
          eq(col, val) {
            return {
              select() {
                return {
                  async single() {
                    const r = await request(`/items.php?id=${encodeURIComponent(val)}`, { method: 'PUT', body: row });
                    return { data: r?.data, error: r?.error };
                  }
                };
              },
              then(resolve, reject) {
                let p;
                if (table === 'profiles' || table === 'profile_private') {
                  p = request('/profiles.php', { method: 'POST', body: row }).then(r => ({ data: r?.data, error: r?.error }));
                } else {
                  p = request(`/items.php?id=${encodeURIComponent(val)}`, { method: 'PUT', body: row }).then(r => ({ data: r?.data, error: r?.error }));
                }
                return p.then(resolve, reject);
              }
            };
          }
        };
      },

      upsert(row) {
        return request('/profiles.php', { method: 'POST', body: row }).then(r => ({ data: r?.data, error: r?.error }));
      },

      delete() {
        return {
          eq(col, val) {
            return request(`/items.php?id=${encodeURIComponent(val)}`, { method: 'DELETE' }).then(r => ({ data: r?.data, error: r?.error }));
          }
        };
      }
    };
  },

  async rpc(fn, args = {}) {
    if (fn === 'get_public_profile') {
      const r = await request(`/public_profile.php?h=${encodeURIComponent(args.h || '')}`);
      return { data: r?.data, error: r?.error };
    }
    const r = await request(`/rpc.php?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      body: args
    });
    return { data: r?.data, error: r?.error };
  },

  storage: {
    from(bucket) {
      return {
        async upload(path, file, options = {}) {
          const form = new FormData();
          form.append('bucket', bucket);
          form.append('path', path);
          form.append('file', file);
          const r = await request('/upload.php?action=upload', {
            method: 'POST',
            body: form
          });
          return { data: r?.data, error: r?.error };
        },

        async createSignedUrl(path, ttl = 300) {
          const r = await request(`/upload.php?action=signed&bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`);
          return { data: r?.data, error: r?.error };
        },

        async remove(paths) {
          const r = await request('/upload.php?action=delete', {
            method: 'POST',
            body: { bucket, paths }
          });
          return { data: r?.data, error: r?.error };
        }
      };
    }
  }
};

export const isPhone = p => /^01\d{9}$/.test(p);
export const e164 = p => '+20' + String(p).replace(/^0/, '');
export const fromE164 = p => (p ? '0' + String(p).replace(/^\+?20/, '') : '');

export const currentUser = async () => (await sb.auth.getUser()).data.user;

export async function loadProfile() {
  const u = await currentUser();
  const [a, b] = await Promise.all([
    sb.from('profiles').select('*').eq('id', u.id).single(),
    sb.from('profile_private').select('*').eq('id', u.id).maybeSingle()
  ]);
  if (a.error) throw a.error;
  return { ...b.data, ...a.data, id: u.id, email: u.email, auth_phone: u.phone };
}

export async function saveProfile(id, p) {
  const r1 = await sb.from('profiles').update({ full_name: p.full_name, governorate: p.governorate || null, role: p.role, onboarded: true }).eq('id', id);
  const r2 = await sb.from('profile_private').upsert({ id, national_id: p.national_id || null, birth_date: p.birth_date || null, phone: p.phone || null });
  if (r1.error || r2.error) throw (r1.error || r2.error);
}

export async function listItems() {
  const { data, error } = await sb.from('items').select('*, issuers(name,verified)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export const listIssuers = async () => (await sb.from('issuers').select('id,name,name_en,verified').order('name')).data || [];
export const saveItem = (row, id) => id ? sb.from('items').update(row).eq('id', id).select().single() : sb.from('items').insert(row).select().single();
export const delItem = id => sb.from('items').delete().eq('id', id);
export const logs = async () => (await sb.from('access_logs').select('*').order('at', { ascending: false }).limit(10)).data || [];

// ملفات: الصور بتتصغّر قبل الرفع، والـ PDF حد أقصى 5MB
export async function shrink(file, max = 1200) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = bmp.width * k; c.height = bmp.height * k;
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(b => r(new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })), 'image/jpeg', .82));
}

export const upload = (bucket, path, file) => sb.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
export const signed = async (bucket, path) => (await sb.storage.from(bucket).createSignedUrl(path, 300)).data?.signedUrl;
export const removeFiles = (bucket, paths) => sb.storage.from(bucket).remove(paths);
