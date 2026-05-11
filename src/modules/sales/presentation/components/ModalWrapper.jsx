import styles from './ModalWrapper.module.css';

const ModalWrapper = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2>{title}</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default ModalWrapper;
