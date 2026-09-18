// Recreated as an SVG from a reference image (no source file available) — a
// simplified interpretation of the barbell/shield badge, not a pixel-exact
// copy. Swap for the real artwork if a source file ever becomes available.
function CetLogo({ className, height = 48 }) {
  return (
    <svg
      viewBox="0 0 320 210"
      height={height}
      className={className}
      role="img"
      aria-label="Competitive Edge Training logo"
    >
      <g stroke="#000" strokeWidth="2">
        <rect x="2" y="88" width="56" height="14" rx="2" fill="#fff" />
        <rect x="12" y="68" width="13" height="54" rx="3" fill="#fff" />
        <rect x="30" y="58" width="13" height="74" rx="3" fill="#fff" />
      </g>
      <g stroke="#000" strokeWidth="2" transform="translate(320,0) scale(-1,1)">
        <rect x="2" y="88" width="56" height="14" rx="2" fill="#fff" />
        <rect x="12" y="68" width="13" height="54" rx="3" fill="#fff" />
        <rect x="30" y="58" width="13" height="74" rx="3" fill="#fff" />
      </g>

      <polygon
        points="88,8 232,8 232,88 160,190 88,88"
        fill="#0a0a0a"
        stroke="#fff"
        strokeWidth="3"
      />
      <rect x="88" y="8" width="144" height="34" fill="#0a0a0a" stroke="#fff" strokeWidth="3" />
      <text
        x="160"
        y="32"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        COMPETITIVE
      </text>
      <rect x="88" y="42" width="144" height="32" fill="#e2222f" />
      <text
        x="160"
        y="66"
        textAnchor="middle"
        fontSize="22"
        fontWeight="900"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        EDGE
      </text>
      <text
        x="160"
        y="112"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        letterSpacing="1.5"
      >
        TRAINING
      </text>
    </svg>
  );
}

export default CetLogo;
