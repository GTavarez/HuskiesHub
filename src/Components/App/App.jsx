import "./App.css";
import Header from "../Header/Header.jsx";
import Calendar from "../Calendar/Calendar.jsx";
import Main from "../Main/Main.jsx";
import Profile from "../Profile/Profile.jsx";
import SignUpModal from "../SignUpModal/SignUpModal.jsx";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import React from "react";
import { getCurrentUser, signin, signup } from "../../utils/auth.js";

function App() {
  const [user, setUser] = React.useState(null);
  const [activeModal, setActiveModal] = React.useState("");
  const [isSignUpOpen, setIsSignUpOpen] = React.useState(false);
  const [isSignInOpen, setIsSignInOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const openSignUpModal = () => {
    setActiveModal("Sign up");
  };
  const closeActiveModal = () => {
    setActiveModal("");
  };

  const handleSignUp = ({ name, email, password, confirmPassword }) => {
    signup({ name, email, password, confirmPassword })
      .then((data) => {
        return data;
      })
      .then(() => {
        setIsSignUpOpen(false);
        return signin({ email, password });
      })
      .then((data) => {
        localStorage.setItem("jwt", data.token);
        setIsLoggedIn(true);
        setUser(data.user);
      })
      .catch((err) => {
        console.log(err);
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
        setIsLoggedIn(true);
        setUser(userData.user);
        setIsSignInOpen(false);
      })
      .catch((error) => {
        console.error("Login error", error.message);
      });
  };

  return (
    <BrowserRouter>
      <div className="page">
        <Header onSignUp={handleSignUp} onSignIn={handleSignIn} onClick={openSignUpModal}/>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      {activeModal === "Sign up"} && (
      <SignUpModal
        activeModal={activeModal}
        isOpen={activeModal === "Sign up"}
        onClose={closeActiveModal}
      />
      )
    </BrowserRouter>
  );
}
export default App;
