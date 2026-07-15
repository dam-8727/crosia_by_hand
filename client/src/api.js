const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.message ||
      data.errors?.[0]?.msg ||
      'Something went wrong';
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) =>
    request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  health: () => request('/api/health'),
};
