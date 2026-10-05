import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamContacts } from "../../../api/players.js";
import { getTeamPlayers } from "../../../api/teams.js";
import {
  addConversationMembers,
  createConversation,
  createDirectConversation,
  getConversations,
  getDirectMessageCandidates,
  removeConversationMember,
  renameConversation,
} from "../../../api/conversations.js";
import { getChatSummary } from "../../../api/chat.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { muteLabel, unreadLabel } from "../../../utils/chatText.js";
import TeamChat from "../TeamChat/TeamChat.jsx";
import "./ChatHub.css";

const ROLE_LABELS = { parent: "Parent", player: "Player", coach: "Coach", admin: "Admin" };
const SUMMARY_REFRESH_MS = 20 * 1000;

// Parents are listed by their player ("Maya Lee — Pat Lee") so a coach can pick
// "that player" even though the account added is the parent's.
function useLabeledContacts(teamId, token, currentUserId) {
  const { data: contacts = [] } = useQuery({
    queryKey: queryKeys.teamContacts(teamId),
    queryFn: () => getTeamContacts(teamId, token),
    enabled: Boolean(teamId && token),
  });
  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });
  const playerNameById = useMemo(() => new Map(players.map((p) => [p._id, p.name])), [players]);

  return useMemo(
    () =>
      contacts
        .filter((c) => c._id !== currentUserId)
        .map((c) => {
          if (c.role !== "parent") return { ...c, displayLabel: c.name };
          const childNames = (c.children || []).map((id) => playerNameById.get(id)).filter(Boolean);
          return { ...c, displayLabel: childNames.length ? `${childNames.join(" & ")} — ${c.name}` : c.name };
        })
        .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel)),
    [contacts, playerNameById, currentUserId]
  );
}

