import React, { useState, useEffect } from 'react';
import { 
  getQuizzesFromFirestore, 
  deleteQuizFromFirestore, 
  setActiveQuiz,
  activateScheduledQuiz
} from '../../utils/firestore';
import Modal from '../alert/Modal';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(null);
  const [countdown, setCountdown] = useState(0);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

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

  // Function to show modal
  const showAlertModal = (title, message, type = 'info') => {
    setModalConfig({ 
      title, 
      message, 
      type,
      onConfirm: null 
    });
    setShowModal(true);
  };

  // Function to show confirmation modal
  const showConfirmModal = (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setModalConfig({
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText,
      cancelText
    });
    setShowModal(true);
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const scheduledQuizzes = await getQuizzesFromFirestore();
      setQuizzes(scheduledQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      showAlertModal('Error', `Error loading quizzes: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      setStartingQuiz(quiz.id);
      setCountdown(10);

      // For scheduled quizzes, use activate function
      if (quiz.status === 'scheduled') {
        await activateScheduledQuiz(quiz.id);
      } else {
        // For draft quizzes, use regular start
        await setActiveQuiz(quiz);
      }
      
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
      showAlertModal('Error', `Error starting quiz: ${error.message}`, 'error');
      setStartingQuiz(null);
      setCountdown(0);
    }
  };

  const handleDeleteQuiz = async (quizId, quizName) => {
    showConfirmModal(
      'Delete Quiz',
      `Are you sure you want to delete "${quizName}"? This action cannot be undone.`,
      async () => {
        try {
          await deleteQuizFromFirestore(quizId);
          showAlertModal('Success', '🗑️ Quiz deleted successfully!', 'success');
          await loadQuizzes();
        } catch (error) {
          console.error('Error deleting quiz:', error);
          showAlertModal('Error', `Error deleting quiz: ${error.message}`, 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  // Check if quiz is ready to start (scheduled time passed)
  const isQuizReadyToStart = (quiz) => {
    if (!quiz.scheduledTime) return true;
    return Date.now() >= quiz.scheduledTime;
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
          quizzes.map((quiz) => {
            const readyToStart = isQuizReadyToStart(quiz);
            
            return (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-info">
                  <div className="quiz-header">
                    <h4>{quiz.name}</h4>
                    <div className="status-badges">
                      <span className="status-badge status-scheduled">SCHEDULED</span>
                      {!readyToStart && (
                        <span className="status-badge status-waiting">WAITING FOR TIME</span>
                      )}
                      {startingQuiz === quiz.id && countdown > 0 && (
                        <span className="starting-badge">Starting... {countdown}s</span>
                      )}
                    </div>
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
                      {!readyToStart && (
                        <span className="time-warning"> (Not yet ready to start)</span>
                      )}
                    </p>
                  )}
                  <p className="created-time">
                    Created: {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
                
                <div className="quiz-actions">
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    disabled={startingQuiz === quiz.id || !readyToStart}
                    className="btn btn-success btn-sm"
                    title={!readyToStart ? 'Wait for scheduled time to start' : 'Start quiz now'}
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
            );
          })
        )}
      </div>

      {/* Modal Component */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </div>
  );
};

export default QuizManager;