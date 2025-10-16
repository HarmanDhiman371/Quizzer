import React, { useState, useEffect, useCallback } from 'react';
import { useQuizSync } from '../../hooks/useQuizSync';
import { saveOrUpdateQuizResult } from '../../utils/firestore';
import Timer from '../shared/Timer';

const QuizInterface = ({ activeQuiz, studentName, onQuizComplete }) => {
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [joinTime, setJoinTime] = useState(Date.now());
  const [hasSavedFinal, setHasSavedFinal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Validate quiz data on component mount
  const validateQuizData = (quiz) => {
    console.log('🔍 Validating quiz data:', {
      hasQuiz: !!quiz,
      hasQuestions: !!quiz?.questions,
      questionsCount: quiz?.questions?.length,
      questionsArray: quiz?.questions
    });

    if (!quiz) {
      console.error('❌ No quiz data provided');
      return false;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      console.error('❌ Questions is not an array:', quiz.questions);
      return false;
    }

    if (quiz.questions.length === 0) {
      console.error('❌ Questions array is empty');
      return false;
    }

    // Validate each question
    const validQuestions = quiz.questions.every((question, index) => {
      const isValid = question && 
                     question.question && 
                     question.options && 
                     Array.isArray(question.options) && 
                     question.options.length > 0 &&
                     question.correctAnswer;
      
      if (!isValid) {
        console.error(`❌ Invalid question at index ${index}:`, question);
      }
      return isValid;
    });

    if (!validQuestions) {
      console.error('❌ Some questions are invalid');
      return false;
    }

    console.log('✅ Quiz data validation passed');
    return true;
  };

  const {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  } = useQuizSync(activeQuiz);

  // Fullscreen effect
  useEffect(() => {
    const enterFullscreen = () => {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.log('Fullscreen error:', err);
        });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Enter fullscreen when quiz starts
    if (quizStatus === 'active' && !isFullscreen) {
      enterFullscreen();
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [quizStatus, isFullscreen]);

  // Copy protection effect
  useEffect(() => {
    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        return false;
      }
      if (e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Validate quiz data when component mounts or activeQuiz changes
  useEffect(() => {
    if (activeQuiz) {
      const isValid = validateQuizData(activeQuiz);
      if (!isValid) {
        console.error('🚨 Invalid quiz data, cannot proceed');
        // You might want to show an error message to the user here
      }
    }
  }, [activeQuiz]);

  // Calculate score function with useCallback to prevent recreation
  const calculateScore = useCallback((currentAnswers) => {
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
      console.error('❌ Cannot calculate score: No questions available');
      return 0;
    }
    
    const missedCount = calculateMissedQuestions(joinTime);
    let score = 0;
    
    activeQuiz.questions.forEach((question, index) => {
      if (index >= missedCount) {
        const studentAnswer = currentAnswers[index] || '';
        const correctAnswer = question.correctAnswer;
        
        // Debug logging
        console.log(`Q${index + 1}: Student: "${studentAnswer}", Correct: "${correctAnswer}", Match: ${studentAnswer === correctAnswer}`);
        
        if (studentAnswer === correctAnswer) {
          score++;
        }
      }
    });
    
    console.log('🎯 Final Score Calculation:', {
      totalQuestions: activeQuiz.questions.length,
      missedCount: missedCount,
      answeredCount: activeQuiz.questions.length - missedCount,
      correctAnswers: score,
      finalScore: score
    });
    
    return score;
  }, [activeQuiz, joinTime, calculateMissedQuestions]);

  // Initialize answers only once
  useEffect(() => {
    if (activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0 && answers.length === 0) {
      const initialAnswers = new Array(activeQuiz.questions.length).fill('');
      const missedCount = calculateMissedQuestions(joinTime);
      
      console.log('📝 Initializing answers:', {
        totalQuestions: activeQuiz.questions.length,
        initialAnswersLength: initialAnswers.length,
        missedCount: missedCount
      });
      
      setAnswers(initialAnswers);
    }
  }, [activeQuiz, answers.length, calculateMissedQuestions, joinTime]);

  // Update selected answer when question changes
  useEffect(() => {
    const currentAnswer = answers[currentQuestionIndex];
    setSelectedAnswer(currentAnswer || '');
  }, [currentQuestionIndex, answers]);

  // Handle answer selection
  const handleAnswerSelect = async (answer) => {
    if (quizStatus !== 'active') return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    
    setAnswers(newAnswers);
    setSelectedAnswer(answer);

    // Save progress to Firebase
    try {
      const score = calculateScore(newAnswers);
      await saveOrUpdateQuizResult({
        studentName: studentName,
        score: score,
        totalQuestions: activeQuiz.questions.length,
        percentage: Math.round((score / activeQuiz.questions.length) * 100),
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        joinTime: joinTime,
        answers: newAnswers,
        currentQuestionIndex: currentQuestionIndex,
        completedAt: null
      });
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  // Handle quiz completion
  useEffect(() => {
    if (quizStatus === 'ended' && !hasSavedFinal && activeQuiz) {
      const finalScore = calculateScore(answers);
      
      saveOrUpdateQuizResult({
        studentName: studentName,
        score: finalScore,
        totalQuestions: activeQuiz.questions.length,
        percentage: Math.round((finalScore / activeQuiz.questions.length) * 100),
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        joinTime: joinTime,
        answers: answers,
        completedAt: Date.now()
      }).then(() => {
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      }).catch(error => {
        console.error('❌ Error saving final result:', error);
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      });
    }
  }, [
    quizStatus, 
    hasSavedFinal, 
    activeQuiz, 
    answers, 
    studentName, 
    joinTime, 
    onQuizComplete,
    calculateScore
  ]);

  // Check if current question was missed
  const isQuestionMissed = currentQuestionIndex < calculateMissedQuestions(joinTime);

  // Show loading if quiz data is invalid
  if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
    return (
      <div className="quiz-interface">
        <div className="quiz-error">
          <div className="error-icon">⚠️</div>
          <h3>Quiz Not Available</h3>
          <p>There seems to be an issue with the quiz data.</p>
          <p>Please contact your teacher.</p>
          <div className="error-details">
            <p>Debug Info:</p>
            <ul>
              <li>Has Quiz: {activeQuiz ? 'Yes' : 'No'}</li>
              <li>Has Questions: {activeQuiz?.questions ? 'Yes' : 'No'}</li>
              <li>Questions Count: {activeQuiz?.questions?.length || 0}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= activeQuiz.questions.length) {
    return (
      <div className="quiz-interface">
        <div className="quiz-complete">
          <h3>✅ Quiz Complete</h3>
          <p>Calculating your results...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="quiz-interface">
        <div className="quiz-error">
          <div className="error-icon">❓</div>
          <h3>Question Loading...</h3>
          <p>Please wait while the question loads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz-interface ${isFullscreen ? 'fullscreen-active' : ''}`}>
      {/* Fullscreen Warning */}
      {isFullscreen && (
        <div className="fullscreen-warning">
          ⚠️ Do not switch tabs or windows during the assessment!
        </div>
      )}

      {/* Header Section */}
      <div className="quiz-header">
        <div className="header-left">
          <h2>{activeQuiz.name}</h2>
          <span className="class-badge">{activeQuiz.class}</span>
        </div>
        <div className="quiz-meta">
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </span>
          <Timer timeRemaining={timeRemaining} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`
            }}
          ></div>
        </div>
        <div className="progress-text">
          Progress: {currentQuestionIndex + 1}/{activeQuiz.questions.length} questions
        </div>
      </div>

      {/* Question Area */}
      <div className="question-area">
        {isQuestionMissed ? (
          <div className="missed-question">
            <div className="missed-icon">⏰</div>
            <h3>Question {currentQuestionIndex + 1}</h3>
            <p>You joined late and missed this question.</p>
            <p className="missed-note">Questions auto-progress every {activeQuiz.timePerQuestion} seconds</p>
          </div>
        ) : (
          <>
            <div className="question-text">
              <div className="question-header">
                <span className="question-number">Q{currentQuestionIndex + 1}</span>
                <span className="time-info">{timeRemaining}s remaining</span>
              </div>
              <div className="question-content">
                <p>{currentQuestion.question}</p>
              </div>
            </div>
            
            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={quizStatus !== 'active'}
                >
                  <span className="option-label">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                  {selectedAnswer === option && (
                    <span className="option-check">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="answer-confirmation">
                <span className="confirmation-icon">✅</span>
                <span>Answer saved! Waiting for next question...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Info Footer */}
      <div className="student-info">
        <div className="student-details">
          <span className="student-name">Student: {studentName}</span>
          {calculateMissedQuestions(joinTime) > 0 && (
            <span className="missed-count">
              Missed: {calculateMissedQuestions(joinTime)} questions
            </span>
          )}
        </div>
        <div className="quiz-status-indicator">
          <span className={`status-dot ${quizStatus === 'active' ? 'active' : 'inactive'}`}></span>
          <span>{quizStatus === 'active' ? 'Live' : 'Ended'}</span>
        </div>
      </div>

      {/* Copy Protection Overlay */}
      <div className="copy-protection-overlay"></div>

      <style jsx>{`
        /* Quiz Interface CSS - Mobile Optimized with Fullscreen Support */
        .quiz-interface {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Fullscreen Mode */
        .quiz-interface.fullscreen-active {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          overflow: hidden;
        }

        /* Header Section */
        .quiz-interface .quiz-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 20px 25px;
          border-radius: 0 0 20px 20px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          position: relative;
          z-index: 100;
        }

        .quiz-interface .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .quiz-interface .header-left h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .quiz-interface .class-badge {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .quiz-interface .quiz-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .quiz-interface .question-counter {
          background: #f8f9fa;
          color: #495057;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          border: 2px solid #e9ecef;
        }

        /* Timer Component */
        .quiz-interface .timer {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          animation: timer-pulse 1s ease-in-out infinite;
        }

        .quiz-interface .timer.warning {
          background: linear-gradient(135deg, #dc3545, #c82333);
          animation: timer-pulse-urgent 0.5s ease-in-out infinite;
        }

        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes timer-pulse-urgent {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Progress Section */
        .quiz-interface .progress-section {
          padding: 20px 25px 15px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .quiz-interface .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .quiz-interface .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ffed4e);
          border-radius: 4px;
          transition: width 0.5s ease;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .quiz-interface .progress-text {
          text-align: center;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.9;
        }

        /* Question Area */
        .quiz-interface .question-area {
          flex: 1;
          padding: 25px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        /* Missed Question */
        .quiz-interface .missed-question {
          background: rgba(255, 255, 255, 0.95);
          padding: 40px 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border: 2px dashed #ffc107;
          animation: slide-up 0.5s ease-out;
        }

        .quiz-interface .missed-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: bounce 2s ease-in-out infinite;
        }

        .quiz-interface .missed-question h3 {
          color: #856404;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .quiz-interface .missed-question p {
          color: #856404;
          margin: 10px 0;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .quiz-interface .missed-note {
          font-size: 0.9rem !important;
          opacity: 0.8;
          font-style: italic;
        }

        /* Question Text */
        .quiz-interface .question-text {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          animation: slide-up 0.5s ease-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .quiz-interface .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .quiz-interface .question-number {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .quiz-interface .time-info {
          background: #f8f9fa;
          color: #495057;
          padding: 6px 15px;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.85rem;
          border: 2px solid #e9ecef;
        }

        .quiz-interface .question-content {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 15px;
          border-left: 4px solid #007bff;
        }

        .quiz-interface .question-content p {
          margin: 0;
          font-size: 1.2rem;
          line-height: 1.6;
          color: #2c3e50;
          font-weight: 500;
          text-align: center;
        }

        /* Options Grid */
        .quiz-interface .options-grid {
          display: grid;
          gap: 15px;
          margin-bottom: 20px;
        }

        .quiz-interface .option-btn {
          display: flex;
          align-items: center;
          padding: 20px 25px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.95);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .quiz-interface .option-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }

        .quiz-interface .option-btn:hover::before {
          left: 100%;
        }

        .quiz-interface .option-btn:hover:not(:disabled) {
          border-color: #007bff;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
          background: rgba(255, 255, 255, 1);
        }

        .quiz-interface .option-btn.selected {
          border-color: #28a745;
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }

        .quiz-interface .option-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none !important;
        }

        .quiz-interface .option-label {
          font-weight: 800;
          margin-right: 20px;
          color: #007bff;
          font-size: 1.1rem;
          min-width: 30px;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .quiz-interface .option-btn.selected .option-label {
          background: #28a745;
          color: white;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
        }

        .quiz-interface .option-text {
          flex: 1;
          font-size: 1rem;
          color: #2c3e50;
          font-weight: 500;
          line-height: 1.4;
        }

        .quiz-interface .option-check {
          color: #28a745;
          font-weight: bold;
          margin-left: 10px;
          opacity: 0;
          transform: scale(0);
          transition: all 0.3s ease;
        }

        .quiz-interface .option-btn.selected .option-check {
          opacity: 1;
          transform: scale(1);
        }

        .quiz-interface .option-check svg {
          width: 20px;
          height: 20px;
        }

        /* Answer Confirmation */
        .quiz-interface .answer-confirmation {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          color: #155724;
          padding: 15px 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #c3e6cb;
          animation: slide-in 0.5s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .quiz-interface .confirmation-icon {
          font-size: 1.2rem;
        }

        /* Student Info Footer */
        .quiz-interface .student-info {
          background: rgba(255, 255, 255, 0.95);
          padding: 20px 25px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          backdrop-filter: blur(20px);
          position: sticky;
          bottom: 0;
          z-index: 100;
        }

        .quiz-interface .student-details {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .quiz-interface .student-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1rem;
        }

        .quiz-interface .missed-count {
          background: #f8d7da;
          color: #721c24;
          padding: 6px 12px;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .quiz-interface .quiz-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .quiz-interface .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: status-pulse 2s infinite;
        }

        .quiz-interface .status-dot.active {
          background: #28a745;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        }

        .quiz-interface .status-dot.inactive {
          background: #dc3545;
        }

        @keyframes status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        /* Fullscreen Warning */
        .quiz-interface .fullscreen-warning {
          background: #fff3cd;
          border: 2px solid #ffc107;
          color: #856404;
          padding: 15px 20px;
          border-radius: 10px;
          margin: 10px 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
          font-weight: 600;
          animation: pulse-warning 2s infinite;
        }

        @keyframes pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Error States */
        .quiz-interface .quiz-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          color: white;
          padding: 40px 20px;
        }

        .quiz-interface .error-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .quiz-interface .quiz-error h3 {
          font-size: 1.8rem;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .quiz-interface .quiz-error p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 10px;
        }

        .quiz-interface .error-details {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
          text-align: left;
          max-width: 400px;
        }

        .quiz-interface .error-details ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .quiz-interface .error-details li {
          margin-bottom: 5px;
        }

        /* Quiz Complete */
        .quiz-interface .quiz-complete {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          color: white;
          padding: 40px 20px;
        }

        .quiz-interface .quiz-complete h3 {
          font-size: 2rem;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .quiz-interface .quiz-complete p {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        /* Copy Protection Overlay */
        .quiz-interface .copy-protection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          pointer-events: none;
          background: transparent;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .quiz-interface .quiz-header {
            padding: 15px 20px;
            border-radius: 0 0 15px 15px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .quiz-interface .header-left {
            justify-content: center;
            text-align: center;
          }

          .quiz-interface .header-left h2 {
            font-size: 1.2rem;
          }

          .quiz-interface .quiz-meta {
            justify-content: center;
            gap: 15px;
          }

          .quiz-interface .question-counter {
            font-size: 0.8rem;
            padding: 6px 12px;
          }

          .quiz-interface .timer {
            font-size: 0.9rem;
            padding: 8px 16px;
          }

          .quiz-interface .progress-section {
            padding: 15px 20px 10px;
          }

          .quiz-interface .question-area {
            padding: 20px;
          }

          .quiz-interface .question-text {
            padding: 20px;
            border-radius: 15px;
          }

          .quiz-interface .question-header {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }

          .quiz-interface .question-content {
            padding: 20px;
          }

          .quiz-interface .question-content p {
            font-size: 1.1rem;
          }

          .quiz-interface .options-grid {
            gap: 12px;
          }

          .quiz-interface .option-btn {
            padding: 16px 20px;
            border-radius: 12px;
          }

          .quiz-interface .option-label {
            font-size: 1rem;
            min-width: 25px;
            padding: 8px;
            margin-right: 15px;
          }

          .quiz-interface .option-text {
            font-size: 0.95rem;
          }

          .quiz-interface .missed-question {
            padding: 30px 20px;
            border-radius: 15px;
          }

          .quiz-interface .missed-icon {
            font-size: 3rem;
          }

          .quiz-interface .student-info {
            padding: 15px 20px;
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .quiz-interface .student-details {
            justify-content: center;
          }

          .quiz-interface .fullscreen-warning {
            margin: 8px 15px;
            padding: 12px 15px;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .quiz-interface {
            min-height: 100vh;
          }

          .quiz-interface .quiz-header {
            padding: 12px 15px;
          }

          .quiz-interface .header-left h2 {
            font-size: 1.1rem;
          }

          .quiz-interface .class-badge {
            font-size: 0.75rem;
            padding: 4px 10px;
          }

          .quiz-interface .question-area {
            padding: 15px;
          }

          .quiz-interface .question-text {
            padding: 15px;
          }

          .quiz-interface .question-content {
            padding: 15px;
          }

          .quiz-interface .question-content p {
            font-size: 1rem;
          }

          .quiz-interface .option-btn {
            padding: 14px 16px;
            border-radius: 10px;
          }

          .quiz-interface .option-label {
            font-size: 0.9rem;
            min-width: 22px;
            padding: 6px;
            margin-right: 12px;
          }

          .quiz-interface .option-text {
            font-size: 0.9rem;
          }

          .quiz-interface .missed-question {
            padding: 25px 15px;
          }

          .quiz-interface .missed-question h3 {
            font-size: 1.3rem;
          }

          .quiz-interface .missed-question p {
            font-size: 1rem;
          }

          .quiz-interface .answer-confirmation {
            padding: 12px 15px;
            font-size: 0.9rem;
          }

          .quiz-interface .student-info {
            padding: 12px 15px;
          }

          .quiz-interface .student-name {
            font-size: 0.9rem;
          }

          .quiz-interface .missed-count {
            font-size: 0.8rem;
            padding: 4px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizInterface;
