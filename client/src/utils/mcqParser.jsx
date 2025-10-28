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

  // MORE FLEXIBLE: Handle different line break patterns
  // - \n\n (double newline - desktop)
  // - \r\n\r\n (Windows style)  
  // - Single newlines with question numbering
  // - Mixed formats
  const blocks = text.split(/\n\s*\n|\r\n\s*\r\n/).filter(block => block.trim());
  
  // ALTERNATIVE: If no blocks found with double line breaks, try single line breaks with question patterns
  let questions = [];
  let errorCount = 0;

  if (blocks.length === 0) {
    // Mobile fallback: Try splitting by question patterns
    console.log('📱 Mobile format detected, using alternative parsing...');
    questions = parseMobileFormat(text);
  } else {
    // Desktop format parsing
    questions = parseDesktopFormat(blocks, errorCount);
  }

  if (questions.length === 0) {
    throw new Error(`No valid questions found. ${errorCount} errors occurred.`);
  }

  if (errorCount > 0) {
    console.warn(`${errorCount} questions had errors and were skipped.`);
  }

  return {
    questions,
    timePerQuestion,
    totalQuestions: questions.length,
    totalDuration: questions.length * timePerQuestion
  };
};

// Desktop format parser (original logic)
const parseDesktopFormat = (blocks, errorCount) => {
  const questions = [];
  
  blocks.forEach((block, index) => {
    try {
      const lines = block.split('\n').filter(line => line.trim());
      
      if (lines.length < 6) {
        throw new Error(`Question ${index + 1}: Not enough lines. Need question, 4 options, and correct answer.`);
      }

      // First line is question (handle numbered questions)
      let question = lines[0].trim();
      // Remove leading numbers like "1." "2)" etc.
      question = question.replace(/^\d+[\.\)]\s*/, '');

      // Next 4 lines should be options
      const options = [];
      for (let i = 1; i <= 4; i++) {
        const optionLine = lines[i]?.trim();
        if (!optionLine) {
          throw new Error(`Question ${index + 1}: Missing option ${String.fromCharCode(64 + i)}`);
        }
        
        // Remove A), B), C), D) prefixes if present
        const option = optionLine.replace(/^[A-D]\)\s*/, '').trim();
        if (!option) {
          throw new Error(`Question ${index + 1}: Empty option ${String.fromCharCode(64 + i)}`);
        }
        options.push(option);
      }

      // Find correct answer line (could be in remaining lines)
      let correctAnswerLine = '';
      for (let i = 5; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('correct:') || 
            lines[i].toLowerCase().includes('answer:')) {
          correctAnswerLine = lines[i];
          break;
        }
      }

      if (!correctAnswerLine) {
        throw new Error(`Question ${index + 1}: Missing "Correct: X" line`);
      }

      // Extract correct answer (A, B, C, or D)
      const correctMatch = correctAnswerLine.match(/correct:\s*([A-D])/i);
      if (!correctMatch) {
        throw new Error(`Question ${index + 1}: Invalid correct answer format. Use "Correct: A"`);
      }

      const correctLetter = correctMatch[1].toUpperCase();
      const correctAnswer = options[correctLetter.charCodeAt(0) - 65];

      if (!correctAnswer) {
        throw new Error(`Question ${index + 1}: Correct answer ${correctLetter} not found in options`);
      }

      questions.push({
        question,
        options,
        correctAnswer
      });

    } catch (error) {
      errorCount++;
      console.error(`Error parsing question ${index + 1}:`, error.message);
    }
  });

  return questions;
};

// Mobile format parser (handles single line breaks)
// Enhanced Mobile format parser
const parseMobileFormat = (text) => {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let i = 0;
  while (i < lines.length) {
    try {
      // Look for a question line (not starting with A-D) and not a "Correct:" line)
      if (lines[i] && 
          !lines[i].match(/^[A-D]\)/) && 
          !lines[i].toLowerCase().includes('correct:')) {
        
        const question = lines[i].replace(/^\d+[\.\)]\s*/, '').trim();
        i++;
        
        // Collect next 4 lines as options
        const options = [];
        for (let j = 0; j < 4 && i < lines.length; j++, i++) {
          if (lines[i] && lines[i].match(/^[A-D]\)/)) {
            const option = lines[i].replace(/^[A-D]\)\s*/, '').trim();
            options.push(option);
          } else {
            break;
          }
        }
        
        // Look for correct answer in next line
        if (i < lines.length && lines[i].toLowerCase().includes('correct:')) {
          const correctMatch = lines[i].match(/correct:\s*([A-D])/i);
          if (correctMatch && options.length === 4) {
            const correctLetter = correctMatch[1].toUpperCase();
            const correctAnswer = options[correctLetter.charCodeAt(0) - 65];
            
            if (correctAnswer) {
              questions.push({
                question,
                options,
                correctAnswer
              });
            }
          }
          i++; // Move past the correct line
        }
      } else {
        i++; // Skip lines that don't look like questions
      }
    } catch (error) {
      console.error('Error parsing mobile format question:', error);
      i++;
    }
  }
  
  console.log(`📱 Mobile parser found ${questions.length} questions`);
  return questions;
};

// More robust alternative parser
export const parseMCQVariant = (text, timePerQuestion = 30) => {
  // Try the main parser first
  try {
    const result = parseMCQText(text, timePerQuestion);
    if (result.questions.length > 0) {
      return result;
    }
  } catch (error) {
    console.log('Main parser failed, trying alternative...');
  }

  // Alternative: Split by question numbers
  const questionSections = text.split(/\d+[\.\)]\s*/).filter(section => section.trim());
  const questions = [];
  
  questionSections.forEach((section, index) => {
    try {
      const lines = section.split('\n').filter(line => line.trim());
      if (lines.length >= 5) {
        const question = lines[0].trim();
        const options = lines.slice(1, 5)
          .map(line => line.replace(/^[A-D]\)\s*/, '').trim())
          .filter(opt => opt);
        
        // Find correct answer in remaining lines
        let correctAnswer = null;
        for (let i = 5; i < lines.length; i++) {
          const correctMatch = lines[i].match(/correct:\s*([A-D])/i);
          if (correctMatch && options[correctMatch[1].charCodeAt(0) - 65]) {
            correctAnswer = options[correctMatch[1].charCodeAt(0) - 65];
            break;
          }
        }

        if (question && options.length === 4 && correctAnswer) {
          questions.push({ question, options, correctAnswer });
        }
      }
    } catch (error) {
      console.error(`Error in alternative parsing question ${index + 1}:`, error);
    }
  });

  return {
    questions,
    timePerQuestion,
    totalQuestions: questions.length,
    totalDuration: questions.length * timePerQuestion
  };
};