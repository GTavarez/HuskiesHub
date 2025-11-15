import React from "react";
import "./MyProfile.css";

function MyProfile({ currentUser }) {
  const isPlayer = Boolean(currentUser?.playerData);

  return (
    <section className="profile">
      <div className="profile__container">
        {/* AVATAR */}
        <div className="profile__header">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="profile__avatar"
            />
          ) : (
            <div className="profile__avatar-placeholder">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <h2 className="profile__name">{currentUser?.name}</h2>
          <p className="profile__email">{currentUser?.email}</p>
        </div>

        {/* GUEST INFO */}
        {!isPlayer && (
          <div className="profile__card">
            <h3 className="profile__card-title">Account Details</h3>
            <p>You are logged in as a guest.</p>
            <p>
              You can browse teams, view the schedule, and explore the site.
            </p>
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
      </div>
    </section>
  );
}

export default MyProfile;
