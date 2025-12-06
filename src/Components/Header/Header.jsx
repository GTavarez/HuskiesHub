import "./Header.css";
import { Link } from "react-router-dom";
import React from "react";
import logo from "../../assets/logo.png";
import CurrentUserContext from "../../context/CurrentUserContext";

function Header({ onSignUp, onClick, onSignOut, openSignInModal }) {
  const currentUser = React.useContext(CurrentUserContext);

  const [navOpen, setNavOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const toggleHamburger = () => {
    setNavOpen((prev) => !prev);
    setDropdownOpen(false);
    setProfileOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const toggleProfileMenu = () => {
    setProfileOpen((prev) => !prev);
  };

  const closeAllMenus = () => {
    setNavOpen(false);
    setDropdownOpen(false);
    setProfileOpen(false);
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
    }
    const firstLetter = currentUser?.name
      ? currentUser.name.charAt(0).toUpperCase()
      : "?";

    return (
      <div className="header__initials" onClick={toggleProfileMenu}>
        {firstLetter}
      </div>
    );
  };

  return (
    <header className="header">
      <Link to="/">
        <img src={logo} alt="HuskiesHub Logo" className="header__logo" />
      </Link>

      {/* HAMBURGER BUTTON */}
      <button className="header__hamburger" onClick={toggleHamburger}>
        <span className={navOpen ? "bar bar1 open" : "bar bar1"}></span>
        <span className={navOpen ? "bar bar2 open" : "bar bar2"}></span>
        <span className={navOpen ? "bar bar3 open" : "bar bar3"}></span>
      </button>

      {/* NAVIGATION */}
      <nav className={navOpen ? "header__nav open" : "header__nav"}>
        <Link to="/" className="header__nav-link" onClick={closeAllMenus}>
          Home
        </Link>
        <Link to="/teams" className="header__nav-link" onClick={closeAllMenus}>
          Teams
        </Link>
        <Link
          to="/schedule"
          className="header__nav-link"
          onClick={closeAllMenus}
        >
          Schedule
        </Link>

        {/* DROPDOWN */}
        <button className="header__nav-dropbuttons" onClick={toggleDropdown}>
          More ▼
        </button>
        {dropdownOpen && (
          <div className="header__nav-dropdown_menu">
            <Link to="/coaches" className="header__dropdown-link" onClick={closeAllMenus}>
              Coaches
            </Link>
            <Link to="/collegecommits" className="header__dropdown-link" onClick={closeAllMenus}>
              College Commits
            </Link>
            <Link to="/clinics" className="header__dropdown-link" onClick={closeAllMenus}>
              Clinics
            </Link>
          </div>
        )}

        {/* PROFILE MENU */}
        {currentUser ? (
          <>
            {renderImage()}
            {profileOpen && (
              <div className="header__profile-menu">
                <Link
                  to="/profile"
                  className="header__dropdown-link"
                  onClick={closeAllMenus}
                >
                  My Profile
                </Link>
                <button onClick={onSignOut} className="header__dropdown-link">
                  Log Out
                </button>
              </div>
            )}
          </>
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
      </nav>
    </header>
  );
}

export default Header;
