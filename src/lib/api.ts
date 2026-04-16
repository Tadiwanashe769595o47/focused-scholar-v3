/// <reference types="vite/client" />

const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1 || (window as any).electronAPI !== undefined;
const API_URL = (import.meta as any).env?.DEV ? '/api' : 'http://localhost:3000/api';

let serverReady = false;
let serverCheckPromise: Promise<boolean> | null = null;

async function waitForServer(timeout = 15000): Promise<boolean> {
  if (serverReady) return true;
  
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch('http://localhost:3000/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        serverReady = true;
        return true;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

export function getApiUrl(path: string): string {
  if (isElectron) {
    return `http://localhost:3000/api${path}`;
  }
  return `${API_URL}${path}`;
}

export async function ensureServerReady(): Promise<boolean> {
  if (!isElectron) return true;
  if (serverReady) return true;
  
  if (!serverCheckPromise) {
    serverCheckPromise = waitForServer();
  }
  return serverCheckPromise;
}

export const isOnline = () => navigator.onLine;

export function getCachedData(key: string): any | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.value;
      }
    }
  } catch {}
  return null;
}

export function setCachedData(key: string, value: any): void {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
  } catch {}
}

let pendingRequests: Array<{
  path: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Wait for server to be ready in Electron app
  await ensureServerReady();
  
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

  const cacheKey = `${path}_${JSON.stringify(options.body || '')}`;

  if (!navigator.onLine) {
    console.log('Offline mode: returning cached data for', path);
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ path, options, resolve, reject });
      });
    }
    
    throw new Error('Offline - no cached data available');
  }

  try {
    const response = await fetch(getApiUrl(path), {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in again');
      }
      
      if (response.status >= 500) {
        console.error('Server error, trying cached data');
        const cached = getCachedData(cacheKey);
        if (cached) return cached;
      }
      
      throw new Error(error.error || 'Request failed');
    }

    const data = response.json();
    
    if (path.includes('/tests/') || path.includes('/questions') || path.includes('/progress') || path.includes('/stats')) {
      data.then(res => setCachedData(cacheKey, res));
    }
    
    return data;
  } catch (error: any) {
    console.error('API fetch error:', error.message);
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached data for', path);
      return cached;
    }
    
    throw error;
  }
}

export async function processPendingRequests(): Promise<void> {
  if (pendingRequests.length === 0 || !navigator.onLine) return;
  
  console.log('Processing', pendingRequests.length, 'pending requests');
  const requests = [...pendingRequests];
  pendingRequests = [];
  
  for (const req of requests) {
    try {
      const result = await apiFetch(req.path, req.options);
      req.resolve(result);
    } catch (error) {
      req.reject(error);
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network restored, processing pending requests');
    setTimeout(processPendingRequests, 1000);
  });
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

  const response = await fetch(getApiUrl(path), {
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

export async function preloadTodayContent(userId: number): Promise<void> {
  if (!navigator.onLine) return;
  
  const today = new Date().toISOString().split('T')[0];
  const subjects = ['0580', '0610', '0620', '0625', '0478', '0460', '0452', '0455', '0500'];
  
  console.log('Preloading today\'s content for offline use...');
  
  try {
    await apiFetch(`/students/${userId}/progress`);
    await apiFetch(`/students/${userId}/stats`);
    
    for (const subject of subjects) {
      try {
        await apiFetch(`/tests/${userId}/${today}?subject=${subject}`);
      } catch {}
    }
    
    console.log('Content preloaded successfully');
  } catch (error) {
    console.error('Failed to preload content:', error);
  }
}