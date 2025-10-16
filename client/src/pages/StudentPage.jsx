import React from 'react';
import TestStudentInterface from '../components/student/TestStudentInterface';

const StudentPage = () => {
  return (
    <div className="student-page">
      <div className="container">
        <header className="page-header">
          {/* <h1>📚 Student Quiz</h1>
          <p>Test the synchronized quiz experience</p> */}
        </header>
        <TestStudentInterface />
      </div>
    </div>
  );
};

export default StudentPage;