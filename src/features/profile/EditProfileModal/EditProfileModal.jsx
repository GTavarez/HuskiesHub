import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, uploadAvatar, changePassword } from "../../../api/auth.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { resolveMediaUrl } from "../../../utils/media.js";
import "./EditProfileModal.css";

function EditProfileModal({ currentUser, token, onClose, onUpdate }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [coachTitle, setCoachTitle] = useState(currentUser?.coachTitle || "");
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(currentUser?.avatar)
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
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
    mutationFn: ({ nextName, nextAvatar, nextPhone, nextBio, nextCoachTitle }) =>
      updateUserProfile(nextName, nextAvatar, token, nextPhone, nextBio, nextCoachTitle),
    onSuccess: (data, variables) => {
      const updatedUser = data?.user ?? {
        _id: currentUser._id,
        name: variables.nextName,
        email: currentUser.email,
        avatar: variables.nextAvatar,
        phone: variables.nextPhone,
        bio: variables.nextBio,
        coachTitle: variables.nextCoachTitle,
      };
      onUpdate(updatedUser);
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

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => changePassword(payload, token),
    onSuccess: () => {
      pushToast({ type: "success", message: "Password changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPassword(false);
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to change password." });
    },
  });

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      pushToast({ type: "error", message: "New passwords do not match." });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newAvatar = currentUser.avatar;
    try {
      if (avatarFile) {
        const avatarRes = await uploadAvatarMutation.mutateAsync(avatarFile);
        newAvatar = avatarRes.avatar;
        setAvatarPreview(resolveMediaUrl(newAvatar));
      }

      updateProfileMutation.mutate({
        nextName: name,
        nextAvatar: newAvatar,
        nextPhone: phone,
        nextBio: bio,
        nextCoachTitle: coachTitle,
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

          <label className="editProfile__label">
            Phone Number
            <input
              type="tel"
              className="editProfile__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
            />
          </label>

          {(currentUser?.role === "coach" || currentUser?.role === "admin") && (
            <>
              <label className="editProfile__label">
                Coaching Title
                <input
                  type="text"
                  className="editProfile__input"
                  value={coachTitle}
                  onChange={(e) => setCoachTitle(e.target.value)}
                  placeholder="e.g. Head Coach, Pitching Coach"
                />
              </label>
              <label className="editProfile__label">
                Bio
                <textarea
                  className="editProfile__input"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell parents and players a bit about your coaching background..."
                />
              </label>
            </>
          )}

          <button className="editProfile__saveBtn" type="submit">
            Save Changes
          </button>
        </form>

        <div className="editProfile__passwordSection">
          <button
            type="button"
            className="editProfile__uploadBtn"
            onClick={() => setIsChangingPassword((prev) => !prev)}
          >
            {isChangingPassword ? "Cancel Password Change" : "Change Password"}
          </button>

          {isChangingPassword && (
            <form className="editProfile__form" onSubmit={handleChangePassword}>
              <label className="editProfile__label">
                Current Password
                <input
                  type="password"
                  className="editProfile__input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </label>
              <label className="editProfile__label">
                New Password
                <input
                  type="password"
                  className="editProfile__input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label className="editProfile__label">
                Confirm New Password
                <input
                  type="password"
                  className="editProfile__input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <button
                className="editProfile__saveBtn"
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Saving..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
