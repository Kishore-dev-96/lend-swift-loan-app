function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-panel">
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
