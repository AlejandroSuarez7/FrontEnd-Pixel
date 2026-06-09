import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE = 10;

export const usePagination = (items = [], pageSize = PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
