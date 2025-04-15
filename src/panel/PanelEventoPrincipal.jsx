import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useBoda } from '../hooks/useBoda';

function PanelEventoPrincipal() {
  const { bodaId, loading } = useBoda();
  const [form, setForm] = useState({
    nombre_venue: '',
    direccion: '',
    fecha_boda: '',
    maps_link: '',
    fotos_venue: [],
  });
  const [fotosNuevas, setFotosNuevas] = useState([]);

  useEffect(() => {
    if (!bodaId) return;
    cargarDatos();
  }, [bodaId]);

  const cargarDatos = async () => {
    const { data, error } = await supabase
      .from('bodas')
      .select('nombre_venue, direccion, fecha_boda, maps_link, fotos_venue')
      .eq('id', bodaId)
      .single();

    if (data) {
      setForm({
        nombre_venue: data.nombre_venue || '',
        direccion: data.direccion || '',
        fecha_boda: data.fecha_boda || '',
        maps_link: data.maps_link || '',
        fotos_venue: data.fotos_venue || [],
      });
    }

    if (error) {
      console.error('Error al cargar datos de la boda:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const subirFotos = async () => {
    const urls = [];

    for (const file of fotosNuevas) {
      const nombre = `venue_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('imagenes').upload(nombre, file);

      if (error) {
        alert('Error al subir foto');
        console.error(error.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(nombre);
      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const guardarCambios = async () => {
    let nuevasFotos = form.fotos_venue;

    if (fotosNuevas.length > 0) {
      const urls = await subirFotos();
      nuevasFotos = [...form.fotos_venue, ...urls];
    }

    const { error } = await supabase
      .from('bodas')
      .update({
        nombre_venue: form.nombre_venue,
        direccion: form.direccion,
        fecha_boda: form.fecha_boda,
        maps_link: form.maps_link,
        fotos_venue: nuevasFotos,
      })
      .eq('id', bodaId);

    if (error) {
      alert('Error al guardar');
      console.error(error.message);
    } else {
      alert('Cambios guardados ✅');
      setFotosNuevas([]);
      cargarDatos();
    }
  };

  if (loading) return <p>Cargando boda...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Editar Evento Principal 💒</h2>

      <input
        type="text"
        name="nombre_venue"
        placeholder="Nombre del lugar"
        value={form.nombre_venue}
        onChange={handleInputChange}
        style={styles.input}
      />

      <input
        type="text"
        name="direccion"
        placeholder="Dirección exacta"
        value={form.direccion}
        onChange={handleInputChange}
        style={styles.input}
      />

      <input
        type="datetime-local"
        name="fecha_boda"
        value={form.fecha_boda?.slice(0, 16) || ''}
        onChange={handleInputChange}
        style={styles.input}
      />

      <input
        type="text"
        name="maps_link"
        placeholder="Link de Google Maps"
        value={form.maps_link}
        onChange={handleInputChange}
        style={styles.input}
      />

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFotosNuevas([...e.target.files])}
        style={styles.input}
      />

      <button onClick={guardarCambios} style={styles.boton}>
        Guardar Cambios
      </button>

      {form.fotos_venue.length > 0 && (
        <div style={styles.fotos}>
          <h3>Fotos actuales del venue:</h3>
          <div style={styles.grid}>
            {form.fotos_venue.map((url, i) => (
              <img key={i} src={url} alt={`venue-${i}`} style={styles.img} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  boton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  fotos: {
    marginTop: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginTop: '1rem',
  },
  img: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
};

export default PanelEventoPrincipal;
