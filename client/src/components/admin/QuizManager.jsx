import React, { useState, useEffect } from 'react';
import { 
  getQuizzesFromFirestore, 
  deleteQuizFromFirestore, 
  setActiveQuiz,
  activateScheduledQuiz,
  cleanupCompletedQuizzes
} from '../../utils/firestore';
import Modal from '../alert/Modal';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [cleaningUp, setCleaningUp] = useState(false);
  
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
      console.log('📚 Loaded quizzes:', scheduledQuizzes.length);
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

  const handleCleanupCompletedQuizzes = async () => {
    showConfirmModal(
      'Cleanup Completed Quizzes',
      'Are you sure you want to clean up all completed quizzes? This action will permanently remove completed quizzes from the list. This action cannot be undone.',
      async () => {
        setCleaningUp(true);
        try {
          const deletedCount = await cleanupCompletedQuizzes();
          showAlertModal('Cleanup Complete', `✅ Successfully removed ${deletedCount} completed quizzes!`, 'success');
          await loadQuizzes(); // Reload the list
        } catch (error) {
          console.error('Error cleaning up quizzes:', error);
          showAlertModal('Cleanup Failed', `❌ Error cleaning up quizzes: ${error.message}`, 'error');
        } finally {
          setCleaningUp(false);
        }
      },
      'Cleanup',
      'Cancel'
    );
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
          <button 
            onClick={handleCleanupCompletedQuizzes} 
            disabled={cleaningUp}
            className="btn btn-warning"
          >
            {cleaningUp ? '🧹 Cleaning...' : '🧹 Cleanup Completed'}
          </button>
          <button onClick={loadQuizzes} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="quizzes-list">
        {quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Quizzes Found</h3>
            <p>There are no scheduled quizzes at the moment.</p>
            <p>Create a new quiz in the Create Quiz tab.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <div className="quiz-header">
                  <h4>{quiz.name}</h4>
                  <div className="status-badges">
                    <span className={`status-badge status-${quiz.status}`}>
                      {quiz.status === 'scheduled' ? 'SCHEDULED' : 
                       quiz.status === 'activated' ? 'ACTIVATED' : 'DRAFT'}
                    </span>
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
                  title="Start quiz now"
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

      <style jsx>{`
        .quiz-manager {
          padding: 0;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .manager-header h3 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.5rem;
        }

        .manager-actions-header {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .countdown-banner {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 700;
          font-size: 0.9rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .quizzes-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .quiz-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .quiz-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .quiz-info {
          flex: 1;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 15px;
        }

        .quiz-header h4 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .status-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-scheduled {
          background: linear-gradient(135deg, #ffc107, #ffca28);
          color: #856404;
        }

        .status-activated {
          background: linear-gradient(135deg, #17a2b8, #20c997);
          color: white;
        }

        .status-draft {
          background: linear-gradient(135deg, #6c757d, #868e96);
          color: white;
        }

        .starting-badge {
          background: #dc3545;
          color: white;
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .quiz-class {
          color: #6c757d;
          margin: 0 0 15px 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .quiz-details {
          display: flex;
          gap: 15px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .quiz-details span {
          background: #f8f9fa;
          padding: 6px 12px;
          border-radius: 12px;
          color: #495057;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .scheduled-time {
          color: #28a745;
          margin: 8px 0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .created-time {
          color: #6c757d;
          margin: 0;
          font-size: 0.8rem;
        }

        .quiz-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 140px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
          text-align: center;
        }

        .btn-success {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
        }

        .btn-warning {
          background: linear-gradient(135deg, #ffc107, #e0a800);
          color: #856404;
        }

        .btn-warning:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 193, 7, 0.3);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #6c757d, #5a6268);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 117, 125, 0.3);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 0.85rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 30px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .empty-state h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #6c757d;
          margin: 8px 0;
          line-height: 1.5;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .manager-header {
            flex-direction: column;
            align-items: stretch;
          }

          .manager-actions-header {
            justify-content: center;
          }

          .quiz-card {
            flex-direction: column;
            gap: 15px;
          }

          .quiz-actions {
            flex-direction: row;
            min-width: auto;
            width: 100%;
          }

          .quiz-actions .btn {
            flex: 1;
          }

          .quiz-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .quiz-details {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .quiz-card {
            padding: 20px;
          }

          .manager-actions-header {
            flex-direction: column;
            width: 100%;
          }

          .manager-actions-header .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizManager;