import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRegistrations, createRegistration } from "../../../api/registrations.js";
import { getTeam } from "../../../api/teams.js";
import { getProducts } from "../../../api/products.js";
import { getLessonSlots } from "../../../api/lessonSlots.js";
import {
  createCheckoutSession,
  createSetupSession,
  getBalance,
  getPaymentHistory,
} from "../../../api/payments.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { CURRENT_SEASON } from "../../../constants/season.js";
import WaiverSignature from "../WaiverSignature/WaiverSignature.jsx";

const TABS = ["Registration", "Store", "History"];

function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PaymentsPanel({ currentUser, token }) {
  const children = currentUser?.childrenData || [];
  const [selectedPlayerId, setSelectedPlayerId] = useState(children[0]?._id || "");
  const [activeTab, setActiveTab] = useState("Registration");
  const [selectedLessonSlotByProduct, setSelectedLessonSlotByProduct] = useState({});
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const selectedPlayer = children.find((child) => child._id === selectedPlayerId);

  const { data: registrations = [] } = useQuery({
    queryKey: queryKeys.registrations(selectedPlayerId),
    queryFn: () => getRegistrations({ playerId: selectedPlayerId }, token),
    enabled: Boolean(selectedPlayerId && token),
  });

  const isRegisteredForCurrentSeason = registrations.some(
    (registration) => registration.season === CURRENT_SEASON
  );

  const { data: selectedPlayerTeam } = useQuery({
    queryKey: queryKeys.team(selectedPlayer?.teamId),
    queryFn: () => getTeam(selectedPlayer.teamId),
    enabled: Boolean(selectedPlayer?.teamId && !isRegisteredForCurrentSeason),
  });

  const createRegistrationMutation = useMutation({
    mutationFn: (payload) => createRegistration(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations(selectedPlayerId) });
      pushToast({ type: "success", message: "Registered! You can now pay the registration fee below." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to register." });
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: queryKeys.balance(selectedPlayerId),
    queryFn: () => getBalance(selectedPlayerId, token),
    enabled: Boolean(selectedPlayerId && token),
  });

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => getProducts(undefined, token),
    enabled: Boolean(token),
  });

  const { data: history = [] } = useQuery({
    queryKey: queryKeys.paymentHistory(currentUser?._id),
    queryFn: () => getPaymentHistory(undefined, token),
    enabled: Boolean(token),
  });

  const hasLessonProducts = products.some((product) => product.type === "lesson");
  const { data: availableLessonSlots = [] } = useQuery({
    queryKey: queryKeys.lessonSlots({ availableOnly: true }),
    queryFn: () => getLessonSlots({ availableOnly: true }, token),
    enabled: Boolean(token && hasLessonProducts),
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload) => createCheckoutSession(payload, token),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to start checkout." });
    },
  });

  const setupMutation = useMutation({
    mutationFn: (registrationId) => createSetupSession({ registrationId }, token),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to start autopay setup." });
    },
  });

  const balanceFor = (registrationId) =>
    balances.find((b) => b.registrationId === registrationId);

  if (children.length === 0) {
    return <p className="portal__empty">No players linked to your account yet.</p>;
  }

  return (
    <div>
      {children.length > 1 && (
        <>
          <label className="portal__label" htmlFor="payments-player">
            Player
          </label>
          <select
            id="payments-player"
            className="portal__select"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="portal__tabs" style={{ marginTop: 16 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`portal__tab${activeTab === tab ? " portal__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Registration" && (
        <div>
          {selectedPlayer && (
            <WaiverSignature playerId={selectedPlayer._id} token={token} />
          )}

          <h3 className="portal__section-title">Registrations</h3>
          {!isRegisteredForCurrentSeason && selectedPlayerTeam && (
            <div className="portal__card">
              <strong>Register {selectedPlayer?.name} for {CURRENT_SEASON}</strong>
              <p className="portal__card-meta">
                Registration fee: {centsToDollars(selectedPlayerTeam.registrationFeeCents)}
              </p>
              <button
                type="button"
                className="portal__button"
                disabled={createRegistrationMutation.isPending}
                onClick={() =>
                  createRegistrationMutation.mutate({
                    playerId: selectedPlayerId,
                    season: CURRENT_SEASON,
                  })
                }
              >
                {createRegistrationMutation.isPending ? "Registering..." : "Register"}
              </button>
            </div>
          )}
          {registrations.length === 0 && !selectedPlayerTeam && (
            <p className="portal__empty">No registrations yet.</p>
          )}
          {registrations.map((registration) => {
            const balance = balanceFor(registration._id);
            const registrationFeeBalanceCents = balance?.balanceCents ?? registration.registrationFeeCents;
            const registrationFeePaid = registrationFeeBalanceCents <= 0;
            const autopayComplete =
              registration.autopayInstallmentsCompleted >= registration.autopayTotalInstallments;

            return (
              <div key={registration._id} className="portal__card">
                <div className="portal__card-header">
                  <span className="portal__badge">{registration.status}</span>
                  <strong>{registration.season}</strong>
                </div>
                <p className="portal__card-meta">
                  Registration fee: {centsToDollars(registration.registrationFeeCents)}
                  {" · "}
                  Balance: {centsToDollars(registrationFeeBalanceCents)}
                </p>

                {!registrationFeePaid && (
                  <button
                    type="button"
                    className="portal__button"
                    style={{ marginRight: 8 }}
                    disabled={checkoutMutation.isPending}
                    onClick={() =>
                      checkoutMutation.mutate({
                        type: "registration",
                        registrationId: registration._id,
                      })
                    }
                  >
                    Pay Registration Fee
                  </button>
                )}

                {registration.depositAmountCents > 0 && !registration.depositPaidAt && (
                  <button
                    type="button"
                    className="portal__button"
                    style={{ marginRight: 8 }}
                    disabled={checkoutMutation.isPending}
                    onClick={() =>
                      checkoutMutation.mutate({ type: "deposit", registrationId: registration._id })
                    }
                  >
                    Pay Deposit ({centsToDollars(registration.depositAmountCents)})
                  </button>
                )}

                {registrationFeePaid && registration.autopayAmountCents > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Monthly Payment Plan: </strong>
                    {autopayComplete ? (
                      "Season fully paid ✓"
                    ) : registration.autopayEnabled ? (
                      <>
                        {centsToDollars(registration.autopayAmountCents)}/month — {registration.autopayInstallmentsCompleted} of{" "}
                        {registration.autopayTotalInstallments} payments made
                      </>
                    ) : (
                      <>
                        {centsToDollars(registration.autopayAmountCents)}/month for{" "}
                        {registration.autopayTotalInstallments} months
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className="portal__button"
                            disabled={setupMutation.isPending}
                            onClick={() => setupMutation.mutate(registration._id)}
                          >
                            {setupMutation.isPending ? "Starting..." : "Set Up Monthly Payments"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "Store" && (
        <div>
          {products.length === 0 && <p className="portal__empty">No items available yet.</p>}
          {products.map((product) => {
            const isLesson = product.type === "lesson";
            const selectedSlotId = selectedLessonSlotByProduct[product._id] || "";

            return (
              <div key={product._id} className="portal__card portal__card--row">
                <div>
                  <span className="portal__badge">{product.type}</span>{" "}
                  <strong>{product.name}</strong>
                  <p className="portal__card-meta">{centsToDollars(product.priceCents)}</p>

                  {isLesson && (
                    <select
                      className="portal__select"
                      style={{ marginTop: 8 }}
                      value={selectedSlotId}
                      onChange={(e) =>
                        setSelectedLessonSlotByProduct((prev) => ({
                          ...prev,
                          [product._id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select a lesson time…</option>
                      {availableLessonSlots.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                          {new Date(slot.startsAt).toLocaleString()} ({slot.bookedCount}/{slot.capacity})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  type="button"
                  className="portal__button"
                  disabled={checkoutMutation.isPending || (isLesson && !selectedSlotId)}
                  onClick={() =>
                    checkoutMutation.mutate({
                      type: product.type,
                      productId: product._id,
                      ...(isLesson ? { lessonSlotId: selectedSlotId } : {}),
                    })
                  }
                >
                  Buy
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "History" && (
        <div>
          {history.length === 0 && <p className="portal__empty">No payments yet.</p>}
          {history.map((payment) => (
            <div key={payment._id} className="portal__card portal__card--row">
              <div>
                <span className="portal__badge">{payment.status}</span>{" "}
                <span>{payment.description || payment.type}</span>
                <p className="portal__card-meta">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <strong>{centsToDollars(payment.amountCents)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentsPanel;
