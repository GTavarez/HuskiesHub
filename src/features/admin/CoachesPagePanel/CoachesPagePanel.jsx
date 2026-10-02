import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../api/client.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getCoachesPageAccounts = (token) =>
  apiFetch("/admin/coaches-page", { headers: authHeaders(token) });

const updateCoachesPageEntry = (userId, payload, token) =>
  apiFetch(`/admin/users/${userId}/coaches-page`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

// One row per coach/admin account: show or hide them on the public Coaching
// Staff page, and set the title printed under their name.
function Row({ account, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [title, setTitle] = useState(account.coachTitle);

  const mutation = useMutation({
    mutationFn: (payload) => updateCoachesPageEntry(account._id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coachesPageAccounts"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches() });
      pushToast({ type: "success", message: "Coaches page updated." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't update." });
    },
  });

  const titleChanged = title.trim() !== account.coachTitle;

  return (
    <div className="portal__card">
      <div className="portal__card--row">
        <div>
          <strong>{account.name}</strong>{" "}
          <span className="portal__badge">{account.role}</span>
          <p className="portal__card-meta">
            {account.teamName || "No team"}
            {account.showOnCoachesPage && (!account.hasBio || !account.hasPhoto)
              ? ` · missing ${[!account.hasBio && "bio", !account.hasPhoto && "photo"].filter(Boolean).join(" and ")}`
              : ""}
          </p>
        </div>
        <label className="portal__checkbox-row">
          <input
            type="checkbox"
            checked={account.showOnCoachesPage}
            disabled={mutation.isPending}
            onChange={(e) => mutation.mutate({ show: e.target.checked })}
          />
          Show on coaches page
        </label>
      </div>
      <div className="portal__row" style={{ gap: 8, marginTop: 8 }}>
        <input
          className="portal__input"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title, e.g. Head Coach"
          aria-label={`Title for ${account.name}`}
        />
        <button
          type="button"
          className="portal__button"
          disabled={!titleChanged || mutation.isPending}
          onClick={() => mutation.mutate({ coachTitle: title })}
        >
          Save title
        </button>
      </div>
    </div>
  );
}

function CoachesPagePanel({ token }) {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["coachesPageAccounts"],
    queryFn: () => getCoachesPageAccounts(token),
    enabled: Boolean(token),
  });

  const shown = accounts.filter((a) => a.showOnCoachesPage).length;

  return (
    <div>
      <p className="portal__subtitle" style={{ marginBottom: 12 }}>
        Choose who appears on the public Coaching Staff page. {shown} shown right now. A coach adds
        their own photo and bio from their profile.
      </p>
      {isLoading && <p className="portal__empty">Loading…</p>}
      {accounts.map((account) => (
        <Row key={`${account._id}:${account.showOnCoachesPage}:${account.coachTitle}`} account={account} token={token} />
      ))}
    </div>
  );
}

export default CoachesPagePanel;
