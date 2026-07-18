import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEvents } from "../../../api/events.js";
import { getTeamPlayers } from "../../../api/teams.js";
import { getAttendance, recordAttendance } from "../../../api/attendance.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const STATUSES = ["present", "absent", "late", "excused"];

function AttendanceRecorder({ teamId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [selectedEventId, setSelectedEventId] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: queryKeys.events(teamId),
    queryFn: () => getEvents(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: queryKeys.attendance(selectedEventId, undefined),
    queryFn: () => getAttendance({ eventId: selectedEventId }, token),
    enabled: Boolean(selectedEventId && token),
  });

  const recordMutation = useMutation({
    mutationFn: ({ playerId, status }) =>
      recordAttendance({ eventId: selectedEventId, playerId, status }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance(selectedEventId, undefined),
      });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to save attendance.",
      });
    },
  });

  const statusForPlayer = (playerId) =>
    attendanceRecords.find((record) => record.playerId === playerId)?.status || "";

  return (
    <div>
      <label className="portal__label" htmlFor="attendance-event">
        Event
      </label>
      <select
        id="attendance-event"
        className="portal__select"
        value={selectedEventId}
        onChange={(e) => setSelectedEventId(e.target.value)}
      >
        <option value="">Select an event…</option>
        {events.map((event) => (
          <option key={event._id} value={event._id}>
            {event.title} — {new Date(event.startsAt).toLocaleDateString()}
          </option>
        ))}
      </select>

      {selectedEventId && (
        <div style={{ marginTop: 20 }}>
          {players.length === 0 && (
            <p className="portal__empty">No players on this roster yet.</p>
          )}
          {players.map((player) => (
            <div key={player._id} className="portal__player-row">
              <span>
                #{player.jersey} {player.name}
              </span>
              <select
                className="portal__select"
                value={statusForPlayer(player._id)}
                onChange={(e) =>
                  recordMutation.mutate({
                    playerId: player._id,
                    status: e.target.value,
                  })
                }
              >
                <option value="">Mark…</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AttendanceRecorder;
