import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Chats() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [yo, setYo] = useState(null);
  const [vista, setVista] = useState('chats'); // 'chats' o 'invitados'
  const [invitados, setInvitados] = useState([]);
  const [conversaciones, setConversaciones] = useState([]);
  const [bloqueadosPorMi, setBloqueadosPorMi] = useState([]);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!usuario?.nombre || !usuario?.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }
    setYo(usuario);
    cargarInvitados(usuario.boda_id, usuario.nombre);
    cargarConversaciones(usuario.nombre, usuario.boda_id);
    cargarBloqueos(usuario.boda_id, usuario.nombre);
  }, [slug]);

  const cargarInvitados = async (bodaId, miNombre) => {
    const { data, error } = await supabase
      .from('invitados')
      .select('nombre, foto, chat_bloqueado, ultimo_online')
      .eq('boda_id', bodaId);

    if (!error) {
      const sinMi = data.filter((i) => i.nombre !== miNombre);
      setInvitados(sinMi);
    }
  };

  const cargarConversaciones = async (miNombre, bodaId) => {
    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('*')
      .eq('boda_id', bodaId)
      .order('fecha_envio', { ascending: false });

    if (error) return console.error('Error cargando mensajes:', error);

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
    const lista = Object.values(mapa).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setConversaciones(lista);
  };

  const cargarBloqueos = async (bodaId, miNombre) => {
    const { data, error } = await supabase
      .from('bloqueos_chat')
      .select('bloqueado')
      .eq('boda_id', bodaId)
      .eq('bloqueador', miNombre);

    if (!error) {
      setBloqueadosPorMi(data.map((b) => b.bloqueado));
    }
  };

  const irAChat = (nombreInvitado) => {
    const slugInvitado = encodeURIComponent(nombreInvitado.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/${slug}/chat/${slugInvitado}`);
  };

  const renderChats = () => (
    conversaciones.length === 0 ? <p>No has iniciado conversaciones aún.</p> :
      conversaciones.map((c, i) => (
        <div key={i} onClick={() => irAChat(c.nombre)} style={styles.contacto}>
          <strong>{c.nombre}</strong>
          <p style={styles.preview}>{c.ultimoMensaje}</p>
          <small style={styles.fecha}>
            {new Date(c.fecha).toLocaleString('es-MX', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        </div>
      ))
  );

  const renderInvitados = () => (
    invitados.length === 0 ? <p>No hay invitados disponibles.</p> :
      invitados.map((inv, i) => {
        const bloqueado = bloqueadosPorMi.includes(inv.nombre);
        const estaEnLinea = inv.ultimo_online &&
          (Date.now() - new Date(inv.ultimo_online).getTime() < 60000);
        return (
          <div
            key={i}
            onClick={() => !bloqueado && irAChat(inv.nombre)}
            style={{ ...styles.contacto, opacity: bloqueado ? 0.5 : 1 }}
          >
            <img
              src={inv.foto || 'https://via.placeholder.com/50'}
              alt={inv.nombre}
              style={styles.avatar}
            />
            <div>
              <strong>{inv.nombre}</strong>
              {inv.chat_bloqueado && <p style={styles.alerta}>🔒 No desea recibir mensajes</p>}
              {bloqueado && <p style={styles.alerta}>🚫 Bloqueado por ti</p>}
              {inv.ultimo_online && (
                <p style={estaEnLinea ? styles.online : styles.offline}>
                  {estaEnLinea
                    ? '🟢 En línea'
                    : `🕓 Última vez: ${new Date(inv.ultimo_online).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                </p>
              )}
            </div>
          </div>
        );
      })
  );

  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        <button onClick={() => setVista('chats')} style={vista === 'chats' ? styles.tabActivo : styles.tab}>
          🗨️ Chats
        </button>
        <button onClick={() => setVista('invitados')} style={vista === 'invitados' ? styles.tabActivo : styles.tab}>
          📇 Invitados
        </button>
      </div>

      <div style={styles.lista}>
        {vista === 'chats' ? renderChats() : renderInvitados()}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' },
  tabs: { display: 'flex', justifyContent: 'space-around', marginBottom: 20 },
  tab: { padding: 10, fontSize: 16, cursor: 'pointer', backgroundColor: '#eee', border: 'none', borderRadius: 6 },
  tabActivo: { padding: 10, fontSize: 16, cursor: 'pointer', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: 6 },
  lista: { borderTop: '1px solid #ddd' },
  contacto: { borderBottom: '1px solid #eee', padding: '1rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  preview: { margin: '5px 0', color: '#555' },
  fecha: { color: '#999' },
  alerta: { margin: 0, fontSize: 12, color: '#c0392b' },
  online: { margin: 0, fontSize: 12, color: '#27ae60' },
  offline: { margin: 0, fontSize: 12, color: '#888' },
};

export default Chats;
