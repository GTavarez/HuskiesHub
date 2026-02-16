import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, uploadAvatar } from "../../api/auth.js";
import { queryKeys } from "../../api/queryKeys.js";
import { useToast } from "../../context/ToastContext.js";
import "./EditProfileModal.css";

function EditProfileModal({ currentUser, token, onClose, onUpdate }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: ({ nextName, nextAvatar }) =>
      updateUserProfile(nextName, nextAvatar, token),
    onSuccess: (_, variables) => {
      onUpdate({
        _id: currentUser._id,
        name: variables.nextName,
        avatar: variables.nextAvatar,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentUser(token),
      });
      pushToast({ type: "success", message: "Profile updated." });
      onClose();
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Profile update failed.",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => uploadAvatar(file, token),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newAvatar = currentUser.avatar;
    try {
      if (avatarFile) {
        const avatarRes = await uploadAvatarMutation.mutateAsync(avatarFile);
        newAvatar = avatarRes.avatar;
        setAvatarPreview(newAvatar);
      }

      updateProfileMutation.mutate({
        nextName: name,
        nextAvatar: newAvatar,
      });
    } catch (err) {
      pushToast({
        type: "error",
        message: err?.message || "Avatar upload failed.",
      });
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
