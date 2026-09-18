import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLessonRequests,
  confirmLessonRequest,
  declineLessonRequest,
  updateLessonRequestPaymentStatus,
  createLessonRequestSlot,
  deleteLessonRequestSlot,
} from "../../../api/lessonRequests.js";
import { LESSON_PACKAGE_OPTIONS } from "../../../constants/lessonPackages.js";
import { useToast } from "../../../context/ToastContext.js";

const VIEWS = [
  { key: "requested", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "open", label: "Open Slots" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu"];
const PAYMENT_STATUSES = ["not_invoiced", "invoiced", "paid"];

function packageLabel(packageType) {
  return LESSON_PACKAGE_OPTIONS.find((opt) => opt.value === packageType)?.label || packageType;
}

const NEW_SLOT_DEFAULTS = {
  dayOfWeek: "Mon",
  location: "Advanced Player Academy Waldwick, NJ",
  startTime: "",
  endTime: "",
  timeLabel: "",
};

function NewSlotForm({ token, onCreated }) {
  const { pushToast } = useToast();
  const [form, setForm] = useState(NEW_SLOT_DEFAULTS);

  const createMutation = useMutation({
    mutationFn: (payload) => createLessonRequestSlot(payload, token),
    onSuccess: () => {
      setForm(NEW_SLOT_DEFAULTS);
      onCreated();
      pushToast({ type: "success", message: "Slot added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add slot." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.startTime || !form.endTime || !form.timeLabel.trim()) {
      pushToast({ type: "error", message: "Start time, end time, and a display label are required." });
      return;
    }
    createMutation.mutate({ ...form, timeLabel: form.timeLabel.trim(), location: form.location.trim() });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Define a Weekly Slot</h3>

      <label className="portal__label" htmlFor="lr-day">Day</label>
      <select
        id="lr-day"
        className="portal__select"
        value={form.dayOfWeek}
        onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
      >
        {DAYS.map((day) => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>

      <label className="portal__label" htmlFor="lr-location">Location</label>
      <input
        id="lr-location"
        className="portal__input"
        value={form.location}
        onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
      />

      <label className="portal__label" htmlFor="lr-start">Start Time (24h, e.g. 16:00)</label>
      <input
        id="lr-start"
        className="portal__input"
        placeholder="16:00"
        value={form.startTime}
        onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
      />

      <label className="portal__label" htmlFor="lr-end">End Time (24h, e.g. 16:30)</label>
      <input
        id="lr-end"
        className="portal__input"
        placeholder="16:30"
        value={form.endTime}
        onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
      />

      <label className="portal__label" htmlFor="lr-label">Display Label</label>
      <input
        id="lr-label"
        className="portal__input"
        placeholder="4:00-4:30pm"
        value={form.timeLabel}
        onChange={(e) => setForm((prev) => ({ ...prev, timeLabel: e.target.value }))}
      />

      <button type="submit" className="portal__button" disabled={createMutation.isPending} style={{ marginTop: 12 }}>
        {createMutation.isPending ? "Adding..." : "Add Slot"}
      </button>
    </form>
  );
}

function LessonRequestsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [view, setView] = useState("requested");

  const { data: slots = [] } = useQuery({
    queryKey: ["lessonRequests", view],
    queryFn: () => getLessonRequests(view, token),
    enabled: Boolean(token),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["lessonRequests", view] });

  const confirmMutation = useMutation({
    mutationFn: (id) => confirmLessonRequest(id, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Request confirmed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to confirm." });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id) => declineLessonRequest(id, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Request declined and slot reopened." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to decline." });
    },
  });

  const paymentStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }) => updateLessonRequestPaymentStatus(id, paymentStatus, token),
    onSuccess: () => invalidate(),
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update payment status." });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id) => deleteLessonRequestSlot(id, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Slot removed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to remove slot." });
    },
  });

  return (
    <div>
      <NewSlotForm token={token} onCreated={invalidate} />

      <div className="portal__tabs" style={{ marginBottom: 16 }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`portal__tab${view === v.key ? " portal__tab--active" : ""}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {slots.length === 0 && <p className="portal__empty">Nothing here.</p>}

      {slots.map((slot) => (
        <div key={slot._id} className="portal__card">
          <div className="portal__card-header">
            <span className="portal__badge">{slot.status}</span>
            <strong>{slot.dayOfWeek} {slot.timeLabel} — {slot.location}</strong>
          </div>

          {slot.status !== "open" && (
            <p className="portal__card-meta">
              {slot.athleteName} · Parent: {slot.parentName} ({slot.parentEmail}, {slot.parentPhone}) ·{" "}
              {packageLabel(slot.packageType)}
            </p>
          )}

          {view === "requested" && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="portal__button"
                style={{ marginRight: 8 }}
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(slot._id)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="portal__link-button"
                disabled={declineMutation.isPending}
                onClick={() => declineMutation.mutate(slot._id)}
              >
                Decline
              </button>
            </div>
          )}

          {view === "confirmed" && (
            <div style={{ marginTop: 8 }}>
              <label className="portal__label" htmlFor={`pay-${slot._id}`}>Payment Status</label>
              <select
                id={`pay-${slot._id}`}
                className="portal__select"
                value={slot.paymentStatus}
                onChange={(e) =>
                  paymentStatusMutation.mutate({ id: slot._id, paymentStatus: e.target.value })
                }
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          {view === "open" && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="portal__link-button"
                disabled={deleteSlotMutation.isPending}
                onClick={() => deleteSlotMutation.mutate(slot._id)}
              >
                Remove Slot
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default LessonRequestsPanel;
