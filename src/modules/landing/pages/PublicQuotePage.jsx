import {
  ArrowLeft,
  FileCheck2,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAsyncLock } from '../../../core/hooks/useAsyncLock';
import { useContextualBack } from '../../../core/hooks/useContextualBack';
import { notifications } from '../../../core/utils/notifications';
import { isClientUser } from '../../../core/utils/permissions';
import { useConfirm } from '../../../shared/components/ConfirmDialog/ConfirmProvider';
import { useAuth } from '../../../store/AuthContext';
import { PublicQuoteProductEditor } from '../components/PublicQuoteProductEditor';
import { PublicQuoteSummary } from '../components/PublicQuoteSummary';
import {
  MAX_ITEM_STAMPS,
  MAX_PUBLIC_QUOTE_ITEMS,
  PUBLIC_QUOTE_DRAFT_VERSION,
  buildPublicQuoteItemPayload,
  cloneQuoteItem,
  createDesignGroup,
  createQuoteItem,
  createStamp,
  hydrateQuoteItem,
  pruneDesignGroups,
  validateContact,
  validateQuoteItem,
} from '../domain/publicQuoteBuilder';
import { publicQuoteRepository } from '../infrastructure/publicQuote.repository';
import './PublicQuotePage.css';

const EDITABLE_CLIENT_STATUSES = new Set([
  'PENDIENTE',
  'EN_REVISION',
  'AJUSTE_SOLICITADO',
  'VENCIDA',
]);

const getClientProfile = (user, isClient) => (
  isClient ? (user?.cliente || user || {}) : {}
);

const getDraftIdentity = (user, isClient) => {
  if (!isClient) return 'anonymous';
  return String(
    user?.cliente?.idCliente
    || user?.idCliente
    || user?.idUsuario
    || user?.correo
    || 'client',
  );
};

const getEditId = (search) => {
  const value = new URLSearchParams(search).get('editar');
  return value && Number(value) > 0 ? Number(value) : null;
};

const readDraft = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value?.version !== PUBLIC_QUOTE_DRAFT_VERSION) return null;
    if (!Array.isArray(value.items) || value.items.length > MAX_PUBLIC_QUOTE_ITEMS) return null;
    return value;
  } catch {
    return null;
  }
};

const extractQuote = (response) => (
  response?.cotizacion || response?.data?.cotizacion || response?.data || response || {}
);

const getBackendCode = (error) => (
  error?.payload?.code || error?.response?.data?.code
);

const isCanceled = (error) => (
  error?.code === 'ERR_CANCELED'
  || error?.name === 'CanceledError'
  || error?.name === 'AbortError'
);

const requestPublicCatalogs = (signal) => Promise.all([
  publicQuoteRepository.listCategories({ signal }),
  publicQuoteRepository.listTechniques({ signal }),
  publicQuoteRepository.listProducts({ signal }),
]);

