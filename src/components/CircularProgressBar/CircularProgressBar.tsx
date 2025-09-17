import React from "react";

interface CircularProgressBarProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: React.ReactNode;
  ariaLabel?: string;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  percent,
  size = 120,
  strokeWidth = 10,
  label,
  ariaLabel = "Progress",
}) => {
  // Circle Geometry
  const r = (size - strokeWidth) / 2; //radius
  const cx = size / 2; // center x
  const cy = size / 2; // center y
  const circumference = 2 * Math.PI * r; //ring length

  // Clamp percent and convert to dash offset
  const pct = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - pct / 100);

  // Font sizes scale a bit with the component size
  const percentFont = Math.round(size * 0.22); // 26px at 120
  const labelFont = Math.round(size * 0.12); //14px at 120

  return (
    <div
      className="cp-wrap"
      role="img"
      aria-label={`${ariaLabel}: ${Math.round(pct)}%`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        {/* Track (background ring) */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#F4B400"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`} /* start at 12 o’clock */
        />

        {/* Centered text (two lines) */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#111827"
          fontFamily="Roboto, Helvetica, Arial, sans-serif"
        >
          <tspan
            x="50%"
            dy={`-${label ? percentFont * 0.2 : 0}px`}
            fontSize={percentFont}
            fontWeight="700"
          >
            {Math.round(pct)}%
          </tspan>
          {label ? (
            <tspan
              x="50%"
              dy={`${percentFont * 0.9}px`}
              fontSize={labelFont}
              fill="#6b7280"
            >
              {label}
            </tspan>
          ) : null}
        </text>
      </svg>

      {/* Center content */}
      {/* <div className="cp-center">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="cp-percent">{Math.round(pct)}%</div>
          {label ? <div className="cp-label">{label}</div> : null}
        </div>
      </div> */}
    </div>
  );
};

export default CircularProgressBar;
