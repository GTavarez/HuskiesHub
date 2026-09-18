import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../../../api/announcements.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { resolveMediaUrl } from "../../../utils/media.js";

// Shared by the admin dashboard (full org-wide/per-team picker, and the only
// place an image can be attached) and the Coach Portal (pass lockedTeamId so
// a coach can only ever post to — or remove — their own team's
// announcements, matching the same team-scoping already enforced
// server-side; coaches stay text-only, matching the backend's admin-only
// image restriction).
function AnnouncementsPanel({ token, lockedTeamId, lockedTeamName }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const canAttachImage = !lockedTeamId;

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: !lockedTeamId,
  });

  const listTeamId = lockedTeamId || undefined;
  const { data: announcements = [] } = useQuery({
    queryKey: queryKeys.announcements(listTeamId),
    queryFn: () => getAnnouncements(listTeamId, token),
    enabled: Boolean(token),
  });
  // Team-scoped list already includes org-wide announcements alongside the
  // team's own (see backend's $or filter) — a coach only manages their
  // team's, so org-wide ones show but without a delete option.
  const visibleAnnouncements = lockedTeamId
    ? announcements.filter((a) => !a.teamId || String(a.teamId) === String(lockedTeamId))
    : announcements;

  const createMutation = useMutation({
    mutationFn: (payload) => createAnnouncement(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements(listTeamId) });
      setTitle("");
      setBody("");
      clearImage();
      pushToast({ type: "success", message: "Announcement posted." });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to post announcement.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAnnouncement(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements(listTeamId) });
      pushToast({ type: "success", message: "Announcement removed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to remove announcement." });
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      pushToast({ type: "error", message: "Title and body are required." });
      return;
    }
    createMutation.mutate({
      teamId: lockedTeamId || teamId || null,
      title: title.trim(),
      body: body.trim(),
      image: canAttachImage ? image : null,
    });
  };

  const handleDelete = (announcement) => {
    if (!window.confirm(`Remove "${announcement.title}"? This can't be undone.`)) return;
    deleteMutation.mutate(announcement._id);
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        {lockedTeamId ? (
          <p className="portal__card-meta">Posting to: {lockedTeamName || "your team"}</p>
        ) : (
          <>
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
          </>
        )}

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

        {canAttachImage && (
          <>
            <label className="portal__label" htmlFor="announcement-image">
              Image (optional)
            </label>
            <input
              id="announcement-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imagePreview}
                  alt="Announcement preview"
                  style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
                />
                <button
                  type="button"
                  className="portal__link-button"
                  style={{ display: "block", marginTop: 4 }}
                  onClick={clearImage}
                >
                  Remove image
                </button>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          className="portal__button"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Posting..." : "Post Announcement"}
        </button>
      </form>

      {visibleAnnouncements.length === 0 && (
        <p className="portal__empty">No announcements yet.</p>
      )}
      {visibleAnnouncements.map((announcement) => (
        <div key={announcement._id} className="portal__card">
          <div className="portal__card--row">
            <div>
              <strong>{announcement.title}</strong>
              <p className="portal__card-meta">
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </div>
            {(!lockedTeamId || String(announcement.teamId) === String(lockedTeamId)) && (
              <button
                type="button"
                className="portal__link-button"
                disabled={deleteMutation.isPending}
                onClick={() => handleDelete(announcement)}
              >
                Delete
              </button>
            )}
          </div>
          <p className="portal__card-body">{announcement.body}</p>
          {announcement.imageUrl && (
            <img
              src={resolveMediaUrl(announcement.imageUrl)}
              alt=""
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, marginTop: 8 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default AnnouncementsPanel;
