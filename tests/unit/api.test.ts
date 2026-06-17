import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../client/src/lib/api';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('makes successful GET requests', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' })
    });

    const res = await api.getProfile();
    expect(res).toEqual({ data: 'test' });
    expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({
      method: 'GET'
    }));
  });

  it('makes successful POST requests', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 })
    });

    const res = await api.login({ email: 'a@b.com', password: '123' });
    expect(res).toEqual({ id: 1 });
    expect(global.fetch).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: '123' })
    }));
  });

  it('throws error on non-ok response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    await expect(api.getProfile()).rejects.toThrow('Unauthorized');
  });

  it('handles json parse error in response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('parse error'); }
    });

    await expect(api.getProfile()).rejects.toThrow('Request failed with status 500');
  });
});
