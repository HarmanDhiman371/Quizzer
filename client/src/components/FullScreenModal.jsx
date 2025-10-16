// import React from 'react';

// function FullScreenModal({ onClose, quizInfo }) {
//   const handleFullScreen = async () => {
//     try {
//       const element = document.documentElement;
//       if (element.requestFullscreen) {
//         await element.requestFullscreen();
//       } else if (element.webkitRequestFullscreen) {
//         await element.webkitRequestFullscreen();
//       } else if (element.msRequestFullscreen) {
//         await element.msRequestFullscreen();
//       }
//       onClose();
//     } catch (error) {
//       console.log('Fullscreen error:', error);
//       onClose();
//     }
//   };

//   return (
//     <div className="fullscreen-modal">
//       <div className="modal-content">
//         <h2>Quiz Instructions</h2>
//         <div className="quiz-info">
//           <p><strong>Quiz:</strong> {quizInfo.name}</p>
//           <p><strong>Class:</strong> {quizInfo.class}</p>
//           <p><strong>Questions:</strong> {quizInfo.totalQuestions}</p>
//           <p><strong>Time per question:</strong> {quizInfo.timePerQuestion}s</p>
//         </div>
//         <div className="instructions">
//           <h3>Important Rules:</h3>
//           <ul>
//             <li>❌ Don't switch tabs or applications</li>
//             <li>❌ Don't copy or screenshot questions</li>
//             <li>✅ Stay in fullscreen mode</li>
//             <li>✅ Answer automatically submits when time ends</li>
//             <li>✅ Each question has individual timer</li>
//           </ul>
//         </div>
//         <button onClick={handleFullScreen} className="fullscreen-btn">
//           Start Quiz - Enter Fullscreen
//         </button>
//       </div>
//     </div>
//   );
// }

// export default FullScreenModal;