import React, { useState, useEffect } from 'react';
import { 
  getQuizzesFromFirestore, 
  deleteQuizFromFirestore, 
  setActiveQuiz
} from '../../utils/firestore';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    loadQuizzes();
    const interval = setInterval(loadQuizzes, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for quiz start
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const scheduledQuizzes = await getQuizzesFromFirestore();
      setQuizzes(scheduledQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      alert('Error loading quizzes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      setStartingQuiz(quiz.id);
      setCountdown(10);

      // Set quiz to waiting room with 10-second countdown
      await setActiveQuiz(quiz);
      
      // Start the 10-second countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setStartingQuiz(null);
            setCountdown(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz: ' + error.message);
      setStartingQuiz(null);
      setCountdown(0);
    }
  };

  const handleDeleteQuiz = async (quizId, quizName) => {
    if (!window.confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteQuizFromFirestore(quizId);
      alert('🗑️ Quiz deleted successfully!');
      await loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Error deleting quiz: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="quiz-manager">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-manager">
      <div className="manager-header">
        <h3>📚 Quiz Management</h3>
        <div className="manager-actions-header">
          {countdown > 0 && (
            <div className="countdown-banner">
              🚀 Quiz starting in: {countdown}s
            </div>
          )}
          <button onClick={loadQuizzes} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="quizzes-list">
        {quizzes.length === 0 ? (
          <div className="empty-state">
            <p>No scheduled quizzes found.</p>
            <p>Create a new quiz in the Create Quiz tab.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <div className="quiz-header">
                  <h4>{quiz.name}</h4>
                  <span className="status-badge status-scheduled">SCHEDULED</span>
                  {startingQuiz === quiz.id && countdown > 0 && (
                    <span className="starting-badge">Starting... {countdown}s</span>
                  )}
                </div>
                <p className="quiz-class">Class: {quiz.class}</p>
                <div className="quiz-details">
                  <span>{quiz.questions?.length || 0} questions</span>
                  <span>{quiz.timePerQuestion}s per question</span>
                  <span>Total: {Math.ceil((quiz.questions?.length || 0) * quiz.timePerQuestion / 60)}min</span>
                </div>
                {quiz.scheduledTime && (
                  <p className="scheduled-time">
                    🕒 Scheduled for: {new Date(quiz.scheduledTime).toLocaleString()}
                  </p>
                )}
                <p className="created-time">
                  Created: {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                </p>
              </div>
              
              <div className="quiz-actions">
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={startingQuiz === quiz.id}
                  className="btn btn-success btn-sm"
                >
                  {startingQuiz === quiz.id ? '🕐 Starting...' : '🚀 Start Quiz'}
                </button>
                
                <button
                  onClick={() => handleDeleteQuiz(quiz.id, quiz.name)}
                  className="btn btn-danger btn-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuizManager;