import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getCurrentAssessmentEvent,
  registerForAssessment,
  createAssessmentCheckout,
} from "../../../api/cetAssessment.js";
import { useToast } from "../../../context/ToastContext.js";
import "./AssessmentRegistration.css";

const EMPTY_FORM = {
  parentFirstName: "",
  parentLastName: "",
  parentEmail: "",
  parentPhone: "",
  athleteFirstName: "",
  athleteLastName: "",
  athleteAge: "",
  athleteGrade: "",
  currentTeamOrg: "",
  primaryPosition: "",
  isPitcher: false,
  waiverAgreed: false,
  marketingConsent: true,
};

// Shared by both registration paths — the doc's own point 3 is that the two
// forms "can look nearly identical." `variant` controls the only real
// differences: copy, whether a payment choice appears, and whether the
// team/org field is a free-text prompt or framed as "your Huskies team."
function AssessmentRegistrationForm({ variant }) {
  const isHuskies = variant === "huskies";
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [payOnline, setPayOnline] = useState(true);

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ["cetAssessmentEvent"],
    queryFn: getCurrentAssessmentEvent,
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => registerForAssessment(payload),
    onSuccess: async (data) => {
      if (data.needsPayment) {
        try {
          const { url } = await createAssessmentCheckout(data.registration._id);
          window.location.href = url;
        } catch (error) {
          pushToast({ type: "error", message: error?.message || "Failed to start checkout." });
        }
        return;
      }
      navigate(
        `/competitive-edge-training/performance-assessment/confirmation?registrationId=${data.registration._id}`
      );
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Registration failed." });
    },
  });

  const handleChange = (field) => (e) => {
    const { value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [field]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.waiverAgreed) {
      pushToast({ type: "error", message: "You must agree to the waiver to register." });
      return;
    }
    registerMutation.mutate({
      registrationType: variant,
      payOnline: isHuskies ? false : payOnline,
      ...form,
      athleteAge: form.athleteAge ? Number(form.athleteAge) : undefined,
    });
  };

  return (
    <section className="assessment-form">
      <div className="assessment-form__inner">
        <h1 className="assessment-form__title">
          {isHuskies ? "Empire State Huskies Player Registration" : "Performance Assessment Registration"}
        </h1>

        {isEventLoading && <p className="assessment-form__meta">Loading event details...</p>}
        {event && (
          <p className="assessment-form__meta">
            {event.name} — {new Date(event.date).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        )}

        {isHuskies ? (
          <p className="assessment-form__subtitle">
            Performance Assessment Included — No Registration Fee
          </p>
        ) : (
          <p className="assessment-form__subtitle">
            Registration fee: ${event ? (event.publicFeeCents / 100).toFixed(0) : "20"}. Pay online
            or choose pay-later/cash below.
          </p>
        )}

        <form className="assessment-form__form" onSubmit={handleSubmit}>
          <div className="assessment-form__row">
            <label className="assessment-form__label">
              Parent First Name
              <input
                className="assessment-form__input"
                value={form.parentFirstName}
                onChange={handleChange("parentFirstName")}
                required
              />
            </label>
            <label className="assessment-form__label">
              Parent Last Name
              <input
                className="assessment-form__input"
                value={form.parentLastName}
                onChange={handleChange("parentLastName")}
                required
              />
            </label>
          </div>

          <div className="assessment-form__row">
            <label className="assessment-form__label">
              Parent Email
              <input
                className="assessment-form__input"
                type="email"
                value={form.parentEmail}
                onChange={handleChange("parentEmail")}
                required
              />
            </label>
            <label className="assessment-form__label">
              Parent Phone
              <input
                className="assessment-form__input"
                type="tel"
                value={form.parentPhone}
                onChange={handleChange("parentPhone")}
              />
            </label>
          </div>

          <div className="assessment-form__row">
            <label className="assessment-form__label">
              Athlete First Name
              <input
                className="assessment-form__input"
                value={form.athleteFirstName}
                onChange={handleChange("athleteFirstName")}
                required
              />
            </label>
            <label className="assessment-form__label">
              Athlete Last Name
              <input
                className="assessment-form__input"
                value={form.athleteLastName}
                onChange={handleChange("athleteLastName")}
                required
              />
            </label>
          </div>

          <div className="assessment-form__row">
            <label className="assessment-form__label">
              Athlete Age
              <input
                className="assessment-form__input"
                type="number"
                min="1"
                value={form.athleteAge}
                onChange={handleChange("athleteAge")}
              />
            </label>
            <label className="assessment-form__label">
              Athlete Grade
              <input
                className="assessment-form__input"
                value={form.athleteGrade}
                onChange={handleChange("athleteGrade")}
              />
            </label>
          </div>

          <label className="assessment-form__label">
            {isHuskies ? "Huskies Team" : "Current Team/Organization"}
            <input
              className="assessment-form__input"
              value={form.currentTeamOrg}
              onChange={handleChange("currentTeamOrg")}
            />
          </label>

          <div className="assessment-form__row">
            <label className="assessment-form__label">
              Primary Position
              <input
                className="assessment-form__input"
                value={form.primaryPosition}
                onChange={handleChange("primaryPosition")}
              />
            </label>
            <label className="assessment-form__checkbox-row">
              <input
                type="checkbox"
                checked={form.isPitcher}
                onChange={handleChange("isPitcher")}
              />
              Pitcher?
            </label>
          </div>

          {!isHuskies && (
            <div className="assessment-form__payment-choice">
              <p className="assessment-form__label" style={{ marginBottom: 8 }}>
                How would you like to pay the $
                {event ? (event.publicFeeCents / 100).toFixed(0) : "20"} registration fee?
              </p>
              <label className="assessment-form__radio-row">
                <input
                  type="radio"
                  name="payment-choice"
                  checked={payOnline}
                  onChange={() => setPayOnline(true)}
                />
                Pay Online — $
                {event ? (event.publicFeeCents / 100).toFixed(0) : "20"} now
              </label>
              <label className="assessment-form__radio-row">
                <input
                  type="radio"
                  name="payment-choice"
                  checked={!payOnline}
                  onChange={() => setPayOnline(false)}
                />
                Pay Later / Cash
              </label>
            </div>
          )}

          <label className="assessment-form__checkbox-row">
            <input
              type="checkbox"
              checked={form.waiverAgreed}
              onChange={handleChange("waiverAgreed")}
              required
            />
            I agree to the liability waiver.
          </label>

          <label className="assessment-form__checkbox-row">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={handleChange("marketingConsent")}
            />
            Keep me updated by email about CET training and events.
          </label>

          <button
            type="submit"
            className="assessment-form__submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Submitting..." : "Register"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AssessmentRegistrationForm;
