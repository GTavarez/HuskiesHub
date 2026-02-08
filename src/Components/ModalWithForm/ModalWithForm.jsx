import "./ModalWithForm.css";

function ModalWithForm({
  children,
  buttonText = "Save",
  title,
  onClose,
  onSubmit,
  isOpen,
  hideSubmitButton,
}) {
  return (
    <div className={`modal ${isOpen && "modal_opened"}`}>
      <div className="modal__content modal__content_type_singup">
        <h2 className="modal__title">{title}</h2>
        <button
          onClick={onClose}
          className="modal__close modal__close_type_form"
          type="button"
        ></button>
        <form onSubmit={onSubmit} className="modal__form">
          {children}
          {!hideSubmitButton && (
            <button type="submit" className="modal__submit">
              {buttonText}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
export default ModalWithForm;
