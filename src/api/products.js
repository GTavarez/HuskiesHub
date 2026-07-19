import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getProducts = (type, token) => {
  const params = type ? `?type=${type}` : "";
  return apiFetch(`/api/products${params}`, {
    headers: token ? authHeaders(token) : {},
  });
};

const createProduct = (payload, token) =>
  apiFetch("/api/products", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateProduct = (id, payload, token) =>
  apiFetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deactivateProduct = (id, token) =>
  apiFetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { getProducts, createProduct, updateProduct, deactivateProduct };
