import React from "react";
import "./Footer.css";
import { NavLink } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <h3 className="footer__logo">HuskiesHub</h3>
          <p className="footer__tagline">
            Empire State Huskies – building athletes on and off the field.
          </p>
        </div>

        <div className="footer__links">
          <div className="footer__column">
            <h4>Program</h4>
            <NavLink to="/schedule">Schedule</NavLink>
            <NavLink to="/college-commits">College Commits</NavLink>
            <NavLink to="/coaches">Coaches</NavLink>
            <NavLink to="/clinics">Clinics</NavLink>
          </div>

          <div className="footer__column">
            <h4>Connect</h4>
            <a href="mailto:info@huskieshub.com">Email</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              X / Twitter
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© {year} HuskiesHub. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;
