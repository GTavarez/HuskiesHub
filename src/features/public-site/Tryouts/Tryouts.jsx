import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitTryout } from "../../../api/tryouts.js";
import { useToast } from "../../../context/ToastContext.js";
import flyer from "../../../assets/tryouts-flyer.jpg";
import "./Tryouts.css";

const SCHEDULING_EMAIL = "cesportstraining@gmail.com";
const SCHEDULING_PHONE = "201-741-8563";

const AGE_GROUPS = [
  { value: "12U", label: "12U (looking for catchers)" },
  { value: "14U", label: "14U (looking for MIF / utility)" },
  { value: "16U", label: "16U (looking for P / MIF)" },
  { value: "18U", label: "18U (looking for P / utility)" },
];

const EMPTY_FORM = {
  playerName: "",
  ageGroup: "",
  birthDate: "",
  position: "",
  currentTeam: "",
  previousClubExperience: "",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  website: "", // honeypot, never shown to a person
};

function Tryouts() {
  const { pushToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const tryoutMutation = useMutation({
    mutationFn: submitTryout,
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Could not send your registration. Please try again.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    tryoutMutation.mutate(form);
  };

  return (
    <section className="tryouts">
      <div className="tryouts__wrapper">
        <div className="tryouts__flyer">
          <img
            className="tryouts__flyer-img"
            src={flyer}
            alt="Empire State Huskies Yoffee tryouts flyer: now looking for 12U catcher, 14U MIF/utility, 16U P/MIF and 18U P/utility"
          />
        </div>

        <div className="tryouts__main">
          <h1 className="tryouts__title">Tryout Registration</h1>
          <p className="tryouts__subtitle">
            Empire State Huskies Yoffee is looking for players at 12U, 14U, 16U and 18U. Tryouts are
            private and there is no fee. Fill out the form, then set up a time with us.
          </p>

          {submitted ? (
            <div className="tryouts__done" role="status">
              <h2 className="tryouts__done-title">We got your registration</h2>
              <p>
                The next step is to pick a time for the private tryout. Email{" "}
                <a href={`mailto:${SCHEDULING_EMAIL}`}>{SCHEDULING_EMAIL}</a> or call Joel Yoffee at{" "}
                <a href={`tel:${SCHEDULING_PHONE}`}>{SCHEDULING_PHONE}</a>.
              </p>
              <p>We also sent these steps to the email you gave us.</p>
              <button type="button" className="tryouts__again" onClick={() => setSubmitted(false)}>
                Register another player
              </button>
            </div>
          ) : (
            <form className="tryouts__form" onSubmit={handleSubmit}>
              <h2 className="tryouts__section">About the player</h2>

              <div className="tryouts__field">
                <label htmlFor="tryout-player">Player's full name</label>
                <input
                  id="tryout-player"
                  type="text"
                  value={form.playerName}
                  onChange={setField("playerName")}
                  maxLength={80}
                  required
                />
              </div>

              <div className="tryouts__row">
                <div className="tryouts__field">
                  <label htmlFor="tryout-age">Age group</label>
                  <select
                    id="tryout-age"
                    value={form.ageGroup}
                    onChange={setField("ageGroup")}
                    required
                  >
                    <option value="">Choose one</option>
                    {AGE_GROUPS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tryouts__field">
                  <label htmlFor="tryout-birth">Birth date (optional)</label>
                  <input
                    id="tryout-birth"
                    type="date"
                    value={form.birthDate}
                    onChange={setField("birthDate")}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              <div className="tryouts__field">
                <label htmlFor="tryout-position">Position</label>
                <input
                  id="tryout-position"
                  type="text"
                  placeholder="For example: catcher, shortstop, pitcher / utility"
                  value={form.position}
                  onChange={setField("position")}
                  maxLength={60}
                  required
                />
              </div>

              <div className="tryouts__field">
                <label htmlFor="tryout-team">Current team (optional)</label>
                <input
                  id="tryout-team"
                  type="text"
                  value={form.currentTeam}
                  onChange={setField("currentTeam")}
                  maxLength={100}
                />
              </div>

              <div className="tryouts__field">
                <label htmlFor="tryout-experience">Previous club experience (optional)</label>
                <textarea
                  id="tryout-experience"
                  rows="3"
                  placeholder="Clubs she has played for, how many years, and the level"
                  value={form.previousClubExperience}
                  onChange={setField("previousClubExperience")}
                  maxLength={1000}
                />
              </div>

              <h2 className="tryouts__section">Parent or guardian</h2>

              <div className="tryouts__field">
                <label htmlFor="tryout-parent">Name</label>
                <input
                  id="tryout-parent"
                  type="text"
                  value={form.parentName}
                  onChange={setField("parentName")}
                  maxLength={80}
                  required
                />
              </div>

              <div className="tryouts__row">
                <div className="tryouts__field">
                  <label htmlFor="tryout-email">Email</label>
                  <input
                    id="tryout-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.parentEmail}
                    onChange={setField("parentEmail")}
                    required
                  />
                </div>

                <div className="tryouts__field">
                  <label htmlFor="tryout-phone">Phone</label>
                  <input
                    id="tryout-phone"
                    type="tel"
                    placeholder="201-555-0123"
                    value={form.parentPhone}
                    onChange={setField("parentPhone")}
                    required
                  />
                </div>
              </div>

              <div className="tryouts__trap" aria-hidden="true">
                <label htmlFor="tryout-website">Leave this empty</label>
                <input
                  id="tryout-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={setField("website")}
                />
              </div>

              <button type="submit" className="tryouts__submit" disabled={tryoutMutation.isPending}>
                {tryoutMutation.isPending ? "Sending..." : "Register for a tryout"}
              </button>
              <p className="tryouts__note">
                After you register, email {SCHEDULING_EMAIL} or call Joel Yoffee at{" "}
                {SCHEDULING_PHONE} to schedule the private tryout.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default Tryouts;
