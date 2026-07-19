import "./Header.css";
import { Link } from "react-router-dom";
import React from "react";
import logo from "../../../assets/logo.png";
import CurrentUserContext from "../../../context/CurrentUserContext";
import { resolveMediaUrl } from "../../../utils/media.js";
import { routeConfig } from "../../../routes/routeConfig.js";

const MORE_LINKS = routeConfig.filter((route) => route.group === "more");

function Header({ onClick, onSignOut, openSignInModal }) {
  const currentUser = React.useContext(CurrentUserContext);

  const [navOpen, setNavOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const navRef = React.useRef(null);

  const portalLink = routeConfig.find(
    (route) =>
      route.group === "profile" &&
      Array.isArray(route.roles) &&
      route.roles.includes(currentUser?.role)
  );

  const toggleHamburger = () => {
    setNavOpen((prev) => !prev);
    setDropdownOpen(false);
    setProfileOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    setProfileOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileOpen((prev) => !prev);
    setDropdownOpen(false);
  };

  const closeAllMenus = () => {
    setNavOpen(false);
    setDropdownOpen(false);
    setProfileOpen(false);
  };

  // Close any open dropdown when clicking outside the nav — previously the
  // only way to close one was clicking a link inside it.
  React.useEffect(() => {
    if (!dropdownOpen && !profileOpen) return undefined;
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, profileOpen]);

  const renderImage = () => {
    if (currentUser?.avatar) {
      return (
        <img
          src={resolveMediaUrl(currentUser.avatar)}
          alt={currentUser.name}
          className="header__image"
        />
      );
    }
    const firstLetter = currentUser?.name
      ? currentUser.name.charAt(0).toUpperCase()
      : "?";

    return <div className="header__initials">{firstLetter}</div>;
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
      <nav className={navOpen ? "header__nav open" : "header__nav"} ref={navRef}>
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

        {currentUser && portalLink && (
          <Link
            to={portalLink.path}
            className="header__nav-portal-link"
            onClick={closeAllMenus}
          >
            {portalLink.label}
          </Link>
        )}

        {/* DROPDOWN */}
        <button
          className={
            dropdownOpen ? "header__nav-dropbuttons header__nav-dropbuttons-open" : "header__nav-dropbuttons"
          }
          onClick={toggleDropdown}
        >
          More ▾
        </button>
        {dropdownOpen && (
          <div className="header__nav-dropdown_menu">
            {MORE_LINKS.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className="header__dropdown-link"
                onClick={closeAllMenus}
              >
                {route.label}
              </Link>
            ))}
          </div>
        )}

        {/* PROFILE MENU */}
        {currentUser ? (
          <>
            <button className="header__user-chip" onClick={toggleProfileMenu} type="button">
              {renderImage()}
              <span className="header__user-chip-name">{currentUser.name}</span>
              <span className="header__user-chip-chevron">▾</span>
            </button>
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
