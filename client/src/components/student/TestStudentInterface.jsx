import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import QuizInterface from './QuizInterface';
import { saveOrUpdateQuizResult, getScheduledQuizzes } from '../../utils/firestore';
const TestStudentInterface = () => {
  const { activeQuiz, loading } = useQuiz();
  const [studentName, setStudentName] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);

  // Load scheduled quizzes
  useEffect(() => {
    loadScheduledQuizzes();
    const interval = setInterval(loadScheduledQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScheduledQuizzes = async () => {
    try {
      console.log('📅 Loading scheduled quizzes...');
      const quizzes = await getScheduledQuizzes();
      console.log('📅 Scheduled quizzes found:', quizzes.length);
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
    
    console.log('🎯 Starting quiz for student:', studentName);
    setQuizStarted(true);
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

    await saveOrUpdateQuizResult(result); // ← CHANGED TO NEW FUNCTION
    setScore(finalScore);
    setQuizCompleted(true);
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

  // Show quiz completed state
  if (quizCompleted) {
    return (
      <div className="quiz-results">
        <h2>🎉 Quiz Completed!</h2>
        <div className="score-card">
          <h3>Your Score: {score}/{activeQuiz.questions.length}</h3>
          <p>Percentage: {Math.round((score / activeQuiz.questions.length) * 100)}%</p>
        </div>
        <button 
          onClick={() => {
            setQuizStarted(false);
            setQuizCompleted(false);
            setScore(null);
            setStudentName('');
          }}
          className="btn btn-primary"
        >
          Take Another Quiz
        </button>
      </div>
    );
  }

  // Show active quiz lobby
  if (activeQuiz && activeQuiz.status === 'active' && !quizStarted) {
    return (
      <div className="quiz-lobby">
        <div className="lobby-header">
          <h2>🎯 {activeQuiz.name}</h2>
          <span className="quiz-status active">LIVE</span>
        </div>
        
        <div className="quiz-info">
          <p><strong>Class:</strong> {activeQuiz.class}</p>
          <p><strong>Questions:</strong> {activeQuiz.questions?.length || 0}</p>
          <p><strong>Time per Question:</strong> {activeQuiz.timePerQuestion} seconds</p>
          {activeQuiz.quizStartTime && (
            <p><strong>Started:</strong> {new Date(activeQuiz.quizStartTime).toLocaleTimeString()}</p>
          )}
        </div>

        <div className="join-section">
          <input
            type="text"
            placeholder="Enter your full name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="name-input"
          />
          <button 
            onClick={handleStartQuiz}
            disabled={!studentName.trim()}
            className="btn btn-success"
          >
            Join Quiz Now
          </button>
        </div>

        <div className="quiz-tips">
          <h4>💡 Quick Tips:</h4>
          <ul>
            <li>Questions auto-progress every {activeQuiz.timePerQuestion} seconds</li>
            <li>Select your answer - it will be automatically saved</li>
            <li>You can change your answer until time runs out</li>
            <li>Late joiners will miss questions they joined after</li>
          </ul>
        </div>
      </div>
    );
  }

  // Show quiz interface
  if (quizStarted && activeQuiz) {
    return (
      <QuizInterface 
        activeQuiz={activeQuiz}
        studentName={studentName}
        onQuizComplete={handleQuizComplete}
      />
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
            placeholder="Enter your full name for future quizzes"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="name-input"
          />
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
            <p>Enter your name and click "Join Quiz Now" when a quiz is active</p>
          </div>
          <div className="instruction-card">
            <h4>⏱️ Auto Progress</h4>
            <p>Questions automatically advance every few seconds</p>
          </div>
          <div className="instruction-card">
            <h4>✅ Answer Selection</h4>
            <p>Click any option to select your answer</p>
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

export default TestStudentInterface;