import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const classNames = {
  pagination: 'pagination',
  paginationInfo: 'info',
  paginationControls: 'controls',
  paginationButton: 'button',
  paginationButtonActive: 'active',
};

describe('Pagination', () => {
  it('stays hidden when every item fits on one page', () => {
    const { container } = render(
      <Pagination classNames={classNames} currentPage={1} pageSize={10} totalItems={10} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a bounded page window and changes pages', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        classNames={classNames}
        currentPage={4}
        hasNextPage
        hasPrevPage
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={80}
        totalPages={8}
      />,
    );

    expect(screen.getByText('80 registros - Pagina 4 de 8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('active');
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange.mock.calls).toEqual([[3], [6], [5]]);
  });

  it('disables navigation at the boundaries and near the last page', () => {
    const { rerender } = render(
      <Pagination classNames={classNames} currentPage={1} hasPrevPage={false} hasNextPage onPageChange={vi.fn()} pageSize={5} totalItems={12} totalPages={3} />,
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    rerender(
      <Pagination classNames={classNames} currentPage={3} hasPrevPage hasNextPage={false} onPageChange={vi.fn()} pageSize={5} totalItems={12} totalPages={3} />,
    );
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });
});
