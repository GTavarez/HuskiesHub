import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAssessmentRegistration } from "../../../api/cetAssessment.js";
import { createCetSubscriptionCheckout } from "../../../api/cetCheckout.js";
import { useToast } from "../../../context/ToastContext.js";
import "./AssessmentRegistration.css";

// Per the funnel doc: confirm the assessment registration first, then lead
// hard with the Academy founding-membership offer (the actual business
// priority), and only then mention the remote options as a lighter-touch
// secondary path — not four equal choices at once.
function AssessmentConfirmation() {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const { pushToast } = useToast();

  const { data: registration, isLoading } = useQuery({
    queryKey: ["cetAssessmentRegistration", registrationId],
    queryFn: () => getAssessmentRegistration(registrationId),
    enabled: Boolean(registrationId),
  });

  const subscribeMutation = useMutation({
    mutationFn: createCetSubscriptionCheckout,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to start checkout." });
    },
  });

  return (
    <section className="assessment-confirmation">
      <div className="assessment-confirmation__hero">
        <h1 className="assessment-confirmation__title">You're Registered!</h1>

        {isLoading && <p className="assessment-confirmation__meta">Loading your registration...</p>}

        {registration && (
          <p className="assessment-confirmation__meta">
            {registration.eventName} ·{" "}
            {new Date(registration.eventDate).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {registration.eventLocation ? ` · ${registration.eventLocation}` : ""}
          </p>
        )}

        {paymentCancelled && (
          <p className="assessment-confirmation__cancelled">
            Your payment was cancelled, but your registration is still on file — reach out if
            you'd like to complete payment another way.
          </p>
        )}

        {registration?.paymentStatus === "pay_later" && (
          <p className="assessment-confirmation__meta">
            You chose to pay later/cash — see you at check-in!
          </p>
        )}
      </div>

      <div className="assessment-confirmation__upsell">
        <p className="assessment-confirmation__eyebrow">
          Want to do more than just measure performance?
        </p>
        <p className="assessment-confirmation__lead">
          The assessment tells us where your athlete is today. The CET Academy is where we start
          improving those numbers.
        </p>

        <div className="assessment-confirmation__academy-card">
          <h2 className="assessment-confirmation__academy-title">FOUNDING CET ACADEMY MEMBERSHIP</h2>
          <p className="assessment-confirmation__academy-sub">
            Year-round development built around the softball calendar.
          </p>
          <ul className="assessment-confirmation__academy-list">
            <li>Small-group Performance Academy training</li>
            <li>Year-round phased programming</li>
            <li>Performance assessments</li>
            <li>Programming that evolves with playing volume and season</li>
            <li>Access to the broader CET development system</li>
          </ul>
          <p className="assessment-confirmation__academy-rate-label">Founding Member Rate</p>
          <p className="assessment-confirmation__academy-rate">$119/mo</p>
          <button
            type="button"
            className="assessment-confirmation__academy-cta"
            disabled={subscribeMutation.isPending}
            onClick={() => subscribeMutation.mutate("academy")}
          >
            {subscribeMutation.isPending ? "Starting checkout..." : "JOIN THE CET ACADEMY →"}
          </button>
          <p className="assessment-confirmation__urgency">
            Founding membership is limited to the first 12 athletes. Founding enrollment closes
            September 9 or when all 12 spots are claimed.
          </p>
        </div>
      </div>

      <div className="assessment-confirmation__remote">
        <p className="assessment-confirmation__remote-lead">
          Can't commit to the in-person Academy? CET Remote Training options are also available.
        </p>
        <div className="assessment-confirmation__remote-options">
          <div className="assessment-confirmation__remote-option">
            <h3>CET Remote Membership</h3>
            <p>Four weeks of programming delivered at a time through a monthly subscription.</p>
            <button
              type="button"
              className="assessment-confirmation__remote-btn"
              disabled={subscribeMutation.isPending}
              onClick={() => subscribeMutation.mutate("year_round_remote")}
            >
              EXPLORE REMOTE TRAINING
            </button>
          </div>
          <div className="assessment-confirmation__remote-option">
            <h3>Individualized Remote + Hybrid Training</h3>
            <p>
              Programming built specifically around the athlete, with greater coaching support
              and optional in-person integration.
            </p>
            <button
              type="button"
              className="assessment-confirmation__remote-btn"
              disabled={subscribeMutation.isPending}
              onClick={() => subscribeMutation.mutate("individualized_remote")}
            >
              ASK ABOUT INDIVIDUALIZED TRAINING
            </button>
          </div>
        </div>
      </div>

      <div className="assessment-confirmation__footer">
        <Link to="/competitive-edge-training" className="assessment-confirmation__back-link">
          ← Back to Competitive Edge Training
        </Link>
      </div>
    </section>
  );
}

export default AssessmentConfirmation;
