import "./Header.css";
import { Link } from "react-router-dom";
import React from "react";
import logo from "../../assets/logo.png";

function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
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
          <Link to="/schedule" className="header__nav-link">
            Schedule
          </Link>
        </button>
        <button className="header__nav-button">
          <Link to="/leagues" className="header__nav-link">
            Leagues
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
              <Link to="/coaches" className="header__dropdown-link">
                Coaches
              </Link>
            </button>
            <button className="header__dropdown_button" type="button">
              <Link to="/aboutteam" className="header__dropdown-link">
                About Team
              </Link>
            </button>
            <button className="header__dropdown_button" type="button">
              <Link to="/clinics" className="header__dropdown-link">
                Clinics
              </Link>
            </button>
          </div>
        )}
        <button className="header__signup_button" type="button">
          {" "}
          Join Team{" "}
        </button>
      </div>
    </header>
  );
}
export default Header;
