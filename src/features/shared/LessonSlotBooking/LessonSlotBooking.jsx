import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./LessonSlotBooking.css";
import {
  getOpenLessonRequestSlots,
  getLessonRequestSchedule,
  submitLessonRequest,
} from "../../../api/lessonRequests.js";
import { LESSON_PACKAGE_OPTIONS } from "../../../constants/lessonPackages.js";
import { useToast } from "../../../context/ToastContext.js";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu"];

const FORM_DEFAULTS = {
  slotId: "",
  athleteName: "",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  packageType: "",
};

// Shared between the Competitive Edge Training landing page and the Huskies
// Schedule page — same underlying private-lesson slots either way (CET is
// just the public-facing brand for reaching families outside the Huskies
// org), so this lives in one place instead of two copies drifting apart.
function LessonSlotBooking({ title = "Book a Private Lesson" }) {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(FORM_DEFAULTS);
  const [submitted, setSubmitted] = useState(false);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["lessonRequestOpenSlots"],
    queryFn: getOpenLessonRequestSlots,
  });

  // Every defined slot (open and booked), no family info — powers the
  // visual weekly grid. Separate from `slots` above, which only has open
  // slots but includes the _id the request form actually needs.
  const { data: schedule = [] } = useQuery({
    queryKey: ["lessonRequestSchedule"],
    queryFn: getLessonRequestSchedule,
  });

  const scheduleDays = DAYS_ORDER.filter((day) => schedule.some((s) => s.dayOfWeek === day));
  const scheduleTimes = [...new Set(schedule.map((s) => s.startTime))].sort();
  const scheduleCellMap = new Map(schedule.map((s) => [`${s.dayOfWeek}|${s.startTime}`, s]));

  const submitMutation = useMutation({
    mutationFn: submitLessonRequest,
    onSuccess: () => {
      setForm(FORM_DEFAULTS);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["lessonRequestOpenSlots"] });
      queryClient.invalidateQueries({ queryKey: ["lessonRequestSchedule"] });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to submit request." });
      queryClient.invalidateQueries({ queryKey: ["lessonRequestOpenSlots"] });
    },
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !form.slotId ||
      !form.athleteName.trim() ||
      !form.parentName.trim() ||
      !form.parentEmail.trim() ||
      !form.parentPhone.trim() ||
      !form.packageType
    ) {
      pushToast({ type: "error", message: "Please fill out every field." });
      return;
    }
    submitMutation.mutate({
      slotId: form.slotId,
      athleteName: form.athleteName.trim(),
      parentName: form.parentName.trim(),
      parentEmail: form.parentEmail.trim(),
      parentPhone: form.parentPhone.trim(),
      packageType: form.packageType,
    });
  };

  return (
    <div className="lesson-slot-booking">
      <div className="lesson-slot-booking__inner">
        <div className="lesson-slot-booking__intro">
          <h2 className="lesson-slot-booking__title">{title}</h2>
          <p className="lesson-slot-booking__subtitle">
            Browse currently open weekly slots below and submit a request. We'll follow up to
            confirm your slot. It isn't booked until then.
          </p>

          <div className="lesson-slot-booking__slots">
            {isLoading && <p className="lesson-slot-booking__empty">Loading open slots…</p>}
            {!isLoading && schedule.length === 0 && (
              <p className="lesson-slot-booking__empty">
                No slots defined yet. Check back soon or contact us directly.
              </p>
            )}
            {schedule.length > 0 && (
              <table className="lesson-slot-booking__schedule-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {scheduleDays.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleTimes.map((time) => {
                    const rowLabel = scheduleDays
                      .map((day) => scheduleCellMap.get(`${day}|${time}`))
                      .find(Boolean)?.timeLabel;
                    return (
                      <tr key={time}>
                        <td className="lesson-slot-booking__schedule-time">{rowLabel}</td>
                        {scheduleDays.map((day) => {
                          const cell = scheduleCellMap.get(`${day}|${time}`);
                          return (
                            <td
                              key={day}
                              className={
                                !cell
                                  ? "lesson-slot-booking__schedule-cell lesson-slot-booking__schedule-cell--na"
                                  : cell.status === "open"
                                  ? "lesson-slot-booking__schedule-cell lesson-slot-booking__schedule-cell--open"
                                  : "lesson-slot-booking__schedule-cell lesson-slot-booking__schedule-cell--booked"
                              }
                            >
                              {!cell ? "-" : cell.status === "open" ? "Open" : "Booked"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {schedule.length > 0 && (
              <p className="lesson-slot-booking__schedule-note">
                All sessions at Advanced Player Academy Waldwick, NJ. Use the form to request an
                open slot.
              </p>
            )}
          </div>
        </div>

        <form className="lesson-slot-booking__form" onSubmit={handleSubmit}>
          <h2 className="lesson-slot-booking__form-title">Request a Slot</h2>

          <label className="lesson-slot-booking__label" htmlFor="lsb-slot">
            Open Slot
          </label>
          <select
            id="lsb-slot"
            className="lesson-slot-booking__input"
            value={form.slotId}
            onChange={handleChange("slotId")}
          >
            <option value="">Select an open slot…</option>
            {slots.map((slot) => (
              <option key={slot._id} value={slot._id}>
                {slot.dayOfWeek} {slot.timeLabel} at {slot.location}
              </option>
            ))}
          </select>

          <label className="lesson-slot-booking__label" htmlFor="lsb-athlete">
            Athlete Name
          </label>
          <input
            id="lsb-athlete"
            className="lesson-slot-booking__input"
            value={form.athleteName}
            onChange={handleChange("athleteName")}
          />

          <label className="lesson-slot-booking__label" htmlFor="lsb-parent">
            Parent Name
          </label>
          <input
            id="lsb-parent"
            className="lesson-slot-booking__input"
            value={form.parentName}
            onChange={handleChange("parentName")}
          />

          <label className="lesson-slot-booking__label" htmlFor="lsb-email">
            Email
          </label>
          <input
            id="lsb-email"
            type="email"
            className="lesson-slot-booking__input"
            value={form.parentEmail}
            onChange={handleChange("parentEmail")}
          />

          <label className="lesson-slot-booking__label" htmlFor="lsb-phone">
            Phone
          </label>
          <input
            id="lsb-phone"
            type="tel"
            className="lesson-slot-booking__input"
            value={form.parentPhone}
            onChange={handleChange("parentPhone")}
          />

          <label className="lesson-slot-booking__label" htmlFor="lsb-package">
            Package
          </label>
          <select
            id="lsb-package"
            className="lesson-slot-booking__input"
            value={form.packageType}
            onChange={handleChange("packageType")}
          >
            <option value="">Select a package…</option>
            {LESSON_PACKAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="lesson-slot-booking__submit"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Request This Slot"}
          </button>

          {submitted && (
            <p className="lesson-slot-booking__confirmation">
              Thanks! We'll be in touch to confirm your slot.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LessonSlotBooking;
