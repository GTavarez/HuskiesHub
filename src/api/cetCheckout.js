// Talks to the standalone CET backend (its own Cloud Run service, its own
// Stripe account) — deliberately separate from api/client.js's apiFetch,
// which points at the Huskies backend.
const CET_BACKEND_URL = "https://cet-backend-891073803869.us-central1.run.app";

async function createCetSubscriptionCheckout(tier) {
  const response = await fetch(`${CET_BACKEND_URL}/create-subscription-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Failed to start checkout");
  }
  return response.json();
}

export { createCetSubscriptionCheckout };
