import { apiFetch } from "./client";

const sendContactMessage = ({ name, email, message }) =>
  apiFetch("/api/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, message }),
  });

export { sendContactMessage };
