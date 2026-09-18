import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import "./LessonRequestAction.css";
import {
  getLessonRequestActionSummary,
  applyLessonRequestAction,
} from "../../../api/lessonRequests.js";
import { LESSON_PACKAGE_OPTIONS } from "../../../constants/lessonPackages.js";

function packageLabel(packageType) {
  return LESSON_PACKAGE_OPTIONS.find((opt) => opt.value === packageType)?.label || packageType;
}

// Landing page for the one-click Confirm/Decline links emailed on a new
// request. Deliberately NOT a bare GET-mutates link — this page only reads
// the summary on load (safe against email link-prescanners); the actual
// state change only fires when a human taps Confirm or Decline.
function LessonRequestAction() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [result, setResult] = useState(null);

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["lessonRequestActionSummary", token],
    queryFn: () => getLessonRequestActionSummary(token),
    enabled: Boolean(token),
    retry: false,
  });

  const actionMutation = useMutation({
    mutationFn: (action) => applyLessonRequestAction(token, action),
    onSuccess: (data) => setResult(data.status),
    onError: (error) => setResult(`error:${error?.message || "Something went wrong."}`),
  });

  if (!token) {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <h2>Missing link</h2>
          <p>This page needs a valid link from your email notification.</p>
        </div>
      </section>
    );
  }

  if (result === "confirmed") {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <h2>Confirmed ✓</h2>
          <p>The slot is locked in and the family has been notified.</p>
        </div>
      </section>
    );
  }

  if (result === "declined") {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <h2>Declined</h2>
          <p>The slot has been reopened and the family has been notified.</p>
        </div>
      </section>
    );
  }

  if (typeof result === "string" && result.startsWith("error:")) {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <h2>Couldn't complete that</h2>
          <p>{result.slice("error:".length)}</p>
          <p>Check the Admin Dashboard → Lesson Requests tab instead.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <p>Loading…</p>
        </div>
      </section>
    );
  }

  if (isError || !summary) {
    return (
      <section className="lesson-action">
        <div className="lesson-action__card">
          <h2>This link is invalid or has already been used</h2>
          <p>Check the Admin Dashboard → Lesson Requests tab instead.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-action">
      <div className="lesson-action__card">
        <h2>Confirm this booking?</h2>
        <p className="lesson-action__summary">
          <strong>{summary.athleteName}</strong> — {summary.dayOfWeek} {summary.timeLabel} —{" "}
          {summary.location}
        </p>
        <p className="lesson-action__summary">
          {packageLabel(summary.packageType)} · Parent: {summary.parentName} (
          {summary.parentEmail}, {summary.parentPhone})
        </p>

        <div className="lesson-action__buttons">
          <button
            type="button"
            className="lesson-action__confirm-btn"
            disabled={actionMutation.isPending}
            onClick={() => actionMutation.mutate("confirm")}
          >
            Confirm
          </button>
          <button
            type="button"
            className="lesson-action__decline-btn"
            disabled={actionMutation.isPending}
            onClick={() => actionMutation.mutate("decline")}
          >
            Decline
          </button>
        </div>
      </div>
    </section>
  );
}

export default LessonRequestAction;
