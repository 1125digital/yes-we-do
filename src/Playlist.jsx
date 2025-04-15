import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

const categorias = ['Boda', 'Fiesta', 'Sentimental', 'Cursi', 'Otro'];

function Playlist() {
  const { bodaId, loading } = useBoda();
  const [canciones, setCanciones] = useState([]);
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [cancion, setCancion] = useState('');
  const [artista, setArtista] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const [fuente, setFuente] = useState('YouTube');
  const [link, setLink] = useState('');

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitado) setNombreInvitado(invitado.nombre || 'Invitado');
  }, []);

  useEffect(() => {
    if (!bodaId) return;
    cargarCanciones();
  }, [bodaId]);

  const cargarCanciones = async () => {
    const { data, error } = await supabase
      .from('playlist')
      .select('*')
      .eq('boda_id', bodaId)
      .order('likes', { ascending: false });

    if (error) console.error('Error al cargar playlist:', error.message);
    else setCanciones(data);
  };

  const agregarCancion = async () => {
    if (!cancion || !artista || !link) {
      alert('Completa todos los campos requeridos');
      return;
    }

    const nueva = {
      boda_id: bodaId,
      autor: nombreInvitado,
      cancion,
      artista,
      categoria,
      fuente,
      link,
      likes: 0,
    };

    const { error } = await supabase.from('playlist').insert(nueva);
    if (error) {
      alert('Error al guardar canción');
      console.error(error.message);
    } else {
      setCancion('');
      setArtista('');
      setCategoria(categorias[0]);
      setFuente('YouTube');
      setLink('');
      cargarCanciones();
    }
  };

  const darLike = async (id, likesActuales) => {
    const { error } = await supabase
      .from('playlist')
      .update({ likes: likesActuales + 1 })
      .eq('id', id);

    if (!error) cargarCanciones();
  };

  if (loading) return <p>Cargando...</p>;
  if (!bodaId) return <p>Boda no encontrada</p>;

  return (
    <div style={styles.container}>
      <h2>Playlist del Evento 🎵</h2>
      <p>Agrega canciones que representen tu conexión con los novios</p>

      <input
        type="text"
        placeholder="Nombre de la canción"
        value={cancion}
        onChange={(e) => setCancion(e.target.value)}
        style={styles.input}
      />

      <input
        type="text"
        placeholder="Artista"
        value={artista}
        onChange={(e) => setArtista(e.target.value)}
        style={styles.input}
      />

      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        style={styles.input}
      >
        {categorias.map((cat, i) => (
          <option key={i} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={fuente}
        onChange={(e) => setFuente(e.target.value)}
        style={styles.input}
      >
        <option value="YouTube">YouTube</option>
        <option value="Spotify">Spotify</option>
      </select>

      <input
        type="text"
        placeholder="Enlace para escuchar (YouTube o Spotify)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        style={styles.input}
      />

      <button onClick={agregarCancion} style={styles.boton}>
        Agregar Canción
      </button>

      <hr />

      <h3>Canciones Sugeridas 🎧</h3>

      <div style={styles.lista}>
        {canciones.map((c) => (
          <div key={c.id} style={styles.card}>
            <p><strong>{c.cancion}</strong> – {c.artista}</p>
            <p>🎵 {c.categoria} – por {c.autor}</p>
            <a href={c.link} target="_blank" rel="noreferrer">Escuchar</a>
            <p>❤️ {c.likes}</p>
            <button onClick={() => darLike(c.id, c.likes)} style={styles.likeBtn}>👍 Me gusta</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    fontFamily: 'sans-serif',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: '400px',
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  boton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  lista: {
    marginTop: '2rem',
  },
  card: {
    backgroundColor: '#fafafa',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 4px rgba(0,0,0,0.05)',
  },
  likeBtn: {
    backgroundColor: '#2980b9',
    color: '#fff',
    padding: '5px 15px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '5px',
  }
};

export default Playlist;
