// export const parseMCQText = (text, timePerQuestion = 30) => {
//   if (!text || typeof text !== 'string') {
//     throw new Error('Invalid input: Please provide MCQ text');
//   }

//   // Split by empty lines to get question blocks
//   const blocks = text.split(/\n\s*\n/).filter(block => block.trim());
  
//   if (blocks.length === 0) {
//     throw new Error('No questions found. Please check the format.');
//   }

//   const questions = [];
//   let errorCount = 0;

//   blocks.forEach((block, index) => {
//     try {
//       const lines = block.split('\n').filter(line => line.trim());
      
//       if (lines.length < 6) {
//         throw new Error(`Question ${index + 1}: Not enough lines. Need question, 4 options, and correct answer.`);
//       }

//       // First line is question
//       const question = lines[0].trim();
      
//       // Next 4 lines should be options
//       const options = [];
//       for (let i = 1; i <= 4; i++) {
//         const optionLine = lines[i]?.trim();
//         if (!optionLine) {
//           throw new Error(`Question ${index + 1}: Missing option ${String.fromCharCode(64 + i)}`);
//         }
        
//         // Remove A), B), C), D) prefixes if present
//         const option = optionLine.replace(/^[A-D]\)\s*/, '').trim();
//         if (!option) {
//           throw new Error(`Question ${index + 1}: Empty option ${String.fromCharCode(64 + i)}`);
//         }
//         options.push(option);
//       }

//       // Find correct answer line
//       const correctAnswerLine = lines.find(line => 
//         line.toLowerCase().includes('correct:') || 
//         line.toLowerCase().includes('answer:')
//       );

//       if (!correctAnswerLine) {
//         throw new Error(`Question ${index + 1}: Missing "Correct: X" line`);
//       }

//       // Extract correct answer (A, B, C, or D)
//       const correctMatch = correctAnswerLine.match(/correct:\s*([A-D])/i);
//       if (!correctMatch) {
//         throw new Error(`Question ${index + 1}: Invalid correct answer format. Use "Correct: A"`);
//       }

//       const correctLetter = correctMatch[1].toUpperCase();
//       const correctAnswer = options[correctLetter.charCodeAt(0) - 65]; // A=0, B=1, etc.

//       if (!correctAnswer) {
//         throw new Error(`Question ${index + 1}: Correct answer ${correctLetter} not found in options`);
//       }

//       questions.push({
//         question,
//         options,
//         correctAnswer
//       });

//     } catch (error) {
//       errorCount++;
//       console.error(`Error parsing question ${index + 1}:`, error.message);
//       // Continue parsing other questions even if one fails
//     }
//   });

//   if (questions.length === 0) {
//     throw new Error(`No valid questions found. ${errorCount} errors occurred.`);
//   }

//   if (errorCount > 0) {
//     console.warn(`${errorCount} questions had errors and were skipped.`);
//   }

//   return {
//     questions,
//     timePerQuestion,
//     totalQuestions: questions.length,
//     totalDuration: questions.length * timePerQuestion
//   };
// };

// // Alternative parser for different formats
// export const parseMCQVariant = (text, timePerQuestion = 30) => {
//   // This can handle different MCQ formats if needed
//   return parseMCQText(text, timePerQuestion);
// };

export const parseMCQText = (text, timePerQuestion = 30) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: Please provide MCQ text');
  }

  console.log('📝 Raw input received:', text.substring(0, 200) + '...');

  // BULLETPROOF PARSER: Handle any format
  const questions = parseAnyFormat(text);
  
  if (questions.length === 0) {
    throw new Error('No valid questions found. Please check the format and try again.');
  }

  console.log(`✅ Successfully parsed ${questions.length} questions`);

  return {
    questions,
    timePerQuestion,
    totalQuestions: questions.length,
    totalDuration: questions.length * timePerQuestion
  };
};

// ULTIMATE PARSER: Handles any format
const parseAnyFormat = (text) => {
  const questions = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  let i = 0;
  let questionCount = 0;

  while (i < lines.length) {
    // Skip empty lines and "Question X:" prefixes
    while (i < lines.length && 
           (lines[i] === '' || 
            lines[i].toLowerCase().startsWith('question') ||
            lines[i].match(/^\d+[\.\)]/))) {
      i++;
    }

    if (i >= lines.length) break;

    // Current line is the question (remove numbering if present)
    let questionText = lines[i].replace(/^(?:\d+[\.\)]\s*|Question\s*\d*:\s*)/, '');
    i++;

    // Collect options (A), B), C), D))
    const options = [];
    for (let optCount = 0; optCount < 4 && i < lines.length; optCount++, i++) {
      if (lines[i] && lines[i].match(/^[A-D]\)/)) {
        const option = lines[i].replace(/^[A-D]\)\s*/, '');
        options.push(option);
      } else {
        // If we don't find an option, backtrack
        i--;
        break;
      }
    }

    // Look for answer (can be "ANSWER:", "Correct:", "Answer:")
    let correctAnswer = null;
    let correctLetter = null;
    
    while (i < lines.length && !correctAnswer) {
      const line = lines[i];
      
      // Check for answer patterns
      const answerMatch = line.match(/(?:ANSWER|CORRECT|Answer|Correct):\s*([A-D])/i);
      if (answerMatch) {
        correctLetter = answerMatch[1].toUpperCase();
        if (options[correctLetter.charCodeAt(0) - 65]) {
          correctAnswer = options[correctLetter.charCodeAt(0) - 65];
        }
        i++;
        break;
      }
      
      // If we hit the next question or unrelated line, stop searching
      if (line && !line.match(/^[A-D]\)/) && 
          !line.toLowerCase().includes('answer') &&
          !line.toLowerCase().includes('correct') &&
          line.length > 10) { // Probably next question
        break;
      }
      
      i++;
    }

    // Validate and add question
    if (questionText && options.length === 4 && correctAnswer) {
      questions.push({
        question: questionText,
        options: options,
        correctAnswer: correctAnswer
      });
      questionCount++;
      console.log(`✅ Parsed Q${questionCount}: ${questionText.substring(0, 30)}...`);
    } else {
      console.warn('❌ Skipped invalid question:', {
        question: questionText,
        optionsCount: options.length,
        hasAnswer: !!correctAnswer
      });
    }
  }

  return questions;
};

// Alternative parser (keep for compatibility)
export const parseMCQVariant = (text, timePerQuestion = 30) => {
  return parseMCQText(text, timePerQuestion);
};