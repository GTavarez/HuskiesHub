import { jsPDF } from "jspdf";

// A tournament "showcase profile sheet": manager and team details across the
// top, then one row per player in the column order these sheets ask for. It is
// the table-style counterpart to teamRosterPdf.js (the photo-card roster).

const BLACK = [24, 24, 24];
const WHITE = [255, 255, 255];
const LABEL_FILL = [236, 236, 236];
const HEADER_FILL = [232, 210, 208];
const LINE = [165, 165, 165];

const MARGIN = 30;
const TITLE_HEIGHT = 40;
const INFO_ROW_HEIGHT = 22;
const INFO_ROWS = 5;
const TABLE_HEADER_HEIGHT = 32;
const MIN_ROW_HEIGHT = 22;
const MIN_TOTAL_ROWS = 15; // blank rows fill the sheet out, like the paper form

const COLUMNS = [
  { key: "jersey", label: ["#"], width: 22, align: "center" },
  { key: "name", label: ["Player Name"], width: 100, align: "left" },
  { key: "gradYear", label: ["Grad", "Year"], width: 36, align: "center" },
  { key: "throwsHits", label: ["Throws/Hits", "(L/R/S)"], width: 48, align: "center" },
  { key: "position", label: ["Positions", "Primary First"], width: 82, align: "left" },
  { key: "committed", label: ["Committed", "(Y/N)"], width: 46, align: "center" },
  { key: "tests", label: ["SAT/ACT"], width: 58, align: "center" },
  { key: "gpa", label: ["GPA"], width: 34, align: "center" },
  { key: "cityState", label: ["City/State"], width: 84, align: "left" },
  { key: "phone", label: ["Player Phone"], width: 76, align: "left" },
  { key: "email", label: ["Player Email"], width: 146, align: "left" },
];

// The app stores "Bats/Throws" (e.g. "L/R" = bats left, throws right). These
// sheets ask for "Throws/Hits", so the two letters swap places.
function toThrowsHits(battingThrowing) {
  const value = String(battingThrowing || "").trim();
  const match = value.match(/^([LRS])\s*\/\s*([LRS])$/i);
  if (!match) return value;
  return `${match[2].toUpperCase()}/${match[1].toUpperCase()}`;
}

// "Jersey Outlaws" becomes "Jersey Outlaws Showcase Profile Sheet"; a name that
// already says "Showcase" (or the full sheet name) isn't repeated.
function sheetTitle(eventName) {
  const name = String(eventName || "").trim();
  if (!name) return "Showcase Profile Sheet";
  if (/profile sheet/i.test(name)) return name;
  if (/showcase/i.test(name)) return `${name} Profile Sheet`;
  return `${name} Showcase Profile Sheet`;
}

function testScores(player) {
  const lines = [];
  if (player.satScore) lines.push(`SAT ${player.satScore}`);
  if (player.actScore) lines.push(`ACT ${player.actScore}`);
  return lines;
}

const MIN_FONT_SIZE = 6;

// Whether a single unbreakable string (an email) fits its cell once shrunk to
// the smallest size we allow. Measured the same way the row is drawn.
function fitsAtMinSize(doc, text, width) {
  const previous = doc.getFontSize();
  doc.setFontSize(MIN_FONT_SIZE);
  const fits = doc.getTextWidth(text) <= width;
  doc.setFontSize(previous);
  return fits;
}

function cellLines(doc, player, column) {
  switch (column.key) {
    case "jersey":
      return player.jersey === undefined || player.jersey === null ? [] : [String(player.jersey)];
    case "gradYear":
      return player.gradYear ? [String(player.gradYear)] : [];
    case "throwsHits": {
      const value = toThrowsHits(player.battingThrowing);
      return value ? [value] : [];
    }
    case "committed":
      return [player.isCommitted ? "Y" : "N"];
    case "tests":
      return testScores(player);
    case "gpa":
      return player.GPA ? [String(player.GPA)] : [];
    case "cityState": {
      const text = [player.city, player.state].filter(Boolean).join(", ");
      return text ? doc.splitTextToSize(text, column.width - 8) : [];
    }
    case "phone":
      return player.phone ? [player.phone] : [];
    case "email": {
      const email = player.contactEmail || "";
      if (!email) return [];
      // An address has no spaces to wrap on: it shrinks to fit, and only if it
      // still won't, splits at the "@".
      if (fitsAtMinSize(doc, email, column.width - 8)) return [email];
      const at = email.indexOf("@");
      return at > 0 ? [email.slice(0, at), email.slice(at)] : [email];
    }
    case "name":
    case "position":
    default:
      return player[column.key] ? doc.splitTextToSize(String(player[column.key]), column.width - 8) : [];
  }
}

function sortByJersey(players) {
  const numeric = (p) => {
    const n = Number.parseInt(p.jersey, 10);
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  };
  return [...players].sort((a, b) => numeric(a) - numeric(b) || String(a.name).localeCompare(String(b.name)));
}

function drawBox(doc, x, y, w, h, fill) {
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, "F");
  }
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, h, "S");
}

