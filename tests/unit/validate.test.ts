import { describe, it, expect, vi } from 'vitest';
import { validateBody } from '../../server/src/middleware/validate';
import { z } from 'zod';

describe('Validate Middleware', () => {
  const schema = z.object({
    name: z.string().min(3)
  });

  it('calls next if validation passes', async () => {
    const req = { body: { name: 'Ayush' } } as any;
    const res = {} as any;
    const next = vi.fn();

    const middleware = validateBody(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ayush' });
  });

  it('returns 400 if validation fails', async () => {
    const req = { body: { name: 'A' } } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    const middleware = validateBody(schema);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Validation failed',
      details: expect.any(Array)
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
