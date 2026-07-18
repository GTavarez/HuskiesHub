import { apiFetch } from "./client";

const uploadAdminImage = ({ token, slug, file }) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`/admin?slug=${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
};

export { uploadAdminImage };
