// src/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = ({ slug }) => {
  return (
    <nav style={styles.nav}>
      <NavLink to={`/${slug}/muro`} style={styles.link}>🏠</NavLink>
      <NavLink to={`/${slug}/album`} style={styles.link}>📷</NavLink>
      <NavLink to={`/${slug}/chat`} style={styles.link}>💬</NavLink>
      <NavLink to={`/${slug}/notificaciones`} style={styles.link}>📅</NavLink>
      <NavLink to={`/${slug}/evento-principal`} style={styles.link}>📍</NavLink>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTop: '1px solid #ccc',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 0',
    fontSize: '24px',
    zIndex: 1000,
  },
  link: {
    textDecoration: 'none',
    color: '#444',
  }
};

export default Navbar;
