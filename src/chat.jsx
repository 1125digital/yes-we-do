import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Chats() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [yo, setYo] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!usuario?.nombre || !usuario?.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    setYo(usuario.nombre);
    cargarMensajes(usuario.nombre, usuario.boda_id);
  }, [slug]);

  const cargarMensajes = async (miNombre, bodaId) => {
    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('*')
      .eq('boda_id', bodaId)
      .order('fecha_envio', { ascending: false });

    if (error) {
      console.error('Error cargando mensajes:', error);
      return;
    }

    // Agrupar por interlocutor
    const mapa = {};

    data.forEach((msg) => {
      const otro = msg.remitente === miNombre ? msg.destinatario : msg.remitente;

      if (!mapa[otro]) {
        mapa[otro] = {
          nombre: otro,
          ultimoMensaje: msg.mensaje,
          fecha: msg.fecha_envio,
        };
      }
    });

    const conversaciones = Object.values(mapa).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setConversaciones(conversaciones);
  };

  const irAChat = (nombreInvitado) => {
    const slugInvitado = encodeURIComponent(nombreInvitado.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/${slug}/chat/${slugInvitado}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Tus conversaciones</h2>

      {conversaciones.length === 0 ? (
        <p>No has iniciado conversaciones aún.</p>
      ) : (
        conversaciones.map((c, i) => (
          <div
            key={i}
            onClick={() => irAChat(c.nombre)}
            style={{
              borderBottom: '1px solid #eee',
              padding: '1rem 0',
              cursor: 'pointer',
            }}
          >
            <strong>{c.nombre}</strong>
            <p style={{ margin: '5px 0', color: '#555' }}>{c.ultimoMensaje}</p>
            <small style={{ color: '#999' }}>
              {new Date(c.fecha).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

export default Chats;
