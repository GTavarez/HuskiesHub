import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoachPayments,
  createCoachPayment,
  updateCoachPaymentStatus,
} from "../../../api/coachPayments.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function centsToDollars(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

function CoachPaymentsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [coachUserId, setCoachUserId] = useState("");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [amountCents, setAmountCents] = useState("");

  const { data: payments = [] } = useQuery({
    queryKey: queryKeys.coachPayments(undefined),
    queryFn: () => getCoachPayments(undefined, token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createCoachPayment(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coachPayments(undefined) });
      setCoachUserId("");
      setPayPeriodStart("");
      setPayPeriodEnd("");
      setAmountCents("");
      pushToast({ type: "success", message: "Payment record added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add payment record." });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateCoachPaymentStatus(id, status, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coachPayments(undefined) });
      pushToast({ type: "success", message: "Payment status updated." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update payment." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coachUserId || !payPeriodStart || !payPeriodEnd || !amountCents) {
      pushToast({
        type: "error",
        message: "Coach user id, pay period, and amount are required.",
      });
      return;
    }
    createMutation.mutate({
      coachUserId,
      payPeriodStart,
      payPeriodEnd,
      amountCents: Math.round(Number(amountCents) * 100),
    });
  };

  return (
    <div>
      <p className="portal__subtitle" style={{ marginBottom: 12 }}>
        Track-only payroll ledger — no money moves through this. Use it to record
        what each coach is owed and mark it paid once handled outside the app.
      </p>

      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="coach-payment-user">
          Coach User ID
        </label>
        <input
          id="coach-payment-user"
          className="portal__input"
          value={coachUserId}
          onChange={(e) => setCoachUserId(e.target.value)}
          placeholder="Coach's account id"
        />

        <div className="portal__row" style={{ gap: 8 }}>
          <input
            className="portal__input"
            type="date"
            value={payPeriodStart}
            onChange={(e) => setPayPeriodStart(e.target.value)}
          />
          <input
            className="portal__input"
            type="date"
            value={payPeriodEnd}
            onChange={(e) => setPayPeriodEnd(e.target.value)}
          />
        </div>

        <label className="portal__label" htmlFor="coach-payment-amount">
          Amount ($)
        </label>
        <input
          id="coach-payment-amount"
          className="portal__input"
          type="number"
          min="0"
          step="0.01"
          value={amountCents}
          onChange={(e) => setAmountCents(e.target.value)}
        />

        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Add Payment Record"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        {payments.length === 0 && <p className="portal__empty">No coach payments recorded yet.</p>}
        {payments.map((payment) => (
          <div key={payment._id} className="portal__card portal__card--row">
            <span>
              {new Date(payment.payPeriodStart).toLocaleDateString()} –{" "}
              {new Date(payment.payPeriodEnd).toLocaleDateString()} ·{" "}
              {centsToDollars(payment.amountCents)}
            </span>
            <div className="portal__row" style={{ gap: 8 }}>
              <span className="portal__badge">{payment.status}</span>
              {payment.status === "unpaid" && (
                <button
                  type="button"
                  className="portal__link-button"
                  disabled={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({ id: payment._id, status: "paid" })
                  }
                >
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CoachPaymentsPanel;