const PublicQuoteBuilder = ({ auth }) => {
  const { user, permissions, logout } = auth;
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useContextualBack('/');
  const confirm = useConfirm();
  const isClient = isClientUser(user, permissions);
  const isInternalUser = Boolean(user) && !isClient;
  const clientProfile = getClientProfile(user, isClient);
  const clientName = clientProfile.nombre || user?.nombre || '';
  const clientEmail = clientProfile.correo || user?.correo || '';
  const clientPhone = clientProfile.telefono || user?.telefono || '';
  const editId = getEditId(location.search);
  const draftIdentity = getDraftIdentity(user, isClient);
  const draftKey = `pixel-public-quote-draft:v${PUBLIC_QUOTE_DRAFT_VERSION}:${draftIdentity}`;
  const [initialDraft] = useState(() => readDraft(draftKey));
  const mountedRef = useRef(true);
  const catalogControllerRef = useRef(null);

  const [catalogs, setCatalogs] = useState({
    products: [],
    categories: [],
    techniques: [],
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId && isClient));
  const [editStatus, setEditStatus] = useState('');
  const [success, setSuccess] = useState(null);
  const [manualReview, setManualReview] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [itemError, setItemError] = useState('');
  const [contactErrors, setContactErrors] = useState({});

  const [contact, setContact] = useState(() => {
    const draftContact = initialDraft?.contact || {};
    if (isClient) {
      return {
        nombre: clientName,
        correo: clientEmail,
        telefono: clientPhone,
      };
    }
    return {
      nombre: draftContact.nombre || '',
      correo: draftContact.correo || '',
      telefono: draftContact.telefono || '',
    };
  });
  const [items, setItems] = useState(() => (
    editId
      ? []
      : (initialDraft?.items || []).map(hydrateQuoteItem)
  ));
  const [currentItem, setCurrentItem] = useState(() => createQuoteItem());
  const [editingItemId, setEditingItemId] = useState(null);
  const [observations, setObservations] = useState(
    editId ? '' : initialDraft?.observations || '',
  );
  const [designGroups, setDesignGroups] = useState(
    editId ? [] : initialDraft?.designGroups || [],
  );
  const { isLocked: isSubmitting, runLocked } = useAsyncLock();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      catalogControllerRef.current?.abort();
    };
  }, []);

  const retryCatalogs = () => {
    catalogControllerRef.current?.abort();
    const controller = new AbortController();
    catalogControllerRef.current = controller;
    setLoadingCatalogs(true);
    setCatalogError('');

    requestPublicCatalogs(controller.signal)
      .then(([categories, techniques, products]) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setCatalogs({ categories, techniques, products });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isCanceled(error) && mountedRef.current) {
          setCatalogError(error.message || 'No pudimos cargar el catálogo público.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && mountedRef.current) setLoadingCatalogs(false);
      });

    return controller;
  };

  useEffect(() => {
    const controller = new AbortController();
    catalogControllerRef.current = controller;
    requestPublicCatalogs(controller.signal)
      .then(([categories, techniques, products]) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setCatalogs({ categories, techniques, products });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isCanceled(error) && mountedRef.current) {
          setCatalogError(error.message || 'No pudimos cargar el catálogo público.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && mountedRef.current) setLoadingCatalogs(false);
      });
    return () => {
      controller.abort();
      if (catalogControllerRef.current === controller) {
        catalogControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!editId || !isClient) return undefined;

    const controller = new AbortController();
    publicQuoteRepository.getClientQuote(editId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted || !mountedRef.current) return;
        const quote = extractQuote(response);
        const details = quote.detalles || quote.items || [];
        const hydratedItems = details.map(hydrateQuoteItem);
        const groupIds = [...new Set(
          hydratedItems.flatMap((item) => item.estampados || [])
            .map((stamp) => stamp.grupoDisenoCompartido)
            .filter(Boolean),
        )];

        setItems(hydratedItems);
        setDesignGroups(groupIds.map((id, index) => ({
          id,
          label: `Diseño compartido ${index + 1}`,
        })));
        setObservations(quote.observaciones || '');
        setEditStatus(String(quote.estado || '').toUpperCase());
        if (quote.cliente) {
          setContact({
            nombre: quote.cliente.nombre || clientName,
            correo: quote.cliente.correo || clientEmail,
            telefono: quote.cliente.telefono || clientPhone,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isCanceled(error) && mountedRef.current) {
          notifications.error(error.message || 'No pudimos cargar la solicitud para editarla.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && mountedRef.current) setLoadingEdit(false);
      });

    return () => controller.abort();
  }, [clientEmail, clientName, clientPhone, editId, isClient]);

  useEffect(() => {
    if (editId || loadingEdit || success) return undefined;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          version: PUBLIC_QUOTE_DRAFT_VERSION,
          owner: draftIdentity,
          contact,
          items,
          designGroups,
          observations,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // El almacenamiento puede estar deshabilitado; el formulario sigue funcionando.
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    contact,
    designGroups,
    draftIdentity,
    draftKey,
    editId,
    items,
    loadingEdit,
    observations,
    success,
  ]);

  const payloadItems = useMemo(
    () => items.map((item) => buildPublicQuoteItemPayload(item, catalogs.techniques)),
    [catalogs.techniques, items],
  );
  const designReferences = useMemo(() => {
    const visibleItems = editingItemId
      ? items.map((item) => (item.localId === editingItemId ? currentItem : item))
      : [...items, currentItem];

    return visibleItems.flatMap((item, itemIndex) => (
      item.esDisenoGeneral || item.requiereDiseno === false
        ? []
        : (item.estampados || [])
          .filter((stamp) => stamp.origenDiseno !== 'NO_REQUIERE')
          .map((stamp) => ({
            key: stamp.localId,
            stampId: stamp.localId,
            itemId: item.localId,
            groupId: stamp.grupoDisenoCompartido || '',
            origin: stamp.origenDiseno,
            label: `Producto ${itemIndex + 1} — ${stamp.ubicacion || 'ubicación por definir'}`,
          }))
    ));
  }, [currentItem, editingItemId, items]);

  const isEditLocked = Boolean(editId && editStatus && !EDITABLE_CLIENT_STATUSES.has(editStatus));
  const currentItemNumber = editingItemId
    ? items.findIndex((item) => item.localId === editingItemId) + 1
    : null;
  const currentContactErrors = validateContact(contact, isClient);
  const canSubmit = (
    !isInternalUser
    && !isEditLocked
    && items.length > 0
    && Object.keys(currentContactErrors).length === 0
    && items.every((item) => !validateQuoteItem(
      item,
      catalogs.products,
      catalogs.techniques,
    ))
  );

  const updateContact = (field, value) => {
    if (isClient) return;
    setContact((current) => ({ ...current, [field]: value }));
    setContactErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'correo') setLoginRequired(false);
  };

  const patchCurrentItem = (patch) => {
    setCurrentItem((current) => ({ ...current, ...patch }));
    setItemError('');
  };

  const patchStamp = (stampId, patch) => {
    setCurrentItem((current) => ({
      ...current,
      estampados: current.estampados.map((stamp) => (
        stamp.localId === stampId ? { ...stamp, ...patch } : stamp
      )),
    }));
    setItemError('');
  };

  const addStamp = () => {
    if (currentItem.estampados.length >= MAX_ITEM_STAMPS) {
      notifications.warning(`Cada producto admite máximo ${MAX_ITEM_STAMPS} estampados.`);
      return null;
    }
    const stamp = createStamp({
      origenDiseno: currentItem.requiereDiseno
        ? 'PENDIENTE_DEFINIR'
        : 'NO_REQUIERE',
    });
    setCurrentItem((current) => ({
      ...current,
      estampados: [...current.estampados, stamp],
    }));
    return stamp.localId;
  };

  const duplicateStamp = (stampId) => {
    if (currentItem.estampados.length >= MAX_ITEM_STAMPS) return null;
    const source = currentItem.estampados.find((stamp) => stamp.localId === stampId);
    if (!source) return null;
    const stampValues = { ...source };
    delete stampValues.localId;
    const stamp = createStamp({
      ...stampValues,
      grupoDisenoCompartido: '',
    });
    setCurrentItem((current) => ({
      ...current,
      estampados: [...current.estampados, stamp],
    }));
    return stamp.localId;
  };

  const removeStamp = (stampId) => {
    const nextItem = {
      ...currentItem,
      estampados: currentItem.estampados.filter((stamp) => stamp.localId !== stampId),
    };
    setCurrentItem(nextItem);
    setDesignGroups((groups) => pruneDesignGroups(groups, items, nextItem));
  };

  const shareStampDesign = (stampId, referenceKey) => {
    if (!referenceKey) {
      patchStamp(stampId, { grupoDisenoCompartido: '' });
      return;
    }

    const reference = designReferences.find((item) => item.key === referenceKey);
    if (!reference) return;

    let groupId = reference.groupId;
    if (!groupId) {
      const group = createDesignGroup('Diseño compartido');
      groupId = group.id;
      setDesignGroups((current) => [...current, group]);
    }

    const connectStamps = (item) => ({
      ...item,
      estampados: (item.estampados || []).map((stamp) => {
        if (stamp.localId === reference.stampId) {
          return { ...stamp, grupoDisenoCompartido: groupId };
        }
        if (stamp.localId === stampId) {
          return {
            ...stamp,
            grupoDisenoCompartido: groupId,
            origenDiseno: reference.origin,
          };
        }
        return stamp;
      }),
    });

    setItems((current) => current.map(connectStamps));
    setCurrentItem((current) => connectStamps(current));
    setItemError('');
  };

  const resetEditor = () => {
    setCurrentItem(createQuoteItem());
    setEditingItemId(null);
    setItemError('');
  };

  const saveCurrentItem = () => {
    if (isEditLocked) return;
    const error = validateQuoteItem(currentItem, catalogs.products, catalogs.techniques);
    if (error) {
      setItemError(error);
      notifications.warning(error);
      document.getElementById('product-editor-title')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    if (!editingItemId && items.length >= MAX_PUBLIC_QUOTE_ITEMS) {
      notifications.warning(`La solicitud admite máximo ${MAX_PUBLIC_QUOTE_ITEMS} productos.`);
      return;
    }

    setItems((current) => (
      editingItemId
        ? current.map((item) => (item.localId === editingItemId ? currentItem : item))
        : [...current, currentItem]
    ));
    notifications.success(editingItemId ? 'Producto actualizado.' : 'Producto agregado a la solicitud.');
    resetEditor();
  };

  const editItem = (itemId) => {
    const source = items.find((item) => item.localId === itemId);
    if (!source) return;
    setCurrentItem({
      ...source,
      estampados: source.estampados.map((stamp) => ({ ...stamp })),
    });
    setEditingItemId(itemId);
    setItemError('');
    document.getElementById('product-editor-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const duplicateItem = (itemId) => {
    if (items.length >= MAX_PUBLIC_QUOTE_ITEMS) {
      notifications.warning(`La solicitud admite máximo ${MAX_PUBLIC_QUOTE_ITEMS} productos.`);
      return;
    }
    const source = items.find((item) => item.localId === itemId);
    if (!source) return;
    setItems((current) => [...current, cloneQuoteItem(source)]);
    notifications.success('Producto duplicado. Revisa sus datos antes de enviar.');
  };

  const deleteItem = async (itemId) => {
    const accepted = await confirm({
      title: 'Eliminar producto',
      message: '¿Quieres quitar este producto de la solicitud?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;

    const nextItems = items.filter((item) => item.localId !== itemId);
    setItems(nextItems);
    setDesignGroups((groups) => pruneDesignGroups(
      groups,
      nextItems,
      editingItemId === itemId ? null : currentItem,
    ));
    if (editingItemId === itemId) resetEditor();
  };

  const discardDraft = async () => {
    const accepted = await confirm({
      title: 'Descartar borrador',
      message: 'Se eliminarán los productos y datos guardados en este dispositivo.',
      confirmText: 'Descartar',
      cancelText: 'Conservar',
      variant: 'danger',
    });
    if (!accepted) return;
    localStorage.removeItem(draftKey);
    setItems([]);
    setDesignGroups([]);
    setObservations('');
    if (!isClient) setContact({ nombre: '', correo: '', telefono: '' });
    resetEditor();
    notifications.success('Borrador descartado.');
  };

  const submitQuote = async () => {
    await runLocked(async () => {
      if (isInternalUser) {
        notifications.warning(
          'Para cotizar como cliente, usa una cuenta de cliente o crea una cotización presencial desde el panel.',
        );
        return;
      }
      if (isEditLocked) {
        notifications.warning('Esta solicitud ya tiene una propuesta y no admite cambios estructurales.');
        return;
      }

      const nextContactErrors = validateContact(contact, isClient);
      setContactErrors(nextContactErrors);
      if (Object.keys(nextContactErrors).length > 0) {
        notifications.warning('Completa correctamente tus datos de contacto.');
        document.getElementById('quote-contact')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }
      if (items.length === 0) {
        notifications.warning('Agrega al menos un producto a la solicitud.');
        return;
      }

      const invalidIndex = items.findIndex((item) => (
        validateQuoteItem(item, catalogs.products, catalogs.techniques)
      ));
      if (invalidIndex >= 0) {
        const error = validateQuoteItem(
          items[invalidIndex],
          catalogs.products,
          catalogs.techniques,
        );
        editItem(items[invalidIndex].localId);
        setItemError(error);
        notifications.warning(`Producto ${invalidIndex + 1}: ${error}`);
        return;
      }

      try {
        const validation = await publicQuoteRepository.calculate({
          items: payloadItems,
          observaciones: observations.trim() || null,
        });
        setManualReview(Boolean(validation?.requiereRevisionManual));
      } catch (error) {
        if (!isCanceled(error)) {
          notifications.error(error.message || 'Revisa la configuración de la solicitud.');
        }
        return;
      }

      const accepted = await confirm({
        title: editId ? 'Guardar cambios' : 'Enviar solicitud',
        message: editId
          ? 'PIXEL revisará nuevamente los productos y diseños actualizados.'
          : 'PIXEL revisará los productos, técnicas, medidas y diseños antes de enviarte la propuesta final.',
        confirmText: editId ? 'Guardar cambios' : 'Enviar solicitud',
        cancelText: 'Volver',
        variant: 'success',
      });
      if (!accepted) return;

      try {
        let result;
        if (editId) {
          result = await publicQuoteRepository.updateClientQuote(editId, {
            items: payloadItems,
            observaciones: observations.trim() || null,
          });
        } else {
          result = await publicQuoteRepository.create({
            cliente: {
              nombre: (isClient ? clientProfile.nombre || user?.nombre : contact.nombre)?.trim() || '',
              correo: (
                isClient
                  ? clientProfile.correo || user?.correo
                  : contact.correo
              )?.trim().toLowerCase() || '',
              telefono: (
                isClient
                  ? clientProfile.telefono || user?.telefono
                  : contact.telefono
              )?.trim() || '',
            },
            items: payloadItems,
            observaciones: observations.trim() || null,
          });
        }

        const quote = extractQuote(result);
        localStorage.removeItem(draftKey);
        setSuccess({
          idCotizacion: quote.idCotizacion || editId,
          estado: quote.estado || 'EN_REVISION',
          edited: Boolean(editId),
        });
        notifications.success(
          editId
            ? 'Solicitud actualizada correctamente.'
            : 'Solicitud enviada correctamente. Revisa tu correo; si no aparece, revisa SPAM o correo no deseado.',
        );
      } catch (error) {
        const code = getBackendCode(error);
        const status = error?.status ?? error?.response?.status;
        if (status === 409 && code === 'EMAIL_REQUIRES_LOGIN') {
          setLoginRequired(true);
          notifications.warning(
            'Este correo ya está registrado. Inicia sesión para realizar una cotización con tu cuenta.',
            {
              action: {
                label: 'Iniciar sesión',
                onClick: () => navigate('/login', { state: { redirectTo: '/cotizar' } }),
              },
            },
          );
          return;
        }
        if (status === 401) {
          notifications.error('Tu sesión no es válida. Inicia sesión nuevamente.');
          logout();
          navigate('/login', { state: { redirectTo: `/cotizar${editId ? `?editar=${editId}` : ''}` } });
          return;
        }
        notifications.error(error.message || 'No pudimos guardar la solicitud. Puedes reintentar sin perder los datos.');
      }
    });
  };

  if (success) {
    return (
      <main className="public-quote-page">
        <section className="public-quote-success">
          <span className="public-quote-success-icon"><FileCheck2 size={34} /></span>
          <p className="public-quote-eyebrow">
            {success.edited ? 'Solicitud actualizada' : 'Solicitud recibida'}
          </p>
          <h1>
            {success.idCotizacion
              ? `Solicitud #${success.idCotizacion}`
              : 'Tu solicitud fue enviada'}
          </h1>
          <span className="public-quote-status">En revisión</span>
          <p>
            El equipo de PIXEL revisará los detalles y confirmará la propuesta final.
          </p>
          <div className="public-quote-success-actions">
            <button type="button" className="public-quote-secondary-button" onClick={goBack}>
              Volver
            </button>
            {isClient && (
              <Link to="/dashboard" className="public-quote-primary-button">
                Ver mis solicitudes
              </Link>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="public-quote-page">
      <header className="public-quote-header">
        <Link to="/" className="public-quote-brand" aria-label="PIXEL, volver al inicio">
          PIXEL
        </Link>
        <Link to="/#contacto" className="public-quote-contact-link">
          ¿Necesitas ayuda? Contacto
        </Link>
      </header>

      <section className="public-quote-intro">
        <div>
          <button type="button" className="public-quote-back" onClick={goBack}>
            <ArrowLeft size={18} /> Volver
          </button>
          <p className="public-quote-eyebrow">
            {editId ? 'Edición de solicitud' : 'Solicitud de cotización'}
          </p>
          <h1>Cuéntanos qué quieres estampar</h1>
          <p>PIXEL revisará la solicitud antes de confirmar el precio.</p>
        </div>
        {!editId && (
          items.length > 0
          || observations.length > 0
          || (!isClient && Boolean(contact.nombre || contact.correo || contact.telefono))
        ) && (
          <button type="button" className="public-quote-discard-button" onClick={discardDraft}>
            <RotateCcw size={16} /> Descartar borrador
          </button>
        )}
      </section>

      {isInternalUser && (
        <div className="public-quote-access-message" role="alert">
          <ShieldAlert size={22} />
          <div>
            <strong>Esta sesión pertenece al equipo de PIXEL.</strong>
            <span>
              Para cotizar como cliente, usa una cuenta de cliente o crea una cotización presencial desde el panel.
            </span>
          </div>
        </div>
      )}

      {editId && !isClient && (
        <div className="public-quote-access-message" role="alert">
          <ShieldAlert size={22} />
          <div>
            <strong>Inicia sesión con la cuenta del cliente.</strong>
            <span>La edición pública de una solicitud requiere una sesión de cliente válida.</span>
          </div>
        </div>
      )}

      {isEditLocked && (
        <div className="public-quote-access-message info" role="status">
          <ShieldAlert size={22} />
          <div>
            <strong>Esta solicitud ya tiene una propuesta.</strong>
            <span>No es posible cambiar productos, cantidades o diseños en su estado actual.</span>
          </div>
        </div>
      )}

      <div className="public-quote-builder-layout" data-testid="public-quote-builder">
        <div className="public-quote-builder-main">
          <section className="public-quote-contact-card" id="quote-contact">
            <div className="public-quote-card-heading compact">
              <div>
                <span>Datos de contacto</span>
                <h2>{isClient ? 'Cotizando con tu cuenta' : '¿A quién enviaremos la propuesta?'}</h2>
              </div>
            </div>
            {isClient && (
              <p className="public-quote-account-note">
                Cotizando con los datos de tu cuenta.
              </p>
            )}
            <div className="public-quote-contact-grid">
              <label>
                <span>Nombre completo *</span>
                <input
                  value={contact.nombre}
                  onChange={(event) => updateContact('nombre', event.target.value)}
                  maxLength={150}
                  readOnly={isClient}
                  disabled={loadingEdit}
                />
                {contactErrors.nombre && <small className="public-quote-field-error">{contactErrors.nombre}</small>}
              </label>
              <label>
                <span>Correo *</span>
                <input
                  type="email"
                  value={contact.correo}
                  onChange={(event) => updateContact('correo', event.target.value)}
                  maxLength={150}
                  readOnly={isClient}
                  disabled={loadingEdit}
                />
                {contactErrors.correo && <small className="public-quote-field-error">{contactErrors.correo}</small>}
              </label>
              <label>
                <span>Teléfono *</span>
                <input
                  inputMode="numeric"
                  value={contact.telefono}
                  onChange={(event) => updateContact(
                    'telefono',
                    event.target.value.replace(/\D/g, '').slice(0, 10),
                  )}
                  maxLength={10}
                  readOnly={isClient}
                  disabled={loadingEdit}
                />
                {contactErrors.telefono && <small className="public-quote-field-error">{contactErrors.telefono}</small>}
              </label>
            </div>
            {loginRequired && (
              <div className="public-quote-login-required">
                <span>Este correo ya tiene una cuenta de cliente.</span>
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { redirectTo: '/cotizar' } })}
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </section>

          {loadingCatalogs || loadingEdit ? (
            <section className="public-quote-loading-card" aria-live="polite">
              <span className="public-quote-spinner" />
              <strong>
                {loadingEdit ? 'Cargando tu solicitud…' : 'Preparando el catálogo…'}
              </strong>
            </section>
          ) : catalogError ? (
            <section className="public-quote-error-card" role="alert">
              <strong>No pudimos cargar el catálogo.</strong>
              <span>{catalogError}</span>
              <button type="button" onClick={retryCatalogs}>Reintentar</button>
            </section>
          ) : (
            <PublicQuoteProductEditor
              key={currentItem.localId}
              item={currentItem}
              products={catalogs.products}
              categories={catalogs.categories}
              techniques={catalogs.techniques}
              designReferences={designReferences}
              error={itemError}
              editingNumber={currentItemNumber}
              disabled={isInternalUser || isEditLocked || isSubmitting}
              onPatch={patchCurrentItem}
              onStampPatch={patchStamp}
              onAddStamp={addStamp}
              onDuplicateStamp={duplicateStamp}
              onRemoveStamp={removeStamp}
              onShareDesign={shareStampDesign}
              onSubmit={saveCurrentItem}
            />
          )}
        </div>

        <PublicQuoteSummary
          items={items}
          products={catalogs.products}
          techniques={catalogs.techniques}
          designGroups={designGroups}
          observations={observations}
          manualReview={manualReview}
          disabled={isInternalUser || isEditLocked || loadingCatalogs || loadingEdit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          onObservationsChange={(value) => setObservations(value)}
          onEdit={editItem}
          onDuplicate={duplicateItem}
          onDelete={deleteItem}
          onSubmit={submitQuote}
        />
      </div>
    </main>
  );
};

const PublicQuotePage = () => {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <main className="public-quote-page">
        <header className="public-quote-header">
          <Link to="/" className="public-quote-brand">PIXEL</Link>
        </header>
        <section className="public-quote-auth-loading" aria-live="polite">
          <span className="public-quote-spinner" />
          <strong>Preparando tu solicitud…</strong>
        </section>
      </main>
    );
  }

  return <PublicQuoteBuilder key={getDraftIdentity(auth.user, isClientUser(auth.user, auth.permissions))} auth={auth} />;
};

export default PublicQuotePage;
