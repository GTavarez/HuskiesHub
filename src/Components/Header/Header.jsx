import "./Header.css";
import { Link } from "react-router-dom";
import React from "react";
import logo from "../../assets/logo.png";
import CurrentUserContext from "../../context/CurrentUserContext";

function Header({ onSignUp, onClick, onSignOut, openSignInModal }) {
  const currentUser = React.useContext(CurrentUserContext);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  const closeDropdown = () => {
    setIsOpen(false);
  };
  const renderImage = () => {
    if (currentUser?.image) {
      return (
        <img
          src={currentUser.image}
          alt={currentUser.name}
          className="header__image"
          onClick={toggleProfileMenu}
        />
      );
    } else {
      const firstLetter = currentUser?.name
        ? currentUser.name.charAt(0).toUpperCase()
        : "?";
      return (
        <div className="header__initials" onClick={toggleProfileMenu}>
          {firstLetter}
        </div>
      );
    }
  };
  return (
    <header className="header">
      <div className="header__spacer">
        <Link to="/">
          <img src={logo} alt="HuskiesHub Logo" className="header__logo" />
        </Link>
        <div className="header__title"></div>
      </div>
      <div className="header__nav">
        <button className="header__nav-button">
          <Link to="/" className="header__nav-link">
            Home
          </Link>
        </button>
        <button className="header__nav-button">
          <Link to="/teams" className="header__nav-link">
            Teams
          </Link>
        </button>
        <button className="header__nav-button">
          <Link to="/schedule" className="header__nav-link">
            Schedule
          </Link>
        </button>

        <button
          className={
            isOpen ? "header__nav-dropbuttons-open" : "header__nav-dropbuttons"
          }
          onClick={toggleDropdown}
        >
          More ▼
        </button>
        {isOpen && (
          <div className="header__nav-dropdown_menu">
            <button className="header__dropdown_button" type="button">
              <Link
                to="/coaches"
                className="header__dropdown-link"
                onClick={closeDropdown}
              >
                Coaches
              </Link>
            </button>
            <button className="header__dropdown_button" type="button">
              <Link
                to="/collegecommits"
                className="header__dropdown-link"
                onClick={closeDropdown}
              >
                College Commits
              </Link>
            </button>
            <button className="header__dropdown_button" type="button">
              <Link
                to="/clinics"
                className="header__dropdown-link"
                onClick={closeDropdown}
              >
                Clinics
              </Link>
            </button>
          </div>
        )}
        {currentUser ? (
          <div className="header__profile">
            {renderImage()}

            {isProfileMenuOpen && (
              <div className="header__profile-menu">
                <Link
                  to="/profile"
                  className="header__dropdown-link"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    closeDropdown;
                  }}
                >
                  My Profile
                </Link>
                <button onClick={onSignOut} className="header__dropdown-link">
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="header__nav-button" onClick={openSignInModal}>
              Login
            </button>
            <button className="header__signup_button" onClick={onClick}>
              Join Team
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