function NewGroupForm({ teamId, token, currentUserId, onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const { pushToast } = useToast();
  const pickableContacts = useLabeledContacts(teamId, token, currentUserId);

  const createMutation = useMutation({
    mutationFn: () => createConversation({ teamId, name: name.trim(), memberIds: selectedIds }, token),
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
    <form className="portal__form chat-hub__panel" onSubmit={handleSubmit}>
      <h4 className="chat-hub__panel-title">New group chat</h4>
      <input
        className="portal__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name (e.g. Infield Group, Travel Squad Parents)"
      />
      {pickableContacts.length === 0 && <p className="portal__empty">No contacts on file for this team yet.</p>}
      <div className="chat-hub__picker">
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

// Start a private message. Only people you're allowed to message are listed;
// if a player is involved, their parents are added automatically.
function NewMessageForm({ teamId, token, onCreated, onCancel }) {
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["dmCandidates", teamId],
    queryFn: () => getDirectMessageCandidates(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const startMutation = useMutation({
    mutationFn: (otherUserId) => createDirectConversation(teamId, otherUserId, token),
    onSuccess: (conversation) => onCreated(conversation),
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't start that message." });
    },
  });

  const shown = candidates.filter((c) => c.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="portal__form chat-hub__panel">
      <h4 className="chat-hub__panel-title">New message</h4>
      <input
        className="portal__input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search for someone"
        aria-label="Search for someone"
      />
      {isLoading && <p className="portal__empty">Loading…</p>}
      {!isLoading && candidates.length === 0 && (
        <p className="portal__empty">There is no one you can message privately on this team yet.</p>
      )}
      <div className="chat-hub__picker">
        {shown.map((person) => (
          <button
            key={person._id}
            type="button"
            className="chat-hub__person"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate(person._id)}
          >
            <span className="portal__badge">{ROLE_LABELS[person.role] || person.role}</span> {person.label}
            {person.includesParents && <span className="chat-hub__person-note">parent included</span>}
          </button>
        ))}
      </div>
      <p className="chat-hub__note">
        Messages with a player always include their parent, so a parent can read everything.
      </p>
      <button type="button" className="portal__link-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// Rename a group and change who is in it. The person who made the group can't
// be removed.
function ManageGroupPanel({ conversationId, teamId, token, currentUserId, onClose }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations(teamId),
    queryFn: () => getConversations(teamId, token),
  });
  const conversation = conversations.find((c) => c._id === conversationId);
  const contacts = useLabeledContacts(teamId, token, currentUserId);
  const [name, setName] = useState("");

  useEffect(() => {
    if (conversation) setName(conversation.name);
  }, [conversation?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations(teamId) });
    queryClient.invalidateQueries({ queryKey: ["chatSummary"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(`conv:${conversationId}`) });
    queryClient.invalidateQueries({ queryKey: queryKeys.chatMembers(`conv:${conversationId}`) });
  };

  const run = async (action, failure) => {
    try {
      await action();
      refresh();
    } catch (err) {
      pushToast({ type: "error", message: err?.message || failure });
    }
  };

  if (!conversation) return null;
  const memberIds = new Set(conversation.memberIds.map(String));
  const addable = contacts.filter((c) => !memberIds.has(String(c._id)));

  return (
    <div className="portal__form chat-hub__panel">
      <h4 className="chat-hub__panel-title">People in this group</h4>
      <div className="portal__row" style={{ gap: 8 }}>
        <input
          className="portal__input"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          aria-label="Group name"
        />
        <button
          type="button"
          className="portal__button"
          disabled={!name.trim() || name.trim() === conversation.name}
          onClick={() => run(() => renameConversation(conversationId, name.trim(), token), "Couldn't rename.")}
        >
          Rename
        </button>
      </div>

      <ul className="chat-hub__members">
        {conversation.members.map((member) => (
          <li key={member._id}>
            <span>
              <span className="portal__badge">{ROLE_LABELS[member.role] || member.role}</span> {member.name}
            </span>
            {String(member._id) !== String(conversation.createdBy) && (
              <button
                type="button"
                className="portal__link-button"
                onClick={() => {
                  if (window.confirm(`Remove ${member.name} from this group?`)) {
                    run(() => removeConversationMember(conversationId, member._id, token), "Couldn't remove them.");
                  }
                }}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {addable.length > 0 && (
        <>
          <h5 className="chat-hub__panel-subtitle">Add someone</h5>
          <div className="chat-hub__picker">
            {addable.map((contact) => (
              <button
                key={contact._id}
                type="button"
                className="chat-hub__person"
                onClick={() => run(() => addConversationMembers(conversationId, [contact._id], token), "Couldn't add them.")}
              >
                + {contact.displayLabel}
              </button>
            ))}
          </div>
        </>
      )}
      <button type="button" className="portal__link-button" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

function RoomButton({ room, active, onSelect }) {
  const mute = muteLabel(room.mutedUntil);
  const icon = room.type === "direct" ? "✉️" : room.announcementOnly ? "📢" : "";
  return (
    <button
      type="button"
      className={`chat-hub__item${active ? " chat-hub__item--active" : ""}`}
      onClick={() => onSelect(room.key)}
    >
      <span className="chat-hub__item-top">
        <span className="chat-hub__item-name">
          {icon} {room.type === "team" ? "Team Chat" : room.name}
        </span>
        {room.unread > 0 && (
          <span
            className={`chat-hub__badge${room.mutedUntil ? " chat-hub__badge--muted" : ""}`}
            aria-label={`${room.unread} unread`}
          >
            {room.mentioned && "@ "}
            {unreadLabel(room.unread)}
          </span>
        )}
      </span>
      <span className="chat-hub__item-meta">
        {room.lastMessage
          ? `${room.lastMessage.senderName}: ${room.lastMessage.preview}`
          : room.type === "team"
            ? "Everyone on the team"
            : room.type === "direct"
              ? "Private message"
              : `${room.memberCount} member${room.memberCount === 1 ? "" : "s"}`}
      </span>
      {mute && <span className="chat-hub__item-mute">🔕 {mute}</span>}
    </button>
  );
}

// The chat area: a list of every chat the person is in on the left (the whole
// team, groups, and private messages, each with its unread count) and the open
// conversation on the right. On a phone it shows one at a time.
function ChatHub({ teamId, token, currentUser, canManageGroups, initialKey }) {
  const teamKey = `team:${teamId}`;
  const [selectedKey, setSelectedKey] = useState(initialKey || teamKey);
  const [panel, setPanel] = useState(null); // "message" | "group" | "manage" | null
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(initialKey));
  const queryClient = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: queryKeys.chatSummary(teamId),
    queryFn: () => getChatSummary(teamId, token),
    enabled: Boolean(teamId && token),
    refetchInterval: SUMMARY_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  const rooms = summary?.rooms || [];
  const selectedRoom = rooms.find((r) => r.key === selectedKey);

  // Following a link to a chat that is no longer there falls back to the team chat.
  useEffect(() => {
    if (summary && !selectedRoom) setSelectedKey(teamKey);
  }, [summary, selectedRoom, teamKey]);

  const select = (key) => {
    setSelectedKey(key);
    setPanel(null);
    setMobileChatOpen(true);
  };

  const handleCreated = (conversation) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations(teamId) });
    queryClient.invalidateQueries({ queryKey: ["chatSummary"] });
    select(`conv:${conversation._id}`);
  };

  const conversationId = selectedKey.startsWith("conv:") ? selectedKey.slice(5) : null;

  return (
    <div className={`chat-hub${mobileChatOpen ? " chat-hub--show-chat" : ""}`}>
      <div className="chat-hub__sidebar">
        <div className="chat-hub__sidebar-header">
          <span>Chats</span>
          <span className="chat-hub__sidebar-actions">
            <button
              type="button"
              className="chat-hub__new-btn"
              onClick={() => setPanel(panel === "message" ? null : "message")}
              title="New message"
              aria-label="New message"
            >
              ✉️
            </button>
            {canManageGroups && (
              <button
                type="button"
                className="chat-hub__new-group-btn"
                onClick={() => setPanel(panel === "group" ? null : "group")}
                title="New group chat"
                aria-label="New group chat"
              >
                +
              </button>
            )}
          </span>
        </div>

        {panel === "message" && (
          <NewMessageForm teamId={teamId} token={token} onCreated={handleCreated} onCancel={() => setPanel(null)} />
        )}
        {panel === "group" && (
          <NewGroupForm
            teamId={teamId}
            token={token}
            currentUserId={currentUser?._id}
            onCreated={handleCreated}
            onCancel={() => setPanel(null)}
          />
        )}
        {panel === "manage" && conversationId && (
          <ManageGroupPanel
            conversationId={conversationId}
            teamId={teamId}
            token={token}
            currentUserId={currentUser?._id}
            onClose={() => setPanel(null)}
          />
        )}

        {rooms.length === 0 && (
          <RoomButton
            room={{ key: teamKey, type: "team", name: "Team Chat", unread: 0 }}
            active
            onSelect={select}
          />
        )}
        {rooms.map((room) => (
          <RoomButton key={room.key} room={room} active={selectedKey === room.key} onSelect={select} />
        ))}
      </div>

      <div className="chat-hub__main">
        <button type="button" className="chat-hub__back" onClick={() => setMobileChatOpen(false)}>
          ← All chats
        </button>
        {conversationId ? (
          <TeamChat
            key={selectedKey}
            conversationId={conversationId}
            onManage={() => {
              setPanel(panel === "manage" ? null : "manage");
              // The people panel lives with the chat list, which a phone hides
              // while a chat is open.
              setMobileChatOpen(false);
            }}
          />
        ) : (
          <TeamChat key={selectedKey} teamId={teamId} />
        )}
      </div>
    </div>
  );
}

export default ChatHub;
