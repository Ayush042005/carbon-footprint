// Typed API fetch wrappers

export interface UserProfile {
  id?: number;
  name?: string;
  email?: string;
  country?: string;
}

export interface Activity {
  id?: number;
  category: string;
  subType: string;
  quantity: number;
  date?: string;
}

export interface Insight {
  id?: number;
  advice: string;
  date?: string;
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
  register: (body: Record<string, unknown>) => request<UserProfile>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: Record<string, unknown>) => request<UserProfile>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  // User / Profile
  getProfile: () => request<UserProfile>('/api/user/profile', { method: 'GET' }),
  updateProfile: (body: UserProfile) => request<UserProfile>('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Activities
  getActivities: () => request<Activity[]>('/api/activities', { method: 'GET' }),
  logActivity: (body: Activity) => request<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(body) }),
  deleteActivity: (id: number) => request<void>(`/api/activities/${id}`, { method: 'DELETE' }),

  // Insights
  generateInsights: (force?: boolean) =>
    request<Insight>(`/api/insights/generate${force ? '?force=true' : ''}`, { method: 'POST' }),
  sendChatMessage: (message: string, history: { role: 'user' | 'model'; text: string }[]) =>
    request<{ reply: string }>('/api/insights/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
