import React, { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { parseMCQText } from '../../utils/mcqParser';
import { saveQuizToFirestore, setActiveQuiz } from '../../utils/firestore';
import Modal from '../alert/Modal'; // Import the Modal component

const QuizCreator = () => {
  const { activeQuiz } = useQuiz();
  const [mcqText, setMcqText] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizName, setQuizName] = useState('');
  const [quizClass, setQuizClass] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  // Check if there's an active quiz
  const hasActiveQuiz = activeQuiz && activeQuiz.status === 'active';

  // Function to show modal
  const showAlertModal = (title, message, type = 'info') => {
    setModalConfig({ title, message, type });
    setShowModal(true);
  };

  const handleParseMCQ = () => {
    try {
      if (!mcqText.trim()) {
        showAlertModal('Input Required', 'Please paste some MCQs', 'warning');
        return;
      }

      if (!quizName.trim()) {
        showAlertModal('Input Required', 'Please enter a quiz name', 'warning');
        return;
      }

      if (!quizClass.trim()) {
        showAlertModal('Input Required', 'Please enter a class name', 'warning');
        return;
      }

      const parsedQuiz = parseMCQText(mcqText, timePerQuestion);
      parsedQuiz.name = quizName;
      parsedQuiz.class = quizClass;

      if (scheduledTime) {
        parsedQuiz.scheduledTime = new Date(scheduledTime).getTime();
        parsedQuiz.status = 'scheduled';
      } else {
        parsedQuiz.status = 'draft';
      }

      setQuiz(parsedQuiz);
      showAlertModal('Success!', `✅ Successfully parsed ${parsedQuiz.questions.length} questions!`, 'success');
    } catch (error) {
      showAlertModal('Error', `❌ Error parsing MCQs: ${error.message}`, 'error');
    }
  };

  const handleStartNow = async () => {
    if (!quiz) {
      showAlertModal('Action Required', 'Please parse MCQs first', 'warning');
      return;
    }

    if (hasActiveQuiz) {
      showAlertModal('Active Quiz Running', '❌ There is already an active quiz. Please end it first before starting a new one.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const quizToStart = {
        ...quiz,
        status: 'active',
        quizStartTime: Date.now(),
        currentQuestionIndex: 0,
        totalParticipants: 0
      };

      console.log('🚀 Starting quiz with data:', quizToStart);

      await setActiveQuiz(quizToStart);
      showAlertModal('Quiz Started!', '🚀 Quiz started successfully! Students can now join.', 'success');

      // Reset form
      setMcqText('');
      setQuizName('');
      setQuizClass('');
      setScheduledTime('');
      setQuiz(null);
    } catch (error) {
      console.error('Error starting quiz:', error);
      showAlertModal('Error', `Error starting quiz: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleQuiz = async () => {
    if (!quiz) {
      showAlertModal('Action Required', 'Please parse MCQs first', 'warning');
      return;
    }

    if (!scheduledTime) {
      showAlertModal('Input Required', 'Please set a schedule time first', 'warning');
      return;
    }

    const scheduleTime = new Date(scheduledTime).getTime();
    const now = Date.now();

    if (scheduleTime <= now) {
      showAlertModal('Invalid Time', 'Scheduled time must be in the future', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const scheduledQuiz = {
        ...quiz,
        status: 'scheduled',
        scheduledTime: scheduleTime
      };

      await saveQuizToFirestore(scheduledQuiz);
      showAlertModal('Quiz Scheduled!', `✅ Quiz scheduled for ${new Date(scheduleTime).toLocaleString()}`, 'success');

      // Reset form
      setMcqText('');
      setQuizName('');
      setQuizClass('');
      setScheduledTime('');
      setQuiz(null);
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      showAlertModal('Error', `Error scheduling quiz: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!quiz) {
      showAlertModal('Action Required', 'Please parse MCQs first', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await saveQuizToFirestore(quiz);
      showAlertModal('Draft Saved!', '✅ Quiz saved as draft!', 'success');
    } catch (error) {
      console.error('Error saving draft:', error);
      showAlertModal('Error', `Error saving draft: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-creator">
      <h3>📝 Create New Quiz</h3>

      {/* Show warning if there's an active quiz */}
      {hasActiveQuiz && (
        <div className="active-quiz-warning">
          <span>⚠️ There is an active quiz running. End it first to start a new one.</span>
        </div>
      )}

      <div className="quiz-meta-grid">
        <div className="meta-group">
          <label>Quiz Name *</label>
          <input
            type="text"
            placeholder="Enter quiz name"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
          />
        </div>

        <div className="meta-group">
          <label>Class *</label>
          <select
            value={quizClass}
            onChange={(e) => setQuizClass(e.target.value)}
            className="class-select"
          >
            <option value="">Select Class</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="meta-group">
          <label>Time per Question (seconds) *</label>
          <select
            value={timePerQuestion}
            onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
          >
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds</option>
            <option value={120}>120 seconds</option>
          </select>
        </div>


        <div className="meta-group">
          <label>Schedule Start Time (optional)</label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>
      </div>

      <div className="mcq-input-section">
        <label>Paste MCQs (One question per block) *</label>
        <textarea
          value={mcqText}
          onChange={(e) => setMcqText(e.target.value)}
          placeholder={`Format:
What is React?
A) Framework
B) Library
C) Language
D) Database
Correct: B

What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Correct: B

Next question...
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct: C`}
          rows="15"
        />
        <div className="format-tips">
          <strong>💡 Format Tips:</strong>
          <ul>
            <li>One question per block (separated by empty line)</li>
            <li>Question on first line</li>
            <li>Options as A), B), C), D)</li>
            <li>Correct answer as "Correct: A" (or B, C, D)</li>
          </ul>
        </div>
      </div>

      <div className="action-buttons">
        <button
          onClick={handleParseMCQ}
          disabled={!mcqText.trim() || !quizName.trim() || !quizClass.trim()}
          className="btn btn-primary"
        >
          ✅ Parse MCQs
        </button>

        {quiz && (
          <>
            <button
              onClick={handleStartNow}
              disabled={isLoading || hasActiveQuiz}
              className="btn btn-success"
            >
              {isLoading ? 'Starting...' : '🚀 Start Quiz Now'}
            </button>

            {scheduledTime ? (
              <button
                onClick={handleScheduleQuiz}
                disabled={isLoading}
                className="btn btn-warning"
              >
                {isLoading ? 'Scheduling...' : '📅 Schedule Quiz'}
              </button>
            ) : (
              <button
                onClick={handleSaveDraft}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                {isLoading ? 'Saving...' : '💾 Save as Draft'}
              </button>
            )}
          </>
        )}
      </div>

      {quiz && (
        <div className="quiz-preview">
          <h4>📋 Quiz Preview ({quiz.questions?.length || 0} questions)</h4>
          <div className="preview-questions">
            {quiz.questions?.slice(0, 3).map((q, index) => (
              <div key={index} className="preview-question">
                <strong>Q{index + 1}:</strong> {q.question}
                <div className="preview-options">
                  {q.options?.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`preview-option ${option === q.correctAnswer ? 'correct' : ''}`}
                    >
                      {String.fromCharCode(65 + optIndex)}) {option}
                      {option === q.correctAnswer && ' ✓'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {quiz.questions && quiz.questions.length > 3 && (
              <div className="more-questions">
                + {quiz.questions.length - 3} more questions...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Component */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default QuizCreator;