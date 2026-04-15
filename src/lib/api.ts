/// <reference types="vite/client" />

const API_URL = (import.meta as any).env?.DEV ? '/api' : 'http://localhost:3000/api';

export function getApiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const authStorage = localStorage.getItem('auth-storage');
  let token: string | null = null;
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.token || null;
    } catch {}
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function apiUpload(path: string, formData: FormData) {
  const authStorage = localStorage.getItem('auth-storage');
  let token: string | null = null;
  
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.token || null;
    } catch {}
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}
