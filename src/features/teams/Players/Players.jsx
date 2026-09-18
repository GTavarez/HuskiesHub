import "./Players.css";
/* import { playersData } from "../../../utils/constants"; */
import { useParams, useNavigate } from "react-router-dom";
import PlayerProfileModal from "../PlayerProfile/PlayerProfileModal";
import PlayerProfilePreviewModal from "../PlayerProfilePreviewModal/PlayerProfilePreviewModal";
import { useState } from "react";
import ChatHub from "../../chat/ChatHub/ChatHub";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeam, getTeamPlayers } from "../../../api/teams";
import { createPlayer, deletePlayer } from "../../../api/players";
import { getCoaches } from "../../../api/users.js";
import { getAnnouncements } from "../../../api/announcements.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { resolveImageUrl, resolveMediaUrl } from "../../../utils/media";
import { generateTeamRosterPdf } from "../../../utils/teamRosterPdf";
import { useToast } from "../../../context/ToastContext.js";

const NEW_PLAYER_DEFAULTS = {
  name: "",
  jersey: "",
  position: "",
  gradYear: "",
  highSchool: "",
  GPA: "",
  battingThrowing: "",
  contactEmail: "",
};

function Players({
  onViewProfile,
  onClose,
  selectedPlayer,
  isLoggedIn,
  isProfileModalOpen,
  openLogin,
  currentUser,
  token,
}) {
  const [activeTab, setActiveTab] = useState("players");
  const [isGeneratingRoster, setIsGeneratingRoster] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState(NEW_PLAYER_DEFAULTS);
  const { teamsId } = useParams();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const {
    data: team,
    isLoading: isTeamLoading,
    isError: isTeamError,
    error: teamError,
  } = useQuery({
    queryKey: ["team", teamsId],
    queryFn: () => getTeam(teamsId),
    enabled: Boolean(teamsId),
  });

  const {
    data: players = [],
    isLoading: isPlayersLoading,
    isError: isPlayersError,
    error: playersError,
  } = useQuery({
    queryKey: ["teamPlayers", teamsId],
    queryFn: () => getTeamPlayers(teamsId),
    enabled: Boolean(teamsId),
    select: (data) => {
      const seen = new Set();
      return data.filter((player) => {
        const key = String(player?._id ?? player?.id ?? "");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });

  const { data: allCoaches = [] } = useQuery({
    queryKey: queryKeys.coaches(),
    queryFn: getCoaches,
  });
  const teamCoaches = allCoaches.filter((coach) => coach.teamId?._id === teamsId);

  const { data: announcements = [] } = useQuery({
    queryKey: queryKeys.announcements(teamsId),
    queryFn: () => getAnnouncements(teamsId, token),
    enabled: Boolean(isLoggedIn && token && teamsId),
  });

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/teams");
  };
  // Mirrors the backend's canAccessTeam (src/common/utils/ownership.js) —
  // admin can view any team's chat; coach/player only their own team;
  // parent only a team one of their children is actually on. This is a UI
  // gate only, the server independently re-validates on connect.
  const canAccessThisTeamChat = Boolean(
    isLoggedIn &&
      team?._id &&
      (currentUser?.role === "admin" ||
        (["coach", "player"].includes(currentUser?.role) &&
          String(currentUser?.teamId) === String(team._id)) ||
        (currentUser?.role === "parent" &&
          (currentUser?.childrenData || []).some(
            (child) => String(child.teamId) === String(team._id)
          )))
  );

  // Coaches/admins only — this is a printable sheet for the bench, not a
  // public download.
  const canDownloadRoster = Boolean(
    isLoggedIn &&
      team?._id &&
      (currentUser?.role === "admin" ||
        (currentUser?.role === "coach" && String(currentUser?.teamId) === String(team._id)))
  );

  const handleDownloadRoster = async () => {
    setIsGeneratingRoster(true);
    try {
      await generateTeamRosterPdf({
        teamName: `${team.name} ${team.ageGroup}`,
        players,
      });
    } finally {
      setIsGeneratingRoster(false);
    }
  };

  const createPlayerMutation = useMutation({
    mutationFn: (payload) => createPlayer(payload, token),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["teamPlayers", teamsId] });
      pushToast({ type: "success", message: `${created.name} added to the roster.` });
      setNewPlayerForm(NEW_PLAYER_DEFAULTS);
      setIsAddingPlayer(false);
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add player." });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (playerId) => deletePlayer(playerId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamPlayers", teamsId] });
      pushToast({ type: "success", message: "Player removed from the roster." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to delete player." });
    },
  });

  const handleDeletePlayer = (player) => {
    if (
      !window.confirm(
        `Remove ${player.name} from this team's roster? Their profile and history stay in the system — they just won't show on the roster anymore.`
      )
    ) {
      return;
    }
    deletePlayerMutation.mutate(player._id);
  };

  const handleNewPlayerFieldChange = (field) => (e) => {
    setNewPlayerForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddPlayerSubmit = (e) => {
    e.preventDefault();
    if (!newPlayerForm.name.trim()) {
      pushToast({ type: "error", message: "Name is required." });
      return;
    }
    createPlayerMutation.mutate({
      name: newPlayerForm.name.trim(),
      teamId: team._id,
      jersey: newPlayerForm.jersey === "" ? undefined : Number(newPlayerForm.jersey),
      position: newPlayerForm.position || undefined,
      gradYear: newPlayerForm.gradYear === "" ? undefined : Number(newPlayerForm.gradYear),
      highSchool: newPlayerForm.highSchool || undefined,
      GPA: newPlayerForm.GPA || undefined,
      battingThrowing: newPlayerForm.battingThrowing || undefined,
      contactEmail: newPlayerForm.contactEmail || undefined,
    });
  };

  if (isTeamLoading || isPlayersLoading) {
    return (
      <p style={{ textAlign: "center", color: "#ccc" }}>Loading team...</p>
    );
  }

  if (isTeamError || isPlayersError) {
    return (
      <p style={{ textAlign: "center", color: "#f2b8b5" }}>
        {teamError?.message || playersError?.message || "Failed to load team."}
      </p>
    );
  }

  return (
    <section className="players__section">
      <header className="players__header">
        {/* ✅ TABS */}
        <div className="players__tabs">
          <button
            className={`players__tab ${
              activeTab === "players" ? "players__tab_active" : ""
            }`}
            onClick={() => setActiveTab("players")}
            type="button"
          >
            Players
          </button>

          <button
            className={`players__tab ${
              activeTab === "chat" ? "players__tab_active" : ""
            }`}
            onClick={() => {
              if (!isLoggedIn) return openLogin?.();
              if (!canAccessThisTeamChat) return;
              setActiveTab("chat");
            }}
            type="button"
            disabled={!isLoggedIn || !canAccessThisTeamChat}
          >
            Team Chat
          </button>

          <button
            className={`players__tab ${
              activeTab === "announcements" ? "players__tab_active" : ""
            }`}
            onClick={() => {
              if (!isLoggedIn) return openLogin?.();
              setActiveTab("announcements");
            }}
            type="button"
          >
            Announcements
          </button>
        </div>

        <div className="players__header-actions">
          <button className="players__back-btn" onClick={handleBack}>
            ← Back to Teams
          </button>

          {canDownloadRoster && (
            <button
              type="button"
              className="players__back-btn"
              onClick={handleDownloadRoster}
              disabled={isGeneratingRoster}
            >
              {isGeneratingRoster ? "Generating..." : "Download Team Roster PDF"}
            </button>
          )}

          {canDownloadRoster && (
            <button
              type="button"
              className="players__back-btn"
              onClick={() => setIsAddingPlayer((prev) => !prev)}
            >
              {isAddingPlayer ? "Cancel" : "+ Add Player"}
            </button>
          )}
        </div>

        <h2>{team ? `${team.name} ${team.ageGroup}` : "Teams"}</h2>
        <div className="players__divider"></div>
      </header>

      {canDownloadRoster && isAddingPlayer && (
        <form className="portal__form" onSubmit={handleAddPlayerSubmit} style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          <label className="portal__label" htmlFor="new-player-name">Name *</label>
          <input
            id="new-player-name"
            className="portal__input"
            value={newPlayerForm.name}
            onChange={handleNewPlayerFieldChange("name")}
            required
          />

          <label className="portal__label" htmlFor="new-player-jersey">Jersey #</label>
          <input
            id="new-player-jersey"
            className="portal__input"
            type="number"
            value={newPlayerForm.jersey}
            onChange={handleNewPlayerFieldChange("jersey")}
          />

          <label className="portal__label" htmlFor="new-player-position">Position</label>
          <input
            id="new-player-position"
            className="portal__input"
            value={newPlayerForm.position}
            onChange={handleNewPlayerFieldChange("position")}
          />

          <label className="portal__label" htmlFor="new-player-gradyear">Grad Year</label>
          <input
            id="new-player-gradyear"
            className="portal__input"
            type="number"
            value={newPlayerForm.gradYear}
            onChange={handleNewPlayerFieldChange("gradYear")}
          />

          <label className="portal__label" htmlFor="new-player-highschool">High School</label>
          <input
            id="new-player-highschool"
            className="portal__input"
            value={newPlayerForm.highSchool}
            onChange={handleNewPlayerFieldChange("highSchool")}
          />

          <label className="portal__label" htmlFor="new-player-gpa">GPA</label>
          <input
            id="new-player-gpa"
            className="portal__input"
            value={newPlayerForm.GPA}
            onChange={handleNewPlayerFieldChange("GPA")}
          />

          <label className="portal__label" htmlFor="new-player-bats">Bats/Throws (e.g. R/R)</label>
          <input
            id="new-player-bats"
            className="portal__input"
            value={newPlayerForm.battingThrowing}
            onChange={handleNewPlayerFieldChange("battingThrowing")}
          />

          <label className="portal__label" htmlFor="new-player-email">Contact Email</label>
          <input
            id="new-player-email"
            className="portal__input"
            value={newPlayerForm.contactEmail}
            onChange={handleNewPlayerFieldChange("contactEmail")}
          />

          <button
            type="submit"
            className="portal__button"
            disabled={createPlayerMutation.isPending}
            style={{ marginTop: 12 }}
          >
            {createPlayerMutation.isPending ? "Adding..." : "Add Player"}
          </button>
        </form>
      )}

      {team ? (
        <>
          {/* ✅ PLAYERS TAB */}
          {activeTab === "players" && (
            <div className="players__team__block">
              {teamCoaches.length > 0 && (
                <div className="players__coaches">
                  <h3 className="players__coaches-title">Coaching Staff</h3>
                  <div className="players__coaches-list">
                    {teamCoaches.map((coach) => (
                      <div key={coach._id} className="players__coach-card">
                        <strong>{coach.name}</strong>
                        {coach.coachTitle && <span> — {coach.coachTitle}</span>}
                        {coach.email && (
                          <a className="players__coach-link" href={`mailto:${coach.email}`}>
                            ✉ {coach.email}
                          </a>
                        )}
                        {coach.phone && (
                          <a className="players__coach-link" href={`tel:${coach.phone}`}>
                            ☎ {coach.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="players__team__grid">
                {players.map((player) => (
                  <div key={player._id} className="player__card">
                    <div className="player__image">
                      {resolveImageUrl(player.image) ? (
                        <img src={resolveImageUrl(player.image)} alt={player.name} />
                      ) : (
                        <div className="player__image-placeholder">
                          {player.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    <h4>{player.name}</h4>

                    <p className="player__info">
                      <span>#{player.jersey}</span> | {player.position}
                    </p>

                    <p className="player__details">
                      Grad Year: {player.gradYear}
                      <br />
                      {player.highSchool}
                    </p>

                    <button
                      type="button"
                      className="player__profile-btn"
                      onClick={() => {
                        if (!isLoggedIn) {
                          onViewProfile(player);
                          return;
                        }
                        onViewProfile(player);
                      }}
                    >
                      View Profile
                    </button>

                    {canDownloadRoster && (
                      <button
                        type="button"
                        className="player__delete-btn"
                        onClick={() => handleDeletePlayer(player)}
                        disabled={deletePlayerMutation.isPending}
                      >
                        Remove from Roster
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ CHAT TAB */}
          {activeTab === "chat" &&
            (canAccessThisTeamChat ? (
              <ChatHub
                teamId={team._id}
                token={token}
                currentUser={currentUser}
                canManageGroups={["coach", "admin"].includes(currentUser?.role)}
              />
            ) : (
              <p style={{ color: "#9fbad1", textAlign: "center" }}>
                You must be logged in and on this team to access the chat.
              </p>
            ))}

          {activeTab === "announcements" &&
            (isLoggedIn ? (
              <div className="players__team__block">
                {announcements.length === 0 && (
                  <p className="portal__empty">No announcements yet.</p>
                )}
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="portal__card">
                    <strong>{announcement.title}</strong>
                    <p className="portal__card-meta">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                    <p className="portal__card-body">{announcement.body}</p>
                    {announcement.imageUrl && (
                      <img
                        src={resolveMediaUrl(announcement.imageUrl)}
                        alt=""
                        style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, marginTop: 8 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#9fbad1", textAlign: "center" }}>
                You must be logged in to see announcements.
              </p>
            ))}
        </>
      ) : (
        <p style={{ textAlign: "center", color: "#ccc" }}>
          Team not found or no team selected.
        </p>
      )}

      {selectedPlayer &&
        isProfileModalOpen &&
        (isLoggedIn ? (
          <PlayerProfileModal
            player={selectedPlayer}
            onClose={onClose}
            currentUser={currentUser}
            token={token}
          />
        ) : (
          <PlayerProfilePreviewModal
            player={selectedPlayer}
            openLogin={openLogin}
            onClose={onClose}
          />
        ))}
    </section>
  );
}

export default Players;
