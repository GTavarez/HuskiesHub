import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamContacts } from "../../../api/players.js";
import { getTeamPlayers } from "../../../api/teams.js";
import { createConversation, getConversations } from "../../../api/conversations.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import TeamChat from "../TeamChat/TeamChat.jsx";
import "./ChatHub.css";

const ROLE_LABELS = { parent: "Parent", player: "Player", coach: "Coach", admin: "Admin" };
const TEAM_CHAT_KEY = "__team__";

function NewGroupForm({ teamId, token, currentUserId, onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const { pushToast } = useToast();

  const { data: contacts = [] } = useQuery({
    queryKey: queryKeys.teamContacts(teamId),
    queryFn: () => getTeamContacts(teamId, token),
    enabled: Boolean(teamId && token),
  });

  // Most players don't have their own login — a parent's account is the only
  // way to actually reach them. Naming each parent row after their player
  // (instead of just the parent's own name) is what lets a coach pick "that
  // player" the way they're thinking about it, even though the account added
  // is still technically the parent's.
  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });
  const playerNameById = useMemo(() => new Map(players.map((p) => [p._id, p.name])), [players]);

  // A coach/admin shouldn't have to pick themself — they're always added server-side.
  const pickableContacts = contacts
    .filter((c) => c._id !== currentUserId)
    .map((c) => {
      if (c.role !== "parent") return { ...c, displayLabel: c.name };
      const childNames = (c.children || []).map((id) => playerNameById.get(id)).filter(Boolean);
      return { ...c, displayLabel: childNames.length ? `${childNames.join(" & ")} — ${c.name}` : c.name };
    })
    // Reads roughly in roster order (by player name) rather than alphabetical
    // by whichever adult's account happens to carry the child.
    .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));

  const createMutation = useMutation({
    mutationFn: () =>
      createConversation({ teamId, name: name.trim(), memberIds: selectedIds }, token),
    onSuccess: (conversation) => {
      pushToast({ type: "success", message: "Group chat created." });
      onCreated(conversation);
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to create group chat." });
    },
  });

  const toggleMember = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      pushToast({ type: "error", message: "Give the group a name." });
      return;
    }
    if (selectedIds.length === 0) {
      pushToast({ type: "error", message: "Pick at least one person." });
      return;
    }
    createMutation.mutate();
  };

  return (
    <form className="portal__form chat-hub__new-group" onSubmit={handleSubmit}>
      <input
        className="portal__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name (e.g. Infield Group, Travel Squad Parents)"
      />

      {pickableContacts.length === 0 && (
        <p className="portal__empty">No contacts on file for this team yet.</p>
      )}
      <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
        {pickableContacts.map((contact) => (
          <label key={contact._id} className="portal__checkbox-row">
            <input
              type="checkbox"
              checked={selectedIds.includes(contact._id)}
              onChange={() => toggleMember(contact._id)}
            />
            <span className="portal__badge">{ROLE_LABELS[contact.role] || contact.role}</span>{" "}
            {contact.displayLabel}
          </label>
        ))}
      </div>

      <div className="portal__row" style={{ gap: 8, justifyContent: "flex-start" }}>
        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Group"}
        </button>
        <button type="button" className="portal__link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// The one real "Chat" experience — a conversation list down the side (the
// whole-team room, pinned first, plus every group chat the current user is
// actually a member of) and the selected conversation's messages on the
// right. Replaces the old split where group chats lived on a separate tab
// (coach portal) or under the Admin Dashboard, away from the team chat
// itself — everyone now picks a conversation from one place.
function ChatHub({ teamId, token, currentUser, canManageGroups }) {
  const [selectedKey, setSelectedKey] = useState(TEAM_CHAT_KEY);
  const [showNewForm, setShowNewForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations(teamId),
    queryFn: () => getConversations(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const selectedConversation = conversations.find((c) => c._id === selectedKey);

  const handleCreated = (conversation) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations(teamId) });
    setShowNewForm(false);
    setSelectedKey(conversation._id);
  };

  return (
    <div className="chat-hub">
      <div className="chat-hub__sidebar">
        <div className="chat-hub__sidebar-header">
          <span>Chats</span>
          {canManageGroups && (
            <button
              type="button"
              className="chat-hub__new-group-btn"
              onClick={() => setShowNewForm((prev) => !prev)}
              title="New group chat"
            >
              +
            </button>
          )}
        </div>

        {showNewForm && (
          <NewGroupForm
            teamId={teamId}
            token={token}
            currentUserId={currentUser?._id}
            onCreated={handleCreated}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        <button
          type="button"
          className={`chat-hub__item${selectedKey === TEAM_CHAT_KEY ? " chat-hub__item--active" : ""}`}
          onClick={() => setSelectedKey(TEAM_CHAT_KEY)}
        >
          <span className="chat-hub__item-name">Team Chat</span>
          <span className="chat-hub__item-meta">Everyone on the team</span>
        </button>

        {conversations.map((conversation) => (
          <button
            key={conversation._id}
            type="button"
            className={`chat-hub__item${
              selectedKey === conversation._id ? " chat-hub__item--active" : ""
            }`}
            onClick={() => setSelectedKey(conversation._id)}
          >
            <span className="chat-hub__item-name">{conversation.name}</span>
            <span className="chat-hub__item-meta">
              {conversation.memberIds.length} member
              {conversation.memberIds.length === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>

      <div className="chat-hub__main">
        {selectedKey === TEAM_CHAT_KEY ? (
          <TeamChat teamId={teamId} />
        ) : selectedConversation ? (
          <TeamChat conversationId={selectedConversation._id} />
        ) : (
          <p className="portal__empty">This group chat is no longer available.</p>
        )}
      </div>
    </div>
  );
}

export default ChatHub;
