import "./Clinics.css";
import React from "react";

function Clinics() {
  return (
    <section className="clinics">
      <h1 className="clinics__title">Clinics & Training Programs</h1>

      <div className="clinic__card clinic__card--placeholder">
        <span className="clinic__badge">Coming Soon</span>
        <h2 className="clinic__header">New Clinics Are On the Way</h2>
        <p className="clinic__subheader">
          We're putting together our next round of clinics and training programs. Check back
          soon for dates, pricing, and sign-ups.
        </p>

        <div className="clinic__contact">
          <p>Questions in the meantime? Reach out:</p>
          <p>📧 cesportraining@gmail.com</p>
          <p>📞 973-800-0356</p>
        </div>
      </div>
    </section>
  );
}

export default Clinics;
