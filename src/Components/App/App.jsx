import "./App.css";
import Header from "../../features/shared/Header/Header.jsx";
import Schedule from "../../features/schedule/Schedule/Schedule.jsx";
import Main from "../../features/public-site/Main/Main.jsx";
import SignUpModal from "../../features/shared/SignUpModal/SignUpModal.jsx";
import SignInModal from "../../features/shared/SignInModal/SignInModal.jsx";
import ForgotPasswordModal from "../../features/shared/ForgotPasswordModal/ForgotPasswordModal.jsx";
import ResetPasswordPage from "../../features/shared/ResetPasswordPage/ResetPasswordPage.jsx";
import Players from "../../features/teams/Players/Players.jsx";
import Teams from "../../features/teams/Teams/Teams.jsx";
import CollegeCommits from "../../features/public-site/CollegeCommits/CollegeCommits.jsx";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signin, signup, getCurrentUser } from "../../api/auth.js";
import { queryKeys } from "../../api/queryKeys.js";
import { useToast } from "../../context/ToastContext.js";

import CurrentUserContext from "../../context/CurrentUserContext.js";
import MyProfile from "../../features/profile/MyProfile/MyProfile.jsx";
import ProtectedRoute from "../../features/shared/ProtectedRoute/ProtectedRoute.jsx";
import Coaches from "../../features/public-site/Coaches/Coaches.jsx";
import Clinics from "../../features/public-site/Clinics/Clinics.jsx";
import Contact from "../../features/public-site/Contact/Contact.jsx";
import EditProfileModal from "../../features/profile/EditProfileModal/EditProfileModal.jsx";
import Footer from "../../features/shared/Footer/Footer.jsx";
import AdminDashboard from "../../features/admin/AdminDashboard/AdminDashboard.jsx";
import ParentDashboard from "../../features/parent-portal/ParentDashboard/ParentDashboard.jsx";
import CoachDashboard from "../../features/coach-portal/CoachDashboard/CoachDashboard.jsx";
import PaymentSuccess from "../../features/payments/PaymentSuccess/PaymentSuccess.jsx";
import PaymentCancel from "../../features/payments/PaymentCancel/PaymentCancel.jsx";
import CollegeCoachDashboard from "../../features/recruiting/CollegeCoachDashboard/CollegeCoachDashboard.jsx";
import { routeConfig } from "../../routes/routeConfig.js";
import { useEffect } from "react";

const rolesFor = (path) => routeConfig.find((route) => route.path === path)?.roles;

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
    setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
    setIsEditProfileOpen(false);
  };
  useEffect(() => {
    if (!currentUser) return;
    setUser(currentUser);
    setIsLoggedIn(true);
  }, [currentUser]);

  useEffect(() => {
    if (!token || !isUserError) return;
    if (currentUserError?.status !== 401) return;
    if (!hasShownSessionToast.current) {
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
  const switchToForgotPassword = () => {
    setTimeout(() => setActiveModal("Forgot Password"));
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

  // Keep showing a loading state until the `user`/`isLoggedIn` state (synced from
  // `currentUser` via effect, one tick after the query resolves) has caught up —
  // otherwise a hard reload on a protected route redirects home before session
  // restoration finishes, since ProtectedRoute would briefly see isLoggedIn: false.
  if (token && !isLoggedIn && !isUserError) {
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
          <Route path="/" element={<Main onJoinClick={openSignUpModal} />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/collegecommits" element={<CollegeCommits />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage onLoginClick={openSignInModal} />}
          />
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
                token={token}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <MyProfile
                  currentUser={user}
                  token={token}
                  onEditProfile={openEditProfileModal}
                  onUpdateUser={openEditProfileModal}
                  onClose={handleCloseEditProfile}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                currentUser={user}
                roles={rolesFor("/admin")}
              >
                <AdminDashboard token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                currentUser={user}
                roles={rolesFor("/parent")}
              >
                <ParentDashboard currentUser={user} token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                currentUser={user}
                roles={rolesFor("/coach")}
              >
                <CoachDashboard currentUser={user} token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/success"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/cancel"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PaymentCancel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/college-coach"
            element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                currentUser={user}
                roles={rolesFor("/college-coach")}
              >
                <CollegeCoachDashboard token={token} />
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
          onForgotPassword={switchToForgotPassword}
        />
      )}
      {activeModal === "Forgot Password" && (
        <ForgotPasswordModal
          isOpen={activeModal === "Forgot Password"}
          onClose={closeActiveModal}
          onBackToSignIn={switchToSignIn}
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
