import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

function ChatPrivado() {
  const { slug, slugInvitado } = useParams();
  const navigate = useNavigate();

  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [yo, setYo] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const mensajesEndRef = useRef(null);

  const desnormalizar = (slugInv) =>
    slugInv.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitado?.nombre || !invitado?.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    setYo(invitado.nombre);
    setDestinatario(desnormalizar(slugInvitado));
    cargarMensajes(invitado.nombre, desnormalizar(slugInvitado), invitado.boda_id);
  }, [slug, slugInvitado]);

  const cargarMensajes = async (remitente, destinatario, bodaId) => {
    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('*')
      .eq('boda_id', bodaId)
      .or(`remitente.eq.${remitente},destinatario.eq.${remitente}`)
      .order('fecha_envio', { ascending: true });

    if (error) {
      console.error('Error al cargar mensajes:', error);
      return;
    }

    const filtrados = data.filter(
      (msg) =>
        (msg.remitente === remitente && msg.destinatario === destinatario) ||
        (msg.remitente === destinatario && msg.destinatario === remitente)
    );

    setMensajes(filtrados);

    // Scroll al final
    setTimeout(() => mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const { error } = await supabase.from('mensajes_privados').insert({
      boda_id: JSON.parse(localStorage.getItem('yeswedo_invitado')).boda_id,
      remitente: yo,
      destinatario,
      mensaje,
    });

    if (error) {
      console.error('Error al enviar mensaje:', error);
      return;
    }

    setMensaje('');
    cargarMensajes(yo, destinatario, JSON.parse(localStorage.getItem('yeswedo_invitado')).boda_id);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Chat con {destinatario}</h2>

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
          backgroundColor: '#f9f9f9',
        }}
      >
        {mensajes.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.remitente === yo ? 'right' : 'left',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: m.remitente === yo ? '#d1e7dd' : '#e9ecef',
                color: '#333',
                padding: '8px 12px',
                borderRadius: 12,
                maxWidth: '70%',
              }}
            >
              {m.mensaje}
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {new Date(m.fecha_envio).toLocaleString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
              })}
            </div>
          </div>
        ))}
        <div ref={mensajesEndRef} />
      </div>

      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribe tu mensaje..."
        style={{ width: '100%', padding: 10, borderRadius: 6, marginBottom: 10 }}
      />

      <button
        onClick={enviarMensaje}
        style={{
          padding: '10px 20px',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Enviar
      </button>
    </div>
  );
}

export default ChatPrivado;
