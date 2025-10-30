
import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import QuizInterface from './QuizInterface';
import WaitingRoom from './WaitingRoom';
import CompleteResults from '../admin/CompleteResults';
import {
  saveOrUpdateQuizResult, 
  getAllScheduledQuizzes, 
  joinScheduledQuizWaitingRoom,
  verifyQuizPasskey,
  joinScheduledQuizWithPasskey,
  checkDuplicateStudentName,
  getActiveQuizFromFirestore
} from '../../utils/firestore';
import "./student.css";

const StudentQuiz = () => {
  const { activeQuiz, loading } = useQuiz();
  const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [joiningQuiz, setJoiningQuiz] = useState(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [nameValidation, setNameValidation] = useState({ valid: false, message: '' });

  // Fetch ALL scheduled quizzes
  useEffect(() => {
    const loadScheduledQuizzes = async () => {
      try {
        setLoadingScheduled(true);
        const quizzes = await getAllScheduledQuizzes();
        console.log('📅 Refreshed scheduled quizzes:', quizzes.length, quizzes);
        setScheduledQuizzes(quizzes);
      } catch (error) {
        console.error('Error loading scheduled quizzes:', error);
        setScheduledQuizzes([]);
      } finally {
        setLoadingScheduled(false);
      }
    };

    loadScheduledQuizzes();
    const interval = setInterval(loadScheduledQuizzes, 10000);
    return () => clearInterval(interval);
  }, []);

  // NEW: Real-time name validation
  useEffect(() => {
    const validateNameInRealTime = async () => {
      if (studentName.trim().length >= 2) {
        // For scheduled quizzes, validate against the first available quiz
        if (scheduledQuizzes.length > 0) {
          const firstQuiz = scheduledQuizzes.find(quiz => 
            quiz.status === 'scheduled' || quiz.status === 'activated'
          );
          if (firstQuiz) {
            const validation = await validateStudentName(firstQuiz);
            setNameValidation(validation);
          }
        }
      } else {
        setNameValidation({ valid: false, message: '' });
      }
    };

    const timeoutId = setTimeout(validateNameInRealTime, 500);
    return () => clearTimeout(timeoutId);
  }, [studentName, scheduledQuizzes]);

  // Handle quiz state transitions - ONLY for actual started quizzes
  useEffect(() => {
    if (!activeQuiz || !studentName.trim()) return;

    console.log('🔄 ACTIVE Quiz status:', activeQuiz.status);
    console.log('👤 Student in waiting room:', inWaitingRoom);

    // If student is in waiting room and quiz becomes active, start quiz immediately
    if (activeQuiz.status === 'active' && inWaitingRoom && !quizStarted) {
      console.log('🎬 Auto-starting quiz from waiting room');
      setQuizStarted(true);
      setInWaitingRoom(false);
    }

    // If quiz ends, reset everything
    if (activeQuiz.status === 'inactive') {
      console.log('🛑 Quiz ended');
      setQuizStarted(false);
      setInWaitingRoom(false);
    }
  }, [activeQuiz, studentName, inWaitingRoom, quizStarted]);

  // Enhanced quiz validation
  const validateQuizData = (quiz) => {
    if (!quiz) {
      console.error('No quiz data provided');
      return false;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      console.error('Invalid or empty questions array');
      return false;
    }

    const hasValidQuestions = quiz.questions.every(q =>
      q &&
      typeof q === 'object' &&
      q.question &&
      q.options &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.correctAnswer
    );

    if (!hasValidQuestions) {
      console.error('Some questions are missing required fields');
      return false;
    }

    console.log('✅ Quiz validation passed - questions are valid');
    return true;
  };

  // NEW: Validate student name before joining any quiz
  const validateStudentName = async (quiz, nameToCheck = null) => {
    const name = nameToCheck || studentName.trim();
    
    if (!name) {
      return { valid: false, message: 'Please enter your name' };
    }

    // Basic validation
    if (name.length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters long' };
    }

    if (name.length > 50) {
      return { valid: false, message: 'Name must be less than 50 characters' };
    }

    // Check for duplicate name
    try {
      const duplicateCheck = await checkDuplicateStudentName(quiz.id, name);
      
      if (duplicateCheck.exists) {
        return { 
          valid: false, 
          message: duplicateCheck.message 
        };
      }

      return { valid: true, message: 'Name is available' };
    } catch (error) {
      console.error('Error validating name:', error);
      return { valid: false, message: 'Error checking name availability' };
    }
  };

  // Verify passkey
  const verifyPasskey = (quiz, enteredPasskey) => {
    // If quiz has no passkey, allow access
    if (!quiz.passkey || quiz.passkey.trim() === '') {
      return true;
    }

    // Compare passkeys (case-sensitive)
    return quiz.passkey === enteredPasskey.trim();
  };

  // Handle passkey verification
  const handlePasskeyVerification = async () => {
    if (!selectedQuiz) return;

    try {
      const result = await verifyQuizPasskey(selectedQuiz.id, passkeyInput);
      
      if (!result.valid) {
        alert('❌ Incorrect passkey. Please try again.');
        setPasskeyInput('');
        return;
      }

      // Passkey is correct, proceed with joining
      await joinQuizWithPasskey(selectedQuiz);
    } catch (error) {
      console.error('Error verifying passkey:', error);
      alert('Error verifying passkey. Please try again.');
    }
  };

  // Join quiz after passkey verification
  const joinQuizWithPasskey = async (quiz) => {
    if (!studentName.trim()) {
      alert('Please enter your name first.');
      return;
    }

    // Validate quiz data before joining
    if (!validateQuizData(quiz)) {
      alert('This quiz has configuration issues. Please contact your instructor.');
      return;
    }

    setJoiningQuiz(quiz.id);
    try {
      localStorage.setItem('studentName', studentName.trim());

      if (quiz.status === 'activated' || quiz.status === 'scheduled') {
        // Join waiting room with passkey verification
        const result = await joinScheduledQuizWithPasskey(
          quiz.id, 
          studentName.trim(), 
          quiz.passkey ? passkeyInput : ''
        );
        
        if (result.success) {
          console.log('✅ Joined waiting room for scheduled quiz');
          setInWaitingRoom(true);
          setShowPasskeyModal(false);
          setPasskeyInput('');
          setSelectedQuiz(null);
        }
      }
    } catch (error) {
      console.error('Error joining scheduled quiz:', error);
      alert(`Error joining quiz: ${error.message}`);
    } finally {
      setJoiningQuiz(null);
    }
  };

  // UPDATED: Handle joining scheduled quiz with duplicate name check AND entry blocking
  const handleJoinScheduledQuiz = async (quiz) => {
    if (!studentName.trim()) {
      alert('Please enter your name first.');
      return;
    }

    // NEW: Check if any quiz is already active and block entry
    const activeQuizData = await getActiveQuizFromFirestore();
    if (activeQuizData && activeQuizData.status === 'active') {
      alert('❌ A quiz is currently in progress. Late entries are not allowed.');
      return;
    }

    // NEW: Validate name before proceeding
    const nameValidation = await validateStudentName(quiz);
    if (!nameValidation.valid) {
      alert(`❌ ${nameValidation.message}`);
      return;
    }

    // Check if quiz requires passkey
    if (quiz.passkey && quiz.passkey.trim() !== '') {
      // Show passkey modal
      setSelectedQuiz(quiz);
      setShowPasskeyModal(true);
      return;
    }

    // No passkey required, join directly
    await joinQuizWithPasskey(quiz);
  };

  // Handle quiz completion with consistent quiz ID
  const handleQuizComplete = async (score) => {
    console.log('🏁 Quiz Complete - Fixing result mismatch');

    const numericScore = Number(score) || 0;
    setFinalScore(numericScore);
    setQuizCompleted(true);
    setQuizStarted(false);

    try {
      if (activeQuiz && validateQuizData(activeQuiz)) {
        const totalQuestions = activeQuiz.questions?.length || 0;
        const percentage = totalQuestions > 0 ? Math.round((numericScore / totalQuestions) * 100) : 0;

        // Use consistent quiz ID (originalQuizId for scheduled quizzes)
        const quizIdToUse = activeQuiz.originalQuizId || activeQuiz.id;

        const result = {
          studentName: studentName.trim(),
          score: numericScore,
          totalQuestions: totalQuestions,
          percentage: percentage,
          quizId: quizIdToUse,
          quizName: activeQuiz.name,
          quizClass: activeQuiz.class,
          completedAt: Date.now(),
          joinTime: Date.now()
        };

        console.log('💾 Saving result with quiz ID:', quizIdToUse);
        await saveOrUpdateQuizResult(result);
      }
    } catch (error) {
      console.error('❌ Error saving result:', error);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
    setFinalScore(null);
  };

  // Check if quiz is ready to join
  const isQuizReadyToJoin = (quiz) => {
    const isScheduledOrActivated = quiz.status === 'scheduled' || quiz.status === 'activated';
    const isValidQuiz = validateQuizData(quiz);
    const isNotCompleted = quiz.status !== 'completed';

    return isScheduledOrActivated && isValidQuiz && isNotCompleted;
  };

  // Check if quiz is activated but waiting
  const isQuizActivated = (quiz) => {
    return quiz.status === 'activated';
  };

  // Get time display
  const getTimeDisplay = (quiz) => {
    if (quiz.status === 'activated') {
      return 'Waiting for admin to start';
    } else if (quiz.status === 'scheduled') {
      return `Scheduled for ${new Date(quiz.scheduledTime).toLocaleString()}`;
    }
    return 'Ready to join';
  };

  // Get quiz status for display
  const getQuizStatus = (quiz) => {
    if (isQuizActivated(quiz)) {
      return 'activated';
    } else if (isQuizReadyToJoin(quiz)) {
      return 'ready';
    } else {
      return 'upcoming';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Quiz Platform...</p>
      </div>
    );
  }

  // Render logic - ONLY use activeQuiz for actually started quizzes
  if (inWaitingRoom && activeQuiz) {
    return <WaitingRoom activeQuiz={activeQuiz} studentName={studentName} />;
  }

  if (quizCompleted && activeQuiz) {
    return (
      <CompleteResults
        score={finalScore}
        activeQuiz={activeQuiz}
        studentName={studentName}
        onRetake={handleRetakeQuiz}
      />
    );
  }

  if (quizStarted && activeQuiz) {
    return (
      <div className="quiz-container">
        <QuizInterface
          activeQuiz={activeQuiz}
          studentName={studentName}
          onQuizComplete={handleQuizComplete}
        />
      </div>
    );
  }

  // 🚨 REMOVED: The section that shows active quiz from context
  // This was the main bug - we were showing waiting room quizzes as "active"

  // Show portal with ONLY scheduled quizzes (from scheduledQuizzes array)
  return (
    <div className="student-portal">
      <div className="portal-container">
        <div className="portal-header">
          <div className="brand-section">
            <div className="brand-logo">🎯</div>
            <h1>EBI Quiz Platform</h1>
            <p>Professional Assessment System</p>
          </div>

          <div className="student-info-card">
            <h3>Student Information</h3>
            <input
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={`portal-input ${nameValidation.valid ? 'valid' : studentName.trim() ? 'invalid' : ''}`}
              maxLength={50}
            />
            
            {/* NEW: Real-time validation feedback */}
            {studentName.trim() && (
              <div className={`validation-message ${nameValidation.valid ? 'valid' : 'invalid'}`}>
                {nameValidation.valid ? (
                  <span className="valid-icon">✅</span>
                ) : (
                  <span className="invalid-icon">❌</span>
                )}
                {nameValidation.message || 'Enter your name to join quizzes'}
              </div>
            )}
          </div>
        </div>

        <div className="portal-content">
          {/* Quiz Portal Section */}
          <div className="upcoming-quizzes-section">
            <div className="section-header">
              <h2>📅 Quiz Portal</h2>
              <p>Join scheduled quizzes or active sessions</p>
            </div>

            {loadingScheduled ? (
              <div className="loading-upcoming">
                <div className="loading-spinner-small"></div>
                <p>Loading quizzes...</p>
              </div>
            ) : scheduledQuizzes.length > 0 ? (
              <div className="upcoming-quizzes-grid">
                {scheduledQuizzes.map((quiz) => {
                  const quizStatus = getQuizStatus(quiz);
                  const canJoin = (quizStatus === 'ready' || quizStatus === 'activated') && 
                                 studentName.trim() && 
                                 !joiningQuiz && 
                                 nameValidation.valid;
                  const isValidQuiz = validateQuizData(quiz);

                  return (
                    <div key={quiz.id} className="upcoming-quiz-card">
                      <div className="quiz-card-header">
                        <h4>{quiz.name}</h4>
                        <div className="badge-container">
                          <span className={`upcoming-badge ${quizStatus}`}>
                            {quizStatus === 'activated' ? 'WAITING FOR ADMIN' :
                              quizStatus === 'ready' ? 'READY TO JOIN' : 'SCHEDULED'}
                          </span>
                          {/* Passkey badge */}
                          {quiz.passkey && (
                            <span className="passkey-badge">🔑</span>
                          )}
                          {!isValidQuiz && (
                            <span className="error-badge">INVALID</span>
                          )}
                        </div>
                      </div>

                      <div className="quiz-card-details">
                        <div className="detail-item">
                          <span className="detail-icon">🏫</span>
                          <span>{quiz.class}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📝</span>
                          <span>{quiz.questions?.length || 0} Questions</span>
                          {!isValidQuiz && (
                            <span style={{ color: '#dc3545', marginLeft: '5px' }}>⚠️</span>
                          )}
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">⏱️</span>
                          <span>{quiz.timePerQuestion}s per question</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🕒</span>
                          <span className={`time-display ${quizStatus}`}>
                            {getTimeDisplay(quiz)}
                          </span>
                        </div>
                        {/* Passkey hint */}
                        {quiz.passkey && (
                          <div className="detail-item">
                            <span className="detail-icon">🔒</span>
                            <span style={{ color: '#ffc107', fontWeight: '600' }}>
                              Passkey Required
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="quiz-scheduled-time">
                        <strong>Originally Scheduled:</strong> {new Date(quiz.scheduledTime).toLocaleString()}
                      </div>

                      <div className="quiz-card-actions">
                        {(quizStatus === 'ready' || quizStatus === 'activated') ? (
                          <button
                            className={`btn-join ${canJoin && isValidQuiz ? 'enabled' : 'disabled'}`}
                            onClick={() => handleJoinScheduledQuiz(quiz)}
                            disabled={!canJoin || !isValidQuiz}
                            title={!isValidQuiz ? 'Quiz has configuration issues' : 
                                   !nameValidation.valid ? nameValidation.message : ''}
                          >
                            {joiningQuiz === quiz.id ? (
                              <>⏳ Joining...</>
                            ) : (
                              <>🚪 {quiz.passkey ? 'Enter Passkey' : 'Enter Waiting Room'}</>
                            )}
                          </button>
                        ) : (
                          <button className="btn-remind-me" disabled>
                            ⏰ Coming Soon
                          </button>
                        )}
                      </div>

                      {!studentName.trim() && (quizStatus === 'ready' || quizStatus === 'activated') && (
                        <div className="join-hint">
                          💡 Enter your name above to join
                        </div>
                      )}

                      {!nameValidation.valid && studentName.trim() && (quizStatus === 'ready' || quizStatus === 'activated') && (
                        <div className="error-message">
                          ❌ {nameValidation.message}
                        </div>
                      )}

                      {!isValidQuiz && (
                        <div className="error-message">
                          ⚠️ This quiz has configuration issues
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-upcoming-quizzes">
                <div className="empty-state-icon">📚</div>
                <h3>No Scheduled Quizzes</h3>
                <p>There are no scheduled quizzes at the moment. Check back later for new assessments.</p>
              </div>
            )}
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="card-icon">⚡</div>
              <h4>Instant Access</h4>
              <p>Join assessments with your registered name</p>
            </div>
            <div className="info-card">
              <div className="card-icon">🛡️</div>
              <h4>Secure Environment</h4>
              <p>Protected testing environment</p>
            </div>
            <div className="info-card">
              <div className="card-icon">🔒</div>
              <h4>Duplicate Prevention</h4>
              <p>Unique names required for fair assessment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Passkey Modal */}
      {showPasskeyModal && selectedQuiz && (
        <div className="passkey-modal-overlay">
          <div className="passkey-modal">
            <div className="modal-header">
              <h3>🔑 Enter Passkey</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowPasskeyModal(false);
                  setSelectedQuiz(null);
                  setPasskeyInput('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>This quiz requires a passkey to join:</p>
              <div className="quiz-info">
                <strong>{selectedQuiz.name}</strong>
                <span>Class: {selectedQuiz.class}</span>
              </div>
              <input
                type="text"
                placeholder="Enter passkey..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="passkey-input"
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowPasskeyModal(false);
                    setSelectedQuiz(null);
                    setPasskeyInput('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-join"
                  onClick={handlePasskeyVerification}
                  disabled={!passkeyInput.trim()}
                >
                  {joiningQuiz === selectedQuiz.id ? 'Verifying...' : 'Join Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuiz;