import { useState } from "react";
import { getTeamShowcaseDetails } from "../../../api/players.js";
import { generateShowcaseSheetPdf } from "../../../utils/showcaseSheetPdf.js";
import { useToast } from "../../../context/ToastContext.js";

const FIELDS = [
  { name: "eventName", label: "Showcase or tournament name (optional)", placeholder: "e.g. Jersey Outlaws" },
  { name: "teamName", label: "Team name as it should print" },
  { name: "website", label: "Team website (optional)" },
  { name: "managerName", label: "Manager name" },
  { name: "managerAddress", label: "Manager address" },
  { name: "managerCityStateZip", label: "City, state, ZIP" },
  { name: "managerPhone", label: "Manager phone" },
  { name: "managerEmail", label: "Manager email" },
];

const storageKey = (teamId) => `huskies:showcase-sheet:${teamId}`;

// Remembered per team, in this browser only, so the manager details are only
// typed once. Wrapped in try/catch because storage can be blocked or empty.
function loadSaved(teamId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(teamId))) || {};
  } catch {
    return {};
  }
}

function ShowcaseSheetModal({ team, players, token, onClose }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    eventName: "",
    teamName: `${team.name} ${team.ageGroup}`,
    website: "",
    managerName: "",
    managerAddress: "",
    managerCityStateZip: "",
    managerPhone: "",
    managerEmail: "",
    ...loadSaved(team._id),
  }));

  const handleChange = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      try {
        localStorage.setItem(storageKey(team._id), JSON.stringify(form));
      } catch {
        // Not being able to remember the details isn't worth failing the download.
      }

      // Phone, email, city and test scores are private, so they come from a
      // coach/admin-only request instead of the public roster.
      const details = await getTeamShowcaseDetails(team._id, token);
      const byPlayer = new Map(details.map((d) => [String(d.playerId), d]));
      const merged = players.map((player) => ({ ...player, ...(byPlayer.get(String(player._id)) || {}) }));

      generateShowcaseSheetPdf({
        eventName: form.eventName.trim(),
        teamName: form.teamName.trim(),
        website: form.website.trim(),
        manager: {
          name: form.managerName.trim(),
          address: form.managerAddress.trim(),
          cityStateZip: form.managerCityStateZip.trim(),
          phone: form.managerPhone.trim(),
          email: form.managerEmail.trim(),
        },
        players: merged,
      });
      onClose();
    } catch (error) {
      pushToast({ type: "error", message: error?.message || "Couldn't create the sheet." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile__overlay" onClick={onClose}>
      <div className="profilePlayer__container" onClick={(e) => e.stopPropagation()}>
        <button className="profile__modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="profile__edit-title">Team Roster Sheet</h2>
        <p className="profile__empty-hint">
          Fill in the manager details for this sheet. They're remembered on this computer for next
          time. Player phone, email, city and SAT/ACT come from each player's profile.
        </p>
        <form className="profile__edit-form" onSubmit={handleSubmit}>
          {FIELDS.map(({ name, label, placeholder }) => (
            <label className="profile__edit-label" key={name}>
              {label}
              <input
                className="profile__edit-input"
                value={form[name]}
                placeholder={placeholder}
                onChange={handleChange(name)}
              />
            </label>
          ))}
          <div className="profile__edit-actions">
            <button type="button" className="profile__edit-cancel" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="profile__edit-save" disabled={busy}>
              {busy ? "Creating…" : "Download PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShowcaseSheetModal;
