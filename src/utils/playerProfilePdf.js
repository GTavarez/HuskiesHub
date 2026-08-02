import { jsPDF } from "jspdf";

const CLUB_NAME = "Empire State Huskies";
const CLUB_CONTACT_EMAIL = "cesportstraining@gmail.com";
const NAVY = [10, 25, 47];
const GOLD = [255, 215, 0];
const GRAY = [80, 90, 105];

const MEASURABLE_FIELDS = [
  { key: "exitVelocity", label: "Exit Velocity", unit: "mph" },
  { key: "throwingVelocity", label: "Throwing Velocity", unit: "mph" },
  { key: "pitchVelocity", label: "Pitch Velocity", unit: "mph" },
  { key: "popTime", label: "Pop Time", unit: "sec" },
  { key: "sixtyYardDash", label: "60-Yard Dash", unit: "sec" },
];

// Generates and triggers a browser download of a one-page recruiting profile
// PDF for a single player, built from data already loaded on the page (no
// extra API calls) — Player bio fields plus, if present, their
// RecruitingProfile measurables/academics/highlight links.
function generatePlayerProfilePdf({ player, recruitingProfile, teamName }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(player?.name || "Player Profile", marginX, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...GOLD.map((c, i) => (i === 2 ? 100 : c)));
  doc.text(`${CLUB_NAME}${teamName ? ` — ${teamName}` : ""}`, marginX, 66);

  y = 130;
  doc.setTextColor(...NAVY);

  const sectionTitle = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(title, marginX, y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.5);
    doc.line(marginX, y + 5, pageWidth - marginX, y + 5);
    y += 22;
  };

  const row = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(String(value), marginX + 130, y);
    y += 18;
  };

  // Player Info
  sectionTitle("Player Info");
  row("Jersey #", player?.jersey);
  row("Position", player?.position);
  row("Graduation Year", player?.gradYear);
  row("High School", player?.highSchool);
  row("GPA", player?.GPA);
  if (player?.isCommitted && player?.committedCollege) {
    row("Committed To", player.committedCollege);
  }
  y += 8;

  // Measurables — only fields that actually have a value
  const measurables = MEASURABLE_FIELDS.filter(
    ({ key }) => recruitingProfile?.[key] !== undefined && recruitingProfile?.[key] !== null
  );
  if (measurables.length > 0) {
    sectionTitle("Measurables");
    measurables.forEach(({ key, label, unit }) => {
      row(label, `${recruitingProfile[key]} ${unit}`);
    });
    y += 8;
  }

  // Academics
  if (recruitingProfile?.satScore || recruitingProfile?.actScore) {
    sectionTitle("Academics");
    row("SAT Score", recruitingProfile?.satScore);
    row("ACT Score", recruitingProfile?.actScore);
    y += 8;
  }

  // Highlight videos
  if (recruitingProfile?.highlightVideoUrls?.length > 0) {
    sectionTitle("Highlight Videos");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    recruitingProfile.highlightVideoUrls.forEach((url) => {
      doc.textWithLink(url, marginX, y, { url });
      y += 16;
    });
    y += 8;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `For recruiting inquiries, contact ${CLUB_NAME} at ${CLUB_CONTACT_EMAIL}`,
    marginX,
    pageHeight - 36
  );

  const fileNameSafe = (player?.name || "player").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${fileNameSafe}-profile.pdf`);
}

export { generatePlayerProfilePdf };
