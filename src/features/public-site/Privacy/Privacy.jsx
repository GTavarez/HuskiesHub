import "./Privacy.css";
import React from "react";

const CONTACT_EMAIL = "yoffeeallie@gmail.com";
const SITE = "www.eshuskiesyoffee.com";

function Privacy() {
  return (
    <section className="privacy">
      <h1 className="privacy__title">Privacy Policy</h1>
      <p className="privacy__updated">Last updated: October 6, 2026</p>

      <p>
        HuskiesHub is the team website and app of the Empire State Huskies youth softball club
        ({SITE}). This policy explains what information we collect, how we use it, and the
        choices you have. We keep it simple because families trust us with their kids&apos;
        information, and we take that seriously.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, password (stored
          scrambled, never in plain text), and your role (parent, player, coach, or admin).
        </li>
        <li>
          <strong>Optional contact details:</strong> a mobile phone number, if you add one to
          your profile.
        </li>
        <li>
          <strong>Player information:</strong> a player&apos;s name, jersey number, position,
          team, and, if a family chooses to add them, photos, graduation year, test scores, and
          college commitment. Private details such as phone numbers and email addresses are
          visible only to the player&apos;s family, their coaches, and club admins.
        </li>
        <li>
          <strong>Team activity:</strong> RSVPs, attendance, signed waivers, and messages you
          post in team chats, including photos you choose to share.
        </li>
        <li>
          <strong>Payments:</strong> payments are handled by Stripe. We never see or store your
          full card number.
        </li>
        <li>
          <strong>Device information:</strong> if you turn on phone notifications, your browser
          gives us a notification address for that device. We also keep the small amount of
          information needed to keep you signed in.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run teams: schedules, rosters, RSVPs, attendance, and team chat.</li>
        <li>
          To keep families informed: emails, phone notifications, and, if you opt in, text
          messages about schedule changes, cancellations, and urgent messages.
        </li>
        <li>To process payments and sign waivers.</li>
        <li>To keep players safe, including reviewing chat messages that someone reports.</li>
        <li>To improve and secure the site.</li>
      </ul>
      <p>We do not sell your information, and we do not show advertising.</p>

      <h2>Who we share it with</h2>
      <p>
        We share information only with the service providers that help us run the site, and
        only for that purpose. These include our hosting provider, our email provider, our
        text message provider, and Stripe for payments. We may also share information when the
        law requires it, or to protect the safety of a player.
      </p>
      <p>
        We do not share your information with advertisers or data brokers. Information about
        a player is shown to other families only as described above.
      </p>

      <h2 id="text-messages">Text messages</h2>
      <p>
        <strong>How you opt in:</strong> text messages are optional. A parent opts in by
        ticking the box in Edit Profile on {SITE}: &quot;Text me about schedule changes,
        cancellations and urgent messages.&quot; You must have a mobile number saved in your
        profile. We do not text anyone who has not ticked the box.
      </p>
      <p>
        <strong>What we send:</strong> schedule changes (a new time or place), cancellations,
        and urgent messages from coaches or club admins. We do not send promotional or
        marketing texts. The number of messages depends on how often the schedule changes,
        and is usually a few a month.
      </p>
      <p>
        <strong>Opting out:</strong> reply STOP to any message to stop receiving texts, or
        untick the box in Edit Profile at any time. For help, reply HELP or email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        <strong>Costs:</strong> message and data rates may apply. Message frequency varies.
        Carriers are not liable for delayed or undelivered messages.
      </p>
      <p>
        No mobile information will be shared with third parties/affiliates for
        marketing/promotional purposes. All the above categories exclude text messaging
        originator opt-in data and consent; this information will not be shared with any third
        parties.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        Most of our players are under 18. Parents and guardians manage their child&apos;s
        information. We do not text players, and a coach or admin who messages a player
        directly includes the player&apos;s parents. Parents can ask us to correct or remove
        their child&apos;s information at any time.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Update or correct your details in Edit Profile.</li>
        <li>Turn phone notifications and text messages on or off at any time.</li>
        <li>Ask us to delete your account or your child&apos;s information by emailing us.</li>
      </ul>

      <h2>How long we keep information</h2>
      <p>
        We keep information while an account or player is active, and for as long as we need
        it to run the club and meet legal and record-keeping duties. When you ask us to delete
        something, we remove it unless the law requires us to keep it.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable safeguards, including encrypted connections and limited access, to
        protect your information. No system is perfectly secure, so please use a strong
        password and do not share it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we will update the date at the top. If a change is
        significant, we will let families know.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions or requests about your information:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </section>
  );
}

export default Privacy;
