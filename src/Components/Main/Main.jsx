import "./Main.css";
import EventsCards from "../EventsCards/EventsCards";
import AboutTeam from "../AboutTeam/AboutTeam";

function Main() {
  return (
    <main className="main__content">
      <section className="main__image_section">
        <div className="main__image_section_content">
          <h1 className="main__image_section_content-title">
            Empire State Huskies
          </h1>
          <p className="main__image_section_content-subtitle">
            Stronger Together • Hustle. Hit. Never Quit.
          </p>
        </div>
      </section>
      <EventsCards />
      <AboutTeam />
      <section className="main__event"></section>
    </main>
  );
}
export default Main;
