import "./Players.css";
/* import { playersData } from "../../../utils/constants"; */
import { useParams, useNavigate } from "react-router-dom";
import PlayerProfileModal from "../PlayerProfile/PlayerProfileModal";
import PlayerProfilePreviewModal from "../PlayerProfilePreviewModal/PlayerProfilePreviewModal";
import { useState } from "react";
import TeamChat from "../../chat/TeamChat/TeamChat";
import { useQuery } from "@tanstack/react-query";
import { getTeam, getTeamPlayers } from "../../../api/teams";
import { resolveImageUrl } from "../../../utils/media";

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
  const { teamsId } = useParams();

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
        </div>

        <button className="players__back-btn" onClick={handleBack}>
          ← Back to Teams
        </button>

        <h2>{team ? `${team.name} ${team.ageGroup}` : "Teams"}</h2>
        <div className="players__divider"></div>
      </header>

      {team ? (
        <>
          {/* ✅ PLAYERS TAB */}
          {activeTab === "players" && (
            <div className="players__team__block">
              <div className="players__team__grid">
                {players.map((player) => (
                  <div key={player._id} className="player__card">
                    <div className="player__image">
                      <img
                        src={resolveImageUrl(player.image)}
                        alt={player.name}
                      />
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ CHAT TAB */}
          {activeTab === "chat" &&
            (canAccessThisTeamChat ? (
              <TeamChat teamId={team._id} />
            ) : (
              <p style={{ color: "#9fbad1", textAlign: "center" }}>
                You must be logged in and on this team to access the chat.
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
