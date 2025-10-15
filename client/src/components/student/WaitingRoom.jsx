import React, { useState, useEffect } from 'react';
import { addStudentToWaitingRoom, startQuizFromWaitingRoom } from '../../utils/firestore';

const WaitingRoom = ({ activeQuiz, studentName, onQuizStarting }) => {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  // Join waiting room
  useEffect(() => {
    if (activeQuiz && studentName && !joined) {
      const joinWaitingRoom = async () => {
        try {
          const updatedParticipants = await addStudentToWaitingRoom(studentName);
          setParticipants(updatedParticipants);
          setJoined(true);
          console.log('✅ Joined waiting room:', studentName);
        } catch (error) {
          console.error('Error joining waiting room:', error);
        }
      };
      
      joinWaitingRoom();
    }
  }, [activeQuiz, studentName, joined]);

  // Listen for quiz start countdown
  useEffect(() => {
    if (!activeQuiz || !activeQuiz.quizStartTime) return;

    const calculateTimeUntilStart = () => {
      const now = Date.now();
      const startTime = activeQuiz.quizStartTime;
      return Math.max(0, startTime - now);
    };

    // Initial calculation
    setTimeUntilStart(calculateTimeUntilStart());

    const interval = setInterval(() => {
      const timeLeft = calculateTimeUntilStart();
      setTimeUntilStart(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        // Quiz should start automatically
        if (activeQuiz.status === 'waiting') {
          startQuizFromWaitingRoom();
        }
        onQuizStarting();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, onQuizStarting]);

  // Format countdown display
  useEffect(() => {
    if (timeUntilStart > 0) {
      setCountdown(Math.ceil(timeUntilStart / 1000));
    } else {
      setCountdown(null);
    }
  }, [timeUntilStart]);

  if (!activeQuiz) {
    return <div>Loading...</div>;
  }

  return (
    <div className="waiting-room">
      <div className="waiting-header">
        <h2>🚪 Waiting Room</h2>
        <div className="quiz-info">
          <h3>{activeQuiz.name}</h3>
          <p>Class: {activeQuiz.class}</p>
          <p>Questions: {activeQuiz.questions?.length || 0}</p>
          <p>Time per Question: {activeQuiz.timePerQuestion}s</p>
        </div>
      </div>

      <div className="waiting-content">
        {countdown !== null && countdown > 0 ? (
          <div className="countdown-section">
            <div className="countdown-display">
              <h3>🎯 Quiz Starting In...</h3>
              <div className="countdown-number">{countdown}</div>
              <p>Get ready! The quiz will start automatically.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="waiting-message">
              <h3>👋 Welcome, {studentName}!</h3>
              <p>You've joined the waiting room. The quiz will start when the admin begins the session.</p>
              <div className="status-indicator">
                <span className="status-dot"></span>
                Waiting for admin to start...
              </div>
            </div>

            <div className="participants-section">
              <h4>👥 Participants ({participants.length})</h4>
              <div className="participants-list">
                {participants.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <span className="participant-avatar">👤</span>
                    <span className="participant-name">
                      {participant}
                      {participant === studentName && ' (You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="instructions">
          <h4>📋 Instructions</h4>
          <ul>
            <li>✅ Quiz will start automatically when countdown begins</li>
            <li>⏱️ Each question has {activeQuiz.timePerQuestion} seconds</li>
            <li>📱 Do not refresh or leave the page</li>
            <li>🎯 Select answers quickly - time is limited!</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .waiting-room {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .waiting-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .waiting-header h2 {
          color: #2c3e50;
          margin-bottom: 20px;
        }

        .quiz-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
        }

        .quiz-info h3 {
          color: #007bff;
          margin-bottom: 10px;
        }

        .quiz-info p {
          margin: 5px 0;
          color: #6c757d;
        }

        .countdown-section {
          text-align: center;
          padding: 40px 20px;
        }

        .countdown-display h3 {
          color: #2c3e50;
          margin-bottom: 20px;
        }

        .countdown-number {
          font-size: 4rem;
          font-weight: bold;
          color: #007bff;
          margin: 20px 0;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .waiting-message {
          text-align: center;
          padding: 30px 20px;
          background: #e7f3ff;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .waiting-message h3 {
          color: #007bff;
          margin-bottom: 10px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
          color: #6c757d;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #ffc107;
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .participants-section {
          margin: 30px 0;
        }

        .participants-section h4 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .participants-list {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          max-height: 200px;
          overflow-y: auto;
        }

        .participant-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .participant-item:last-child {
          border-bottom: none;
        }

        .participant-avatar {
          font-size: 1.2rem;
        }

        .participant-name {
          color: #495057;
        }

        .instructions {
          background: #fff3cd;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #ffc107;
        }

        .instructions h4 {
          color: #856404;
          margin-bottom: 10px;
        }

        .instructions ul {
          margin: 0;
          padding-left: 20px;
          color: #856404;
        }

        .instructions li {
          margin-bottom: 5px;
        }

        @media (max-width: 768px) {
          .waiting-room {
            padding: 20px 15px;
            margin: 10px;
          }

          .countdown-number {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WaitingRoom;