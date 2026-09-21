import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollegeLogos, uploadCollegeLogo } from "../../../api/collegeLogos.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { collegeLogoKey, collegeLogoUrl } from "../../../utils/collegeLogo.js";
import { useToast } from "../../../context/ToastContext.js";
import "./CollegeLogo.css";

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

function useCollegeLogo(college) {
  const { data: logos = [] } = useQuery({
    queryKey: queryKeys.collegeLogos(),
    queryFn: getCollegeLogos,
    staleTime: 5 * 60 * 1000,
  });
  const key = collegeLogoKey(college);
  const logo = key ? logos.find((l) => l.key === key) : null;
  return logo ? collegeLogoUrl(key, logo.version) : null;
}

// The school's logo, or nothing when none has been added yet.
function CollegeLogo({ college, className = "" }) {
  const url = useCollegeLogo(college);
  if (!url) return null;
  return <img className={`college-logo ${className}`} src={url} alt={`${college} logo`} />;
}

// Add or replace a school's logo. Logos are per college, so one upload shows
// on every player committed there. `canReplace` is for admins and coaches; a
// family can only add a logo when the school has none yet.
function CollegeLogoUpload({ college, playerId, token, canReplace = false }) {
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const hasLogo = Boolean(useCollegeLogo(college));

  const mutation = useMutation({
    mutationFn: (file) => uploadCollegeLogo({ college, playerId, file }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collegeLogos() });
      pushToast({ type: "success", message: "School logo saved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't save the logo." });
    },
  });

  if (!college?.trim()) return null;
  if (hasLogo && !canReplace) return null;

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      pushToast({ type: "error", message: "That logo is too large (3 MB max)." });
      return;
    }
    mutation.mutate(file);
  };

  return (
    <span className="college-logo__upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handlePick}
        data-testid="college-logo-input"
      />
      <button
        type="button"
        className="college-logo__button"
        disabled={mutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {mutation.isPending ? "Saving..." : hasLogo ? "Replace logo" : "Add school logo"}
      </button>
    </span>
  );
}

export { CollegeLogoUpload };
export default CollegeLogo;
