import React, { useState, useEffect } from 'react';
import { addStudentToWaitingRoom } from '../../utils/firestore';

const WaitingRoom = ({ activeQuiz, studentName, onQuizStarting }) => {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [countdown, setCountdown] = useState(null);

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

  // Listen for quiz start
  useEffect(() => {
    if (!activeQuiz) return;

    // Check if quiz is starting
    if (activeQuiz.status === 'starting' && activeQuiz.quizStartTime) {
      const startTime = activeQuiz.quizStartTime;
      const now = Date.now();
      const timeUntilStart = startTime - now;

      if (timeUntilStart > 0) {
        // Start countdown
        const countdownInterval = setInterval(() => {
          const timeLeft = activeQuiz.quizStartTime - Date.now();
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            onQuizStarting();
          } else {
            setCountdown(Math.ceil(timeLeft / 1000));
          }
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      }
    }
  }, [activeQuiz, onQuizStarting]);

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
        {countdown ? (
          <div className="countdown-section">
            <div className="countdown-display">
              <h3>🎯 Quiz Starting In...</h3>
              <div className="countdown-number">{countdown}</div>
              <p>Get ready! Full screen will activate automatically.</p>
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

            <div className="instructions">
              <h4>📋 Instructions</h4>
              <ul>
                <li>✅ Quiz will start automatically when admin begins</li>
                <li>🖥️ Full screen will activate automatically</li>
                <li>⏱️ Each question has {activeQuiz.timePerQuestion} seconds</li>
                <li>📱 Do not refresh or leave the page</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;