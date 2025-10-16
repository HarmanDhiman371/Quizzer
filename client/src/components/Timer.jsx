// import React, { useState, useEffect } from 'react';
// import CountdownAnimation from './CountdownAnimation';

// function Timer({ duration, onTimeUp, isActive = true }) {
//   const [timeLeft, setTimeLeft] = useState(duration);

//   useEffect(() => {
//     setTimeLeft(duration);
//   }, [duration]);

//   useEffect(() => {
//     if (!isActive) return;

//     if (timeLeft <= 0) {
//       onTimeUp();
//       return;
//     }

//     const timer = setTimeout(() => {
//       setTimeLeft(timeLeft - 1);
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, [timeLeft, onTimeUp, isActive]);

//   return (
//     <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
//       <CountdownAnimation timeLeft={timeLeft} totalTime={duration} />
//       <span className="timer-text">Time Left: {timeLeft}s</span>
//     </div>
//   );
// }

// export default Timer;