export class QuizSynchronizer {
  static getCurrentQuestionIndex(quiz) {
    if (!quiz || !quiz.startTime) return 0;
    
    const now = Date.now();
    const elapsed = now - quiz.startTime;
    const questionDuration = quiz.timePerQuestion * 1000;
    const currentIndex = Math.floor(elapsed / questionDuration);
    
    return Math.min(currentIndex, quiz.questions.length - 1);
  }

  static getTimeRemaining(quiz, currentIndex) {
    if (!quiz || !quiz.startTime) return quiz.timePerQuestion;
    
    const now = Date.now();
    const questionStartTime = quiz.startTime + (currentIndex * quiz.timePerQuestion * 1000);
    const elapsed = now - questionStartTime;
    const remaining = Math.max(0, Math.floor((quiz.timePerQuestion * 1000 - elapsed) / 1000));
    
    return remaining;
  }

  static hasQuizEnded(quiz) {
    if (!quiz || !quiz.startTime) return false;
    
    const now = Date.now();
    const totalDuration = quiz.questions.length * quiz.timePerQuestion * 1000;
    return now > quiz.startTime + totalDuration;
  }

  static getMissedQuestions(quiz, studentStartTime) {
    if (!quiz || !quiz.startTime || !studentStartTime) return 0;
    
    const lateBy = studentStartTime - quiz.startTime;
    const questionDuration = quiz.timePerQuestion * 1000;
    const missedCount = Math.floor(lateBy / questionDuration);
    
    return Math.max(0, missedCount);
  }

  static canStudentJoin(quiz, studentName) {
    if (!quiz) return { canJoin: false, reason: 'No active quiz' };
    
    if (this.hasQuizEnded(quiz)) {
      return { canJoin: false, reason: 'Quiz has ended' };
    }
    
    const missedQuestions = this.getMissedQuestions(quiz, Date.now());
    if (missedQuestions >= quiz.questions.length) {
      return { canJoin: false, reason: 'Quiz has already ended' };
    }
    
    return { canJoin: true, missedQuestions };
  }
}