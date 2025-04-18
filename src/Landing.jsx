import React from 'react';
import './Landing.css';
import logo from './logo.png';

function Landing() {
  return (
    <div className="landing-container">
      <img src={logo} alt="Yes, we do" className="landing-logo" />
    </div>
  );
}

export default Landing;

