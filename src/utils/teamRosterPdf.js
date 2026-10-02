import { jsPDF } from "jspdf";
import { resolveImageUrl } from "./media.js";

// The printable team roster: a landscape booklet laid out like the club's
// recruiting roster. Page 1 onward are player cards (photo on the left, details
// on the right, the jersey number as a large gray watermark), 12 to a page.
// The last page carries the events list, coaching staff, a notes box, and the
// team name, logo and season.

const NAVY = [38, 55, 120];
const DARK_BAR = [50, 60, 90];
const BAR_TEXT = [235, 235, 235];
const WATERMARK_GRAY = [214, 214, 214];

const PAGE_W = 792;
const PAGE_H = 612;
const MARGIN = 22;
const COLS = 3;
const ROWS = 4;
const COL_GAP = 12;
const ROW_GAP = 6;
const CARD_W = (PAGE_W - 2 * MARGIN - (COLS - 1) * COL_GAP) / COLS;
const CARD_H = (PAGE_H - 2 * MARGIN - (ROWS - 1) * ROW_GAP) / ROWS;
const PHOTO_W = 84;
const PHOTO_H = 108;
const TEXT_X_OFFSET = PHOTO_W + 8;
const LINE_H = 9.5;
const MIN_FONT = 6;

// Photos only ever show at ~84x108pt, so each is re-encoded at a small size as
// compressed JPEG instead of embedding multi-megapixel phone photos.
const EMBED_W = 170;
const EMBED_H = 220;
const JPEG_QUALITY = 0.78;

// Fetches the image ourselves (so canvas only ever sees a same-origin blob: URL)
// then re-encodes it. Works for any format the browser can decode, including
// .avif, which jsPDF can't embed directly.
async function loadImage(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve({ el, objectUrl });
      el.onerror = () => reject(new Error("Image decode failed"));
      el.src = objectUrl;
    });
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

