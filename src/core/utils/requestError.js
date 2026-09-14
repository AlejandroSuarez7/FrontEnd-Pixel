export const createRequestError = (error, fallback) => {
  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
    return error;
  }

  const wrappedError = new Error(
    error?.response?.data?.message || error?.message || fallback,
    { cause: error },
  );

  wrappedError.status = error?.status ?? error?.response?.status;
  wrappedError.payload = error?.payload ?? error?.response?.data;
  wrappedError.response = error?.response;
  wrappedError.isForbidden = Boolean(error?.isForbidden || wrappedError.status === 403);
  wrappedError.wasNotified = Boolean(error?.wasNotified);
  wrappedError.isNetworkError = Boolean(error?.isNetworkError || !error?.response);
  wrappedError.code = error?.code;

  return wrappedError;
};
