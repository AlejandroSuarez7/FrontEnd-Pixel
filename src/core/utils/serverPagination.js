export const DEFAULT_PAGE_SIZE = 10;

export const createPaginationMeta = (overrides = {}) => ({
  page: Number(overrides.page || 1),
  limit: Number(overrides.limit || DEFAULT_PAGE_SIZE),
  total: Number(overrides.total || 0),
  totalPages: Number(overrides.totalPages || 0),
  hasNextPage: Boolean(overrides.hasNextPage),
  hasPrevPage: Boolean(overrides.hasPrevPage),
});

export const buildPaginationParams = ({
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  search = '',
  sortBy,
  order,
  ...filters
} = {}) => {
  const params = {
    ...filters,
    page,
    limit,
  };

  if (search?.trim()) params.search = search.trim();
  if (sortBy) params.sortBy = sortBy;
  if (order) params.order = order;

  Object.keys(params).forEach((key) => {
    if (params[key] === '' || params[key] === undefined || params[key] === null) {
      delete params[key];
    }
  });

  return params;
};

export const normalizePaginatedResponse = (responseData, mapItems) => {
  const rawItems = Array.isArray(responseData?.data) ? responseData.data : [];

  return {
    items: mapItems(rawItems),
    meta: createPaginationMeta(responseData?.meta),
  };
};
