import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams, getTeamPlayers, updateTeam } from "../../../api/teams.js";
import { getRegistrations, createRegistration } from "../../../api/registrations.js";
import {
  getBalance,
  getPaymentHistory,
  refundPayment,
  recordOfflinePayment,
  runAutopay,
  sendReminders,
  exportQuickbooksCsvBlobUrl,
  getFallWinterPaymentLink,
} from "../../../api/payments.js";
import { exportContactsCsvBlobUrl } from "../../../api/players.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { CURRENT_SEASON } from "../../../constants/season.js";

function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Admin-only lookup of the standalone Fall/Winter Stripe Payment Link —
// deliberately not shown anywhere on the public site (owner asked it not be
// posted publicly), but admins need a reliable place to find the current
// link instead of relying on chat history/copy-pasted URLs going stale.
function FallWinterLinkCard({ token }) {
  const { pushToast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["fallWinterPaymentLink"],
    queryFn: () => getFallWinterPaymentLink(token),
    enabled: Boolean(token),
  });

  const handleCopy = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast({ type: "error", message: "Couldn't copy — copy the link manually." });
    }
  };

  return (
    <div className="portal__form" style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Fall/Winter Only Registration Link ($2,500)</h3>
      <p style={{ color: "#9fbad1", fontSize: 14, marginTop: -4 }}>
        Not posted publicly — share this directly with families registering for Fall/Winter
        only. It doesn't expire and payments made through it auto-match to the family's
        account when possible.
      </p>
      {isLoading ? (
        <p className="portal__empty">Loading…</p>
      ) : data?.url ? (
        <div className="portal__row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input
            className="portal__input"
            readOnly
            value={data.url}
            onFocus={(e) => e.target.select()}
            style={{ flex: 1, minWidth: 240 }}
          />
          <button type="button" className="portal__button" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      ) : (
        <p className="portal__empty">No link configured yet.</p>
      )}
    </div>
  );
}

