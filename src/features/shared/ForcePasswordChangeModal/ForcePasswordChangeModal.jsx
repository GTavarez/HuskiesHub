import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "../../../api/auth.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import "./ForcePasswordChangeModal.css";

// Blocking modal — no close button — shown whenever the logged-in user's
// account still has mustChangePassword set (e.g. an admin-provisioned temp
// password). Can't be dismissed until the password is actually changed.
function ForcePasswordChangeModal({ token }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => changePassword(payload, token),
    onSuccess: () => {
      pushToast({ type: "success", message: "Password changed — welcome to HuskiesHub!" });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser(token) });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to change password." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      pushToast({ type: "error", message: "New passwords do not match." });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword });
  };

  return (
    <div className="forcePasswordChange__overlay">
      <div className="forcePasswordChange__modal">
        <h2 className="forcePasswordChange__title">Set a New Password</h2>
        <p className="forcePasswordChange__subtitle">
          Your account was set up with a temporary password. Please choose a new one
          before continuing.
        </p>

        <form className="forcePasswordChange__form" onSubmit={handleSubmit}>
          <label className="forcePasswordChange__label">
            Temporary Password
            <input
              type="password"
              className="forcePasswordChange__input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="forcePasswordChange__label">
            New Password
            <input
              type="password"
              className="forcePasswordChange__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="forcePasswordChange__label">
            Confirm New Password
            <input
              type="password"
              className="forcePasswordChange__input"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button
            className="forcePasswordChange__saveBtn"
            type="submit"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? "Saving..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForcePasswordChangeModal;
