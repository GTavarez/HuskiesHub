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
import { getCurrentUser, signin, signup } from "../../utils/auth.js";

import CurrentUserContext from "../../context/CurrentUserContext.js";
import MyProfile from "../MyProfile/MyProfile.jsx";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute.jsx";
import Coaches from "../Coaches/Coaches.jsx";
import Clinics from "../Clinics/Clinics.jsx";
import Contact from "../Contact/Contact.jsx";
import { updateUserProfile } from "../../utils/auth.js";
import EditProfileModal from "../EditProfileModal/EditProfileModal.jsx";
import Footer from "../Footer/Footer.jsx";
import { set } from "mongoose";

function App() {
  const [user, setUser] = React.useState(null);
  const [activeModal, setActiveModal] = React.useState("");
  const [isSignUpOpen, setIsSignUpOpen] = React.useState(false);
  const [isSignInOpen, setIsSignInOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [shouldResetLoginForm, setShouldResetLoginForm] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const token = localStorage.getItem("jwt");
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
  const handleSignUp = ({ name, email, password, confirmPassword }) => {
    signup({ name, email, password, confirmPassword })
      .then(() => {
        setIsSignUpOpen(false);
        return signin({ email, password }).then((data) => {
          localStorage.setItem("jwt", data.token);
          setIsLoggedIn(true);
          setUser(data.user);
          setIsSignInOpen(false);
        });
      })
      .catch((err) => {
        console.error("Registration error", err);
      });
  };
  const handleSignIn = ({ email, password }) => {
    signin({ email, password })
      .then((data) => {
        localStorage.setItem("jwt", data.token);
        setIsLoggedIn(true);
        return getCurrentUser(data.token);
      })
      .then((userData) => {
        /* const testPlayer = {
          _id: 101,
          name: "Antonella Sottile",
          jersey: 1,
          position: "P, CF",
          gradYear: 2026,
          highSchool: "Immaculate Heart Academy",
          GPA: 3.8,
          image: "as.jpg",
        };

        const injectedUser = {
          ...userData.user,
          playerData: testPlayer,
        }; */

        setUser(userData);
        setIsLoggedIn(true);
        setIsSignInOpen(false);
      })
      .catch((error) => {
        console.error("Login error", error.message);
      });
  };
  const switchToSignUp = () => {
    setIsSignUpOpen(true);
    setTimeout(() => {
      setActiveModal("Sign up");
    });
  };
  const switchToSignIn = () => {
    setIsSignInOpen(true);
    setTimeout(() => setActiveModal("Sign in"));
  };
  const switchToLogIn = () => {
    closeFullProfileModal();
    setActiveModal("Sign in");
  };

  const handleSignOut = () => {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    setUser(null);
    setShouldResetLoginForm(true);
  };

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
