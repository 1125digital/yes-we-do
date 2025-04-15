import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

function Mapa() {
  const { bodaId, loading } = useBoda();
  const [ubicacion, setUbicacion] = useState('');
  const [mapsLink, setMapsLink] = useState('');

  useEffect(() => {
    if (!bodaId) return;

    const obtenerUbicacion = async () => {
      const { data, error } = await supabase
        .from('bodas')
        .select('ubicacion, maps_link')
        .eq('id', bodaId)
        .single();

      if (error) {
        console.error('Error al obtener ubicación:', error.message);
      } else {
        setUbicacion(data.ubicacion);
        setMapsLink(data.maps_link);
      }
    };

    obtenerUbicacion();
  }, [bodaId]);

  if (loading) return <p>Cargando mapa...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Ubicación del Evento 📍</h2>

      <p style={styles.texto}>La boda se celebrará en:</p>
      <p style={styles.lugar}><strong>{ubicacion}</strong></p>

      {mapsLink && (
        <>
          <iframe
            title="Mapa del evento"
            src={mapsLink.replace('/maps', '/maps/embed')}
            style={styles.mapa}
            loading="lazy"
            allowFullScreen
          ></iframe>

          <a href={mapsLink} target="_blank" rel="noopener noreferrer">
            <button style={styles.boton}>Abrir en Google Maps</button>
          </a>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  texto: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
  },
  lugar: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
  mapa: {
    width: '100%',
    maxWidth: '600px',
    height: '300px',
    border: '0',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  boton: {
    backgroundColor: '#2ecc71',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
};

export default Mapa;
