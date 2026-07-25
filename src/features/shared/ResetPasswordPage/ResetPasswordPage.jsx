import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../../api/auth.js";
import { useForm } from "../../../hooks/useForm.js";
import { useToast } from "../../../context/ToastContext.js";
import "../../shared/portal.css";

function ResetPasswordPage({ onLoginClick }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { pushToast } = useToast();
  const { values, handleChange } = useForm({ password: "", confirmPassword: "" });
  const [succeeded, setSucceeded] = useState(false);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setSucceeded(true);
      pushToast({ type: "success", message: "Password reset. You can log in now." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to reset password." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (values.password !== values.confirmPassword) {
      pushToast({ type: "error", message: "Passwords do not match." });
      return;
    }
    resetMutation.mutate({ token, password: values.password, confirmPassword: values.confirmPassword });
  };

  if (!token) {
    return (
      <section className="portal">
        <div className="portal__panel">
          <h1 className="portal__title">Reset Password</h1>
          <p className="portal__subtitle">
            This reset link is missing or invalid. Please request a new one from the login screen.
          </p>
          <Link className="portal__button" to="/" style={{ display: "inline-block" }}>
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  if (succeeded) {
    return (
      <section className="portal">
        <div className="portal__panel">
          <h1 className="portal__title">Password Reset</h1>
          <p className="portal__subtitle">Your password has been updated. You can log in now.</p>
          <button className="portal__button" type="button" onClick={onLoginClick}>
            Log In
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Reset Password</h1>
        <form className="portal__form" onSubmit={handleSubmit}>
          <label className="portal__label" htmlFor="reset-password">
            New Password
          </label>
          <input
            id="reset-password"
            className="portal__input"
            type="password"
            name="password"
            minLength="8"
            required
            value={values.password}
            onChange={handleChange}
          />

          <label className="portal__label" htmlFor="reset-confirm-password">
            Confirm New Password
          </label>
          <input
            id="reset-confirm-password"
            className="portal__input"
            type="password"
            name="confirmPassword"
            minLength="8"
            required
            value={values.confirmPassword}
            onChange={handleChange}
          />

          <button className="portal__button" type="submit" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ResetPasswordPage;