function drawTop(doc, { eventName, teamName, website, manager }, contentWidth) {
  let y = MARGIN;

  doc.setFillColor(...BLACK);
  doc.rect(MARGIN, y, contentWidth, TITLE_HEIGHT, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const title = sheetTitle(eventName);
  doc.text(title, MARGIN + contentWidth / 2, y + 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Please complete all fields using black type only.", MARGIN + contentWidth / 2, y + 34, {
    align: "center",
  });
  y += TITLE_HEIGHT;

  const labelWidth = 118;
  const valueWidth = 330;
  const rightX = MARGIN + labelWidth + valueWidth;
  const rightWidth = contentWidth - labelWidth - valueWidth;

  const rows = [
    ["Manager Name", manager.name],
    ["Manager Address", manager.address],
    ["City, State, ZIP", manager.cityStateZip],
    ["Manager Phone", manager.phone],
    ["Manager Email", manager.email],
  ];
  rows.forEach(([label, value], index) => {
    const rowY = y + index * INFO_ROW_HEIGHT;
    drawBox(doc, MARGIN, rowY, labelWidth, INFO_ROW_HEIGHT, LABEL_FILL);
    drawBox(doc, MARGIN + labelWidth, rowY, valueWidth, INFO_ROW_HEIGHT, null);
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, MARGIN + 6, rowY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (value) doc.text(String(value), MARGIN + labelWidth + 6, rowY + 15, { maxWidth: valueWidth - 12 });
  });

  // Right side: team name across the first four rows, website in the last.
  drawBox(doc, rightX, y, rightWidth, INFO_ROW_HEIGHT * 4, null);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  const nameLines = doc.splitTextToSize(teamName || "", rightWidth - 20);
  const nameBlockHeight = nameLines.length * 17;
  doc.text(nameLines, rightX + rightWidth / 2, y + (INFO_ROW_HEIGHT * 4 - nameBlockHeight) / 2 + 13, {
    align: "center",
  });

  drawBox(doc, rightX, y + INFO_ROW_HEIGHT * 4, rightWidth, INFO_ROW_HEIGHT, null);
  doc.setFontSize(9);
  const websiteText = website ? `Team Website: ${website}` : "Team Website:";
  doc.text(websiteText, rightX + rightWidth / 2, y + INFO_ROW_HEIGHT * 4 + 15, {
    align: "center",
    maxWidth: rightWidth - 12,
  });

  return y + INFO_ROW_HEIGHT * INFO_ROWS;
}

function drawTableHeader(doc, y) {
  let x = MARGIN;
  COLUMNS.forEach((column) => {
    drawBox(doc, x, y, column.width, TABLE_HEADER_HEIGHT, HEADER_FILL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    const blockHeight = column.label.length * 9;
    const startY = y + (TABLE_HEADER_HEIGHT - blockHeight) / 2 + 7;
    column.label.forEach((line, i) => {
      doc.text(line, x + column.width / 2, startY + i * 9, { align: "center" });
    });
    x += column.width;
  });
  return y + TABLE_HEADER_HEIGHT;
}

function drawRow(doc, player, y, rowHeight) {
  let x = MARGIN;
  COLUMNS.forEach((column) => {
    drawBox(doc, x, y, column.width, rowHeight, null);
    if (player) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BLACK);
      // Shrink long single-line values (mostly emails) rather than overflow.
      doc.setFontSize(8.5);
      if (column.key === "email" || column.key === "phone") {
        doc.setFontSize(8);
        let size = 8;
        const text = column.key === "email" ? player.contactEmail || "" : player.phone || "";
        while (size > MIN_FONT_SIZE && doc.getTextWidth(text) > column.width - 8) {
          size -= 0.5;
          doc.setFontSize(size);
        }
      }
      const lines = cellLines(doc, player, column);
      const lineHeight = 10;
      const startY = y + (rowHeight - lines.length * lineHeight) / 2 + 8;
      lines.forEach((line, i) => {
        const textX = column.align === "center" ? x + column.width / 2 : x + 4;
        doc.text(line, textX, startY + i * lineHeight, { align: column.align === "center" ? "center" : "left" });
      });
    }
    x += column.width;
  });
}

function rowHeightFor(doc, player) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const lineCount = Math.max(1, ...COLUMNS.map((column) => cellLines(doc, player, column).length));
  return Math.max(MIN_ROW_HEIGHT, lineCount * 10 + 8);
}

function generateShowcaseSheetPdf({ eventName, teamName, website, manager, players }) {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * MARGIN;

  let y = drawTop(doc, { eventName, teamName, website, manager: manager || {} }, contentWidth);
  y = drawTableHeader(doc, y);

  const sorted = sortByJersey(players);
  const blankRows = Math.max(0, MIN_TOTAL_ROWS - sorted.length);
  const rows = [...sorted, ...Array.from({ length: blankRows }, () => null)];

  rows.forEach((player) => {
    const height = player ? rowHeightFor(doc, player) : MIN_ROW_HEIGHT;
    if (y + height > pageHeight - MARGIN) {
      doc.addPage();
      y = drawTableHeader(doc, MARGIN);
    }
    drawRow(doc, player, y, height);
    y += height;
  });

  const safeName = String(teamName || "team").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${safeName}-showcase-profile-sheet.pdf`);
}

export { generateShowcaseSheetPdf, toThrowsHits, sheetTitle };
