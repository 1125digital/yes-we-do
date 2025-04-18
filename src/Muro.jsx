import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import imageCompression from 'browser-image-compression';

function Muro() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [bodaId, setBodaId] = useState(null);
  const [invitado, setInvitado] = useState(null);
  const [esNovio, setEsNovio] = useState(false);
  const [diasFaltantes, setDiasFaltantes] = useState(null);
  const [fechaFormateada, setFechaFormateada] = useState('');
  const [horaFormateada, setHoraFormateada] = useState('');
  const [comentario, setComentario] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagenFile, setImagenFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [posts, setPosts] = useState([]);
  const [comentariosPorPost, setComentariosPorPost] = useState({});
  const [notificaciones, setNotificaciones] = useState({ mensajes: false, eventos: false });

  const imagenInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    const invitadoLocal = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    const noviosLocal = JSON.parse(localStorage.getItem('yeswedo_novios'));
    if (!invitadoLocal && !noviosLocal) {
      navigate(`/${slug}/registro`);
      return;
    }
    setInvitado(invitadoLocal);
    setEsNovio(Boolean(noviosLocal));
    if (invitadoLocal?.boda_id) setBodaId(invitadoLocal.boda_id);
    if (noviosLocal?.boda_id) setBodaId(noviosLocal.boda_id);
  }, [slug]);

  useEffect(() => {
    if (bodaId) {
      cargarPosts();
      obtenerFechaBoda();
      revisarMensajesNoLeidos();
    }
  }, [bodaId]);

  const obtenerFechaBoda = async () => {
    const { data } = await supabase.from('bodas').select('fecha_boda').eq('id', bodaId).single();
    if (data) calcularDatosDeFecha(data.fecha_boda);
  };

  const calcularDatosDeFecha = (fechaISO) => {
    const evento = new Date(fechaISO);
    const hoy = new Date();
    const dif = Math.ceil((evento - hoy) / (1000 * 60 * 60 * 24));
    setDiasFaltantes(dif);

    const fechaLarga = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(evento);

    const hora = evento.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    setFechaFormateada(fechaLarga);
    setHoraFormateada(hora);
  };
  const subirArchivo = async (file, tipo) => {
    if (!file) return null;
    const nombre = `post_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(tipo).upload(nombre, file, {
      upsert: false,
    });

    if (error) {
      alert(`Error al subir archivo: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(tipo).getPublicUrl(nombre);
    return data?.publicUrl || null;
  };

  const publicar = async () => {
    if (!comentario && !imagenFile && !videoFile) {
      alert('Agrega un comentario, imagen o video');
      return;
    }

    setSubiendo(true);
    setProgreso(20);

    const imagen_url = await subirArchivo(imagenFile, 'imagenes');
    setProgreso(60);
    const video_url = await subirArchivo(videoFile, 'videos');
    setProgreso(90);

    if (!comentario && !imagen_url && !video_url) {
      alert('No se pudo subir el contenido.');
      setSubiendo(false);
      return;
    }

    const nueva = {
      boda_id: bodaId,
      autor: invitado?.nombre || 'Novio/a',
      autor_foto: invitado?.foto || null,
      comentario,
      categoria,
      imagen_url,
      video_url,
      reacciones: {},
      comentarios: [],
      fijado: false,
    };

    const { error } = await supabase.from('publicaciones').insert(nueva);

    if (error) {
      alert(`Error insertando publicación:\n${error.message}`);
    }

    setComentario('');
    setImagenFile(null);
    setVideoFile(null);
    setCategoria('');
    if (imagenInputRef.current) imagenInputRef.current.value = null;
    if (videoInputRef.current) videoInputRef.current.value = null;

    await cargarPosts();
    setSubiendo(false);
    setProgreso(100);
    setTimeout(() => setProgreso(0), 500);
  };

  const cargarPosts = async () => {
    const { data } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('boda_id', bodaId)
      .order('created_at', { ascending: false });

    if (data) {
      data.sort((a, b) => b.fijado - a.fijado);
      setPosts(data);
    }
  };
  const fijarPublicacion = async (postId, estadoActual) => {
    if (!esNovio) return;

    if (!estadoActual) {
      await supabase
        .from('publicaciones')
        .update({ fijado: false })
        .eq('boda_id', bodaId)
        .eq('fijado', true);
    }

    const { error } = await supabase
      .from('publicaciones')
      .update({ fijado: !estadoActual })
      .eq('id', postId);

    if (error) {
      alert(`Error al fijar publicación: ${error.message}`);
      return;
    }

    cargarPosts();
  };

  const manejarReaccion = async (post, tipoReaccion) => {
    const copia = { ...post.reacciones };
    const yaTiene = copia[invitado?.nombre || 'novio'] === tipoReaccion;

    if (yaTiene) {
      delete copia[invitado?.nombre || 'novio'];
    } else {
      copia[invitado?.nombre || 'novio'] = tipoReaccion;
    }

    await supabase
      .from('publicaciones')
      .update({ reacciones: copia })
      .eq('id', post.id);

    cargarPosts();
  };

  const enviarComentario = async (postId) => {
    const texto = comentariosPorPost[postId];
    if (!texto) return;

    const post = posts.find((p) => p.id === postId);
    const nuevosComentarios = [
      ...(post.comentarios || []),
      {
        autor: invitado?.nombre || 'Novio/a',
        foto: invitado?.foto || null,
        texto,
        fecha: new Date().toISOString(),
      },
    ];

    await supabase
      .from('publicaciones')
      .update({ comentarios: nuevosComentarios })
      .eq('id', postId);

    setComentariosPorPost({ ...comentariosPorPost, [postId]: '' });
    cargarPosts();
  };

  const contarReacciones = (reacciones, tipo) =>
    Object.values(reacciones || {}).filter((r) => r === tipo).length;

  const revisarMensajesNoLeidos = async () => {
    const nombreInv = invitado?.nombre;
    if (!nombreInv || !bodaId) return;

    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('id')
      .eq('boda_id', bodaId)
      .eq('destinatario', nombreInv)
      .eq('leido', false);

    if (error) {
      console.error('Error al revisar mensajes no leídos:', error);
      return;
    }

    if (data.length > 0) {
      setNotificaciones((prev) => ({ ...prev, mensajes: true }));
    }
  };
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif', paddingBottom: 90 }}>
      {subiendo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '4px',
            backgroundColor: '#27ae60',
            width: `${progreso}%`,
            zIndex: 2000,
            transition: 'width 0.3s ease-in-out',
          }}
        />
      )}

      {/* ÍCONOS FLOTANTES */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 2000,
          display: 'flex',
          gap: 12,
          backgroundColor: 'white',
          padding: 6,
          borderRadius: 30,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      >
        <div
          onClick={() => slug && navigate(`/${slug}/chat`)}
          style={{
            width: 40,
            height: 40,
            backgroundColor: notificaciones.mensajes ? '#e74c3c' : '#2ecc71',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
          title="Mensajes privados"
        >
          <span style={{ fontSize: 20, color: 'white' }}>💬</span>
          {notificaciones.mensajes && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 10,
                height: 10,
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
          )}
        </div>

        <div
          onClick={() => slug && navigate(`/${slug}/notificaciones`)}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#3498db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Eventos especiales"
        >
          <span style={{ fontSize: 20, color: 'white' }}>🔔</span>
        </div>
        {esNovio && (
          <div
            onClick={() => slug && navigate(`/${slug}/panel`)}
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#8e44ad',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Panel de control"
          >
            <span style={{ fontSize: 20, color: 'white' }}>🛠️</span>
          </div>
        )}

        <div
          onClick={() => slug && navigate(`/${slug}/evento-principal`)}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#f39c12',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Ver evento principal"
        >
          <span style={{ fontSize: 20, color: 'white' }}>📍</span>
        </div>
      </div>

      {(invitado || esNovio) && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            ¡Hola, {(invitado?.nombre || 'novios')}!
          </div>
          {invitado?.foto && (
            <img
              src={invitado.foto}
              alt={invitado.nombre}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                marginTop: 10,
              }}
            />
          )}
          {diasFaltantes !== null && (
            <div style={{ marginTop: 10 }}>
              <p style={{ margin: 4 }}>
                La boda es el <strong>{fechaFormateada}</strong> a las <strong>{horaFormateada}</strong>.
              </p>
              <p style={{ margin: 4 }}>
                Faltan <strong>{diasFaltantes}</strong> días para la boda 🎉
              </p>
            </div>
          )}
        </div>
      )}
      {(invitado || esNovio) && (
        <div>
          <textarea
            placeholder="Escribe algo bonito..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6 }}
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6 }}
          >
            <option value="">Selecciona categoría</option>
            <option value="Fotos antiguas">Fotos antiguas</option>
            <option value="Mensajes">Mensajes</option>
            <option value="Momentos">Momentos</option>
          </select>

          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>
            📷 Subir imagen:
          </label>
          <input
            type="file"
            accept="image/*"
            ref={imagenInputRef}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const compressed = await imageCompression(file, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
              });
              setImagenFile(compressed);
            }}
            style={{ marginBottom: 10 }}
          />
          {imagenFile && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={URL.createObjectURL(imagenFile)}
                alt="Previsualización"
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10 }}
              />
            </div>
          )}
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>
            🎥 Subir video:
          </label>
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                alert('El video es muy grande. Máximo permitido: 10MB.');
                return;
              }
              setVideoFile(file);
            }}
            style={{ marginBottom: 10 }}
          />
          {videoFile && (
            <div style={{ marginBottom: 16 }}>
              <video
                src={URL.createObjectURL(videoFile)}
                controls
                style={{ width: '100%', maxHeight: 300, borderRadius: 10 }}
              />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={publicar}
              disabled={subiendo}
              style={{
                padding: '10px 20px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                width: '100%',
              }}
            >
              {subiendo ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      <hr style={{ margin: '2rem 0' }} />

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            marginBottom: 30,
            borderBottom: '1px solid #ddd',
            paddingBottom: 20,
            position: 'relative',
            backgroundColor: post.fijado ? '#fffae6' : 'transparent',
          }}
        >
          {esNovio && (
            <button
              onClick={() => fijarPublicacion(post.id, post.fijado)}
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                padding: '2px 6px',
                fontSize: '12px',
                backgroundColor: post.fijado ? '#e74c3c' : '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              {post.fijado ? '📌 Desfijar' : '📌 Fijar'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            {post.autor_foto && (
              <img
                src={post.autor_foto}
                alt={post.autor}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: 10,
                }}
              />
            )}
            <div>
              <a
                href={`/${slug}/invitado/${encodeURIComponent(
                  post.autor.toLowerCase().replace(/\s+/g, '-')
                )}`}
                style={{ textDecoration: 'none', color: '#2980b9', fontWeight: 'bold' }}
              >
                {post.autor}
              </a>
              {post.created_at && (
                <div style={{ fontSize: 12, color: '#888' }}>
                  {new Date(post.created_at).toLocaleString('es-MX', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>

          {post.categoria && <p style={{ fontSize: 12, color: '#888' }}>{post.categoria}</p>}
          {post.comentario && <p>{post.comentario}</p>}
          {post.imagen_url && <img src={post.imagen_url} style={{ width: '100%', borderRadius: 6 }} />}
          {post.video_url && (
            <video controls style={{ width: '100%', borderRadius: 6 }}>
              <source src={post.video_url} type="video/mp4" />
            </video>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            {['❤️', '😂', '😢', '😲'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => manejarReaccion(post, emoji)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: post.reacciones?.[invitado?.nombre] === emoji ? '#eee' : '#f8f8f8',
                  border: '1px solid #ccc',
                  borderRadius: 20,
                  cursor: 'pointer',
                }}
              >
                {emoji} {contarReacciones(post.reacciones, emoji)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 15 }}>
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={comentariosPorPost[post.id] || ''}
              onChange={(e) =>
                setComentariosPorPost({ ...comentariosPorPost, [post.id]: e.target.value })
              }
              style={{ width: '100%', padding: 8, marginBottom: 5, borderRadius: 6 }}
            />
            <button
              onClick={() => enviarComentario(post.id)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
              }}
            >
              Comentar
            </button>
          </div>
        </div>
      ))}

      <Navbar slug={slug} />
    </div>
  );
}

export default Muro;
