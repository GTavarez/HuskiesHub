import "./App.css";
import Header from "../Header/Header.jsx";
import Calendar from "../Calendar/Calendar.jsx";
import Main from "../Main/Main.jsx";
import Profile from "../Profile/Profile.jsx";
import SignUpModal from "../SignUpModal/SignUpModal.jsx";
import SignInModal from "../SignInModal/SignInModal.jsx";
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
  const openSignInModal = () => {
    setActiveModal("Sign in");
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
  const handleRegistration = ({ name, email, password, confirmPassword }) => {
    signup({ name, email, password, confirmPassword })
      .then((data) => {
        // data now contains token + user
        if (!data?.token || !data?.user) {
          throw new Error("Signup did not return token or user");
        }

        localStorage.setItem("jwt", data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setIsSignUpOpen(false);
      })
      .catch((error) => {
        console.error("Registration error", error);
      });
  };
  /*  const handleRegistration = ({ name, email, password, confirmPassword }) => {
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
      .catch((error) => {
        console.error("Registration error", error);
      });
  }; */

  return (
    <BrowserRouter>
      <div className="page">
        <Header
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onClick={openSignUpModal}
          openSignInModal={openSignInModal}
        />
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
        onSignInModal={switchToSignIn}
        onRegister={handleRegistration}
      />
      ){activeModal === "Sign in"} && (
      <SignInModal
        isOpen={activeModal === "Sign in"}
        onClose={closeActiveModal}
        onSignUpModal={switchToSignUp}
        onSignIn={handleSignIn}
      />
      )
    </BrowserRouter>
  );
}
export default App;
