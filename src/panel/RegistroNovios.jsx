// src/panel/RegistroNovios.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function RegistroNovios({ bodaId }) {
  const [form, setForm] = useState({
    nombre: '',
    parentezco: 'novio',
    email: '',
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [registrado, setRegistrado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const subirFoto = async () => {
    if (!fotoFile) return null;
    const nombreArchivo = `novio_${Date.now()}_${fotoFile.name}`;
    const { error } = await supabase.storage.from('imagenes').upload(nombreArchivo, fotoFile);
    if (error) {
      alert('Error al subir la foto');
      console.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from('imagenes').getPublicUrl(nombreArchivo);
    return data.publicUrl;
  };

  const registrarNovio = async () => {
    if (!form.nombre) {
      alert('Nombre obligatorio');
      return;
    }

    const foto = await subirFoto();

    const nuevo = {
      ...form,
      boda_id: bodaId,
      foto,
      registrado: true,
      confirmado: true,
      es_novio: true,
    };

    const { error } = await supabase.from('invitados').insert(nuevo);

    if (error) {
      alert('Error al registrar');
      console.error(error.message);
    } else {
      // ✅ Guardar ambos localStorage
      localStorage.setItem('yeswedo_invitado', JSON.stringify({
        nombre: nuevo.nombre,
        boda_id: bodaId,
        foto,
        es_novio: true,
        parentezco: nuevo.parentezco
      }));

      localStorage.setItem('yeswedo_novios', JSON.stringify({
        nombre: nuevo.nombre,
        boda_id: bodaId
      }));

      alert('¡Registro completado y sesión iniciada!');
      setRegistrado(true);
    }
  };

  if (registrado) {
    return <p style={{ color: 'green' }}>✅ Ya estás registrado como uno de los novios.</p>;
  }

  return (
    <div style={styles.container}>
      <h3>Registro de Novios 💍</h3>
      <input
        type="text"
        name="nombre"
        placeholder="Tu nombre"
        value={form.nombre}
        onChange={handleChange}
        style={styles.input}
      />
      <select
        name="parentezco"
        value={form.parentezco}
        onChange={handleChange}
        style={styles.input}
      >
        <option value="novio">Novio</option>
        <option value="novia">Novia</option>
        <option value="pareja">Pareja</option>
      </select>
      <input
        type="email"
        name="email"
        placeholder="Correo (opcional)"
        value={form.email}
        onChange={handleChange}
        style={styles.input}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFotoFile(e.target.files[0])}
        style={styles.input}
      />
      <button onClick={registrarNovio} style={styles.boton}>Registrar y activar perfil</button>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '2rem',
    padding: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    maxWidth: '400px',
    backgroundColor: '#f9f9f9',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  boton: {
    backgroundColor: '#8e44ad',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default RegistroNovios;
