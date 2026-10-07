import "../Privacy/Privacy.css";
import React from "react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "yoffeeallie@gmail.com";
const SITE = "www.eshuskiesyoffee.com";

function Terms() {
  return (
    <section className="privacy">
      <h1 className="privacy__title">Terms &amp; Conditions</h1>
      <p className="privacy__updated">Last updated: October 6, 2026</p>

      <p>
        These terms cover your use of HuskiesHub, the team website and app of the Empire State
        Huskies youth softball club ({SITE}). By creating an account or using the site, you
        agree to them. Our <Link to="/privacy">Privacy Policy</Link> explains how we handle
        your information.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information and keep your password private.</li>
        <li>
          Parents and guardians manage their child&apos;s information and are responsible for
          what is posted under their account.
        </li>
        <li>We may remove an account that is misused or puts a player&apos;s safety at risk.</li>
      </ul>

      <h2>Team chat and conduct</h2>
      <ul>
        <li>Be respectful. No harassment, bullying, threats, or inappropriate content.</li>
        <li>Do not share another family&apos;s private information.</li>
        <li>
          Coaches and admins may delete messages. Messages can be reported, and reported
          messages are reviewed by club admins.
        </li>
      </ul>

      <h2 id="text-messages">Text message program</h2>
      <p>
        <strong>Program:</strong> Empire State Huskies text alerts. Parents who opt in receive
        text messages about schedule changes, cancellations, and urgent messages from coaches
        or club admins. We do not send marketing or promotional texts.
      </p>
      <p>
        <strong>How to join:</strong> tick &quot;Text me about schedule changes, cancellations
        and urgent messages&quot; in Edit Profile on {SITE}. You need a mobile number saved in
        your profile. Joining is optional and is not a condition of any purchase or of
        playing for the club.
      </p>
      <p>
        <strong>How to stop:</strong> reply STOP to any message, or untick the box in Edit
        Profile. After you stop, you may get one message confirming it, and then no more.
      </p>
      <p>
        <strong>Help:</strong> reply HELP or email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        <strong>Costs and delivery:</strong> message and data rates may apply. Message
        frequency varies, usually a few messages a month. Carriers are not liable for delayed
        or undelivered messages.
      </p>
      <p>
        <strong>Privacy:</strong> see our <Link to="/privacy#text-messages">Privacy Policy</Link>{" "}
        for how we handle your mobile number. We do not share it with third parties for
        marketing.
      </p>

      <h2>Payments and waivers</h2>
      <p>
        Payments are processed by Stripe. Fees, refunds, and waivers for a program are
        described when you sign up for it.
      </p>

      <h2>Safety information</h2>
      <p>
        The site is a tool for communication and scheduling. It is not an emergency service. In
        an emergency, call 911.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows the latest version. Continuing to
        use the site after a change means you accept it.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </section>
  );
}

export default Terms;
