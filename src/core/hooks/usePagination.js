import { useCallback, useMemo, useState } from 'react';

export const PAGE_SIZE = 10;

export const usePagination = (items = [], pageSize = PAGE_SIZE) => {
  const paginationKey = `${items.length}:${pageSize}`;
  const [pageState, setPageState] = useState({ key: paginationKey, page: 1 });
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const currentPage = pageState.key === paginationKey
    ? Math.min(pageState.page, totalPages)
    : 1;

  const setCurrentPage = useCallback((nextPage) => {
    setPageState((previous) => {
      const activePage = previous.key === paginationKey
        ? Math.min(previous.page, totalPages)
        : 1;
      const requestedPage = typeof nextPage === 'function'
        ? nextPage(activePage)
        : nextPage;
      return {
        key: paginationKey,
        page: Math.max(1, Math.min(requestedPage, totalPages)),
      };
    });
  }, [paginationKey, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageSize,
    paginatedItems,
    setCurrentPage,
    totalPages,
  };
};
