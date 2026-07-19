import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveImageUrl } from "../../../utils/media.js";
import { updatePlayer } from "../../../api/players.js";
import { useToast } from "../../../context/ToastContext.js";

import "./PlayerProfileModal.css";

const EDIT_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "jersey", label: "Jersey #", type: "number" },
  { name: "position", label: "Position", type: "text" },
  { name: "gradYear", label: "Grad Year", type: "number" },
  { name: "highSchool", label: "High School", type: "text" },
  { name: "state", label: "State", type: "text" },
  { name: "GPA", label: "GPA", type: "text" },
  { name: "committedCollege", label: "Committed College", type: "text" },
];

function PlayerProfileModal({ onClose, player, currentUser, token }) {
  /* const { id } = useParams();
  const playerId = parseInt(id);
   const player = playersData
    .flatMap((team) => team.players)
    .find((p) => p._id === playerId); */
  const [displayPlayer, setDisplayPlayer] = useState(player);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const canEdit = Boolean(
    currentUser &&
      player &&
      (currentUser.role === "admin" ||
        currentUser.role === "coach" ||
        (currentUser.role === "parent" &&
          (currentUser.childrenData || []).some(
            (child) => String(child._id) === String(player._id)
          )) ||
        (currentUser.role === "player" &&
          String(currentUser.playerData?._id) === String(player._id)))
  );

  const updateMutation = useMutation({
    mutationFn: (payload) => updatePlayer(displayPlayer._id, payload, token),
    onSuccess: (updated) => {
      setDisplayPlayer(updated);
      queryClient.invalidateQueries({
        queryKey: ["teamPlayers", String(updated.teamId)],
      });
      pushToast({ type: "success", message: "Player profile updated." });
      setIsEditing(false);
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to update player.",
      });
    },
  });

  const startEditing = () => {
    setForm({
      name: displayPlayer.name || "",
      jersey: displayPlayer.jersey ?? "",
      position: displayPlayer.position || "",
      gradYear: displayPlayer.gradYear ?? "",
      highSchool: displayPlayer.highSchool || "",
      state: displayPlayer.state || "",
      GPA: displayPlayer.GPA || "",
      isCommitted: Boolean(displayPlayer.isCommitted),
      committedCollege: displayPlayer.committedCollege || "",
    });
    setIsEditing(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      ...form,
      jersey: form.jersey === "" ? undefined : Number(form.jersey),
      gradYear: form.gradYear === "" ? undefined : Number(form.gradYear),
      committedCollege: form.isCommitted ? form.committedCollege : "",
    });
  };

  if (!displayPlayer) {
    return (
      <div className="player__profile__notfound">
        <h2>Player not found</h2>
        <Link to="/teams" className="player__profile_back-btn">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  if (isEditing && form) {
    return (
      <div className="profile__overlay" onClick={onClose}>
        <div
          className="profilePlayer__container"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="profile__modal__close" onClick={onClose}>
            ✕
          </button>

          <h2 className="profile__edit-title">Edit {displayPlayer.name}'s Profile</h2>

          <form className="profile__edit-form" onSubmit={handleSubmit}>
            {EDIT_FIELDS.map(({ name, label, type }) => (
              <label className="profile__edit-label" key={name}>
                {label}
                <input
                  className="profile__edit-input"
                  type={type}
                  value={form[name]}
                  disabled={name === "committedCollege" && !form.isCommitted}
                  onChange={(e) => handleFieldChange(name, e.target.value)}
                />
              </label>
            ))}

            <label className="profile__edit-checkbox">
              <input
                type="checkbox"
                checked={form.isCommitted}
                onChange={(e) =>
                  handleFieldChange("isCommitted", e.target.checked)
                }
              />
              Committed to a college
            </label>

            <div className="profile__edit-actions">
              <button
                type="button"
                className="profile__edit-cancel"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile__edit-save"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const displayed = displayPlayer;

  return (
    <div className="profile__overlay" onClick={onClose}>
      <div
        className="profilePlayer__container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="profile__modal__close" onClick={onClose}>
          ✕
        </button>

        {/* HERO SECTION */}
        <div className="profile__hero">
          <img
            src={resolveImageUrl(displayed.image)}
            alt={displayed.name}
            className="profile__hero_img"
          />

          <div className="profile__info">
            <h1>{displayed.name}</h1>
            <h3>
              #{displayed.jersey} • {displayed.position}
            </h3>
            <p>
              {displayed.highSchool} — Class of {displayed.gradYear}
            </p>

            {displayed.isCommitted && (
              <p className="profile__commit">
                🎓 Committed to {displayed.committedCollege}
              </p>
            )}

            {canEdit && (
              <button
                type="button"
                className="profile__edit-trigger"
                onClick={startEditing}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* BIO */}
        <div className="profile__section">
          <h2>About {displayed.name}</h2>
          <p>
            {displayed.name} is a dedicated {displayed.position?.toLowerCase()} from{" "}
            {displayed.highSchool}. Known for their strong work ethic and
            leadership, {displayed.name.split(" ")[0]} represents the Empire
            State Huskies with pride and passion.
          </p>
        </div>

        {/* FUN FACTS */}
        <div className="profile__section">
          <h2>Fun Facts</h2>
          <ul className="profile__funfacts">
            <li>
              <strong>Favorite Player:</strong> Jennie Finch
            </li>
            <li>
              <strong>Pre-game Ritual:</strong> Listens to hype music
            </li>
            <li>
              <strong>Favorite Moment:</strong> Winning the state semifinals
            </li>
          </ul>
        </div>

        {/* HIGHLIGHTS */}
        {/* <div className="profile__section">
          <h2>Highlights</h2>
          <div className="highlights__grid">
            <img src="/assets/highlights/highlight1.jpg" alt="" />
            <img src="/assets/highlights/highlight2.jpg" alt="" />
            <img src="/assets/highlights/highlight3.jpg" alt="" />
          </div>
        </div> */}

        <div className="profile__footer">
          <button className="profile__return-btn" onClick={onClose}>
            ← Back to Players
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerProfileModal;
