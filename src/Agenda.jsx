import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

function Agenda() {
  const { bodaId, loading } = useBoda();
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    if (!bodaId) return;
    cargarAgenda();
  }, [bodaId]);

  const cargarAgenda = async () => {
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .eq('boda_id', bodaId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error al cargar agenda:', error.message);
    } else {
      setEventos(data);
    }
  };

  if (loading) return <p>Cargando agenda...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Agenda del Evento 📅</h2>

      {eventos.length === 0 && <p>No hay eventos agendados aún.</p>}

      <div style={styles.lista}>
        {eventos.map((evento) => (
          <div key={evento.id} style={styles.card}>
            <p style={styles.hora}>🕒 {evento.hora}</p>
            <h3 style={styles.titulo}>{evento.titulo}</h3>
            {evento.lugar && <p style={styles.lugar}>📍 {evento.lugar}</p>}
            {evento.descripcion && <p style={styles.descripcion}>{evento.descripcion}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  lista: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 0 4px rgba(0,0,0,0.05)',
    textAlign: 'left',
  },
  hora: {
    fontSize: '0.9rem',
    color: '#444',
  },
  titulo: {
    fontSize: '1.2rem',
    margin: '0.3rem 0',
  },
  lugar: {
    fontSize: '0.95rem',
    color: '#666',
  },
  descripcion: {
    fontSize: '0.9rem',
    color: '#333',
    marginTop: '0.5rem',
  },
};

export default Agenda;
