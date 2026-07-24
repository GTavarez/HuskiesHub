import "./Main.css";
import EventsCards from "../EventsCards/EventsCards.jsx";
import AboutTeam from "../AboutTeam/AboutTeam.jsx";
import HomeBanner from "../HomeBanner/HomeBanner.jsx";
import WeatherBanner from "../WeatherBanner/WeatherBanner.jsx";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import { queryKeys } from "../../../api/queryKeys.js";
import CurrentUserContext from "../../../context/CurrentUserContext.js";

function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function Main({ onJoinClick }) {
  const currentUser = useContext(CurrentUserContext);
  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  return (
    <main className="main__content">
      <WeatherBanner />
      <section className="main__image_section">
        <div className="main__image_section_content">
          <h1 className="main__image_section_content-title">
            Empire State Huskies
          </h1>
          <p className="main__image_section_content-subtitle">
            Stronger Together • Hustle. Hit. Never Quit.
          </p>
          <div className="main__cta-row">
            <Link to="/teams" className="main__cta main__cta_primary">
              View Teams
            </Link>
            <Link to="/contact" className="main__cta main__cta_secondary">
              Join Tryouts
            </Link>
          </div>
        </div>
      </section>

      <section className="main__quick-links">
        <div className="main__quick-links_inner">
          <Link className="main__quick-card" to="/schedule">
            <span className="main__quick-title">Next Games</span>
            <span className="main__quick-copy">See this week&apos;s schedule</span>
          </Link>
          <Link className="main__quick-card" to="/teams">
            <span className="main__quick-title">Age Groups</span>
            <span className="main__quick-copy">Explore all Huskies teams</span>
          </Link>
          <Link className="main__quick-card" to="/collegecommits">
            <span className="main__quick-title">College Commits</span>
            <span className="main__quick-copy">Our athletes playing next level</span>
          </Link>
          <Link className="main__quick-card" to="/contact">
            <span className="main__quick-title">Contact Coaches</span>
            <span className="main__quick-copy">Questions, tryouts, and training</span>
          </Link>
        </div>
      </section>

      <section className="main__registration">
        <div className="main__registration_inner">
          <h2 className="main__registration_title">Team Registration</h2>
          <p className="main__registration_subtitle">
            {currentUser
              ? "Head to your portal to register your player for the season."
              : "Create an account to register your player for the season."}
          </p>
          <div className="main__registration_grid">
            {teams.map((team) => (
              <div key={team._id} className="main__registration_card">
                <h3 className="main__registration_card-name">{team.name}</h3>
                <p className="main__registration_card-age">Age Group: {team.ageGroup}</p>
                <p className="main__registration_card-fee">
                  {team.registrationFeeCents > 0
                    ? `Registration: ${centsToDollars(team.registrationFeeCents)}`
                    : "Registration fee: TBD"}
                </p>
                {currentUser ? (
                  <Link to="/profile" className="main__registration_card-btn">
                    Register
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="main__registration_card-btn"
                    onClick={onJoinClick}
                  >
                    Register
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="main__stats">
        <div className="main__stats_inner">
          <div className="main__stat">
            <p className="main__stat-number">5</p>
            <p className="main__stat-label">Competitive Teams</p>
          </div>
          <div className="main__stat">
            <p className="main__stat-number">20+</p>
            <p className="main__stat-label">College Commits</p>
          </div>
          <div className="main__stat">
            <p className="main__stat-number">College</p>
            <p className="main__stat-label">Level Coaching</p>
          </div>
          <div className="main__stat">
            <p className="main__stat-number">100%</p>
            <p className="main__stat-label">Player-First Culture</p>
          </div>
        </div>
      </section>

      <EventsCards />
      <HomeBanner />
      <AboutTeam />
      <section className="main__contact-cta">
        <div className="main__contact-cta_inner">
          <h2 className="main__contact-cta_title">Ready to join the Huskies family?</h2>
          <p className="main__contact-cta_copy">
            Reach out to the coaching staff for tryout details and program info.
          </p>
          <Link className="main__cta main__cta_primary" to="/contact">
            Contact the Team
          </Link>
        </div>
      </section>
      <section className="main__event"></section>
    </main>
  );
}
export default Main;
