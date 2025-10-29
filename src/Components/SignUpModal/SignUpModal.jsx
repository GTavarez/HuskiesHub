import "./SignUpModal.css";
import ModalWithForm from "../ModalWithForm/ModalWithForm.jsx";
import React from "react";
import { useForm } from "../../hooks/useForm.js";
import { useEffect } from "react";

function SignUpModal({ isOpen, onClose, activeModal }) {
  const defaultValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const { values, handleChange, setValues } = useForm(defaultValues);

  const passwordMatches = values.password === values.confirmPassword;

  useEffect(() => {
    if (activeModal) {
      setValues(defaultValues); // Reset form when modal opens
    }
  }, [activeModal, setValues]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({
      name: values.name,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
  };
  return (
    <ModalWithForm
      buttonText="Sign up"
      title="Sign up"
      name="Sign up"
      onClose={onClose}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      hideSubmitButton={true}
    >
      <label className="modal__label">
        First Name{" "}
        <input
          className="modal__input"
          type="text"
          name="firstName"
          required
          id="firstName"
          value={values.firstName}
          minLength="1"
          maxLength="30"
          placeholder="First name"
          onChange={handleChange}
        />
      </label>
      <label className="modal__label">
        Email{" "}
        <input
          className="modal__input"
          type="email"
          name="email"
          required
          minLength="1"
          maxLength="30"
          placeholder="Email"
          value={values.email}
          onChange={handleChange}
        />
      </label>
      <label className="modal__label">
        Password{" "}
        <input
          className="modal__input"
          type="password"
          name="password"
          id="password"
          minLength="8"
          value={values.password}
          required
          onChange={handleChange}
          placeholder="Password"
        />
      </label>
      <label className="modal__label">
        Confirm Password{" "}
        <input
          className="modal__input"
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          minLength="8"
          value={values.confirmPassword}
          required
          onChange={handleChange}
          placeholder="Confirm Password"
        />
      </label>
      {!passwordMatches && <span className="modal__password_match">Password must match</span>}
      <div className="modal__auth-buttons">
        <button
          disabled={!passwordMatches || values.password === ""}
          type="submit"
          className="modal__submit"
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogin();
          }}
          className="modal__login-button"
        >
          or Log In
        </button>
      </div>
    </ModalWithForm>
  );
}
export default SignUpModal;
