import { jsPDF } from "jspdf";
import { resolveImageUrl } from "./media.js";

const NAVY = [10, 25, 47];
const GRAY_TEXT = [40, 40, 40];
const WATERMARK_GRAY = [210, 210, 210];

const PAGE_MARGIN = 24;
const COLS = 3;
const CARD_GAP = 10;
const PHOTO_SIZE = 100;
const CARD_HEIGHT = 210;

// Photos only ever display at ~100x100pt in the PDF, so embedding them at
// full source resolution as lossless PNG (some of these are multi-megapixel
// phone photos) bloats the file to tens of megabytes for a single roster
// sheet. Downscale to a small square and re-encode as compressed JPEG —
// imperceptible quality loss at this display size, file size drops by
// orders of magnitude.
const EMBED_PX = 160;
const JPEG_QUALITY = 0.75;

// Fetches the image ourselves (so canvas only ever sees a same-origin blob:
// URL, never the original cross-origin one) then re-encodes via canvas —
// this works regardless of source format (jsPDF can't embed .avif directly,
// but the browser's own decoder handles it fine once drawn to a canvas).
async function toEmbeddableJpeg(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image decode failed"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = EMBED_PX;
    canvas.height = EMBED_PX;
    const ctx = canvas.getContext("2d");
    // Cover-crop to a square so headshots of any source aspect ratio fill
    // the card photo box without stretching.
    const sourceSize = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const sx = ((img.naturalWidth || img.width) - sourceSize) / 2;
    const sy = ((img.naturalHeight || img.height) - sourceSize) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EMBED_PX, EMBED_PX);
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, EMBED_PX, EMBED_PX);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawCard(doc, player, x, y) {
  const cardWidth = COLS === 3 ? (612 - 2 * PAGE_MARGIN - (COLS - 1) * CARD_GAP) / COLS : 180;

  // Watermark jersey number, behind everything else in the card.
  if (player.jersey !== undefined && player.jersey !== null && player.jersey !== "") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.setTextColor(...WATERMARK_GRAY);
    doc.text(String(player.jersey), x + cardWidth - 8, y + CARD_HEIGHT - 20, { align: "right" });
  }

  // Photo
  if (player.__photoDataUrl) {
    try {
      doc.addImage(player.__photoDataUrl, "JPEG", x, y, PHOTO_SIZE, PHOTO_SIZE);
    } catch {
      // Fall through — text content below still renders even if the image failed.
    }
  }

  let textY = y + PHOTO_SIZE + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  const nameLine = `${player.name}${player.gradYear ? ` ${player.gradYear}` : ""}`;
  doc.text(nameLine, x, textY, { maxWidth: cardWidth });
  textY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TEXT);

  const line = (label, value) => {
    if (!value) return;
    doc.text(`${label ? `${label}: ` : ""}${value}`, x, textY, { maxWidth: cardWidth });
    textY += 11;
  };

  line("", player.highSchool);
  line("GPA", player.GPA);
  line("Positions", player.position);
  line("Bats/Throws", player.battingThrowing);
  line("", player.contactEmail);
}

// Generates a multi-page printable roster sheet (grid of player cards with
// photo, jersey number, school/GPA/position/bats-throws/email) for coaches
// to print and bring to games — distinct from the single-player recruiting
// profile PDF, which is a one-pager for one athlete.
async function generateTeamRosterPdf({ teamName, players }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cardWidth = (pageWidth - 2 * PAGE_MARGIN - (COLS - 1) * CARD_GAP) / COLS;

  // Pre-fetch all photos up front (in parallel) — a single failed photo
  // (missing file, unsupported format, network hiccup) never blocks the
  // rest of the roster from rendering.
  const withPhotos = await Promise.all(
    players.map(async (player) => {
      try {
        const url = resolveImageUrl(player.image);
        const dataUrl = url ? await toEmbeddableJpeg(url) : null;
        return { ...player, __photoDataUrl: dataUrl };
      } catch {
        return { ...player, __photoDataUrl: null };
      }
    })
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text(`${teamName} — Team Roster`, PAGE_MARGIN, PAGE_MARGIN + 10);

  let col = 0;
  let row = 0;
  const topOfGrid = PAGE_MARGIN + 34;
  const rowsPerPage = Math.floor((pageHeight - topOfGrid - PAGE_MARGIN) / (CARD_HEIGHT + CARD_GAP));

  withPhotos.forEach((player, index) => {
    if (row >= rowsPerPage) {
      doc.addPage();
      row = 0;
      col = 0;
    }
    const x = PAGE_MARGIN + col * (cardWidth + CARD_GAP);
    const y = topOfGrid + row * (CARD_HEIGHT + CARD_GAP);
    drawCard(doc, player, x, y);

    col += 1;
    if (col >= COLS) {
      col = 0;
      row += 1;
    }
  });

  const fileNameSafe = teamName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${fileNameSafe}-roster.pdf`);
}

export { generateTeamRosterPdf };
