import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { formatCalendarDate, formatDate } from '../../../core/utils/fechaFormato';
import { formatMoneyCOP } from '../../../core/utils/formatters';
import { notifications } from '../../../core/utils/notifications';
import {
  createManualReceiptAnalysis,
  createReceiptAnalysisSession,
} from '../../sales/abonos/application/receiptAnalysis.service';
import { abonoRepository } from '../../sales/abonos/infrastructure/abono.repository';
import { ReceiptPreviewModal } from '../../sales/abonos/presentation/ReceiptPreviewModal';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatMoney = value => formatMoneyCOP(value, 'Pendiente de revision');

const paymentStatusLabel = {
  PENDIENTE: 'Pendiente de revision',
  CONFIRMADO: 'Confirmado',
  RECHAZADO: 'Rechazado',
};

const normalizeDetectedData = (data, fallback) => {
  const source = data || fallback || createManualReceiptAnalysis();
  return {
    montoDetectado: source.monto ?? source.montoDetectado ?? null,
    referenciaDetectada: source.referencia ?? source.referenciaDetectada ?? null,
    fechaDetectada: source.fecha ?? source.fechaDetectada ?? null,
    bancoDetectado: source.banco ?? source.bancoDetectado ?? null,
    calidadLectura: source.calidadLectura ?? null,
    requiereRevisionManual: Boolean(source.requiereRevisionManual),
    origenAnalisis: 'FRONTEND',
  };
};

const isCanceled = error => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';

