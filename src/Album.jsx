import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';

const categorias = ['Ceremonia', 'Fiesta', 'Backstage', 'Otro'];

function Album() {
  const { bodaId, loading } = useBoda();
  const [fotos, setFotos] = useState([]);
  const [comentario, setComentario] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [nombreInvitado, setNombreInvitado] = useState('');

  useEffect(() => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitado) setNombreInvitado(invitado.nombre || 'Invitado');
  }, []);

  useEffect(() => {
    if (!bodaId || !nombreInvitado) return;
    cargarFotos();
  }, [bodaId, nombreInvitado]);

  const cargarFotos = async () => {
    const { data, error } = await supabase
      .from('album_personal')
      .select('*')
      .eq('boda_id', bodaId)
      .eq('nombre_invitado', nombreInvitado)
      .order('fecha', { ascending: false });

    if (error) console.error('Error al cargar fotos:', error.message);
    else setFotos(data);
  };

  const subirImagen = async () => {
    if (!imagenFile) return null;
    const nombreArchivo = `album_${Date.now()}_${imagenFile.name}`;
    const { error } = await supabase.storage
      .from('imagenes')
      .upload(nombreArchivo, imagenFile);

    if (error) {
      alert('Error al subir la imagen');
      console.error(error.message);
      return null;
    }

    const { data: publicUrl } = supabase
      .storage
      .from('imagenes')
      .getPublicUrl(nombreArchivo);

    return publicUrl.publicUrl;
  };

  const handleSubir = async () => {
    if (!imagenFile) {
      alert('Selecciona una imagen');
      return;
    }

    const url = await subirImagen();
    if (!url) return;

    const nueva = {
      boda_id: bodaId,
      nombre_invitado: nombreInvitado,
      comentario,
      categoria,
      imagen_url: url,
    };

    const { error } = await supabase.from('album_personal').insert(nueva);
    if (error) {
      alert('Error al guardar la foto');
      console.error(error.message);
    } else {
      setComentario('');
      setCategoria(categorias[0]);
      setImagenFile(null);
      setImagenPreview(null);
      document.getElementById('inputImagenAlbum').value = '';
      cargarFotos();
    }
  };

  return (
    <div style={styles.container}>
      <h2>Mi Álbum Personal</h2>
      <p>Guarda tus recuerdos favoritos 📸</p>

      <textarea
        placeholder="Escribe un comentario..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        style={styles.textarea}
      />

      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        style={styles.select}
      >
        {categorias.map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setImagenFile(e.target.files[0]);
          setImagenPreview(URL.createObjectURL(e.target.files[0]));
        }}
        id="inputImagenAlbum"
        style={styles.inputFile}
      />

      {imagenPreview && (
        <img src={imagenPreview} alt="preview" style={styles.preview} />
      )}

      <button onClick={handleSubir} style={styles.boton}>Subir al álbum</button>

      <div style={styles.grid}>
        {fotos.map((foto, i) => (
          <div key={i} style={styles.card}>
            <img src={foto.imagen_url} alt={`foto-${i}`} style={styles.img} />
            <p style={styles.meta}><strong>{foto.categoria}</strong></p>
            <p style={styles.coment}>{foto.comentario}</p>
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
  textarea: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto 1rem',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '8px',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  inputFile: {
    marginBottom: '1rem',
  },
  preview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  boton: {
    backgroundColor: '#2980b9',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '15px',
  },
  card: {
    backgroundColor: '#fafafa',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
  },
  img: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  meta: {
    fontSize: '0.9rem',
    color: '#555',
    marginTop: '0.5rem',
  },
  coment: {
    fontSize: '0.85rem',
    color: '#333',
    marginTop: '0.3rem',
    fontStyle: 'italic',
  },
};

export default Album;
