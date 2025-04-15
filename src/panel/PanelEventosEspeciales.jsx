import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useBoda } from '../hooks/useBoda';

function PanelEventosEspeciales() {
  const { bodaId, loading } = useBoda();
  const [eventos, setEventos] = useState([]);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    direccion: '',
    dress_code: '',
    regalos_link: '',
    maps_link: '',
    fotos: [],
  });
  const [fotosNuevas, setFotosNuevas] = useState([]);

  useEffect(() => {
    if (!bodaId) return;
    cargarEventos();
  }, [bodaId]);

  const cargarEventos = async () => {
    const { data, error } = await supabase
      .from('eventos_especiales')
      .select('*')
      .eq('boda_id', bodaId)
      .order('fecha', { ascending: true });

    if (error) console.error('Error al cargar eventos:', error.message);
    else setEventos(data);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setNuevo((prev) => ({ ...prev, [name]: value }));
  };

  const subirFotos = async () => {
    const urls = [];
    for (const file of fotosNuevas) {
      const nombre = `evento_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('imagenes').upload(nombre, file);
      if (error) {
        alert('Error al subir imagen');
        console.error(error.message);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('imagenes').getPublicUrl(nombre);
      urls.push(publicUrl.publicUrl);
    }
    return urls;
  };

  const agregarEvento = async () => {
    if (!nuevo.nombre || !nuevo.fecha) {
      alert('Faltan campos obligatorios');
      return;
    }

    let fotos = [];
    if (fotosNuevas.length > 0) fotos = await subirFotos();

    const { error } = await supabase.from('eventos_especiales').insert({
      ...nuevo,
      boda_id: bodaId,
      fotos,
    });

    if (error) {
      alert('Error al guardar evento');
      console.error(error.message);
    } else {
      setNuevo({
        nombre: '',
        descripcion: '',
        fecha: '',
        direccion: '',
        dress_code: '',
        regalos_link: '',
        maps_link: '',
        fotos: [],
      });
      setFotosNuevas([]);
      cargarEventos();
    }
  };

  const eliminarEvento = async (id) => {
    const confirm = window.confirm('¿Estás seguro de eliminar este evento?');
    if (!confirm) return;

    const { error } = await supabase.from('eventos_especiales').delete().eq('id', id);
    if (!error) cargarEventos();
  };

  if (loading) return <p>Cargando eventos...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Eventos Especiales ✨</h2>

      <div style={styles.form}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del evento (ej. Boda civil)"
          value={nuevo.nombre}
          onChange={handleInput}
          style={styles.input}
        />

        <textarea
          name="descripcion"
          placeholder="Descripción (opcional)"
          value={nuevo.descripcion}
          onChange={handleInput}
          style={styles.textarea}
        />

        <input
          type="datetime-local"
          name="fecha"
          value={nuevo.fecha}
          onChange={handleInput}
          style={styles.input}
        />

        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={nuevo.direccion}
          onChange={handleInput}
          style={styles.input}
        />

        <input
          type="text"
          name="maps_link"
          placeholder="Link de Google Maps"
          value={nuevo.maps_link}
          onChange={handleInput}
          style={styles.input}
        />

        <input
          type="text"
          name="dress_code"
          placeholder="Dress code (opcional)"
          value={nuevo.dress_code}
          onChange={handleInput}
          style={styles.input}
        />

        <input
          type="text"
          name="regalos_link"
          placeholder="Link a mesa de regalos"
          value={nuevo.regalos_link}
          onChange={handleInput}
          style={styles.input}
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFotosNuevas([...e.target.files])}
          style={styles.input}
        />

        <button onClick={agregarEvento} style={styles.boton}>Agregar Evento</button>
      </div>

      <hr />

      <div>
        <h3>Eventos registrados:</h3>
        {eventos.map((e) => (
          <div key={e.id} style={styles.card}>
            <p><strong>{e.nombre}</strong> – {new Date(e.fecha).toLocaleString()}</p>
            <p>{e.descripcion}</p>
            {e.direccion && <p>📍 {e.direccion}</p>}
            {e.maps_link && (
              <p>🗺️ <a href={e.maps_link} target="_blank" rel="noreferrer">Ver en Google Maps</a></p>
            )}
            {e.dress_code && <p>👗 Dress code: {e.dress_code}</p>}
            {e.regalos_link && <p>🎁 <a href={e.regalos_link} target="_blank">Ver mesa de regalos</a></p>}
            {e.fotos?.length > 0 && (
              <div style={styles.grid}>
                {e.fotos.map((url, i) => (
                  <img key={i} src={url} alt={`foto-${i}`} style={styles.img} />
                ))}
              </div>
            )}
            <button onClick={() => eliminarEvento(e.id)} style={styles.botonEliminar}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: '700px',
    margin: '0 auto',
  },
  form: {
    marginBottom: '2rem',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    minHeight: '80px',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  boton: {
    backgroundColor: '#8e44ad',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  botonEliminar: {
    marginTop: '10px',
    backgroundColor: '#c0392b',
    color: '#fff',
    padding: '5px 15px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#f7f7f7',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  img: {
    width: '100px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
};

export default PanelEventosEspeciales;
