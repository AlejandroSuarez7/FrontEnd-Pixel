import { analyzeReceiptText } from './receiptAnalysis.parsers';

const createCanceledError = () => {
  const error = new Error('Analisis cancelado.');
  error.name = 'CanceledError';
  error.code = 'ERR_CANCELED';
  return error;
};

const mapProgress = (message) => {
  const progress = Math.round(Math.max(0, Math.min(1, Number(message?.progress) || 0)) * 100);
  const analyzing = String(message?.status || '').toLowerCase().includes('recognizing');
  return {
    phase: analyzing ? 'analyzing' : 'preparing',
    progress,
  };
};

export const createReceiptAnalysisSession = () => {
  let activeRun = 0;
  let activeWorker = null;

  const terminateWorker = async (worker) => {
    if (!worker) return;
    try {
      await worker.terminate();
    } catch {
      // The worker may already be terminating after a file change.
    }
  };

  const cancel = async () => {
    activeRun += 1;
    const worker = activeWorker;
    activeWorker = null;
    await terminateWorker(worker);
  };

  const analyze = async (file, { onProgress } = {}) => {
    if (typeof File === 'undefined' || !(file instanceof File)) {
      throw new Error('Selecciona un comprobante valido.');
    }

    const runId = ++activeRun;
    onProgress?.({ phase: 'preparing', progress: 0 });

    const module = await import('tesseract.js');
    if (runId !== activeRun) throw createCanceledError();

    const createWorker = module.createWorker || module.default?.createWorker;
    if (typeof createWorker !== 'function') {
      throw new Error('No se pudo preparar el analisis del comprobante.');
    }

    const worker = await createWorker('spa', 1, {
      logger: message => {
        if (runId === activeRun) onProgress?.(mapProgress(message));
      },
    });

    if (runId !== activeRun) {
      await terminateWorker(worker);
      throw createCanceledError();
    }

    activeWorker = worker;
    try {
      const result = await worker.recognize(file);
      if (runId !== activeRun) throw createCanceledError();
      return analyzeReceiptText(result?.data?.text, result?.data?.confidence);
    } finally {
      if (activeWorker === worker) activeWorker = null;
      await terminateWorker(worker);
    }
  };

  return {
    analyze,
    cancel,
    dispose: cancel,
  };
};

export const createManualReceiptAnalysis = () => ({
  montoDetectado: null,
  referenciaDetectada: null,
  fechaDetectada: null,
  bancoDetectado: null,
  calidadLectura: 0,
  requiereRevisionManual: true,
  origenAnalisis: 'FRONTEND',
  amountCandidates: [],
});
