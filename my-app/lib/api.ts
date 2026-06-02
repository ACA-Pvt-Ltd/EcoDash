const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
// const API_URL = 'https://waste-management-app-five.vercel.app/api';
// const API_URL = 'https://eco-dash-tawny.vercel.app/api';

function getToken(): string | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/ecodash_admin_token=([^;]+)/);
    return match ? match[1] : null;
  }
  return null;
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  return res.json();
}

export { apiFetch, API_URL };
