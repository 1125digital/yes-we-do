import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const [slug, setSlug] = useState('');
  const navigate = useNavigate();

  const irAInvitacion = () => {
    if (!slug.trim()) return alert('Ingresa el código de la boda');
    navigate(`/${slug}/registro`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Yes, we do</h1>
        <p style={styles.subtitle}>La red social privada para tu boda perfecta</p>

        <button onClick={() => navigate('/crear-boda')} style={styles.primaryButton}>
          💍 Soy novio/a – Crear mi boda
        </button>

        <div style={styles.divider}>o</div>

        <input
          type="text"
          placeholder="Código de tu invitación (ej. alejuan)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={styles.input}
        />

        <button onClick={irAInvitacion} style={styles.secondaryButton}>
          🎉 Ingresar como invitado
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    fontFamily: 'Segoe UI, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '3rem 2rem',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    color: '#7f8c8d',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  divider: {
    margin: '1rem 0',
    color: '#999',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginBottom: '1rem',
    fontSize: '1rem',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default Landing;
