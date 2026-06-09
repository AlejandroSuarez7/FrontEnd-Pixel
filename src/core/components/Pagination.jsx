export const Pagination = ({
  classNames,
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
}) => {
  if (totalItems <= pageSize) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className={classNames.pagination}>
      <span className={classNames.paginationInfo}>
        {totalItems} registros
      </span>
      <div className={classNames.paginationControls}>
        <button
          type="button"
          className={classNames.paginationButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
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
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
