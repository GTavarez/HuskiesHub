import "./App.css";
import Header from "../Header/Header.jsx";
import Schedule from "../Schedule/Schedule.jsx";
import Main from "../Main/Main.jsx";
import SignUpModal from "../SignUpModal/SignUpModal.jsx";
import SignInModal from "../SignInModal/SignInModal.jsx";
import Players from "../Players/Players.jsx";
import Teams from "../Teams/Teams.jsx";
import CollegeCommits from "../CollegeCommits/CollegeCommits.jsx";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signin, signup, getCurrentUser } from "../../api/auth.js";
import { queryKeys } from "../../api/queryKeys.js";
import { useToast } from "../../context/ToastContext.js";

import CurrentUserContext from "../../context/CurrentUserContext.js";
import MyProfile from "../MyProfile/MyProfile.jsx";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute.jsx";
import Coaches from "../Coaches/Coaches.jsx";
import Clinics from "../Clinics/Clinics.jsx";
import Contact from "../Contact/Contact.jsx";
import EditProfileModal from "../EditProfileModal/EditProfileModal.jsx";
import Footer from "../Footer/Footer.jsx";
import { useEffect } from "react";

function App() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [token, setToken] = useState(() => localStorage.getItem("jwt"));
  const [user, setUser] = React.useState(null);
  const [activeModal, setActiveModal] = React.useState("");

  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const hasShownSessionToast = React.useRef(false);

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
    error: currentUserError,
  } = useQuery({
    queryKey: queryKeys.currentUser(token),
    queryFn: () => getCurrentUser(token),
    enabled: Boolean(token),
    retry: 1,
  });
  const openSignUpModal = () => {
    setActiveModal("Sign up");
  };
  const openSignInModal = () => {
    setActiveModal("Sign in");
  };
  const closeActiveModal = () => {
    setActiveModal("");
  };
  const closeFullProfileModal = () => {
    setSelectedPlayer(null);
    setIsProfileModalOpen(false);
  };
  const openFullProfileModal = (player) => {
    setSelectedPlayer(player);
    setIsProfileModalOpen(true);
    setActiveModal("profile");
  };
  const openEditProfileModal = (mode) => {
    setEditMode(mode);
    setIsEditProfileOpen(true);
  };
  const handleCloseEditProfile = () => {
    setIsEditProfileOpen(false);
    setEditMode(null);
  };
  const handleSaveProfile = (updatedUser) => {
    console.log("Updated user in App:", updatedUser);
    setUser(updatedUser);
    setIsEditProfileOpen(false);
  };
  useEffect(() => {
    if (!currentUser) return;
    setUser(currentUser);
    setIsLoggedIn(true);
  }, [currentUser]);

  useEffect(() => {
    if (!token || !isUserError) return;
    if (currentUserError?.status === 401 && !hasShownSessionToast.current) {
      pushToast({
        type: "error",
        message: "Your session expired. Please sign in again.",
      });
      hasShownSessionToast.current = true;
    }
    localStorage.removeItem("jwt");
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
    queryClient.removeQueries({ queryKey: ["currentUser"] });
  }, [currentUserError, isUserError, pushToast, queryClient, token]);

  const signInMutation = useMutation({
    mutationFn: signin,
    onSuccess: (data) => {
      hasShownSessionToast.current = false;
      localStorage.setItem("jwt", data.token);
      setToken(data.token);
      setActiveModal("");
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentUser(data.token),
      });
      pushToast({ type: "success", message: "Welcome back!" });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Login failed.",
      });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: signup,
    onSuccess: (_, variables) => {
      signInMutation.mutate({
        email: variables.email,
        password: variables.password,
      });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Registration failed.",
      });
    },
  });

  const handleSignUp = ({ name, email, password, confirmPassword }) => {
    signUpMutation.mutate({ name, email, password, confirmPassword });
  };

  const handleSignIn = ({ email, password }) => {
    signInMutation.mutate({ email, password });
  };
  const switchToSignUp = () => {
    setTimeout(() => {
      setActiveModal("Sign up");
    });
  };
  const switchToSignIn = () => {
    setTimeout(() => setActiveModal("Sign in"));
  };
  const switchToLogIn = () => {
    closeFullProfileModal();
    setActiveModal("Sign in");
  };

  const handleSignOut = () => {
    hasShownSessionToast.current = false;
    localStorage.removeItem("jwt");
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
    queryClient.removeQueries({ queryKey: ["currentUser"] });
  };

  if (isUserLoading && token) {
    return <div>Loading...</div>;
  }
  return (
    <BrowserRouter>
      <CurrentUserContext.Provider value={user}>
        <div className="page">
          <Header
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
            onClick={openSignUpModal}
            openSignInModal={openSignInModal}
            onSignOut={handleSignOut}
          />
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/collegecommits" element={<CollegeCommits />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/teams/:teamsId"
              element={
                <Players
                  onViewProfile={openFullProfileModal}
                  onClose={closeFullProfileModal}
                  selectedPlayer={selectedPlayer}
                  isLoggedIn={isLoggedIn}
                  openLogin={switchToLogIn}
                  isProfileModalOpen={isProfileModalOpen}
                  currentUser={user}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <MyProfile
                    currentUser={user}
                    onEditProfile={openEditProfileModal}
                    onUpdateUser={openEditProfileModal}
                    onClose={handleCloseEditProfile}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        {activeModal === "Sign up" && (
          <SignUpModal
            activeModal={activeModal}
            isOpen={activeModal === "Sign up"}
            onClose={closeActiveModal}
            onSignInModal={switchToSignIn}
            onRegister={handleSignUp}
          />
        )}
        {activeModal === "Sign in" && (
          <SignInModal
            isOpen={activeModal === "Sign in"}
            onClose={closeActiveModal}
            onSignUpModal={switchToSignUp}
            onSignIn={handleSignIn}
          />
        )}
        {isEditProfileOpen && (
          <EditProfileModal
            currentUser={user}
            token={token}
            mode={editMode} // PASS MODE HERE
            onClose={handleCloseEditProfile}
            onUpdate={handleSaveProfile}
          />
        )}
        <Footer />
      </CurrentUserContext.Provider>
    </BrowserRouter>
  );
}
export default App;