// Cover-crops a photo to the card's portrait box without stretching it.
async function toPortraitJpeg(imageUrl) {
  const { el, objectUrl } = await loadImage(imageUrl);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = EMBED_W;
    canvas.height = EMBED_H;
    const ctx = canvas.getContext("2d");
    const w = el.naturalWidth || el.width;
    const h = el.naturalHeight || el.height;
    const targetRatio = EMBED_W / EMBED_H;
    let sw = w;
    let sh = w / targetRatio;
    if (sh > h) {
      sh = h;
      sw = h * targetRatio;
    }
    // Take the upper part of tall photos so faces stay in frame.
    const sx = (w - sw) / 2;
    const sy = Math.max(0, Math.min((h - sh) / 3, h - sh));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EMBED_W, EMBED_H);
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, EMBED_W, EMBED_H);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Keeps the logo's transparency (PNG) and its own proportions.
async function toLogoPng(imageUrl) {
  const { el, objectUrl } = await loadImage(imageUrl);
  try {
    const w = el.naturalWidth || el.width;
    const h = el.naturalHeight || el.height;
    const scale = Math.min(1, 420 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext("2d").drawImage(el, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function sortByJersey(players) {
  const numeric = (p) => {
    const n = Number.parseInt(p.jersey, 10);
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  };
  return [...players].sort((a, b) => numeric(a) - numeric(b) || String(a.name).localeCompare(String(b.name)));
}

function drawCard(doc, player, x, y) {
  const textX = x + TEXT_X_OFFSET;
  const textW = CARD_W - TEXT_X_OFFSET - 2;

  // Jersey number watermark, behind everything else in the card.
  if (player.jersey !== undefined && player.jersey !== null && player.jersey !== "") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(66);
    doc.setTextColor(...WATERMARK_GRAY);
    doc.text(String(player.jersey), x + CARD_W - 4, y + CARD_H - 16, { align: "right" });
  }

  if (player.__photoDataUrl) {
    try {
      doc.addImage(player.__photoDataUrl, "JPEG", x, y + 2, PHOTO_W, PHOTO_H);
    } catch {
      // The text still renders if one photo can't be embedded.
    }
  }

  let ty = y + 12;
  doc.setTextColor(...NAVY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const heading = `${String(player.name || "").toUpperCase()}${player.gradYear ? ` ${player.gradYear}` : ""}`;
  doc.splitTextToSize(heading, textW).slice(0, 2).forEach((line) => {
    doc.text(line, textX, ty);
    ty += 13;
  });
  ty += 1;

  doc.setFontSize(8);
  const row = (label, value) => {
    if (!value) return;
    doc.splitTextToSize(`${label}${value}`, textW).slice(0, 2).forEach((line) => {
      doc.text(line, textX, ty);
      ty += LINE_H;
    });
  };
  row("High School: ", player.highSchool);
  row("GPA: ", player.GPA);
  row("Positions: ", player.position);
  row("Bats/Throws: ", player.battingThrowing);

  // An email has no spaces to wrap on, so it shrinks to fit its line.
  if (player.contactEmail) {
    let size = 8;
    doc.setFontSize(size);
    while (size > MIN_FONT && doc.getTextWidth(player.contactEmail) > textW) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    doc.text(player.contactEmail, textX, ty);
    ty += LINE_H;
    doc.setFontSize(8);
  }
  if (player.phone) {
    doc.text(player.phone, textX, ty);
  }
}

function barHeading(doc, text, x, y, w) {
  doc.setFillColor(...DARK_BAR);
  doc.rect(x, y, w, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...BAR_TEXT);
  doc.text(text.toUpperCase(), x + w / 2, y + 18, { align: "center" });
  return y + 26;
}

// "JUNE 6-7: Jersey Outlaws Showcase" renders with the part before the first
// colon in bold, like the printed roster.
function drawEventLine(doc, line, x, y, w) {
  const colon = line.indexOf(":");
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  if (colon > 0 && colon < 28) {
    const label = `${line.slice(0, colon + 1)} `;
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    const labelW = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    const rest = doc.splitTextToSize(line.slice(colon + 1).trim(), w - labelW);
    doc.text(rest[0] || "", x + labelW, y);
    let used = 1;
    rest.slice(1).forEach((more) => {
      doc.text(more, x, y + used * 13);
      used += 1;
    });
    return y + used * 13 + 5;
  }
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(line, w);
  lines.forEach((l, i) => doc.text(l, x, y + i * 13));
  return y + lines.length * 13 + 5;
}

function drawLastPage(doc, { teamName, season, eventsHeading, events, staff, logo }) {
  const colW = 236;
  const leftX = MARGIN;
  const midX = MARGIN + colW + 14;
  const rightX = midX + 236 + 14;
  const rightW = PAGE_W - MARGIN - rightX;

  let y = barHeading(doc, eventsHeading || "Upcoming Events", leftX, MARGIN, colW) + 16;
  events.forEach((line) => {
    y = drawEventLine(doc, line, leftX, y, colW);
  });

  y += 12;
  y = barHeading(doc, "Coaching Staff", leftX, y, colW) + 16;
  staff.forEach((person) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(String(person.name || "").toUpperCase(), leftX, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (person.phone) {
      doc.text(`Phone: ${person.phone}`, leftX, y);
      y += 12;
    }
    if (person.email) {
      let size = 10;
      doc.setFontSize(size);
      while (size > MIN_FONT && doc.getTextWidth(`Email: ${person.email}`) > colW) {
        size -= 0.5;
        doc.setFontSize(size);
      }
      doc.text(`Email: ${person.email}`, leftX, y);
      y += 14;
    }
    y += 4;
  });

  barHeading(doc, "Notes", midX, MARGIN, 236);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.5);
  for (let ly = MARGIN + 60; ly < PAGE_H - MARGIN; ly += 24) {
    doc.line(midX, ly, midX + 236, ly);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  const nameLines = doc.splitTextToSize(String(teamName || "").toUpperCase(), rightW);
  doc.text(nameLines, rightX + rightW / 2, MARGIN + 18, { align: "center" });
  let ry = MARGIN + 18 + nameLines.length * 20 + 6;
  if (logo) {
    const maxSide = Math.min(rightW, 210);
    const ratio = logo.width / logo.height;
    const w = ratio >= 1 ? maxSide : maxSide * ratio;
    const h = ratio >= 1 ? maxSide / ratio : maxSide;
    try {
      doc.addImage(logo.dataUrl, "PNG", rightX + (rightW - w) / 2, ry, w, h);
    } catch {
      // The sheet is still useful without the logo.
    }
    ry += h + 18;
  }
  if (season) {
    doc.setFontSize(13);
    doc.text(season, rightX + rightW / 2, ry, { align: "center" });
  }
}

// `players` should already carry phone/contactEmail (private fields come from
// the coach/admin-only showcase-details request, not the public roster).
async function generateTeamRosterPdf({
  teamName,
  season = "",
  eventsHeading = "",
  events = [],
  staff = [],
  logoUrl = "",
  players,
}) {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "landscape" });

  // Pre-fetch every photo in parallel; one missing or undecodable photo never
  // stops the rest of the roster from rendering.
  const [withPhotos, logo] = await Promise.all([
    Promise.all(
      sortByJersey(players).map(async (player) => {
        try {
          const url = resolveImageUrl(player.image);
          return { ...player, __photoDataUrl: url ? await toPortraitJpeg(url) : null };
        } catch {
          return { ...player, __photoDataUrl: null };
        }
      })
    ),
    logoUrl ? toLogoPng(logoUrl).catch(() => null) : Promise.resolve(null),
  ]);

  const perPage = COLS * ROWS;
  withPhotos.forEach((player, i) => {
    if (i > 0 && i % perPage === 0) doc.addPage();
    const slot = i % perPage;
    const col = slot % COLS;
    const row = Math.floor(slot / COLS);
    drawCard(doc, player, MARGIN + col * (CARD_W + COL_GAP), MARGIN + row * (CARD_H + ROW_GAP));
  });

  if (events.length || staff.length || season || logo) {
    doc.addPage();
    drawLastPage(doc, { teamName, season, eventsHeading, events, staff, logo });
  }

  const fileNameSafe = String(teamName || "team").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${fileNameSafe}-roster.pdf`);
}

export { generateTeamRosterPdf };
