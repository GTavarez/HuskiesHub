import "./Clinics.css";
import React from "react";

function Clinics() {
  return (
    <section className="clinics">
      <h1 className="clinics__title">Clinics & Training Programs</h1>

      {/* ------------ LIVE AT BATS -------------- */}
      <div className="clinic__card">
        <h2 className="clinic__header">High School Live At Bats</h2>
        <p className="clinic__subheader">
          Sessions led by Coach Allie @ Advanced Player Academy Waldwick, NJ
        </p>

        <div className="clinic__info">
          <p>⏰ <strong>Time:</strong> 5:30 PM – 7:00 PM</p>
          <p>📅 <strong>Wednesdays:</strong> 11/19 – 12/17</p>

          <h3 className="clinic__section">What's Included</h3>
          <ul>
            <li>90-minute sessions featuring:</li>
            <ul className="clinic__list-indent">
              <li>Tee Work</li>
              <li>Front Toss</li>
              <li>Live At-Bats</li>
            </ul>

            <li>Position breakdown</li>
            <ul className="clinic__list-indent">
              <li>2 Pitchers</li>
              <li>2 Catchers</li>
              <li>Up to 4 Hitters</li>
            </ul>
          </ul>

          <p>📍 <strong>Location:</strong> 152 N Franklin Turnpike, Waldwick, NJ 07463</p>

          <p className="clinic__price">
            💵 <strong>5-Week Package:</strong> $175  
            <br />
            💵 <strong>Drop-In:</strong> $40
          </p>

          <p className="clinic__note">
            * Discounts available for Empire State Huskies players
          </p>

          <p className="clinic__cta">
            🔔 Sign up for the 5-week package to lock in early winter pricing for Winter Session 2!
          </p>

          <div className="clinic__contact">
            <p>📧 cesportraining@gmail.com</p>
            <p>📞 973-800-0356</p>
          </div>
        </div>
      </div>

      {/* ------------ HITTING & ROTATIONAL POWER -------------- */}
      <div className="clinic__card">
        <h2 className="clinic__header">Complete Hitting & Rotational Power Program</h2>

        <p className="clinic__subheader">
          Unlock your power this winter with our elite-level training program.
        </p>

        <div className="clinic__info">
          <p>🗓️ <strong>Mondays & Wednesdays</strong></p>
          <p>⏰ <strong>7:00 PM – 8:30 PM</strong></p>
          <p>📅 <strong>Winter Session 1:</strong> 11/10 – 12/17</p>

          <h3 className="clinic__section">Program Breakdown</h3>
          <ul>
            <li>
              <strong>60 minutes:</strong> Strength & mobility training — hip mobility, rotational core strength,
              power development, compound movement work
            </li>
            <li>
              <strong>30 minutes:</strong> Cage work — targeted hitting drills focused on swing power and mechanics
            </li>
          </ul>

          <h3 className="clinic__section">Results You Can Expect</h3>
          <ul className="clinic__checklist">
            <li>✔ Improved hip mobility & rotational speed</li>
            <li>✔ Increased exit velocity & bat control</li>
            <li>✔ Stronger, more balanced swing mechanics</li>
            <li>✔ Greater confidence at the plate</li>
          </ul>

          <h3 className="clinic__section">Location</h3>
          <p>📍 Advance Player Academy  
            <br />152 N Franklin Ave, Waldwick NJ 07463
          </p>

          <h3 className="clinic__section">Pricing</h3>
          <p className="clinic__price">
            💳 <strong>12-Session Package:</strong> $240
            <br />
            💳 <strong>Single Session:</strong> $25
          </p>

          <div className="clinic__contact">
            <p>📧 cesportraining@gmail.com</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Clinics;
