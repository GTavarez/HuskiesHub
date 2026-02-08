import React from "react";
import "./Contact.css";

function Contact() {
  const facilityAddress = "Wayne, New Jersey"; // update to your real location
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    facilityAddress
  )}&output=embed`;

  return (
    <section className="contact">
      <div className="contact__wrapper">
        <div className="contact__info">
          <h2 className="contact__title">Contact & Location</h2>
          <p className="contact__subtitle">
            Have questions about the Huskies, rosters, clinics, or recruiting?
            Reach out and we’ll get back to you as soon as we can.
          </p>

          <div className="contact__details">
            <p><strong>Email:</strong> info@huskieshub.com</p>
            <p><strong>Phone:</strong> (555) 555-5555</p>
            <p><strong>Primary Area:</strong> {facilityAddress}</p>
          </div>

          <form className="contact__form">
            <div className="contact__field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" placeholder="Your full name" />
            </div>

            <div className="contact__field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" />
            </div>

            <div className="contact__field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="4"
                placeholder="Tell us how we can help..."
              />
            </div>

            <button
              type="button"
              className="contact__submit"
              onClick={() =>
                window.location.href = "mailto:info@huskieshub.com"
              }
            >
              Send Message
            </button>
          </form>
        </div>

        <div className="contact__map-wrapper">
          <div className="contact__map-card">
            <h3 className="contact__map-title">Training Area</h3>
            <div className="contact__map-frame">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Huskies Location Map"
              ></iframe>
            </div>
            <button
              className="contact__map-directions"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    facilityAddress
                  )}`,
                  "_blank"
                )
              }
            >
              Open in Google Maps
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
