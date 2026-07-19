import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamPlayers } from "../../../api/teams.js";
import { getPlayerNotes, createPlayerNote } from "../../../api/playerNotes.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const NOTE_TYPES = ["general", "evaluation", "injury", "recruiting"];

function PlayerNotes({ teamId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [type, setType] = useState("general");
  const [body, setBody] = useState("");
  const [visibleToParent, setVisibleToParent] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });

  const { data: notes = [] } = useQuery({
    queryKey: queryKeys.playerNotes(selectedPlayerId),
    queryFn: () => getPlayerNotes(selectedPlayerId, token),
    enabled: Boolean(selectedPlayerId && token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createPlayerNote(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.playerNotes(selectedPlayerId),
      });
      setBody("");
      setVisibleToParent(false);
      pushToast({ type: "success", message: "Note saved." });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to save note.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId || !body.trim()) {
      pushToast({ type: "error", message: "Select a player and write a note." });
      return;
    }
    createMutation.mutate({
      playerId: selectedPlayerId,
      type,
      body: body.trim(),
      visibleToParent,
    });
  };

  return (
    <div>
      <label className="portal__label" htmlFor="notes-player">
        Player
      </label>
      <select
        id="notes-player"
        className="portal__select"
        value={selectedPlayerId}
        onChange={(e) => setSelectedPlayerId(e.target.value)}
      >
        <option value="">Select a player…</option>
        {players.map((player) => (
          <option key={player._id} value={player._id}>
            #{player.jersey} {player.name}
          </option>
        ))}
      </select>

      {selectedPlayerId && (
        <>
          <form className="portal__form" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
            <label className="portal__label" htmlFor="notes-type">
              Type
            </label>
            <select
              id="notes-type"
              className="portal__select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {NOTE_TYPES.map((noteType) => (
                <option key={noteType} value={noteType}>
                  {noteType}
                </option>
              ))}
            </select>

            <label className="portal__label" htmlFor="notes-body">
              Note
            </label>
            <textarea
              id="notes-body"
              className="portal__textarea"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Struggled on inside pitches today, needs more front hip stability."
            />

            <label className="portal__checkbox-row" htmlFor="notes-visible">
              <input
                id="notes-visible"
                type="checkbox"
                checked={visibleToParent}
                onChange={(e) => setVisibleToParent(e.target.checked)}
              />
              Share with parent
            </label>

            <button
              type="submit"
              className="portal__button"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Add Note"}
            </button>
          </form>

          <h3 className="portal__section-title">History</h3>
          {notes.length === 0 && <p className="portal__empty">No notes yet.</p>}
          {notes.map((note) => (
            <div key={note._id} className="portal__card">
              <div className="portal__card-header">
                <span className="portal__badge">{note.type}</span>
                {note.visibleToParent && (
                  <span className="portal__badge portal__badge--game">
                    shared with parent
                  </span>
                )}
              </div>
              <p className="portal__card-body">{note.body}</p>
              <p className="portal__card-meta">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default PlayerNotes;
