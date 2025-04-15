// src/AppLayout.jsx
import React from 'react';
import Navbar from './Navbar';

const AppLayout = ({ children }) => {
  return (
    <div>
      <div style={{ paddingBottom: '70px' }}>
        {children}
      </div>
      <Navbar />
    </div>
  );
};

export default AppLayout;
