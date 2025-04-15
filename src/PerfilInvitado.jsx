import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function PerfilInvitado() {
  const { slug, slugInvitado } = useParams();
  const navigate = useNavigate();

  const [invitado, setInvitado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verFotoGrande, setVerFotoGrande] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const normalizar = (texto) =>
    texto.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, '');

  useEffect(() => {
    const datos = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    const bodaId = datos?.boda_id;

    if (!bodaId) {
      navigate(`/${slug}/registro`);
      return;
    }

    const buscarInvitado = async () => {
      const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .eq('boda_id', bodaId);

      if (error) {
        console.error('Error al buscar invitado:', error);
        return;
      }

      const encontrado = data.find(
        (inv) => normalizar(inv.nombre) === slugInvitado
      );

      if (encontrado) setInvitado(encontrado);
      setLoading(false);
    };

    buscarInvitado();
  }, [slug, slugInvitado]);

  const enviarMensaje = async () => {
    const datosUsuario = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    const bodaId = datosUsuario?.boda_id;

    if (!mensaje.trim()) {
      alert('Escribe un mensaje antes de enviarlo');
      return;
    }

    const { error } = await supabase.from('mensajes_privados').insert({
      boda_id: bodaId,
      remitente: datosUsuario.nombre,
      destinatario: invitado.nombre,
      mensaje,
    });

    if (error) {
      console.error('Error enviando mensaje:', error);
      alert('No se pudo enviar el mensaje');
      return;
    }

    alert('Mensaje enviado correctamente 🎉');
    setMensaje('');
  };

  if (loading) return <p>Cargando perfil...</p>;
  if (!invitado) return <p>Invitado no encontrado.</p>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>{invitado.nombre}</h2>

      {invitado.foto && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img
            src={invitado.foto}
            alt={invitado.nombre}
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => setVerFotoGrande(true)}
          />
        </div>
      )}

      {verFotoGrande && (
        <div
          onClick={() => setVerFotoGrande(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <img
            src={invitado.foto}
            alt="Foto grande"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }}
          />
        </div>
      )}

      <p><strong>Parentezco:</strong> {invitado.parentezco}</p>

      {invitado.historia && (
        <p><strong>Historia con los novios:</strong><br />{invitado.historia}</p>
      )}

      {invitado.redes && (
        <p><strong>Redes sociales:</strong><br />{invitado.redes}</p>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <div>
        <h4>Enviarle un mensaje</h4>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje para este invitado..."
          style={{ width: '100%', padding: 10, borderRadius: 6, marginBottom: 10 }}
        />
        <button
          onClick={enviarMensaje}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Enviar mensaje
        </button>
      </div>
    </div>
  );
}

export default PerfilInvitado;
