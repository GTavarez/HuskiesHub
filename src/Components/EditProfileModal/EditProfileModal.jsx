// src/Components/EditProfileModal/EditProfileModal.jsx
import React, { useState } from "react";
import { updateUserProfile, uploadAvatar } from "../../utils/auth.js";
import "./EditProfileModal.css";

function EditProfileModal({ currentUser, token, onClose, onUpdate }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);

    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const avatarRes = await uploadAvatar(avatarFile, token);
        avatarPreview(avatarRes.avatar);
      }

      // Update name
      if (name !== currentUser.name) {
        await updateUserProfile(name, token);
      }

      onUpdate(); // reload user info
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  return (
    <div className="editProfile__overlay">
      <div className="editProfile__modal">
        <button className="editProfile__close" onClick={onClose}>
          ✕
        </button>

        <h2 className="editProfile__title">Edit Profile</h2>

        <form className="editProfile__form" onSubmit={handleSubmit}>
          {/* AVATAR */}
          <div className="editProfile__avatarSection">
            {avatarPreview ? (
              <img src={avatarPreview} className="editProfile__avatar" />
            ) : (
              <div className="editProfile__avatar placeholder">
                {name.charAt(0)}
              </div>
            )}

            <label className="editProfile__uploadBtn">
              Upload New Avatar
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* NAME */}
          <label className="editProfile__label">
            Full Name
            <input
              type="text"
              className="editProfile__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <button className="editProfile__saveBtn" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
