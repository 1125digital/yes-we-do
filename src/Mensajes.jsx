import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

function Mensajes() {
  const { bodaId, loading } = useBoda();
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitado) setNombreInvitado(invitado.nombre || 'Invitado');
  }, []);

  useEffect(() => {
    if (!bodaId) return;
    cargarMensajes();
  }, [bodaId]);

  const cargarMensajes = async () => {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('boda_id', bodaId)
      .order('fecha', { ascending: false });

    if (error) console.error('Error al cargar mensajes:', error.message);
    else setMensajes(data);
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) {
      alert('Escribe un mensaje primero.');
      return;
    }

    setEnviando(true);

    const nuevo = {
      boda_id: bodaId,
      autor: nombreInvitado,
      mensaje,
    };

    const { error } = await supabase.from('mensajes').insert(nuevo);
    if (error) {
      alert('Error al enviar mensaje');
      console.error(error.message);
    } else {
      setMensaje('');
      cargarMensajes();
    }

    setEnviando(false);
  };

  if (loading) return <p>Cargando boda...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Mensajes para los novios 💌</h2>
      <textarea
        placeholder="Escribe tu mensaje aquí..."
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        style={styles.textarea}
      />
      <button onClick={enviarMensaje} disabled={enviando} style={styles.boton}>
        {enviando ? 'Enviando...' : 'Enviar mensaje'}
      </button>

      <div style={styles.lista}>
        {mensajes.map((msg) => (
          <div key={msg.id} style={styles.card}>
            <p style={styles.texto}>“{msg.mensaje}”</p>
            <p style={styles.autor}>– {msg.autor}</p>
            <p style={styles.fecha}>{new Date(msg.fecha).toLocaleString()}</p>
          </div>
        ))}
      </div>
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
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '1rem',
  },
  boton: {
    backgroundColor: '#e67e22',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  lista: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#fdfdfd',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 4px rgba(0,0,0,0.05)',
    textAlign: 'left',
  },
  texto: {
    fontSize: '1rem',
    fontStyle: 'italic',
  },
  autor: {
    fontWeight: 'bold',
    marginTop: '0.5rem',
  },
  fecha: {
    fontSize: '0.8rem',
    color: '#888',
  },
};

export default Mensajes;
