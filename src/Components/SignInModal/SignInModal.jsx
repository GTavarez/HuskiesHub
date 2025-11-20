import "../SignInModal/SignInModal.css";
import { useForm } from "../../hooks/useForm.js";
import ModalWithForm from "../ModalWithForm/ModalWithForm";
import { useEffect } from "react";

export default function SignInModal({
  isOpen,
  onClose,
  onSignUpModal,
  onSignIn,
  shouldResetLoginForm,
  onResetComplete,
}) {
  const { values, handleChange, resetForm } = useForm({
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      email: values.email,
      password: values.password,
    };
    onSignIn(formData);
  };
  useEffect(() => {
    if (shouldResetLoginForm) {
      resetForm(); // or however you manage state
      // Don't fOrget to reset the shouldResetForm flag!
      onResetComplete();
    }
  }, [shouldResetLoginForm]);

  return (
    <ModalWithForm
      title="Log In"
      name="sign-in"
      onClose={onClose}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      hideSubmitButton={true}
    >
      <label className="modal__label">
        Email{" "}
        <input
          name="email"
          type="email"
          className="modal__input"
          value={values.email}
          placeholder="Email"
          id="login-email"
          required
          onChange={handleChange}
        />
      </label>
      <label className="modal__label">
        Password{" "}
        <input
          name="password"
          type="password"
          className="modal__input"
          id="login-password"
          value={values.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
      </label>

      <div className="modal__signin__auth-buttons">
        <button type="submit" className="modal__signin-button">
          Log in
        </button>
        <button
          type="button"
          className="modal__signup-button"
          onClick={() => {
            onSignUpModal();
            onClose();
          }}
        >
          Or Sign up
        </button>
      </div>
    </ModalWithForm>
  );
}
