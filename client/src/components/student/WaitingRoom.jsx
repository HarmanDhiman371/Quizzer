import React, { useState, useEffect } from 'react';

const WaitingRoom = ({ activeQuiz, studentName }) => {
  const [participants, setParticipants] = useState(activeQuiz?.waitingParticipants || []);
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Listen for quiz start and participants updates
  useEffect(() => {
    if (!activeQuiz) return;

    if (activeQuiz.waitingParticipants) {
      setParticipants(activeQuiz.waitingParticipants);
    }
  }, [activeQuiz]);

  if (!activeQuiz) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading waiting room...</p>
      </div>
    );
  }

  return (
    <div className="waiting-room">
      <div className={`waiting-container ${isVisible ? 'visible' : ''}`}>
        {/* Header Section */}
        <div className="waiting-header">
          <div className="header-icon">⏳</div>
          <h2>Waiting Room</h2>
          <div className="quiz-info">
            <h3>{activeQuiz.name}</h3>
            <div className="quiz-meta">
              <span className="meta-item">🏫 {activeQuiz.class}</span>
              <span className="meta-item">📝 {activeQuiz.questions?.length || 0} Questions</span>
              <span className="meta-item">⏱️ {activeQuiz.timePerQuestion}s per Q</span>
            </div>
            {activeQuiz.isFromScheduled && (
              <div className="scheduled-badge">
                📅 Scheduled Quiz
              </div>
            )}
          </div>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-avatar">👋</div>
          <h3>Welcome, {studentName}!</h3>
          <p>You've joined the waiting room. The quiz will begin shortly when the admin starts the session.</p>
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>Waiting for quiz to start...</span>
          </div>
        </div>

        {/* Participants Section */}
        <div className="participants-section">
          <div className="section-header">
            <h4>👥 Participants</h4>
            <span className="participant-count">{participants.length} joined</span>
          </div>
          
          <div className="participants-grid">
            {participants.map((participant, index) => (
              <div 
                key={index} 
                className={`participant-card ${participant === studentName ? 'you' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="participant-avatar">
                  {participant === studentName ? '🌟' : '👤'}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{participant}</span>
                  {participant === studentName && (
                    <span className="you-badge">You</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions Section */}
        <div className="instructions-section">
          <h4>📋 Important Instructions</h4>
          <div className="instructions-grid">
            <div className="instruction-item">
              <div className="instruction-icon">⚡</div>
              <div className="instruction-content">
                <strong>Auto Start</strong>
                <p>Quiz begins automatically when admin starts</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">⏱️</div>
              <div className="instruction-content">
                <strong>Time Limit</strong>
                <p>{activeQuiz.timePerQuestion} seconds per question</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">📱</div>
              <div className="instruction-content">
                <strong>Stay On Page</strong>
                <p>Don't refresh or leave during the quiz</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-icon">🎯</div>
              <div className="instruction-content">
                <strong>Quick Answers</strong>
                <p>Select answers quickly - time is limited!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p>Preparing your quiz experience...</p>
        </div>
      </div>

      <style jsx>{`
        .waiting-room {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .waiting-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          max-width: 800px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .waiting-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Header Styles */
        .waiting-header {
          text-align: center;
          margin-bottom: 40px;
          animation: slideDown 0.8s ease-out;
        }

        .header-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .waiting-header h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .quiz-info h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.6rem;
          font-weight: 600;
        }

        .quiz-meta {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .meta-item {
          background: rgba(102, 126, 234, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          color: #667eea;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .scheduled-badge {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Welcome Section */
        .welcome-section {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          padding: 30px;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 30px;
          border: 1px solid rgba(33, 150, 243, 0.2);
          animation: slideUp 0.8s ease-out 0.2s both;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .welcome-avatar {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .welcome-section h3 {
          color: #1565c0;
          margin-bottom: 10px;
          font-size: 1.4rem;
        }

        .welcome-section p {
          color: #455a64;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #ff9800;
          font-weight: 600;
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #ff9800;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.5);
            opacity: 0.7;
          }
        }

        /* Participants Section */
        .participants-section {
          margin-bottom: 30px;
          animation: slideUp 0.8s ease-out 0.4s both;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h4 {
          color: #2c3e50;
          font-size: 1.3rem;
          margin: 0;
        }

        .participant-count {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 6px 12px;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .participants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }

        .participant-card {
          background: white;
          padding: 15px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid transparent;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          animation: slideIn 0.6s ease-out both;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .participant-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .participant-card.you {
          border-color: #ffd700;
          background: linear-gradient(135deg, #fff9c4, #fff59d);
        }

        .participant-avatar {
          font-size: 1.8rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
        }

        .participant-info {
          flex: 1;
        }

        .participant-name {
          display: block;
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .you-badge {
          background: #ffd700;
          color: #856404;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        /* Instructions Section */
        .instructions-section {
          animation: slideUp 0.8s ease-out 0.6s both;
        }

        .instructions-section h4 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.3rem;
          text-align: center;
        }

        .instructions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .instruction-item {
          background: white;
          padding: 20px;
          border-radius: 15px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border-left: 4px solid #667eea;
        }

        .instruction-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .instruction-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .instruction-content strong {
          display: block;
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 1rem;
        }

        .instruction-content p {
          color: #6c757d;
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        /* Loading Animation */
        .loading-animation {
          text-align: center;
          margin-top: 30px;
          animation: slideUp 0.8s ease-out 0.8s both;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 15px;
        }

        .dot {
          width: 10px;
          height: 10px;
          background: #667eea;
          border-radius: 50%;
          animation: dot-bounce 1.4s ease-in-out infinite both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .loading-animation p {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
        }

        /* Loading Container */
        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .waiting-container {
            padding: 30px 20px;
            margin: 10px;
            border-radius: 20px;
          }

          .waiting-header h2 {
            font-size: 2rem;
          }

          .quiz-meta {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .participants-grid {
            grid-template-columns: 1fr;
          }

          .instructions-grid {
            grid-template-columns: 1fr;
          }

          .instruction-item {
            padding: 15px;
          }

          .header-icon {
            font-size: 3rem;
          }
        }

        @media (max-width: 480px) {
          .waiting-room {
            padding: 10px;
          }

          .waiting-container {
            padding: 25px 15px;
          }

          .welcome-section {
            padding: 20px;
          }

          .section-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default WaitingRoom;