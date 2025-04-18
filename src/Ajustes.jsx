import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Ajustes() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [bodaId, setBodaId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [chatBloqueado, setChatBloqueado] = useState(false);
  const [bloqueados, setBloqueados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitado || !invitado.nombre || !invitado.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    setNombre(invitado.nombre);
    setBodaId(invitado.boda_id);
    cargarEstadoInicial(invitado.boda_id, invitado.nombre);
  }, [slug]);

  const cargarEstadoInicial = async (bodaId, nombre) => {
    setCargando(true);

    const { data: invitadoData } = await supabase
      .from('invitados')
      .select('chat_bloqueado')
      .eq('boda_id', bodaId)
      .eq('nombre', nombre)
      .single();

    setChatBloqueado(invitadoData?.chat_bloqueado || false);

    const { data: bloqueos } = await supabase
      .from('bloqueos_chat')
      .select('bloqueado')
      .eq('boda_id', bodaId)
      .eq('bloqueador', nombre);

    setBloqueados(bloqueos?.map((b) => b.bloqueado) || []);
    setCargando(false);
  };

  const toggleChatGlobal = async () => {
    const nuevoEstado = !chatBloqueado;

    const { error } = await supabase
      .from('invitados')
      .update({ chat_bloqueado: nuevoEstado })
      .eq('boda_id', bodaId)
      .eq('nombre', nombre);

    if (!error) {
      setChatBloqueado(nuevoEstado);
    } else {
      alert('Error actualizando estado del chat');
    }
  };

  const desbloquearInvitado = async (nombreBloqueado) => {
    const { error } = await supabase
      .from('bloqueos_chat')
      .delete()
      .eq('boda_id', bodaId)
      .eq('bloqueador', nombre)
      .eq('bloqueado', nombreBloqueado);

    if (!error) {
      setBloqueados(bloqueados.filter((n) => n !== nombreBloqueado));
    } else {
      alert('Error al desbloquear invitado');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('yeswedo_invitado');
    navigate(`/${slug}/registro`);
  };

  if (cargando) return <p style={{ textAlign: 'center' }}>Cargando ajustes...</p>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>⚙️ Ajustes</h2>

      <div style={styles.card}>
        <p><strong>Chat general:</strong></p>
        <p style={{ color: '#555' }}>
          {chatBloqueado
            ? 'Actualmente nadie puede enviarte mensajes.'
            : 'Otros invitados pueden escribirte.'}
        </p>
        <button onClick={toggleChatGlobal} style={styles.botonSecundario}>
          {chatBloqueado ? 'Habilitar chat' : 'Desactivar chat'}
        </button>
      </div>

      <div style={styles.card}>
        <p><strong>Invitados bloqueados individualmente:</strong></p>
        {bloqueados.length === 0 ? (
          <p style={{ color: '#777' }}>No has bloqueado a nadie.</p>
        ) : (
          bloqueados.map((nombreBloqueado, i) => (
            <div key={i} style={styles.bloqueado}>
              <span>{nombreBloqueado}</span>
              <button
                onClick={() => desbloquearInvitado(nombreBloqueado)}
                style={styles.desbloquear}
              >
                Desbloquear
              </button>
            </div>
          ))
        )}
      </div>

      <div style={styles.card}>
        <p><strong>Cerrar sesión:</strong></p>
        <p style={{ color: '#777' }}>Cerrarás sesión como <strong>{nombre}</strong>.</p>
        <button onClick={cerrarSesion} style={styles.botonCerrar}>
          Cerrar sesión
        </button>
      </div>

      <div style={styles.card}>
        <p style={{ fontWeight: 'bold' }}>🧠 App desarrollada por:</p>
        <p style={{ color: '#555' }}>
          Rodrigo Campos · Especialista en soluciones digitales para eventos
        </p>
        <p style={{ fontSize: 14, color: '#777' }}>
          ¿Quieres una app como esta para tu boda o negocio?
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <a
            href="mailto:tu@email.com"
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            📩 Contáctame
          </a>

          <button
            onClick={() => {
              navigator.clipboard.writeText("tu@email.com");
              alert("Correo copiado al portapapeles");
            }}
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: '#34495e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            📋 Copiar email
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#f9f9f9',
    padding: '1.5rem',
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: 25,
  },
  botonSecundario: {
    marginTop: 10,
    padding: '10px 20px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  botonCerrar: {
    marginTop: 10,
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  bloqueado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #eee',
  },
  desbloquear: {
    padding: '4px 10px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
};

export default Ajustes;
