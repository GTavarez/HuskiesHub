import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import ModalWithForm from "../ModalWithForm/ModalWithForm.jsx";
import { forgotPassword } from "../../../api/auth.js";
import { useForm } from "../../../hooks/useForm.js";
import { useToast } from "../../../context/ToastContext.js";

function ForgotPasswordModal({ isOpen, onClose, onBackToSignIn }) {
  const { pushToast } = useToast();
  const { values, handleChange, resetForm } = useForm({ email: "" });
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Something went wrong. Try again." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email: values.email });
  };

  const handleClose = () => {
    resetForm();
    setSubmitted(false);
    onClose();
  };

  return (
    <ModalWithForm
      title="Reset Password"
      name="forgot-password"
      onClose={handleClose}
      onSubmit={handleSubmit}
      isOpen={isOpen}
      hideSubmitButton={submitted}
    >
      {submitted ? (
        <>
          <p className="modal__label">
            If that email has an account, we've sent a link to reset the password. Check your inbox
            (and spam folder).
          </p>
          <button
            type="button"
            className="modal__login-button"
            onClick={() => {
              onBackToSignIn();
              handleClose();
            }}
          >
            Back to Log In
          </button>
        </>
      ) : (
        <>
          <label className="modal__label">
            Email{" "}
            <input
              className="modal__input"
              type="email"
              name="email"
              id="forgot-password-email"
              required
              value={values.email}
              placeholder="Email"
              onChange={handleChange}
            />
          </label>
          <div className="modal__auth-buttons">
            <button
              type="submit"
              className="modal__submit"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="modal__login-button"
              onClick={() => {
                onBackToSignIn();
                handleClose();
              }}
            >
              Back to Log In
            </button>
          </div>
        </>
      )}
    </ModalWithForm>
  );
}

export default ForgotPasswordModal;
