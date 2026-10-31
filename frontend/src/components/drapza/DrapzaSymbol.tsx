export function DrapzaSymbol({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Vertical axis */}
      <line
        x1="100"
        y1="10"
        x2="100"
        y2="190"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Horizontal axis */}
      <line
        x1="20"
        y1="100"
        x2="180"
        y2="100"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Upper orbit */}
      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="28"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(-35 100 100)"
      />
      {/* Lower orbit */}
      <ellipse
        cx="100"
        cy="100"
        rx="70"
        ry="28"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(35 100 100)"
      />
      {/* Center node */}
      <circle cx="100" cy="100" r="5" fill="currentColor" />
    </svg>
  );
}

export const DigifoxSymbol = DrapzaSymbol;

