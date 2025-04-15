import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

function Welcome() {
  const { bodaId, loading } = useBoda();
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [nombreNovios, setNombreNovios] = useState('');
  const [fecha, setFecha] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [diasRestantes, setDiasRestantes] = useState(null);

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitado) setNombreInvitado(invitado.nombre || 'Invitado');
  }, []);

  useEffect(() => {
    if (!bodaId || loading) return;

    const obtenerInfoBoda = async () => {
      const { data, error } = await supabase
        .from('bodas')
        .select('nombre_novios, fecha_boda, ubicacion')
        .eq('id', bodaId)
        .single();

      if (data) {
        setNombreNovios(data.nombre_novios);
        setFecha(data.fecha_boda);
        setUbicacion(data.ubicacion);

        const fechaEvento = new Date(data.fecha_boda);
        const hoy = new Date();
        const diferencia = fechaEvento - hoy;
        const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
        setDiasRestantes(dias);
      }

      if (error) {
        console.error('Error al obtener info de la boda:', error.message);
      }
    };

    obtenerInfoBoda();
  }, [bodaId]);

  if (loading) return <p>Cargando...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>¡Hola {nombreInvitado}! 👋</h2>
      <p>Bienvenido(a) a la boda de <strong>{nombreNovios}</strong></p>

      <div style={styles.card}>
        <p><strong>📅 Fecha:</strong> {new Date(fecha).toLocaleDateString()}</p>
        <p><strong>📍 Lugar:</strong> {ubicacion}</p>
        <p><strong>⏳ Faltan:</strong> {diasRestantes} días</p>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <p>✨ Aquí podrás:</p>
      <ul style={styles.lista}>
        <li>📣 Ver y compartir momentos en el muro</li>
        <li>📷 Guardar fotos personales en tu álbum</li>
        <li>🎧 Sugerir canciones para la playlist del evento</li>
        <li>💌 Dejar mensajes para los novios</li>
      </ul>

      <p style={{ marginTop: '2rem' }}>¡Disfruta y prepárate para un día inolvidable! 💍</p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: '1rem',
    borderRadius: '10px',
    marginTop: '1rem',
    boxShadow: '0 0 4px rgba(0,0,0,0.05)',
  },
  lista: {
    textAlign: 'left',
    listStyle: 'none',
    paddingLeft: 0,
    marginTop: '1rem',
    lineHeight: '1.6',
  },
};

export default Welcome;
