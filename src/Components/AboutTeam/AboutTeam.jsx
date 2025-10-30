import "./AboutTeam.css";

function AboutTeam() {
  return (
    <section className="about__section">
      <div className="about__container">
        <h2 className="about__title">About Empire State Huskies Yoffee</h2>
        <div className="about__divider"></div>
        <div className="about__content">
          <h3>Our Mission</h3>
          <p>
            At Empire State Huskies Yoffee, our mission is simple: To encourage
            players to discover their full potential on and off the field, and
            provide them with the resources they need to perform at the highest
            level they are capable of. We believe that softball is more than a
            game — it’s a platform for building confidence, leadership, and
            lifelong skills that extend far beyond the diamond.
          </p>
          <h3>Who We Are</h3>
          <p>
            The Empire State Huskies Yoffee program is built on a foundation of
            player development, competitiveness, and mentorship. Led by
            experienced college-level coaches, we provide our athletes with the
            same level of structure, accountability, and technical instruction
            used at the collegiate level.
          </p>
          <p>
            Our training focuses on the complete athlete — refining physical
            mechanics, enhancing the mental game, and fostering the personal
            growth necessary to excel in both softball and life. We ourselves on
            developing players who are not only technically sound but also
            confident, resilient, and driven to reach their goals.
          </p>
          <h3>What Sets Us Apart</h3>
          <p>
            What makes our program different is our commitment to college-level
            training and individualized development. Every player receives
            hands-on instruction designed to maximize their potential — whether
            that means improving swing mechanics, building game IQ, or
            developing a winning mindset.
          </p>
          <ul className="about__list">
            <li>
              Performance-based training rooted in mechanics, data, and
              fundamentals
            </li>
            <li>
              A positive, competitive environment where players are challenged
              to grow
            </li>
            <li>
              Mental toughness and leadership development that translates to all
              areas of life
            </li>
            <li>
              A <strong>DRAMA-FREE</strong> culture built on respect, hard work,
              and a love for the game
            </li>
          </ul>
          <p className="about__closing">
            {" "}
            At Empire State Huskies Yoffee, we don’t just teach softball — we
            teach athletes how to compete with character and enjoy the process
            of becoming the best version of themselves.
          </p>
        </div>
        <div className="about__image">
          <img
            src="assets/example1.jpg"
            alt="Empire State Huskies Yoffee Team"
          ></img>
        </div>
      </div>
    </section>
  );
}
export default AboutTeam;
