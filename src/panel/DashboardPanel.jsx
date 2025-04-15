import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function DashboardPanel() {
  const { slug } = useParams();
  const [boda, setBoda] = useState(null);

  useEffect(() => {
    const cargarBoda = async () => {
      const { data, error } = await supabase
        .from('bodas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Boda no encontrada:', error.message);
        return;
      }

      setBoda(data);
    };

    cargarBoda();
  }, [slug]);

  if (!boda) return <p>Cargando boda...</p>;

  return (
    <div style={styles.container}>
      <h2>👋 Hola {boda.nombre_novios}</h2>
      <p>¡Bienvenidos al panel de su boda!</p>

      <div style={styles.grid}>
        <Link to={`/${slug}/panel/evento`} style={styles.card}>🏛️ Evento Principal</Link>
        <Link to={`/${slug}/panel/especiales`} style={styles.card}>🗓️ Eventos Especiales</Link>
        <Link to={`/${slug}/panel/mesas`} style={styles.card}>🪑 Layout de Mesas</Link>
        <Link to={`/${slug}/panel/invitados`} style={styles.card}>👤 Invitados</Link>
        <Link to={`/${slug}/panel/fotos`} style={styles.card}>📷 Muro y Fotos</Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  grid: {
    marginTop: '2rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
  },
  card: {
    padding: '1.5rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    boxShadow: '0 0 4px rgba(0,0,0,0.05)',
    transition: '0.2s ease',
  },
};

export default DashboardPanel;
