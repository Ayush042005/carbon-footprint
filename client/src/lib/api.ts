// Typed API fetch wrappers
import { User, Activity, InsightsResponse } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Generic request wrapper to handle fetch calls and JSON parsing.
 * @param url The API endpoint to fetch.
 * @param options Fetch options.
 * @returns The parsed JSON response as type T.
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  const response = await fetch(url, defaultOptions);
  let data: Record<string, unknown> | null = null;
  
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error((data?.error as string) || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: Record<string, unknown>) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: Record<string, unknown>) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  // User / Profile
  getProfile: () => request<User>('/api/user/profile', { method: 'GET' }),
  updateProfile: (body: Partial<User>) => request<User>('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Activities
  getActivities: () => request<Activity[]>('/api/activities', { method: 'GET' }),
  logActivity: (body: Record<string, unknown>) => request<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(body) }),
  deleteActivity: (id: number) => request<void>(`/api/activities/${id}`, { method: 'DELETE' }),

  // Insights
  generateInsights: (force?: boolean) =>
    request<InsightsResponse>(`/api/insights/generate${force ? '?force=true' : ''}`, { method: 'POST' }),
  sendChatMessage: (message: string, history: { role: 'user' | 'model'; text: string }[]) =>
    request<{ reply: string }>('/api/insights/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
