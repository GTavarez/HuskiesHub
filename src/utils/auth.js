import { baseUrl } from "./constants.js";
import { checkResponse } from "./api.js";

// Added functions for user registration, login, and fetching current user

export const signup = ({ name, email, password, confirmPassword }) => {
  return fetch(`${baseUrl}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, confirmPassword }),
  })
    .then(checkResponse)
    .then((data) => {
      localStorage.setItem("jwt", data.token);
      return data;
    });
};
export const signin = ({ email, password }) => {
  return fetch(`${baseUrl}/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then(checkResponse)
    .then((data) => {
      localStorage.setItem("jwt", data.token);
      return data;
    });
};

export const getCurrentUser = (token) => {
  return fetch(`${baseUrl}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then(checkResponse);
};
export const updateUserProfile = async (name, avatar, token) => {
  return fetch(`${baseUrl}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, avatar }),
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error updating profile:", err);
      throw err;
    });
};
export const uploadAvatar = async (file, token) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return fetch(`${baseUrl}/me/avatar`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }).then(checkResponse);
};
