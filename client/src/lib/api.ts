// Typed API fetch wrappers

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  const response = await fetch(url, defaultOptions);
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // User / Profile
  getProfile: () => request<any>('/api/user/profile', { method: 'GET' }),
  updateProfile: (body: any) => request<any>('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Activities
  getActivities: () => request<any[]>('/api/activities', { method: 'GET' }),
  logActivity: (body: any) => request<any>('/api/activities', { method: 'POST', body: JSON.stringify(body) }),
  deleteActivity: (id: number) => request<any>(`/api/activities/${id}`, { method: 'DELETE' }),

  // Insights
  generateInsights: (force?: boolean) =>
    request<any>(`/api/insights/generate${force ? '?force=true' : ''}`, { method: 'POST' }),
  sendChatMessage: (message: string, history: { role: 'user' | 'model'; text: string }[]) =>
    request<{ reply: string }>('/api/insights/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
