import { apiFetch } from "./client";

const signup = ({ name, email, password, confirmPassword }) =>
  apiFetch("/signup", {
    method: "POST",
    headers: { accept: "application/json" },
    body: JSON.stringify({ name, email, password, confirmPassword }),
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

const updateUserProfile = (name, avatar, token) =>
  apiFetch("/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, avatar }),
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
  uploadAvatar,
};
