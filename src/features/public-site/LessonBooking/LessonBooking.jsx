import { useMutation } from "@tanstack/react-query";
import "./LessonBooking.css";
import { useToast } from "../../../context/ToastContext.js";
import { createCetSubscriptionCheckout } from "../../../api/cetCheckout.js";
import LessonSlotBooking from "../../shared/LessonSlotBooking/LessonSlotBooking.jsx";

// Subscription tiers with no scheduled slot involved — a family can
// subscribe directly, no request/confirm step needed (unlike the
// Academy + Lessons / Fall Lesson Package options below, which include
// booked private lesson time and go through the request form). `tier` must
// match a key in the CET backend's TIER_PRICE_IDS map. Billing is prorated
// to the 1st of the next month on signup, then runs full price monthly —
// see CET-backend/app.js.
const REMOTE_BULLETS = [
  "Ground Force Production: power that starts from the feet up, not just the arms",
  "Hip Mobility & Explosive Rotation: the engine behind every swing and throw",
  "Core Stability & Anti-Rotation: controlling and transferring force instead of leaking it",
  "Movement Quality: hip rotation, T-spine mobility, ankle mobility, scapular control, adductor length and strength",
  "Tissue Resilience: isometric and eccentric strength work that builds durability, not just output",
  "Aerobic Base: the conditioning that lets an athlete recover between explosive efforts, inning after inning",
];

const ACADEMY_BULLETS = [
  "Rotational Power: med-ball work, plyometrics, and loaded rotational patterns that translate directly to bat speed and throwing velocity",
  "Single-Leg Strength & Stability: the unilateral strength base that protects against the imbalances rotational sports create",
  "Overhead Stability: rotator cuff strength, scapular control, and dynamic shoulder stability built specifically for the demands of throwing",
  "Speed & Explosiveness: the athletic qualities that show up as a faster first step, not just a stronger lift",
  "Applied Skill Work: tee/posture work and max-effort swings that reinforce the training, not a separate lesson competing with it",
];

const SUBSCRIPTION_TIERS = [
  {
    tier: "year_round_remote",
    name: "Year-Round Remote",
    price: "$34/mo",
    copy: "The full 5-phase year-round system, delivered remotely as each phase releases. Real, structured, coach-built programming without an in-person commitment.",
    bulletsTitle: "Athletes will develop:",
    bullets: REMOTE_BULLETS,
  },
  {
    tier: "individualized_remote",
    name: "Individualized Remote",
    price: "$99/mo",
    copy: "Everything in Year-Round Remote, plus a movement and performance assessment and training tailored specifically to your athlete.",
    bulletsTitle: "Athletes will develop:",
    bullets: REMOTE_BULLETS,
    extraNote:
      "Individualized Remote adds a real movement/performance assessment, with both the performance work and the skill application tailored to what that assessment actually finds.",
  },
  {
    tier: "academy",
    name: "Academy",
    price: "$119/mo",
    copy: "Small-group, in-person training that runs alongside your team's own schedule, so it complements practice instead of competing with it.",
    bulletsTitle: "Athletes will develop everything above, in person, plus:",
    bullets: ACADEMY_BULLETS,
    extraNote:
      "Trains through the full 5-phase year-round system (Fall Develop, Winter Strengthen, Spring Accelerate, Summer Express, August Reset), so training progresses with the season instead of repeating the same month on loop.",
  },
];

// Manual counter, updated by hand as signups come in (per the Founding
// Member doc: not worth wiring to Stripe until the broader automation work
// happens). Update FOUNDING_MEMBERS_SIGNED_UP as new Academy members join.
const FOUNDING_MEMBER_TOTAL_SPOTS = 20;
const FOUNDING_MEMBERS_SIGNED_UP = 0;

const PHASES = [
  { number: 1, name: "Foundation", season: "Fall", focus: "Build athletic capacity while in season." },
  { number: 2, name: "Strength", season: "Winter", focus: "Build the physical qualities that create power." },
  { number: 3, name: "Power", season: "Spring", focus: "Translate raw strength into diamond-ready explosive speed." },
  { number: 4, name: "Performance", season: "Summer", focus: "Express what you've built when it matters most." },
  { number: 5, name: "Peak", season: "August", focus: "Recover, rebuild, and prepare for the next cycle." },
];

