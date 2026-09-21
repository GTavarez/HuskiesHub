import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getMyConnectStatus,
  startStripeOnboarding,
  getCoachPayments,
} from "../../../api/coachPayments.js";
import { useToast } from "../../../context/ToastContext.js";

const METHOD_LABELS = {
  stripe: "Stripe",
  zelle: "Zelle",
  venmo: "Venmo",
  cash_app: "Cash App",
  check: "Check",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  other: "Other",
};

function centsToDollars(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { timeZone: "UTC" });
}

const STATUS_TEXT = {
  not_started: "You haven't set up payouts yet.",
  incomplete: "Your Stripe setup isn't finished yet. Pick up where you left off.",
  ready: "You're all set. The club can pay you through Stripe.",
};

// A coach connects their own bank account on Stripe's hosted page. Their ID and
// bank details go straight to Stripe and never pass through HuskiesHub.
function CoachPayouts({ token }) {
  const { pushToast } = useToast();

  const { data: connect, isLoading } = useQuery({
    queryKey: ["myConnectStatus"],
    queryFn: () => getMyConnectStatus(token),
    enabled: Boolean(token),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["coachPayments", "mine"],
    queryFn: () => getCoachPayments(undefined, token),
    enabled: Boolean(token),
  });

  const onboardMutation = useMutation({
    mutationFn: () => startStripeOnboarding(token),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't start Stripe setup." });
    },
  });

  const status = connect?.status || "not_started";

  return (
    <div>
      <div className="portal__card" style={{ marginBottom: 16 }}>
        <strong>Get paid by direct deposit</strong>
        <p className="portal__card-meta">
          {isLoading ? "Checking your setup..." : STATUS_TEXT[status]}
        </p>
        {status !== "ready" && (
          <>
            <p className="portal__card-meta">
              You'll go to Stripe, our payment provider, to confirm your identity and add the bank
              account you want to be paid into. It takes a few minutes. Your ID and bank details go
              to Stripe, not to the club's website.
            </p>
            <button
              type="button"
              className="portal__button"
              disabled={onboardMutation.isPending || isLoading}
              onClick={() => onboardMutation.mutate()}
            >
              {onboardMutation.isPending
                ? "Opening Stripe..."
                : status === "incomplete"
                  ? "Finish setting up payouts"
                  : "Set up payouts"}
            </button>
          </>
        )}
      </div>

      <h3 className="portal__section-title">My pay</h3>
      {payments.length === 0 && <p className="portal__empty">No pay records yet.</p>}
      {payments.map((payment) => (
        <div key={payment._id} className="portal__card portal__card--row">
          <div>
            <strong>{centsToDollars(payment.amountCents)}</strong>
            <p className="portal__card-meta">
              {formatDate(payment.payPeriodStart)} – {formatDate(payment.payPeriodEnd)}
              {payment.note ? ` · ${payment.note}` : ""}
            </p>
            {payment.status === "paid" && (
              <p className="portal__card-meta">
                Paid {new Date(payment.paidAt).toLocaleDateString()}
                {payment.method ? ` via ${METHOD_LABELS[payment.method] || payment.method}` : ""}
              </p>
            )}
          </div>
          <span className="portal__badge">{payment.status}</span>
        </div>
      ))}
    </div>
  );
}

export default CoachPayouts;
