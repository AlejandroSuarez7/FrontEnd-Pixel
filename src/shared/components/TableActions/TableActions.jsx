import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TableActions.css';

export const TableActions = ({ actions = [], align = 'right', label = 'Acciones', primaryAction = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, minWidth: 150 });
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const visibleActions = actions.filter(Boolean);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleClickOutside, true);
    window.addEventListener('resize', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleClickOutside, true);
      window.removeEventListener('resize', handleClickOutside);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const minWidth = 150;
    const estimatedHeight = Math.min(visibleActions.length * 38 + 12, 260);
    const hasSpaceBelow = rect.bottom + 8 + estimatedHeight <= window.innerHeight - 8;
    const top = hasSpaceBelow
      ? rect.bottom + 8
      : Math.max(8, rect.top - estimatedHeight - 8);
    const left = align === 'left'
      ? rect.left
      : Math.max(8, rect.right - minWidth);

    setMenuPosition({
      top,
      left: Math.min(left, window.innerWidth - minWidth - 8),
      minWidth,
    });
  }, [align, isOpen, visibleActions.length]);

  if (visibleActions.length === 0 && !primaryAction) return null;

  const handleActionClick = (action) => {
    setIsOpen(false);
    action.onClick?.();
  };

  return (
    <div className="table-actions" ref={menuRef}>
      {primaryAction && (
        <button
          type="button"
          className={`table-actions-primary ${primaryAction.variant ? `table-actions-primary-${primaryAction.variant}` : ''}`}
          onClick={() => primaryAction.onClick?.()}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
        </button>
      )}
      {visibleActions.length > 0 && (
        <button
          type="button"
          className="table-actions-trigger"
          ref={triggerRef}
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(prev => !prev)}
        >
          &#8942;
        </button>
      )}
      {isOpen && visibleActions.length > 0 && createPortal(
        <div
          className="table-actions-menu table-actions-menu-open"
          ref={menuRef}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            minWidth: `${menuPosition.minWidth}px`,
          }}
        >
          {visibleActions.map((action) => (
          <button
            type="button"
            key={action.label}
            className={`table-actions-item ${action.variant ? `table-actions-item-${action.variant}` : ''}`}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
          >
            {action.label}
          </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
