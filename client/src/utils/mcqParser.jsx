export function parseMCQText(text, timePerQuestion = 60) {
  if (!text.trim()) {
    throw new Error('No text provided');
  }

  // Split by empty lines to get question blocks
  const blocks = text.split('\n\n').filter(block => block.trim());
  const questions = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n').filter(line => line.trim());
    
    if (lines.length < 6) {
      throw new Error(`Question ${index + 1}: Insufficient lines. Need question, 4 options, and correct answer`);
    }

    // First line is question
    const question = lines[0].trim();
    if (!question.endsWith('?')) {
      throw new Error(`Question ${index + 1}: Question should end with '?'`);
    }

    // Next 4 lines are options
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const optionLine = lines[i]?.trim();
      if (!optionLine || !/^[A-D]\)/.test(optionLine)) {
        throw new Error(`Question ${index + 1}: Option ${String.fromCharCode(64 + i)} should start with '${String.fromCharCode(64 + i)})'`);
      }
      options.push(optionLine.substring(2).trim());
    }

    // Last line is correct answer
    const correctLine = lines[5]?.trim();
    if (!correctLine?.startsWith('Correct:')) {
      throw new Error(`Question ${index + 1}: Last line should start with 'Correct: A/B/C/D'`);
    }

    const correctAnswer = correctLine.substring(8).trim();
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      throw new Error(`Question ${index + 1}: Correct answer should be A, B, C, or D`);
    }

    // Get the actual correct option text
    const correctOptionIndex = correctAnswer.charCodeAt(0) - 65;
    const correctOptionText = options[correctOptionIndex];

    questions.push({
      question,
      options,
      correctAnswer: correctOptionText,
      timePerQuestion
    });
  });

  if (questions.length === 0) {
    throw new Error('No valid questions found');
  }

  return {
    id: Date.now().toString(),
    title: `Quiz ${new Date().toLocaleDateString()}`,
    questions,
    timePerQuestion,
    createdAt: Date.now()
  };
}