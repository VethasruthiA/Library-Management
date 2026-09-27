export const API_URL = (import.meta.env.VITE_API_URL || 'https://lair-setting-urologist.ngrok-free.dev').replace(/\/$/, '');
export const TOKEN_KEY = 'page-pine.jwt';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), '='));
    return JSON.parse(decodeURIComponent(Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
  } catch {
    return {};
  }
}

export function normalizeRole(...values) {
  for (const value of values.flat()) {
    if (!value) continue;
    const role = typeof value === 'string' ? value : value?.authority || value?.name || '';
    const normalized = role.toUpperCase().replace(/^ROLE_/, '').replace(/^\[|\]$/g, '');
    if (normalized.includes('ADMIN')) return 'ADMIN';
    if (normalized.includes('STUDENT')) return 'STUDENT';
    if (normalized.includes('LIBRARIAN')) return 'LIBRARIAN';
  }
  return '';
}

export function extractSession(result) {
  const data = result?.data || result?.result || result || {};
  const token = data.token || data.accessToken || data.jwt || data.access_token || result?.token || result?.accessToken;
  if (!token || typeof token !== 'string') {
    throw new Error('Login succeeded without a JWT. Check the response format from POST /auth/login.');
  }
  const claims = decodeJwt(token);
  const user = data.user || data.account || result?.user || {};
  const role = normalizeRole(
    user.role,
    user.roles,
    user.authorities,
    data.role,
    data.roles,
    claims.role,
    claims.roles,
    claims.authorities,
    claims.authority,
  );
  return {
    token,
    user: {
      id: user.id || user._id || claims.userId || claims.sub || '',
      studentId: user.studentId || data.studentId || claims.studentId || '',
      name: user.name || data.name || claims.name || claims.fullName || '',
      email: user.email || data.email || claims.email || '',
      role,
    },
  };
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(`Could not reach ${API_URL}. Check your network and backend availability.`);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  let result;
  try {
    result = contentType.includes('application/json') ? await response.json() : await response.text();
  } catch {
    result = null;
  }

  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('page-pine.user');
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
  if (response.status === 403) {
    window.dispatchEvent(new CustomEvent('auth:forbidden'));
    const error = new Error('You do not have permission to perform this action.');
    error.status = 403;
    throw error;
  }
  if (!response.ok) {
    const message = typeof result === 'string'
      ? result
      : result?.message || result?.detail || result?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return result;
}
