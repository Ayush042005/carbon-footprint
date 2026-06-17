import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../server/src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  it('handles standard errors', () => {
    const err = new Error('Test error');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Test error',
        status: 500
      }
    });
    
    consoleSpy.mockRestore();
  });

  it('handles errors with custom status code', () => {
    const err = { message: 'Not found', status: 404 };
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    const next = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Not found',
        status: 404
      }
    });

    consoleSpy.mockRestore();
  });
});