function RegistrationRow({ registration, token }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: balances = [] } = useQuery({
    queryKey: queryKeys.balance(registration.playerId),
    queryFn: () => getBalance(registration.playerId, token),
    enabled: Boolean(token),
  });
  const balance = balances.find((b) => b.registrationId === registration._id);

  const billingUserId = registration.billingUserId || registration.createdBy;
  const { data: payments = [] } = useQuery({
    queryKey: queryKeys.paymentHistory(billingUserId),
    queryFn: () => getPaymentHistory(billingUserId, token),
    enabled: Boolean(expanded && token && billingUserId),
  });

  // Dollars typed next to each payment's Refund button. Blank means refund
  // whatever is left of that payment.
  const [refundAmounts, setRefundAmounts] = useState({});
  const [offlineAmount, setOfflineAmount] = useState("");
  const [offlineNote, setOfflineNote] = useState("");

  const offlineMutation = useMutation({
    mutationFn: (payload) => recordOfflinePayment(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentHistory(billingUserId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance(registration.playerId) });
      setOfflineAmount("");
      setOfflineNote("");
      pushToast({ type: "success", message: "Payment recorded." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't record that payment." });
    },
  });

  const startOfflinePayment = () => {
    const amountCents = Math.round(Number(offlineAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      pushToast({ type: "error", message: "Enter the amount that was paid." });
      return;
    }
    if (!offlineNote.trim()) {
      pushToast({ type: "error", message: "Add a short note, such as where it was paid." });
      return;
    }
    const ok = window.confirm(
      `Record ${centsToDollars(amountCents)} as already paid for ${registration.playerName}? No card is charged. This can't be undone from here.`
    );
    if (!ok) return;
    offlineMutation.mutate({
      registrationId: registration._id,
      amountCents,
      note: offlineNote.trim(),
    });
  };

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, amountCents }) => refundPayment(paymentId, amountCents, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentHistory(billingUserId) });
      setRefundAmounts({});
      pushToast({ type: "success", message: "Refund initiated." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to initiate refund." });
    },
  });

  const startRefund = (payment) => {
    const remainingCents = payment.amountCents - (payment.refundedAmountCents || 0);
    const typed = String(refundAmounts[payment._id] ?? "").trim();
    const amountCents = typed === "" ? remainingCents : Math.round(Number(typed) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > remainingCents) {
      pushToast({
        type: "error",
        message: `Enter an amount between $0.01 and ${centsToDollars(remainingCents)}.`,
      });
      return;
    }
    const ok = window.confirm(
      `Refund ${centsToDollars(amountCents)} of this ${centsToDollars(payment.amountCents)} payment to the card it was paid with? This can't be undone.`
    );
    if (!ok) return;
    refundMutation.mutate({
      paymentId: payment._id,
      amountCents: amountCents === remainingCents ? undefined : amountCents,
    });
  };

  return (
    <div className="portal__card">
      <div className="portal__card-header">
        <span className="portal__badge">{registration.status}</span>
        <strong>{registration.playerName || "Unknown player"}</strong> — {registration.season}
      </div>
      <p className="portal__card-meta">
        Fee: {centsToDollars(registration.registrationFeeCents)} · Balance:{" "}
        {centsToDollars(balance?.balanceCents ?? registration.registrationFeeCents)} · Autopay:{" "}
        {registration.autopayEnabled ? "on" : "off"} · Uniform:{" "}
        {registration.uniformOptIn ? "included" : "opted out"}
      </p>
      <button
        type="button"
        className="portal__link-button"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Hide payments" : "View payments"}
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {payments.length === 0 && <p className="portal__empty">No payments yet.</p>}
          {registration.status !== "withdrawn" && (
            <div
              className="portal__row"
              style={{ padding: "8px 0", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            >
              <strong style={{ fontSize: 14 }}>Record a payment made outside the site</strong>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="$ amount"
                aria-label="Amount paid outside the site, in dollars"
                className="portal__input"
                style={{ width: 120 }}
                value={offlineAmount}
                onChange={(e) => setOfflineAmount(e.target.value)}
              />
              <input
                type="text"
                maxLength={200}
                placeholder="Note, e.g. paid on the old system"
                aria-label="Note for the payment"
                className="portal__input"
                style={{ flex: 1, minWidth: 200 }}
                value={offlineNote}
                onChange={(e) => setOfflineNote(e.target.value)}
              />
              <button
                type="button"
                className="portal__link-button"
                disabled={offlineMutation.isPending}
                onClick={startOfflinePayment}
              >
                Record payment
              </button>
            </div>
          )}
          {payments.map((payment) => (
            <div key={payment._id} className="portal__row" style={{ padding: "6px 0" }}>
              <span>
                {payment.description || payment.type} — {centsToDollars(payment.amountCents)} (
                {payment.method === "offline" ? "recorded by hand, " : ""}
                {payment.status}
                {payment.refundedAmountCents
                  ? `, ${centsToDollars(payment.refundedAmountCents)} refunded`
                  : ""}
                )
              </span>
              {payment.status === "succeeded" && (
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="$ amount"
                    title="Leave blank to refund whatever is left of this payment"
                    aria-label="Refund amount in dollars"
                    className="portal__input"
                    style={{ width: 150 }}
                    value={refundAmounts[payment._id] ?? ""}
                    onChange={(e) =>
                      setRefundAmounts((prev) => ({ ...prev, [payment._id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="portal__link-button"
                    disabled={refundMutation.isPending}
                    onClick={() => startRefund(payment)}
                  >
                    Refund
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamPricingEditor({ team, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [name, setName] = useState(team.name || "");
  const [ageGroup, setAgeGroup] = useState(team.ageGroup || "");
  const [fee, setFee] = useState(String(team.registrationFeeCents / 100));
  const [deposit, setDeposit] = useState(String(team.depositAmountCents / 100));
  const [autopayAmount, setAutopayAmount] = useState(String(team.autopayAmountCents / 100));
  const [autopayDay, setAutopayDay] = useState(String(team.autopayDayOfMonth));
  const [uniformFee, setUniformFee] = useState(String((team.uniformFeeCents ?? 55000) / 100));

  useEffect(() => {
    setName(team.name || "");
    setAgeGroup(team.ageGroup || "");
    setFee(String(team.registrationFeeCents / 100));
    setDeposit(String(team.depositAmountCents / 100));
    setAutopayAmount(String(team.autopayAmountCents / 100));
    setAutopayDay(String(team.autopayDayOfMonth));
    setUniformFee(String((team.uniformFeeCents ?? 55000) / 100));
  }, [team]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTeam(team._id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
      pushToast({ type: "success", message: "Team details saved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to save team details." });
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      pushToast({ type: "error", message: "Team name is required." });
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      ageGroup: ageGroup.trim(),
      registrationFeeCents: Math.round(Number(fee) * 100),
      depositAmountCents: Math.round(Number(deposit) * 100),
      autopayAmountCents: Math.round(Number(autopayAmount) * 100),
      autopayDayOfMonth: Number(autopayDay),
      uniformFeeCents: Math.round(Number(uniformFee) * 100),
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSave} style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Team Details — {team.name}</h3>

      <label className="portal__label" htmlFor="team-name">
        Team Name
      </label>
      <input
        id="team-name"
        className="portal__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="portal__label" htmlFor="team-age-group">
        Age Group
      </label>
      <input
        id="team-age-group"
        className="portal__input"
        value={ageGroup}
        onChange={(e) => setAgeGroup(e.target.value)}
        placeholder="e.g. 14U"
      />

      <label className="portal__label" htmlFor="team-fee">
        Registration Fee ($)
      </label>
      <input
        id="team-fee"
        className="portal__input"
        type="number"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
      />

      <label className="portal__label" htmlFor="team-deposit">
        Deposit ($)
      </label>
      <input
        id="team-deposit"
        className="portal__input"
        type="number"
        value={deposit}
        onChange={(e) => setDeposit(e.target.value)}
      />

      <label className="portal__label" htmlFor="team-autopay-amount">
        Autopay Amount ($/month)
      </label>
      <input
        id="team-autopay-amount"
        className="portal__input"
        type="number"
        value={autopayAmount}
        onChange={(e) => setAutopayAmount(e.target.value)}
      />

      <label className="portal__label" htmlFor="team-autopay-day">
        Autopay Day of Month
      </label>
      <input
        id="team-autopay-day"
        className="portal__input"
        type="number"
        min="1"
        max="28"
        value={autopayDay}
        onChange={(e) => setAutopayDay(e.target.value)}
      />

      <label className="portal__label" htmlFor="team-uniform-fee">
        Uniform Package ($) — included by default, discounted off the monthly balance if a
        family opts out at registration
      </label>
      <input
        id="team-uniform-fee"
        className="portal__input"
        type="number"
        value={uniformFee}
        onChange={(e) => setUniformFee(e.target.value)}
      />

      <button type="submit" className="portal__button" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Saving..." : "Save Team Details"}
      </button>
    </form>
  );
}

function CreateRegistrationForm({ team, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [playerId, setPlayerId] = useState("");
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [fee, setFee] = useState(String(team.registrationFeeCents / 100));
  const [deposit, setDeposit] = useState(String(team.depositAmountCents / 100));
  const [customAutopayAmount, setCustomAutopayAmount] = useState("");
  const [customInstallments, setCustomInstallments] = useState("");

  useEffect(() => {
    setPlayerId("");
    setSeason(CURRENT_SEASON);
    setFee(String(team.registrationFeeCents / 100));
    setDeposit(String(team.depositAmountCents / 100));
    setCustomAutopayAmount("");
    setCustomInstallments("");
  }, [team]);

  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(team._id),
    queryFn: () => getTeamPlayers(team._id),
    enabled: Boolean(team._id),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createRegistration(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations(undefined) });
      setPlayerId("");
      pushToast({ type: "success", message: "Registration created." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to create registration." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerId || !season.trim()) {
      pushToast({ type: "error", message: "Player and season are required." });
      return;
    }
    createMutation.mutate({
      playerId,
      season: season.trim(),
      registrationFeeCents: Math.round(Number(fee) * 100),
      depositAmountCents: Math.round(Number(deposit) * 100),
      ...(customAutopayAmount !== ""
        ? { autopayAmountCents: Math.round(Number(customAutopayAmount) * 100) }
        : {}),
      ...(customInstallments !== ""
        ? { autopayTotalInstallments: Number(customInstallments) }
        : {}),
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Create Registration</h3>

      <label className="portal__label" htmlFor="new-reg-player">
        Player
      </label>
      <select
        id="new-reg-player"
        className="portal__select"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      >
        <option value="">Select a player…</option>
        {players.map((player) => (
          <option key={player._id} value={player._id}>
            {player.name}
            {player.jersey ? ` (#${player.jersey})` : ""}
          </option>
        ))}
      </select>

      <label className="portal__label" htmlFor="new-reg-season">
        Season
      </label>
      <input
        id="new-reg-season"
        className="portal__input"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
      />

      <label className="portal__label" htmlFor="new-reg-fee">
        Registration Fee ($)
      </label>
      <input
        id="new-reg-fee"
        className="portal__input"
        type="number"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
      />

      <label className="portal__label" htmlFor="new-reg-deposit">
        Deposit ($)
      </label>
      <input
        id="new-reg-deposit"
        className="portal__input"
        type="number"
        value={deposit}
        onChange={(e) => setDeposit(e.target.value)}
      />

      <label className="portal__label" htmlFor="new-reg-custom-autopay">
        Custom Monthly Autopay ($) — leave blank to use team default
      </label>
      <input
        id="new-reg-custom-autopay"
        className="portal__input"
        type="number"
        placeholder={String(team.autopayAmountCents / 100)}
        value={customAutopayAmount}
        onChange={(e) => setCustomAutopayAmount(e.target.value)}
      />

      <label className="portal__label" htmlFor="new-reg-custom-installments">
        Custom Number of Installments — leave blank to use team default
      </label>
      <input
        id="new-reg-custom-installments"
        className="portal__input"
        type="number"
        min="1"
        placeholder={String(team.autopayTotalInstallments)}
        value={customInstallments}
        onChange={(e) => setCustomInstallments(e.target.value)}
      />

      <button type="submit" className="portal__button" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Registration"}
      </button>
    </form>
  );
}

function RegistrationsPanel({ token }) {
  const { pushToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [uniformFilter, setUniformFilter] = useState("all");
  const [autopayFilter, setAutopayFilter] = useState("all");

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });
  const selectedTeam = teams.find((team) => team._id === teamId);

  const { data: registrations = [] } = useQuery({
    queryKey: queryKeys.registrations(undefined),
    queryFn: () => getRegistrations({ teamId }, token),
    enabled: Boolean(teamId && token),
  });

  const optedOutCount = registrations.filter((r) => !r.uniformOptIn).length;
  // A family counts as "not on monthly payments" if the registration is still
  // active, has installments left, and no saved card is set up for autopay.
  const notOnAutopay = (r) =>
    r.status !== "withdrawn" &&
    !r.autopayEnabled &&
    (r.autopayInstallmentsCompleted || 0) < (r.autopayTotalInstallments || 0);
  const notOnAutopayCount = registrations.filter(notOnAutopay).length;
  const visibleRegistrations = registrations.filter((registration) => {
    if (uniformFilter === "included" && !registration.uniformOptIn) return false;
    if (uniformFilter === "opted_out" && registration.uniformOptIn) return false;
    if (autopayFilter === "not_on" && !notOnAutopay(registration)) return false;
    if (autopayFilter === "on" && !registration.autopayEnabled) return false;
    return true;
  });

  const runAutopayMutation = useMutation({
    mutationFn: () => runAutopay(token),
    onSuccess: (result) => {
      pushToast({
        type: "success",
        message: `Autopay run complete — billed ${result.billed.length}, skipped ${result.skipped.length}, failed ${result.failed.length}.`,
      });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Autopay run failed." });
    },
  });

  const sendRemindersMutation = useMutation({
    mutationFn: () => sendReminders(token),
    onSuccess: (result) => {
      pushToast({ type: "success", message: `Sent ${result.remindersSent} reminder emails.` });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to send reminders." });
    },
  });

  const handleExportCsv = async () => {
    if (!from || !to) {
      pushToast({ type: "error", message: "Pick a from/to date range first." });
      return;
    }
    try {
      const url = await exportQuickbooksCsvBlobUrl({ from, to }, token);
      const link = document.createElement("a");
      link.href = url;
      link.download = `huskieshub-payments-${from}-${to}.csv`;
      link.click();
    } catch (error) {
      pushToast({ type: "error", message: error?.message || "Failed to export CSV." });
    }
  };

  const handleExportContactsCsv = async () => {
    try {
      const url = await exportContactsCsvBlobUrl(token);
      const link = document.createElement("a");
      link.href = url;
      link.download = "huskieshub-player-contacts.csv";
      link.click();
    } catch (error) {
      pushToast({ type: "error", message: error?.message || "Failed to export contacts." });
    }
  };

  return (
    <div>
      <FallWinterLinkCard token={token} />

      <div className="portal__row" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          className="portal__button"
          disabled={runAutopayMutation.isPending}
          onClick={() => runAutopayMutation.mutate()}
        >
          {runAutopayMutation.isPending ? "Running..." : "Run Autopay Now"}
        </button>
        <button
          type="button"
          className="portal__button"
          disabled={sendRemindersMutation.isPending}
          onClick={() => sendRemindersMutation.mutate()}
        >
          {sendRemindersMutation.isPending ? "Sending..." : "Send Reminders"}
        </button>
      </div>

      <div className="portal__row" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <input
          className="portal__input"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="portal__input"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button type="button" className="portal__button" onClick={handleExportCsv}>
          Export QuickBooks CSV
        </button>
        <button type="button" className="portal__button" onClick={handleExportContactsCsv}>
          Export Player Contacts CSV
        </button>
      </div>

      <label className="portal__label" htmlFor="registrations-team">
        Team
      </label>
      <select
        id="registrations-team"
        className="portal__select"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      >
        <option value="">Select a team…</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>
            {team.name}
          </option>
        ))}
      </select>

      {selectedTeam && (
        <div style={{ marginTop: 16 }}>
          <TeamPricingEditor team={selectedTeam} token={token} />
          <CreateRegistrationForm team={selectedTeam} token={token} />
        </div>
      )}

      {teamId && registrations.length > 0 && (
        <div className="portal__row" style={{ marginTop: 16, gap: 8, alignItems: "center" }}>
          <label className="portal__label" htmlFor="uniform-filter" style={{ margin: 0 }}>
            Uniform
          </label>
          <select
            id="uniform-filter"
            className="portal__select"
            value={uniformFilter}
            onChange={(e) => setUniformFilter(e.target.value)}
          >
            <option value="all">All ({registrations.length})</option>
            <option value="included">Included ({registrations.length - optedOutCount})</option>
            <option value="opted_out">Opted out ({optedOutCount})</option>
          </select>
          <span style={{ color: "#9fbad1", fontSize: 14 }}>
            {optedOutCount} of {registrations.length} opted out of the uniform package
          </span>
        </div>
      )}

      {teamId && registrations.length > 0 && (
        <div className="portal__row" style={{ marginTop: 8, gap: 8, alignItems: "center" }}>
          <label className="portal__label" htmlFor="autopay-filter" style={{ margin: 0 }}>
            Monthly payments
          </label>
          <select
            id="autopay-filter"
            className="portal__select"
            value={autopayFilter}
            onChange={(e) => setAutopayFilter(e.target.value)}
          >
            <option value="all">All ({registrations.length})</option>
            <option value="not_on">Not set up ({notOnAutopayCount})</option>
            <option value="on">Set up ({registrations.filter((r) => r.autopayEnabled).length})</option>
          </select>
          <span style={{ color: "#9fbad1", fontSize: 14 }}>
            {notOnAutopayCount} of {registrations.length} have not set up monthly payments
          </span>
        </div>
      )}

      {teamId && optedOutCount > 0 && (
        <p style={{ marginTop: 8, color: "#f2b8b5", fontSize: 14 }}>
          Opted out:{" "}
          {registrations
            .filter((r) => !r.uniformOptIn)
            .map((r) => r.playerName || "Unknown player")
            .join(", ")}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        {teamId && registrations.length === 0 && (
          <p className="portal__empty">No registrations for this team yet.</p>
        )}
        {teamId && registrations.length > 0 && visibleRegistrations.length === 0 && (
          <p className="portal__empty">No registrations match this filter.</p>
        )}
        {visibleRegistrations.map((registration) => (
          <RegistrationRow key={registration._id} registration={registration} token={token} />
        ))}
      </div>
    </div>
  );
}

export default RegistrationsPanel;
