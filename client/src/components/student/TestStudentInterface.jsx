import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import QuizInterface from './QuizInterface';
import WaitingRoom from './WaitingRoom';
import { saveOrUpdateQuizResult, getScheduledQuizzes } from '../../utils/firestore';

const StudentQuiz = () => {
  const { activeQuiz, loading } = useQuiz();
  const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save student name to localStorage when it changes
  useEffect(() => {
    if (studentName.trim()) {
      localStorage.setItem('studentName', studentName.trim());
    }
  }, [studentName]);

  // Load scheduled quizzes
  useEffect(() => {
    loadScheduledQuizzes();
    const interval = setInterval(loadScheduledQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Safe fullscreen functions
  const enterFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    // Check if we're actually in fullscreen before trying to exit
    if (document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement) {
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log('Exit fullscreen error:', err);
        });
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(false);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-manage waiting room based on quiz status
  useEffect(() => {
    if (!activeQuiz || !studentName.trim()) return;

    console.log('🎯 Quiz Status:', activeQuiz.status);
    
    if ((activeQuiz.status === 'waiting' && !quizStarted && !inWaitingRoom)) {
      // Auto-join waiting room for waiting quizzes
      setInWaitingRoom(true);
    } else if ((activeQuiz.status === 'active' && inWaitingRoom)) {
      // Auto-start quiz when it becomes active
      setInWaitingRoom(false);
      setQuizStarted(true);
      enterFullscreen();
    } else if (activeQuiz.status === 'completed') {
      // Handle quiz completion
      setInWaitingRoom(false);
      setQuizStarted(false);
      exitFullscreen();
    }
  }, [activeQuiz, studentName, quizStarted, inWaitingRoom]);

  // Copy protection
  useEffect(() => {
    const handleCopy = (e) => {
      if (quizStarted) {
        e.preventDefault();
        alert('Copying is disabled during the quiz!');
      }
    };

    const handleContextMenu = (e) => {
      if (quizStarted) {
        e.preventDefault();
        alert('Right-click is disabled during the quiz!');
      }
    };

    const handleKeyDown = (e) => {
      if (quizStarted && ((e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) || e.key === 'PrintScreen' || e.key === 'F12')) {
        e.preventDefault();
        alert('This action is disabled during the quiz!');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizStarted]);

  const loadScheduledQuizzes = async () => {
    try {
      const quizzes = await getScheduledQuizzes();
      setScheduledQuizzes(quizzes);
    } catch (error) {
      console.error('❌ Error loading scheduled quizzes:', error);
    } finally {
      setScheduledLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!studentName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!activeQuiz) {
      alert('No active quiz found');
      return;
    }

    console.log('🎯 Starting quiz process:', activeQuiz.status);
    
    if (activeQuiz.status === 'waiting') {
      // Join waiting room for scheduled quizzes
      setInWaitingRoom(true);
    } else if (activeQuiz.status === 'active') {
      // Start quiz immediately for active quizzes
      setQuizStarted(true);
      enterFullscreen();
    }
  };

  const handleQuizStarting = () => {
    setInWaitingRoom(false);
    setQuizStarted(true);
    enterFullscreen();
  };

  const handleQuizComplete = async (finalScore) => {
    try {
      const result = {
        studentName: studentName.trim(),
        score: finalScore,
        totalQuestions: activeQuiz.questions.length,
        percentage: Math.round((finalScore / activeQuiz.questions.length) * 100),
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        joinTime: Date.now(),
        completedAt: Date.now()
      };

      await saveOrUpdateQuizResult(result);
      setScore(finalScore);
      setQuizCompleted(true);
      exitFullscreen();
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Helper function to calculate time remaining
  const getTimeRemaining = (scheduledTime) => {
    const now = Date.now();
    const timeLeft = scheduledTime - now;
    
    if (timeLeft <= 0) return 'Starting soon...';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loader"></div>
        <p>Loading quiz data...</p>
      </div>
    );
  }

  // Show waiting room
  if (inWaitingRoom && activeQuiz) {
    return (
      <WaitingRoom 
        activeQuiz={activeQuiz}
        studentName={studentName}
        onQuizStarting={handleQuizStarting}
      />
    );
  }

  // Show quiz completed state
  if (quizCompleted) {
    return (
      <div className="quiz-results">
        <div className="results-container">
          <h2>🎉 Quiz Completed!</h2>
          <div className="score-card">
            <div className="score-circle">
              <span className="score-value">{score}</span>
              <span className="score-total">/{activeQuiz.questions.length}</span>
            </div>
            <div className="score-details">
              <h3>Your Performance</h3>
              <p className="percentage">{Math.round((score / activeQuiz.questions.length) * 100)}%</p>
              <div className="quiz-info">
                <p><strong>Quiz:</strong> {activeQuiz.name}</p>
                <p><strong>Class:</strong> {activeQuiz.class}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setQuizStarted(false);
              setQuizCompleted(false);
              setScore(null);
              setInWaitingRoom(false);
            }}
            className="btn btn-primary"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  // Show active quiz interface
  if (quizStarted && activeQuiz) {
    return (
      <div className="quiz-container">
        {!isFullscreen && (
          <div className="fullscreen-warning">
            ⚠️ Please enter fullscreen mode for the best experience
            <button onClick={enterFullscreen} className="btn btn-warning btn-sm">
              Enter Fullscreen
            </button>
          </div>
        )}
        <QuizInterface 
          activeQuiz={activeQuiz}
          studentName={studentName}
          onQuizComplete={handleQuizComplete}
        />
      </div>
    );
  }

  // Show active quiz lobby
  if (activeQuiz && (activeQuiz.status === 'active' || activeQuiz.status === 'waiting')) {
    return (
      <div className="quiz-lobby">
        <div className="lobby-header">
          <h2>🎯 {activeQuiz.name}</h2>
          <span className={`quiz-status ${activeQuiz.status === 'waiting' ? 'waiting' : 'active'}`}>
            {activeQuiz.status === 'waiting' ? '🕐 STARTING SOON' : 'LIVE'}
          </span>
        </div>
        
        <div className="quiz-info">
          <p><strong>Class:</strong> {activeQuiz.class}</p>
          <p><strong>Questions:</strong> {activeQuiz.questions?.length || 0}</p>
          <p><strong>Time per Question:</strong> {activeQuiz.timePerQuestion} seconds</p>
          {activeQuiz.status === 'waiting' && activeQuiz.quizStartTime && (
            <p><strong>Starts in:</strong> {Math.ceil((activeQuiz.quizStartTime - Date.now()) / 1000)} seconds</p>
          )}
        </div>

        {activeQuiz.status === 'waiting' && (
          <div className="waiting-notice">
            <div className="waiting-icon">⏳</div>
            <h3>Quiz Starting Soon</h3>
            <p>Join the waiting room to be ready when the quiz starts.</p>
          </div>
        )}

        <div className="join-section">
          {!studentName.trim() && (
            <input
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="name-input"
            />
          )}
          <button 
            onClick={handleStartQuiz}
            disabled={!studentName.trim()}
            className={`btn ${activeQuiz.status === 'waiting' ? 'btn-warning' : 'btn-success'}`}
          >
            {activeQuiz.status === 'waiting' ? '🚪 Join Waiting Room' : '🎯 Start Quiz Now'}
          </button>
        </div>

        {studentName.trim() && (
          <div className="student-welcome">
            <p>Welcome, <strong>{studentName}</strong>! Ready to start the quiz?</p>
          </div>
        )}

        <div className="quiz-tips">
          <h4>💡 Important Instructions</h4>
          <ul>
            <li>📱 Quiz will open in <strong>fullscreen mode</strong></li>
            <li>⏱️ Each question has {activeQuiz.timePerQuestion} seconds</li>
            <li>🚫 Copying questions/answers is <strong>disabled</strong></li>
            <li>📵 Do not refresh or leave the page during quiz</li>
            <li>🎯 Select answers quickly - time is limited!</li>
          </ul>
        </div>
      </div>
    );
  }

  // Show no active quiz state with scheduled quizzes
  return (
    <div className="no-quiz">
      <div className="welcome-section">
        <h2>📚 Student Quiz Portal</h2>
        <p>Enter your name and join active quizzes or check scheduled ones below.</p>
        
        <div className="student-info">
          <input
            type="text"
            placeholder="Enter your full name for all quizzes"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="name-input"
          />
          {studentName.trim() && (
            <p className="welcome-message">Welcome, {studentName}! You're all set for any quiz.</p>
          )}
        </div>
      </div>

      {/* Scheduled Quizzes Section */}
      <div className="scheduled-quizzes-section">
        <h3>📅 Upcoming Quizzes</h3>
        
        {scheduledLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading scheduled quizzes...</p>
          </div>
        ) : scheduledQuizzes.length > 0 ? (
          <div className="scheduled-quizzes-grid">
            {scheduledQuizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card scheduled">
                <div className="quiz-info">
                  <h4>{quiz.name}</h4>
                  <p className="quiz-class">Class: {quiz.class}</p>
                  <div className="scheduled-time">
                    <span>🕒 Starts at: {new Date(quiz.scheduledTime).toLocaleString()}</span>
                  </div>
                  <div className="time-remaining">
                    <span>⏰ Starts in: {getTimeRemaining(quiz.scheduledTime)}</span>
                  </div>
                  <div className="quiz-details">
                    <div className="detail">
                      <span>Questions</span>
                      <strong>{quiz.questions?.length || 0}</strong>
                    </div>
                    <div className="detail">
                      <span>Time per Q</span>
                      <strong>{quiz.timePerQuestion}s</strong>
                    </div>
                    <div className="detail">
                      <span>Total Time</span>
                      <strong>{Math.ceil((quiz.questions?.length || 0) * quiz.timePerQuestion / 60)}min</strong>
                    </div>
                  </div>
                </div>
                <div className="quiz-notice">
                  <p>🔔 This quiz will start automatically at the scheduled time</p>
                  {studentName.trim() && (
                    <p className="ready-message">✅ You're registered as: {studentName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-scheduled-quizzes">
            <p>No upcoming quizzes scheduled. Check back later!</p>
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div className="instructions-section">
        <h3>ℹ️ How it Works</h3>
        <div className="instructions-grid">
          <div className="instruction-card">
            <h4>📝 Join Quiz</h4>
            <p>Enter your name once and join any active quiz instantly</p>
          </div>
          <div className="instruction-card">
            <h4>🖥️ Fullscreen Mode</h4>
            <p>Quizzes automatically open in fullscreen for better focus</p>
          </div>
          <div className="instruction-card">
            <h4>⏱️ Auto Progress</h4>
            <p>Questions automatically advance every few seconds</p>
          </div>
          <div className="instruction-card">
            <h4>📊 Instant Results</h4>
            <p>See your score immediately after quiz completion</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;