import { describe, expect, it } from 'vitest';
import { createRequestError } from './requestError';

describe('createRequestError', () => {
  it('preserves API metadata used to avoid duplicate notifications', () => {
    const source = Object.assign(new Error('Permiso insuficiente'), {
      status: 403,
      wasNotified: true,
      isForbidden: true,
      response: { status: 403, data: { message: 'Permiso insuficiente' } },
    });

    const result = createRequestError(source, 'Fallback');

    expect(result).toMatchObject({
      message: 'Permiso insuficiente',
      status: 403,
      wasNotified: true,
      isForbidden: true,
    });
    expect(result.cause).toBe(source);
  });

  it('does not wrap canceled requests', () => {
    const canceled = Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
    expect(createRequestError(canceled, 'Fallback')).toBe(canceled);
  });
});
