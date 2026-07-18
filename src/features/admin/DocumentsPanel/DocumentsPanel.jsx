import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import {
  getDocuments,
  uploadDocument,
  downloadDocumentBlobUrl,
} from "../../../api/documents.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function DocumentsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("team");
  const [file, setFile] = useState(null);

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  const { data: documents = [] } = useQuery({
    queryKey: queryKeys.documents(undefined),
    queryFn: () => getDocuments(undefined, token),
    enabled: Boolean(token),
  });

  const uploadMutation = useMutation({
    mutationFn: (payload) => uploadDocument(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(undefined) });
      setTitle("");
      setFile(null);
      pushToast({ type: "success", message: "Document uploaded." });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to upload document.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      pushToast({ type: "error", message: "Title and file are required." });
      return;
    }
    uploadMutation.mutate({ title: title.trim(), visibility, teamId: teamId || null, file });
  };

  const handleDownload = async (doc) => {
    const url = await downloadDocumentBlobUrl(doc._id, token);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="document-team">
          Team
        </label>
        <select
          id="document-team"
          className="portal__select"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>

        <label className="portal__label" htmlFor="document-visibility">
          Visibility
        </label>
        <select
          id="document-visibility"
          className="portal__select"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="team">Team</option>
          <option value="parent">Parents</option>
          <option value="coach">Coaches</option>
          <option value="admin">Admins only</option>
          <option value="public">Public</option>
        </select>

        <label className="portal__label" htmlFor="document-title">
          Title
        </label>
        <input
          id="document-title"
          className="portal__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 2026 Liability Waiver"
        />

        <label className="portal__label" htmlFor="document-file">
          File
        </label>
        <input
          id="document-file"
          className="portal__input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          type="submit"
          className="portal__button"
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {documents.length === 0 && (
        <p className="portal__empty">No documents uploaded yet.</p>
      )}
      {documents.map((doc) => (
        <div key={doc._id} className="portal__card portal__card--row">
          <span>{doc.title}</span>
          <button
            type="button"
            className="portal__link-button"
            onClick={() => handleDownload(doc)}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}

export default DocumentsPanel;
