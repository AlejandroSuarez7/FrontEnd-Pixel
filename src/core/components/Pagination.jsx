export const Pagination = ({
  classNames,
  currentPage,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
}) => {
  if (!totalItems || totalItems <= pageSize) return null;

  const firstPage = Math.max(1, currentPage - 2);
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = Array.from(
    { length: Math.max(lastPage - firstPage + 1, 0) },
    (_, index) => firstPage + index
  );

  return (
    <div className={classNames.pagination}>
      <span className={classNames.paginationInfo}>
        {totalItems} registros - Pagina {currentPage} de {totalPages}
      </span>
      <div className={classNames.paginationControls}>
        <button
          type="button"
          className={classNames.paginationButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={hasPrevPage === false || currentPage === 1}
        >
          Anterior
        </button>
        {pages.map(page => (
          <button
            type="button"
            key={page}
            className={`${classNames.paginationButton} ${page === currentPage ? classNames.paginationButtonActive : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className={classNames.paginationButton}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={hasNextPage === false || currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
