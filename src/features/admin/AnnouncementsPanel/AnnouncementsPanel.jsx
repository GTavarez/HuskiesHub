import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import {
  getAnnouncements,
  createAnnouncement,
} from "../../../api/announcements.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function AnnouncementsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: queryKeys.announcements(undefined),
    queryFn: () => getAnnouncements(undefined, token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createAnnouncement(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements(undefined) });
      setTitle("");
      setBody("");
      pushToast({ type: "success", message: "Announcement posted." });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to post announcement.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      pushToast({ type: "error", message: "Title and body are required." });
      return;
    }
    createMutation.mutate({ teamId: teamId || null, title: title.trim(), body: body.trim() });
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="announcement-team">
          Audience
        </label>
        <select
          id="announcement-team"
          className="portal__select"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">Organization-wide</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>

        <label className="portal__label" htmlFor="announcement-title">
          Title
        </label>
        <input
          id="announcement-title"
          className="portal__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Tournament schedule update"
        />

        <label className="portal__label" htmlFor="announcement-body">
          Message
        </label>
        <textarea
          id="announcement-body"
          className="portal__textarea"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <button
          type="submit"
          className="portal__button"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Posting..." : "Post Announcement"}
        </button>
      </form>

      {announcements.length === 0 && (
        <p className="portal__empty">No announcements yet.</p>
      )}
      {announcements.map((announcement) => (
        <div key={announcement._id} className="portal__card">
          <strong>{announcement.title}</strong>
          <p className="portal__card-body">{announcement.body}</p>
        </div>
      ))}
    </div>
  );
}

export default AnnouncementsPanel;
