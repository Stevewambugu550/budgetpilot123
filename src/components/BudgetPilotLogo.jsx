/**
 * BudgetPilot brand logo — custom SVG badge.
 * Concept: gradient badge with a bold $ and a rising trend line
 * to capture "budget tracking + financial navigation".
 */
const BudgetPilotLogo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      {/* Main diagonal gradient — emerald to deep forest */}
      <linearGradient id="bpBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#34d399" />
        <stop offset="55%"  stopColor="#0a9659" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>

      {/* Soft radial glow in top-left for depth */}
      <radialGradient id="bpGlow" cx="30%" cy="28%" r="55%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
      </radialGradient>

      {/* Subtle inner shadow at bottom */}
      <linearGradient id="bpShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#000000" stopOpacity="0"    />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
      </linearGradient>
    </defs>

    {/* Badge background */}
    <rect width="40" height="40" rx="11" fill="url(#bpBg)" />
    {/* Glow layer */}
    <rect width="40" height="40" rx="11" fill="url(#bpGlow)" />
    {/* Inner shadow layer */}
    <rect width="40" height="40" rx="11" fill="url(#bpShadow)" />

    {/* Bold dollar sign — slightly offset up to leave room for trend line */}
    <text
      x="20"
      y="19"
      fontFamily="Inter, Arial, sans-serif"
      fontSize="22"
      fontWeight="900"
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      letterSpacing="-0.5"
    >
      $
    </text>

    {/* Rising trend line — the "Pilot" metaphor */}
    <polyline
      points="5,34 11,28 17,30 24,22 33,16"
      stroke="white"
      strokeWidth="2"
      strokeOpacity="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Glowing dot at the tip of the trend line */}
    <circle cx="33" cy="16" r="2.4" fill="white" fillOpacity="0.9" />
    <circle cx="33" cy="16" r="4"   fill="white" fillOpacity="0.2" />
  </svg>
)

export default BudgetPilotLogo
