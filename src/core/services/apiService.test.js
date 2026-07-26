import { describe, expect, it } from 'vitest';
import { prepareApiRequest } from './apiService';

describe('apiClient multipart requests', () => {
  it('removes the JSON content type so Axios can generate the multipart boundary', async () => {
    const body = new FormData();
    body.append('archivo', new File(['receipt'], 'receipt.png', { type: 'image/png' }));
    const config = {
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const preparedConfig = prepareApiRequest(config);

    expect(preparedConfig.data).toBe(body);
    expect(preparedConfig.headers).not.toHaveProperty('Content-Type');
  });
});
