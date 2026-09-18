import { apiFetch } from "./client";

const signup = ({ name, email, password, confirmPassword, phone }) =>
  apiFetch("/signup", {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify({ name, email, password, confirmPassword, phone }),
  });

const signin = ({ email, password }) =>
  apiFetch("/signin", {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });

const forgotPassword = ({ email }) =>
  apiFetch("/forgot-password", {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify({ email }),
  });

const resetPassword = ({ token, password, confirmPassword }) =>
  apiFetch("/reset-password", {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify({ token, password, confirmPassword }),
  });

const getCurrentUser = (token) =>
  apiFetch("/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const updateUserProfile = (name, avatar, token, phone, bio, coachTitle) =>
  apiFetch("/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, avatar, phone, bio, coachTitle }),
  });

const changePassword = ({ currentPassword, newPassword, confirmNewPassword }, token) =>
  apiFetch("/me/password", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });

const uploadAvatar = (file, token) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiFetch("/me/avatar", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
};

export {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  changePassword,
  uploadAvatar,
};
