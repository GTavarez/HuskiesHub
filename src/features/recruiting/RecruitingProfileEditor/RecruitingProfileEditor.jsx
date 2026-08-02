import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, upsertProfile } from "../../../api/recruitingProfiles.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { isAllowedVideoUrl, ALLOWED_HOSTS } from "../../../utils/videoUrlAllowlist.js";
import { generatePlayerProfilePdf } from "../../../utils/playerProfilePdf.js";

const EMPTY_FORM = {
  satScore: "",
  actScore: "",
  exitVelocity: "",
  popTime: "",
  pitchVelocity: "",
  sixtyYardDash: "",
  throwingVelocity: "",
  visible: false,
};

function RecruitingProfileEditor({ playerId, token, player, teamName }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [videoUrls, setVideoUrls] = useState([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: queryKeys.recruitingProfile(playerId),
    queryFn: () => getProfile(playerId, token),
    enabled: Boolean(playerId && token),
    retry: false,
  });

  useEffect(() => {
    if (!profile || hasLoadedExisting) return;
    setForm({
      satScore: profile.satScore ?? "",
      actScore: profile.actScore ?? "",
      exitVelocity: profile.exitVelocity ?? "",
      popTime: profile.popTime ?? "",
      pitchVelocity: profile.pitchVelocity ?? "",
      sixtyYardDash: profile.sixtyYardDash ?? "",
      throwingVelocity: profile.throwingVelocity ?? "",
      visible: Boolean(profile.visible),
    });
    setVideoUrls(profile.highlightVideoUrls || []);
    setHasLoadedExisting(true);
  }, [profile, hasLoadedExisting]);

  const saveMutation = useMutation({
    mutationFn: (payload) => upsertProfile(playerId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitingProfile(playerId) });
      pushToast({ type: "success", message: "Recruiting profile saved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to save profile." });
    },
  });

  const handleFieldChange = (field) => (e) => {
    const { value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [field]: type === "checkbox" ? checked : value }));
  };

  const handleAddVideoUrl = () => {
    const url = newVideoUrl.trim();
    if (!url) return;
    if (!isAllowedVideoUrl(url)) {
      pushToast({
        type: "error",
        message: `Video links must be from: ${ALLOWED_HOSTS.join(", ")}`,
      });
      return;
    }
    setVideoUrls((prev) => [...prev, url]);
    setNewVideoUrl("");
  };

  const handleRemoveVideoUrl = (index) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const numberOrNull = (value) => (value === "" ? null : Number(value));

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      satScore: numberOrNull(form.satScore),
      actScore: numberOrNull(form.actScore),
      exitVelocity: numberOrNull(form.exitVelocity),
      popTime: numberOrNull(form.popTime),
      pitchVelocity: numberOrNull(form.pitchVelocity),
      sixtyYardDash: numberOrNull(form.sixtyYardDash),
      throwingVelocity: numberOrNull(form.throwingVelocity),
      highlightVideoUrls: videoUrls,
      visible: form.visible,
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit}>
      {player && (
        <button
          type="button"
          className="portal__button"
          style={{ marginBottom: 12 }}
          onClick={() =>
            generatePlayerProfilePdf({ player, recruitingProfile: profile, teamName })
          }
        >
          Download Player Profile PDF
        </button>
      )}

      <label className="portal__label" htmlFor="rp-sat">
        SAT Score
      </label>
      <input
        id="rp-sat"
        className="portal__input"
        type="number"
        value={form.satScore}
        onChange={handleFieldChange("satScore")}
      />

      <label className="portal__label" htmlFor="rp-act">
        ACT Score
      </label>
      <input
        id="rp-act"
        className="portal__input"
        type="number"
        value={form.actScore}
        onChange={handleFieldChange("actScore")}
      />

      <label className="portal__label" htmlFor="rp-exit-velo">
        Exit Velocity (mph)
      </label>
      <input
        id="rp-exit-velo"
        className="portal__input"
        type="number"
        value={form.exitVelocity}
        onChange={handleFieldChange("exitVelocity")}
      />

      <label className="portal__label" htmlFor="rp-pop-time">
        Pop Time (seconds)
      </label>
      <input
        id="rp-pop-time"
        className="portal__input"
        type="number"
        step="0.01"
        value={form.popTime}
        onChange={handleFieldChange("popTime")}
      />

      <label className="portal__label" htmlFor="rp-pitch-velo">
        Pitch Velocity (mph)
      </label>
      <input
        id="rp-pitch-velo"
        className="portal__input"
        type="number"
        value={form.pitchVelocity}
        onChange={handleFieldChange("pitchVelocity")}
      />

      <label className="portal__label" htmlFor="rp-60">
        60-Yard Dash (seconds)
      </label>
      <input
        id="rp-60"
        className="portal__input"
        type="number"
        step="0.01"
        value={form.sixtyYardDash}
        onChange={handleFieldChange("sixtyYardDash")}
      />

      <label className="portal__label" htmlFor="rp-throwing-velo">
        Throwing Velocity (mph)
      </label>
      <input
        id="rp-throwing-velo"
        className="portal__input"
        type="number"
        value={form.throwingVelocity}
        onChange={handleFieldChange("throwingVelocity")}
      />

      <label className="portal__label">Highlight Videos (YouTube/Hudl/Vimeo links only)</label>
      {videoUrls.map((url, index) => (
        <div className="portal__row" key={url}>
          <span>{url}</span>
          <button
            type="button"
            className="portal__link-button"
            onClick={() => handleRemoveVideoUrl(index)}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="portal__row">
        <input
          className="portal__input"
          value={newVideoUrl}
          onChange={(e) => setNewVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <button type="button" className="portal__button" onClick={handleAddVideoUrl}>
          Add
        </button>
      </div>

      <label className="portal__checkbox-row" htmlFor="rp-visible">
        <input
          id="rp-visible"
          type="checkbox"
          checked={form.visible}
          onChange={handleFieldChange("visible")}
        />
        Make this profile visible to approved college coaches
      </label>

      <button type="submit" className="portal__button" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving..." : "Save Recruiting Profile"}
      </button>
    </form>
  );
}

export default RecruitingProfileEditor;
