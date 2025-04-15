import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Notificaciones() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [invitado, setInvitado] = useState(null);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const invitadoLocal = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitadoLocal || !invitadoLocal.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    setInvitado(invitadoLocal);
    obtenerEventos(invitadoLocal.boda_id);
  }, [slug]);

  const obtenerEventos = async (bodaId) => {
    const { data, error } = await supabase
      .from('eventos_especiales')
      .select('*')
      .eq('boda_id', bodaId)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error cargando eventos:', error);
    } else {
      setEventos(data);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>🔔 Notificaciones</h2>

      {eventos.length === 0 && <p style={{ textAlign: 'center' }}>No hay eventos por ahora.</p>}

      {eventos.map((evento) => (
        <div
          key={evento.id}
          style={{
            marginBottom: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: '#f4f6f8',
            borderLeft: '5px solid #3498db',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{evento.titulo}</h3>
          {evento.fecha && (
            <p style={{ margin: '6px 0', fontSize: 13, color: '#666' }}>
              📅 {new Date(evento.fecha).toLocaleString('es-MX', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
          {evento.descripcion && <p style={{ margin: 0 }}>{evento.descripcion}</p>}
        </div>
      ))}
    </div>
  );
}

export default Notificaciones;