function LessonBooking() {
  const { pushToast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: createCetSubscriptionCheckout,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to start checkout." });
    },
  });

  return (
    <section className="lesson-booking">
      <div className="lesson-booking__hero">
        <h1 className="lesson-booking__hero-title">Competitive Edge Training</h1>
        <p className="lesson-booking__hero-tagline">
          Most softball players don't have a swing problem. They have a movement problem.
        </p>
        <p className="lesson-booking__hero-copy">
          Practice builds skill, reps, and game IQ. Competitive Edge Training builds the
          strength, power, and mobility that let a good swing or a strong throw actually hold
          up over a full season, without competing with what happens indoors.
        </p>
        <p className="lesson-booking__hero-philosophy">
          Build the Athlete → Build the Movement → Build the Skill → Build the Complete Player.
        </p>
      </div>

      <div className="lesson-booking__why">
        <div className="lesson-booking__why-inner">
          <h2 className="lesson-booking__section-title">Why We Train This Way</h2>
          <p className="lesson-booking__why-copy">
            Championship athletes are built long before game day, through the small habits,
            the recovery, and the reps that require no talent at all. Softball is a rotational,
            overhead sport: the swing and the throw both start with force from the ground, hip
            and rotational power, and a body that sequences efficiently as one connected
            system. When an athlete can't create force from the ground, separate her hips and
            shoulders, or stabilize her front side, no amount of swing instruction fixes that
            consistently. That's the gap this program closes.
          </p>
        </div>
      </div>

      <div className="lesson-booking__phases">
        <div className="lesson-booking__phases-inner">
          <h2 className="lesson-booking__section-title">The 5-Phase Year-Round System</h2>
          <p className="lesson-booking__phases-tagline">Train. Develop. Perform. Repeat.</p>
          <div className="lesson-booking__phases-grid">
            {PHASES.map((phase) => (
              <div key={phase.number} className="lesson-booking__phase-card">
                <span className="lesson-booking__phase-number">Phase {phase.number}</span>
                <h3 className="lesson-booking__phase-name">{phase.name}</h3>
                <span className="lesson-booking__phase-season">{phase.season}</span>
                <p className="lesson-booking__phase-focus">{phase.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lesson-booking__foundation">
        <div className="lesson-booking__foundation-inner">
          <h2 className="lesson-booking__foundation-title">Start Free: The Foundation Month</h2>
          <p className="lesson-booking__foundation-copy">
            Month 1 of our full year-round training system, completely free, no card required.
            Built in phases (Foundation to Build to Develop to Peak) so training actually
            progresses instead of repeating the same month on loop. This is exactly the kind of
            training that carries an athlete through November and December, when team
            activities pause and most players lose their structure completely.
          </p>
          <a
            href="https://8cbc23ff.sibforms.com/v2/serve/MUIFAJWd4AU2r_hFsdN9IjQd6QT0WOOpELzwh39khwyWuB-J5zjSe4h40tVqotgIBqxudt3UMtkS6CCgpip_tUIwUDf3HHPZOT0e9Ydbr4QK5uW59HsnwPwesKUd5p0X5_jG3fHrReoSa_3MRGzkhKa4MSlTBIcJZH9hUpiPhFBUSs9Sni2zwjoxGeiI8UKNea696kaZg2bL8oGatg=="
            target="_blank"
            rel="noreferrer"
            className="lesson-booking__foundation-btn"
          >
            Start the Foundation Month, Free
          </a>
        </div>
      </div>

      <div className="lesson-booking__pricing">
        <div className="lesson-booking__pricing-inner">
          <h2 className="lesson-booking__section-title">Membership &amp; Pricing</h2>
          <p className="lesson-booking__pricing-subtitle">
            Subscribe directly, cancel anytime. Looking for private lessons instead? Scroll
            down to book a slot.
          </p>
          <div className="lesson-booking__pricing-grid">
            {SUBSCRIPTION_TIERS.map((tierOption) => (
              <div key={tierOption.tier} className="lesson-booking__pricing-card">
                <h3 className="lesson-booking__pricing-name">{tierOption.name}</h3>
                <p className="lesson-booking__pricing-price">{tierOption.price}</p>
                <p className="lesson-booking__pricing-copy">{tierOption.copy}</p>

                {tierOption.bullets && (
                  <div className="lesson-booking__pricing-bullets">
                    <p className="lesson-booking__pricing-bullets-title">
                      {tierOption.bulletsTitle}
                    </p>
                    <ul>
                      {tierOption.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tierOption.extraNote && (
                  <p className="lesson-booking__pricing-extra">{tierOption.extraNote}</p>
                )}

                {tierOption.tier === "academy" && (
                  <>
                    <p className="lesson-booking__founding-counter">
                      {FOUNDING_MEMBER_TOTAL_SPOTS - FOUNDING_MEMBERS_SIGNED_UP} of{" "}
                      {FOUNDING_MEMBER_TOTAL_SPOTS} Founding Member spots remaining, locked-in
                      pricing for as long as you stay enrolled.
                    </p>
                    <p className="lesson-booking__pricing-extra">
                      New members joining after the Founding Member spots fill will join at the
                      2026 rate of $149/mo.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  className="lesson-booking__pricing-btn"
                  disabled={subscribeMutation.isPending}
                  onClick={() => subscribeMutation.mutate(tierOption.tier)}
                >
                  {subscribeMutation.isPending && subscribeMutation.variables === tierOption.tier
                    ? "Starting checkout..."
                    : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lesson-booking__about">
        <div className="lesson-booking__about-inner">
          <div className="lesson-booking__about-photo" aria-hidden="true">
            AY
          </div>
          <div className="lesson-booking__about-text">
            <h2 className="lesson-booking__section-title lesson-booking__section-title--left">
              About Allie
            </h2>
            <p className="lesson-booking__about-copy">
              I am a youth softball Director of Operations, Head Coach, and Sports Performance
              Coach with experience developing athletes from 10U through 18U, as well as at the
              collegiate level. Since 2020, I have coached athletes at every youth level and
              spent a year coaching at Felician University.
            </p>
            <p className="lesson-booking__about-copy">
              I was a four-year Division I softball player at Rutgers University, where I
              earned a degree in Sports Management. My experience as an athlete, coach, and
              performance trainer has shaped the way I approach athlete development both on the
              field and in the weight room.
            </p>
            <p className="lesson-booking__about-copy">
              I specialize in sports performance for softball athletes, with a focus on the
              unique demands of rotational and overhead athletes. My approach goes beyond
              simply getting athletes stronger. I focus on developing strength, power,
              mobility, stability, and movement quality so athletes can perform at a high level
              while building the physical foundation necessary for long-term development.
            </p>
            <p className="lesson-booking__about-copy">
              My passion for this work is deeply personal. My own college career was impacted
              by chronic and acute injuries, including a hip impingement that ultimately
              required surgery and a shoulder dislocation my senior year. Looking back, many of
              these issues were connected to movement limitations and muscle imbalances that I
              simply didn't understand as a young athlete.
            </p>
            <p className="lesson-booking__about-copy">
              Those experiences drive my commitment to educating athletes: not just telling
              them what to do, but teaching them why they need to do it. Consistent training
              isn't just about improving performance, it is about preparing the body for the
              repetitive demands of softball and giving athletes the tools to stay healthy
              throughout their careers.
            </p>
            <p className="lesson-booking__about-copy">
              Ultimately, I want to develop athletes who understand their bodies, train with
              purpose, and carry those movement habits well beyond their playing careers.
            </p>
            <p className="lesson-booking__about-tagline">Movement is Medicine.</p>
          </div>
        </div>
      </div>

      <div className="lesson-booking__cet-theme">
        <LessonSlotBooking title="Book a Private Lesson" />
      </div>
    </section>
  );
}

export default LessonBooking;
