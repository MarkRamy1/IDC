// الاتصال بالباك اند المحلي (XAMPP - Apache & MySQL)
import { CFG } from './config.js';
import { toast } from './ui.js';

const SESSION_KEY = 'idc.session';

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
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : (CFG.API_URL + endpoint);
  const res = await fetch(url, { ...options, headers, body });
  const data = await res.json().catch(() => null);

  if (data?.debug_otp) {
    console.info('[IDC OTP Debug]', data.debug_otp);
    toast(`رمز التحقق: ${data.debug_otp}`);
  }

  return data;
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
        return { data: { id: res.data.challengeId }, error: null };
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
