import React from 'react';

const Timer = ({ timeRemaining }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <span className="timer-label">Time Left:</span>
      <span className={`timer-value ${timeRemaining <= 10 ? 'warning' : ''}`}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

export default Timer;