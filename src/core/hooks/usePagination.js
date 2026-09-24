import { useMemo, useState } from 'react';

export const PAGE_SIZE = 10;

export const usePagination = (items = [], pageSize = PAGE_SIZE) => {
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const [pagination, setPagination] = useState(() => ({
    currentPage: 1,
    itemsLength: items.length,
    pageSize,
  }));

  const dependenciesChanged = pagination.itemsLength !== items.length
    || pagination.pageSize !== pageSize;
  const currentPage = dependenciesChanged
    ? 1
    : Math.min(pagination.currentPage, totalPages);

  if (dependenciesChanged) {
    setPagination({ currentPage: 1, itemsLength: items.length, pageSize });
  }

  const setCurrentPage = (nextPage) => {
    setPagination(previous => {
      const requestedPage = typeof nextPage === 'function'
        ? nextPage(previous.currentPage)
        : nextPage;
      return {
        currentPage: Math.min(Math.max(requestedPage, 1), totalPages),
        itemsLength: items.length,
        pageSize,
      };
    });
  };

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
