import React from "react";
import { useNavigate } from "react-router-dom";
import "./MyProfile.css";
import "../../shared/portal.css";
import { resolveMediaUrl } from "../../../utils/media.js";
import RecruitingProfileEditor from "../../recruiting/RecruitingProfileEditor/RecruitingProfileEditor.jsx";
import CollegeCoachAccessRequest from "../../recruiting/CollegeCoachAccessRequest/CollegeCoachAccessRequest.jsx";
import RoleAccessRequest from "../RoleAccessRequest/RoleAccessRequest.jsx";
import PerformanceProgress from "../../performance/PerformanceProgress/PerformanceProgress.jsx";

function MyProfile({ currentUser, token, onUpdateUser, onClose }) {
  const isPlayer = Boolean(currentUser?.playerData);
  const avatarSrc = resolveMediaUrl(currentUser?.avatar);
  const navigate = useNavigate();

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
    navigate("/");
  };

  return (
    <section className="profile">
      <div className="profile__container">
        <button className="profile__close-btn" onClick={handleClose}>
          ×
        </button>
        {/* AVATAR */}
        <div className="profile__header">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={currentUser.name}
              className="profile__avatar"
            />
          ) : (
            <div className="profile__avatar-placeholder">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <button className="profile__edit-avatar-btn" onClick={onUpdateUser}>
            Upload Avatar
          </button>

          <h2 className="profile__name">{currentUser?.name}</h2>
          <p className="profile__email">{currentUser?.email}</p>

          <button className="profile__edit-btn" onClick={() => onUpdateUser()}>
            Edit Profile
          </button>
        </div>

        {currentUser?.role === "fan" && (
          <div className="portal__section">
            <h3 className="profile__card-title">Get Access</h3>
            <RoleAccessRequest currentUser={currentUser} token={token} />
          </div>
        )}

        {/* GUEST INFO */}
        {!isPlayer && (
          <div className="profile__card">
            <h3 className="profile__card-title">Account Details</h3>
            <p>You are logged in as a guest.</p>
            <p>You can browse teams and view the schedule.</p>
          </div>
        )}

        {/* PLAYER DETAILS */}
        {isPlayer && (
          <div className="profile__card">
            <h3 className="profile__card-title">Player Information</h3>
            <p>
              <strong>Jersey:</strong> {currentUser.playerData.jersey}
            </p>
            <p>
              <strong>Position:</strong> {currentUser.playerData.position}
            </p>
            <p>
              <strong>Graduation Year:</strong>{" "}
              {currentUser.playerData.gradYear}
            </p>
            <p>
              <strong>High School:</strong> {currentUser.playerData.highSchool}
            </p>
            <p>
              <strong>GPA:</strong> {currentUser.playerData.GPA}
            </p>
          </div>
        )}

        {isPlayer && (
          <div className="portal__section">
            <h3 className="profile__card-title">Recruiting Profile</h3>
            <RecruitingProfileEditor
              playerId={currentUser.playerData._id}
              token={token}
              player={currentUser.playerData}
            />
          </div>
        )}

        {isPlayer && (
          <div className="portal__section">
            <h3 className="profile__card-title">Performance Progress</h3>
            <PerformanceProgress playerId={currentUser.playerData._id} token={token} />
          </div>
        )}

        <div className="portal__section">
          <h3 className="profile__card-title">College Coach Access</h3>
          <CollegeCoachAccessRequest currentUser={currentUser} token={token} />
        </div>
      </div>
    </section>
  );
}

export default MyProfile;
