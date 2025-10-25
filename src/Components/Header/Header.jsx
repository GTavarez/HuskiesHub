import "./Header.css";
import { Link } from "react-router-dom";
import React from "react";
import logo from "../../assets/logo.jpg";

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
        <div className="header__title">HuskiesHub</div>
      </div>
      <div className="header__nav">
        <button className="header__nav-button">
          <Link to="/schedule" className="header__nav-link">
            Schedule
          </Link>
        </button>
        <button className="header__nav-button">
          <Link to="/coaches" className="header__nav-link">
            Coaches
          </Link>
        </button>
        <button className="header__nav-button">
          <Link to="/aboutteam" className="header__nav-link">
            About Team
          </Link>
        </button>
        <button className="header__nav-dropbuttons" onClick={toggleDropdown}>
          More ▼
        </button>
        {isOpen && (
          <div className="header__dropdown_menu">
            <button className="header__dropdown_button">
              <Link to="/news" className="header__dropdown-link">
                Leagues
              </Link>
            </button>
            <button className="header__dropdown_button">
              <Link to="/news" className="header__dropdown-link">
                Players
              </Link>
            </button>
            <button className="header__dropdown_button">
              <Link to="/news" className="header__dropdown-link">
                Clinics
              </Link>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