export const ClientPaymentsPanel = ({ order, canUpload, canView }) => {
  const inputRef = useRef(null);
  const analysisSessionRef = useRef(null);
  const analysisSequenceRef = useRef(0);
  const previewUrlRef = useRef('');
  const mountedRef = useRef(true);
  const requestSequenceRef = useRef(0);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [result, setResult] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [detectedData, setDetectedData] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [observations, setObservations] = useState('');
  const { isLocked: isUploading, runLocked } = useAsyncLock();
  const orderId = order?.id;
  const isAnalyzing = analysisStatus === 'preparing' || analysisStatus === 'analyzing';

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    if (mountedRef.current) setPreviewUrl('');
  }, []);

  const cancelCurrentAnalysis = useCallback(() => {
    analysisSequenceRef.current += 1;
    const session = analysisSessionRef.current;
    analysisSessionRef.current = null;
    if (session) void session.cancel();
  }, []);

  const clearSelectedFile = useCallback(() => {
    cancelCurrentAnalysis();
    releasePreview();
    if (!mountedRef.current) return;
    setSelectedFile(null);
    setDetectedData(null);
    setAnalysisStatus('idle');
    setAnalysisProgress(0);
    setObservations('');
    if (inputRef.current) inputRef.current.value = '';
  }, [cancelCurrentAnalysis, releasePreview]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelCurrentAnalysis();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [cancelCurrentAnalysis]);

  const loadPayments = useCallback(async (signal) => {
    const requestId = ++requestSequenceRef.current;
    if (!orderId || !canView) {
      setPayments([]);
      setLoadError('');
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const items = await abonoRepository.listClientByPedido(orderId, { signal });
      if (signal?.aborted || requestId !== requestSequenceRef.current) return;
      setPayments(items);
    } catch (error) {
      if (signal?.aborted || isCanceled(error) || requestId !== requestSequenceRef.current) return;
      setPayments([]);
      setLoadError(error.message || 'No se pudieron consultar tus abonos.');
    } finally {
      if (!signal?.aborted && requestId === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  }, [orderId, canView]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setResult(null);
      loadPayments(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadPayments]);

  const analyzeSelectedImage = useCallback(async (file) => {
    const requestId = ++analysisSequenceRef.current;
    const previousSession = analysisSessionRef.current;
    analysisSessionRef.current = null;
    if (previousSession) await previousSession.cancel();
    if (!mountedRef.current || requestId !== analysisSequenceRef.current) return;

    const session = createReceiptAnalysisSession();
    analysisSessionRef.current = session;
    setDetectedData(null);
    setAnalysisStatus('preparing');
    setAnalysisProgress(0);

    try {
      const analysis = await session.analyze(file, {
        onProgress: ({ phase, progress }) => {
          if (!mountedRef.current || requestId !== analysisSequenceRef.current) return;
          setAnalysisStatus(phase);
          setAnalysisProgress(progress);
        },
      });
      if (!mountedRef.current || requestId !== analysisSequenceRef.current) return;
      setDetectedData(analysis);
      setAnalysisStatus('done');
      setAnalysisProgress(100);
    } catch (error) {
      if (!mountedRef.current || requestId !== analysisSequenceRef.current || isCanceled(error)) return;
      setDetectedData(createManualReceiptAnalysis());
      setAnalysisStatus('error');
      setAnalysisProgress(0);
      notifications.warning(
        'No pudimos identificar todos los datos. PIXEL revisara el comprobante manualmente.',
      );
    } finally {
      if (analysisSessionRef.current === session) analysisSessionRef.current = null;
    }
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(file instanceof File) || file.size <= 0) {
      notifications.warning('Selecciona un comprobante valido antes de continuar.');
      event.target.value = '';
      clearSelectedFile();
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      notifications.warning('Selecciona un comprobante JPG, PNG o PDF.');
      event.target.value = '';
      clearSelectedFile();
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notifications.warning('El comprobante no puede superar 10 MB.');
      event.target.value = '';
      clearSelectedFile();
      return;
    }

    releasePreview();
    setSelectedFile(file);
    setResult(null);
    setObservations('');

    if (file.type === 'application/pdf') {
      cancelCurrentAnalysis();
      setDetectedData(createManualReceiptAnalysis());
      setAnalysisStatus('manual');
      setAnalysisProgress(0);
      return;
    }

    if (typeof URL.createObjectURL === 'function') {
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    }
    setDetectedData(null);
    setAnalysisStatus('preparing');
    setAnalysisProgress(0);
    void analyzeSelectedImage(file);
  };

  const closeUpload = (force = false) => {
    if (isUploading && !force) return;
    setIsUploadOpen(false);
    clearSelectedFile();
  };

  const handleUpload = async () => {
    if (typeof File === 'undefined' || !(selectedFile instanceof File)) {
      notifications.warning('Selecciona un comprobante antes de continuar.');
      return;
    }
    if (isAnalyzing) return;

    await runLocked(async () => {
      try {
        const suggestions = detectedData || createManualReceiptAnalysis();
        const uploadResult = await abonoRepository.uploadClientReceipt(
          order.id,
          selectedFile,
          suggestions,
          observations,
        );
        const responseData = normalizeDetectedData(
          uploadResult?.datosDetectados,
          suggestions,
        );
        setResult({
          abono: uploadResult?.abono,
          datosDetectados: responseData,
        });
        await loadPayments();

        if (uploadResult?.duplicado) {
          notifications.warning(
            'Este comprobante ya estaba registrado para el pedido. No se creo un abono duplicado.',
          );
          return;
        }

        if (selectedFile.type === 'application/pdf') {
          notifications.success(
            'Comprobante recibido. El archivo quedo pendiente de revision manual.',
          );
        } else if (responseData.requiereRevisionManual || responseData.montoDetectado == null) {
          notifications.success(
            'Comprobante recibido. Algunos datos seran revisados manualmente por PIXEL.',
          );
        } else {
          notifications.success(
            `Comprobante recibido. Detectamos un monto de ${formatMoney(responseData.montoDetectado)} y quedo pendiente de confirmacion.`,
          );
        }
        closeUpload(true);
      } catch (error) {
        if (!error.wasNotified) {
          notifications.error(error.message || 'No se pudo enviar el comprobante.');
        }
      }
    });
  };

  const selectedReceiptLoader = useCallback(
    () => abonoRepository.getClientReceipt(receiptPayment?.idAbono),
    [receiptPayment?.idAbono],
  );

  if (!order) return null;
  const canReceivePayment = !['ANULADO', 'ENTREGADO'].includes(order.status)
    && Number(order.balance || 0) > 0;

  return (
    <section className="dashboard-panel dashboard-client-payments">
      <div className="dashboard-client-payments-header">
        <div>
          <span className="dashboard-eyebrow">Abonos</span>
          <h2>Pagos de {order.number}</h2>
          <p>Consulta tus pagos y envia el comprobante de una transferencia.</p>
        </div>
        {canUpload && canReceivePayment && (
          <button
            type="button"
            className="dashboard-upload-receipt"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload size={18} />
            Subir comprobante
          </button>
        )}
      </div>

      <div className="dashboard-payment-summary">
        <div><span>Total pedido</span><strong>{formatMoney(order.total)}</strong></div>
        <div><span>Total confirmado</span><strong>{formatMoney(order.paid)}</strong></div>
        <div><span>Saldo pendiente</span><strong>{formatMoney(order.balance)}</strong></div>
        <div><span>Estado de pago</span><strong>{Number(order.balance || 0) <= 0 ? 'Pago completo' : order.paymentStatus}</strong></div>
      </div>

      {result?.datosDetectados && (
        <div className="dashboard-detected-result">
          <CheckCircle2 size={19} />
          <div>
            <strong>Comprobante pendiente de confirmacion</strong>
            <span>Monto detectado: {formatMoney(result.datosDetectados.montoDetectado)}</span>
            <span>Referencia detectada: {result.datosDetectados.referenciaDetectada || 'No identificada'}</span>
            <span>Banco o plataforma: {result.datosDetectados.bancoDetectado || 'No identificado'}</span>
            <small>PIXEL revisara estos datos antes de confirmar el pago.</small>
          </div>
        </div>
      )}

      {!canView ? (
        <p className="dashboard-client-payment-empty">No tienes permiso para consultar el historial de abonos.</p>
      ) : loading ? (
        <p className="dashboard-client-payment-empty">Consultando abonos...</p>
      ) : loadError ? (
        <div className="dashboard-client-payment-empty">
          <p>{loadError}</p>
          <button type="button" onClick={() => loadPayments()}>
            Reintentar
          </button>
        </div>
      ) : payments.length === 0 ? (
        <p className="dashboard-client-payment-empty">Todavia no hay abonos registrados para este pedido.</p>
      ) : (
        <div className="dashboard-client-payment-list">
          {payments.map(payment => (
            <article key={payment.idAbono}>
              <div>
                <strong>{formatMoney(payment.monto ?? payment.montoDetectadoOcr)}</strong>
                <small>{payment.monto == null && payment.montoDetectadoOcr != null ? 'Monto detectado' : payment.estado === 'CONFIRMADO' ? 'Monto confirmado' : 'Monto del abono'}</small>
              </div>
              <div>
                <span className={`dashboard-payment-status ${String(payment.estado || '').toLowerCase()}`}>
                  {paymentStatusLabel[payment.estado] || payment.estado}
                </span>
                <small>{formatDate(payment.fechaCreacion)}</small>
              </div>
              <div>
                <span>{payment.referencia || payment.referenciaDetectadaOcr || 'Sin referencia'}</span>
                {payment.requiereRevisionManual && <small>Requiere revision manual</small>}
                {payment.motivoRechazo && <small>{payment.motivoRechazo}</small>}
              </div>
              {payment.comprobanteDisponible && (
                <button type="button" onClick={() => setReceiptPayment(payment)}>
                  <FileSearch size={17} /> Ver comprobante
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <small className="dashboard-upload-help">Archivos permitidos: JPG, PNG o PDF. Tamano maximo: 10 MB.</small>

      {isUploadOpen && (
        <div className="dashboard-receipt-upload-overlay" role="presentation">
          <div
            className="dashboard-receipt-upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-upload-title"
          >
            <div className="dashboard-receipt-upload-title">
              <div>
                <span className="dashboard-eyebrow">Transferencia</span>
                <h3 id="receipt-upload-title">Subir comprobante</h3>
                <p>Selecciona el archivo, revisa los datos y luego envialo.</p>
              </div>
              <button type="button" onClick={() => closeUpload()} disabled={isUploading} aria-label="Cerrar">
                <X size={19} />
              </button>
            </div>

            <div className="dashboard-receipt-upload-body">
              <label className="dashboard-receipt-file-picker">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Upload size={22} />
                <strong>{selectedFile ? 'Cambiar archivo' : 'Seleccionar comprobante'}</strong>
                <small>JPG, PNG o PDF. Maximo 10 MB.</small>
              </label>

              {selectedFile && (
                <div className="dashboard-receipt-selected-file">
                  {selectedFile.type === 'application/pdf' ? <FileText size={22} /> : <ImageIcon size={22} />}
                  <div>
                    <strong>{selectedFile.name}</strong>
                    <span>
                      {selectedFile.type || 'Tipo no identificado'} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button type="button" onClick={clearSelectedFile} disabled={isUploading}>
                    Quitar
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="dashboard-receipt-image-preview">
                  <img src={previewUrl} alt="Vista previa del comprobante" />
                </div>
              )}

              {isAnalyzing && (
                <div className="dashboard-receipt-analysis-status" role="status">
                  <strong>
                    {analysisStatus === 'preparing'
                      ? 'Preparando comprobante...'
                      : 'Analizando comprobante...'}
                  </strong>
                  <div aria-hidden="true">
                    <span style={{ width: `${analysisProgress}%` }} />
                  </div>
                  <small>{analysisProgress > 0 ? `${analysisProgress}%` : 'Esto puede tardar unos segundos.'}</small>
                </div>
              )}

              {selectedFile && !isAnalyzing && detectedData && (
                <section className={`dashboard-receipt-detected ${detectedData.requiereRevisionManual ? 'manual' : ''}`}>
                  <div className="dashboard-receipt-detected-title">
                    {detectedData.requiereRevisionManual
                      ? <AlertTriangle size={19} />
                      : <CheckCircle2 size={19} />}
                    <div>
                      <strong>Datos detectados</strong>
                      <span>
                        {detectedData.requiereRevisionManual
                          ? 'Requiere revision manual'
                          : 'Pendiente de confirmacion'}
                      </span>
                    </div>
                  </div>
                  <div className="dashboard-receipt-detected-grid">
                    <div><span>Monto detectado</span><strong>{formatMoney(detectedData.montoDetectado)}</strong></div>
                    <div><span>Referencia detectada</span><strong>{detectedData.referenciaDetectada || 'No identificada'}</strong></div>
                    <div><span>Fecha detectada</span><strong>{detectedData.fechaDetectada ? formatCalendarDate(detectedData.fechaDetectada) : 'No identificada'}</strong></div>
                    <div><span>Banco o plataforma</span><strong>{detectedData.bancoDetectado || 'No identificado'}</strong></div>
                  </div>
                  <p>Los datos detectados seran revisados por PIXEL antes de confirmar el pago.</p>
                </section>
              )}

              {selectedFile && !isAnalyzing && (
                <label className="dashboard-receipt-observations">
                  <span>Observaciones opcionales</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={observations}
                    onChange={event => setObservations(event.target.value)}
                    placeholder="Agrega una aclaracion para el equipo de PIXEL."
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            <div className="dashboard-receipt-upload-actions">
              <button type="button" onClick={() => closeUpload()} disabled={isUploading}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isAnalyzing || isUploading}
              >
                {isUploading ? 'Enviando comprobante...' : 'Enviar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptPreviewModal
        isOpen={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        loadReceipt={selectedReceiptLoader}
        title={`Comprobante del abono #${receiptPayment?.idAbono || ''}`}
      />
    </section>
  );
};
