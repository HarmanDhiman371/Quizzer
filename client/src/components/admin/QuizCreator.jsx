import React, { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { parseMCQText } from '../../utils/mcqParser';
import { saveQuizToFirestore, setActiveQuiz } from '../../utils/firestore';

const QuizCreator = () => {
  const { activeQuiz } = useQuiz();
  const [mcqText, setMcqText] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizName, setQuizName] = useState('');
  const [quizClass, setQuizClass] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's an active quiz
  const hasActiveQuiz = activeQuiz && activeQuiz.status === 'active';

  const handleParseMCQ = () => {
    try {
      if (!mcqText.trim()) {
        alert('Please paste some MCQs');
        return;
      }

      if (!quizName.trim()) {
        alert('Please enter a quiz name');
        return;
      }

      if (!quizClass.trim()) {
        alert('Please enter a class name');
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
      alert(`✅ Successfully parsed ${parsedQuiz.questions.length} questions!`);
    } catch (error) {
      alert('❌ Error parsing MCQs: ' + error.message);
    }
  };

  const handleStartNow = async () => {
    if (!quiz) {
      alert('Please parse MCQs first');
      return;
    }

    if (hasActiveQuiz) {
      alert('❌ There is already an active quiz. Please end it first before starting a new one.');
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
      alert('🚀 Quiz started successfully! Students can now join.');
      
      // Reset form
      setMcqText('');
      setQuizName('');
      setQuizClass('');
      setScheduledTime('');
      setQuiz(null);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // In your handleScheduleQuiz function, replace with:
const handleScheduleQuiz = async () => {
  if (!quiz) {
    alert('Please parse MCQs first');
    return;
  }

  if (!scheduledTime) {
    alert('Please set a schedule time first');
    return;
  }

  const scheduleTime = new Date(scheduledTime).getTime();
  const now = Date.now();

  if (scheduleTime <= now) {
    alert('Scheduled time must be in the future');
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
    alert(`✅ Quiz scheduled for ${new Date(scheduleTime).toLocaleString()}`);
    
    // Reset form
    setMcqText('');
    setQuizName('');
    setQuizClass('');
    setScheduledTime('');
    setQuiz(null);
  } catch (error) {
    console.error('Error scheduling quiz:', error);
    alert('Error scheduling quiz: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleSaveDraft = async () => {
    if (!quiz) {
      alert('Please parse MCQs first');
      return;
    }

    setIsLoading(true);
    try {
      await saveQuizToFirestore(quiz);
      alert('✅ Quiz saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft: ' + error.message);
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
          <input
            type="number"
            value={timePerQuestion}
            onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 30)}
            min="10"
            max="120"
          />
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
    </div>
  );
};

export default QuizCreator;