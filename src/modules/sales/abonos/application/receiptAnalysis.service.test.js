import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createManualReceiptAnalysis,
  createReceiptAnalysisSession,
} from './receiptAnalysis.service';

const workerMocks = vi.hoisted(() => ({
  recognize: vi.fn(),
  terminate: vi.fn(),
  createWorker: vi.fn(),
}));

vi.mock('tesseract.js', () => ({
  createWorker: workerMocks.createWorker,
}));

describe('receiptAnalysis service', () => {
  beforeEach(() => {
    workerMocks.recognize.mockReset();
    workerMocks.terminate.mockReset().mockResolvedValue(undefined);
    workerMocks.createWorker.mockReset().mockResolvedValue({
      recognize: workerMocks.recognize,
      terminate: workerMocks.terminate,
    });
  });

  it('loads the image analyzer on demand and releases its worker', async () => {
    workerMocks.recognize.mockResolvedValue({
      data: {
        text: 'Nequi\nValor enviado: $ 100.000\nReferencia: M123456\n26/07/2026',
        confidence: 88,
      },
    });
    const file = new File(['image'], 'receipt.jpg', { type: 'image/jpeg' });
    const session = createReceiptAnalysisSession();

    const result = await session.analyze(file);

    expect(workerMocks.createWorker).toHaveBeenCalledWith(
      'spa',
      1,
      expect.objectContaining({ logger: expect.any(Function) }),
    );
    expect(workerMocks.recognize).toHaveBeenCalledWith(file);
    expect(result.montoDetectado).toBe(100000);
    expect(result.origenAnalisis).toBe('FRONTEND');
    expect(workerMocks.terminate).toHaveBeenCalledTimes(1);
  });

  it('provides a manual result without loading the image analyzer', () => {
    expect(createManualReceiptAnalysis()).toMatchObject({
      montoDetectado: null,
      calidadLectura: 0,
      requiereRevisionManual: true,
      origenAnalisis: 'FRONTEND',
    });
    expect(workerMocks.createWorker).not.toHaveBeenCalled();
  });
});
