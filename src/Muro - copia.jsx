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
  const [diasFaltantes, setDiasFaltantes] = useState(null);
  const [fechaFormateada, setFechaFormateada] = useState('');
  const [horaFormateada, setHoraFormateada] = useState('');
  const [comentario, setComentario] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagenFile, setImagenFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [posts, setPosts] = useState([]);
  const [comentariosPorPost, setComentariosPorPost] = useState({});
  const [notificaciones, setNotificaciones] = useState({
    mensajes: false,
    eventos: false,
  });

  const imagenInputRef = useRef(null);
  const videoInputRef = useRef(null); // 👈 referencia para limpiar input de video

  useEffect(() => {
    const invitadoLocal = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitadoLocal) {
      navigate(`/${slug}/registro`);
      return;
    }
    setInvitado(invitadoLocal);

    if (invitadoLocal.boda_id) {
      setBodaId(invitadoLocal.boda_id);
    } else {
      buscarBodaPorSlug();
    }
  }, [slug]);

  const buscarBodaPorSlug = async () => {
    const { data, error } = await supabase
      .from('bodas')
      .select('id, fecha_boda')
      .eq('slug', slug)
      .single();

    if (error) return;
    setBodaId(data.id);
    guardarBodaEnLocalStorage(data.id);
    calcularDatosDeFecha(data.fecha_boda);
  };

  const guardarBodaEnLocalStorage = (id) => {
    const invitadoActual = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitadoActual) {
      localStorage.setItem(
        'yeswedo_invitado',
        JSON.stringify({ ...invitadoActual, boda_id: id })
      );
    }
  };
  useEffect(() => {
    if (bodaId) {
      cargarPosts();
      obtenerFechaBoda();
      revisarMensajesNoLeidos();
      escucharNuevosMensajes();
      escucharNuevosEventos();
      escucharEventosEspeciales();
    }
  }, [bodaId, invitado]);

  const obtenerFechaBoda = async () => {
    const { data, error } = await supabase
      .from('bodas')
      .select('fecha_boda')
      .eq('id', bodaId)
      .single();

    if (error) return;
    calcularDatosDeFecha(data.fecha_boda);
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
      day: 'numeric',
    }).format(evento);

    const hora = evento.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setFechaFormateada(fechaLarga);
    setHoraFormateada(hora);
  };

  const cargarPosts = async () => {
    const { data, error } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('boda_id', bodaId)
      .order('created_at', { ascending: false });

    if (!error) setPosts(data);
  };

  const subirArchivo = async (file, tipo = 'imagenes') => {
    if (!file) return null;
    const nombreArchivo = `post_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(tipo).upload(nombreArchivo, file);
    if (error) {
      alert(`Error al subir ${tipo === 'imagenes' ? 'imagen' : 'video'}: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(tipo).getPublicUrl(nombreArchivo);
    return data?.publicUrl || null;
  };

  const publicar = async () => {
    if (!comentario && !imagenFile && !videoFile) {
      alert('Agrega un comentario, imagen o video');
      return;
    }

    setSubiendo(true);

    const imagen_url = await subirArchivo(imagenFile, 'imagenes');
    const video_url = await subirArchivo(videoFile, 'videos');

    const nueva = {
      boda_id: bodaId,
      autor: invitado?.nombre,
      autor_foto: invitado?.foto || null,
      comentario,
      categoria,
      imagen_url,
      video_url,
      reacciones: {},
      comentarios: [],
    };

    const { error } = await supabase.from('publicaciones').insert(nueva).select();
    if (error) {
      alert('Error al publicar contenido. Intenta de nuevo.');
      setSubiendo(false);
      return;
    }

    setComentario('');
    setImagenFile(null);
    setVideoFile(null);
    setCategoria('');
    if (imagenInputRef.current) imagenInputRef.current.value = null;
    if (videoInputRef.current) videoInputRef.current.value = null;

    await cargarPosts();
    setSubiendo(false);
  };
  const manejarReaccion = async (post, tipoReaccion) => {
    const copia = { ...post.reacciones };
    const yaTiene = copia[invitado.nombre] === tipoReaccion;

    if (yaTiene) {
      delete copia[invitado.nombre];
    } else {
      copia[invitado.nombre] = tipoReaccion;
    }

    await supabase
      .from('publicaciones')
      .update({ reacciones: copia })
      .eq('id', post.id);

    cargarPosts();
  };

  const contarReacciones = (reacciones, tipo) =>
    Object.values(reacciones || {}).filter((r) => r === tipo).length;

  const enviarComentario = async (postId) => {
    const texto = comentariosPorPost[postId];
    if (!texto) return;

    const post = posts.find((p) => p.id === postId);
    const nuevosComentarios = [
      ...(post.comentarios || []),
      {
        autor: invitado.nombre,
        foto: invitado.foto || null,
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

  const revisarMensajesNoLeidos = async () => {
    const { data, error } = await supabase
      .from('mensajes_privados')
      .select('*')
      .eq('boda_id', bodaId)
      .eq('destinatario', invitado.nombre);

    if (!error && data.length > 0) {
      setNotificaciones((prev) => ({ ...prev, mensajes: true }));
    }
  };

  const escucharNuevosMensajes = () => {
    if (!invitado || !bodaId) return;

    const canal = supabase
      .channel('canal-mensajes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_privados',
          filter: `destinatario=eq.${invitado.nombre}`,
        },
        () => setNotificaciones((prev) => ({ ...prev, mensajes: true }))
      )
      .subscribe();

    return () => supabase.removeChannel(canal);
  };

  const escucharNuevosEventos = () => {
    if (!bodaId) return;

    const canal = supabase
      .channel('canal-eventos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'eventos',
          filter: `boda_id=eq.${bodaId}`,
        },
        () => setNotificaciones((prev) => ({ ...prev, eventos: true }))
      )
      .subscribe();

    return () => supabase.removeChannel(canal);
  };

  const escucharEventosEspeciales = () => {
    if (!bodaId) return;

    const canal = supabase
      .channel('canal-eventos-especiales')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'eventos_especiales',
          filter: `boda_id=eq.${bodaId}`,
        },
        () => setNotificaciones((prev) => ({ ...prev, eventos: true }))
      )
      .subscribe();

    return () => supabase.removeChannel(canal);
  };
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif', paddingBottom: 90 }}>
      {/* Íconos flotantes */}
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
            position: 'relative',
            width: 40,
            height: 40,
            backgroundColor: '#2ecc71',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Mensajes privados"
        >
          <span style={{ fontSize: 20, color: 'white' }}>💬</span>
          {notificaciones.mensajes && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: 'red',
                width: 14,
                height: 14,
                borderRadius: '50%',
                fontSize: 10,
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              !
            </div>
          )}
        </div>

        <div
          onClick={() => slug && navigate(`/${slug}/notificaciones`)}
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            backgroundColor: '#3498db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Notificaciones"
        >
          <span style={{ fontSize: 20, color: 'white' }}>🔔</span>
          {notificaciones.eventos && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: 'red',
                width: 14,
                height: 14,
                borderRadius: '50%',
                fontSize: 10,
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              !
            </div>
          )}
        </div>

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
      <hr style={{ margin: '2rem 0' }} />

      {posts.map((post) => (
        <div key={post.id} style={{ marginBottom: 30, borderBottom: '1px solid #ddd', paddingBottom: 20 }}>
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
                href={`/${slug}/invitado/${encodeURIComponent(post.autor.toLowerCase().replace(/\s+/g, '-'))}`}
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
          {post.imagen_url && (
            <img src={post.imagen_url} alt="post" style={{ maxWidth: '100%', borderRadius: 6, marginTop: 10 }} />
          )}
          {post.video_url && (
            <video controls style={{ maxWidth: '100%', borderRadius: 6, marginTop: 10 }}>
              <source src={post.video_url} type="video/mp4" />
              Tu navegador no soporta video HTML5.
            </video>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            {['❤️', '😂', '😢', '😲'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => manejarReaccion(post, emoji)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: post.reacciones?.[invitado.nombre] === emoji ? '#eee' : '#f8f8f8',
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

            {post.comentarios?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {post.comentarios.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                    {c.foto && (
                      <img
                        src={c.foto}
                        alt={c.autor}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          marginRight: 10,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div>
                      <a
                        href={`/${slug}/invitado/${encodeURIComponent(c.autor.toLowerCase().replace(/\s+/g, '-'))}`}
                        style={{ textDecoration: 'none', color: '#2980b9', fontWeight: 'bold' }}
                      >
                        {c.autor}
                      </a>
                      {c.fecha && (
                        <div style={{ fontSize: 11, color: '#999' }}>
                          {new Date(c.fecha).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: 13 }}>{c.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <Navbar slug={slug} />
    </div>
  );
}

export default Muro;
