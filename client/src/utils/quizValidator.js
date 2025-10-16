export const validateQuizStructure = (quiz) => {
  const errors = [];
  
  if (!quiz) {
    errors.push('Quiz is null or undefined');
    return { isValid: false, errors };
  }
  
  if (!quiz.id) errors.push('Missing quiz ID');
  if (!quiz.name) errors.push('Missing quiz name');
  if (!quiz.class) errors.push('Missing quiz class');
  
  // Check questions
  if (!quiz.questions) {
    errors.push('Missing questions array');
  } else if (!Array.isArray(quiz.questions)) {
    errors.push('Questions is not an array');
  } else if (quiz.questions.length === 0) {
    errors.push('Questions array is empty');
  } else {
    // Validate each question
    quiz.questions.forEach((q, index) => {
      if (!q.question) errors.push(`Question ${index + 1}: Missing question text`);
      if (!q.options || !Array.isArray(q.options)) errors.push(`Question ${index + 1}: Invalid options`);
      if (!q.correctAnswer) errors.push(`Question ${index + 1}: Missing correct answer`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const logQuizDebugInfo = (quiz) => {
  console.group('🎯 Quiz Debug Information');
  console.log('Quiz ID:', quiz?.id);
  console.log('Quiz Name:', quiz?.name);
  console.log('Quiz Class:', quiz?.class);
  console.log('Quiz Status:', quiz?.status);
  console.log('Questions Count:', quiz?.questions?.length);
  console.log('Questions Array:', quiz?.questions);
  console.log('Current Question Index:', quiz?.currentQuestionIndex);
  console.log('Time Per Question:', quiz?.timePerQuestion);
  console.groupEnd();
};