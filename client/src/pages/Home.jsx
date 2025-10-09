import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <h1>Quiz Application</h1>
      <div className="home-buttons">
        <Link to="/admin" className="btn btn-admin">
          Admin Panel
        </Link>
        <Link to="/student" className="btn btn-student">
          Student Quiz
        </Link>
      </div>
    </div>
  );
}

export default Home;