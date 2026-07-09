import { API_BASE } from './config';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  logistics_provider_id?: number | null;
  logistics_provider_name?: string | null;
  permissions?: string[];
}

export interface LogisticsProviderOption {
  id: number;
  name: string;
  code?: string;
}

export class ApiRequestError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

function tryParseJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}

function attachCsrfHeader(headers: Headers, method: string): void {
  const upper = method.toUpperCase();
  if (upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS') return;
  const csrf = sessionStorage.getItem('adminCsrfToken');
  if (csrf) headers.set('X-CSRF-Token', csrf);
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = init.method || 'GET';
  const headers = new Headers(init.headers || {});
  attachCsrfHeader(headers, method);
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_BASE}${path}`, { ...init, method, headers, credentials: 'include' });
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await adminFetch(path, init);
  } catch {
    throw new Error('无法连接后端服务，请检查网络');
  }
  const raw = await response.text();
  const payload = raw ? (tryParseJson(raw) ?? { error: raw }) : null;
  if (!response.ok) {
    const message = payload?.error || payload?.message || `请求失败（${response.status}）`;
    throw new ApiRequestError(message, response.status, payload);
  }
  return (payload || {}) as T;
}

export const api = {
  auth: {
    login: async (username: string, password: string): Promise<{ admin: AdminUser; csrfToken: string }> => {
      const payload = await requestJson<any>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = payload?.data ?? payload;
      return { admin: data?.admin, csrfToken: data?.csrfToken };
    },
    getSession: async (): Promise<{ admin: AdminUser; csrfToken: string }> => {
      const payload = await requestJson<any>('/admin/session');
      const data = payload?.data ?? payload;
      return { admin: data?.admin, csrfToken: data?.csrfToken };
    },
    logout: async (): Promise<void> => {
      await requestJson('/admin/logout', { method: 'POST' });
    },
  },
  logistics: {
    options: async (): Promise<LogisticsProviderOption[]> => {
      const payload = await requestJson<any>('/admin/logistics/options');
      const data = payload?.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  },
  parcels: {
    list: async (page = 1, limit = 5, logisticsProviderId?: number): Promise<{ data: any[]; pagination: any }> => {
      const providerQuery = logisticsProviderId && logisticsProviderId > 0
        ? `&logistics_provider_id=${logisticsProviderId}`
        : '';
      return requestJson(`/admin/parcels?page=${page}&limit=${limit}&sortKey=created_at&sortOrder=desc${providerQuery}`);
    },
    inbound: async (
      formData: FormData,
      options?: {
        hardDeleteIfSoftDeleted?: boolean;
        inboundAsNew?: boolean;
        logisticsProviderId?: number;
      }
    ): Promise<{ message: string; parcelId: number }> => {
      if (options?.hardDeleteIfSoftDeleted) {
        formData.set('hard_delete_if_soft_deleted', '1');
      }
      if (options?.inboundAsNew) {
        formData.set('inbound_as_new', '1');
      }
      if (options?.logisticsProviderId && options.logisticsProviderId > 0) {
        formData.set('logistics_provider_id', String(options.logisticsProviderId));
      }
      return requestJson('/admin/parcels/inbound', { method: 'POST', body: formData });
    },
  },
};
