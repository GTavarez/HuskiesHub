import "./CetLayout.css";
import CetLogo from "./CetLogo.jsx";

// Deliberately no nav links — this page is meant to read as its own site,
// not a Huskies subpage, per the explicit request to drop the shared header.
function CetHeader() {
  return (
    <header className="cet-header">
      <CetLogo height={52} />
    </header>
  );
}

export default CetHeader;
