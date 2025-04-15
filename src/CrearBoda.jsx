import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function CrearBoda() {
  const [form, setForm] = useState({
    slug: '',
    nombre_novios: '',
    fecha_boda: '',
    direccion: '',
    clave_acceso: '',
  });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const crearBoda = async () => {
    if (!form.slug || !form.nombre_novios || !form.fecha_boda || !form.direccion) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setCargando(true);

    const { data: existente } = await supabase
      .from('bodas')
      .select('id')
      .eq('slug', form.slug)
      .single();

    if (existente) {
      alert('Ya existe una boda con ese nombre de URL');
      setCargando(false);
      return;
    }

    const { error } = await supabase.from('bodas').insert([form]);

    if (error) {
      alert('Error al crear la boda');
      console.error(error.message);
    } else {
      alert('¡Boda creada exitosamente!');
      navigate(`/${form.slug}/panel`);
    }

    setCargando(false);
  };

  return (
    <div style={styles.container}>
      <h2>Crear nueva boda 💍</h2>

      <input
        type="text"
        name="slug"
        placeholder="Nombre para URL (ej: alejuan)"
        value={form.slug}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="text"
        name="nombre_novios"
        placeholder="Nombres de los novios"
        value={form.nombre_novios}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="datetime-local"
        name="fecha_boda"
        value={form.fecha_boda}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="text"
        name="direccion"
        placeholder="Dirección del evento"
        value={form.direccion}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        type="password"
        name="clave_acceso"
        placeholder="Clave de administración (opcional)"
        value={form.clave_acceso}
        onChange={handleChange}
        style={styles.input}
      />

      <button onClick={crearBoda} disabled={cargando} style={styles.boton}>
        {cargando ? 'Creando...' : 'Crear Boda'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
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
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
};

export default CrearBoda;
