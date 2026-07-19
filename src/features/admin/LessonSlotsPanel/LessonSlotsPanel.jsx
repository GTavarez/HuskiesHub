import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLessonSlots,
  createLessonSlot,
  deleteLessonSlot,
} from "../../../api/lessonSlots.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function LessonSlotsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [instructorUserId, setInstructorUserId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("1");

  const { data: slots = [] } = useQuery({
    queryKey: queryKeys.lessonSlots({}),
    queryFn: () => getLessonSlots({}, token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createLessonSlot(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonSlots({}) });
      setInstructorUserId("");
      setStartsAt("");
      setEndsAt("");
      setCapacity("1");
      pushToast({ type: "success", message: "Lesson slot added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add lesson slot." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteLessonSlot(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonSlots({}) });
      pushToast({ type: "success", message: "Lesson slot removed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to remove lesson slot." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!instructorUserId || !startsAt || !endsAt || !capacity) {
      pushToast({
        type: "error",
        message: "Instructor, start time, end time, and capacity are required.",
      });
      return;
    }
    createMutation.mutate({
      instructorUserId,
      startsAt,
      endsAt,
      capacity: Number(capacity),
    });
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="lesson-slot-instructor">
          Instructor User ID
        </label>
        <input
          id="lesson-slot-instructor"
          className="portal__input"
          value={instructorUserId}
          onChange={(e) => setInstructorUserId(e.target.value)}
          placeholder="Coach's account id"
        />

        <div className="portal__row" style={{ gap: 8 }}>
          <input
            className="portal__input"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <input
            className="portal__input"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <label className="portal__label" htmlFor="lesson-slot-capacity">
          Capacity
        </label>
        <input
          id="lesson-slot-capacity"
          className="portal__input"
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />

        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Add Lesson Slot"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        {slots.length === 0 && <p className="portal__empty">No lesson slots yet.</p>}
        {slots.map((slot) => (
          <div key={slot._id} className="portal__card portal__card--row">
            <span>
              {new Date(slot.startsAt).toLocaleString()} – {new Date(slot.endsAt).toLocaleTimeString()} ·{" "}
              {slot.bookedCount}/{slot.capacity} booked
            </span>
            <button
              type="button"
              className="portal__link-button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(slot._id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LessonSlotsPanel;
