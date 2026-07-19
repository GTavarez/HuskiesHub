import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams, getTeamPlayers, updateTeam } from "../../../api/teams.js";
import { getRegistrations, createRegistration } from "../../../api/registrations.js";
import {
  getBalance,
  getPaymentHistory,
  refundPayment,
  runAutopay,
  sendReminders,
  exportQuickbooksCsvBlobUrl,
} from "../../../api/payments.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { CURRENT_SEASON } from "../../../constants/season.js";

function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
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

  const refundMutation = useMutation({
    mutationFn: (paymentId) => refundPayment(paymentId, undefined, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentHistory(billingUserId) });
      pushToast({ type: "success", message: "Refund initiated." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to initiate refund." });
    },
  });

  return (
    <div className="portal__card">
      <div className="portal__card-header">
        <span className="portal__badge">{registration.status}</span>
        <strong>{registration.season}</strong>
      </div>
      <p className="portal__card-meta">
        Fee: {centsToDollars(registration.registrationFeeCents)} · Balance:{" "}
        {centsToDollars(balance?.balanceCents ?? registration.registrationFeeCents)} · Autopay:{" "}
        {registration.autopayEnabled ? "on" : "off"}
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
          {payments.map((payment) => (
            <div key={payment._id} className="portal__row" style={{ padding: "6px 0" }}>
              <span>
                {payment.description || payment.type} — {centsToDollars(payment.amountCents)} (
                {payment.status})
              </span>
              {payment.status === "succeeded" && (
                <button
                  type="button"
                  className="portal__link-button"
                  disabled={refundMutation.isPending}
                  onClick={() => refundMutation.mutate(payment._id)}
                >
                  Refund
                </button>
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
  const [fee, setFee] = useState(String(team.registrationFeeCents / 100));
  const [deposit, setDeposit] = useState(String(team.depositAmountCents / 100));
  const [autopayAmount, setAutopayAmount] = useState(String(team.autopayAmountCents / 100));
  const [autopayDay, setAutopayDay] = useState(String(team.autopayDayOfMonth));

  useEffect(() => {
    setFee(String(team.registrationFeeCents / 100));
    setDeposit(String(team.depositAmountCents / 100));
    setAutopayAmount(String(team.autopayAmountCents / 100));
    setAutopayDay(String(team.autopayDayOfMonth));
  }, [team]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTeam(team._id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
      pushToast({ type: "success", message: "Team pricing saved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to save pricing." });
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      registrationFeeCents: Math.round(Number(fee) * 100),
      depositAmountCents: Math.round(Number(deposit) * 100),
      autopayAmountCents: Math.round(Number(autopayAmount) * 100),
      autopayDayOfMonth: Number(autopayDay),
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSave} style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Team Pricing — {team.name}</h3>

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

      <button type="submit" className="portal__button" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Saving..." : "Save Pricing"}
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

  useEffect(() => {
    setPlayerId("");
    setSeason(CURRENT_SEASON);
    setFee(String(team.registrationFeeCents / 100));
    setDeposit(String(team.depositAmountCents / 100));
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

  return (
    <div>
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

      <div style={{ marginTop: 16 }}>
        {teamId && registrations.length === 0 && (
          <p className="portal__empty">No registrations for this team yet.</p>
        )}
        {registrations.map((registration) => (
          <RegistrationRow key={registration._id} registration={registration} token={token} />
        ))}
      </div>
    </div>
  );
}

export default RegistrationsPanel;
