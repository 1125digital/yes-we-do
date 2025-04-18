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
  const [destinatarioBloqueoGlobal, setDestinatarioBloqueoGlobal] = useState(false);
  const [meBloqueo, setMeBloqueo] = useState(false);
  const [yoBloquee, setYoBloquee] = useState(false);
  const mensajesEndRef = useRef(null);

  const desnormalizar = (slugInv) =>
    slugInv.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitado?.nombre || !invitado?.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    const nombreDestino = desnormalizar(slugInvitado);
    setYo(invitado);
    setDestinatario(nombreDestino);

    verificarPrivacidad(invitado, nombreDestino);
    cargarMensajes(invitado.nombre, nombreDestino, invitado.boda_id);

    // ✅ Solo marcar como leídos si este usuario es el DESTINATARIO
    if (invitado.nombre === nombreDestino) {
      marcarMensajesComoLeidos(nombreDestino, invitado.nombre, invitado.boda_id);
    }
  }, [slug, slugInvitado]);

  const verificarPrivacidad = async (yo, otro) => {
    const { data: invitado } = await supabase
      .from('invitados')
      .select('chat_bloqueado')
      .eq('boda_id', yo.boda_id)
      .eq('nombre', otro)
      .single();

    setDestinatarioBloqueoGlobal(invitado?.chat_bloqueado || false);

    const { data: bloqueos1 } = await supabase
      .from('bloqueos_chat')
      .select('*')
      .eq('boda_id', yo.boda_id)
      .eq('bloqueador', otro)
      .eq('bloqueado', yo.nombre);

    setMeBloqueo(bloqueos1.length > 0);

    const { data: bloqueos2 } = await supabase
      .from('bloqueos_chat')
      .select('*')
      .eq('boda_id', yo.boda_id)
      .eq('bloqueador', yo.nombre)
      .eq('bloqueado', otro);

    setYoBloquee(bloqueos2.length > 0);
  };

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
    setTimeout(() => mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const marcarMensajesComoLeidos = async (remitente, destinatario, bodaId) => {
    const { error } = await supabase
      .from('mensajes_privados')
      .update({ leido: true })
      .eq('boda_id', bodaId)
      .eq('remitente', remitente)
      .eq('destinatario', destinatario)
      .eq('leido', false);

    if (error) {
      console.error('Error al marcar como leídos:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const { error } = await supabase.from('mensajes_privados').insert({
      boda_id: yo.boda_id,
      remitente: yo.nombre,
      destinatario,
      mensaje,
      leido: false,
    });

    if (error) {
      console.error('Error al enviar mensaje:', error);
      return;
    }

    setMensaje('');
    cargarMensajes(yo.nombre, destinatario, yo.boda_id);
  };

  const toggleBloqueo = async () => {
    if (!yo || !destinatario) return;

    if (yoBloquee) {
      await supabase
        .from('bloqueos_chat')
        .delete()
        .eq('boda_id', yo.boda_id)
        .eq('bloqueador', yo.nombre)
        .eq('bloqueado', destinatario);
      setYoBloquee(false);
    } else {
      await supabase.from('bloqueos_chat').insert({
        boda_id: yo.boda_id,
        bloqueador: yo.nombre,
        bloqueado: destinatario,
      });
      setYoBloquee(true);
    }
  };

  const chatDeshabilitado = destinatarioBloqueoGlobal || meBloqueo || yoBloquee;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Chat con {destinatario}</h2>

      {(chatDeshabilitado || yoBloquee) && (
        <div
          style={{
            backgroundColor: '#fce4e4',
            color: '#c0392b',
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          {yoBloquee
            ? 'Has bloqueado a este contacto. No podrás enviarle mensajes.'
            : meBloqueo
            ? 'Este contacto te ha bloqueado. No puedes enviarle mensajes.'
            : 'Este usuario ha desactivado el chat y no desea recibir mensajes.'}
        </div>
      )}

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
              textAlign: m.remitente?.toLowerCase().trim() === yo.nombre.toLowerCase().trim() ? 'right' : 'left',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor:
                  m.remitente?.toLowerCase().trim() === yo.nombre.toLowerCase().trim()
                    ? '#d1e7dd'
                    : '#e9ecef',
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
              {m.remitente?.toLowerCase().trim() === yo.nombre.toLowerCase().trim() &&
                m.destinatario?.toLowerCase().trim() === destinatario.toLowerCase().trim() && (
                  <span style={{ color: m.leido ? '#2ecc71' : '#999', marginLeft: 6 }}>
                    ✅
                  </span>
              )}
            </div>
          </div>
        ))}
        <div ref={mensajesEndRef} />
      </div>

      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribe tu mensaje..."
        disabled={chatDeshabilitado}
        style={{ width: '100%', padding: 10, borderRadius: 6, marginBottom: 10 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button
          onClick={enviarMensaje}
          disabled={chatDeshabilitado}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: chatDeshabilitado ? '#ccc' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: chatDeshabilitado ? 'not-allowed' : 'pointer',
          }}
        >
          Enviar
        </button>

        <button
          onClick={toggleBloqueo}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: yoBloquee ? '#e74c3c' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {yoBloquee ? 'Desbloquear' : 'Bloquear'}
        </button>
      </div>
    </div>
  );
}

export default ChatPrivado;
