import "./Teams.css";

// Public team listing is paused while the club finalizes its Fall 2026
// roster — internal team/player management (rosters, chat, registration)
// keeps working normally for admins/coaches/parents; this only hides the
// public marketing grid until real teams are ready to announce.
function Teams() {
  return (
    <section className="teams__section">
      <div className="teams__header">
        <h2>Empire State Huskies Teams</h2>
        <div className="teams__divider"></div>
      </div>

      <p style={{ textAlign: "center", color: "#ccc" }}>
        Fall 2026 teams coming soon...
      </p>
    </section>
  );
}

export default Teams;
