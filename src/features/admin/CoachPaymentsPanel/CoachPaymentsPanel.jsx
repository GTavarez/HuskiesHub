import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoachPayments,
  getCoachPayees,
  createCoachPayment,
  updateCoachPaymentStatus,
  deleteCoachPayment,
} from "../../../api/coachPayments.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const METHODS = [
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "cash_app", label: "Cash App" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
];
const METHOD_LABELS = Object.fromEntries(METHODS.map((m) => [m.value, m.label]));

function centsToDollars(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

// Pay periods are calendar dates; reading them in UTC keeps a period that was
// saved as "May 1" from showing as "Apr 30" in a timezone behind UTC.
function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { timeZone: "UTC" });
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(rows) {
  const header = ["Coach", "Email", "Period start", "Period end", "Amount", "Note", "Status", "Paid on", "Method", "Reference"];
  const lines = rows.map((p) => [
    p.coachName,
    p.coachEmail,
    formatDate(p.payPeriodStart),
    formatDate(p.payPeriodEnd),
    (p.amountCents / 100).toFixed(2),
    p.note,
    p.status,
    p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "",
    METHOD_LABELS[p.method] || "",
    p.reference,
  ]);
  const csv = [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `coach-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Inline "how did you pay them" step, so a paid record says how and when.
function MarkPaidForm({ payment, pending, onConfirm, onCancel }) {
  const [method, setMethod] = useState("zelle");
  const [reference, setReference] = useState("");
  return (
    <div className="portal__form" style={{ marginTop: 8 }}>
      <p className="portal__card-meta">
        Confirm you already paid {payment.coachName} {centsToDollars(payment.amountCents)}. This
        only records it; the money is sent outside the app.
      </p>
      <select
        className="portal__select"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        aria-label="Payment method"
      >
        {METHODS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <input
        className="portal__input"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Confirmation or check number (optional)"
      />
      <div className="portal__row" style={{ gap: 12 }}>
        <button
          type="button"
          className="portal__button"
          disabled={pending}
          onClick={() => onConfirm({ method, reference })}
        >
          {pending ? "Saving..." : "Yes, it's paid"}
        </button>
        <button type="button" className="portal__link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CoachPaymentsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [coachUserId, setCoachUserId] = useState("");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("unpaid");
  const [payingId, setPayingId] = useState(null);

  const { data: payments = [] } = useQuery({
    queryKey: queryKeys.coachPayments(undefined),
    queryFn: () => getCoachPayments(undefined, token),
    enabled: Boolean(token),
  });

  const { data: payees = [] } = useQuery({
    queryKey: ["coachPayees"],
    queryFn: () => getCoachPayees(token),
    enabled: Boolean(token),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.coachPayments(undefined) });

  const createMutation = useMutation({
    mutationFn: (payload) => createCoachPayment(payload, token),
    onSuccess: () => {
      refresh();
      // The pay period stays filled in so several coaches can be added for
      // the same period back to back.
      setCoachUserId("");
      setAmount("");
      setNote("");
      pushToast({ type: "success", message: "Payment record added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add payment record." });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ...body }) => updateCoachPaymentStatus(id, body, token),
    onSuccess: (_data, variables) => {
      refresh();
      setPayingId(null);
      pushToast({
        type: "success",
        message: variables.status === "paid" ? "Marked as paid." : "Marked as unpaid.",
      });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update payment." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCoachPayment(id, token),
    onSuccess: () => {
      refresh();
      pushToast({ type: "success", message: "Record deleted." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to delete record." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!coachUserId || !payPeriodStart || !payPeriodEnd) {
      pushToast({ type: "error", message: "Pick a coach and a pay period." });
      return;
    }
    if (!Number.isFinite(cents) || cents <= 0) {
      pushToast({ type: "error", message: "Enter an amount greater than zero." });
      return;
    }
    createMutation.mutate({
      coachUserId,
      payPeriodStart,
      payPeriodEnd,
      amountCents: cents,
      note: note.trim(),
    });
  };

  const owedByCoach = useMemo(() => {
    const totals = new Map();
    payments
      .filter((p) => p.status === "unpaid")
      .forEach((p) => {
        const entry = totals.get(p.coachUserId) || { name: p.coachName, cents: 0 };
        entry.cents += p.amountCents;
        totals.set(p.coachUserId, entry);
      });
    return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [payments]);
  const totalOwed = owedByCoach.reduce((sum, c) => sum + c.cents, 0);

  const visible = payments.filter((p) => filter === "all" || p.status === filter);

  return (
    <div>
      <p className="portal__subtitle" style={{ marginBottom: 12 }}>
        Record what each coach is owed, pay them by Zelle, Venmo, check or bank transfer, then mark
        it paid here. No money moves through this screen.
      </p>

      <div className="portal__card" style={{ marginBottom: 16 }}>
        <strong>Owed to coaches: {centsToDollars(totalOwed)}</strong>
        {owedByCoach.length === 0 ? (
          <p className="portal__card-meta">Nothing is waiting to be paid.</p>
        ) : (
          owedByCoach.map((c) => (
            <p key={c.name} className="portal__card-meta">
              {c.name}: {centsToDollars(c.cents)}
            </p>
          ))
        )}
      </div>

      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="coach-payment-user">
          Coach
        </label>
        <select
          id="coach-payment-user"
          className="portal__select"
          value={coachUserId}
          onChange={(e) => setCoachUserId(e.target.value)}
        >
          <option value="">Select a coach…</option>
          {payees.map((coach) => (
            <option key={coach._id} value={coach._id}>
              {coach.name}
            </option>
          ))}
        </select>
        <label className="portal__label" htmlFor="coach-payment-start">
          Pay period
        </label>
        <div className="portal__row" style={{ gap: 8 }}>
          <input
            id="coach-payment-start"
            className="portal__input"
            type="date"
            value={payPeriodStart}
            onChange={(e) => setPayPeriodStart(e.target.value)}
            aria-label="Pay period start"
          />
          <input
            className="portal__input"
            type="date"
            value={payPeriodEnd}
            onChange={(e) => setPayPeriodEnd(e.target.value)}
            aria-label="Pay period end"
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="portal__input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional), e.g. 12 practices + 2 tournaments"
          maxLength={500}
        />
        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Add Payment Record"}
        </button>
      </form>

      <div className="portal__row" style={{ gap: 16, marginTop: 20, alignItems: "center", justifyContent: "flex-start" }}>
        {[
          ["unpaid", "Unpaid"],
          ["paid", "Paid"],
          ["all", "All"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "portal__button" : "portal__link-button"}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="portal__link-button"
          disabled={visible.length === 0}
          onClick={() => downloadCsv(visible)}
        >
          Download CSV
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {visible.length === 0 && <p className="portal__empty">No {filter === "all" ? "" : filter + " "}coach payments.</p>}
        {visible.map((payment) => (
          <div key={payment._id} className="portal__card">
            <div className="portal__card--row">
              <div>
                <strong>{payment.coachName}</strong> · {centsToDollars(payment.amountCents)}
                <p className="portal__card-meta">
                  {formatDate(payment.payPeriodStart)} – {formatDate(payment.payPeriodEnd)}
                  {payment.note ? ` · ${payment.note}` : ""}
                </p>
                {payment.status === "paid" && (
                  <p className="portal__card-meta">
                    Paid {new Date(payment.paidAt).toLocaleDateString()}
                    {payment.method ? ` via ${METHOD_LABELS[payment.method] || payment.method}` : ""}
                    {payment.reference ? ` (${payment.reference})` : ""}
                  </p>
                )}
              </div>
              <div className="portal__row" style={{ gap: 8 }}>
                <span className="portal__badge">{payment.status}</span>
                {payment.status === "unpaid" ? (
                  <>
                    <button
                      type="button"
                      className="portal__link-button"
                      onClick={() => setPayingId(payingId === payment._id ? null : payment._id)}
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      className="portal__link-button"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete ${payment.coachName}'s ${centsToDollars(payment.amountCents)} record?`)) {
                          deleteMutation.mutate(payment._id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="portal__link-button"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Mark this as unpaid again? Use this only if it was marked paid by mistake.")) {
                        statusMutation.mutate({ id: payment._id, status: "unpaid" });
                      }
                    }}
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
            {payingId === payment._id && (
              <MarkPaidForm
                payment={payment}
                pending={statusMutation.isPending}
                onCancel={() => setPayingId(null)}
                onConfirm={({ method, reference }) =>
                  statusMutation.mutate({ id: payment._id, status: "paid", method, reference })
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CoachPaymentsPanel;
