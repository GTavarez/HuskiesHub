import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resolveImageUrl } from "../../../utils/media.js";
import { updatePlayer, getPlayerContact } from "../../../api/players.js";
import { getProfile, upsertProfile } from "../../../api/recruitingProfiles.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import CollegeLogo, { CollegeLogoUpload } from "../../shared/CollegeLogo/CollegeLogo.jsx";

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
  { name: "battingThrowing", label: "Bats/Throws (e.g. R/R)", type: "text" },
];

// Shown only to the player's family, their coach and admins; the public roster
// never includes them.
const PRIVATE_FIELDS = [
  { name: "phone", label: "Phone (private)", type: "tel" },
  { name: "city", label: "City (private)", type: "text" },
  { name: "contactEmail", label: "Contact Email (private)", type: "text" },
];

const SCORE_FIELDS = [
  { name: "satScore", label: "SAT Score (400 to 1600)", min: 400, max: 1600 },
  { name: "actScore", label: "ACT Score (1 to 36)", min: 1, max: 36 },
];

const numberOrNull = (value) => (value === "" || value === null ? null : Number(value));

function PlayerProfileModal({ onClose, player, currentUser, token }) {
  /* const { id } = useParams();
  const playerId = parseInt(id);
  const player = playersData
    .flatMap((team) => team.players)
    .find((p) => p._id === playerId); */
  const [displayPlayer, setDisplayPlayer] = useState(player);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [newFunFact, setNewFunFact] = useState("");
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const canEdit = Boolean(
    currentUser &&
      player &&
      (currentUser.role === "admin" ||
        (currentUser.role === "coach" &&
          String(currentUser.teamId) === String(player.teamId)) ||
        (currentUser.role === "parent" &&
          (currentUser.childrenData || []).some(
            (child) => String(child._id) === String(player._id)
          )) ||
        (currentUser.role === "player" &&
          String(currentUser.playerData?._id) === String(player._id)))
  );
  // A coach can read a family's test scores but not change them.
  const canWriteScores = canEdit && ["admin", "parent", "player"].includes(currentUser.role);
  const canReplaceLogo = canEdit && ["admin", "coach"].includes(currentUser.role);

  // Phone and contact email are private, so they come from their own endpoint
  // and only for people who may edit this player.
  const contactQuery = useQuery({
    queryKey: queryKeys.playerContact(player?._id),
    queryFn: () => getPlayerContact(player._id, token),
    enabled: Boolean(canEdit && token),
    retry: false,
  });
  const contact = contactQuery.data;

  const profileQuery = useQuery({
    queryKey: queryKeys.recruitingProfile(player?._id),
    queryFn: () => getProfile(player._id, token),
    enabled: Boolean(canEdit && token),
    retry: false,
  });
  const scores = profileQuery.data;

  // Only edit what actually loaded, so a failed fetch can never blank a
  // saved phone number or score. No recruiting profile yet (404) is fine.
  const contactEditable = contactQuery.isSuccess;
  const scoresEditable =
    canWriteScores && (profileQuery.isSuccess || profileQuery.error?.status === 404);
  const detailsLoading = contactQuery.isLoading || profileQuery.isLoading;

  const updateMutation = useMutation({
    mutationFn: async ({ playerPayload, scorePayload }) => {
      const updated = await updatePlayer(displayPlayer._id, playerPayload, token);
      if (scorePayload) {
        try {
          await upsertProfile(displayPlayer._id, scorePayload, token);
        } catch (err) {
          throw new Error(
            `Your profile changes were saved, but the test scores weren't: ${err?.message || "try again"}`
          );
        }
      }
      return updated;
    },
    onSuccess: (updated) => {
      setDisplayPlayer(updated);
      queryClient.invalidateQueries({
        queryKey: ["teamPlayers", String(updated.teamId)],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playerContact(updated._id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitingProfile(updated._id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.committedPlayers() });
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
      battingThrowing: displayPlayer.battingThrowing || "",
      ...(contactEditable
        ? {
            phone: contact.phone || "",
            city: contact.city || "",
            contactEmail: contact.contactEmail || "",
          }
        : {}),
      ...(scoresEditable
        ? { satScore: scores?.satScore ?? "", actScore: scores?.actScore ?? "" }
        : {}),
      bio: displayPlayer.bio || "",
      funFacts: (displayPlayer.funFacts || []).map((fact) => fact.text),
    });
    setNewFunFact("");
    setIsEditing(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFunFact = () => {
    const text = newFunFact.trim();
    if (!text) return;
    setForm((prev) => ({ ...prev, funFacts: [...prev.funFacts, text] }));
    setNewFunFact("");
  };

  const handleRemoveFunFact = (index) => {
    setForm((prev) => ({ ...prev, funFacts: prev.funFacts.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let scorePayload = null;
    if (scoresEditable) {
      for (const { name, label, min, max } of SCORE_FIELDS) {
        const value = numberOrNull(form[name]);
        if (value !== null && (!Number.isInteger(value) || value < min || value > max)) {
          pushToast({ type: "error", message: `${label}: enter a whole number from ${min} to ${max}.` });
          return;
        }
      }
      const satScore = numberOrNull(form.satScore);
      const actScore = numberOrNull(form.actScore);
      if (satScore !== (scores?.satScore ?? null) || actScore !== (scores?.actScore ?? null)) {
        scorePayload = { satScore, actScore };
      }
    }

    // Test scores live on the recruiting profile, not the player record.
    const { satScore: _sat, actScore: _act, ...playerFields } = form;
    updateMutation.mutate({
      playerPayload: {
        ...playerFields,
        jersey: form.jersey === "" ? undefined : Number(form.jersey),
        gradYear: form.gradYear === "" ? undefined : Number(form.gradYear),
        committedCollege: form.isCommitted ? form.committedCollege : "",
      },
      scorePayload,
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

            {form.isCommitted && form.committedCollege.trim() && (
              <div className="profile__edit-label">
                School logo
                <div>
                  <CollegeLogo college={form.committedCollege} />{" "}
                  <CollegeLogoUpload
                    college={form.committedCollege}
                    playerId={displayPlayer._id}
                    token={token}
                    canReplace={canReplaceLogo}
                  />
                </div>
              </div>
            )}

            {contactEditable &&
              PRIVATE_FIELDS.map(({ name, label, type }) => (
                <label className="profile__edit-label" key={name}>
                  {label}
                  <input
                    className="profile__edit-input"
                    type={type}
                    value={form[name]}
                    placeholder={name === "phone" ? "(201) 555-0123" : ""}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                  />
                </label>
              ))}

            {scoresEditable &&
              SCORE_FIELDS.map(({ name, label, min, max }) => (
                <label className="profile__edit-label" key={name}>
                  {label}
                  <input
                    className="profile__edit-input"
                    type="number"
                    min={min}
                    max={max}
                    step="1"
                    value={form[name]}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                  />
                </label>
              ))}

            <label className="profile__edit-label">
              About Me
              <textarea
                className="profile__edit-input"
                rows={3}
                value={form.bio}
                onChange={(e) => handleFieldChange("bio", e.target.value)}
                placeholder="Tell people a bit about yourself..."
              />
            </label>

            <label className="profile__edit-label">Fun Facts</label>
            {form.funFacts.map((fact, index) => (
              <div className="profile__edit-funfact-row" key={`${fact}-${index}`}>
                <span>{fact}</span>
                <button
                  type="button"
                  className="profile__edit-funfact-remove"
                  onClick={() => handleRemoveFunFact(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="profile__edit-funfact-row">
              <input
                className="profile__edit-input"
                value={newFunFact}
                onChange={(e) => setNewFunFact(e.target.value)}
                placeholder="e.g. Favorite player: Jennie Finch"
              />
              <button type="button" className="profile__edit-funfact-add" onClick={handleAddFunFact}>
                Add
              </button>
            </div>

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
  const photoUrl = resolveImageUrl(displayed.image);
  const initial = displayed.name ? displayed.name.charAt(0).toUpperCase() : "?";

  // Build each line from only the pieces that actually have data, instead of
  // rendering stray separators ("# •", "from .") around blank fields.
  const jerseyPositionParts = [
    displayed.jersey ? `#${displayed.jersey}` : null,
    displayed.position || null,
  ].filter(Boolean);
  const schoolGradParts = [
    displayed.highSchool || null,
    displayed.gradYear ? `Class of ${displayed.gradYear}` : null,
  ].filter(Boolean);
  const phoneDigits = (contact?.phone || "").replace(/\D/g, "");
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
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayed.name}
              className="profile__hero_img"
            />
          ) : (
            <div className="profile__hero_img profile__hero_initials">{initial}</div>
          )}

          <div className="profile__info">
            <h1>{displayed.name}</h1>
            {jerseyPositionParts.length > 0 && <h3>{jerseyPositionParts.join(" • ")}</h3>}
            {schoolGradParts.length > 0 && <p>{schoolGradParts.join(" — ")}</p>}

            {displayed.isCommitted && (
              <p className="profile__commit">
                <CollegeLogo college={displayed.committedCollege} className="college-logo--large" />{" "}
                🎓 Committed to {displayed.committedCollege}
              </p>
            )}
            {displayed.isCommitted && canEdit && (
              <CollegeLogoUpload
                college={displayed.committedCollege}
                playerId={displayed._id}
                token={token}
                canReplace={canReplaceLogo}
              />
            )}

            {canEdit && (
              <button
                type="button"
                className="profile__edit-trigger"
                onClick={startEditing}
                disabled={detailsLoading}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* BIO */}
        <div className="profile__section">
          <h2>About {displayed.name}</h2>
          {displayed.bio ? (
            <p>{displayed.bio}</p>
          ) : (
            <p className="profile__empty-hint">
              {canEdit
                ? "No bio yet — click Edit Profile to add one."
                : `${displayed.name} hasn't added a bio yet.`}
            </p>
          )}
        </div>

        {/* PRIVATE DETAILS: never shown on the public team page */}
        {canEdit && (contactQuery.isSuccess || profileQuery.isSuccess) && (
          <div className="profile__section">
            <h2>Private Details</h2>
            <p className="profile__empty-hint">
              Only {displayed.name}'s family, coach and the club can see this.
            </p>
            {contactQuery.isSuccess && (
              <>
                <p>
                  Phone:{" "}
                  {contact.phone ? (
                    <a href={`tel:${phoneDigits}`}>{contact.phone}</a>
                  ) : (
                    "Not added yet"
                  )}
                </p>
                {contact.city && <p>City: {contact.city}</p>}
                {contact.contactEmail && <p>Email: {contact.contactEmail}</p>}
              </>
            )}
            {profileQuery.isSuccess && (
              <p>
                SAT: {scores?.satScore ?? "Not added"} · ACT: {scores?.actScore ?? "Not added"}
              </p>
            )}
            {!profileQuery.isSuccess && canWriteScores && (
              <p>SAT: Not added · ACT: Not added</p>
            )}
          </div>
        )}

        {/* FUN FACTS */}
        <div className="profile__section">
          <h2>Fun Facts</h2>
          {displayed.funFacts && displayed.funFacts.length > 0 ? (
            <ul className="profile__funfacts">
              {displayed.funFacts.map((fact) => (
                <li key={fact._id || fact.text}>{fact.text}</li>
              ))}
            </ul>
          ) : (
            <p className="profile__empty-hint">
              {canEdit
                ? "No fun facts yet — click Edit Profile to add some!"
                : `${displayed.name} hasn't added any fun facts yet.`}
            </p>
          )}
        </div>

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
