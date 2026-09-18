import "./CetLayout.css";

// Deliberately no generic "join our list" email capture: the goal is to push
// people to register, not compete with that CTA.
const INSTAGRAM_URL = "https://www.instagram.com/competitiveedge.training/";
const CONTACT_EMAIL = "ayoffee@competitiveedgenj.com";
const CONTACT_PHONE = "(973) 800-0356";

function CetFooter() {
  return (
    <footer className="cet-footer">
      <p className="cet-footer__brand">Competitive Edge Training</p>
      <div className="cet-footer__links">
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="cet-footer__link">
          Instagram
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="cet-footer__link">
          {CONTACT_EMAIL}
        </a>
        <a href={`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, "")}`} className="cet-footer__link">
          {CONTACT_PHONE}
        </a>
      </div>
      <p className="cet-footer__copyright">
        © {new Date().getFullYear()} Competitive Edge Training. All rights reserved.
      </p>
    </footer>
  );
}

export default CetFooter;
