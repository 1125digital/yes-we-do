import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useBoda } from './hooks/useBoda';
import { useNavigate, useParams } from 'react-router-dom';

function Register() {
  const { bodaId, loading } = useBoda();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState('');
  const [otraRelacion, setOtraRelacion] = useState('');
  const [historia, setHistoria] = useState('');
  const [redes, setRedes] = useState('');
  const [email, setEmail] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const generarClaveUnica = async () => {
    let clave, existe = true;
    while (existe) {
      clave = Math.floor(100000 + Math.random() * 900000).toString();
      const { data } = await supabase
        .from('invitados')
        .select('id')
        .eq('boda_id', bodaId)
        .eq('clave_unica', clave);
      existe = data && data.length > 0;
    }
    return clave;
  };

  const enviarCorreo = async (email, nombre, clave) => {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer re_Mjrzvpth_9mcS6VHPj2HVS8oFJFawXXZ3`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'eventos@yeswe.app',
        to: email,
        subject: `Tu acceso a la boda ${slug}`,
        html: `
          <p>Hola ${nombre},</p>
          <p>Gracias por registrarte en la boda.</p>
          <p>Tu clave personal es: <strong>${clave}</strong></p>
          <p>Si cierras esta ventana, puedes volver a entrar usando tu nombre y esta clave.</p>
        `,
      }),
    });
  };

  const handleRegistro = async () => {
    if (!nombre || !relacion || !email) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const relacionFinal = relacion === 'Otro' ? otraRelacion : relacion;
    setGuardando(true);

    let urlFoto = null;

    if (fotoFile) {
      if (!fotoFile.type.startsWith('image/')) {
        alert('El archivo seleccionado no es una imagen válida.');
        setGuardando(false);
        return;
      }

      if (fotoFile.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB.');
        setGuardando(false);
        return;
      }

      const filename = `foto_${bodaId}_${Date.now()}_${fotoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(filename, fotoFile);

      if (uploadError) {
        alert('No se pudo subir la imagen.');
        console.error(uploadError);
        setGuardando(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filename);
      urlFoto = publicData?.publicUrl || null;
    }

    const datos = {
      nombre,
      parentezco: relacionFinal,
      historia: historia || null,
      redes: redes || null,
      email,
      registrado: true,
      confirmado: true,
      foto: urlFoto,
    };

    const { data: existentes } = await supabase
      .from('invitados')
      .select('*')
      .eq('boda_id', bodaId)
      .eq('email', email);

    if (existentes?.length > 0) {
      await supabase
        .from('invitados')
        .update(datos)
        .eq('id', existentes[0].id);

      alert('Ya estabas registrado. Te llevamos directo al muro 🎉');

      localStorage.setItem(
        'yeswedo_invitado',
        JSON.stringify({
          ...existentes[0],
          ...datos,
          boda_id: bodaId,
          foto: urlFoto || existentes[0].foto || null,
        })
      );
    } else {
      const clave = await generarClaveUnica();
      const { data: insertado } = await supabase
        .from('invitados')
        .insert({ ...datos, boda_id: bodaId, clave_unica: clave })
        .select()
        .single();

      await enviarCorreo(email, nombre, clave);

      localStorage.setItem(
        'yeswedo_invitado',
        JSON.stringify({
          ...insertado,
          boda_id: bodaId,
        })
      );
    }

    setGuardando(false);
    navigate(`/${slug}`);
  };

  if (loading) return <p>Cargando información de la boda...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2>Registro de Invitado</h2>
      <input type="text" placeholder="Tu nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
      <select value={relacion} onChange={(e) => setRelacion(e.target.value)} style={inputStyle}>
        <option value="">Selecciona tu relación con los novios</option>
        <option value="Amigo de la novia">Amigo de la novia</option>
        <option value="Amigo del novio">Amigo del novio</option>
        <option value="Familiar de la novia">Familiar de la novia</option>
        <option value="Familiar del novio">Familiar del novio</option>
        <option value="Otro">Otro</option>
      </select>
      {relacion === 'Otro' && (
        <input type="text" placeholder="¿Cuál es tu relación?" value={otraRelacion} onChange={(e) => setOtraRelacion(e.target.value)} style={inputStyle} />
      )}
      <textarea placeholder="Cuéntanos tu historia con los novios" value={historia} onChange={(e) => setHistoria(e.target.value)} style={inputStyle} />
      <input type="text" placeholder="Tus redes sociales (opcional)" value={redes} onChange={(e) => setRedes(e.target.value)} style={inputStyle} />
      <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sube tu foto de perfil</label>
      <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} style={inputStyle} />
      <button onClick={handleRegistro} disabled={guardando} style={buttonStyle}>
        {guardando ? 'Guardando...' : 'Registrarme'}
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#2980b9',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

export default Register;