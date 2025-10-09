import React from 'react';
import './CountdownAnimation.css';

function CountdownAnimation({ timeLeft, totalTime }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / totalTime) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div className="countdown-animation">
      <svg width="100" height="100" className="countdown-svg">
        <circle
          className="countdown-bg"
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
        />
        <circle
          className="countdown-progress"
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy="7"
          className="countdown-text"
        >
          {timeLeft}s
        </text>
      </svg>
    </div>
  );
}

export default CountdownAnimation;