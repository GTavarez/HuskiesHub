import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProfiles } from "../../../api/recruitingProfiles.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { resolveImageUrl } from "../../../utils/media.js";
import "../../shared/portal.css";

const EMPTY_CRITERIA = {
  gradYear: "",
  position: "",
  minGpa: "",
  state: "",
  minExitVelocity: "",
  maxPopTime: "",
  minPitchVelocity: "",
  minThrowingVelocity: "",
  maxSixtyYardDash: "",
};

function CollegeCoachDashboard({ token }) {
  const [form, setForm] = useState(EMPTY_CRITERIA);
  const [submittedCriteria, setSubmittedCriteria] = useState(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);

  const { data: results = [], isFetching } = useQuery({
    queryKey: queryKeys.recruitingSearch(submittedCriteria),
    queryFn: () => searchProfiles(submittedCriteria, token),
    enabled: Boolean(submittedCriteria && token),
  });

  const handleFieldChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedCriteria(form);
  };

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">College Coach Portal</h1>
        <p className="portal__subtitle">
          Search players who&apos;ve opted their recruiting profile into search.
        </p>

        <form className="portal__form" onSubmit={handleSearch}>
          <label className="portal__label" htmlFor="cc-gradyear">
            Grad Year
          </label>
          <input
            id="cc-gradyear"
            className="portal__input"
            type="number"
            value={form.gradYear}
            onChange={handleFieldChange("gradYear")}
            placeholder="2028"
          />

          <label className="portal__label" htmlFor="cc-position">
            Position
          </label>
          <input
            id="cc-position"
            className="portal__input"
            value={form.position}
            onChange={handleFieldChange("position")}
            placeholder="Catcher"
          />

          <label className="portal__label" htmlFor="cc-state">
            State
          </label>
          <input
            id="cc-state"
            className="portal__input"
            value={form.state}
            onChange={handleFieldChange("state")}
            placeholder="New Jersey"
          />

          <label className="portal__label" htmlFor="cc-mingpa">
            Min GPA
          </label>
          <input
            id="cc-mingpa"
            className="portal__input"
            type="number"
            step="0.1"
            value={form.minGpa}
            onChange={handleFieldChange("minGpa")}
            placeholder="3.7"
          />

          <label className="portal__label" htmlFor="cc-min-exit-velo">
            Min Exit Velocity (mph)
          </label>
          <input
            id="cc-min-exit-velo"
            className="portal__input"
            type="number"
            value={form.minExitVelocity}
            onChange={handleFieldChange("minExitVelocity")}
            placeholder="62"
          />

          <label className="portal__label" htmlFor="cc-max-pop-time">
            Max Pop Time (seconds)
          </label>
          <input
            id="cc-max-pop-time"
            className="portal__input"
            type="number"
            step="0.01"
            value={form.maxPopTime}
            onChange={handleFieldChange("maxPopTime")}
          />

          <label className="portal__label" htmlFor="cc-min-pitch-velo">
            Min Pitch Velocity (mph)
          </label>
          <input
            id="cc-min-pitch-velo"
            className="portal__input"
            type="number"
            value={form.minPitchVelocity}
            onChange={handleFieldChange("minPitchVelocity")}
          />

          <label className="portal__label" htmlFor="cc-min-throwing-velo">
            Min Throwing Velocity (mph)
          </label>
          <input
            id="cc-min-throwing-velo"
            className="portal__input"
            type="number"
            value={form.minThrowingVelocity}
            onChange={handleFieldChange("minThrowingVelocity")}
          />

          <label className="portal__label" htmlFor="cc-max-60">
            Max 60-Yard Dash (seconds)
          </label>
          <input
            id="cc-max-60"
            className="portal__input"
            type="number"
            step="0.01"
            value={form.maxSixtyYardDash}
            onChange={handleFieldChange("maxSixtyYardDash")}
          />

          <button type="submit" className="portal__button" disabled={isFetching}>
            {isFetching ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="portal__section">
          <h2 className="portal__section-title">Results</h2>
          {submittedCriteria === null && (
            <p className="portal__empty">Enter search criteria above to find players.</p>
          )}
          {submittedCriteria !== null && results.length === 0 && !isFetching && (
            <p className="portal__empty">No players match those criteria.</p>
          )}
          {results.map((profile) => {
            const player = profile.playerId;
            if (!player) return null;
            const isExpanded = expandedPlayerId === player._id;
            return (
              <div key={profile._id} className="portal__card">
                <div className="portal__card-header">
                  <span className="portal__badge">{player.position}</span>
                  <strong>
                    {player.name} — #{player.jersey}
                  </strong>
                </div>
                <p className="portal__card-meta">
                  Grad {player.gradYear} · {player.highSchool} · {player.state}
                  {player.isCommitted && ` · Committed: ${player.committedCollege}`}
                </p>
                <button
                  type="button"
                  className="portal__link-button"
                  onClick={() => setExpandedPlayerId(isExpanded ? null : player._id)}
                >
                  {isExpanded ? "Hide full profile" : "View full profile"}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 10 }}>
                    {player.image && (
                      <img
                        src={resolveImageUrl(player.image)}
                        alt={player.name}
                        style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }}
                      />
                    )}
                    <p>GPA: {player.GPA}</p>
                    {profile.satScore != null && <p>SAT: {profile.satScore}</p>}
                    {profile.actScore != null && <p>ACT: {profile.actScore}</p>}
                    {profile.exitVelocity != null && (
                      <p>Exit Velocity: {profile.exitVelocity} mph</p>
                    )}
                    {profile.popTime != null && <p>Pop Time: {profile.popTime}s</p>}
                    {profile.pitchVelocity != null && (
                      <p>Pitch Velocity: {profile.pitchVelocity} mph</p>
                    )}
                    {profile.throwingVelocity != null && (
                      <p>Throwing Velocity: {profile.throwingVelocity} mph</p>
                    )}
                    {profile.sixtyYardDash != null && (
                      <p>60-Yard Dash: {profile.sixtyYardDash}s</p>
                    )}
                    {profile.highlightVideoUrls?.length > 0 && (
                      <div>
                        <strong>Highlight Videos:</strong>
                        <ul>
                          {profile.highlightVideoUrls.map((url) => (
                            <li key={url}>
                              <a href={url} target="_blank" rel="noreferrer">
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CollegeCoachDashboard;
